import React, { useState } from 'react';
import { TraceabilityItem } from '../types';
import { ShieldCheck, HelpCircle, Sparkles, BookOpen, AlertCircle, Filter, Search } from 'lucide-react';

interface TraceabilityJournalProps {
  items: TraceabilityItem[];
  onRemoveItem?: (id: string) => void;
}

export default function TraceabilityJournal({ items, onRemoveItem }: TraceabilityJournalProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = items.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = item.element.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'bien documenté':
      case 'bien documenté ':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3" /> Bien documenté
          </span>
        );
      case 'plausible':
      case 'plausible mais à vérifier':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <HelpCircle className="w-3 h-3" /> Plausible (à vérifier)
          </span>
        );
      case 'creative':
      case 'hypothèse créative':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <Sparkles className="w-3 h-3" /> Hypothèse créative
          </span>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'language':
        return <span className="px-2 py-0.5 text-xs font-mono font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded">LANGUE</span>;
      case 'symbol':
        return <span className="px-2 py-0.5 text-xs font-mono font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">SYMBOLE</span>;
      case 'proverb':
        return <span className="px-2 py-0.5 text-xs font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded">PROVERBE</span>;
      case 'structure':
        return <span className="px-2 py-0.5 text-xs font-mono font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded">STRUCTURE</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-mono font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded">ESTHÉTIQUE</span>;
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6" id="traceability-journal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5 mb-6">
        <div>
          <h3 className="font-serif text-2xl text-stone-900 flex items-center gap-2">
            <BookOpen className="text-clay w-6 h-6" /> Journal de Traçabilité des Sources
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Chaque référence linguistique, proverbiale ou symbolique insérée par Plume est auditée ci-dessous.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 text-xs flex items-start gap-2 max-w-md">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Vigilance :</span> Plume recommande une relecture humaine spécialisée (locuteurs natifs, chercheurs) avant publication officielle.
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher un élément, une aire culturelle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-clay focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400 shrink-0" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 focus:outline-none focus:border-clay focus:bg-white"
          >
            <option value="all">Toutes les catégories</option>
            <option value="language">Langues & expressions</option>
            <option value="symbol">Symboles & motifs</option>
            <option value="proverb">Proverbes & formules</option>
            <option value="structure">Structure narrative</option>
            <option value="style">Esthétique & style</option>
          </select>
        </div>
      </div>

      {/* List / Table */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-stone-200 rounded-lg bg-stone-50/50">
          <p className="text-sm text-stone-500 font-mono">Aucun élément culturel répertorié pour le moment.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 text-xs font-mono uppercase bg-stone-50">
                <th className="py-3 px-4 font-semibold">Élément</th>
                <th className="py-3 px-4 font-semibold">Catégorie</th>
                <th className="py-3 px-4 font-semibold">Aire Culturelle</th>
                <th className="py-3 px-4 font-semibold">Provenance & Source</th>
                <th className="py-3 px-4 font-semibold">Confiance / Fiabilité</th>
                {onRemoveItem && <th className="py-3 px-4 font-semibold text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/50 transition">
                  <td className="py-4 px-4">
                    <div className="font-serif font-bold text-stone-900">{item.element}</div>
                    <div className="text-xs text-stone-500 mt-0.5 line-clamp-2">{item.description}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">{getCategoryIcon(item.category)}</td>
                  <td className="py-4 px-4 font-mono text-xs text-stone-700">{item.origin}</td>
                  <td className="py-4 px-4">
                    <div className="text-xs font-medium text-stone-800">{item.sourceType}</div>
                    <div className="text-[11px] text-stone-500 italic mt-0.5">{item.reliability}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">{getLevelBadge(item.level)}</td>
                  {onRemoveItem && (
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-xs text-stone-400 hover:text-red-600 hover:underline"
                      >
                        Retirer
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
