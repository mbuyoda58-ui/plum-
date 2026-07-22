import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = 3000;

// Lazy initialization of Gemini client
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (aiInstance) return aiInstance;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error(
      "La clé API Gemini (GEMINI_API_KEY) n'est pas configurée dans les secrets de l'application."
    );
  }

  aiInstance = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  return aiInstance;
}

// Utility to clean and parse JSON response safely
function cleanAndParseJson(text: string): any {
  try {
    const cleaned = text.trim();
    // Match standard ```json ... ``` blocks
    const match = cleaned.match(/```json\s*([\s\S]*?)\s*```/) || cleaned.match(/```\s*([\s\S]*?)\s*```/);
    const jsonStr = match ? match[1] : cleaned;
    return JSON.parse(jsonStr.trim());
  } catch (err) {
    console.error("JSON parsing failed. Raw response was:", text);
    throw new Error("La réponse de l'IA n'a pas pu être convertie au format requis.");
  }
}

// ==========================================
// API ROUTES FOR PLUME WORKFLOW
// ==========================================

// Endpoint for Step 1: Cadrage (Project Framing)
app.post("/api/project/cadrage", async (req, res) => {
  try {
    const { genre, style, formatPages, formatChapters, idea, culturalAnchor, historicalPeriod } = req.body;

    const ai = getGeminiClient();

    const prompt = `Vous êtes Plume, une IA spécialisée dans l'accompagnement d'auteurs de littératures africaines.
Votre rôle est d'analyser l'idée de départ de l'auteur et de produire une fiche de cadrage réflexive, sans écrire à sa place.
Voici les détails fournis par l'auteur :
- Genre littéraire : ${genre}
- Style esthétique : ${style}
- Format prévu : environ ${formatPages} pages et ${formatChapters} chapitres
- Idée principale / Pitch : ${idea}
- Ancrage géo-culturel : ${culturalAnchor || "Non spécifié, suggérez des options inspirantes si besoin"}
- Période historique : ${historicalPeriod || "Non spécifiée"}

Analysez ce projet au prisme des traditions littéraires, historiques et cosmogoniques africaines.
S'il y a un ancrage géo-culturel ou des éléments stylistiques, reliez-les à des courants réels (ex: Négritude, réalisme merveilleux, oraliture, écritures de la désillusion, écritures contemporaines).

Vous devez répondre STRICTEMENT sous la forme d'un objet JSON contenant les clés suivantes :
1. "summary" (string): Une reformulation littéraire, soignée et inspirante du projet de l'auteur. Résumez ses intentions avec rigueur et hauteur.
2. "culturalAestheticAnalysis" (string): Une analyse approfondie des choix de style et d'ancrage. Expliquez comment le genre et le style choisis résonnent avec des formes africaines traditionnelles ou contemporaines. Mentionnez des courants littéraires sans jamais attribuer de faux textes ou citations à des auteurs réels. Suggérez des pistes de réflexion culturelle légitimes.
3. "suggestionMessage" (string): Un message réflexif adressé à l'auteur qui termine par la question : "Voici ce que je comprends de votre projet : [résumé bref]. Est-ce fidèle à votre intention, ou souhaitez-vous ajuster un point avant que je propose une structure ?"

Respectez scrupuleusement le format de sortie JSON demandé. Ne mettez aucun texte en dehors du bloc JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Reformulation littéraire et rigoureuse du projet." },
            culturalAestheticAnalysis: { type: Type.STRING, description: "Analyse esthétique et historique des choix culturels." },
            suggestionMessage: { type: Type.STRING, description: "Message d'échange direct se terminant par une question ouverte de validation." }
          },
          required: ["summary", "culturalAestheticAnalysis", "suggestionMessage"]
        }
      }
    });

    const result = cleanAndParseJson(response.text);
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/project/cadrage:", error);
    res.status(500).json({ error: error.message || "Erreur interne du serveur lors du cadrage." });
  }
});

// Endpoint for Step 2: Generating Narrative Structure (Architecture)
app.post("/api/project/structure", async (req, res) => {
  try {
    const { project } = req.body;

    const ai = getGeminiClient();

    const prompt = `Vous êtes Plume, atelier d'écriture augmenté.
À partir du cadrage validé par l'auteur, vous allez concevoir une proposition d'architecture narrative (un plan de chapitres, un arc dramatique ou une progression poétique).
Voici les détails du projet :
- Genre : ${project.genre}
- Style : ${project.style}
- Format : ${project.formatChapters} chapitres
- Idée / Pitch : ${project.idea}
- Ancrage géo-culturel : ${project.culturalAnchor}
- Période historique : ${project.historicalPeriod}
- Analyse de cadrage : ${project.summary}

Vous devez proposer un plan de ${project.formatChapters} chapitres s'inspirant explicitement de l'un de ces courants littéraires et esthétiques africains (sélectionnez le plus pertinent par rapport au projet) :
- Oraliture (structure circulaire, refrains, formules d'ouverture/clôture, veillée)
- Réalisme merveilleux africain (porosité visible / invisible, esprits, ancêtres)
- Roman post-colonial et de la désillusion (tension individu/collectif, critique sociale, engagement)
- Négritude et poésie du verbe (rythme, métaphores, quête identitaire)
- Écritures contemporaines de la diaspora (plurivocalité, transnationalité, migrations)

Pour chaque chapitre proposé, vous devez inclure :
- Un titre poétique et évocateur
- Le focus dramatique / poétique
- Les événements clés (2 à 3 événements)
- Des suggestions d'éléments culturels (mots en langues locales, symboles comme l'adinkra ou bogolan, proverbes pertinents avec leur provenance réelle).

Répondez sous la forme d'un objet JSON STRICT :
1. "selectedInspiration" (string): Nom du courant littéraire retenu.
2. "sourceJustification" (string): Pourquoi ce courant correspond parfaitement au projet de l'auteur, et quelles techniques narratives en découlent.
3. "chapters" (array): Liste de ${project.formatChapters} chapitres. Chaque chapitre est un objet avec :
   - "id" (integer, 1 à N)
   - "title" (string, titre du chapitre)
   - "focus" (string, fil directeur du chapitre)
   - "keyEvents" (array of strings, événements clés)
   - "suggestedCulturalElements" (object): { "languages": string[], "symbols": string[], "proverbs": string[] }
4. "dialogueReflexif" (string): Un message qui explique l'architecture globale, la traçabilité des choix structurels, et pose une question ouverte sur les préférences de l'auteur (ex: circularité vs linéarité, rythme rapide vs contemplatif).

Respectez le format de sortie JSON sans aucun texte extérieur.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selectedInspiration: { type: Type.STRING },
            sourceJustification: { type: Type.STRING },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  keyEvents: { type: Type.ARRAY, items: { type: Type.STRING } },
                  suggestedCulturalElements: {
                    type: Type.OBJECT,
                    properties: {
                      languages: { type: Type.ARRAY, items: { type: Type.STRING } },
                      symbols: { type: Type.ARRAY, items: { type: Type.STRING } },
                      proverbs: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  }
                },
                required: ["id", "title", "focus", "keyEvents", "suggestedCulturalElements"]
              }
            },
            dialogueReflexif: { type: Type.STRING }
          },
          required: ["selectedInspiration", "sourceJustification", "chapters", "dialogueReflexif"]
        }
      }
    });

    const result = cleanAndParseJson(response.text);
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/project/structure:", error);
    res.status(500).json({ error: error.message || "Erreur interne lors de la génération de la structure." });
  }
});

