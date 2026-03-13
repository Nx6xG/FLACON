import type { FragellaSearchResult } from './types';

/**
 * Search via PerfumAPI → Wikiparfum scraper.
 * Flow: FLACON → PerfumAPI /search → Wikiparfum (live scrape) → cache in Supabase → return
 */

const PERFUMAPI_URL = import.meta.env.VITE_PERFUMAPI_URL || '';

export class FragellaAPI {
  constructor() { }

  async search(query: string, limit = 10): Promise<FragellaSearchResult[]> {
    if (!PERFUMAPI_URL) {
      console.warn('VITE_PERFUMAPI_URL not set');
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      });

      const resp = await fetch(`${PERFUMAPI_URL}/search?${params}`);
      if (!resp.ok) {
        console.error('PerfumAPI search error:', resp.status);
        return [];
      }

      const data = await resp.json();
      return this.mapResults(data.perfumes || []);
    } catch (err) {
      console.error('PerfumAPI search failed:', err);
      return [];
    }
  }

  async getByBrand(brand: string, limit = 20): Promise<FragellaSearchResult[]> {
    return this.search(brand, limit);
  }

  async getSimilar(name: string, limit = 5): Promise<FragellaSearchResult[]> {
    return this.search(name, limit);
  }

  private mapResults(items: any[]): FragellaSearchResult[] {
    if (!Array.isArray(items)) return [];

    return items.map((item: any, index: number) => ({
      id: item.id || `wp-${index}-${Date.now()}`,
      name: item.name || '',
      brand: item.brand || '',
      image: item.image_url || null,
      concentration: item.concentration || null,
      rating: item.rating || null,
      launch_year: item.release_year || null,
      accords: [],
      notes: {
        top: Array.isArray(item.notes_top) ? item.notes_top : [],
        middle: Array.isArray(item.notes_middle) ? item.notes_middle : [],
        base: Array.isArray(item.notes_base) ? item.notes_base : [],
      },
      sillage: item.sillage || null,
      longevity: item.longevity || null,
      price: null,
    }));
  }
}

let instance: FragellaAPI | null = null;

export function getFragellaAPI(): FragellaAPI | null {
  if (!instance) {
    instance = new FragellaAPI();
  }
  return instance;
}