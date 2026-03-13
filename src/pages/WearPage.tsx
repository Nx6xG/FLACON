import { useState, useMemo } from 'react';
import { useImageFetch } from '@/hooks/useImageFetch';
import { Button, Select } from '@/components/common';
import type { Fragrance } from '@/lib/types';
import type { WearEntry } from '@/hooks/useWearLog';
import { ChevronLeft, ChevronRight, Flame, Trash2, Droplets, CalendarDays, Plus } from 'lucide-react';

interface WearPageProps {
  collection: Fragrance[];
  entries: WearEntry[];
  loading?: boolean;
  onLog: (fragranceId: string, date?: string, sprays?: number) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
  onToast?: (message: string) => void;
}

function MiniImage({ fragrance }: { fragrance: Fragrance }) {
  const { resolvedUrl } = useImageFetch(fragrance.name, fragrance.brand, fragrance.image_url, fragrance.id);
  return resolvedUrl ? (
    <img src={resolvedUrl} alt={fragrance.name} className="w-full h-full object-cover" />
  ) : (
    <Droplets size={10} className="text-txt-muted" />
  );
}

export function WearPage({ collection, entries, loading, onLog, onRemove, onToast }: WearPageProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);
  const [quickAddFragrance, setQuickAddFragrance] = useState('');

  const entriesByDate = useMemo(() => {
    const map = new Map<string, WearEntry[]>();
    for (const e of entries) {
      const list = map.get(e.worn_at) || [];
      list.push(e);
      map.set(e.worn_at, list);
    }
    return map;
  }, [entries]);

  const fragranceMap = useMemo(() => {
    const map = new Map<string, Fragrance>();
    for (const f of collection) map.set(f.id, f);
    return map;
  }, [collection]);

  // Calendar grid
  const { year, month } = currentMonth;
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
  const monthName = firstDay.toLocaleString('de-DE', { month: 'long', year: 'numeric' });

  const today = new Date().toISOString().split('T')[0];

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [startDow, daysInMonth]);

  const prevMonth = () => setCurrentMonth((p) => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 });
  const nextMonth = () => setCurrentMonth((p) => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 });

  const handleQuickAdd = async () => {
    if (!quickAddFragrance || !quickAddDate) return;
    const success = await onLog(quickAddFragrance, quickAddDate);
    if (success) {
      const f = fragranceMap.get(quickAddFragrance);
      onToast?.(`${f?.name || 'Duft'} für ${new Date(quickAddDate).toLocaleDateString('de-DE')} eingetragen`);
      setQuickAddDate(null);
      setQuickAddFragrance('');
    }
  };

  // Stats
  const thisMonthEntries = entries.filter((e) => {
    const d = new Date(e.worn_at);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const wearCountByFragrance = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      map.set(e.fragrance_id, (map.get(e.fragrance_id) || 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [entries]);

  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().split('T')[0];
      if (entriesByDate.has(key)) {
        count++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return count;
  }, [entriesByDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-light text-txt">
            Duft<em className="text-gold italic">tagebuch</em>
          </h1>
          <p className="text-xs sm:text-sm text-txt-muted mt-1">
            {entries.length} Einträge · {streak > 0 ? `${streak} Tage Streak` : 'Kein Streak'}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        <div className="bg-surface border border-border rounded-lg p-2 sm:p-3 text-center">
          <p className="text-xl sm:text-2xl font-display text-gold">{thisMonthEntries.length}</p>
          <p className="text-[9px] sm:text-[10px] text-txt-muted uppercase tracking-wider">Monat</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-2 sm:p-3 text-center">
          <p className="text-xl sm:text-2xl font-display text-gold">{entries.length}</p>
          <p className="text-[9px] sm:text-[10px] text-txt-muted uppercase tracking-wider">Gesamt</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-2 sm:p-3 text-center">
          <p className="text-xl sm:text-2xl font-display text-gold">{new Set(entries.map((e) => e.fragrance_id)).size}</p>
          <p className="text-[9px] sm:text-[10px] text-txt-muted uppercase tracking-wider">Düfte</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-surface border border-border rounded-lg p-3 mb-6">
        <div className="flex items-center justify-between mb-2">
          <button onClick={prevMonth} className="p-1 text-txt-muted hover:text-txt transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-medium text-txt capitalize">{monthName}</span>
          <button onClick={nextMonth} className="p-1 text-txt-muted hover:text-txt transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px text-center">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
            <div key={d} className="text-[10px] sm:text-[9px] text-txt-muted uppercase tracking-wider py-1 sm:py-0.5">{d}</div>
          ))}
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEntries = entriesByDate.get(dateStr) || [];
            const isToday = dateStr === today;
            const hasEntries = dayEntries.length > 0;

            return (
              <button
                key={day}
                onClick={() => { setQuickAddDate(dateStr); setQuickAddFragrance(''); }}
                className={`relative h-10 sm:h-9 flex flex-col items-center justify-center rounded-sm text-xs sm:text-[11px] transition-all ${
                  isToday ? 'ring-1 ring-gold/40' : ''
                } ${hasEntries ? 'bg-gold/10 text-gold' : 'text-txt-dim hover:bg-surface-2'} ${
                  quickAddDate === dateStr ? '!bg-gold/20 ring-1 ring-gold' : ''
                }`}
              >
                <span className={hasEntries ? 'font-semibold' : ''}>{day}</span>
                {hasEntries && (
                  <div className="flex gap-px absolute bottom-0.5">
                    {dayEntries.slice(0, 3).map((_, idx) => (
                      <div key={idx} className="w-1 h-1 rounded-full bg-gold" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick add for selected date */}
      {quickAddDate && (
        <div className="bg-surface border border-gold/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={14} className="text-gold" />
            <span className="text-sm text-gold font-medium">
              {new Date(quickAddDate + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>

          {/* Existing entries for this date */}
          {(entriesByDate.get(quickAddDate) || []).map((entry) => {
            const f = fragranceMap.get(entry.fragrance_id);
            if (!f) return null;
            return (
              <div key={entry.id} className="flex items-center gap-2 mb-2 p-2 bg-surface-2 rounded-sm">
                <div className="w-6 h-8 rounded-sm bg-surface overflow-hidden shrink-0 flex items-center justify-center">
                  <MiniImage fragrance={f} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-txt truncate">{f.name}</p>
                  <p className="text-[10px] text-txt-muted">{f.brand}</p>
                </div>
                <button
                  onClick={() => onRemove(entry.id)}
                  className="p-1 text-txt-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}

          <div className="flex gap-2 mt-2">
            <Select
              value={quickAddFragrance}
              onChange={(e) => setQuickAddFragrance(e.target.value)}
              options={[
                { value: '', label: 'Duft wählen...' },
                ...collection.map((f) => ({ value: f.id, label: `${f.name} — ${f.brand}` })),
              ]}
            />
            <Button size="sm" onClick={handleQuickAdd} disabled={!quickAddFragrance}>
              <Plus size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Top worn */}
      {wearCountByFragrance.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4 mb-6">
          <h2 className="text-xs text-txt-muted uppercase tracking-wider mb-3">Meistgetragen</h2>
          <div className="space-y-2">
            {wearCountByFragrance.map(([fId, count], idx) => {
              const f = fragranceMap.get(fId);
              if (!f) return null;
              const maxCount = wearCountByFragrance[0][1];
              return (
                <div key={fId} className="flex items-center gap-3">
                  <span className="text-xs text-txt-muted w-4 text-right">{idx + 1}</span>
                  <div className="w-7 h-10 rounded-sm bg-surface-2 overflow-hidden shrink-0 flex items-center justify-center">
                    <MiniImage fragrance={f} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-txt truncate">{f.name}</p>
                    <div className="h-1 bg-surface-2 rounded-full mt-1">
                      <div className="h-full bg-gold/60 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame size={12} className="text-gold" />
                    <span className="text-sm text-gold font-semibold tabular-nums">{count}×</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <h2 className="text-xs text-txt-muted uppercase tracking-wider mb-3">Letzte Einträge</h2>
          <div className="space-y-2">
            {entries.slice(0, 15).map((entry) => {
              const f = fragranceMap.get(entry.fragrance_id);
              if (!f) return null;
              return (
                <div key={entry.id} className="flex items-center gap-3 p-2 rounded-sm hover:bg-surface-2 transition-colors">
                  <div className="w-7 h-10 rounded-sm bg-surface-2 overflow-hidden shrink-0 flex items-center justify-center">
                    <MiniImage fragrance={f} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-txt truncate">{f.name}</p>
                    <p className="text-[10px] text-txt-muted">{f.brand}</p>
                  </div>
                  <span className="text-xs text-txt-muted tabular-nums">
                    {new Date(entry.worn_at + 'T12:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                  </span>
                  <button
                    onClick={() => onRemove(entry.id)}
                    className="p-1 text-txt-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && collection.length > 0 && (
        <div className="text-center py-12">
          <CalendarDays size={48} className="mx-auto text-txt-muted mb-3" />
          <p className="text-txt-muted">Noch keine Einträge</p>
          <p className="text-sm text-txt-muted mt-1">Klicke auf einen Tag im Kalender um zu starten.</p>
        </div>
      )}
    </div>
  );
}
