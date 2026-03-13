import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicCollection } from '@/hooks/usePublicCollection';
import { useImageFetch } from '@/hooks/useImageFetch';
import { computeStats } from '@/lib/stats';
import { TierBadge, Badge } from '@/components/common';
import type { Fragrance } from '@/lib/types';
import { Loader2, Droplets, Star, Trophy, TrendingUp } from 'lucide-react';

function PublicCard({ fragrance: f }: { fragrance: Fragrance }) {
  const { resolvedUrl, loading: imgLoading } = useImageFetch(f.name, f.brand, f.image_url, f.id);

  return (
    <div className="flex flex-col bg-surface border border-border rounded overflow-hidden">
      <div className="aspect-[3/4] bg-surface-2 flex items-center justify-center overflow-hidden relative">
        {resolvedUrl ? (
          <img src={resolvedUrl} alt={f.name} loading="lazy" className="w-full h-full object-cover" />
        ) : imgLoading ? (
          <div className="w-full h-full animate-pulse bg-gradient-to-br from-surface-2 via-border to-surface-2" />
        ) : (
          <Droplets size={32} className="text-txt-muted" />
        )}
        {f.tier && (
          <div className="absolute top-2 right-2">
            <TierBadge tier={f.tier} />
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        <div>
          <h3 className="text-sm font-medium text-txt truncate leading-tight">{f.name}</h3>
          <p className="text-xs text-txt-muted truncate">{f.brand}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {f.family !== 'Other' && <Badge>{f.family}</Badge>}
          <Badge>{f.concentration}</Badge>
        </div>
        {f.rating?.overall && (
          <div className="flex items-center gap-1">
            <Star size={12} className="text-gold fill-gold" />
            <span className="text-xs text-txt-dim">{f.rating.overall}/10</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SharePage() {
  const { code } = useParams<{ code: string }>();
  const { fragrances, profile, loading, error } = usePublicCollection(code);
  const stats = useMemo(() => computeStats(fragrances), [fragrances]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-center px-4">
        <Droplets size={48} className="text-txt-muted mb-4" />
        <h1 className="font-display text-2xl text-txt mb-2">Nicht verfügbar</h1>
        <p className="text-sm text-txt-muted">{error}</p>
      </div>
    );
  }

  const displayName = profile?.display_name || 'Sammler';

  return (
    <div className="min-h-screen bg-bg font-body text-txt">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full" />
            )}
            <div>
              <h1 className="font-display text-lg text-txt">{displayName}s Sammlung</h1>
              <p className="text-xs text-txt-muted">{fragrances.length} Düfte</p>
            </div>
          </div>
          <span className="font-display text-sm text-gold-dim tracking-[3px]">FLACON</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        {fragrances.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-8">
            <QuickStat icon={<Droplets size={14} />} value={stats.totalCount} label="Düfte" />
            {stats.avgRating > 0 && (
              <QuickStat icon={<Star size={14} />} value={stats.avgRating.toFixed(1)} label="Ø Bewertung" />
            )}
            {stats.totalPurchaseValue > 0 && (
              <QuickStat icon={<TrendingUp size={14} />} value={`${stats.totalPurchaseValue.toFixed(0)} €`} label="Sammlungswert" />
            )}
            {stats.tierDistribution.filter(t => t.name !== 'Kein Tier').length > 0 && (
              <QuickStat icon={<Trophy size={14} />} value={stats.tierDistribution.filter(t => t.name !== 'Kein Tier').reduce((s, t) => s + t.count, 0)} label="Gerankt" />
            )}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {fragrances.map((f, i) => (
            <div key={f.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
              <PublicCard fragrance={f} />
            </div>
          ))}
        </div>

        {fragrances.length === 0 && (
          <div className="text-center py-16">
            <Droplets size={48} className="text-txt-muted mx-auto mb-4" />
            <p className="text-txt-muted">Diese Sammlung ist noch leer.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-12 mt-8 border-t border-border">
          <p className="font-display text-gold-dim tracking-[4px] text-sm">FLACON</p>
          <p className="text-xs text-txt-muted mt-1">Parfum Sammlung</p>
        </footer>
      </main>
    </div>
  );
}

function QuickStat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-full">
      <span className="text-gold">{icon}</span>
      <span className="text-sm font-semibold text-txt">{value}</span>
      <span className="text-xs text-txt-muted">{label}</span>
    </div>
  );
}
