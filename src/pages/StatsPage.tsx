import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { computeStats } from '@/lib/stats';
import { EmptyState } from '@/components/common';
import { RadarChart } from '@/components/Rating/RadarChart';
import type { Fragrance, RatingDetails } from '@/lib/types';
import { BarChart3, Droplets, Star, Award, TrendingUp, Heart, Trophy, Flame, Sparkles } from 'lucide-react';

const CHART_COLORS = ['#c9a96e', '#6a9a8a', '#a47a9a', '#c49a5a', '#baa44a', '#7a8aaa', '#c47a7a', '#8a6a4a', '#6a8aaa', '#9a9088'];

const TIER_COLORS: Record<string, string> = {
  S: '#c9a96e',
  A: '#6a9a8a',
  B: '#7a8aaa',
  C: '#9a9088',
  D: '#c47a7a',
  'Kein Tier': '#2a2520',
};

interface StatsPageProps {
  fragrances: Fragrance[];
}

export function StatsPage({ fragrances }: StatsPageProps) {
  const stats = useMemo(() => computeStats(fragrances), [fragrances]);
  if (stats.totalCount === 0) {
    return (
      <div>
        <h1 className="font-display text-3xl font-light text-txt mb-6">
          Statistiken
        </h1>
        <EmptyState
          icon={<BarChart3 size={48} />}
          title="Noch keine Daten"
          description="Füge Parfums zu deiner Sammlung hinzu, um Statistiken zu sehen."
        />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-surface-2 border border-border rounded-sm px-3 py-2 text-xs text-txt shadow-lg">
        <p className="font-medium">{payload[0].name || payload[0].payload.name}</p>
        <p className="text-gold font-semibold">{payload[0].value}</p>
      </div>
    );
  };

  // Build average radar data
  const avgRadar: RatingDetails | null = stats.avgRatingBreakdown ? {
    overall: stats.avgRating,
    ...stats.avgRatingBreakdown,
  } : null;

  return (
    <div className="pb-8">
      <h1 className="font-display text-3xl font-light text-txt mb-2">
        Deine <em className="text-gold italic">Statistiken</em>
      </h1>
      <p className="text-sm text-txt-muted mb-8">
        {stats.totalCount} Düfte in deiner Sammlung
        {stats.wishlistCount > 0 && ` · ${stats.wishlistCount} auf der Wunschliste`}
      </p>

      {/* === Hero Stats === */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <HeroCard
          value={`${stats.totalPurchaseValue.toFixed(0)} €`}
          label="Sammlungswert"
          sub={stats.totalMarketValue > 0 && stats.totalMarketValue !== stats.totalPurchaseValue
            ? `Marktwert: ${stats.totalMarketValue.toFixed(0)} €`
            : undefined}
          accent
        />
        <HeroCard
          value={stats.totalCount.toString()}
          label="Düfte"
          sub={stats.wishlistCount > 0 ? `+ ${stats.wishlistCount} Wunschliste` : undefined}
        />
      </div>

      {/* === Metric Pills === */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Pill icon={<Star size={12} />} value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'} label="Ø Bewertung" />
        <Pill icon={<TrendingUp size={12} />} value={stats.avgPricePerMl > 0 ? `${stats.avgPricePerMl.toFixed(2)} €` : '—'} label="Ø €/ml" />
        <Pill icon={<Droplets size={12} />} value={`${stats.avgFillLevel.toFixed(0)}%`} label="Ø Füllstand" />
        <Pill icon={<Trophy size={12} />} value={stats.tierDistribution.filter(t => t.name !== 'Kein Tier').reduce((s, t) => s + t.count, 0)} label="Gerankt" />
        <Pill icon={<Star size={12} />} value={stats.unratedCount} label="Unbewertet" />
        {stats.wishlistCount > 0 && <Pill icon={<Heart size={12} />} value={stats.wishlistCount} label="Wunschliste" />}
      </div>

      {/* === Market Value Comparison === */}
      {stats.totalMarketValue > 0 && stats.totalPurchaseValue > 0 && stats.totalMarketValue !== stats.totalPurchaseValue && (
        <div className="mb-8 p-4 bg-surface border border-border rounded-lg">
          <p className="text-xs text-txt-muted uppercase tracking-wider mb-3">Kaufpreis vs. Marktwert</p>
          <div className="space-y-2">
            <ValueBar label="Kaufpreis" value={stats.totalPurchaseValue} max={Math.max(stats.totalPurchaseValue, stats.totalMarketValue)} color="#c9a96e" />
            <ValueBar label="Marktwert" value={stats.totalMarketValue} max={Math.max(stats.totalPurchaseValue, stats.totalMarketValue)} color={stats.totalMarketValue > stats.totalPurchaseValue ? '#6a9a8a' : '#c47a7a'} />
          </div>
          <p className={`text-right text-sm font-semibold mt-2 ${stats.totalMarketValue > stats.totalPurchaseValue ? 'text-accent-fresh' : 'text-accent-rose'}`}>
            {stats.totalMarketValue > stats.totalPurchaseValue ? '+' : ''}{(stats.totalMarketValue - stats.totalPurchaseValue).toFixed(0)} € Differenz
          </p>
        </div>
      )}

      {/* === Timeline === */}
      {stats.timeline.length > 1 && (
        <SectionCard title="Sammlungsverlauf" icon={<TrendingUp size={16} />}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={stats.timeline} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c9a96e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#c9a96e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: '#9a9088', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#c9a96e" strokeWidth={2} fill="url(#timelineGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
      )}

      {/* === Charts Grid === */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {/* Brands */}
        {stats.brandDistribution.length > 0 && (
          <SectionCard title="Marken" icon={<Sparkles size={16} />}>
            <div className="space-y-2">
              {stats.brandDistribution.slice(0, 6).map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs text-txt-muted w-20 truncate shrink-0">{item.name}</span>
                  <div className="flex-1 h-5 bg-surface-2 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-500"
                      style={{
                        width: `${(item.count / stats.brandDistribution[0].count) * 100}%`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="text-xs text-txt font-medium w-6 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Tier Distribution */}
        {stats.tierDistribution.length > 0 && (
          <SectionCard title="Tier-Verteilung" icon={<Trophy size={16} />}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats.tierDistribution} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={({ x, y, payload }: any) => (
                    <text x={x} y={y + 12} textAnchor="middle" fontSize={12} fontWeight="bold" fill={TIER_COLORS[payload.value] || '#9a9088'}>
                      {payload.value === 'Kein Tier' ? '—' : payload.value}
                    </text>
                  )}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,169,110,0.08)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#e8e0d4', fontSize: 12, fontWeight: 600 }}>
                  {stats.tierDistribution.map((entry, i) => (
                    <Cell key={i} fill={TIER_COLORS[entry.name] || '#3a342c'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        )}

        {/* Concentration */}
        {stats.concentrationDistribution.length > 0 && (
          <SectionCard title="Konzentration" icon={<Droplets size={16} />}>
            <div className="space-y-2">
              {stats.concentrationDistribution.map((item, i) => {
                const pct = (item.count / stats.totalCount) * 100;
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="text-xs text-txt-muted w-16 shrink-0">{item.name}</span>
                    <div className="flex-1 h-4 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs text-txt font-medium w-12 text-right">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Price Ranges */}
        {stats.priceRanges.length > 0 && (
          <SectionCard title="Preisverteilung" icon={<TrendingUp size={16} />}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats.priceRanges} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#9a9088', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,169,110,0.08)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.priceRanges.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        )}

        {/* Fill Level Distribution */}
        {stats.fillBuckets.length > 1 && (
          <SectionCard title="Füllstand-Verteilung" icon={<Droplets size={16} />}>
            <div className="space-y-2">
              {stats.fillBuckets.map((bucket, i) => {
                const pct = (bucket.count / stats.totalCount) * 100;
                const colors = ['#c47a7a', '#c49a5a', '#baa44a', '#6a9a8a', '#c9a96e'];
                return (
                  <div key={bucket.name} className="flex items-center gap-3">
                    <span className="text-xs text-txt-muted w-24 shrink-0">{bucket.name}</span>
                    <div className="flex-1 h-4 bg-surface-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[i] || '#c9a96e' }} />
                    </div>
                    <span className="text-xs text-txt font-medium w-6 text-right">{bucket.count}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Average Radar Chart */}
        {avgRadar && avgRadar.sillage > 0 && (
          <SectionCard title="Ø Bewertungsprofil" icon={<Star size={16} />}>
            <div className="flex justify-center">
              <RadarChart rating={avgRadar} size={200} />
            </div>
          </SectionCard>
        )}

        {/* Top Notes */}
        {stats.topNotes.length > 0 && (
          <SectionCard title="Häufigste Duftnoten" icon={<Flame size={16} />}>
            <div className="flex flex-wrap gap-2">
              {stats.topNotes.map((note, i) => {
                const maxCount = stats.topNotes[0].count;
                const opacity = 0.4 + (note.count / maxCount) * 0.6;
                return (
                  <span
                    key={note.name}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border border-gold/20"
                    style={{ backgroundColor: `rgba(201,169,110,${opacity * 0.15})`, color: `rgba(201,169,110,${opacity})` }}
                  >
                    {note.name} <span className="opacity-60">({note.count})</span>
                  </span>
                );
              })}
            </div>
          </SectionCard>
        )}
      </div>

      {/* === Top Rated & Highlights === */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {stats.topRated.length > 0 && (
          <SectionCard title="Top 5 Bewertungen" icon={<Award size={16} />}>
            <div className="space-y-3">
              {stats.topRated.map((f, i) => (
                <div key={f.id} className="flex items-center gap-3">
                  <span className={`font-display text-xl font-bold w-7 text-right ${i === 0 ? 'text-gold' : i === 1 ? 'text-txt-dim' : 'text-txt-muted'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-txt truncate">{f.name}</p>
                    <p className="text-[11px] text-txt-muted">{f.brand}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} className={i === 0 ? 'text-gold fill-gold' : 'text-gold'} />
                    <span className="text-sm font-display font-bold text-gold">{f.rating?.overall}</span>
                    <span className="text-[10px] text-txt-muted">/10</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Highlights */}
        {(stats.mostExpensive || stats.cheapestPerMl) && (
          <SectionCard title="Highlights" icon={<Sparkles size={16} />}>
            <div className="space-y-3">
              {stats.mostExpensive && stats.mostExpensive.purchase_price && (
                <HighlightRow
                  emoji="💰"
                  label="Teuerstes Parfum"
                  name={stats.mostExpensive.name}
                  brand={stats.mostExpensive.brand}
                  stat={`${stats.mostExpensive.purchase_price.toFixed(0)} €`}
                />
              )}
              {stats.cheapestPerMl && stats.cheapestPerMl.purchase_price && stats.cheapestPerMl.size_ml && (
                <HighlightRow
                  emoji="🏷️"
                  label="Bester Preis/ml"
                  name={stats.cheapestPerMl.name}
                  brand={stats.cheapestPerMl.brand}
                  stat={`${(stats.cheapestPerMl.purchase_price / stats.cheapestPerMl.size_ml).toFixed(2)} €/ml`}
                />
              )}
              {stats.topRated[0] && (
                <HighlightRow
                  emoji="⭐"
                  label="Bestbewertet"
                  name={stats.topRated[0].name}
                  brand={stats.topRated[0].brand}
                  stat={`${stats.topRated[0].rating?.overall}/10`}
                />
              )}
              {stats.brandDistribution[0] && (
                <HighlightRow
                  emoji="👑"
                  label="Lieblingsmarke"
                  name={stats.brandDistribution[0].name}
                  brand=""
                  stat={`${stats.brandDistribution[0].count} Düfte`}
                />
              )}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

// === Sub Components ===

function HeroCard({ value, label, sub, accent }: { value: string; label: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-lg border p-4 ${accent ? 'bg-gradient-to-br from-gold/10 via-surface to-surface border-gold/20' : 'bg-surface border-border'}`}>
      <p className={`font-display text-2xl font-bold ${accent ? 'text-gold' : 'text-txt'}`}>{value}</p>
      <p className="text-xs text-txt-muted uppercase tracking-wider mt-1">{label}</p>
      {sub && <p className="text-[11px] text-txt-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function Pill({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-full">
      <span className="text-gold">{icon}</span>
      <span className="text-sm font-semibold text-txt">{value}</span>
      <span className="text-[11px] text-txt-muted">{label}</span>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-gold">{icon}</span>}
        <h3 className="font-display text-base font-medium text-txt">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ValueBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-txt-muted w-16 shrink-0">{label}</span>
      <div className="flex-1 h-6 bg-surface-2 rounded-sm overflow-hidden">
        <div className="h-full rounded-sm flex items-center px-2" style={{ width: `${pct}%`, backgroundColor: color }}>
          <span className="text-[10px] font-bold text-bg whitespace-nowrap">{value.toFixed(0)} €</span>
        </div>
      </div>
    </div>
  );
}

function HighlightRow({ emoji, label, name, brand, stat }: { emoji: string; label: string; name: string; brand: string; stat: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-txt-muted">{label}</p>
        <p className="text-sm text-txt truncate">{name}{brand && <span className="text-txt-muted"> · {brand}</span>}</p>
      </div>
      <span className="text-sm font-display font-bold text-gold shrink-0">{stat}</span>
    </div>
  );
}