// Endpoint for Step 3: Creative Draft generation per chapter
app.post("/api/project/chapter-draft", async (req, res) => {
  try {
    const { project, chapterId, userInstruction } = req.body;

    const currentChapter = project.chapters.find((c: any) => c.id === chapterId);
    if (!currentChapter) {
      return res.status(400).json({ error: "Chapitre introuvable." });
    }

    const ai = getGeminiClient();

    const previousContext = Object.entries(project.writtenChapters)
      .map(([id, content]) => `[Chapitre ${id}]: ${content ? (content as string).substring(0, 400) + "..." : "Vide"}`)
      .join("\n");

    const prompt = `Vous êtes Plume, l'atelier d'écriture augmenté. Votre but est d'accompagner l'auteur dans l'écriture du Chapitre ${chapterId} de son œuvre.
Rappels importants :
- L'IA n'écrit pas à la place de l'auteur ; elle propose un PREMIER JET poétique, hautement littéraire, très qualitatif, que l'auteur pourra retravailler, accepter ou rejeter.
- Ce chapitre doit s'inscrire dans le projet global : ${project.genre}, style ${project.style}, inspiration ${project.selectedInspiration}.
- Contexte précédent :
${previousContext || "C'est le début de l'œuvre."}

Détails du Chapitre ${chapterId} à rédiger :
- Titre : ${currentChapter.title}
- Focus : ${currentChapter.focus}
- Événements clés à couvrir : ${currentChapter.keyEvents.join(", ")}
- Instructions particulières ou commentaires de l'auteur : ${userInstruction || "Aucun"}

Consignes spécifiques d'insertion culturelle :
Vous devez intégrer des éléments culturels africains pertinents de manière fluide (par exemple, un proverbe issu d'une aire culturelle précise, un symbole, ou des salutations/expressions en langue locale swahili, wolof, lingala, bambara, haoussa, etc. avec leur traduction directe ou contextuelle).
Chaque élément culturel inséré doit être documenté avec une fiche de traçabilité absolue (avec sa provenance, sa source littéraire ou ethnographique probable, et son indice de fiabilité honnête).

Vous devez répondre STRICTEMENT sous forme d'un objet JSON contenant les clés suivantes :
1. "chapterContent" (string): Une proposition de texte littéraire soigné pour le Chapitre ${chapterId} (environ 300-500 mots), caractérisé par un rythme riche, de belles images, et respectueux des traditions orales ou écrites africaines.
2. "stylisticChoices" (array of strings): Explications des choix stylistiques (figures de style, rythmes de phrase, tonalité générale) effectués pour ce jet.
3. "culturalIntegrations" (array): Fiches de traçabilité des éléments culturels mobilisés. Chaque élément est un objet :
   - "element" (string, le mot, proverbe ou symbole inséré)
   - "category" (string, valeur parmi : "language", "symbol", "proverb", "style")
   - "description" (string, explication littéraire ou ethnologique de sa signification)
   - "origin" (string, aire culturelle ou pays d'origine réel, ex: "Aire Yoruba (Nigeria/Benin)")
   - "sourceType" (string, type de source de référence, ex: "Corpus oral / études de linguistique publiées")
   - "reliability" (string, avertissement ou conseil d'usage honnête, ex: "À valider avec un locuteur natif swahili avant édition")
   - "level" (string, niveau de confiance : "bien documenté" | "plausible" | "creative")
4. "reflexiveQuestion" (string): Une question ouverte s'adressant à la posture de l'auteur pour orienter le chapitre suivant ou peaufiner ce chapitre (ex: "Le rythme du dialogue vous semble-t-il trop haché ou souhaitez-vous approfondir le silence entre les répliques ?").

Respectez le format de sortie JSON sans aucun texte extérieur.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapterContent: { type: Type.STRING },
            stylisticChoices: { type: Type.ARRAY, items: { type: Type.STRING } },
            culturalIntegrations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  element: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  origin: { type: Type.STRING },
                  sourceType: { type: Type.STRING },
                  reliability: { type: Type.STRING },
                  level: { type: Type.STRING }
                },
                required: ["element", "category", "description", "origin", "sourceType", "reliability", "level"]
              }
            },
            reflexiveQuestion: { type: Type.STRING }
          },
          required: ["chapterContent", "stylisticChoices", "culturalIntegrations", "reflexiveQuestion"]
        }
      }
    });

    const result = cleanAndParseJson(response.text);
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/project/chapter-draft:", error);
    res.status(500).json({ error: error.message || "Erreur interne lors de la rédaction du chapitre." });
  }
});

// Endpoint for Step 4: Specific Custom Enrichment (Languages, Symbols, Proverbs)
app.post("/api/project/enrich", async (req, res) => {
  try {
    const { text, category, instruction, culturalAnchor } = req.body;

    const ai = getGeminiClient();

    const prompt = `Vous êtes Plume, l'atelier de personnalisation culturelle.
Un auteur vous confie un extrait de texte et souhaite l'enrichir selon une intention spécifique.
- Extrait original : "${text}"
- Catégorie d'enrichissement souhaitée : ${category} (par exemple : langue locale, proverbe traditionnel, symbole/motif graphique textuel ou métaphorique)
- Consigne de l'auteur : "${instruction}"
- Aire géo-culturelle d'ancrage : ${culturalAnchor || "Afrique générale"}

Votre mission est de :
1. Proposer un texte enrichi intégrant élégamment la demande de l'auteur, en veillant à ne pas dénaturer sa voix originelle.
2. Établir une fiche de traçabilité d'une extrême rigueur intellectuelle pour l'élément culturel inséré (sa signification, son origine géographique/ethnologique exacte, son type de source, son niveau de confiance : bien documenté / plausible / pure hypothèse créative, et un avertissement d'usage honnête).

Vous devez répondre STRICTEMENT sous la forme d'un objet JSON contenant les clés suivantes :
1. "enrichedText" (string): Le texte de l'auteur enrichi de façon fluide et poétique.
2. "traceabilityItem" (object): L'élément culturel inséré avec ses métadonnées précises :
   - "element" (string, l'expression, le mot ou le symbole inséré)
   - "category" (string, identique à la catégorie demandée)
   - "description" (string, explication culturelle ou ethnographique)
   - "origin" (string, aire culturelle ou pays d'origine réel)
   - "sourceType" (string, ex: "Dictionnaire bambara-français", "Recueil académique de proverbes bantous")
   - "reliability" (string, ex: "Conseil : faire relire par un locuteur natif pour valider l'accord de classe nominale")
   - "level" (string, "bien documenté" | "plausible" | "creative")

Respectez le format de sortie JSON. Aucun texte en dehors du bloc JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            enrichedText: { type: Type.STRING },
            traceabilityItem: {
              type: Type.OBJECT,
              properties: {
                element: { type: Type.STRING },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                origin: { type: Type.STRING },
                sourceType: { type: Type.STRING },
                reliability: { type: Type.STRING },
                level: { type: Type.STRING }
              },
              required: ["element", "category", "description", "origin", "sourceType", "reliability", "level"]
            }
          },
          required: ["enrichedText", "traceabilityItem"]
        }
      }
    });

    const result = cleanAndParseJson(response.text);
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/project/enrich:", error);
    res.status(500).json({ error: error.message || "Erreur interne lors de l'enrichissement culturel." });
  }
});

