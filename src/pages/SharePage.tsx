import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicCollection } from '@/hooks/usePublicCollection';
import { useImageFetch } from '@/hooks/useImageFetch';
import { computeStats } from '@/lib/stats';
import { supabase } from '@/lib/supabase';
import { Modal, TierBadge, Badge, Select, Input, StarRating } from '@/components/common';
import { RadarChart } from '@/components/Rating/RadarChart';
import type { Fragrance, Tier } from '@/lib/types';
import { Loader2, Droplets, Star, Trophy, TrendingUp, Filter, LayoutGrid, Check } from 'lucide-react';

const tierConfig: { tier: Tier; label: string; color: string; description: string }[] = [
  { tier: 'S', label: 'S-Tier', color: '#c9a96e', description: 'Meisterwerke — Holy Grails' },
  { tier: 'A', label: 'A-Tier', color: '#6a9a8a', description: 'Exzellent — Regelmäßig getragen' },
  { tier: 'B', label: 'B-Tier', color: '#7a8aaa', description: 'Solide — Gute Allrounder' },
  { tier: 'C', label: 'C-Tier', color: '#9a9088', description: 'Durchschnitt — Situativ okay' },
  { tier: 'D', label: 'D-Tier', color: '#c47a7a', description: 'Enttäuschend — Selten getragen' },
];

