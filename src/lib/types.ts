// === Fragrance Types ===

export type Concentration = 'Parfum' | 'EdP' | 'EdT' | 'EdC' | 'Cologne' | 'Other';

export type FragranceFamily =
  | 'Oriental'
  | 'Woody'
  | 'Floral'
  | 'Fresh'
  | 'Citrus'
  | 'Aquatic'
  | 'Gourmand'
  | 'Fougère'
  | 'Chypre'
  | 'Aromatic'
  | 'Leather'
  | 'Oud'
  | 'Other';

export type Season = 'Frühling' | 'Sommer' | 'Herbst' | 'Winter' | 'Ganzjährig';

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';

export interface FragranceNote {
  name: string;
  layer: 'top' | 'middle' | 'base';
}

export interface RatingDetails {
  overall: number; // 1-10
  sillage: number; // 1-10
  longevity: number; // 1-10
  uniqueness: number; // 1-10
  value: number; // 1-10 (Preis-Leistung)
  compliments: number; // 1-10
  versatility: number; // 1-10
}

export interface Fragrance {
  id: string;
  user_id: string;
  name: string;
  brand: string;
  concentration: Concentration;
  family: FragranceFamily;
  season: Season[];
  notes: FragranceNote[];
  image_url: string | null;
  launch_year: number | null;
  size_ml: number | null;
  purchase_price: number | null;
  market_price: number | null;
  purchase_date: string | null;
  fill_level: number; // 0-100 percent
  rating: RatingDetails | null;
  tier: Tier | null;
  tier_rank: number | null; // position within tier
  notes_text: string; // personal notes
  is_wishlist: boolean;
  fragella_id: string | null; // external API reference
  created_at: string;
  updated_at: string;
}

// For creating/updating — omit auto-generated fields
export type FragranceInput = Omit<Fragrance, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// === Fragella API Types ===

export interface FragellaSearchResult {
  id: string;
  name: string;
  brand: string;
  image: string | null;
  concentration: string | null;
  rating: number | null;
  launch_year: number | null;
  accords: { name: string; percentage: number }[];
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  sillage: string | null;
  longevity: string | null;
  price: number | null;
}

// === Stats Types ===

export interface CollectionStats {
  totalCount: number;
  totalPurchaseValue: number;
  totalMarketValue: number;
  avgRating: number;
  avgPricePerMl: number;
  totalMl: number;
  brandDistribution: { name: string; count: number }[];
  familyDistribution: { name: string; count: number }[];
  concentrationDistribution: { name: string; count: number }[];
  topRated: Fragrance[];
  recentlyAdded: Fragrance[];
  mostExpensive: Fragrance | null;
  cheapestPerMl: Fragrance | null;
  tierDistribution: { name: string; count: number }[];
  avgFillLevel: number;
  unratedCount: number;
  wishlistCount: number;
  topNotes: { name: string; count: number }[];
  avgRatingBreakdown: {
    sillage: number;
    longevity: number;
    uniqueness: number;
    value: number;
    compliments: number;
    versatility: number;
  } | null;
  fillBuckets: { name: string; count: number }[];
  priceRanges: { name: string; count: number }[];
  timeline: { name: string; count: number }[];
}

// === Auth Types ===

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  currency: string;
  created_at: string;
}
