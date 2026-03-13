import { useState, useMemo } from 'react';
import { FragranceCard } from '@/components/Collection/FragranceCard';
import { AddFragranceModal } from '@/components/Search/AddFragranceModal';
import { Button, Input, Select, EmptyState } from '@/components/common';
import type { Fragrance, FragranceInput } from '@/lib/types';
import { Heart, Plus, ArrowRight, Trash2, Filter, Loader2 } from 'lucide-react';

interface WishlistPageProps {
  wishlist: Fragrance[];
  onAdd: (input: FragranceInput) => Promise<any>;
  onMoveToCollection: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  existingIds?: Set<string>;
  onToast?: (message: string) => void;
}

function WishlistItem({ fragrance: f, expanded, onToggle, onMove, onDelete, onToast, onClearAction }: {
  fragrance: Fragrance;
  expanded: boolean;
  onToggle: () => void;
  onMove: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onToast?: (message: string) => void;
  onClearAction: () => void;
}) {
  const [moving, setMoving] = useState(false);

  return (
    <div className="flex items-center gap-3 p-3 bg-surface border border-border rounded-sm">
      <div className="flex-1 min-w-0">
        <FragranceCard fragrance={f} onClick={onToggle} compact />
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          onClick={async () => {
            setMoving(true);
            const success = await onMove(f.id);
            if (success) onToast?.(`${f.name} zur Sammlung verschoben`);
            setMoving(false);
          }}
          disabled={moving}
          title="Zur Sammlung verschieben"
        >
          {moving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          <span className="hidden sm:inline">Gekauft</span>
        </Button>
        {expanded && (
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              await onDelete(f.id);
              onClearAction();
            }}
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}

export function WishlistPage({ wishlist, onAdd, onMoveToCollection, onDelete, existingIds, onToast }: WishlistPageProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'name-desc' | 'price' | 'price-asc'>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let items = [...wishlist];

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (f) => f.name.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q) || f.notes_text?.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        items.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price':
        items.sort((a, b) => (b.market_price || 0) - (a.market_price || 0));
        break;
      case 'price-asc':
        items.sort((a, b) => (a.market_price || 0) - (b.market_price || 0));
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
                { value: 'name-desc', label: 'Name Z–A' },
                { value: 'price', label: 'Höchster Marktwert' },
                { value: 'price-asc', label: 'Niedrigster Marktwert' },
              ]}
            />
          )}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((f) => (
            <WishlistItem
              key={f.id}
              fragrance={f}
              expanded={actionId === f.id}
              onToggle={() => setActionId(actionId === f.id ? null : f.id)}
              onMove={onMoveToCollection}
              onDelete={onDelete}
              onToast={onToast}
              onClearAction={() => setActionId(null)}
            />
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
