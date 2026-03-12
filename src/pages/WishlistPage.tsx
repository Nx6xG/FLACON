import { useState } from 'react';
import { FragranceCard } from '@/components/Collection/FragranceCard';
import { AddFragranceModal } from '@/components/Search/AddFragranceModal';
import { Button, EmptyState } from '@/components/common';
import type { Fragrance, FragranceInput } from '@/lib/types';
import { Heart, Plus, ArrowRight, Trash2 } from 'lucide-react';

interface WishlistPageProps {
  wishlist: Fragrance[];
  onAdd: (input: FragranceInput) => Promise<any>;
  onMoveToCollection: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  apiKey?: string | null;
}

export function WishlistPage({ wishlist, onAdd, onMoveToCollection, onDelete, apiKey }: WishlistPageProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

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

      {wishlist.length > 0 ? (
        <div className="space-y-2">
          {wishlist.map((f) => (
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
      ) : (
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
      )}

      <AddFragranceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={onAdd}
        apiKey={apiKey}
        isWishlist
      />
    </div>
  );
}
