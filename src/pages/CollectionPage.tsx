import { useState, useMemo } from 'react';
import { FragranceCard } from '@/components/Collection/FragranceCard';
import { FragranceDetail } from '@/components/Collection/FragranceDetail';
import { FragranceOfTheDay } from '@/components/Collection/FragranceOfTheDay';
import { AddFragranceModal } from '@/components/Search/AddFragranceModal';
import { Button, Input, Select, EmptyState } from '@/components/common';
import type { Fragrance, FragranceInput } from '@/lib/types';
import { RandomPicker } from '@/components/Collection/RandomPicker';
import { FragranceQuiz } from '@/components/Collection/FragranceQuiz';
import { WeatherRecommendation } from '@/components/Collection/WeatherRecommendation';
import { Plus, Library, LayoutGrid, List, Filter, Share2, Dices, HelpCircle, Star, Layers } from 'lucide-react';

interface CollectionPageProps {
  collection: Fragrance[];
  loading?: boolean;
  onAdd: (input: FragranceInput) => Promise<any>;
  onUpdate: (id: string, updates: Partial<FragranceInput>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  existingIds?: Set<string>;
  shareUrl?: string | null;
  onToast?: (message: string) => void;
  onWear?: (fragranceId: string) => Promise<boolean>;
}

function SkeletonCard() {
  return (
    <div className="flex flex-col bg-surface border border-border rounded overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-surface-2" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-surface-2 rounded w-3/4" />
        <div className="h-3 bg-surface-2 rounded w-1/2" />
        <div className="flex gap-1.5">
          <div className="h-4 bg-surface-2 rounded-full w-12" />
          <div className="h-4 bg-surface-2 rounded-full w-10" />
        </div>
      </div>
    </div>
  );
}

export function CollectionPage({ collection, loading, onAdd, onUpdate, onDelete, existingIds, shareUrl, onToast, onWear }: CollectionPageProps) {
  const [selected, setSelected] = useState<Fragrance | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [filterFamily, setFilterFamily] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterNote, setFilterNote] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'name-desc' | 'rating' | 'rating-asc' | 'price' | 'price-asc' | 'ppm' | 'ppm-desc' | 'fill'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [filterOccasion, setFilterOccasion] = useState('');

  const brands = useMemo(
    () => [...new Set(collection.map((f) => f.brand))].sort(),
    [collection]
  );

  const noteNames = useMemo(
    () => [...new Set(collection.flatMap((f) => f.notes.map((n) => n.name)))].sort(),
    [collection]
  );

