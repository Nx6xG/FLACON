import { useState, useMemo } from 'react';
import { FragranceCard } from '@/components/Collection/FragranceCard';
import { FragranceDetail } from '@/components/Collection/FragranceDetail';
import { AddFragranceModal } from '@/components/Search/AddFragranceModal';
import { Button, Input, Select, EmptyState } from '@/components/common';
import type { Fragrance, FragranceInput } from '@/lib/types';
import { Plus, Library, LayoutGrid, List, Filter } from 'lucide-react';

interface CollectionPageProps {
  collection: Fragrance[];
  onAdd: (input: FragranceInput) => Promise<any>;
  onUpdate: (id: string, updates: Partial<FragranceInput>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  existingIds?: Set<string>;
  onToast?: (message: string) => void;
}

export function CollectionPage({ collection, onAdd, onUpdate, onDelete, existingIds, onToast }: CollectionPageProps) {
  const [selected, setSelected] = useState<Fragrance | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [filterFamily, setFilterFamily] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'name-desc' | 'rating' | 'rating-asc' | 'price' | 'price-asc' | 'fill'>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const brands = useMemo(
    () => [...new Set(collection.map((f) => f.brand))].sort(),
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
      case 'fill':
        items.sort((a, b) => a.fill_level - b.fill_level);
        break;
      default:
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return items;
  }, [collection, search, filterFamily, filterBrand, sortBy]);

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
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} />
          Hinzufügen
        </Button>
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
            <div className="grid grid-cols-3 gap-2">
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
                  { value: 'fill', label: 'Niedrigster Füllstand' },
                ]}
              />
            </div>
          )}
        </div>
      )}

      {/* Grid / List */}
      {filtered.length > 0 ? (
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
      />

      <AddFragranceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={onAdd}
        existingIds={existingIds}
      />
    </div>
  );
}
