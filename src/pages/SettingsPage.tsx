import { useState } from 'react';
import { Button } from '@/components/common';
import { usePublicShare } from '@/hooks/usePublicShare';
import type { UserProfile, Fragrance } from '@/lib/types';
import { Download, Upload, Share2, Link, Copy, Check, Eye, EyeOff } from 'lucide-react';

interface SettingsPageProps {
  profile: UserProfile | null;
  userId?: string;
  fragrances: Fragrance[];
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onImport: (data: Fragrance[]) => Promise<void>;
  onToast: (message: string) => void;
}

function validateImportData(data: unknown): data is Fragrance[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.name === 'string' &&
      item.name.trim() !== '' &&
      typeof item.brand === 'string' &&
      item.brand.trim() !== ''
  );
}

export function SettingsPage({ profile, userId, fragrances, onUpdateProfile, onImport, onToast }: SettingsPageProps) {
  const { share, loading: shareLoading, createShare, toggleShare, shareUrl } = usePublicShare(userId);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    onToast('Link kopiert');
    setTimeout(() => setCopied(false), 2000);
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
    onToast(`${fragrances.length} Düfte exportiert`);
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
        if (!validateImportData(data)) {
          onToast('Ungültiges Format — jeder Eintrag braucht mindestens Name und Marke');
          return;
        }
        await onImport(data);
        onToast(`${data.length} Düfte importiert`);
      } catch {
        onToast('Ungültige JSON-Datei');
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

      {/* Sharing */}
      <section className="bg-surface border border-border rounded p-4 mb-6">
        <h2 className="font-display text-lg text-txt mb-3 flex items-center gap-2">
          <Share2 size={18} className="text-gold" />
          Sammlung teilen
        </h2>

        {shareLoading ? (
          <p className="text-sm text-txt-muted">Laden...</p>
        ) : !share ? (
          <div>
            <p className="text-sm text-txt-muted mb-3">
              Erstelle einen öffentlichen Link, über den andere deine Sammlung ansehen können.
            </p>
            <Button onClick={createShare}>
              <Link size={14} />
              Share-Link erstellen
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${share.enabled ? 'bg-accent-fresh' : 'bg-txt-muted'}`} />
              <span className="text-sm text-txt">
                {share.enabled ? 'Öffentlich sichtbar' : 'Deaktiviert'}
              </span>
            </div>

            {share.enabled && shareUrl && (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-surface-2 border border-border rounded-sm text-xs text-txt-dim truncate">
                  {shareUrl}
                </div>
                <Button size="sm" onClick={handleCopy}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={toggleShare}>
              {share.enabled ? <EyeOff size={14} /> : <Eye size={14} />}
              {share.enabled ? 'Deaktivieren' : 'Aktivieren'}
            </Button>
          </div>
        )}
      </section>

      {/* App info */}
      <section className="text-center text-sm text-txt-muted py-8 border-t border-border">
        <p className="font-display text-lg text-gold-dim tracking-[4px] mb-1">FLACON</p>
        <p>Version 1.0.0</p>
      </section>
    </div>
  );
}
