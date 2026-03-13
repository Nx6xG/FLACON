import { useState, useMemo } from 'react';
import { FragranceCard } from '@/components/Collection/FragranceCard';
import { AddFragranceModal } from '@/components/Search/AddFragranceModal';
import { Button, Input, Select, EmptyState } from '@/components/common';
import type { Fragrance, FragranceInput } from '@/lib/types';
import { Heart, Plus, ArrowRight, Trash2, Filter } from 'lucide-react';

interface WishlistPageProps {
  wishlist: Fragrance[];
  onAdd: (input: FragranceInput) => Promise<any>;
  onMoveToCollection: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  existingIds?: Set<string>;
}

export function WishlistPage({ wishlist, onAdd, onMoveToCollection, onDelete, existingIds }: WishlistPageProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'price'>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let items = [...wishlist];

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (f) => f.name.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        items.sort((a, b) => (b.market_price || 0) - (a.market_price || 0));
        break;
      default:
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return items;
  }, [wishlist, search, sortBy]);

  const totalMarketValue = wishlist.reduce((sum, f) => sum + (f.market_price || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-light text-txt">
            Wunsch<em className="text-gold italic">liste</em>
          </h1>
          <p className="text-sm text-txt-muted mt-1">
            {wishlist.length} Düfte{totalMarketValue > 0 && ` · ca. ${totalMarketValue.toFixed(0)} € Marktwert`}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} />
          Hinzufügen
        </Button>
      </div>

      {wishlist.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suchen..."
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
          </div>

          {showFilters && (
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              options={[
                { value: 'recent', label: 'Neueste zuerst' },
                { value: 'name', label: 'Name A–Z' },
                { value: 'price', label: 'Höchster Marktwert' },
              ]}
            />
          )}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 p-3 bg-surface border border-border rounded-sm"
            >
              <div className="flex-1 min-w-0">
                <FragranceCard fragrance={f} onClick={() => setActionId(actionId === f.id ? null : f.id)} compact />
              </div>

              {actionId === f.id && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={async () => {
                      await onMoveToCollection(f.id);
                      setActionId(null);
                    }}
                    title="Zur Sammlung verschieben"
                  >
                    <ArrowRight size={14} />
                    Gekauft
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={async () => {
                      await onDelete(f.id);
                      setActionId(null);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <EmptyState
          icon={<Heart size={48} />}
          title="Wunschliste ist leer"
          description="Merke dir Düfte, die du noch haben möchtest."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={16} />
              Duft merken
            </Button>
          }
        />
      ) : (
        <p className="text-center text-txt-muted py-12">Keine Ergebnisse für "{search}".</p>
      )}

      <AddFragranceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={onAdd}
        isWishlist
        existingIds={existingIds}
      />
    </div>
  );
}
