import { useState, useMemo } from 'react';
import { Select } from '@/components/common';
import { RadarChart } from '@/components/Rating/RadarChart';
import { useImageFetch } from '@/hooks/useImageFetch';
import type { Fragrance, RatingDetails } from '@/lib/types';
import { Droplets, ArrowLeftRight, Minus, Equal, Trophy } from 'lucide-react';

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

function StatCompare({ label, valA, valB, suffix = '', higher = 'better' }: {
  label: string;
  valA: number | null;
  valB: number | null;
  suffix?: string;
  higher?: 'better' | 'worse' | 'neutral';
}) {
  const a = valA ?? 0;
  const b = valB ?? 0;
  const diff = a - b;
  const winner = diff > 0 ? 'a' : diff < 0 ? 'b' : null;
  const isBetter = higher === 'better' ? winner : higher === 'worse' ? (winner === 'a' ? 'b' : winner === 'b' ? 'a' : null) : null;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2">
      <div className="text-right">
        <span className={`text-sm tabular-nums ${isBetter === 'a' ? 'text-gold font-semibold' : 'text-txt'}`}>
          {valA != null ? `${valA}${suffix}` : '—'}
        </span>
      </div>
      <div className="text-center">
        <span className="text-[10px] text-txt-muted uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <span className={`text-sm tabular-nums ${isBetter === 'b' ? 'text-gold font-semibold' : 'text-txt'}`}>
          {valB != null ? `${valB}${suffix}` : '—'}
        </span>
      </div>
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

  const pricePerMlA = fragA?.purchase_price && fragA?.size_ml ? fragA.purchase_price / fragA.size_ml : null;
  const pricePerMlB = fragB?.purchase_price && fragB?.size_ml ? fragB.purchase_price / fragB.size_ml : null;

  const sharedNotes = useMemo(() => {
    if (!fragA || !fragB) return [];
    const aNotes = new Set(fragA.notes.map((n) => n.name.toLowerCase()));
    return fragB.notes.filter((n) => aNotes.has(n.name.toLowerCase()));
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
        <div className="space-y-6">
          {/* Header cards */}
          <div className="grid grid-cols-2 gap-4">
            {[fragA, fragB].map((f) => (
              <div key={f.id} className="bg-surface border border-border rounded-lg p-4 flex flex-col items-center text-center">
                <div className="w-20 h-28 rounded-sm bg-surface-2 flex items-center justify-center overflow-hidden mb-3">
                  <CompareImage fragrance={f} />
                </div>
                <h3 className="text-sm font-medium text-txt">{f.name}</h3>
                <p className="text-xs text-txt-muted">{f.brand}</p>
                <p className="text-[10px] text-txt-muted mt-1">{f.concentration} · {f.family}</p>
                {f.tier && (
                  <div className={`mt-2 w-6 h-6 flex items-center justify-center rounded-sm text-[10px] font-bold ${
                    f.tier === 'S' ? 'bg-gold/15 text-gold' :
                    f.tier === 'A' ? 'bg-green-500/15 text-green-400' :
                    f.tier === 'B' ? 'bg-blue-500/15 text-blue-400' :
                    f.tier === 'C' ? 'bg-gray-500/15 text-gray-400' :
                    'bg-rose-500/15 text-rose-400'
                  }`}>
                    {f.tier}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Radar overlay */}
          {fragA.rating && fragB.rating && fragA.rating.sillage > 0 && fragB.rating.sillage > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <h2 className="text-xs text-txt-muted uppercase tracking-wider mb-3 text-center">Bewertungsvergleich</h2>
              <div className="flex justify-center">
                <RadarChart rating={fragA.rating} size={240} compareRating={fragB.rating} />
              </div>
              <div className="flex justify-center gap-6 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-gold rounded" />
                  <span className="text-[10px] text-txt-muted">{fragA.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-blue-400 rounded" />
                  <span className="text-[10px] text-txt-muted">{fragB.name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Stats comparison */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <h2 className="text-xs text-txt-muted uppercase tracking-wider mb-2 text-center">Detailvergleich</h2>
            <div className="divide-y divide-border">
              {ratingKeys.map(({ key, label }) => (
                <StatCompare
                  key={key}
                  label={label}
                  valA={fragA.rating?.[key] || null}
                  valB={fragB.rating?.[key] || null}
                  suffix="/10"
                />
              ))}
              <StatCompare label="Preis" valA={fragA.purchase_price} valB={fragB.purchase_price} suffix=" €" higher="worse" />
              <StatCompare label="€/ml" valA={pricePerMlA ? Math.round(pricePerMlA * 100) / 100 : null} valB={pricePerMlB ? Math.round(pricePerMlB * 100) / 100 : null} suffix=" €" higher="worse" />
              <StatCompare label="Größe" valA={fragA.size_ml} valB={fragB.size_ml} suffix=" ml" />
              <StatCompare label="Füllstand" valA={fragA.fill_level} valB={fragB.fill_level} suffix="%" />
            </div>
          </div>

          {/* Shared notes */}
          {sharedNotes.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <h2 className="text-xs text-txt-muted uppercase tracking-wider mb-3">
                Gemeinsame Noten ({sharedNotes.length})
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {sharedNotes.map((n, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-gold/10 border border-gold/20 rounded-full text-gold">
                    {n.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verdict */}
          {fragA.rating?.overall && fragB.rating?.overall && (
            <div className="bg-surface border border-gold/15 rounded-lg p-4 text-center">
              <Trophy size={20} className="mx-auto text-gold mb-2" />
              <p className="text-sm text-txt-muted">
                {fragA.rating.overall > fragB.rating.overall
                  ? <><span className="text-gold font-medium">{fragA.name}</span> hat die bessere Gesamtbewertung</>
                  : fragB.rating.overall > fragA.rating.overall
                  ? <><span className="text-gold font-medium">{fragB.name}</span> hat die bessere Gesamtbewertung</>
                  : <>Beide Düfte sind gleich bewertet</>
                }
              </p>
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
