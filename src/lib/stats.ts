import type { Fragrance, CollectionStats } from './types';

export function computeStats(fragrances: Fragrance[]): CollectionStats {
  const owned = fragrances.filter((f) => !f.is_wishlist);

  const totalPurchaseValue = owned.reduce((sum, f) => sum + (f.purchase_price || 0), 0);
  const totalMarketValue = owned.reduce((sum, f) => sum + (f.market_price || 0), 0);

  const rated = owned.filter((f) => f.rating?.overall);
  const avgRating =
    rated.length > 0
      ? rated.reduce((sum, f) => sum + (f.rating?.overall || 0), 0) / rated.length
      : 0;

  const withPriceMl = owned.filter((f) => f.purchase_price && f.size_ml);
  const avgPricePerMl =
    withPriceMl.length > 0
      ? withPriceMl.reduce((sum, f) => sum + f.purchase_price! / f.size_ml!, 0) /
        withPriceMl.length
      : 0;

  // Brand distribution
  const brandMap = new Map<string, number>();
  owned.forEach((f) => brandMap.set(f.brand, (brandMap.get(f.brand) || 0) + 1));
  const brandDistribution = Array.from(brandMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Family distribution
  const familyMap = new Map<string, number>();
  owned.forEach((f) => familyMap.set(f.family, (familyMap.get(f.family) || 0) + 1));
  const familyDistribution = Array.from(familyMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Concentration distribution
  const concMap = new Map<string, number>();
  owned.forEach((f) =>
    concMap.set(f.concentration, (concMap.get(f.concentration) || 0) + 1)
  );
  const concentrationDistribution = Array.from(concMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Top rated
  const topRated = [...rated].sort((a, b) => (b.rating?.overall || 0) - (a.rating?.overall || 0)).slice(0, 5);

  // Recently added
  const recentlyAdded = [...owned]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Most expensive
  const mostExpensive = owned.reduce<Fragrance | null>(
    (max, f) => (!max || (f.purchase_price || 0) > (max.purchase_price || 0) ? f : max),
    null
  );

  // Cheapest per ml
  const cheapestPerMl = withPriceMl.reduce<Fragrance | null>((min, f) => {
    const ppm = f.purchase_price! / f.size_ml!;
    const minPpm = min ? min.purchase_price! / min.size_ml! : Infinity;
    return ppm < minPpm ? f : min;
  }, null);

  return {
    totalCount: owned.length,
    totalPurchaseValue,
    totalMarketValue,
    avgRating,
    avgPricePerMl,
    brandDistribution,
    familyDistribution,
    concentrationDistribution,
    topRated,
    recentlyAdded,
    mostExpensive,
    cheapestPerMl,
  };
}