  const filtered = useMemo(() => {
    let items = [...collection];

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (f) => f.name.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q) || f.notes_text?.toLowerCase().includes(q)
      );
    }
    if (filterFamily) items = items.filter((f) => f.family === filterFamily);
    if (filterBrand) items = items.filter((f) => f.brand === filterBrand);
    if (filterNote) items = items.filter((f) => f.notes.some((n) => n.name === filterNote));
    if (filterOccasion) items = items.filter((f) => f.occasions?.includes(filterOccasion));

    switch (sortBy) {
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        items.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'rating':
        items.sort((a, b) => (b.rating?.overall || 0) - (a.rating?.overall || 0));
        break;
      case 'rating-asc':
        items.sort((a, b) => (a.rating?.overall || 0) - (b.rating?.overall || 0));
        break;
      case 'price':
        items.sort((a, b) => (b.purchase_price || 0) - (a.purchase_price || 0));
        break;
      case 'price-asc':
        items.sort((a, b) => (a.purchase_price || 0) - (b.purchase_price || 0));
        break;
      case 'ppm': {
        const ppm = (f: typeof items[0]) => f.purchase_price && f.size_ml ? f.purchase_price / f.size_ml : 0;
        items.sort((a, b) => ppm(a) - ppm(b));
        break;
      }
      case 'ppm-desc': {
        const ppmD = (f: typeof items[0]) => f.purchase_price && f.size_ml ? f.purchase_price / f.size_ml : 0;
        items.sort((a, b) => ppmD(b) - ppmD(a));
        break;
      }
      case 'fill':
        items.sort((a, b) => a.fill_level - b.fill_level);
        break;
      default:
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return items;
  }, [collection, search, filterFamily, filterBrand, filterNote, filterOccasion, sortBy]);

  const totalValue = collection.reduce((sum, f) => sum + (f.purchase_price || 0), 0);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-light text-txt">
            Meine <em className="text-gold italic">Sammlung</em>
          </h1>
          <p className="text-sm text-txt-muted mt-1">
            {collection.length} Düfte{totalValue > 0 && ` · ${totalValue.toFixed(0)} € Gesamtwert`}
          </p>
        </div>
        <div className="flex gap-2">
          {collection.length >= 2 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuizOpen(true)}
                title="Duft-Quiz"
              >
                <HelpCircle size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPickerOpen(true)}
                title="Zufälliger Duft"
              >
                <Dices size={14} />
              </Button>
            </>
          )}
          {shareUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                onToast?.('Share-Link kopiert');
              }}
              title="Sammlung teilen"
            >
              <Share2 size={14} />
            </Button>
          )}
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={16} />
            Hinzufügen
          </Button>
        </div>
      </div>

      {/* Search & filter bar */}
      {collection.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, Marke oder Notizen..."
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? '!border-gold-dim !text-gold' : ''}
            >
              <Filter size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
            >
              {view === 'grid' ? <List size={14} /> : <LayoutGrid size={14} />}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Select
                value={filterFamily}
                onChange={(e) => setFilterFamily(e.target.value)}
                options={[
                  { value: '', label: 'Alle Familien' },
                  ...['Oriental', 'Woody', 'Floral', 'Fresh', 'Citrus', 'Aquatic', 'Gourmand', 'Fougère', 'Chypre', 'Aromatic', 'Leather', 'Oud'].map((f) => ({
                    value: f,
                    label: f,
                  })),
                ]}
              />
              <Select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                options={[
                  { value: '', label: 'Alle Marken' },
                  ...brands.map((b) => ({ value: b, label: b })),
                ]}
              />
              {noteNames.length > 0 && (
                <Select
                  value={filterNote}
                  onChange={(e) => setFilterNote(e.target.value)}
                  options={[
                    { value: '', label: 'Alle Noten' },
                    ...noteNames.map((n) => ({ value: n, label: n })),
                  ]}
                />
              )}
              <Select
                value={filterOccasion}
                onChange={(e) => setFilterOccasion(e.target.value)}
                options={[
                  { value: '', label: 'Alle Anlässe' },
                  ...['Date Night', 'Office', 'Party', 'Sport', 'Formal', 'Alltag'].map((o) => ({ value: o, label: o })),
                ]}
              />
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                options={[
                  { value: 'recent', label: 'Neueste zuerst' },
                  { value: 'name', label: 'Name A–Z' },
                  { value: 'name-desc', label: 'Name Z–A' },
                  { value: 'rating', label: 'Beste Bewertung' },
                  { value: 'rating-asc', label: 'Schlechteste Bewertung' },
                  { value: 'price', label: 'Höchster Preis' },
                  { value: 'price-asc', label: 'Niedrigster Preis' },
                  { value: 'ppm', label: 'Günstigster €/ml' },
                  { value: 'ppm-desc', label: 'Teuerster €/ml' },
                  { value: 'fill', label: 'Niedrigster Füllstand' },
                ]}
              />
            </div>
          )}
        </div>
      )}

      {/* Progress banner */}
      {!loading && collection.length > 0 && (() => {
        const unrated = collection.filter((f) => !f.rating?.overall).length;
        const untier = collection.filter((f) => !f.tier).length;
        if (unrated === 0 && untier === 0) return null;
        return (
          <div className="flex items-center gap-3 mb-4 p-3 bg-surface border border-border rounded-lg">
            <div className="flex items-center gap-4 flex-1 flex-wrap">
              {unrated > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star size={12} className="text-txt-muted" />
                  <span className="text-xs text-txt-muted">
                    <span className="text-gold font-semibold">{unrated}</span> unbewertet
                  </span>
                </div>
              )}
              {untier > 0 && (
                <div className="flex items-center gap-1.5">
                  <Layers size={12} className="text-txt-muted" />
                  <span className="text-xs text-txt-muted">
                    <span className="text-gold font-semibold">{untier}</span> ohne Tier
                  </span>
                </div>
              )}
            </div>
            <div className="h-1.5 flex-1 max-w-[120px] bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold/60 rounded-full transition-all"
                style={{ width: `${((collection.length - unrated) / collection.length) * 100}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* Weather recommendation */}
      {!loading && collection.length >= 3 && !search && !filterFamily && !filterBrand && !filterNote && !filterOccasion && (
        <WeatherRecommendation collection={collection} onClick={setSelected} />
      )}

      {/* Fragrance of the Day */}
      {!loading && collection.length >= 3 && !search && !filterFamily && !filterBrand && !filterNote && !filterOccasion && (
        <FragranceOfTheDay collection={collection} onClick={setSelected} />
      )}

      {/* Grid / List */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length > 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((f) => (
              <FragranceCard key={f.id} fragrance={f} onClick={() => setSelected(f)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((f) => (
              <FragranceCard key={f.id} fragrance={f} onClick={() => setSelected(f)} compact />
            ))}
          </div>
        )
      ) : collection.length === 0 ? (
        <EmptyState
          icon={<Library size={48} />}
          title="Noch keine Düfte"
          description="Füge dein erstes Parfum hinzu und starte deine Sammlung."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={16} />
              Erstes Parfum hinzufügen
            </Button>
          }
        />
      ) : (
        <p className="text-center text-txt-muted py-12">Keine Ergebnisse für diese Filter.</p>
      )}

      {/* Modals */}
      <FragranceDetail
        fragrance={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onSave={onUpdate}
        onDelete={onDelete}
        onToast={onToast}
        collection={collection}
        onSelect={setSelected}
        onWear={onWear}
      />

      <AddFragranceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={onAdd}
        existingIds={existingIds}
      />

      <RandomPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        collection={collection}
        onSelect={setSelected}
      />

      <FragranceQuiz
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        collection={collection}
        onSelect={setSelected}
      />
    </div>
  );
}
