import React, { useState } from 'react';
import { ProjectDetails, Chapter, TraceabilityItem } from '../types';
import { Network, Loader2, Sparkles, BookOpen, ChevronDown, ChevronUp, AlertCircle, RefreshCw, CheckCircle2, ChevronRight } from 'lucide-react';

interface StructureStepProps {
  project: ProjectDetails;
  onStructureComplete: (updatedFields: Partial<ProjectDetails>) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export default function StructureStep({ project, onStructureComplete, isLoading, setIsLoading }: StructureStepProps) {
  const [architecture, setArchitecture] = useState<{
    selectedInspiration: string;
    sourceJustification: string;
    chapters: Chapter[];
    dialogueReflexif: string;
  } | null>(project.chapters.length > 0 ? {
    selectedInspiration: project.selectedInspiration,
    sourceJustification: project.sourceJustification,
    chapters: project.chapters,
    dialogueReflexif: project.suggestionMessage
  } : null);

  const [expandedChapter, setExpandedChapter] = useState<number | null>(1);
  const [userFeedback, setUserFeedback] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const generateStructure = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/project/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Une erreur s'est produite lors du calcul de la structure.");
      }

      const data = await response.json();
      setArchitecture(data);
    } catch (err: any) {
      setError(err.message || "Impossible d'obtenir la structure narrative de Plume.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate if not exists and not loading
  React.useEffect(() => {
    if (!architecture && !isLoading && !error) {
      generateStructure();
    }
  }, [architecture]);

  const handleValidate = () => {
    if (!architecture) return;

    // Create journal entries for the narrative structure inspiration
    const structuralJournalItem: TraceabilityItem = {
      id: `structure-inspiration-${Date.now()}`,
      element: architecture.selectedInspiration,
      category: 'structure',
      description: `Inspiration structurelle majeure : ${architecture.sourceJustification.substring(0, 150)}...`,
      origin: project.culturalAnchor || 'Afrique générale',
      sourceType: 'Courant de critique littéraire et esthétiques africaines réelles',
      reliability: 'Référence théorique et critique académique générale',
      level: 'bien documenté'
    };

    onStructureComplete({
      selectedInspiration: architecture.selectedInspiration,
      sourceJustification: architecture.sourceJustification,
      chapters: architecture.chapters,
      journal: [...project.journal, structuralJournalItem],
      currentStep: 3
    });
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFeedback.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      // Prompt the model to adjust the existing structure based on user feedback
      const prompt = `Vous êtes Plume, atelier de structure narrative.
L'auteur a reçu cette proposition d'architecture de chapitres :
Courant : ${architecture?.selectedInspiration}
Justification : ${architecture?.sourceJustification}
Plan existant : ${architecture?.chapters.map(c => `[Ch ${c.id}] ${c.title}: ${c.focus}`).join("\n")}

L'auteur formule le retour d'ajustement suivant : "${userFeedback}"

Veuillez réadapter entièrement l'architecture des chapitres pour prendre en compte ce retour précieux de l'auteur. 
Garantissez toujours la rigueur, l'ancrage littéraire africain, et répondez strictement au même format JSON.`;

      const response = await fetch('/api/project/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: {
            ...project,
            // Pass feedback integrated in idea or summary
            idea: `${project.idea}\n\n[Retour de l'auteur sur la structure] : ${userFeedback}`
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Une erreur s'est produite lors de la mise à jour de la structure.");
      }

      const data = await response.json();
      setArchitecture(data);
      setUserFeedback('');
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajustement de l'architecture.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChapter = (id: number) => {
    setExpandedChapter(expandedChapter === id ? null : id);
  };

  if (isLoading && !architecture) {
    return (
      <div className="flex flex-col items-center justify-center py-24 max-w-lg mx-auto text-center space-y-4">
        <Loader2 className="w-10 h-10 text-clay animate-spin" />
        <h3 className="font-serif text-xl text-stone-900">Échafaudage de la structure narrative...</h3>
        <p className="text-xs text-stone-500 font-mono italic">
          "Plume consulte les courants littéraires et tisse l'harmonie narrative de votre récit selon les rites de l'oraliture et du réalisme merveilleux."
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto" id="structure-step-2">
      {/* Left Column: Chapters Plan */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Network className="text-clay w-5 h-5" />
              <h2 className="font-serif text-xl text-stone-900">Architecture narrative proposée</h2>
            </div>
            {architecture && (
              <button
                onClick={generateStructure}
                disabled={isLoading}
                className="text-xs text-stone-500 hover:text-clay font-mono flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Régénérer
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm border border-red-200 rounded-lg mb-4">
              {error}
            </div>
          )}

          {architecture && (
            <div className="space-y-4">
              {architecture.chapters.map((chapter) => {
                const isExpanded = expandedChapter === chapter.id;
                return (
                  <div
                    key={chapter.id}
                    className={`border rounded-lg transition-all duration-200 ${
                      isExpanded ? 'border-clay/50 bg-sand/30' : 'border-stone-200 bg-white hover:bg-stone-50/50'
                    }`}
                  >
                    {/* Chapter Header */}
                    <button
                      onClick={() => toggleChapter(chapter.id)}
                      className="w-full text-left p-4 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center font-mono text-xs text-stone-600 font-bold border border-stone-200 shrink-0">
                          {chapter.id}
                        </span>
                        <div>
                          <h3 className="font-serif text-base text-stone-900 font-semibold">{chapter.title}</h3>
                          {!isExpanded && (
                            <p className="text-xs text-stone-500 font-sans truncate max-w-md mt-0.5">{chapter.focus}</p>
                          )}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                    </button>

                    {/* Chapter Expanded Details */}
                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-stone-100 space-y-4 text-sm text-stone-700 bg-white rounded-b-lg">
                        <div>
                          <span className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1">Fil dramatique / poétique</span>
                          <p className="font-serif text-stone-800 leading-relaxed text-sm">{chapter.focus}</p>
                        </div>

                        {/* Key Events */}
                        <div>
                          <span className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-2">Événements clés</span>
                          <ul className="space-y-1.5">
                            {chapter.keyEvents.map((evt, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                                <span>{evt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Cultural integrations proposed */}
                        {(chapter.suggestedCulturalElements.languages?.length ||
                          chapter.suggestedCulturalElements.symbols?.length ||
                          chapter.suggestedCulturalElements.proverbs?.length) && (
                          <div className="bg-sand p-3 rounded-lg border border-stone-100 space-y-2">
                            <span className="block text-[10px] font-mono text-clay uppercase tracking-wider font-semibold">
                              Pistes d'enrichissement culturel proposées par Plume :
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              {chapter.suggestedCulturalElements.languages && chapter.suggestedCulturalElements.languages.length > 0 && (
                                <div>
                                  <span className="font-mono text-[9px] text-stone-500 uppercase">Langues</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {chapter.suggestedCulturalElements.languages.map((l, i) => (
                                      <span key={i} className="bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-600 text-[11px]">{l}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {chapter.suggestedCulturalElements.symbols && chapter.suggestedCulturalElements.symbols.length > 0 && (
                                <div>
                                  <span className="font-mono text-[9px] text-stone-500 uppercase">Symboles</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {chapter.suggestedCulturalElements.symbols.map((s, i) => (
                                      <span key={i} className="bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-600 text-[11px]">{s}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {chapter.suggestedCulturalElements.proverbs && chapter.suggestedCulturalElements.proverbs.length > 0 && (
                                <div>
                                  <span className="font-mono text-[9px] text-stone-500 uppercase">Proverbes</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {chapter.suggestedCulturalElements.proverbs.map((p, i) => (
                                      <span key={i} className="bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-600 text-[11px] italic">"{p}"</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Reflexive Dialogue & Validation */}
      <div className="lg:col-span-5 space-y-6">
        {architecture && (
          <>
            <div className="bg-sand border border-stone-200 rounded-xl p-6 space-y-4 shadow-sm">
              <h3 className="font-serif text-lg text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
                <Sparkles className="text-clay w-4 h-4" /> Courant d'Inspiration retenu
              </h3>
              <div>
                <span className="inline-block bg-clay/10 text-clay font-mono text-xs px-2.5 py-1 rounded-full font-bold uppercase mb-2">
                  {architecture.selectedInspiration}
                </span>
                <p className="text-sm text-stone-700 leading-relaxed font-serif italic">
                  "{architecture.sourceJustification}"
                </p>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 shadow-sm">
              <div className="border-l-4 border-clay pl-4">
                <h4 className="text-xs font-mono text-stone-500 uppercase tracking-wider mb-1">Dialogue Réflexif avec Plume</h4>
                <p className="text-sm font-serif italic text-stone-800 leading-relaxed">
                  {architecture.dialogueReflexif}
                </p>
              </div>

              {/* Ajustement Form */}
              <form onSubmit={handleFeedbackSubmit} className="pt-2 border-t border-stone-100">
                <label className="block text-[11px] font-mono text-stone-500 uppercase mb-2">
                  Souhaitez-vous réajuster ce plan ?
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={userFeedback}
                    onChange={(e) => setUserFeedback(e.target.value)}
                    placeholder="Ex: 'Je préfère une structure circulaire d'oraliture.' ou 'Rajoute un chapitre d'exil.'"
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs font-sans focus:outline-none focus:border-clay focus:bg-white resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !userFeedback.trim()}
                  className="mt-2 w-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs py-2 px-4 rounded-lg font-mono font-medium transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Réajustement du plan...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" /> Demander une réadaptation du plan
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Validation CTA */}
            <div className="bg-stone-900 text-white rounded-xl p-6 space-y-4 shadow-sm">
              <h4 className="font-serif text-base text-stone-100 font-bold">L'architecture narrative vous convient-elle ?</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Une fois l'architecture narrative validée, vous entrerez dans l'Atelier d'écriture chapitre par chapitre. Tout élément ou choix structurel sera consigné pour vos fiches de traçabilité.
              </p>
              <button
                onClick={handleValidate}
                className="w-full bg-clay text-white hover:bg-clay/90 transition duration-150 py-3 px-4 rounded-lg font-serif text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <BookOpen className="w-4 h-4" /> Valider l'Architecture & Écrire <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
