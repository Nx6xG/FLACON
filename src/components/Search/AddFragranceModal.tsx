import { useState } from 'react';
import { Modal, Button, Input, Select } from '@/components/common';
import type { FragranceInput, Concentration, FragranceFamily } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

const concentrations: { value: Concentration; label: string }[] = [
  { value: 'Parfum', label: 'Parfum' },
  { value: 'EdP', label: 'Eau de Parfum' },
  { value: 'EdT', label: 'Eau de Toilette' },
  { value: 'EdC', label: 'Eau de Cologne' },
  { value: 'Cologne', label: 'Cologne' },
  { value: 'Other', label: 'Andere' },
];

const families: { value: FragranceFamily; label: string }[] = [
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

interface AddFragranceModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (input: FragranceInput) => Promise<any>;
  isWishlist?: boolean;
  existingIds?: Set<string>;
}

export function AddFragranceModal({ open, onClose, onAdd, isWishlist, existingIds }: AddFragranceModalProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [concentration, setConcentration] = useState<Concentration>('EdP');
  const [family, setFamily] = useState<FragranceFamily>('Fresh');

  const manualDuplicate = name.trim() && brand.trim()
    ? existingIds?.has(`${name.trim().toLowerCase()}::${brand.trim().toLowerCase()}`) || false
    : false;

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brand.trim()) return;

    setAdding(true);
    const input: FragranceInput = {
      name: name.trim(),
      brand: brand.trim(),
      concentration,
      family,
      season: ['Ganzjährig'],
      notes: [],
      image_url: null,
      launch_year: null,
      size_ml: null,
      purchase_price: null,
      market_price: null,
      purchase_date: null,
      fill_level: 100,
      rating: null,
      tier: null,
      tier_rank: null,
      occasions: [],
      is_blind_buy: false,
      notes_text: '',
      is_wishlist: isWishlist || false,
      fragella_id: null,
    };

    await onAdd(input);
    setAdding(false);
  };

  const resetAndClose = () => {
    setName('');
    setBrand('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={isWishlist ? 'Zur Wunschliste hinzufügen' : 'Parfum hinzufügen'}
    >
      <form onSubmit={handleAddManual} className="space-y-3">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Sauvage"
          required
        />
        <Input
          label="Marke"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="z.B. Dior"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Konzentration"
            value={concentration}
            onChange={(e) => setConcentration(e.target.value as Concentration)}
            options={concentrations}
          />
          <Select
            label="Duftfamilie"
            value={family}
            onChange={(e) => setFamily(e.target.value as FragranceFamily)}
            options={families}
          />
        </div>
        {manualDuplicate && (
          <div className="flex items-center gap-2 px-3 py-2 bg-accent-amber/10 border border-accent-amber/20 rounded-sm">
            <AlertTriangle size={14} className="text-accent-amber shrink-0" />
            <span className="text-xs text-accent-amber">Dieses Parfum ist bereits in deiner Sammlung.</span>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={resetAndClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={adding || !name.trim() || !brand.trim()}>
            {adding ? 'Wird hinzugefügt...' : manualDuplicate ? 'Trotzdem hinzufügen' : 'Hinzufügen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
