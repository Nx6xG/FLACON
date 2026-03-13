import { useMemo } from 'react';
import { useImageFetch } from '@/hooks/useImageFetch';
import { TierBadge } from '@/components/common';
import type { Fragrance, Season } from '@/lib/types';
import { Sparkles, Star, Droplets } from 'lucide-react';

function getCurrentSeason(): Season {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'Frühling';
  if (month >= 5 && month <= 7) return 'Sommer';
  if (month >= 8 && month <= 10) return 'Herbst';
  return 'Winter';
}

function pickFragrance(collection: Fragrance[]): Fragrance | null {
  if (collection.length === 0) return null;

  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );

  const currentSeason = getCurrentSeason();

  // Score each fragrance for today
  const scored = collection.map((f, idx) => {
    let score = 0;

    // Season match
    if (f.season?.includes(currentSeason) || f.season?.includes('Ganzjährig')) {
      score += 3;
    }

    // Higher rated = more likely
    if (f.rating?.overall) {
      score += f.rating.overall * 0.5;
    }

    // Higher fill = more likely (use what you have)
    score += (f.fill_level / 100) * 2;

    // Deterministic daily "randomness" based on day + index
    const hash = ((dayOfYear * 7919 + idx * 104729) % 1000) / 1000;
    score += hash * 4;

    return { fragrance: f, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].fragrance;
}

interface Props {
  collection: Fragrance[];
  onClick: (f: Fragrance) => void;
}

export function FragranceOfTheDay({ collection, onClick }: Props) {
  const pick = useMemo(() => pickFragrance(collection), [collection]);

  if (!pick) return null;

  return <DayCard fragrance={pick} onClick={() => onClick(pick)} />;
}

function DayCard({ fragrance: f, onClick }: { fragrance: Fragrance; onClick: () => void }) {
  const { resolvedUrl } = useImageFetch(f.name, f.brand, f.image_url, f.id);
  const currentSeason = getCurrentSeason();

  return (
    <button
      onClick={onClick}
      className="w-full mb-6 bg-gradient-to-r from-gold/8 via-surface to-surface border border-gold/15 rounded-lg p-4 flex items-center gap-4 text-left group hover:border-gold/30 transition-all"
    >
      <div className="w-14 h-20 rounded-sm bg-surface-2 flex items-center justify-center overflow-hidden shrink-0">
        {resolvedUrl ? (
          <img src={resolvedUrl} alt={f.name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <Droplets size={18} className="text-txt-muted" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles size={12} className="text-gold" />
          <span className="text-[10px] text-gold uppercase tracking-wider font-semibold">Duft des Tages</span>
          <span className="text-[10px] text-txt-muted">· {currentSeason}</span>
        </div>
        <p className="text-sm font-medium text-txt truncate group-hover:text-gold transition-colors">{f.name}</p>
        <p className="text-xs text-txt-muted truncate">{f.brand} · {f.concentration}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {f.tier && <TierBadge tier={f.tier} />}
        {f.rating?.overall && (
          <div className="flex items-center gap-1">
            <Star size={10} className="text-gold fill-gold" />
            <span className="text-xs text-gold">{f.rating.overall}</span>
          </div>
        )}
      </div>
    </button>
  );
}