// Endpoint for Step 6: Global Reflexive Review (Relecture globale)
app.post("/api/project/relecture", async (req, res) => {
  try {
    const { project } = req.body;

    const ai = getGeminiClient();

    // Reconstruct full written text
    const fullText = Object.entries(project.writtenChapters)
      .map(([id, content]) => {
        const ch = project.chapters.find((c: any) => c.id === Number(id));
        return `### Chapitre ${id} : ${ch ? ch.title : "Titre inconnu"}\n\n${content}\n`;
      })
      .join("\n\n");

    const journalSummary = project.journal
      .map((item: any) => `- [${item.category.toUpperCase()}] ${item.element} (${item.origin}) - Niveau: ${item.level} - Source: ${item.sourceType}`)
      .join("\n");

    const prompt = `Vous êtes Plume, l'atelier d'écriture augmenté. Vous devez réaliser la relecture transversale et réflexive de l'œuvre complète écrite par l'auteur.
Détails du projet d'origine :
- Genre : ${project.genre}
- Style : ${project.style}
- Courant inspirant : ${project.selectedInspiration}
- Justification : ${project.sourceJustification}

Voici le texte de l'œuvre complète produite :
${fullText || "Aucun chapitre n'a été rédigé pour le moment."}

Voici le journal de traçabilité des sources culturelles mobilisées :
${journalSummary || "Aucun élément culturel spécifique n'a été consigné."}

Vous devez analyser l'œuvre sous quatre dimensions et fournir une appréciation sincère et constructive de compagnon littéraire :
1. Cohérence de l'arc narratif / dramatique globale.
2. Homogénéité et élégance des registres de langue (respect du style, de l'oralité, ou de l'écriture engagée choisie).
3. Vérification de la traçabilité culturelle (audit des sources, conseils de rigueur pour la publication future).
4. Synthèse globale des choix forts faits tout au long de la création.

Vous devez répondre STRICTEMENT sous forme d'un objet JSON contenant les clés suivantes :
1. "overallCoherence" (string): Analyse de la structure narrative globale et de sa fluidité dramatique/poétique.
2. "languageConsistency" (string): Analyse des tonalités, du rythme stylistique et de l'usage des langues insérées.
3. "culturalTraceabilityCheck" (string): Audit critique du journal de traçabilité. Recommandations de relecture humaine (ex: locuteurs natifs, historiens, bibliothécaires spécialisés) et évaluation de la rigueur des sources.
4. "finalSummary" (string): Une conclusion bienveillante, digne d'un griot ou d'un éditeur averti, célébrant le geste créatif unique de l'auteur et ouvrant sur les étapes d'édition.

Respectez le format de sortie JSON. Aucun texte extérieur.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallCoherence: { type: Type.STRING },
            languageConsistency: { type: Type.STRING },
            culturalTraceabilityCheck: { type: Type.STRING },
            finalSummary: { type: Type.STRING }
          },
          required: ["overallCoherence", "languageConsistency", "culturalTraceabilityCheck", "finalSummary"]
        }
      }
    });

    const result = cleanAndParseJson(response.text);
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/project/relecture:", error);
    res.status(500).json({ error: error.message || "Erreur interne lors de la relecture réflexive." });
  }
});

// ==========================================
// VITE OR STATIC FILES MIDDLEWARE
// ==========================================
const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  // Dynamically import Vite server only in development
  import("vite").then(({ createServer }) => {
    createServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server (Development) running on http://0.0.0.0:${PORT}`);
      });
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server (Production) running on port ${PORT}`);
  });
}
