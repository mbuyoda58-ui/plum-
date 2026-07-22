export type ProjectGenre = 'roman' | 'nouvelle' | 'poeme' | 'conte' | 'essai' | 'theatre';
export type ProjectStyle = 'realisme' | 'oraliture' | 'merveilleux' | 'engage' | 'autofiction' | 'epopee';

export interface ProjectDetails {
  id: string;
  name: string;
  description: string;
  genre: ProjectGenre;
  style: ProjectStyle;
  formatPages: number;
  formatChapters: number;
  idea: string;
  culturalAnchor: string;
  historicalPeriod: string;
  summary: string;
  culturalAestheticAnalysis: string;
  suggestionMessage: string;
  selectedInspiration: string;
  sourceJustification: string;
  chapters: Chapter[];
  writtenChapters: Record<number, string>; // map of chapter ID (1-indexed) to content
  currentStep: number; // 1 to 6
  journal: TraceabilityItem[];
  createdAt: string;
  updatedAt: string;
  relectureResult?: RelectureResult;
}

export interface Chapter {
  id: number; // 1-indexed
  title: string;
  focus: string;
  keyEvents: string[];
  suggestedCulturalElements: {
    languages?: string[];
    symbols?: string[];
    proverbs?: string[];
  };
  stylisticChoices?: string[];
  reflexiveQuestion?: string;
  userResponse?: string;
}

export interface TraceabilityItem {
  id: string;
  element: string;
  category: 'language' | 'symbol' | 'proverb' | 'structure' | 'style';
  description: string;
  origin: string; // e.g. "Akan (Ghana)"
  sourceType: string; // e.g. "Corpus ethnographique / linguistique publié"
  reliability: string; // e.g. "À confirmer par une source spécialisée"
  level: 'bien documenté' | 'plausible' | 'creative'; // bien documenté, plausible mais à vérifier, hypothèse créative
  chapterId?: number;
}

export interface RelectureResult {
  overallCoherence: string;
  languageConsistency: string;
  culturalTraceabilityCheck: string;
  finalSummary: string;
}
