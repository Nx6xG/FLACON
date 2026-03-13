import type { Concentration, FragranceFamily } from './types';

export function mapConcentration(c: string | null): Concentration {
  if (!c) return 'Other';
  const lower = c.toLowerCase();
  if (lower.includes('parfum') && !lower.includes('eau')) return 'Parfum';
  if (lower.includes('edp') || lower.includes('eau de parfum')) return 'EdP';
  if (lower.includes('edt') || lower.includes('eau de toilette')) return 'EdT';
  if (lower.includes('edc') || lower.includes('eau de cologne')) return 'EdC';
  if (lower.includes('cologne')) return 'Cologne';
  return 'Other';
}

export function mapFamily(accords: { name: string }[]): FragranceFamily {
  if (!accords.length) return 'Other';
  const top = accords[0].name.toLowerCase();
  if (top.includes('oriental') || top.includes('amber')) return 'Oriental';
  if (top.includes('wood')) return 'Woody';
  if (top.includes('floral')) return 'Floral';
  if (top.includes('fresh')) return 'Fresh';
  if (top.includes('citrus')) return 'Citrus';
  if (top.includes('aquatic') || top.includes('marine')) return 'Aquatic';
  if (top.includes('gourmand') || top.includes('sweet')) return 'Gourmand';
  if (top.includes('aromatic')) return 'Aromatic';
  if (top.includes('leather')) return 'Leather';
  if (top.includes('oud')) return 'Oud';
  return 'Other';
}
