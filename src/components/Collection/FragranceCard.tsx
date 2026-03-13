import type { Fragrance } from '@/lib/types';
import { StarRating, TierBadge, Badge } from '@/components/common';
import { useImageFetch } from '@/hooks/useImageFetch';
import { Droplets, Loader2 } from 'lucide-react';

const familyColors: Record<string, string> = {
  Oriental: '#c49a5a',
  Woody: '#8a6a4a',
  Floral: '#a47a9a',
  Fresh: '#6a9a8a',
  Citrus: '#baa44a',
  Aquatic: '#6a8aaa',
  Gourmand: '#c47a7a',
  Fougère: '#7a9a6a',
  Chypre: '#9a8a6a',
  Aromatic: '#7aaa8a',
  Leather: '#8a6a5a',
  Oud: '#7a5a4a',
  Other: '#9a9088',
};

interface FragranceCardProps {
  fragrance: Fragrance;
  onClick: () => void;
  compact?: boolean;
}

export function FragranceCard({ fragrance, onClick, compact }: FragranceCardProps) {
  const { name, brand, concentration, family, image_url, rating, tier, fill_level, purchase_price, size_ml } = fragrance;
  const { resolvedUrl, loading: imageLoading } = useImageFetch(name, brand, image_url, fragrance.id);

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-3 p-3 bg-surface border border-border rounded-sm hover:border-border-light transition-all text-left w-full group"
      >
        <div className="w-10 h-14 rounded-sm bg-surface-2 flex items-center justify-center overflow-hidden shrink-0">
          {resolvedUrl ? (
            <img src={resolvedUrl} alt={name} className="w-full h-full object-cover" />
          ) : imageLoading ? (
            <Loader2 size={14} className="text-txt-muted animate-spin" />
          ) : (
            <Droplets size={16} className="text-txt-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-txt truncate group-hover:text-gold transition-colors">{name}</p>
          <p className="text-xs text-txt-muted truncate">{brand}</p>
        </div>
        {tier && <TierBadge tier={tier} />}
        {rating?.overall && (
          <span className="text-sm text-gold font-display font-semibold">{rating.overall}</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col bg-surface border border-border rounded hover:border-border-light transition-all text-left group overflow-hidden"
    >
      {/* Image */}
      <div className="aspect-[3/4] bg-surface-2 flex items-center justify-center overflow-hidden relative">
        {resolvedUrl ? (
          <img src={resolvedUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : imageLoading ? (
          <Loader2 size={24} className="text-txt-muted animate-spin" />
        ) : (
          <Droplets size={32} className="text-txt-muted" />
        )}

        {/* Tier badge overlay */}
        {tier && (
          <div className="absolute top-2 right-2">
            <TierBadge tier={tier} />
          </div>
        )}

        {/* Fill level bar */}
        {fill_level < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-3">
            <div
              className="h-full bg-gold/60 transition-all"
              style={{ width: `${fill_level}%` }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5">
        <div>
          <h3 className="text-sm font-medium text-txt truncate group-hover:text-gold transition-colors leading-tight">
            {name}
          </h3>
          <p className="text-xs text-txt-muted truncate">{brand}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge color={familyColors[family]}>{family}</Badge>
          <Badge>{concentration}</Badge>
        </div>

        <div className="flex items-center justify-between mt-1">
          {rating?.overall ? (
            <StarRating value={rating.overall} size="sm" />
          ) : (
            <span className="text-xs text-txt-muted italic">Nicht bewertet</span>
          )}

          {purchase_price != null && size_ml != null && (
            <span className="text-[11px] text-txt-muted tabular-nums">
              {(purchase_price / size_ml).toFixed(2)} €/ml
            </span>
          )}
        </div>
      </div>
    </button>
  );
}