import React, { useState, useEffect } from 'react';
import { ProjectDetails, RelectureResult } from '../types';
import { Loader2, ShieldCheck, AlignLeft, Globe, FileText, Check, Award, RefreshCw, BookOpen } from 'lucide-react';

interface RelectureStepProps {
  project: ProjectDetails;
  onUpdateProject: (updatedFields: Partial<ProjectDetails>) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  onRestart: () => void;
}

export default function RelectureStep({ project, onUpdateProject, isLoading, setIsLoading, onRestart }: RelectureStepProps) {
  const [relecture, setRelecture] = useState<RelectureResult | null>(project.relectureResult || null);
  const [error, setError] = useState<string | null>(null);

  const runRelecture = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/project/relecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erreur lors de la relecture réflexive.");
      }

      const data = await response.json();
      setRelecture(data);
      onUpdateProject({ relectureResult: data });
    } catch (err: any) {
      setError(err.message || "Impossible d'établir le bilan de relecture.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!relecture && !isLoading && !error) {
      runRelecture();
    }
  }, [relecture]);

  if (isLoading && !relecture) {
    return (
      <div className="flex flex-col items-center justify-center py-24 max-w-lg mx-auto text-center space-y-4">
        <Loader2 className="w-10 h-10 text-clay animate-spin" />
        <h3 className="font-serif text-xl text-stone-900">Examen transversal de l'œuvre...</h3>
        <p className="text-xs text-stone-500 font-mono italic">
          "Plume lit l'intégralité du manuscrit pour auditer l'harmonie des registres de langues, la rigueur historique de vos sources et la cohérence de votre arc dramatique."
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8" id="relecture-step-6">
      <div className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <Award className="text-clay w-6 h-6" />
            <h2 className="font-serif text-2xl text-stone-900">Étape 6 — Relecture Réflexive Globale</h2>
          </div>
          {relecture && (
            <button
              onClick={runRelecture}
              disabled={isLoading}
              className="text-xs text-stone-500 hover:text-clay font-mono flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Recalculer le diagnostic
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {relecture && (
          <div className="space-y-6">
            {/* Final Summary - Letter */}
            <div className="border-l-4 border-clay pl-6 py-2 bg-clay/5 rounded-r-xl p-6">
              <h4 className="text-xs font-mono text-clay font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> Bilan d'accompagnement littéraire
              </h4>
              <p className="font-serif text-base text-stone-900 leading-relaxed italic whitespace-pre-wrap">
                {relecture.finalSummary}
              </p>
            </div>

            {/* Diagnostic Dimensions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="bg-stone-50 border border-stone-100 p-5 rounded-xl space-y-2.5">
                <h4 className="font-serif text-sm font-bold text-stone-900 flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
                  <AlignLeft className="w-4 h-4 text-stone-500" /> Cohérence de l'arc
                </h4>
                <p className="text-xs leading-relaxed text-stone-600 whitespace-pre-wrap">
                  {relecture.overallCoherence}
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-100 p-5 rounded-xl space-y-2.5">
                <h4 className="font-serif text-sm font-bold text-stone-900 flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
                  <Globe className="w-4 h-4 text-stone-500" /> Registres linguistiques
                </h4>
                <p className="text-xs leading-relaxed text-stone-600 whitespace-pre-wrap">
                  {relecture.languageConsistency}
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-100 p-5 rounded-xl space-y-2.5">
                <h4 className="font-serif text-sm font-bold text-stone-900 flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Audit de Traçabilité
                </h4>
                <p className="text-xs leading-relaxed text-stone-600 whitespace-pre-wrap">
                  {relecture.culturalTraceabilityCheck}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-stone-100 mt-8">
          <button
            onClick={onRestart}
            className="flex-1 bg-stone-900 text-white hover:bg-stone-800 transition py-3 px-6 rounded-lg font-serif font-medium flex items-center justify-center gap-2 cursor-pointer"
          >
            Commencer un nouveau projet littéraire
          </button>
        </div>
      </div>
    </div>
  );
}
