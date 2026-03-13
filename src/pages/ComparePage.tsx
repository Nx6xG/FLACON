import { useState, useMemo } from 'react';
import { Select, TierBadge } from '@/components/common';
import { RadarChart } from '@/components/Rating/RadarChart';
import { useImageFetch } from '@/hooks/useImageFetch';
import type { Fragrance, RatingDetails, FragranceNote, Season } from '@/lib/types';
import { Droplets, ArrowLeftRight, Trophy, Star, Ruler, DollarSign } from 'lucide-react';

interface ComparePageProps {
  collection: Fragrance[];
}

function CompareImage({ fragrance }: { fragrance: Fragrance }) {
  const { resolvedUrl } = useImageFetch(fragrance.name, fragrance.brand, fragrance.image_url, fragrance.id);
  return resolvedUrl ? (
    <img src={resolvedUrl} alt={fragrance.name} className="w-full h-full object-cover" />
  ) : (
    <Droplets size={24} className="text-txt-muted" />
  );
}

function RatingBar({ label, valA, valB }: { label: string; valA: number; valB: number }) {
  const maxVal = 10;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-txt-muted uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-3 text-xs tabular-nums">
          <span className={valA >= valB && valA > 0 ? 'text-gold font-semibold' : 'text-txt-dim'}>{valA || '—'}</span>
          <span className="text-txt-muted/40">vs</span>
          <span className={valB >= valA && valB > 0 ? 'text-blue-400 font-semibold' : 'text-txt-dim'}>{valB || '—'}</span>
        </div>
      </div>
      <div className="flex gap-1 h-1.5">
        <div className="flex-1 bg-surface-2 rounded-full overflow-hidden">
          <div className="h-full bg-gold/70 rounded-full transition-all" style={{ width: `${(valA / maxVal) * 100}%` }} />
        </div>
        <div className="flex-1 bg-surface-2 rounded-full overflow-hidden">
          <div className="h-full bg-blue-400/70 rounded-full transition-all" style={{ width: `${(valB / maxVal) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

const layerConfig = {
  top: { label: 'Kopf', color: 'text-accent-citrus', bg: 'bg-accent-citrus/10', border: 'border-accent-citrus/20' },
  middle: { label: 'Herz', color: 'text-accent-floral', bg: 'bg-accent-floral/10', border: 'border-accent-floral/20' },
  base: { label: 'Basis', color: 'text-accent-oud', bg: 'bg-accent-oud/10', border: 'border-accent-oud/20' },
} as const;

function NotesSideBySide({ notesA, notesB, nameA, nameB }: { notesA: FragranceNote[]; notesB: FragranceNote[]; nameA: string; nameB: string }) {
  const aNames = new Set(notesA.map((n) => n.name.toLowerCase()));
  const bNames = new Set(notesB.map((n) => n.name.toLowerCase()));
  const layers: ('top' | 'middle' | 'base')[] = ['top', 'middle', 'base'];

  return (
    <div className="space-y-3">
      {layers.map((layer) => {
        const aNotes = notesA.filter((n) => n.layer === layer);
        const bNotes = notesB.filter((n) => n.layer === layer);
        if (aNotes.length === 0 && bNotes.length === 0) return null;
        const cfg = layerConfig[layer];
        return (
          <div key={layer}>
            <span className={`text-[9px] uppercase tracking-wider font-semibold ${cfg.color}`}>{cfg.label}</span>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="flex flex-wrap gap-1">
                {aNotes.map((n, i) => {
                  const shared = bNames.has(n.name.toLowerCase());
                  return (
                    <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                      shared ? 'bg-gold/15 border-gold/30 text-gold' : `${cfg.bg} ${cfg.border} ${cfg.color}`
                    }`}>{n.name}</span>
                  );
                })}
                {aNotes.length === 0 && <span className="text-[10px] text-txt-muted italic">—</span>}
              </div>
              <div className="flex flex-wrap gap-1">
                {bNotes.map((n, i) => {
                  const shared = aNames.has(n.name.toLowerCase());
                  return (
                    <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                      shared ? 'bg-gold/15 border-gold/30 text-gold' : `${cfg.bg} ${cfg.border} ${cfg.color}`
                    }`}>{n.name}</span>
                  );
                })}
                {bNotes.length === 0 && <span className="text-[10px] text-txt-muted italic">—</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SeasonCompare({ seasonsA, seasonsB }: { seasonsA: Season[]; seasonsB: Season[] }) {
  const all: Season[] = ['Frühling', 'Sommer', 'Herbst', 'Winter'];
  return (
    <div className="grid grid-cols-2 gap-3">
      {[seasonsA, seasonsB].map((seasons, idx) => (
        <div key={idx} className="flex flex-wrap gap-1.5">
          {seasons.includes('Ganzjährig') ? (
            <span className="text-[10px] px-2 py-0.5 bg-gold/10 border border-gold/20 rounded-full text-gold">Ganzjährig</span>
          ) : (
            all.map((s) => {
              const active = seasons.includes(s);
              return (
                <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  active ? 'bg-gold/10 border-gold/20 text-gold' : 'bg-surface-2 border-border text-txt-muted/40'
                }`}>{s}</span>
              );
            })
          )}
        </div>
      ))}
    </div>
  );
}

