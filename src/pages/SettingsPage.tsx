import { useState } from 'react';
import { Button, Input } from '@/components/common';
import type { UserProfile, Fragrance } from '@/lib/types';
import { Key, Download, Upload, Trash2, ExternalLink } from 'lucide-react';

interface SettingsPageProps {
  profile: UserProfile | null;
  fragrances: Fragrance[];
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onImport: (data: Fragrance[]) => Promise<void>;
}

export function SettingsPage({ profile, fragrances, onUpdateProfile, onImport }: SettingsPageProps) {
  const [apiUrl, setApiUrl] = useState(profile?.fragella_api_key || import.meta.env.VITE_PERFUMAPI_URL || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveApiUrl = async () => {
    setSaving(true);
    try {
      await onUpdateProfile({ fragella_api_key: apiUrl || null });
      setMessage('API-URL gespeichert!');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Fehler beim Speichern');
    }
    setSaving(false);
  };

  const handleExport = () => {
    const data = JSON.stringify(fragrances, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flacon-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          await onImport(data);
          setMessage(`${data.length} Düfte importiert!`);
          setTimeout(() => setMessage(''), 3000);
        }
      } catch {
        setMessage('Ungültige JSON-Datei');
      }
    };
    input.click();
  };

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl font-light text-txt mb-6">
        Einstellungen
      </h1>

      {/* Fragella API Key */}
      <section className="bg-surface border border-border rounded p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Key size={18} className="text-gold" />
          <h2 className="font-display text-lg text-txt">PerfumAPI</h2>
        </div>
        <p className="text-sm text-txt-muted mb-3">
          Deine selbst-gehostete Parfum-API. Sucht automatisch in der Datenbank und scrapt Fragrantica bei Bedarf.
        </p>
        <div className="flex gap-2">
          <Input
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://dein-service.onrender.com"
            className="flex-1"
          />
          <Button onClick={handleSaveApiUrl} disabled={saving}>
            {saving ? 'Speichert...' : 'Speichern'}
          </Button>
        </div>
        {message && (
          <p className="text-sm text-accent-fresh mt-2">{message}</p>
        )}
      </section>

      {/* Data management */}
      <section className="bg-surface border border-border rounded p-4 mb-6">
        <h2 className="font-display text-lg text-txt mb-3">Daten</h2>
        <div className="flex flex-col gap-2">
          <Button variant="ghost" onClick={handleExport}>
            <Download size={16} />
            Sammlung exportieren (JSON)
          </Button>
          <Button variant="ghost" onClick={handleImport}>
            <Upload size={16} />
            Sammlung importieren
          </Button>
        </div>
        <p className="text-xs text-txt-muted mt-3">
          {fragrances.length} Einträge in deiner Datenbank
        </p>
      </section>

      {/* App info */}
      <section className="text-center text-sm text-txt-muted py-8 border-t border-border">
        <p className="font-display text-lg text-gold-dim tracking-[4px] mb-1">FLACON</p>
        <p>Version 1.0.0</p>
      </section>
    </div>
  );
}
