import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { computeStats } from '@/lib/stats';
import { EmptyState } from '@/components/common';
import type { Fragrance } from '@/lib/types';
import { BarChart3, TrendingUp, Droplets, DollarSign, Star, Award } from 'lucide-react';

const CHART_COLORS = ['#c9a96e', '#6a9a8a', '#a47a9a', '#c49a5a', '#baa44a', '#7a8aaa', '#c47a7a', '#8a6a4a', '#6a8aaa', '#9a9088'];

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
        <p className="text-gold">{payload[0].value}</p>
      </div>
    );
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-light text-txt mb-6">
        Statistiken
      </h1>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={<Droplets size={18} />} value={stats.totalCount} label="Düfte" />
        <StatCard
          icon={<DollarSign size={18} />}
          value={`${stats.totalPurchaseValue.toFixed(0)} €`}
          label="Kaufwert"
        />
        <StatCard
          icon={<Star size={18} />}
          value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
          label="Ø Bewertung"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          value={stats.avgPricePerMl > 0 ? `${stats.avgPricePerMl.toFixed(2)} €` : '—'}
          label="Ø Preis/ml"
        />
      </div>

      {stats.totalMarketValue > 0 && stats.totalMarketValue !== stats.totalPurchaseValue && (
        <div className="bg-surface border border-border rounded p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-txt-muted uppercase tracking-wider">Marktwert (geschätzt)</p>
              <p className="font-display text-2xl font-semibold text-gold">{stats.totalMarketValue.toFixed(0)} €</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-txt-muted uppercase tracking-wider">Differenz</p>
              <p className={`font-display text-2xl font-semibold ${stats.totalMarketValue > stats.totalPurchaseValue ? 'text-accent-fresh' : 'text-accent-rose'}`}>
                {stats.totalMarketValue > stats.totalPurchaseValue ? '+' : ''}{(stats.totalMarketValue - stats.totalPurchaseValue).toFixed(0)} €
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Brand distribution */}
        {stats.brandDistribution.length > 0 && (
          <ChartCard title="Nach Marke">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.brandDistribution.slice(0, 8)} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#9a9088', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,169,110,0.08)' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.brandDistribution.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Family distribution */}
        {stats.familyDistribution.length > 0 && (
          <ChartCard title="Nach Duftfamilie">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.familyDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    strokeWidth={2}
                    stroke="#0e0c0b"
                  >
                    {stats.familyDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {stats.familyDistribution.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-txt-muted">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  {item.name} ({item.count})
                </div>
              ))}
            </div>
          </ChartCard>
        )}

        {/* Concentration distribution */}
        {stats.concentrationDistribution.length > 0 && (
          <ChartCard title="Nach Konzentration">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.concentrationDistribution} margin={{ left: 0, right: 16 }}>
                <XAxis dataKey="name" tick={{ fill: '#9a9088', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,169,110,0.08)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.concentrationDistribution.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Top rated */}
        {stats.topRated.length > 0 && (
          <ChartCard title="Top bewertet">
            <div className="space-y-2">
              {stats.topRated.map((f, i) => (
                <div key={f.id} className="flex items-center gap-3">
                  <span className="font-display text-lg font-semibold text-gold-dim w-6 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-txt truncate">{f.name}</p>
                    <p className="text-xs text-txt-muted">{f.brand}</p>
                  </div>
                  <span className="text-sm font-display font-semibold text-gold">
                    {f.rating?.overall}/10
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>

      {/* Notable fragrances */}
      {(stats.mostExpensive || stats.cheapestPerMl) && (
        <div className="grid md:grid-cols-2 gap-3 mt-6">
          {stats.mostExpensive && stats.mostExpensive.purchase_price && (
            <div className="bg-surface border border-border rounded p-4 flex items-center gap-3">
              <Award size={20} className="text-gold shrink-0" />
              <div>
                <p className="text-xs text-txt-muted">Teuerstes Parfum</p>
                <p className="text-sm text-txt">{stats.mostExpensive.name}</p>
                <p className="text-xs text-gold">{stats.mostExpensive.purchase_price.toFixed(2)} €</p>
              </div>
            </div>
          )}
          {stats.cheapestPerMl && stats.cheapestPerMl.purchase_price && stats.cheapestPerMl.size_ml && (
            <div className="bg-surface border border-border rounded p-4 flex items-center gap-3">
              <TrendingUp size={20} className="text-accent-fresh shrink-0" />
              <div>
                <p className="text-xs text-txt-muted">Bester Preis/ml</p>
                <p className="text-sm text-txt">{stats.cheapestPerMl.name}</p>
                <p className="text-xs text-accent-fresh">
                  {(stats.cheapestPerMl.purchase_price / stats.cheapestPerMl.size_ml).toFixed(2)} €/ml
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="bg-surface border border-border rounded p-4">
      <div className="text-txt-muted mb-2">{icon}</div>
      <p className="font-display text-2xl font-semibold text-gold">{value}</p>
      <p className="text-xs text-txt-muted uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded p-4">
      <h3 className="font-display text-lg text-txt mb-3">{title}</h3>
      {children}
    </div>
  );
}
