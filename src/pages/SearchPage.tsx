import { useState, useMemo } from 'react';
import { useFragellaSearch } from '@/hooks/useFragellaSearch';
import { Button, Input, Select } from '@/components/common';
import { mapConcentration, mapFamily } from '@/lib/mappers';
import type { FragranceInput, FragellaSearchResult } from '@/lib/types';
import { Search, Plus, Loader2, Droplets, Check, Clock, X } from 'lucide-react';

interface SearchPageProps {
  onAdd: (input: FragranceInput) => Promise<any>;
  existingIds: Set<string>;
}

export function SearchPage({ onAdd, existingIds }: SearchPageProps) {
  const [query, setQuery] = useState('');
  const { results, loading, error, search, clear, history, clearHistory } = useFragellaSearch();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'price' | 'year'>('default');

  const sortedResults = useMemo(() => {
    if (sortBy === 'default') return results;
    const sorted = [...results];
    switch (sortBy) {
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price':
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'year':
        sorted.sort((a, b) => (b.launch_year || 0) - (a.launch_year || 0));
        break;
    }
    return sorted;
  }, [results, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) search(query);
  };

  // Clear results when query is emptied so history becomes visible
  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) clear();
  };

  const handleAdd = async (result: FragellaSearchResult, isWishlist: boolean) => {
    setAdding(result.id);

    const notes = [
      ...result.notes.top.map((n) => ({ name: n, layer: 'top' as const })),
      ...result.notes.middle.map((n) => ({ name: n, layer: 'middle' as const })),
      ...result.notes.base.map((n) => ({ name: n, layer: 'base' as const })),
    ];

    const input: FragranceInput = {
      name: result.name,
      brand: result.brand,
      concentration: mapConcentration(result.concentration),
      family: mapFamily(result.accords),
      season: ['Ganzjährig'],
      notes,
      image_url: result.image,
      launch_year: result.launch_year,
      size_ml: null,
      purchase_price: null,
      market_price: result.price,
      purchase_date: null,
      fill_level: 100,
      rating: null,
      tier: null,
      tier_rank: null,
      occasions: [],
      is_blind_buy: false,
      notes_text: '',
      is_wishlist: isWishlist,
      fragella_id: result.id,
    };

    await onAdd(input);
    setAddedIds((prev) => new Set(prev).add(result.id));
    setAdding(null);
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-light text-txt mb-6">
        Parfums <em className="text-gold italic">entdecken</em>
      </h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Suche nach Name, Marke... z.B. Aventus, Tom Ford"
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Suchen
        </Button>
      </form>

      {error && (
        <div className="bg-[#3a1a1a] border border-[#4a2a2a] rounded-sm p-3 mb-4 text-sm text-accent-rose">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-txt-muted">{results.length} Ergebnisse</p>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            options={[
              { value: 'default', label: 'Relevanz' },
              { value: 'rating', label: 'Beste Bewertung' },
              { value: 'price', label: 'Höchster Preis' },
              { value: 'year', label: 'Neuestes Jahr' },
            ]}
            className="!w-auto"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {sortedResults.map((r) => {
          const alreadyOwned = existingIds.has(`${r.name.toLowerCase()}::${r.brand.toLowerCase()}`);
          const justAdded = addedIds.has(r.id);
          const isAdding = adding === r.id;

          return (
            <div
              key={r.id}
              className="bg-surface border border-border rounded overflow-hidden"
            >
              <div className="aspect-[3/4] bg-surface-2 flex items-center justify-center overflow-hidden">
                {r.image ? (
                  <img src={r.image} alt={r.name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <Droplets size={32} className="text-txt-muted" />
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-txt truncate">{r.name}</h3>
                <p className="text-xs text-txt-muted">{r.brand}</p>
                <div className="flex gap-2 mt-1.5 text-[11px] text-txt-muted">
                  {r.concentration && <span>{r.concentration}</span>}
                  {r.launch_year && <span>· {r.launch_year}</span>}
                  {r.rating && <span>· ★ {r.rating.toFixed(1)}</span>}
                  {r.price && <span>· {r.price.toFixed(0)} €</span>}
                </div>

                {/* Notes */}
                {(r.notes.top.length > 0 || r.notes.middle.length > 0 || r.notes.base.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[...r.notes.top, ...r.notes.middle, ...r.notes.base].slice(0, 5).map((n, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-surface-2 border border-border rounded-full text-txt-muted">
                        {n}
                      </span>
                    ))}
                  </div>
                )}

                {(alreadyOwned || justAdded) && (
                  <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 bg-accent-fresh/10 border border-accent-fresh/20 rounded-sm">
                    <Check size={12} className="text-accent-fresh shrink-0" />
                    <span className="text-[11px] text-accent-fresh">Bereits in deiner Sammlung</span>
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => handleAdd(r, false)}
                    disabled={isAdding}
                    className="flex-1"
                  >
                    <Plus size={14} />
                    {alreadyOwned || justAdded ? 'Nochmal hinzufügen' : 'Sammlung'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAdd(r, true)}
                    disabled={isAdding}
                  >
                    Wunschliste
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && results.length === 0 && query && (
        <p className="text-center text-txt-muted py-12">
          Keine Ergebnisse für "{query}". Versuche andere Suchbegriffe.
        </p>
      )}

      {!loading && results.length === 0 && !query && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search size={48} className="text-txt-muted mb-4" />
          <p className="text-sm text-txt-muted max-w-sm mb-6">
            Durchsuche die Parfum-Datenbank nach Name oder Marke und füge Düfte zu deiner Sammlung oder Wunschliste hinzu.
          </p>
          {history.length > 0 && (
            <div className="w-full max-w-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-txt-muted uppercase tracking-wider">Letzte Suchen</span>
                <button onClick={clearHistory} className="text-xs text-txt-muted hover:text-txt transition-colors">
                  Löschen
                </button>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {history.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setQuery(q); search(q); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-full text-sm text-txt-dim hover:border-gold-dim hover:text-gold transition-colors"
                  >
                    <Clock size={12} />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
