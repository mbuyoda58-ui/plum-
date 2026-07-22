import React, { useState } from 'react';
import { ProjectDetails, ProjectGenre, ProjectStyle } from '../types';
import { Feather, Compass, Globe, Sparkles, Loader2, BookOpen, ChevronRight } from 'lucide-react';

interface CadrageStepProps {
  onCadrageComplete: (project: Partial<ProjectDetails>) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export default function CadrageStep({ onCadrageComplete, isLoading, setIsLoading }: CadrageStepProps) {
  const [genre, setGenre] = useState<ProjectGenre>('roman');
  const [style, setStyle] = useState<ProjectStyle>('merveilleux');
  const [formatChapters, setFormatChapters] = useState<number>(5);
  const [formatPages, setFormatPages] = useState<number>(80);
  const [idea, setIdea] = useState<string>('');
  const [culturalAnchor, setCulturalAnchor] = useState<string>('');
  const [historicalPeriod, setHistoricalPeriod] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Results from API
  const [cadrageResult, setCadrageResult] = useState<{
    summary: string;
    culturalAestheticAnalysis: string;
    suggestionMessage: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) {
      setError("Veuillez renseigner l'idée principale ou le pitch de votre œuvre.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/project/cadrage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre,
          style,
          formatPages,
          formatChapters,
          idea,
          culturalAnchor,
          historicalPeriod
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Une erreur s'est produite lors du cadrage.");
      }

      const data = await response.json();
      setCadrageResult(data);
    } catch (err: any) {
      setError(err.message || "Impossible de connecter le serveur de Plume.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = () => {
    if (!cadrageResult) return;
    onCadrageComplete({
      genre,
      style,
      formatPages,
      formatChapters,
      idea,
      culturalAnchor,
      historicalPeriod,
      summary: cadrageResult.summary,
      culturalAestheticAnalysis: cadrageResult.culturalAestheticAnalysis,
      suggestionMessage: cadrageResult.suggestionMessage,
      currentStep: 2
    });
  };

  const handleAdjust = () => {
    // Return to form editing
    setCadrageResult(null);
  };

  if (cadrageResult) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto" id="cadrage-results">
        <div className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-4 mb-6">
            <Compass className="text-clay w-6 h-6" />
            <h2 className="font-serif text-2xl text-stone-900">Étape 1 — Votre Fiche de Cadrage validée par l'IA</h2>
          </div>

          <div className="space-y-6 text-stone-800">
            {/* Summary */}
            <div className="bg-stone-50/50 border border-stone-100 p-6 rounded-lg">
              <h3 className="text-xs font-mono text-stone-500 uppercase tracking-wider mb-2">Reformulation Littéraire du Projet</h3>
              <p className="font-serif text-lg leading-relaxed text-stone-900 whitespace-pre-wrap">{cadrageResult.summary}</p>
            </div>

            {/* Cultural Analysis */}
            <div className="bg-sand border border-stone-200 p-6 rounded-lg">
              <h4 className="text-xs font-mono text-clay uppercase tracking-wider mb-3 flex items-center gap-1.5 font-bold">
                <Globe className="w-4 h-4" /> Analyse esthétique & ancrage culturel africain
              </h4>
              <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">{cadrageResult.culturalAestheticAnalysis}</p>
            </div>

            {/* Reflexive Prompt */}
            <div className="border-l-4 border-clay pl-5 py-2 my-6 bg-clay/5 rounded-r-lg p-4">
              <h4 className="text-xs font-mono text-stone-600 uppercase mb-2 font-semibold">Plume vous questionne</h4>
              <p className="font-serif italic text-stone-800 leading-relaxed text-base">{cadrageResult.suggestionMessage}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 border-t border-stone-100 pt-6">
            <button
              onClick={handleValidate}
              className="flex-1 bg-stone-900 text-white hover:bg-stone-800 transition duration-150 py-3 px-6 rounded-lg font-serif font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              C'est fidèle à mon intention, proposer une structure <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleAdjust}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 transition duration-150 py-3 px-6 rounded-lg font-mono text-xs cursor-pointer"
            >
              Modifier mes paramètres
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto" id="cadrage-step-1">
      {/* Left Column: Form */}
      <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-4 mb-6">
          <Feather className="text-clay w-5 h-5" />
          <h2 className="font-serif text-xl text-stone-900">Étape 1 — Définir le cadrage du projet</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Genre and Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-stone-500 uppercase tracking-wider mb-2">Genre littéraire</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as ProjectGenre)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-clay focus:bg-white"
              >
                <option value="roman">Roman</option>
                <option value="nouvelle">Nouvelle</option>
                <option value="poeme">Recueil de poèmes</option>
                <option value="conte">Conte oral transcrit</option>
                <option value="essai">Essai réflexif</option>
                <option value="theatre">Théâtre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-stone-500 uppercase tracking-wider mb-2">Style / Esthétique</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as ProjectStyle)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-clay focus:bg-white"
              >
                <option value="merveilleux">Réalisme Merveilleux (Okri, Tutuola)</option>
                <option value="oraliture">Oraliture (Contes, Veillées d'Afrique)</option>
                <option value="realisme">Réalisme social</option>
                <option value="engage">Littérature engagée (Ngũgĩ, Beti)</option>
                <option value="autofiction">Autofiction</option>
                <option value="epopee">Épopée classique / Légende historique</option>
              </select>
            </div>
          </div>

          {/* Formats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-stone-500 uppercase tracking-wider mb-2">Nombre de chapitres</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formatChapters}
                onChange={(e) => setFormatChapters(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-clay focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-stone-500 uppercase tracking-wider mb-2">Pages prévues</label>
              <input
                type="number"
                min="5"
                max="500"
                value={formatPages}
                onChange={(e) => setFormatPages(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-clay focus:bg-white"
              />
            </div>
          </div>

          {/* Geo-cultural Anchor & Historical period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-stone-500 uppercase tracking-wider mb-2">
                Ancrage géo-culturel <span className="text-stone-400 font-normal">(Recommandé)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Sahel, Pays Yoruba, Haute-Guinée, Caraïbes, etc."
                value={culturalAnchor}
                onChange={(e) => setCulturalAnchor(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-clay focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-stone-500 uppercase tracking-wider mb-2">
                Période historique <span className="text-stone-400 font-normal">(Optionnel)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Époque précoloniale, Post-indépendance, Contemporaine"
                value={historicalPeriod}
                onChange={(e) => setHistoricalPeriod(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-clay focus:bg-white"
              />
            </div>
          </div>

          {/* Main Idea Pitch */}
          <div>
            <label className="block text-xs font-mono text-stone-500 uppercase tracking-wider mb-2">
              Idée principale / Pitch libre <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              maxLength={1500}
              placeholder="Décrivez votre projet en quelques lignes : l'intrigue, l'ambiance, les thèmes ou les personnages principaux..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm font-serif leading-relaxed focus:outline-none focus:border-clay focus:bg-white resize-none"
            />
            <div className="text-right text-[10px] text-stone-400 font-mono mt-1">
              {idea.length} / 1500 caractères
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-stone-900 text-white hover:bg-stone-800 disabled:bg-stone-300 transition duration-150 py-3.5 px-6 rounded-lg font-serif font-medium flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Cadrage en cours de génération...
              </>
            ) : (
              <>
                <Feather className="w-4 h-4" />
                Soumettre le projet à Plume
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Information/Guidance */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-sand border border-stone-200 rounded-xl p-6">
          <h3 className="font-serif text-lg text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2 mb-4">
            <Sparkles className="text-clay w-4 h-4" /> La Philosophie Plume
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed mb-4">
            Plume n'est pas un substitut créatif. C'est un <strong>atelier d'écriture augmenté</strong> conçu pour faire émerger des récits ancrés dans les cosmogonies et esthétiques d'Afrique.
          </p>
          <ul className="space-y-3.5 text-xs text-stone-600">
            <li className="flex items-start gap-2">
              <span className="text-clay font-bold font-serif">•</span>
              <div>
                <strong>Souveraineté :</strong> L'IA structure, suggère, documente. Vous restez l'unique maître d'œuvre du chapitre final.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-clay font-bold font-serif">•</span>
              <div>
                <strong>Rigueur scientifique :</strong> Aucun proverbe ou symbole n'est factice. Tout est étayé d'une traçabilité scientifique explicite.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-clay font-bold font-serif">•</span>
              <div>
                <strong>Sagesse réflexive :</strong> Plume ne rédige jamais dans l'ombre. Elle explique ses choix stylistiques et provoque le dialogue.
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h4 className="text-xs font-mono text-stone-500 uppercase tracking-wider mb-3">Inspirations littéraires phares</h4>
          <div className="space-y-4 text-xs">
            <div className="border-l-2 border-stone-200 pl-3">
              <p className="font-serif italic font-bold text-stone-800">Le Réalisme Merveilleux</p>
              <p className="text-stone-500 mt-0.5">La porosité sensible entre monde visible et invisible, dans la lignée d'Amos Tutuola et Ben Okri.</p>
            </div>
            <div className="border-l-2 border-stone-200 pl-3">
              <p className="font-serif italic font-bold text-stone-800">L'Oraliture</p>
              <p className="text-stone-500 mt-0.5">L'art d'écrire la parole du conteur, de la veillée, avec des structures circulaires et des formules rituelles.</p>
            </div>
            <div className="border-l-2 border-stone-200 pl-3">
              <p className="font-serif italic font-bold text-stone-800">Le Roman Post-Colonial</p>
              <p className="text-stone-500 mt-0.5">La tension entre collectif et destin individuel, et le combat pour la réappropriation culturelle.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
