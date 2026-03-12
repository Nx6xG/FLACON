import { Button } from '@/components/common';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface LoginPageProps {
  onSignIn: () => Promise<void>;
}

export function LoginPage({ onSignIn }: LoginPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await onSignIn();
    } catch (err) {
      setError('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="mb-12">
          <h1 className="font-display text-5xl font-light tracking-[8px] text-gold uppercase mb-2">
            <span className="font-semibold">F</span>lacon
          </h1>
          <p className="text-sm text-txt-muted tracking-wider">
            Deine Parfum-Sammlung
          </p>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-border" />
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L12 8H18L13 12L15 18L10 14L5 18L7 12L2 8H8L10 2Z" fill="#c9a96e" opacity="0.4" />
          </svg>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Sign in button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-surface border border-border rounded px-6 py-3.5 hover:border-border-light hover:bg-surface-2 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin text-gold" />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm font-medium text-txt">Mit Google anmelden</span>
            </>
          )}
        </button>

        {error && (
          <p className="text-sm text-accent-rose mt-4">{error}</p>
        )}

        <p className="text-xs text-txt-muted mt-8 leading-relaxed">
          Deine Daten werden sicher in der Cloud gespeichert und sind auf all deinen Geräten verfügbar.
        </p>
      </div>
    </div>
  );
}
