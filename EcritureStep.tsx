import React, { useState, useEffect } from 'react';
import { ProjectDetails, Chapter, TraceabilityItem } from '../types';
import { Feather, Loader2, Sparkles, BookOpen, ChevronRight, Save, Copy, FileText, Check, Plus, AlertCircle, HelpCircle, BadgeAlert } from 'lucide-react';

interface EcritureStepProps {
  project: ProjectDetails;
  onUpdateProject: (updatedFields: Partial<ProjectDetails>) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export default function EcritureStep({ project, onUpdateProject, isLoading, setIsLoading }: EcritureStepProps) {
  const [activeChapterId, setActiveChapterId] = useState<number>(1);
  const [editorContent, setEditorContent] = useState<string>('');
  const [userInstruction, setUserInstruction] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('Enregistré localement');

  // Step 4: Cultural Enrichment States
  const [enrichCategory, setEnrichCategory] = useState<'language' | 'symbol' | 'proverb'>('language');
  const [enrichInstruction, setEnrichInstruction] = useState<string>('');
  const [isEnriching, setIsEnriching] = useState<boolean>(false);
  const [enrichResult, setEnrichResult] = useState<{
    enrichedText: string;
    traceabilityItem: TraceabilityItem;
  } | null>(null);

  // Gemini suggested draft details
  const [suggestedDraft, setSuggestedDraft] = useState<string>('');
  const [suggestedStylisticChoices, setSuggestedStylisticChoices] = useState<string[]>([]);
  const [suggestedIntegrations, setSuggestedIntegrations] = useState<TraceabilityItem[]>([]);
  const [suggestedQuestion, setSuggestedQuestion] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const activeChapter = project.chapters.find((c) => c.id === activeChapterId) || project.chapters[0];

  // Load written chapter content when active chapter changes
  useEffect(() => {
    if (activeChapter) {
      setEditorContent(project.writtenChapters[activeChapter.id] || '');
      setSuggestedDraft('');
      setSuggestedStylisticChoices([]);
      setSuggestedIntegrations([]);
      setSuggestedQuestion('');
      setEnrichResult(null);
      setError(null);
    }
  }, [activeChapterId]);

  // Save changes locally in state and notify parent (which saves to localStorage)
  const handleSave = (content: string) => {
    setEditorContent(content);
    const updatedWritten = {
      ...project.writtenChapters,
      [activeChapter.id]: content
    };
    onUpdateProject({ writtenChapters: updatedWritten });
    setSaveStatus('Modifications enregistrées');
    setTimeout(() => setSaveStatus('Enregistré localement'), 2000);
  };

  const handleRequestDraft = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/project/chapter-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          chapterId: activeChapter.id,
          userInstruction
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Une erreur s'est produite lors de la génération du jet.");
      }

      const data = await response.json();
      setSuggestedDraft(data.chapterContent);
      setSuggestedStylisticChoices(data.stylisticChoices || []);
      
