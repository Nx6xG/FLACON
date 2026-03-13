import { useState, useRef, useEffect } from 'react';
import { Modal, Button } from '@/components/common';
import { useImageFetch } from '@/hooks/useImageFetch';
import type { Fragrance, Season } from '@/lib/types';
import { Dices, Droplets, Filter } from 'lucide-react';

function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Frühling';
  if (month >= 5 && month <= 7) return 'Sommer';
  if (month >= 8 && month <= 10) return 'Herbst';
  return 'Winter';
}

function PickerImage({ fragrance }: { fragrance: Fragrance }) {
  const { resolvedUrl } = useImageFetch(fragrance.name, fragrance.brand, fragrance.image_url, fragrance.id);
  return resolvedUrl ? (
    <img src={resolvedUrl} alt={fragrance.name} className="w-full h-full object-cover" />
  ) : (
    <Droplets size={32} className="text-txt-muted" />
  );
}

interface RandomPickerProps {
  open: boolean;
  onClose: () => void;
  collection: Fragrance[];
  onSelect: (f: Fragrance) => void;
}

export function RandomPicker({ open, onClose, collection, onSelect }: RandomPickerProps) {
  const [result, setResult] = useState<Fragrance | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [seasonFilter, setSeasonFilter] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [displayFrag, setDisplayFrag] = useState<Fragrance | null>(null);

  const candidates = seasonFilter
    ? collection.filter((f) => {
        const season = getCurrentSeason();
        return f.season?.includes(season) || f.season?.includes('Ganzjährig');
      })
    : collection;

  useEffect(() => {
    if (!open) {
      setResult(null);
      setSpinning(false);
      setDisplayFrag(null);
    }
  }, [open]);

  const spin = () => {
    if (candidates.length === 0) return;
    setResult(null);
    setSpinning(true);

    let count = 0;
    const totalCycles = 20 + Math.floor(Math.random() * 10);

    intervalRef.current = setInterval(() => {
      const idx = Math.floor(Math.random() * candidates.length);
      setDisplayFrag(candidates[idx]);
      count++;

      if (count >= totalCycles) {
        clearInterval(intervalRef.current!);
        const finalIdx = Math.floor(Math.random() * candidates.length);
        const pick = candidates[finalIdx];
        setDisplayFrag(pick);
        setResult(pick);
        setSpinning(false);
      }
    }, count < 10 ? 80 : count < 20 ? 120 : 180);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const currentSeason = getCurrentSeason();

  return (
    <Modal open={open} onClose={onClose} title="Zufälliger Duft">
      <div className="flex flex-col items-center py-4">
        {/* Season filter toggle */}
        <button
          onClick={() => setSeasonFilter(!seasonFilter)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs mb-6 border transition-colors ${
            seasonFilter
              ? 'bg-gold/15 border-gold/30 text-gold'
              : 'bg-surface-2 border-border text-txt-muted hover:border-border-light'
          }`}
        >
          <Filter size={12} />
          Nur {currentSeason}
          {seasonFilter && ` (${candidates.length})`}
        </button>

        {/* Display area */}
        <div className={`w-36 h-48 rounded-lg bg-surface-2 border-2 flex items-center justify-center overflow-hidden mb-6 transition-all duration-300 ${
          spinning ? 'border-gold/40 scale-105' : result ? 'border-gold' : 'border-border'
        }`}>
          {displayFrag ? (
            <div className={`w-full h-full ${spinning ? 'animate-pulse' : ''}`}>
              <PickerImage fragrance={displayFrag} />
            </div>
          ) : (
            <Dices size={48} className="text-txt-muted" />
          )}
        </div>

        {/* Name display */}
        <div className="text-center mb-6 h-14">
          {displayFrag && (
            <>
              <p className={`text-lg font-display transition-all ${result ? 'text-gold' : 'text-txt'}`}>
                {displayFrag.name}
              </p>
              <p className="text-sm text-txt-muted">{displayFrag.brand}</p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {result ? (
            <>
              <Button variant="ghost" onClick={spin}>
                <Dices size={16} />
                Nochmal
              </Button>
              <Button onClick={() => { onSelect(result); onClose(); }}>
                Details ansehen
              </Button>
            </>
          ) : (
            <Button onClick={spin} disabled={spinning || candidates.length === 0}>
              <Dices size={16} />
              {spinning ? 'Dreht...' : candidates.length === 0 ? 'Keine passenden Düfte' : 'Drehen!'}
            </Button>
          )}
        </div>

        {candidates.length > 0 && !spinning && !result && (
          <p className="text-xs text-txt-muted mt-4">
            {candidates.length} Düfte im Pool
          </p>
        )}
      </div>
    </Modal>
  );
}
