import { useState } from 'react';
import { Modal, Button, Input, Select } from '@/components/common';
import { useFragellaSearch } from '@/hooks/useFragellaSearch';
import { mapConcentration, mapFamily } from '@/lib/mappers';
import type { FragranceInput, FragellaSearchResult, Concentration, FragranceFamily } from '@/lib/types';
import { Search, Plus, Loader2, Droplets, Check } from 'lucide-react';

const concentrations: { value: Concentration; label: string }[] = [
  { value: 'Parfum', label: 'Parfum' },
  { value: 'EdP', label: 'Eau de Parfum' },
  { value: 'EdT', label: 'Eau de Toilette' },
  { value: 'EdC', label: 'Eau de Cologne' },
  { value: 'Cologne', label: 'Cologne' },
  { value: 'Other', label: 'Andere' },
];

const families: { value: FragranceFamily; label: string }[] = [
  { value: 'Oriental', label: 'Oriental' },
  { value: 'Woody', label: 'Woody' },
  { value: 'Floral', label: 'Floral' },
  { value: 'Fresh', label: 'Fresh' },
  { value: 'Citrus', label: 'Citrus' },
  { value: 'Aquatic', label: 'Aquatic' },
  { value: 'Gourmand', label: 'Gourmand' },
  { value: 'Fougère', label: 'Fougère' },
  { value: 'Chypre', label: 'Chypre' },
  { value: 'Aromatic', label: 'Aromatic' },
  { value: 'Leather', label: 'Leather' },
  { value: 'Oud', label: 'Oud' },
  { value: 'Other', label: 'Andere' },
];

interface AddFragranceModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (input: FragranceInput) => Promise<any>;
  isWishlist?: boolean;
  existingIds?: Set<string>;
}

export function AddFragranceModal({ open, onClose, onAdd, isWishlist, existingIds }: AddFragranceModalProps) {
  const [mode, setMode] = useState<'search' | 'manual'>('search');
  const [query, setQuery] = useState('');
  const { results, loading: searching, error: searchError, search, clear } = useFragellaSearch();
  const [adding, setAdding] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Manual form state
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [concentration, setConcentration] = useState<Concentration>('EdP');
  const [family, setFamily] = useState<FragranceFamily>('Fresh');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) search(query);
  };

  const handleAddFromSearch = async (result: FragellaSearchResult) => {
    setAdding(true);

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
      notes_text: '',
      is_wishlist: isWishlist || false,
      fragella_id: result.id,
    };

    await onAdd(input);
    setAddedIds((prev) => new Set(prev).add(result.id));
    setAdding(false);
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brand.trim()) return;

    setAdding(true);
    const input: FragranceInput = {
      name: name.trim(),
      brand: brand.trim(),
      concentration,
      family,
      season: ['Ganzjährig'],
      notes: [],
      image_url: null,
      launch_year: null,
      size_ml: null,
      purchase_price: null,
      market_price: null,
      purchase_date: null,
      fill_level: 100,
      rating: null,
      tier: null,
      tier_rank: null,
      notes_text: '',
      is_wishlist: isWishlist || false,
      fragella_id: null,
    };

    await onAdd(input);
    setAdding(false);
  };

  const resetAndClose = () => {
    setQuery('');
    setName('');
    setBrand('');
    setAddedIds(new Set());
    clear();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={isWishlist ? 'Zur Wunschliste hinzufügen' : 'Parfum hinzufügen'}
      wide
    >
      {/* Mode toggle */}
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => setMode('search')}
            className={`flex-1 py-2 text-sm font-medium rounded-sm transition-colors ${
              mode === 'search' ? 'bg-surface-2 text-gold' : 'text-txt-muted hover:text-txt'
            }`}
          >
            <Search size={14} className="inline mr-2" />
            API-Suche
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 text-sm font-medium rounded-sm transition-colors ${
              mode === 'manual' ? 'bg-surface-2 text-gold' : 'text-txt-muted hover:text-txt'
            }`}
          >
            <Plus size={14} className="inline mr-2" />
            Manuell
          </button>
        </div>

      {mode === 'search' ? (
        <div>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Parfum suchen... z.B. Sauvage, Bleu de Chanel"
              className="flex-1"
            />
            <Button type="submit" disabled={searching || !query.trim()}>
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </Button>
          </form>

          {searchError && (
            <p className="text-sm text-accent-rose mb-3">{searchError}</p>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {results.map((r) => {
              const alreadyOwned = existingIds?.has(r.id) || addedIds.has(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => handleAddFromSearch(r)}
                  disabled={adding}
                  className="flex items-center gap-3 w-full p-3 bg-surface-2 border border-border rounded-sm hover:border-gold-dim transition-all text-left"
                >
                  <div className="w-10 h-14 rounded-sm bg-surface-3 overflow-hidden shrink-0 flex items-center justify-center">
                    {r.image ? (
                      <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                    ) : (
                      <Droplets size={14} className="text-txt-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-txt truncate">{r.name}</p>
                    <p className="text-xs text-txt-muted">{r.brand}</p>
                    <div className="flex gap-2 mt-1 text-[11px] text-txt-muted">
                      {r.concentration && <span>{r.concentration}</span>}
                      {r.launch_year && <span>· {r.launch_year}</span>}
                      {r.rating && <span>· ★ {r.rating.toFixed(1)}</span>}
                    </div>
                    {alreadyOwned && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Check size={10} className="text-accent-fresh" />
                        <span className="text-[10px] text-accent-fresh">Bereits in Sammlung — erneut hinzufügen?</span>
                      </div>
                    )}
                  </div>
                  <Plus size={18} className="text-gold shrink-0" />
                </button>
              );
            })}

            {!searching && results.length === 0 && query && (
              <p className="text-sm text-txt-muted text-center py-6">
                Keine Ergebnisse. Versuche andere Suchbegriffe oder füge manuell hinzu.
              </p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleAddManual} className="space-y-3">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Sauvage"
            required
          />
          <Input
            label="Marke"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="z.B. Dior"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Konzentration"
              value={concentration}
              onChange={(e) => setConcentration(e.target.value as Concentration)}
              options={concentrations}
            />
            <Select
              label="Duftfamilie"
              value={family}
              onChange={(e) => setFamily(e.target.value as FragranceFamily)}
              options={families}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={resetAndClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={adding || !name.trim() || !brand.trim()}>
              {adding ? 'Wird hinzugefügt...' : 'Hinzufügen'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
