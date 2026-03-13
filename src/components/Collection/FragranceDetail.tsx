import { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea, Select, StarRating, TierBadge } from '@/components/common';
import { RadarChart } from '@/components/Rating/RadarChart';
import { useImageFetch } from '@/hooks/useImageFetch';
import type { Fragrance, FragranceInput, Concentration, FragranceFamily, Season, Tier, RatingDetails } from '@/lib/types';
import { Trash2, Droplets, Loader2, Pencil } from 'lucide-react';

const concentrationOptions: { value: Concentration; label: string }[] = [
  { value: 'Parfum', label: 'Parfum' },
  { value: 'EdP', label: 'Eau de Parfum' },
  { value: 'EdT', label: 'Eau de Toilette' },
  { value: 'EdC', label: 'Eau de Cologne' },
  { value: 'Cologne', label: 'Cologne' },
  { value: 'Other', label: 'Andere' },
];

const familyOptions: { value: FragranceFamily; label: string }[] = [
  { value: 'Oriental', label: 'Oriental' },
  { value: 'Woody', label: 'Woody' },
  { value: 'Floral', label: 'Floral' },
  { value: 'Fresh', label: 'Fresh' },
  { value: 'Citrus', label: 'Citrus' },
  { value: 'Aquatic', label: 'Aquatic' },
  { value: 'Gourmand', label: 'Gourmand' },
  { value: 'Fougère', label: 'Fougère' },
  { value: 'Chypre', label: 'Chypre' },
  { value: 'Aromatic', label: 'Aromatic' },
  { value: 'Leather', label: 'Leather' },
  { value: 'Oud', label: 'Oud' },
  { value: 'Other', label: 'Andere' },
];

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
  onToast?: (message: string) => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-txt-muted uppercase tracking-wider">{label}</span>
      <p className="text-sm text-txt mt-0.5">{value}</p>
    </div>
  );
}

export function FragranceDetail({ fragrance, open, onClose, onSave, onDelete, onToast }: FragranceDetailProps) {
  const [tab, setTab] = useState<'info' | 'rating' | 'notes'>('info');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [concentration, setConcentration] = useState<Concentration>('EdP');
  const [family, setFamily] = useState<FragranceFamily>('Other');
  const [rating, setRating] = useState<RatingDetails>(defaultRating);
  const [tier, setTier] = useState<Tier | ''>('');
  const [fillLevel, setFillLevel] = useState(100);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [sizeMl, setSizeMl] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notesText, setNotesText] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { resolvedUrl: imageUrl, loading: imageLoading } = useImageFetch(
    fragrance?.name || '',
    fragrance?.brand || '',
    fragrance?.image_url,
    fragrance?.id,
  );

  useEffect(() => {
    if (fragrance) {
      setName(fragrance.name);
      setBrand(fragrance.brand);
      setConcentration(fragrance.concentration);
      setFamily(fragrance.family);
      setRating(fragrance.rating || defaultRating);
      setTier(fragrance.tier || '');
      setFillLevel(fragrance.fill_level);
      setPurchasePrice(fragrance.purchase_price?.toString() || '');
      setMarketPrice(fragrance.market_price?.toString() || '');
      setSizeMl(fragrance.size_ml?.toString() || '');
      setPurchaseDate(fragrance.purchase_date || '');
      setNotesText(fragrance.notes_text || '');
      setTab('info');
      setEditing(false);
      setConfirmDelete(false);
    }
  }, [fragrance?.id]);

  if (!fragrance) return null;

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave(fragrance.id, {
      name: name.trim() || fragrance.name,
      brand: brand.trim() || fragrance.brand,
      concentration,
      family,
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
    if (success) onToast?.(`${name.trim() || fragrance.name} gespeichert`);
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
    <Modal open={open} onClose={onClose} title={name || fragrance.name} wide>
      {/* Header with image and basic info */}
      <div className="flex gap-4 mb-6">
        <div className="w-20 h-28 rounded-sm bg-surface-2 flex items-center justify-center overflow-hidden shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={fragrance.name} loading="lazy" className="w-full h-full object-cover" />
          ) : imageLoading ? (
            <Loader2 size={18} className="text-txt-muted animate-spin" />
          ) : (
            <Droplets size={24} className="text-txt-muted" />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-txt-dim">{brand}</p>
          <p className="text-xs text-txt-muted">{concentration} · {family}</p>
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
      <div className="flex items-center gap-1 mb-4 border-b border-border pb-px">
        {(['info', 'rating', 'notes'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium transition-colors rounded-t-sm ${tab === t ? 'text-gold bg-surface-2' : 'text-txt-muted hover:text-txt'
              }`}
          >
            {t === 'info' ? 'Details' : t === 'rating' ? 'Bewertung' : 'Notizen'}
          </button>
        ))}
        {tab === 'info' && (
          <button
            onClick={() => setEditing(!editing)}
            className={`ml-auto p-2 rounded-sm transition-colors ${editing ? 'text-gold bg-surface-2' : 'text-txt-muted hover:text-txt'}`}
            title={editing ? 'Bearbeitung beenden' : 'Bearbeiten'}
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      {/* Tab content */}
      {tab === 'info' && (
        editing ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Marke"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
            <Select
              label="Konzentration"
              value={concentration}
              onChange={(e) => setConcentration(e.target.value as Concentration)}
              options={concentrationOptions}
            />
            <Select
              label="Duftfamilie"
              value={family}
              onChange={(e) => setFamily(e.target.value as FragranceFamily)}
              options={familyOptions}
            />
            <Input
              label="Kaufpreis (€)"
              type="number"
              step="0.01"
              min="0"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Marktwert (€)"
              type="number"
              step="0.01"
              min="0"
              value={marketPrice}
              onChange={(e) => setMarketPrice(e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Größe (ml)"
              type="number"
              min="0"
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
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <DetailRow label="Name" value={name} />
              <DetailRow label="Marke" value={brand} />
              <DetailRow label="Konzentration" value={concentrationOptions.find((o) => o.value === concentration)?.label || concentration} />
              <DetailRow label="Duftfamilie" value={familyOptions.find((o) => o.value === family)?.label || family} />
              <DetailRow label="Kaufpreis" value={purchasePrice ? `${purchasePrice} €` : '—'} />
              <DetailRow label="Marktwert" value={marketPrice ? `${marketPrice} €` : '—'} />
              <DetailRow label="Größe" value={sizeMl ? `${sizeMl} ml` : '—'} />
              <DetailRow label="Kaufdatum" value={purchaseDate || '—'} />
            </div>
            <div className="pt-1">
              <span className="text-xs text-txt-muted uppercase tracking-wider">Füllstand</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${fillLevel}%` }} />
                </div>
                <span className="text-xs text-txt-dim w-8 text-right">{fillLevel}%</span>
              </div>
            </div>
            {tier && (
              <div>
                <span className="text-xs text-txt-muted uppercase tracking-wider">Tier</span>
                <div className="mt-1"><TierBadge tier={tier as Tier} /></div>
              </div>
            )}
          </div>
        )
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
