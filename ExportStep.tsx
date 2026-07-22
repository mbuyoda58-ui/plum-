import React, { useState } from 'react';
import { ProjectDetails, TraceabilityItem } from '../types';
import { Layout, Palette, Printer, Download, Copy, Check, Eye, ChevronRight, Accessibility, Sparkles } from 'lucide-react';

interface ExportStepProps {
  project: ProjectDetails;
  onNavigateNext: () => void;
}

export default function ExportStep({ project, onNavigateNext }: ExportStepProps) {
  const [typography, setTypography] = useState<'traditional' | 'modern' | 'poetic'>('traditional');
  const [decor, setDecor] = useState<'adinkra' | 'bogolan' | 'none'>('adinkra');
  const [paperColor, setPaperColor] = useState<'ivory' | 'white' | 'sepia'>('ivory');
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Reconstruct book content
  const chaptersList = Object.keys(project.writtenChapters)
    .map(Number)
    .sort((a, b) => a - b);

  const getPaperClass = () => {
    switch (paperColor) {
      case 'white': return 'bg-white text-stone-900 border-stone-200';
      case 'sepia': return 'bg-[#FAF0E6] text-[#5C4033] border-[#E8D8C8]';
      case 'ivory':
      default: return 'bg-[#FDFCF8] text-stone-900 border-stone-200/80';
    }
  };

  const getFontClass = () => {
    switch (typography) {
      case 'modern': return 'font-sans';
      case 'poetic': return 'font-serif italic tracking-wide';
      case 'traditional':
      default: return 'font-serif';
    }
  };

  // SVGs for Motifs
  const renderBogolanPattern = () => (
    <div className="h-4 w-full opacity-60 flex justify-center mb-6 overflow-hidden text-stone-600">
      <svg className="w-full h-full" viewBox="0 0 400 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 10 L20 0 L40 10 L60 0 L80 10 L100 0 L120 10 L140 0 L160 10 L180 0 L200 10 L220 0 L240 10 L260 0 L280 10 L300 0 L320 10 L340 0 L360 10 L380 0 L400 10" stroke="currentColor" strokeWidth="2" />
        <path d="M0 10 L20 20 L40 10 L60 20 L80 10 L100 20 L120 10 L140 20 L160 10 L180 20 L200 10 L220 20 L240 10 L260 20 L280 10 L300 20 L320 10 L340 20 L360 10 L380 20 L400 10" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="10" r="2" fill="currentColor" />
        <circle cx="60" cy="10" r="2" fill="currentColor" />
        <circle cx="100" cy="10" r="2" fill="currentColor" />
        <circle cx="140" cy="10" r="2" fill="currentColor" />
        <circle cx="180" cy="10" r="2" fill="currentColor" />
        <circle cx="220" cy="10" r="2" fill="currentColor" />
        <circle cx="260" cy="10" r="2" fill="currentColor" />
        <circle cx="300" cy="10" r="2" fill="currentColor" />
        <circle cx="340" cy="10" r="2" fill="currentColor" />
        <circle cx="380" cy="10" r="2" fill="currentColor" />
      </svg>
    </div>
  );

  const renderAdinkraPattern = () => (
    <div className="h-6 w-full opacity-70 flex justify-center items-center gap-6 mb-6 text-stone-700">
      {/* Gye Nyame Symbol representation */}
      <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4C14.21 4 16 5.79 16 8C16 10.21 14.21 12 12 12C9.79 12 8 10.21 8 8C8 5.79 9.79 4 12 4ZM12 20C9.33 20 7.02 18.33 6.13 16H17.87C16.98 18.33 14.67 20 12 20Z" fill="currentColor" />
      </svg>
      {/* Dwennimmen (Ram's Horns) representation */}
      <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21ZM12 19V17M12 5V7M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12Z" stroke="currentColor" strokeWidth="2" />
      </svg>
      {/* Sankofa Representation */}
      <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 14.36 2.82 16.53 4.21 18.23L6.15 16.29C5.43 15.09 5 13.59 5 12C5 8.13 8.13 5 12 5C15.87 5 19 8.13 19 12C19 15.87 15.87 19 12 19C10.41 19 8.91 18.57 7.71 17.85L5.77 19.79C7.47 21.18 9.64 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="currentColor" />
      </svg>
    </div>
  );

  const handleCopyManuscript = () => {
    let fullContent = `# ${project.name || "Mon Œuvre"}\n\n`;
    chaptersList.forEach((id) => {
      const ch = project.chapters.find((c) => c.id === id);
      fullContent += `## Chapitre ${id} : ${ch ? ch.title : "Sans titre"}\n\n`;
      fullContent += `${project.writtenChapters[id] || "Aucun contenu écrit"}\n\n`;
    });

    navigator.clipboard.writeText(fullContent);
    setCopiedStatus('manuscript');
    setTimeout(() => setCopiedStatus(null), 2000);
  };

  const handleDownloadHTML = () => {
    let htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${project.name || "Manuscrit Plume"}</title>
  <style>
    body {
      background-color: ${paperColor === 'sepia' ? '#FAF0E6' : paperColor === 'ivory' ? '#FDFCF8' : '#FFFFFF'};
      color: ${paperColor === 'sepia' ? '#5C4033' : '#1F1F1F'};
      font-family: ${typography === 'modern' ? 'sans-serif' : 'Georgia, serif'};
      line-height: 1.8;
      max-width: 700px;
      margin: 40px auto;
      padding: 20px;
    }
    h1 { text-align: center; font-family: Georgia, serif; margin-bottom: 50px; }
    h2 { margin-top: 40px; border-bottom: 1px solid #E5E1DA; padding-bottom: 10px; }
    p { margin-bottom: 20px; text-indent: 2em; text-align: justify; }
    .source-table { width: 100%; border-collapse: collapse; margin-top: 50px; font-size: 0.85em; }
    .source-table th, .source-table td { border: 1px solid #C8C2B7; padding: 10px; text-align: left; }
    .source-table th { background-color: #FDFCF8; }
  </style>
</head>
<body>
  <h1>${project.name || "Manuscrit Sans Titre"}</h1>
  <p style="text-align: center; font-style: italic; text-indent: 0;">Généré avec Plume - Intelligence créative pour les littératures africaines</p>
  
  <hr style="margin: 40px 0; border: 0; border-top: 1px solid #C8C2B7;" />
`;

    chaptersList.forEach((id) => {
      const ch = project.chapters.find((c) => c.id === id);
      htmlContent += `<h2>Chapitre ${id} : ${ch ? ch.title : "Sans titre"}</h2>`;
      const text = project.writtenChapters[id] || "";
      text.split("\n\n").forEach((paragraph) => {
        if (paragraph.trim()) {
          htmlContent += `<p>${paragraph}</p>`;
        }
      });
    });

    // Append sources
    if (project.journal.length > 0) {
      htmlContent += `<hr style="margin: 60px 0; border: 0; border-top: 2px solid #9C4221;" />`;
      htmlContent += `<h2>Journal de Traçabilité des Sources</h2>`;
      htmlContent += `<table class="source-table"><thead><tr><th>Élément</th><th>Catégorie</th><th>Origine</th><th>Source & Fiabilité</th></tr></thead><tbody>`;
      project.journal.forEach((item) => {
        htmlContent += `<tr><td><strong>${item.element}</strong><br/>${item.description}</td><td>${item.category}</td><td>${item.origin}</td><td>${item.sourceType} (${item.level})</td></tr>`;
      });
      htmlContent += `</tbody></table>`;
    }

    htmlContent += `</body></html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name ? project.name.replace(/\s+/g, '_') : 'Plume_Manuscript'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto" id="export-step-5">
      {/* Left Column: Customizer */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <Layout className="text-clay w-5 h-5" />
            <h3 className="font-serif text-lg text-stone-900 font-bold">Mise en forme esthétique</h3>
          </div>

          {/* Typography options */}
          <div className="space-y-2.5">
            <label className="block text-[10px] font-mono text-stone-500 uppercase font-bold">Typographie</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setTypography('traditional')}
                className={`flex items-center justify-between p-3 rounded-lg border text-left cursor-pointer transition ${
                  typography === 'traditional' ? 'border-clay bg-clay/5' : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div>
                  <span className="block font-serif text-sm font-bold">Traditionnel</span>
                  <span className="text-[10px] text-stone-500 font-mono">Serif classique (Georgia/Playfair)</span>
                </div>
                <span className="font-serif text-xs italic">Aa</span>
              </button>

              <button
                onClick={() => setTypography('modern')}
                className={`flex items-center justify-between p-3 rounded-lg border text-left cursor-pointer transition ${
                  typography === 'modern' ? 'border-clay bg-clay/5' : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div>
                  <span className="block font-sans text-sm font-bold">Contemporain</span>
                  <span className="text-[10px] text-stone-500 font-mono">Sans-Serif fluide (Jakarta/Inter)</span>
                </div>
                <span className="font-sans text-xs">Aa</span>
              </button>

              <button
                onClick={() => setTypography('poetic')}
                className={`flex items-center justify-between p-3 rounded-lg border text-left cursor-pointer transition ${
                  typography === 'poetic' ? 'border-clay bg-clay/5' : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div>
                  <span className="block font-serif italic text-sm font-bold">Griot / Poétique</span>
                  <span className="text-[10px] text-stone-500 font-mono">Serif italique et rythmé</span>
                </div>
                <span className="font-serif text-xs italic">Aa</span>
              </button>
            </div>
          </div>

          {/* Motifs options */}
          <div className="space-y-2.5">
            <label className="block text-[10px] font-mono text-stone-500 uppercase font-bold">Motifs Ornementaux</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['adinkra', 'bogolan', 'none'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setDecor(m)}
                  className={`py-2 text-[10px] font-mono font-bold border uppercase text-center rounded transition cursor-pointer ${
                    decor === m
                      ? 'bg-clay/10 text-clay border-clay'
                      : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  {m === 'adinkra' ? 'Adinkra' : m === 'bogolan' ? 'Bogolan' : 'Aucun'}
                </button>
              ))}
            </div>
          </div>

          {/* Paper options */}
          <div className="space-y-2.5">
            <label className="block text-[10px] font-mono text-stone-500 uppercase font-bold">Papier de rendu</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setPaperColor('ivory')}
                className={`py-2 border text-[10px] font-mono rounded transition cursor-pointer ${
                  paperColor === 'ivory' ? 'bg-[#FDFCF8] text-stone-800 border-stone-800 font-bold' : 'bg-stone-50 border-stone-200 text-stone-500'
                }`}
              >
                Ivoire
              </button>
              <button
                onClick={() => setPaperColor('white')}
                className={`py-2 border text-[10px] font-mono rounded transition cursor-pointer ${
                  paperColor === 'white' ? 'bg-white text-stone-800 border-stone-800 font-bold' : 'bg-stone-50 border-stone-200 text-stone-500'
                }`}
              >
                Blanc Pur
              </button>
              <button
                onClick={() => setPaperColor('sepia')}
                className={`py-2 border text-[10px] font-mono rounded transition cursor-pointer ${
                  paperColor === 'sepia' ? 'bg-[#FAF0E6] text-[#5C4033] border-[#5C4033] font-bold' : 'bg-stone-50 border-stone-200 text-stone-500'
                }`}
              >
                Vélin Sépia
              </button>
            </div>
          </div>

          {/* Accessibility standards checklist */}
          <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-2 text-xs text-stone-600">
            <div className="flex items-center gap-1.5 text-stone-800 font-mono text-[10px] font-bold uppercase border-b border-stone-200 pb-1.5 mb-1.5">
              <Accessibility className="w-3.5 h-3.5 text-emerald-600" /> Normes d'Accessibilité (RGAA)
            </div>
            <p className="leading-relaxed">
              Le document final respecte les contrastes certifiés, les structures sémantiques (titres H1, H2 pour lecteurs d'écran) et une mise en page fluide.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            onClick={handleDownloadHTML}
            className="w-full bg-stone-900 text-white hover:bg-stone-800 font-serif text-sm font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" /> Télécharger le Manuscrit (HTML)
          </button>
          <button
            onClick={handleCopyManuscript}
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-mono text-xs py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedStatus === 'manuscript' ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" /> Copié dans le presse-papier !
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copier le code Markdown
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-mono text-xs py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Imprimer / Exporter PDF
          </button>
        </div>

        {/* Global review transition */}
        <div className="bg-stone-900 text-white rounded-xl p-5 space-y-3 shadow-sm">
          <h4 className="font-serif text-sm font-bold flex items-center gap-1.5">
            <Sparkles className="text-clay w-4 h-4" /> Passer à la relecture réflexive
          </h4>
          <p className="text-xs text-stone-400 leading-relaxed">
            Plume réalisera un examen global de votre œuvre (cohérence dramatique, fluidité du style, audit final des sources linguistiques et historiques) avant d'achever votre projet.
          </p>
          <button
            onClick={onNavigateNext}
            className="w-full bg-clay hover:bg-clay/90 text-white transition font-serif text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
          >
            Lancer la relecture transversale <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Column: Book Page Preview */}
      <div className="lg:col-span-8 flex flex-col items-center">
        <span className="text-[10px] font-mono text-stone-400 uppercase mb-2 flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" /> Aperçu avant impression (Mise en page éditée)
        </span>

        {/* Dynamic visual representation of a book sheet */}
        <div className={`w-full max-w-xl shadow-2xl rounded border p-12 transition-all duration-300 min-h-[700px] flex flex-col justify-between ${getPaperClass()}`}>
          <div>
            {/* Visual Border */}
            {decor === 'adinkra' && renderAdinkraPattern()}
            {decor === 'bogolan' && renderBogolanPattern()}

            {/* Book Title / Header */}
            <div className="text-center mb-10">
              <span className="font-mono text-[9px] uppercase tracking-widest opacity-60">Fiche d'épreuve</span>
              <h2 className="font-serif text-3xl font-bold mt-1 text-stone-900">{project.name || "Titre de l'Œuvre"}</h2>
              <div className="w-12 h-0.5 bg-clay mx-auto mt-3 opacity-80" />
            </div>

            {/* Chapters Text */}
            {chaptersList.length === 0 ? (
              <div className="text-center py-24 text-stone-400 font-mono text-xs italic">
                Aucun chapitre n'a encore été rédigé. Retournez à l'atelier d'écriture pour formuler vos premiers jets.
              </div>
            ) : (
              <div className={`space-y-10 ${getFontClass()}`}>
                {chaptersList.map((id) => {
                  const ch = project.chapters.find((c) => c.id === id);
                  const text = project.writtenChapters[id] || "";
                  return (
                    <div key={id} className="space-y-4">
                      <h3 className="font-serif text-lg font-bold border-b border-stone-200/50 pb-1.5">
                        Chapitre {id} : {ch ? ch.title : "Sans titre"}
                      </h3>
                      <div className="text-xs leading-relaxed text-stone-800 space-y-3 whitespace-pre-wrap font-serif">
                        {text || <span className="text-stone-300 italic">Vide...</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-stone-200/50 pt-6 mt-12 text-center text-[10px] font-mono opacity-50 flex justify-between">
            <span>PLUME ATELIER</span>
            <span>Éléments culturels tracés : {project.journal.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
