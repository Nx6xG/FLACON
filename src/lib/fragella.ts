import type { FragellaSearchResult } from './types';
import { supabase } from './supabase';

/**
 * Direct Supabase search + Fragella CDN images.
 * Images are loaded directly in the browser from cdn.fragella.com (no API key needed).
 */

function generateImageUrl(name: string, brand: string): string {
  // Fragella CDN pattern: https://cdn.fragella.com/images/name-brand.jpg
  // Convert "Sauvage Parfum" + "Dior" → "sauvage-parfum-dior"
  const slug = `${name} ${brand}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, ''); // trim hyphens

  return `https://cdn.fragella.com/images/${slug}.jpg`;
}

export class FragellaAPI {
  constructor(_unused?: string) { }

  async search(query: string, limit = 10): Promise<FragellaSearchResult[]> {
    const q = `%${query}%`;
    const { data, error } = await supabase
      .from('perfume_catalog')
      .select('*')
      .or(`name.ilike.${q},brand.ilike.${q}`)
      .order('votes', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Search error:', error);
      return [];
    }

    return this.mapResults(data || []);
  }

  async getByBrand(brand: string, limit = 20): Promise<FragellaSearchResult[]> {
    const { data, error } = await supabase
      .from('perfume_catalog')
      .select('*')
      .ilike('brand', `%${brand}%`)
      .order('votes', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) return [];
    return this.mapResults(data || []);
  }

  async getSimilar(name: string, limit = 5): Promise<FragellaSearchResult[]> {
    return this.search(name, limit);
  }

  private mapResults(items: any[]): FragellaSearchResult[] {
    if (!Array.isArray(items)) return [];

    return items.map((item: any, index: number) => {
      // Generate Fragella CDN image URL from name + brand
      const imageUrl = item.image_url || generateImageUrl(item.name || '', item.brand || '');

      return {
        id: item.id || `catalog-${index}-${Date.now()}`,
        name: item.name || '',
        brand: item.brand || '',
        image: imageUrl,
        concentration: null,
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
      };
    });
  }
}

let instance: FragellaAPI | null = null;

export function getFragellaAPI(_unused?: string): FragellaAPI | null {
  if (!instance) {
    instance = new FragellaAPI();
  }
  return instance;
}