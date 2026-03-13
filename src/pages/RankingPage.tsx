import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { FragranceCard } from '@/components/Collection/FragranceCard';
import { EmptyState } from '@/components/common';
import type { Fragrance, Tier, FragranceInput } from '@/lib/types';
import { Trophy } from 'lucide-react';

const tierConfig: { tier: Tier; label: string; color: string; description: string }[] = [
  { tier: 'S', label: 'S-Tier', color: '#c9a96e', description: 'Meisterwerke — Holy Grails' },
  { tier: 'A', label: 'A-Tier', color: '#6a9a8a', description: 'Exzellent — Regelmäßig getragen' },
  { tier: 'B', label: 'B-Tier', color: '#7a8aaa', description: 'Solide — Gute Allrounder' },
  { tier: 'C', label: 'C-Tier', color: '#9a9088', description: 'Durchschnitt — Situativ okay' },
  { tier: 'D', label: 'D-Tier', color: '#c47a7a', description: 'Enttäuschend — Selten getragen' },
];

type DropTarget = Tier | 'unranked';

interface RankingPageProps {
  collection: Fragrance[];
  onSelect: (fragrance: Fragrance) => void;
  onUpdate: (id: string, updates: Partial<FragranceInput>) => Promise<boolean>;
}

export function RankingPage({ collection, onSelect, onUpdate }: RankingPageProps) {
  const [dragOverTarget, setDragOverTarget] = useState<DropTarget | null>(null);
  const dragItemId = useRef<string | null>(null);
  const tierRefs = useRef<Map<DropTarget, HTMLDivElement>>(new Map());
  const touchGhostRef = useRef<HTMLDivElement | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const scrollRafRef = useRef<number | null>(null);
  const pointerYRef = useRef<number | null>(null);

  const tierGroups = useMemo(() => {
    const groups = new Map<Tier, Fragrance[]>();
    tierConfig.forEach(({ tier }) => groups.set(tier, []));

    collection
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
  }, [collection]);

  const unranked = collection.filter((f) => !f.tier);

  const dropIndexRef = useRef<{ tier: Tier; index: number } | null>(null);

  // --- Shared drop logic ---
  const assignTarget = useCallback(async (id: string, target: DropTarget) => {
    const fragrance = collection.find((f) => f.id === id);
    if (!fragrance) return;

    if (target === 'unranked') {
      if (!fragrance.tier) return;
      await onUpdate(id, { tier: null, tier_rank: null });
    } else {
      const tierItems = tierGroups.get(target) || [];
      const dropInfo = dropIndexRef.current;
      dropIndexRef.current = null;

      // Reorder within same tier
      if (fragrance.tier === target && dropInfo?.tier === target) {
        const filtered = tierItems.filter((f) => f.id !== id);
        filtered.splice(dropInfo.index, 0, fragrance);
        const updates = filtered.map((f, i) =>
          f.tier_rank !== i + 1 ? onUpdate(f.id, { tier_rank: i + 1 }) : Promise.resolve(true)
        );
        await Promise.all(updates);
        return;
      }

      // Move to different tier
      if (fragrance.tier === target && !dropInfo) return;
      const insertAt = dropInfo?.tier === target ? dropInfo.index : tierItems.length;
      const filtered = tierItems.filter((f) => f.id !== id);
      filtered.splice(insertAt, 0, fragrance);

      await onUpdate(id, { tier: target, tier_rank: insertAt + 1 });
      // Re-rank others after insertion
      const reranks = filtered.map((f, i) => {
        if (f.id === id) return Promise.resolve(true);
        return f.tier_rank !== i + 1 ? onUpdate(f.id, { tier_rank: i + 1 }) : Promise.resolve(true);
      });
      await Promise.all(reranks);
    }
  }, [collection, tierGroups, onUpdate]);

  // --- Auto-scroll when dragging near viewport edges ---
  const startAutoScroll = useCallback(() => {
    if (scrollRafRef.current) return;
    const EDGE = 80;
    const MAX_SPEED = 18;

    const tick = () => {
      const y = pointerYRef.current;
      if (y == null) { scrollRafRef.current = null; return; }

      const vh = window.innerHeight;
      let speed = 0;
      if (y < EDGE) {
        speed = -MAX_SPEED * (1 - y / EDGE);
      } else if (y > vh - EDGE) {
        speed = MAX_SPEED * (1 - (vh - y) / EDGE);
      }
      if (speed !== 0) window.scrollBy(0, speed);
      scrollRafRef.current = requestAnimationFrame(tick);
    };
    scrollRafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
    pointerYRef.current = null;
  }, []);

  // --- Desktop drag ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragItemId.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(target);
    pointerYRef.current = e.clientY;
    startAutoScroll();
    // If dragging over the tier container (not a card), clear specific drop index
    if (target === 'unranked') dropIndexRef.current = null;
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault();
    setDragOverTarget(null);
    stopAutoScroll();
    const id = dragItemId.current;
    dragItemId.current = null;
    if (!id) return;
    await assignTarget(id, target);
  };

  // --- Touch drag ---
  const getTargetAtPoint = useCallback((x: number, y: number): DropTarget | null => {
    for (const [target, el] of tierRefs.current.entries()) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return target;
      }
    }
    return null;
  }, []);

  const handleTouchStart = useCallback((id: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    dragItemId.current = id;
    isDragging.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragItemId.current || !touchStartPos.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);

    if (!isDragging.current && (dx > 8 || dy > 8)) {
      isDragging.current = true;
      const ghost = document.createElement('div');
      ghost.className = 'fixed z-[100] bg-surface border border-gold rounded-sm px-3 py-2 text-sm text-gold shadow-lg pointer-events-none';
      const frag = collection.find((f) => f.id === dragItemId.current);
      ghost.textContent = frag ? frag.name : '';
      document.body.appendChild(ghost);
      touchGhostRef.current = ghost;
    }

    if (isDragging.current) {
      e.preventDefault();
      if (touchGhostRef.current) {
        touchGhostRef.current.style.left = `${touch.clientX - 40}px`;
        touchGhostRef.current.style.top = `${touch.clientY - 20}px`;
      }
      pointerYRef.current = touch.clientY;
      startAutoScroll();
      const target = getTargetAtPoint(touch.clientX, touch.clientY);
      setDragOverTarget(target);
    }
  }, [collection, getTargetAtPoint, startAutoScroll]);

  const handleTouchEnd = useCallback(async (e: React.TouchEvent) => {
    stopAutoScroll();
    if (touchGhostRef.current) {
      touchGhostRef.current.remove();
      touchGhostRef.current = null;
    }

    if (!isDragging.current || !dragItemId.current) {
      dragItemId.current = null;
      touchStartPos.current = null;
      isDragging.current = false;
      return;
    }

    const touch = e.changedTouches[0];
    const target = getTargetAtPoint(touch.clientX, touch.clientY);
    setDragOverTarget(null);

    const id = dragItemId.current;
    dragItemId.current = null;
    touchStartPos.current = null;
    isDragging.current = false;

    if (!target || !id) return;
    await assignTarget(id, target);
  }, [assignTarget, getTargetAtPoint, stopAutoScroll]);

  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      if (isDragging.current) e.preventDefault();
    };
    document.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      document.removeEventListener('touchmove', preventScroll);
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  if (collection.length === 0) {
    return (
      <div>
        <h1 className="font-display text-3xl font-light text-txt mb-6">
          Tier <em className="text-gold italic">Ranking</em>
        </h1>
        <EmptyState
          icon={<Trophy size={48} />}
          title="Noch keine Rankings"
          description="Füge Parfums zu deiner Sammlung hinzu, um sie in Tiers einzuordnen."
        />
      </div>
    );
  }

  const handleDragEnd = useCallback(() => {
    stopAutoScroll();
    setDragOverTarget(null);
    dragItemId.current = null;
  }, [stopAutoScroll]);

  const DraggableCard = ({ fragrance, tier: cardTier, index }: { fragrance: Fragrance; tier?: Tier; index?: number }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, fragrance.id)}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => {
        e.stopPropagation();
        if (cardTier != null && index != null) {
          dropIndexRef.current = { tier: cardTier, index };
        }
      }}
      onTouchStart={(e) => handleTouchStart(fragrance.id, e)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="cursor-grab active:cursor-grabbing touch-none"
    >
      <FragranceCard fragrance={fragrance} onClick={() => !isDragging.current && onSelect(fragrance)} compact />
    </div>
  );

  const isOverUnranked = dragOverTarget === 'unranked';

  return (
    <div>
      <h1 className="font-display text-3xl font-light text-txt mb-6">
        Tier <em className="text-gold italic">Ranking</em>
      </h1>

      <div className="space-y-6">
        {tierConfig.map(({ tier, label, color, description }) => {
          const items = tierGroups.get(tier) || [];
          const isOver = dragOverTarget === tier;
          return (
            <div
              key={tier}
              ref={(el) => { if (el) tierRefs.current.set(tier, el); }}
              className={`bg-surface border rounded overflow-hidden transition-all ${
                isOver ? 'border-gold ring-1 ring-gold/30' : 'border-border'
              }`}
              onDragOver={(e) => handleDragOver(e, tier)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, tier)}
            >
              <div
                className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: `${color}33` }}
              >
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

              {items.length > 0 ? (
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {items.map((f, i) => (
                    <DraggableCard key={f.id} fragrance={f} tier={tier} index={i} />
                  ))}
                </div>
              ) : (
                <div className={`p-4 text-center text-sm transition-colors ${
                  isOver ? 'text-gold' : 'text-txt-muted'
                }`}>
                  {isOver ? 'Hier ablegen' : 'Leer'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Unranked section — always visible drop target */}
      <div
        ref={(el) => { if (el) tierRefs.current.set('unranked', el); }}
        className={`mt-8 border rounded p-4 transition-all min-h-[120px] ${
          isOverUnranked
            ? 'border-gold ring-1 ring-gold/30 bg-surface'
            : 'border-border border-dashed bg-surface/50'
        }`}
        onDragOver={(e) => handleDragOver(e, 'unranked')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'unranked')}
      >
        <h2 className="font-display text-xl text-txt-dim mb-1">
          Nicht gerankt ({unranked.length})
        </h2>
        <p className="text-xs text-txt-muted mb-3">Ziehe Parfums in einen Tier oder hierher zurück</p>

        {unranked.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {unranked.map((f) => (
              <DraggableCard key={f.id} fragrance={f} />
            ))}
          </div>
        ) : (
          <div className={`text-center text-sm py-6 transition-colors ${isOverUnranked ? 'text-gold' : 'text-txt-muted'}`}>
            {isOverUnranked ? 'Hier ablegen um Tier zu entfernen' : 'Alle Parfums sind einem Tier zugeordnet — hierher ziehen zum Entfernen'}
          </div>
        )}
      </div>
    </div>
  );
}