function InfoRow({ label, valueA, valueB, highlight }: { label: string; valueA: string; valueB: string; highlight?: 'a' | 'b' | null }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5">
      <span className={`text-sm text-right tabular-nums ${highlight === 'a' ? 'text-gold font-semibold' : 'text-txt'}`}>{valueA}</span>
      <span className="text-[10px] text-txt-muted uppercase tracking-wider min-w-[80px] text-center">{label}</span>
      <span className={`text-sm tabular-nums ${highlight === 'b' ? 'text-gold font-semibold' : 'text-txt'}`}>{valueB}</span>
    </div>
  );
}

export function ComparePage({ collection }: ComparePageProps) {
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');

  const fragA = collection.find((f) => f.id === idA) || null;
  const fragB = collection.find((f) => f.id === idB) || null;

  const options = useMemo(
    () => [
      { value: '', label: 'Duft wählen...' },
      ...collection.map((f) => ({ value: f.id, label: `${f.name} — ${f.brand}` })),
    ],
    [collection]
  );

  const ppmA = fragA?.purchase_price && fragA?.size_ml ? fragA.purchase_price / fragA.size_ml : null;
  const ppmB = fragB?.purchase_price && fragB?.size_ml ? fragB.purchase_price / fragB.size_ml : null;

  const sharedNoteCount = useMemo(() => {
    if (!fragA || !fragB) return 0;
    const aNotes = new Set(fragA.notes.map((n) => n.name.toLowerCase()));
    return fragB.notes.filter((n) => aNotes.has(n.name.toLowerCase())).length;
  }, [fragA, fragB]);

  const ratingKeys: { key: keyof RatingDetails; label: string }[] = [
    { key: 'overall', label: 'Gesamt' },
    { key: 'sillage', label: 'Sillage' },
    { key: 'longevity', label: 'Longevity' },
    { key: 'uniqueness', label: 'Einzigartigkeit' },
    { key: 'value', label: 'Preis-Leistung' },
    { key: 'compliments', label: 'Komplimente' },
    { key: 'versatility', label: 'Vielseitigkeit' },
  ];

  // Score who "wins"
  const scoreA = useMemo(() => {
    if (!fragA?.rating || !fragB?.rating) return 0;
    return ratingKeys.reduce((sum, { key }) => {
      const a = fragA.rating?.[key] || 0;
      const b = fragB.rating?.[key] || 0;
      return sum + (a > b ? 1 : a < b ? -1 : 0);
    }, 0);
  }, [fragA, fragB]);

  const higherNum = (a: number | null, b: number | null): 'a' | 'b' | null => {
    if (a == null || b == null) return null;
    return a > b ? 'a' : b > a ? 'b' : null;
  };
  const lowerNum = (a: number | null, b: number | null): 'a' | 'b' | null => {
    if (a == null || b == null) return null;
    return a < b ? 'a' : b < a ? 'b' : null;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-light text-txt">
          Duft<em className="text-gold italic">vergleich</em>
        </h1>
        <p className="text-sm text-txt-muted mt-1">Vergleiche zwei Düfte aus deiner Sammlung</p>
      </div>

      {/* Selection */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 mb-8 items-end">
        <Select
          label="Duft A"
          value={idA}
          onChange={(e) => setIdA(e.target.value)}
          options={options}
        />
        <div className="pb-2">
          <button
            onClick={() => { setIdA(idB); setIdB(idA); }}
            className="p-2 text-txt-muted hover:text-gold transition-colors"
            title="Tauschen"
          >
            <ArrowLeftRight size={18} />
          </button>
        </div>
        <Select
          label="Duft B"
          value={idB}
          onChange={(e) => setIdB(e.target.value)}
          options={options}
        />
      </div>

      {fragA && fragB ? (
        <div className="space-y-4">
          {/* Header cards */}
          <div className="grid grid-cols-2 gap-4">
            {[fragA, fragB].map((f, idx) => {
              const ppm = f.purchase_price && f.size_ml ? (f.purchase_price / f.size_ml).toFixed(2) : null;
              return (
                <div key={f.id} className={`bg-surface border rounded-lg p-4 flex flex-col items-center text-center ${
                  idx === 0 ? 'border-gold/20' : 'border-blue-400/20'
                }`}>
                  <div className="w-20 h-28 rounded-sm bg-surface-2 flex items-center justify-center overflow-hidden mb-3">
                    <CompareImage fragrance={f} />
                  </div>
                  <h3 className="text-sm font-medium text-txt">{f.name}</h3>
                  <p className="text-xs text-txt-muted">{f.brand}</p>
                  <p className="text-[10px] text-txt-muted mt-1">{f.concentration} · {f.family !== 'Other' ? f.family : '—'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {f.tier && <TierBadge tier={f.tier} />}
                    {f.rating?.overall ? (
                      <div className="flex items-center gap-0.5">
                        <Star size={10} className="text-gold fill-gold" />
                        <span className="text-xs text-gold font-semibold">{f.rating.overall}/10</span>
                      </div>
                    ) : null}
                  </div>
                  {f.purchase_price != null && (
                    <p className="text-[10px] text-txt-muted mt-1.5 tabular-nums">
                      {f.purchase_price.toFixed(0)} € · {f.size_ml || '?'} ml
                      {ppm && ` · ${ppm} €/ml`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rating bars */}
          {(fragA.rating || fragB.rating) && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs text-txt-muted uppercase tracking-wider">Bewertungen</h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gold/70" />
                    <span className="text-[10px] text-txt-muted truncate max-w-[80px]">{fragA.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400/70" />
                    <span className="text-[10px] text-txt-muted truncate max-w-[80px]">{fragB.name}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {ratingKeys.map(({ key, label }) => (
                  <RatingBar
                    key={key}
                    label={label}
                    valA={fragA.rating?.[key] || 0}
                    valB={fragB.rating?.[key] || 0}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Radar overlay */}
          {fragA.rating && fragB.rating && fragA.rating.sillage > 0 && fragB.rating.sillage > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <h2 className="text-xs text-txt-muted uppercase tracking-wider mb-3 text-center">Radar-Overlay</h2>
              <div className="flex justify-center">
                <RadarChart rating={fragA.rating} size={220} compareRating={fragB.rating} />
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <h2 className="text-xs text-txt-muted uppercase tracking-wider mb-2 text-center">Eckdaten</h2>
            <div className="divide-y divide-border">
              <InfoRow
                label="Preis"
                valueA={fragA.purchase_price != null ? `${fragA.purchase_price.toFixed(0)} €` : '—'}
                valueB={fragB.purchase_price != null ? `${fragB.purchase_price.toFixed(0)} €` : '—'}
                highlight={lowerNum(fragA.purchase_price, fragB.purchase_price)}
              />
              <InfoRow
                label="€/ml"
                valueA={ppmA ? `${ppmA.toFixed(2)} €` : '—'}
                valueB={ppmB ? `${ppmB.toFixed(2)} €` : '—'}
                highlight={lowerNum(ppmA, ppmB)}
              />
              <InfoRow
                label="Größe"
                valueA={fragA.size_ml ? `${fragA.size_ml} ml` : '—'}
                valueB={fragB.size_ml ? `${fragB.size_ml} ml` : '—'}
                highlight={higherNum(fragA.size_ml, fragB.size_ml)}
              />
              <InfoRow
                label="Füllstand"
                valueA={`${fragA.fill_level}%`}
                valueB={`${fragB.fill_level}%`}
                highlight={higherNum(fragA.fill_level, fragB.fill_level)}
              />
              <InfoRow
                label="Konzentration"
                valueA={fragA.concentration}
                valueB={fragB.concentration}
              />
              <InfoRow
                label="Erscheinungsjahr"
                valueA={fragA.launch_year ? String(fragA.launch_year) : '—'}
                valueB={fragB.launch_year ? String(fragB.launch_year) : '—'}
              />
            </div>
          </div>

          {/* Season compare */}
          {(fragA.season.length > 0 || fragB.season.length > 0) && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <h2 className="text-xs text-txt-muted uppercase tracking-wider mb-3">Saison</h2>
              <SeasonCompare seasonsA={fragA.season} seasonsB={fragB.season} />
            </div>
          )}

          {/* Notes side by side */}
          {(fragA.notes.length > 0 || fragB.notes.length > 0) && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs text-txt-muted uppercase tracking-wider">Duftnoten</h2>
                {sharedNoteCount > 0 && (
                  <span className="text-[10px] text-gold">{sharedNoteCount} gemeinsam</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <span className="text-[10px] text-txt-muted font-medium truncate">{fragA.name}</span>
                <span className="text-[10px] text-txt-muted font-medium truncate">{fragB.name}</span>
              </div>
              <NotesSideBySide
                notesA={fragA.notes}
                notesB={fragB.notes}
                nameA={fragA.name}
                nameB={fragB.name}
              />
            </div>
          )}

          {/* Verdict */}
          {fragA.rating?.overall && fragB.rating?.overall && (
            <div className="bg-surface border border-gold/15 rounded-lg p-4 text-center">
              <Trophy size={20} className="mx-auto text-gold mb-2" />
              {scoreA !== 0 ? (
                <p className="text-sm text-txt">
                  <span className="text-gold font-medium">{scoreA > 0 ? fragA.name : fragB.name}</span>{' '}
                  gewinnt in {Math.abs(scoreA)} von {ratingKeys.length} Kategorien
                </p>
              ) : (
                <p className="text-sm text-txt-muted">Gleichstand — beide Düfte sind gleich stark</p>
              )}
              {fragA.rating.overall !== fragB.rating.overall && (
                <p className="text-xs text-txt-muted mt-1">
                  Gesamtbewertung: {fragA.rating.overall}/10 vs {fragB.rating.overall}/10
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <ArrowLeftRight size={48} className="mx-auto text-txt-muted mb-3" />
          <p className="text-txt-muted">Wähle zwei Düfte um sie zu vergleichen</p>
        </div>
      )}
    </div>
  );
}
