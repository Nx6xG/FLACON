import { useMemo } from 'react';
import { FragranceCard } from '@/components/Collection/FragranceCard';
import { EmptyState } from '@/components/common';
import type { Fragrance, Tier } from '@/lib/types';
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
}

export function RankingPage({ collection, onSelect }: RankingPageProps) {
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

    // Sort within each tier by tier_rank or overall rating
    groups.forEach((list) => {
      list.sort((a, b) => (a.tier_rank || 999) - (b.tier_rank || 999));
    });

    return groups;
  }, [collection]);

  const unranked = collection.filter((f) => !f.tier);
  const hasAnyRanked = collection.some((f) => f.tier);

  if (!hasAnyRanked) {
    return (
      <div>
        <h1 className="font-display text-3xl font-light text-txt mb-6">
          Tier <em className="text-gold italic">Ranking</em>
        </h1>
        <EmptyState
          icon={<Trophy size={48} />}
          title="Noch keine Rankings"
          description="Öffne ein Parfum in deiner Sammlung und vergib ein Tier (S bis D), um dein persönliches Ranking aufzubauen."
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
          return (
            <div key={tier} className="bg-surface border border-border rounded overflow-hidden">
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
                    <FragranceCard key={f.id} fragrance={f} onClick={() => onSelect(f)} compact />
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-txt-muted">Leer</div>
              )}
            </div>
          );
        })}
      </div>

      {unranked.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-xl text-txt-dim mb-3">
            Noch nicht gerankt ({unranked.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {unranked.map((f) => (
              <FragranceCard key={f.id} fragrance={f} onClick={() => onSelect(f)} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
