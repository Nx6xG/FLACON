import { useState, useCallback } from 'react';
import { getFragellaAPI } from '@/lib/fragella';
import type { FragellaSearchResult } from '@/lib/types';

const HISTORY_KEY = 'flacon-search-history';
const MAX_HISTORY = 8;

function getHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function addToHistory(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const history = getHistory().filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
  history.unshift(trimmed);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

// Result cache — avoids repeated API calls for the same query
const resultCache = new Map<string, FragellaSearchResult[]>();
const MAX_CACHE = 20;

function getCached(key: string): FragellaSearchResult[] | undefined {
  return resultCache.get(key.toLowerCase().trim());
}

function setCache(key: string, data: FragellaSearchResult[]) {
  const k = key.toLowerCase().trim();
  resultCache.delete(k); // re-insert to move to end (most recent)
  resultCache.set(k, data);
  if (resultCache.size > MAX_CACHE) {
    const oldest = resultCache.keys().next().value;
    if (oldest) resultCache.delete(oldest);
  }
}

export function useFragellaSearch() {
  const [results, setResults] = useState<FragellaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(getHistory);

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

      // Check cache first
      const cached = getCached(query);
      if (cached) {
        setResults(cached);
        addToHistory(query);
        setHistory(getHistory());
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await api.search(query);
        setResults(data);
        setCache(query, data);
        addToHistory(query);
        setHistory(getHistory());
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

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }, []);

  return { results, loading, error, search, clear, history, clearHistory };
}