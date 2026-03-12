import { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea, Select, StarRating, TierBadge } from '@/components/common';
import { RadarChart } from '@/components/Rating/RadarChart';
import type { Fragrance, FragranceInput, Concentration, FragranceFamily, Season, Tier, RatingDetails } from '@/lib/types';
import { Trash2, ExternalLink, Droplets } from 'lucide-react';

const concentrations: Concentration[] = ['Parfum', 'EdP', 'EdT', 'EdC', 'Cologne', 'Other'];
const families: FragranceFamily[] = ['Oriental', 'Woody', 'Floral', 'Fresh', 'Citrus', 'Aquatic', 'Gourmand', 'Fougère', 'Chypre', 'Aromatic', 'Leather', 'Oud', 'Other'];
const seasons: Season[] = ['Frühling', 'Sommer', 'Herbst', 'Winter', 'Ganzjährig'];
const tiers: (Tier | '')[] = ['', 'S', 'A', 'B', 'C', 'D'];

const defaultRating: RatingDetails = {
  overall: 0,
  sillage: 0,
  longevity: 0,
  uniqueness: 0,
  value: 0,
  compliments: 0,
  versatility: 0,
};

interface FragranceDetailProps {
  fragrance: Fragrance | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<FragranceInput>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function FragranceDetail({ fragrance, open, onClose, onSave, onDelete }: FragranceDetailProps) {
  const [tab, setTab] = useState<'info' | 'rating' | 'notes'>('info');
  const [rating, setRating] = useState<RatingDetails>(defaultRating);
  const [tier, setTier] = useState<Tier | ''>('');
  const [fillLevel, setFillLevel] = useState(100);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [sizeMl, setSizeMl] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notesText, setNotesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (fragrance) {
      setRating(fragrance.rating || defaultRating);
      setTier(fragrance.tier || '');
      setFillLevel(fragrance.fill_level);
      setPurchasePrice(fragrance.purchase_price?.toString() || '');
      setMarketPrice(fragrance.market_price?.toString() || '');
      setSizeMl(fragrance.size_ml?.toString() || '');
      setPurchaseDate(fragrance.purchase_date || '');
      setNotesText(fragrance.notes_text || '');
      setTab('info');
      setConfirmDelete(false);
    }
  }, [fragrance]);

  if (!fragrance) return null;

  const handleSave = async () => {
    setSaving(true);
    await onSave(fragrance.id, {
      rating: rating.overall > 0 ? rating : null,
      tier: tier || null,
      fill_level: fillLevel,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      market_price: marketPrice ? parseFloat(marketPrice) : null,
      size_ml: sizeMl ? parseFloat(sizeMl) : null,
      purchase_date: purchaseDate || null,
      notes_text: notesText,
    });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    await onDelete(fragrance.id);
    setDeleting(false);
    onClose();
  };

  const updateRating = (key: keyof RatingDetails, val: number) => {
    setRating((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <Modal open={open} onClose={onClose} title={fragrance.name} wide>
      {/* Header with image and basic info */}
      <div className="flex gap-4 mb-6">
        <div className="w-20 h-28 rounded-sm bg-surface-2 flex items-center justify-center overflow-hidden shrink-0">
          {fragrance.image_url ? (
            <img src={fragrance.image_url} alt={fragrance.name} className="w-full h-full object-cover" />
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
          {fragrance.notes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {fragrance.notes.slice(0, 6).map((n, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-surface-2 border border-border rounded-full text-txt-muted">
                  {n.name}
                </span>
              ))}
              {fragrance.notes.length > 6 && (
                <span className="text-[10px] text-txt-muted">+{fragrance.notes.length - 6}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border pb-px">
        {(['info', 'rating', 'notes'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium transition-colors rounded-t-sm ${
              tab === t ? 'text-gold bg-surface-2' : 'text-txt-muted hover:text-txt'
            }`}
          >
            {t === 'info' ? 'Details' : t === 'rating' ? 'Bewertung' : 'Notizen'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'info' && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Kaufpreis (€)"
            type="number"
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Marktwert (€)"
            type="number"
            step="0.01"
            value={marketPrice}
            onChange={(e) => setMarketPrice(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Größe (ml)"
            type="number"
            value={sizeMl}
            onChange={(e) => setSizeMl(e.target.value)}
            placeholder="100"
          />
          <Input
            label="Kaufdatum"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
          <div className="col-span-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-txt-muted uppercase tracking-wider">
                Füllstand: {fillLevel}%
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={fillLevel}
                onChange={(e) => setFillLevel(parseInt(e.target.value))}
                className="w-full accent-gold"
              />
            </label>
          </div>
          <div className="col-span-2">
            <Select
              label="Tier"
              value={tier}
              onChange={(e) => setTier(e.target.value as Tier | '')}
              options={tiers.map((t) => ({ value: t, label: t || '— Kein Tier —' }))}
            />
          </div>
        </div>
      )}

      {tab === 'rating' && (
        <div className="space-y-4">
          <StarRating
            label="Gesamtbewertung"
            value={rating.overall}
            onChange={(v) => updateRating('overall', v)}
          />
          <div className="grid grid-cols-2 gap-3">
            <StarRating label="Sillage" value={rating.sillage} max={10} onChange={(v) => updateRating('sillage', v)} size="sm" />
            <StarRating label="Longevity" value={rating.longevity} max={10} onChange={(v) => updateRating('longevity', v)} size="sm" />
            <StarRating label="Einzigartigkeit" value={rating.uniqueness} max={10} onChange={(v) => updateRating('uniqueness', v)} size="sm" />
            <StarRating label="Preis-Leistung" value={rating.value} max={10} onChange={(v) => updateRating('value', v)} size="sm" />
            <StarRating label="Komplimente" value={rating.compliments} max={10} onChange={(v) => updateRating('compliments', v)} size="sm" />
            <StarRating label="Vielseitigkeit" value={rating.versatility} max={10} onChange={(v) => updateRating('versatility', v)} size="sm" />
          </div>
          {rating.sillage > 0 && (
            <div className="mt-4 flex justify-center">
              <RadarChart rating={rating} size={220} />
            </div>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <Textarea
          label="Persönliche Notizen"
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          rows={6}
          placeholder="Deine Gedanken zu diesem Duft..."
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
          <Trash2 size={14} />
          {confirmDelete ? 'Wirklich löschen?' : 'Löschen'}
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Speichert...' : 'Speichern'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
