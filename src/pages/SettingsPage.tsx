import { useState } from 'react';
import { Button, Input } from '@/components/common';
import type { UserProfile, Fragrance } from '@/lib/types';
import { Download, Upload } from 'lucide-react';

interface SettingsPageProps {
  profile: UserProfile | null;
  fragrances: Fragrance[];
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onImport: (data: Fragrance[]) => Promise<void>;
}

export function SettingsPage({ profile, fragrances, onUpdateProfile, onImport }: SettingsPageProps) {
  const [message, setMessage] = useState('');

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
