import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useImageFetch } from '@/hooks/useImageFetch';
import { Button, Input, TierBadge, Badge } from '@/components/common';
import type { Fragrance } from '@/lib/types';
import { Loader2, Droplets, Star, Users, Check, X as XIcon, ArrowLeftRight } from 'lucide-react';

interface CollectionData {
  fragrances: Fragrance[];
  name: string;
  avatar: string | null;
}

async function loadCollection(code: string): Promise<CollectionData | null> {
  const { data: share } = await supabase
    .from('public_shares')
    .select('user_id')
    .eq('share_code', code.trim())
    .eq('enabled', true)
    .maybeSingle();

  if (!share) return null;

  const [{ data: items }, { data: prof }] = await Promise.all([
    supabase
      .from('fragrances')
      .select('*')
      .eq('user_id', share.user_id)
      .eq('is_wishlist', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', share.user_id)
      .maybeSingle(),
  ]);

  return {
    fragrances: (items as Fragrance[]) || [],
    name: prof?.display_name || 'Sammler',
    avatar: prof?.avatar_url || null,
  };
}

function MiniImage({ fragrance: f }: { fragrance: Fragrance }) {
  const { resolvedUrl } = useImageFetch(f.name, f.brand, f.image_url, f.id);
  return resolvedUrl ? (
    <img src={resolvedUrl} alt={f.name} className="w-full h-full object-cover" />
  ) : (
    <Droplets size={12} className="text-txt-muted" />
  );
}

function FragranceRow({ fragrance: f }: { fragrance: Fragrance }) {
  return (
    <div className="flex items-center gap-2.5 p-2 rounded-sm hover:bg-surface-2 transition-colors">
      <div className="w-8 h-11 rounded-sm bg-surface-2 overflow-hidden shrink-0 flex items-center justify-center">
        <MiniImage fragrance={f} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-txt truncate">{f.name}</p>
        <p className="text-[10px] text-txt-muted truncate">{f.brand} · {f.concentration}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {f.tier && <TierBadge tier={f.tier} />}
        {f.rating?.overall ? (
          <div className="flex items-center gap-0.5">
            <Star size={10} className="text-gold fill-gold" />
            <span className="text-[11px] text-gold">{f.rating.overall}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CompareCollectionsPage() {
  const [codeA, setCodeA] = useState('');
  const [codeB, setCodeB] = useState('');
  const [collA, setCollA] = useState<CollectionData | null>(null);
  const [collB, setCollB] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCompare = async () => {
    if (!codeA.trim() || !codeB.trim()) return;
    setLoading(true);
    setError('');
    setCollA(null);
    setCollB(null);

    const [a, b] = await Promise.all([
      loadCollection(codeA),
      loadCollection(codeB),
    ]);

    if (!a || !b) {
      setError(!a && !b ? 'Beide Codes ungültig' : !a ? 'Code A ungültig' : 'Code B ungültig');
    } else {
      setCollA(a);
      setCollB(b);
    }
    setLoading(false);
  };

  // Match by name+brand (case insensitive)
  const { shared, onlyA, onlyB } = useMemo(() => {
    if (!collA || !collB) return { shared: [], onlyA: [], onlyB: [] };

    const keyOf = (f: Fragrance) => `${f.name.toLowerCase()}::${f.brand.toLowerCase()}`;
    const keysB = new Set(collB.fragrances.map(keyOf));
    const keysA = new Set(collA.fragrances.map(keyOf));

    const shared: { a: Fragrance; b: Fragrance }[] = [];
    const onlyA: Fragrance[] = [];

    for (const f of collA.fragrances) {
      const key = keyOf(f);
      if (keysB.has(key)) {
        const match = collB.fragrances.find((fb) => keyOf(fb) === key);
        if (match) shared.push({ a: f, b: match });
      } else {
        onlyA.push(f);
      }
    }

    const onlyB = collB.fragrances.filter((f) => !keysA.has(keyOf(f)));

    return { shared, onlyA, onlyB };
  }, [collA, collB]);

  const statsA = collA ? {
    count: collA.fragrances.length,
    avgRating: collA.fragrances.filter((f) => f.rating?.overall).reduce((s, f) => s + (f.rating?.overall || 0), 0) / (collA.fragrances.filter((f) => f.rating?.overall).length || 1),
    value: collA.fragrances.reduce((s, f) => s + (f.purchase_price || 0), 0),
    brands: new Set(collA.fragrances.map((f) => f.brand)).size,
  } : null;

  const statsB = collB ? {
    count: collB.fragrances.length,
    avgRating: collB.fragrances.filter((f) => f.rating?.overall).reduce((s, f) => s + (f.rating?.overall || 0), 0) / (collB.fragrances.filter((f) => f.rating?.overall).length || 1),
    value: collB.fragrances.reduce((s, f) => s + (f.purchase_price || 0), 0),
    brands: new Set(collB.fragrances.map((f) => f.brand)).size,
  } : null;

  return (
    <div className="min-h-screen bg-bg font-body text-txt">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-lg text-txt">Sammlungs<em className="text-gold italic">vergleich</em></h1>
          <span className="font-display text-sm text-gold-dim tracking-[3px]">FLACON</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Input */}
        <div className="bg-surface border border-border rounded-lg p-4 mb-8">
          <p className="text-xs text-txt-muted uppercase tracking-wider mb-3">Share-Codes eingeben</p>
          <div className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 sm:items-end mb-4">
            <Input
              label="Sammlung A"
              value={codeA}
              onChange={(e) => setCodeA(e.target.value)}
              placeholder="abc12xyz"
            />
            <div className="flex justify-center sm:pb-2">
              <ArrowLeftRight size={16} className="text-txt-muted rotate-90 sm:rotate-0" />
            </div>
            <Input
              label="Sammlung B"
              value={codeB}
              onChange={(e) => setCodeB(e.target.value)}
              placeholder="def34uvw"
            />
          </div>
          <Button onClick={handleCompare} disabled={loading || !codeA.trim() || !codeB.trim()}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
            Vergleichen
          </Button>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>

        {collA && collB && (
          <div className="space-y-6">
            {/* Headers */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {[{ coll: collA, stats: statsA }, { coll: collB, stats: statsB }].map(({ coll, stats }, idx) => (
                <div key={idx} className="bg-surface border border-border rounded-lg p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {coll.avatar && <img src={coll.avatar} alt="" className="w-6 h-6 rounded-full" />}
                    <span className="text-sm font-medium text-txt">{coll.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <p className="text-lg font-display text-gold">{stats?.count}</p>
                      <p className="text-[9px] text-txt-muted uppercase">Düfte</p>
                    </div>
                    <div>
                      <p className="text-lg font-display text-gold">{stats?.brands}</p>
                      <p className="text-[9px] text-txt-muted uppercase">Marken</p>
                    </div>
                    <div>
                      <p className="text-lg font-display text-gold">{stats && stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}</p>
                      <p className="text-[9px] text-txt-muted uppercase">Ø Rating</p>
                    </div>
                    <div>
                      <p className="text-lg font-display text-gold">{stats && stats.value > 0 ? `${stats.value.toFixed(0)}€` : '—'}</p>
                      <p className="text-[9px] text-txt-muted uppercase">Wert</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Overlap summary */}
            <div className="bg-surface border border-gold/15 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-6">
                <div>
                  <p className="text-2xl font-display text-gold">{shared.length}</p>
                  <p className="text-[10px] text-txt-muted uppercase tracking-wider">Gemeinsam</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <p className="text-2xl font-display text-txt-dim">{onlyA.length}</p>
                  <p className="text-[10px] text-txt-muted uppercase tracking-wider">Nur {collA.name}</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <p className="text-2xl font-display text-txt-dim">{onlyB.length}</p>
                  <p className="text-[10px] text-txt-muted uppercase tracking-wider">Nur {collB.name}</p>
                </div>
              </div>
              {shared.length > 0 && collA.fragrances.length > 0 && collB.fragrances.length > 0 && (
                <p className="text-xs text-txt-muted mt-3">
                  {Math.round((shared.length / Math.min(collA.fragrances.length, collB.fragrances.length)) * 100)}% Übereinstimmung
                </p>
              )}
            </div>

            {/* Shared fragrances with rating comparison */}
            {shared.length > 0 && (
              <div className="bg-surface border border-border rounded-lg p-4">
                <h2 className="text-xs text-txt-muted uppercase tracking-wider mb-3">
                  <Check size={12} className="inline text-green-400 mr-1" />
                  Gemeinsame Düfte ({shared.length})
                </h2>
                <div className="space-y-1">
                  {shared.map(({ a, b }) => (
                    <div key={a.id} className="flex items-center gap-2 p-2 rounded-sm hover:bg-surface-2 transition-colors">
                      <div className="w-7 h-10 rounded-sm bg-surface-2 overflow-hidden shrink-0 flex items-center justify-center">
                        <MiniImage fragrance={a} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-txt truncate">{a.name}</p>
                        <p className="text-[10px] text-txt-muted">{a.brand}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {a.rating?.overall ? (
                          <span className="text-xs text-gold tabular-nums">{a.rating.overall}</span>
                        ) : (
                          <span className="text-xs text-txt-muted">—</span>
                        )}
                        <span className="text-[10px] text-txt-muted">vs</span>
                        {b.rating?.overall ? (
                          <span className="text-xs text-blue-400 tabular-nums">{b.rating.overall}</span>
                        ) : (
                          <span className="text-xs text-txt-muted">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Only A */}
            {onlyA.length > 0 && (
              <div className="bg-surface border border-border rounded-lg p-4">
                <h2 className="text-xs text-txt-muted uppercase tracking-wider mb-3">
                  Nur bei {collA.name} ({onlyA.length})
                </h2>
                <div className="space-y-0.5">
                  {onlyA.map((f) => <FragranceRow key={f.id} fragrance={f} />)}
                </div>
              </div>
            )}

            {/* Only B */}
            {onlyB.length > 0 && (
              <div className="bg-surface border border-border rounded-lg p-4">
                <h2 className="text-xs text-txt-muted uppercase tracking-wider mb-3">
                  Nur bei {collB.name} ({onlyB.length})
                </h2>
                <div className="space-y-0.5">
                  {onlyB.map((f) => <FragranceRow key={f.id} fragrance={f} />)}
                </div>
              </div>
            )}

            {/* Shared brands */}
            {(() => {
              const brandsA = new Set(collA.fragrances.map((f) => f.brand));
              const brandsB = new Set(collB.fragrances.map((f) => f.brand));
              const sharedBrands = [...brandsA].filter((b) => brandsB.has(b)).sort();
              if (sharedBrands.length === 0) return null;
              return (
                <div className="bg-surface border border-border rounded-lg p-4">
                  <h2 className="text-xs text-txt-muted uppercase tracking-wider mb-3">
                    Gemeinsame Marken ({sharedBrands.length})
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {sharedBrands.map((b) => (
                      <span key={b} className="text-xs px-2 py-0.5 bg-gold/10 border border-gold/20 rounded-full text-gold">{b}</span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {!collA && !collB && !loading && (
          <div className="text-center py-16">
            <Users size={48} className="mx-auto text-txt-muted mb-3" />
            <p className="text-txt-muted">Gib zwei Share-Codes ein um Sammlungen zu vergleichen</p>
            <p className="text-xs text-txt-muted mt-1">Die Codes findest du in den Share-Links: flacon.app/share/<strong>code</strong></p>
          </div>
        )}

        <footer className="text-center py-12 mt-8 border-t border-border">
          <p className="font-display text-gold-dim tracking-[4px] text-sm">FLACON</p>
        </footer>
      </main>
    </div>
  );
}
