import React, { useState, useEffect } from 'react';
import { ProjectDetails, TraceabilityItem } from './types';
import CadrageStep from './components/CadrageStep';
import StructureStep from './components/StructureStep';
import EcritureStep from './components/EcritureStep';
import ExportStep from './components/ExportStep';
import RelectureStep from './components/RelectureStep';
import TraceabilityJournal from './components/TraceabilityJournal';
import { Feather, BookOpen, Layers, Settings, FileText, Sparkles, FolderKanban, Plus, Trash2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'plume_literary_projects_v1';

export default function App() {
  const [projects, setProjects] = useState<ProjectDetails[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);

  // Initialize projects from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ProjectDetails[];
        setProjects(parsed);
        if (parsed.length > 0) {
          setActiveProjectId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse stored projects", e);
      }
    }
  }, []);

  // Save projects to localStorage whenever they change
  const saveProjectsToStorage = (updatedProjects: ProjectDetails[]) => {
    setProjects(updatedProjects);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects));
  };

  const createNewProject = () => {
    const newProject: ProjectDetails = {
      id: `project-${Date.now()}`,
      name: `Nouveau Projet Littéraire #${projects.length + 1}`,
      description: 'Atelier d\'écriture',
      genre: 'roman',
      style: 'merveilleux',
      formatPages: 80,
      formatChapters: 5,
      idea: '',
      culturalAnchor: '',
      historicalPeriod: '',
      summary: '',
      culturalAestheticAnalysis: '',
      suggestionMessage: '',
      selectedInspiration: '',
      sourceJustification: '',
      chapters: [],
      writtenChapters: {},
      currentStep: 1,
      journal: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newProject, ...projects];
    saveProjectsToStorage(updated);
    setActiveProjectId(newProject.id);
    setShowProjectModal(false);
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce manuscrit définitivement ?")) return;
    const updated = projects.filter((p) => p.id !== id);
    saveProjectsToStorage(updated);
    if (activeProjectId === id) {
      setActiveProjectId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const updateActiveProject = (updatedFields: Partial<ProjectDetails>) => {
    if (!activeProjectId) return;
    const updated = projects.map((p) => {
      if (p.id === activeProjectId) {
        // Automatically sync name from first words of idea if title is placeholder
        let newName = p.name;
        if (p.name.startsWith('Nouveau Projet Littéraire') && updatedFields.idea) {
          const firstWords = updatedFields.idea.split(' ').slice(0, 4).join(' ');
          newName = firstWords.length > 5 ? firstWords + '...' : p.name;
        }

        return {
          ...p,
          ...updatedFields,
          name: updatedFields.name || newName,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    saveProjectsToStorage(updated);
  };

  const handleRemoveJournalItem = (id: string) => {
    if (!activeProject) return;
    const updatedJournal = activeProject.journal.filter((j) => j.id !== id);
    updateActiveProject({ journal: updatedJournal });
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  // Render correct step based on state
  const renderStep = () => {
    if (!activeProject) {
      return (
        <div className="text-center py-20 max-w-md mx-auto space-y-6" id="welcome-pane">
          <div className="w-16 h-16 bg-clay/10 text-clay rounded-full flex items-center justify-center mx-auto">
            <Feather className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-serif text-3xl text-stone-900 font-bold">Bienvenue sur Plume</h2>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              L'atelier d'écriture augmenté et éthique pour les œuvres littéraires enracinées dans les esthétiques, langues et traditions africaines.
            </p>
          </div>
          <button
            onClick={createNewProject}
            className="w-full bg-stone-900 text-white hover:bg-stone-800 transition py-3 px-6 rounded-lg font-serif font-medium flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" /> Créer un premier manuscrit
          </button>
        </div>
      );
    }

    switch (activeProject.currentStep) {
      case 1:
        return (
          <CadrageStep
            onCadrageComplete={updateActiveProject}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 2:
        return (
          <StructureStep
            project={activeProject}
            onStructureComplete={updateActiveProject}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 3:
      case 4: // Unified step
        return (
          <EcritureStep
            project={activeProject}
            onUpdateProject={updateActiveProject}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 5:
        return (
          <ExportStep
            project={activeProject}
            onNavigateNext={() => updateActiveProject({ currentStep: 6 })}
          />
        );
      case 6:
        return (
          <RelectureStep
            project={activeProject}
            onUpdateProject={updateActiveProject}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onRestart={createNewProject}
          />
        );
      default:
        return null;
    }
  };

  // Step Header Indicators mapping
  const STEPS = [
    { num: 1, label: 'Cadrage' },
    { num: 2, label: 'Structure' },
    { num: 3, label: 'Écriture & Accent' },
    { num: 5, label: 'Mise en forme' },
    { num: 6, label: 'Relecture' },
  ];

  const handleStepClick = (stepNum: number) => {
    if (!activeProject) return;
    // Allow jumping to steps only if they have been structurally generated (chapters populated)
    if (stepNum > 2 && activeProject.chapters.length === 0) {
      alert("Veuillez d'abord compléter l'étape de structure.");
      return;
    }
    updateActiveProject({ currentStep: stepNum });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-stone-50" id="plume-app">
      {/* Global Border / Adinkra Motif Simulation */}
      <div className="w-full h-2 bg-clay flex space-x-2 overflow-hidden opacity-85 shrink-0">
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
        <div className="flex-none w-8 h-full border-r border-stone-50/10"></div>
      </div>
      {/* Top Header Navigation */}
      <header className="bg-stone-50/95 border-b border-stone-200 sticky top-0 z-40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-clay rounded-full flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm">
              🪶
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold tracking-tight text-stone-900">PLUME</h1>
              <p className="text-[10px] font-mono text-clay font-bold tracking-wide uppercase">Atelier d'écriture augmenté & éthique</p>
            </div>
          </div>

          {/* Stepper progress indicator */}
          {activeProject && (
            <div className="flex items-center gap-1 bg-white border border-stone-200/60 p-1.5 rounded-lg overflow-x-auto max-w-full">
              {STEPS.map((step, idx) => {
                const isActive = activeProject.currentStep === step.num || 
                                (activeProject.currentStep === 4 && step.num === 3);
                const isPast = activeProject.currentStep > step.num || 
                              (activeProject.currentStep === 4 && step.num < 3);
                return (
                  <React.Fragment key={step.num}>
                    <button
                      onClick={() => handleStepClick(step.num)}
                      className={`px-3 py-1.5 rounded-md text-xs font-serif font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-stone-900 text-white font-bold'
                          : isPast
                          ? 'text-clay hover:bg-stone-50'
                          : 'text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full font-mono text-[9px] flex items-center justify-center border ${
                        isActive ? 'bg-clay text-white border-clay' : 'border-stone-200 text-stone-500'
                      }`}>
                        {idx + 1}
                      </span>
                      {step.label}
                    </button>
                    {idx < STEPS.length - 1 && (
                      <span className="text-stone-300 font-serif px-0.5">·</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Project Manager Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProjectModal(!showProjectModal)}
              className="bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 px-4 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 cursor-pointer shadow-sm transition"
            >
              <FolderKanban className="w-3.5 h-3.5 text-stone-500" /> Manuscrit : {activeProject ? (activeProject.name.length > 25 ? activeProject.name.substring(0, 25) + '...' : activeProject.name) : "Aucun"}
            </button>
          </div>
        </div>
      </header>

      {/* Project Manager Side Draw / Panel overlay */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex justify-end" onClick={() => setShowProjectModal(false)}>
          <div className="w-full max-w-md bg-white h-full p-6 shadow-2xl flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-stone-900">Bibliothèque de manuscrits</h3>
                <button
                  onClick={createNewProject}
                  className="bg-clay text-white hover:bg-clay/90 text-xs px-2.5 py-1.5 rounded font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Nouveau
                </button>
              </div>

              <div className="space-y-2.5 max-h-[70vh] overflow-y-auto">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveProjectId(p.id);
                      setShowProjectModal(false);
                    }}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                      activeProjectId === p.id ? 'border-clay bg-clay/5' : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="space-y-1 truncate pr-2">
                      <h4 className="font-serif text-sm font-bold text-stone-900 truncate">{p.name}</h4>
                      <p className="text-[10px] font-mono text-stone-500">Modifié le : {new Date(p.updatedAt).toLocaleDateString('fr-FR')}</p>
                      <div className="flex gap-2 text-[10px] font-mono mt-2">
                        <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded uppercase">{p.genre}</span>
                        <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded uppercase">{p.style}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteProject(p.id, e)}
                      className="text-stone-400 hover:text-red-600 p-2 shrink-0 transition"
                      title="Supprimer ce manuscrit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowProjectModal(false)}
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 py-2.5 px-4 rounded-lg font-mono text-xs cursor-pointer"
            >
              Fermer la bibliothèque
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {renderStep()}

        {/* Universal Traceability Journal Section for instant lookup */}
        {activeProject && activeProject.journal.length > 0 && activeProject.currentStep >= 3 && (
          <div className="mt-16 border-t border-stone-200/80 pt-12">
            <TraceabilityJournal
              items={activeProject.journal}
              onRemoveItem={handleRemoveJournalItem}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-stone-50/50 py-6 mt-16 text-center text-xs text-stone-500 font-mono">
        <div>
          PLUME — Atelier d'Écriture Éthique & Souveraineté de l'Auteur
        </div>
        <div className="text-[10px] text-stone-400 mt-1">
          Rapprochement des sources ethnographiques d'Afrique subsaharienne & du Maghreb.
        </div>
      </footer>
    </div>
  );
}