      // Map suggested cultural integrations to have unique IDs
      const integrationsWithId = (data.culturalIntegrations || []).map((item: any, idx: number) => ({
        ...item,
        id: `suggested-${activeChapter.id}-${idx}-${Date.now()}`,
        chapterId: activeChapter.id
      }));
      setSuggestedIntegrations(integrationsWithId);
      setSuggestedQuestion(data.reflexiveQuestion || '');
    } catch (err: any) {
      setError(err.message || "Impossible de connecter Plume.");
    } finally {
      setIsLoading(false);
    }
  };

  const applySuggestedDraft = () => {
    if (!suggestedDraft) return;
    handleSave(suggestedDraft);
    
    // Automatically add suggested cultural integrations to project journal
    if (suggestedIntegrations.length > 0) {
      // Avoid duplicate entries
      const filteredNewItems = suggestedIntegrations.filter(
        (newItem) => !project.journal.some((j) => j.element === newItem.element)
      );
      if (filteredNewItems.length > 0) {
        onUpdateProject({
          journal: [...project.journal, ...filteredNewItems]
        });
      }
    }
    
    setSuggestedDraft('');
  };

  // Step 4 Enrichment Request
  const handleEnrichSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrichInstruction.trim()) return;

    setIsEnriching(true);
    setError(null);

    // If there is selected text, enrich that, otherwise enrich the active paragraph or whole text
    const textToEnrich = editorContent || activeChapter.focus;

    try {
      const response = await fetch('/api/project/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToEnrich,
          category: enrichCategory,
          instruction: enrichInstruction,
          culturalAnchor: project.culturalAnchor
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erreur lors de l'enrichissement culturel.");
      }

      const data = await response.json();
      setEnrichResult({
        enrichedText: data.enrichedText,
        traceabilityItem: {
          ...data.traceabilityItem,
          id: `enrich-${activeChapter.id}-${Date.now()}`,
          chapterId: activeChapter.id
        }
      });
    } catch (err: any) {
      setError(err.message || "Erreur d'enrichissement.");
    } finally {
      setIsEnriching(false);
    }
  };

  const applyEnrichment = () => {
    if (!enrichResult) return;
    handleSave(enrichResult.enrichedText);

    // Add new source item to traceability journal
    onUpdateProject({
      journal: [...project.journal, enrichResult.traceabilityItem]
    });

    setEnrichResult(null);
    setEnrichInstruction('');
  };

  const proceedToExport = () => {
    // Navigate to step 5 (Mise en forme & Export)
    onUpdateProject({ currentStep: 5 });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto" id="ecriture-step-3">
      {/* Sidebar: Chapters Navigation */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-xs font-mono text-stone-500 uppercase tracking-wider mb-3 px-2">Index des Chapitres</h3>
          <div className="space-y-1">
            {project.chapters.map((ch) => {
              const isWritten = !!project.writtenChapters[ch.id];
              const isActive = activeChapterId === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapterId(ch.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-sans flex items-center justify-between transition cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 text-white font-bold'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-5 h-5 rounded-full font-mono text-[10px] flex items-center justify-center border shrink-0 ${
                      isActive ? 'bg-clay text-white border-clay' : 'bg-stone-50 border-stone-200 text-stone-500'
                    }`}>
                      {ch.id}
                    </span>
                    <span className="truncate">{ch.title}</span>
                  </div>
                  {isWritten && (
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-clay' : 'bg-emerald-500'}`} title="Chapitre rédigé" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chapter Context Widget */}
        {activeChapter && (
          <div className="bg-sand border border-stone-200 rounded-xl p-5 space-y-3">
            <span className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider">Ligne directrice du Chapitre {activeChapter.id}</span>
            <p className="font-serif text-xs text-stone-800 italic leading-relaxed">"{activeChapter.focus}"</p>
            {activeChapter.keyEvents && activeChapter.keyEvents.length > 0 && (
              <div className="pt-2 border-t border-stone-100">
                <span className="block text-[9px] font-mono text-stone-400 uppercase mb-1.5">Événements à couvrir</span>
                <ul className="space-y-1 text-xs text-stone-600 font-sans">
                  {activeChapter.keyEvents.map((evt, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-clay font-bold">•</span>
                      <span>{evt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Workspace (Editor + suggestions) */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[550px]">
          {/* Editor Header */}
          <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-stone-500 uppercase">Éditeur Principal</span>
              <h2 className="font-serif text-lg text-stone-900 font-bold leading-tight">Chapitre {activeChapter.id} : {activeChapter.title}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                <Save className="w-3.5 h-3.5 text-stone-400" /> {saveStatus}
              </span>
            </div>
          </div>

          {/* Core Text Editor Area */}
          <textarea
            value={editorContent}
            onChange={(e) => handleSave(e.target.value)}
            placeholder={`Votre plume attend votre geste... Écrivez ici le chapitre ${activeChapter.id} ou demandez une proposition d'accompagnement à Plume ci-dessous.`}
            className="flex-1 w-full p-6 text-sm font-serif leading-relaxed text-stone-900 placeholder-stone-300 focus:outline-none resize-none min-h-[350px] bg-[#FCFBF9]"
          />

          {/* Quick Draft Assistant Panel */}
          <div className="bg-stone-50 p-5 border-t border-stone-200 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-clay" />
              <h4 className="font-serif text-sm text-stone-900 font-bold">Demander l'accompagnement créatif de Plume</h4>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Plume rédigera un premier jet poétique fondé sur l'arc dramatique de ce chapitre, tout en intégrant des expressions et motifs traditionnels documentés.
            </p>
            <div className="space-y-2.5">
              <input
                type="text"
                value={userInstruction}
                onChange={(e) => setUserInstruction(e.target.value)}
                placeholder="Consigne particulière (Ex: 'Insère une dispute sous le baobab', 'Insiste sur le silence de la nuit')"
                className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-clay"
              />
              <button
                onClick={handleRequestDraft}
                disabled={isLoading}
                className="w-full bg-stone-950 hover:bg-stone-800 disabled:bg-stone-300 text-white text-xs font-mono font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Rédaction créative en cours...
                  </>
                ) : (
                  <>
                    <Feather className="w-3.5 h-3.5" /> Proposer un premier jet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Suggested Draft Panel */}
        {suggestedDraft && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="font-serif text-base text-amber-900 font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-clay" /> Proposition de premier jet par Plume
              </h3>
              <button
                onClick={applySuggestedDraft}
                className="bg-clay text-white hover:bg-clay/90 transition text-xs font-serif font-bold py-1.5 px-3 rounded-md flex items-center gap-1 shadow cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Insérer dans mon éditeur
              </button>
            </div>

            <div className="font-serif text-sm leading-relaxed text-stone-800 bg-white p-4 rounded-lg border border-stone-100 shadow-inner whitespace-pre-wrap">
              {suggestedDraft}
            </div>

            {/* Stylistic Choices & Reflexive Question */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-4">
              {suggestedStylisticChoices.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-stone-200">
                  <span className="block font-mono text-[10px] text-stone-500 uppercase tracking-wider mb-2 font-bold">Choix stylistiques effectués</span>
                  <ul className="space-y-1.5 text-stone-600">
                    {suggestedStylisticChoices.map((c, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-clay font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {suggestedQuestion && (
                <div className="bg-stone-900 text-white p-4 rounded-lg border border-stone-800">
                  <span className="block font-mono text-[10px] text-stone-400 uppercase tracking-wider mb-2 font-bold">Question réflexive de l'IA</span>
                  <p className="font-serif italic leading-relaxed text-stone-200">{suggestedQuestion}</p>
                </div>
              )}
            </div>

            {/* Fiches de traçabilité pour ce jet */}
            {suggestedIntegrations.length > 0 && (
              <div className="space-y-2">
                <span className="block font-mono text-[10px] text-stone-500 uppercase tracking-wider font-bold">Fiches de traçabilité des éléments insérés</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedIntegrations.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-stone-200 text-[11px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-serif font-bold text-stone-900">{item.element}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-stone-100 text-stone-600 border border-stone-200">{item.category.toUpperCase()}</span>
                      </div>
                      <p className="text-stone-500 mb-1">{item.description}</p>
                      <div className="flex justify-between text-[10px] font-mono text-stone-400">
                        <span>Origine: {item.origin}</span>
                        <span className="text-clay font-semibold">Fiabilité: {item.level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Next Step Navigation */}
        <div className="flex items-center justify-between bg-sand border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-stone-500">
            Une fois vos chapitres rédigés et peaufinés, procédez à la mise en forme visuelle.
          </div>
          <button
            onClick={proceedToExport}
            className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-serif font-bold py-2.5 px-5 rounded-lg transition flex items-center gap-1 cursor-pointer"
          >
            Passer à la mise en forme visuelle <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Column: Cultural Enrichment Panel (Step 4 Dedicated) */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-serif text-lg text-stone-900 flex items-center gap-1.5 border-b border-stone-100 pb-2">
            <BookOpen className="text-clay w-4.5 h-4.5" /> Personnalisation culturelle
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Sélectionnez une catégorie et formulez une intention d'enrichissement (proverbes authentiques, symboles sacrés, salutations et expressions rituelles d'une langue de votre choix).
          </p>

          <form onSubmit={handleEnrichSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1.5 font-bold">Catégorie</label>
              <div className="grid grid-cols-3 gap-1">
                {(['language', 'symbol', 'proverb'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setEnrichCategory(cat)}
                    className={`py-1.5 px-2 text-[10px] font-mono font-bold rounded border uppercase text-center transition cursor-pointer ${
                      enrichCategory === cat
                        ? 'bg-clay/10 text-clay border-clay'
                        : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                    }`}
                  >
                    {cat === 'language' ? 'Langue' : cat === 'symbol' ? 'Symbole' : 'Proverbe'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1.5 font-bold">Votre intention d'enrichissement</label>
              <textarea
                rows={3}
                value={enrichInstruction}
                onChange={(e) => setEnrichInstruction(e.target.value)}
                placeholder={
                  enrichCategory === 'language'
                    ? "Ex: 'Ajoute des dialogues ou salutations de bienvenue en lingala' ou 'wolof'"
                    : enrichCategory === 'symbol'
                    ? "Ex: 'Intègre un symbole Akan de réconciliation' ou 'Bogolan de bravoure'"
                    : "Ex: 'Suggère un proverbe bambara sur la patience ou le temps'"
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-clay focus:bg-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isEnriching || !enrichInstruction.trim()}
              className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-xs font-mono font-bold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Enrichissement...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Injecter un enrichissement
                </>
              )}
            </button>
          </form>

          {/* Enrichment Results Output */}
          {enrichResult && (
            <div className="bg-sand border border-stone-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-clay font-bold uppercase">Résultat de l'IA</span>
                <button
                  onClick={applyEnrichment}
                  className="bg-stone-900 text-white text-[10px] font-mono font-bold py-1 px-2.5 rounded hover:bg-stone-800 cursor-pointer"
                >
                  Appliquer
                </button>
              </div>
              <p className="text-xs font-serif italic leading-relaxed text-stone-800 whitespace-pre-wrap bg-white p-2.5 rounded border border-stone-100 shadow-sm">
                "{enrichResult.enrichedText}"
              </p>

              <div className="bg-white p-2.5 rounded border border-stone-200 text-[10px] space-y-1">
                <span className="block font-mono text-[9px] text-stone-400 font-bold uppercase">Fiche de provenance</span>
                <div className="font-serif font-bold text-stone-900">{enrichResult.traceabilityItem.element}</div>
                <p className="text-stone-500 leading-tight">{enrichResult.traceabilityItem.description}</p>
                <div className="text-stone-400 font-mono mt-1 text-[9px] flex justify-between">
                  <span>Origine: {enrichResult.traceabilityItem.origin}</span>
                  <span className="text-clay font-bold">{enrichResult.traceabilityItem.level}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Traceability Summary in Sidebar */}
        <div className="bg-stone-900 text-stone-100 rounded-xl p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h4 className="font-serif text-sm font-bold text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-clay" /> Vos Sources ({project.journal.length})
            </h4>
          </div>
          {project.journal.length === 0 ? (
            <p className="text-[11px] text-stone-400 font-mono">
              Aucun élément dans votre journal de traçabilité pour le moment.
            </p>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {project.journal.map((item) => (
                <div key={item.id} className="text-[11px] bg-stone-800 p-2 rounded border border-stone-700">
                  <div className="font-serif font-bold text-white flex justify-between">
                    <span>{item.element}</span>
                    <span className="text-[8px] font-mono text-stone-400 bg-stone-700 px-1 rounded uppercase shrink-0 ml-1">
                      {item.category === 'language' ? 'Langue' : item.category === 'proverb' ? 'Proverbe' : 'Symbole'}
                    </span>
                  </div>
                  <p className="text-stone-400 text-[10px] mt-0.5 line-clamp-1">{item.description}</p>
                  <div className="text-[9px] text-stone-500 font-mono mt-1 flex justify-between">
                    <span>{item.origin}</span>
                    <span className={item.level === 'bien documenté' ? 'text-emerald-400' : 'text-amber-400'}>
                      {item.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