function PublicCard({ fragrance: f, onClick, owned }: { fragrance: Fragrance; onClick: () => void; owned?: boolean }) {
  const { resolvedUrl, loading: imgLoading } = useImageFetch(f.name, f.brand, f.image_url, f.id);

  return (
    <button
      onClick={onClick}
      className="flex flex-col bg-surface border border-border rounded overflow-hidden text-left group hover:border-border-light transition-all"
    >
      <div className="aspect-[3/4] bg-surface-2 flex items-center justify-center overflow-hidden relative">
        {resolvedUrl ? (
          <img src={resolvedUrl} alt={f.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
        {owned && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-accent-fresh/90 flex items-center justify-center" title="Hast du auch">
            <Check size={14} className="text-white" />
          </div>
        )}
        {f.fill_level < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-3">
            <div className="h-full bg-gold/60" style={{ width: `${f.fill_level}%` }} />
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        <div>
          <h3 className="text-sm font-medium text-txt truncate leading-tight group-hover:text-gold transition-colors">{f.name}</h3>
          <p className="text-xs text-txt-muted truncate">{f.brand}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {f.family !== 'Other' && <Badge>{f.family}</Badge>}
          <Badge>{f.concentration}</Badge>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          {f.rating?.overall ? (
            <div className="flex items-center gap-1">
              <Star size={12} className="text-gold fill-gold" />
              <span className="text-xs text-txt-dim">{f.rating.overall}/10</span>
            </div>
          ) : (
            <span />
          )}
          {f.purchase_price != null && (
            <span className="text-[11px] text-txt-muted">{f.purchase_price.toFixed(0)} €</span>
          )}
        </div>
      </div>
    </button>
  );
}

function PublicDetailModal({ fragrance, open, onClose }: { fragrance: Fragrance | null; open: boolean; onClose: () => void }) {
  const { resolvedUrl } = useImageFetch(
    fragrance?.name || '', fragrance?.brand || '', fragrance?.image_url, fragrance?.id
  );

  if (!fragrance) return null;

  return (
    <Modal open={open} onClose={onClose} title={fragrance.name} wide>
      <div className="flex gap-4 mb-6">
        <div className="w-20 h-28 rounded-sm bg-surface-2 flex items-center justify-center overflow-hidden shrink-0">
          {resolvedUrl ? (
            <img src={resolvedUrl} alt={fragrance.name} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <Droplets size={24} className="text-txt-muted" />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-txt-dim">{fragrance.brand}</p>
          <p className="text-xs text-txt-muted">{fragrance.concentration} · {fragrance.family}</p>
          {fragrance.launch_year && (
            <p className="text-xs text-txt-muted">Erscheinungsjahr: {fragrance.launch_year}</p>
          )}
          {fragrance.tier && (
            <div className="mt-1"><TierBadge tier={fragrance.tier} /></div>
          )}
          {fragrance.notes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {fragrance.notes.map((n, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-surface-2 border border-border rounded-full text-txt-muted">
                  {n.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rating */}
      {fragrance.rating && fragrance.rating.overall > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-gold fill-gold" />
            <span className="font-display text-2xl font-bold text-gold">{fragrance.rating.overall}</span>
            <span className="text-sm text-txt-muted">/10</span>
          </div>

          {fragrance.rating.sillage > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
              <RatingBar label="Sillage" value={fragrance.rating.sillage} />
              <RatingBar label="Longevity" value={fragrance.rating.longevity} />
              <RatingBar label="Einzigartigkeit" value={fragrance.rating.uniqueness} />
              <RatingBar label="Preis-Leistung" value={fragrance.rating.value} />
              <RatingBar label="Komplimente" value={fragrance.rating.compliments} />
              <RatingBar label="Vielseitigkeit" value={fragrance.rating.versatility} />
            </div>
          )}

          {fragrance.rating.sillage > 0 && (
            <div className="flex justify-center mt-4">
              <RadarChart rating={fragrance.rating} size={200} />
            </div>
          )}
        </div>
      )}

      {/* Season */}
      {fragrance.season?.length > 0 && fragrance.season[0] !== 'Ganzjährig' && (
        <div className="mt-4">
          <span className="text-xs text-txt-muted uppercase tracking-wider">Saison</span>
          <div className="flex gap-1.5 mt-1">
            {fragrance.season.map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 bg-gold/10 border border-gold/20 rounded-full text-gold">{s}</span>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-txt-muted w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
        <div className="h-full bg-gold rounded-full" style={{ width: `${(value / 10) * 100}%` }} />
      </div>
      <span className="text-xs text-txt font-medium w-5 text-right">{value}</span>
    </div>
  );
}

function TierListCard({ fragrance: f, onClick, owned }: { fragrance: Fragrance; onClick: () => void; owned?: boolean }) {
  const { resolvedUrl } = useImageFetch(f.name, f.brand, f.image_url, f.id);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 bg-surface-2 border border-border rounded-sm p-2 text-left group hover:border-border-light transition-all w-full"
    >
      <div className="w-10 h-14 rounded-sm bg-surface flex items-center justify-center overflow-hidden shrink-0 relative">
        {resolvedUrl ? (
          <img src={resolvedUrl} alt={f.name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <Droplets size={14} className="text-txt-muted" />
        )}
        {owned && (
          <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-accent-fresh/90 flex items-center justify-center">
            <Check size={10} className="text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-txt truncate group-hover:text-gold transition-colors">{f.name}</h3>
        <p className="text-xs text-txt-muted truncate">{f.brand}</p>
      </div>
      {f.rating?.overall ? (
        <div className="flex items-center gap-1 shrink-0">
          <Star size={10} className="text-gold fill-gold" />
          <span className="text-xs text-txt-dim">{f.rating.overall}</span>
        </div>
      ) : null}
    </button>
  );
}

function PublicTierList({ fragrances, onSelect, ownedKeys }: { fragrances: Fragrance[]; onSelect: (f: Fragrance) => void; ownedKeys: Set<string> }) {
  const tierGroups = useMemo(() => {
    const groups = new Map<Tier, Fragrance[]>();
    tierConfig.forEach(({ tier }) => groups.set(tier, []));

    fragrances
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
  }, [fragrances]);

  const hasAnyRanked = fragrances.some((f) => f.tier);

  if (!hasAnyRanked) {
    return (
      <div className="text-center py-16">
        <Trophy size={48} className="text-txt-muted mx-auto mb-4" />
        <p className="text-txt-muted">Noch keine Tier-Rankings vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tierConfig.map(({ tier, label, color, description }) => {
        const items = tierGroups.get(tier) || [];
        if (items.length === 0) return null;

        return (
          <div key={tier} className="bg-surface border border-border rounded overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: `${color}33` }}>
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
            <div className="p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2">
              {items.map((f) => (
                <TierListCard key={f.id} fragrance={f} onClick={() => onSelect(f)} owned={ownedKeys.has(`${f.name.toLowerCase()}::${f.brand.toLowerCase()}`)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SharePage() {
  const { code } = useParams<{ code: string }>();
  const { fragrances, profile, loading, error } = usePublicCollection(code);
  const stats = useMemo(() => computeStats(fragrances), [fragrances]);

  const [selected, setSelected] = useState<Fragrance | null>(null);
  const [tab, setTab] = useState<'collection' | 'tierlist'>('collection');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'rating' | 'price'>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const hasRanked = fragrances.some((f) => f.tier);

  // Load viewer's own collection keys to highlight shared fragrances
  const [ownedKeys, setOwnedKeys] = useState<Set<string>>(new Set());
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('fragrances')
        .select('name, brand')
        .eq('user_id', user.id)
        .eq('is_wishlist', false);
      if (data) {
        setOwnedKeys(new Set(data.map((f: { name: string; brand: string }) => `${f.name.toLowerCase()}::${f.brand.toLowerCase()}`)));
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let items = [...fragrances];

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (f) => f.name.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'name': items.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'rating': items.sort((a, b) => (b.rating?.overall || 0) - (a.rating?.overall || 0)); break;
      case 'price': items.sort((a, b) => (b.purchase_price || 0) - (a.purchase_price || 0)); break;
      default: items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return items;
  }, [fragrances, search, sortBy]);

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

  // Update page title for OG
  if (typeof document !== 'undefined') {
    document.title = `${displayName}s Sammlung — FLACON`;
  }

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
          <div className="flex flex-wrap gap-3 mb-6">
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

        {/* Shared count */}
        {ownedKeys.size > 0 && (() => {
          const sharedCount = fragrances.filter((f) => ownedKeys.has(`${f.name.toLowerCase()}::${f.brand.toLowerCase()}`)).length;
          return sharedCount > 0 ? (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-accent-fresh/10 border border-accent-fresh/20 rounded-sm w-fit">
              <Check size={14} className="text-accent-fresh" />
              <span className="text-sm text-accent-fresh">
                {sharedCount} {sharedCount === 1 ? 'Duft' : 'Düfte'} hast du auch
              </span>
            </div>
          ) : null;
        })()}

        {/* Tabs */}
        {hasRanked && fragrances.length > 0 && (
          <div className="flex gap-1 mb-6 bg-surface border border-border rounded-sm p-1 w-fit">
            <button
              onClick={() => setTab('collection')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm transition-colors ${
                tab === 'collection' ? 'bg-surface-2 text-gold' : 'text-txt-muted hover:text-txt'
              }`}
            >
              <LayoutGrid size={14} />
              Sammlung
            </button>
            <button
              onClick={() => setTab('tierlist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm transition-colors ${
                tab === 'tierlist' ? 'bg-surface-2 text-gold' : 'text-txt-muted hover:text-txt'
              }`}
            >
              <Trophy size={14} />
              Tier Liste
            </button>
          </div>
        )}

        {tab === 'tierlist' && hasRanked ? (
          <PublicTierList fragrances={fragrances} onSelect={setSelected} ownedKeys={ownedKeys} />
        ) : (
          <>
            {/* Search & Sort */}
            {fragrances.length > 3 && (
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex gap-2">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Suchen..."
                    className="flex-1"
                  />
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-3 py-2 border rounded-sm text-sm transition-colors ${showFilters ? 'border-gold-dim text-gold bg-surface' : 'border-border text-txt-muted bg-surface hover:text-txt'}`}
                  >
                    <Filter size={14} />
                  </button>
                </div>
                {showFilters && (
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    options={[
                      { value: 'recent', label: 'Neueste zuerst' },
                      { value: 'name', label: 'Name A–Z' },
                      { value: 'rating', label: 'Beste Bewertung' },
                      { value: 'price', label: 'Höchster Preis' },
                    ]}
                  />
                )}
              </div>
            )}

            {/* Grid */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filtered.map((f) => (
                  <PublicCard key={f.id} fragrance={f} onClick={() => setSelected(f)} owned={ownedKeys.has(`${f.name.toLowerCase()}::${f.brand.toLowerCase()}`)} />
                ))}
              </div>
            ) : search ? (
              <p className="text-center text-txt-muted py-12">Keine Ergebnisse für "{search}".</p>
            ) : (
              <div className="text-center py-16">
                <Droplets size={48} className="text-txt-muted mx-auto mb-4" />
                <p className="text-txt-muted">Diese Sammlung ist noch leer.</p>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="text-center py-12 mt-8 border-t border-border">
          <p className="font-display text-gold-dim tracking-[4px] text-sm">FLACON</p>
          <p className="text-xs text-txt-muted mt-1">Parfum Sammlung</p>
        </footer>
      </main>

      {/* Detail Modal */}
      <PublicDetailModal
        fragrance={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
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
