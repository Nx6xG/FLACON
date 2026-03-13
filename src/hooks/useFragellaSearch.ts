import { useState, useCallback } from 'react';
import { getFragellaAPI } from '@/lib/fragella';
import type { FragellaSearchResult } from '@/lib/types';

export function useFragellaSearch() {
  const [results, setResults] = useState<FragellaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (query: string) => {
      const api = getFragellaAPI();
      if (!api) {
        setError('Suche nicht verfügbar');
        return;
      }

      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await api.search(query);
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Suche fehlgeschlagen');
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clear = () => {
    setResults([]);
    setError(null);
  };

  return { results, loading, error, search, clear };
}