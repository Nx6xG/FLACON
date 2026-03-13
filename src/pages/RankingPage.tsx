import { useMemo, useState, useRef } from 'react';
import { FragranceCard } from '@/components/Collection/FragranceCard';
import { EmptyState } from '@/components/common';
import type { Fragrance, Tier, FragranceInput } from '@/lib/types';
import { Trophy } from 'lucide-react';

const tierConfig: { tier: Tier; label: string; color: string; description: string }[] = [
  { tier: 'S', label: 'S-Tier', color: '#c9a96e', description: 'Meisterwerke — Holy Grails' },
  { tier: 'A', label: 'A-Tier', color: '#6a9a8a', description: 'Exzellent — Regelmäßig getragen' },
  { tier: 'B', label: 'B-Tier', color: '#7a8aaa', description: 'Solide — Gute Allrounder' },
  { tier: 'C', label: 'C-Tier', color: '#9a9088', description: 'Durchschnitt — Situativ okay' },
  { tier: 'D', label: 'D-Tier', color: '#c47a7a', description: 'Enttäuschend — Selten getragen' },
];

interface RankingPageProps {
  collection: Fragrance[];
  onSelect: (fragrance: Fragrance) => void;
  onUpdate: (id: string, updates: Partial<FragranceInput>) => Promise<boolean>;
}

export function RankingPage({ collection, onSelect, onUpdate }: RankingPageProps) {
  const [dragOverTier, setDragOverTier] = useState<Tier | null>(null);
  const dragItemId = useRef<string | null>(null);

  const tierGroups = useMemo(() => {
    const groups = new Map<Tier, Fragrance[]>();
    tierConfig.forEach(({ tier }) => groups.set(tier, []));

    collection
      .filter((f) => f.tier)
      .forEach((f) => {
        const list = groups.get(f.tier!) || [];
        list.push(f);
        groups.set(f.tier!, list);
      });

    groups.forEach((list) => {
      list.sort((a, b) => (a.tier_rank || 999) - (b.tier_rank || 999));
    });

    return groups;
  }, [collection]);

  const unranked = collection.filter((f) => !f.tier);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragItemId.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, tier: Tier) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTier(tier);
  };

  const handleDragLeave = () => {
    setDragOverTier(null);
  };

  const handleDrop = async (e: React.DragEvent, tier: Tier) => {
    e.preventDefault();
    setDragOverTier(null);
    const id = dragItemId.current;
    dragItemId.current = null;
    if (!id) return;

    const fragrance = collection.find((f) => f.id === id);
    if (!fragrance || fragrance.tier === tier) return;

    const tierItems = tierGroups.get(tier) || [];
    await onUpdate(id, { tier, tier_rank: tierItems.length + 1 });
  };

  // Empty state only when nothing is ranked AND nothing to rank
  if (collection.length === 0) {
    return (
      <div>
        <h1 className="font-display text-3xl font-light text-txt mb-6">
          Tier <em className="text-gold italic">Ranking</em>
        </h1>
        <EmptyState
          icon={<Trophy size={48} />}
          title="Noch keine Rankings"
          description="Füge Parfums zu deiner Sammlung hinzu, um sie in Tiers einzuordnen."
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-light text-txt mb-6">
        Tier <em className="text-gold italic">Ranking</em>
      </h1>

      <div className="space-y-6">
        {tierConfig.map(({ tier, label, color, description }) => {
          const items = tierGroups.get(tier) || [];
          const isOver = dragOverTier === tier;
          return (
            <div
              key={tier}
              className={`bg-surface border rounded overflow-hidden transition-all ${
                isOver ? 'border-gold ring-1 ring-gold/30' : 'border-border'
              }`}
              onDragOver={(e) => handleDragOver(e, tier)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, tier)}
            >
              <div
                className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: `${color}33` }}
              >
                <span
                  className="w-10 h-10 rounded-sm flex items-center justify-center text-lg font-bold font-body"
                  style={{
                    backgroundColor: `${color}22`,
                    color,
                    border: `1px solid ${color}44`,
                  }}
                >
                  {tier}
                </span>
                <div>
                  <p className="text-sm font-medium" style={{ color }}>{label}</p>
                  <p className="text-xs text-txt-muted">{description}</p>
                </div>
                <span className="ml-auto text-sm text-txt-muted tabular-nums">{items.length}</span>
              </div>

              {items.length > 0 ? (
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {items.map((f) => (
                    <div
                      key={f.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, f.id)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <FragranceCard fragrance={f} onClick={() => onSelect(f)} compact />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`p-4 text-center text-sm transition-colors ${
                  isOver ? 'text-gold' : 'text-txt-muted'
                }`}>
                  {isOver ? 'Hier ablegen' : 'Leer'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {unranked.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-xl text-txt-dim mb-1">
            Noch nicht gerankt ({unranked.length})
          </h2>
          <p className="text-xs text-txt-muted mb-3">Ziehe Parfums in einen Tier, um sie einzuordnen</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {unranked.map((f) => (
              <div
                key={f.id}
                draggable
                onDragStart={(e) => handleDragStart(e, f.id)}
                className="cursor-grab active:cursor-grabbing"
              >
                <FragranceCard fragrance={f} onClick={() => onSelect(f)} compact />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
