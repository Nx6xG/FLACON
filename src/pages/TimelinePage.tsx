import { useMemo } from 'react';
import { useImageFetch } from '@/hooks/useImageFetch';
import { TierBadge } from '@/components/common';
import type { Fragrance } from '@/lib/types';
import { Droplets, Calendar } from 'lucide-react';

interface TimelinePageProps {
  collection: Fragrance[];
  onSelect: (f: Fragrance) => void;
}

function TimelineImage({ fragrance }: { fragrance: Fragrance }) {
  const { resolvedUrl } = useImageFetch(fragrance.name, fragrance.brand, fragrance.image_url, fragrance.id);
  return resolvedUrl ? (
    <img src={resolvedUrl} alt={fragrance.name} className="w-full h-full object-cover" />
  ) : (
    <Droplets size={14} className="text-txt-muted" />
  );
}

export function TimelinePage({ collection, onSelect }: TimelinePageProps) {
  // Group by month
  const groups = useMemo(() => {
    const sorted = [...collection].sort(
      (a, b) => new Date(b.purchase_date || b.created_at).getTime() - new Date(a.purchase_date || a.created_at).getTime()
    );

    const map = new Map<string, { label: string; fragrances: Fragrance[]; totalSpent: number }>();

    for (const f of sorted) {
      const dateStr = f.purchase_date || f.created_at;
      const date = new Date(dateStr);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleString('de-DE', { month: 'long', year: 'numeric' });

      if (!map.has(key)) {
        map.set(key, { label, fragrances: [], totalSpent: 0 });
      }
      const group = map.get(key)!;
      group.fragrances.push(f);
      group.totalSpent += f.purchase_price || 0;
    }

    return [...map.entries()].map(([key, group]) => ({ key, ...group }));
  }, [collection]);

  // Running total for cumulative count
  const cumulativeCounts = useMemo(() => {
    let total = collection.length;
    return groups.map((g) => {
      const count = total;
      total -= g.fragrances.length;
      return count;
    });
  }, [groups, collection.length]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-light text-txt">
          Zeit<em className="text-gold italic">leiste</em>
        </h1>
        <p className="text-sm text-txt-muted mt-1">
          Deine Sammlung im Zeitverlauf
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={48} className="mx-auto text-txt-muted mb-3" />
          <p className="text-txt-muted">Keine Düfte mit Datum vorhanden</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

          {groups.map((group, gi) => (
            <div key={group.key} className="relative mb-8">
              {/* Month header */}
              <div className="flex items-center gap-3 mb-4 relative">
                <div className="w-12 h-12 rounded-full bg-surface border-2 border-gold/30 flex items-center justify-center z-10 shrink-0">
                  <span className="text-xs text-gold font-semibold">{cumulativeCounts[gi]}</span>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-txt capitalize">{group.label}</h2>
                  <p className="text-[10px] text-txt-muted">
                    {group.fragrances.length} {group.fragrances.length === 1 ? 'Duft' : 'Düfte'}
                    {group.totalSpent > 0 && ` · ${group.totalSpent.toFixed(0)} €`}
                  </p>
                </div>
              </div>

              {/* Fragrance cards */}
              <div className="ml-14 space-y-2">
                {group.fragrances.map((f) => {
                  const pricePerMl = f.purchase_price && f.size_ml ? (f.purchase_price / f.size_ml).toFixed(2) : null;
                  return (
                    <button
                      key={f.id}
                      onClick={() => onSelect(f)}
                      className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg hover:border-gold-dim transition-all text-left w-full group"
                    >
                      <div className="w-10 h-14 rounded-sm bg-surface-2 overflow-hidden shrink-0 flex items-center justify-center">
                        <TimelineImage fragrance={f} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-txt truncate group-hover:text-gold transition-colors">
                          {f.name}
                        </p>
                        <p className="text-xs text-txt-muted truncate">{f.brand} · {f.concentration}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {f.tier && <TierBadge tier={f.tier} />}
                        {f.purchase_price != null && (
                          <span className="text-[10px] text-txt-muted tabular-nums">
                            {f.purchase_price.toFixed(0)} €
                            {pricePerMl && <span className="text-txt-muted/50"> · {pricePerMl} €/ml</span>}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
