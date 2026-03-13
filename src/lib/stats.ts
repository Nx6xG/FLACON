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

  // Total ml
  const totalMl = owned.reduce((sum, f) => sum + (f.size_ml || 0), 0);

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

  // Tier distribution
  const tierMap = new Map<string, number>();
  owned.forEach((f) => {
    const t = f.tier || 'Kein Tier';
    tierMap.set(t, (tierMap.get(t) || 0) + 1);
  });
  const tierOrder = ['S', 'A', 'B', 'C', 'D', 'Kein Tier'];
  const tierDistribution = tierOrder
    .filter((t) => tierMap.has(t))
    .map((t) => ({ name: t, count: tierMap.get(t)! }));

  // Average fill level
  const avgFillLevel = owned.length > 0
    ? owned.reduce((sum, f) => sum + f.fill_level, 0) / owned.length
    : 0;

  // Unrated count
  const unratedCount = owned.filter((f) => !f.rating?.overall).length;

  // Wishlist count
  const wishlistCount = fragrances.filter((f) => f.is_wishlist).length;

  // Top notes frequency
  const noteMap = new Map<string, number>();
  owned.forEach((f) => f.notes.forEach((n) => noteMap.set(n.name, (noteMap.get(n.name) || 0) + 1)));
  const topNotes = Array.from(noteMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Average rating breakdown
  const avgRatingBreakdown = rated.length > 0 ? {
    sillage: rated.reduce((s, f) => s + (f.rating?.sillage || 0), 0) / rated.length,
    longevity: rated.reduce((s, f) => s + (f.rating?.longevity || 0), 0) / rated.length,
    uniqueness: rated.reduce((s, f) => s + (f.rating?.uniqueness || 0), 0) / rated.length,
    value: rated.reduce((s, f) => s + (f.rating?.value || 0), 0) / rated.length,
    compliments: rated.reduce((s, f) => s + (f.rating?.compliments || 0), 0) / rated.length,
    versatility: rated.reduce((s, f) => s + (f.rating?.versatility || 0), 0) / rated.length,
  } : null;

  // Fill level distribution
  const fillBuckets = [
    { name: 'Leer (0–10%)', count: owned.filter((f) => f.fill_level <= 10).length },
    { name: 'Niedrig (11–25%)', count: owned.filter((f) => f.fill_level > 10 && f.fill_level <= 25).length },
    { name: 'Halb (26–50%)', count: owned.filter((f) => f.fill_level > 25 && f.fill_level <= 50).length },
    { name: 'Gut (51–75%)', count: owned.filter((f) => f.fill_level > 50 && f.fill_level <= 75).length },
    { name: 'Voll (76–100%)', count: owned.filter((f) => f.fill_level > 75).length },
  ].filter((b) => b.count > 0);

  // Price range distribution
  const withPrice = owned.filter((f) => f.purchase_price);
  const priceRanges = withPrice.length > 0 ? [
    { name: '0–50 €', count: withPrice.filter((f) => f.purchase_price! <= 50).length },
    { name: '51–100 €', count: withPrice.filter((f) => f.purchase_price! > 50 && f.purchase_price! <= 100).length },
    { name: '101–200 €', count: withPrice.filter((f) => f.purchase_price! > 100 && f.purchase_price! <= 200).length },
    { name: '201–300 €', count: withPrice.filter((f) => f.purchase_price! > 200 && f.purchase_price! <= 300).length },
    { name: '300+ €', count: withPrice.filter((f) => f.purchase_price! > 300).length },
  ].filter((b) => b.count > 0) : [];

  // Collection timeline (monthly additions)
  const monthMap = new Map<string, number>();
  owned.forEach((f) => {
    const d = new Date(f.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, (monthMap.get(key) || 0) + 1);
  });
  const timeline = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => {
      const [y, m] = month.split('-');
      const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
      return { name: label, count };
    });

  // Blind buy count
  const blindBuyCount = owned.filter((f) => f.is_blind_buy).length;

  // Occasion distribution
  const occasionMap = new Map<string, number>();
  owned.forEach((f) => (f.occasions || []).forEach((o) => occasionMap.set(o, (occasionMap.get(o) || 0) + 1)));
  const occasionDistribution = Array.from(occasionMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Season distribution
  const seasonMap = new Map<string, number>();
  owned.forEach((f) => (f.season || []).forEach((s) => seasonMap.set(s, (seasonMap.get(s) || 0) + 1)));
  const seasonDistribution = Array.from(seasonMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Launch year distribution (decade buckets)
  const decadeMap = new Map<string, number>();
  owned.filter((f) => f.launch_year).forEach((f) => {
    const decade = `${Math.floor(f.launch_year! / 10) * 10}er`;
    decadeMap.set(decade, (decadeMap.get(decade) || 0) + 1);
  });
  const launchYearDistribution = Array.from(decadeMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Oldest & newest fragrance by launch year
  const withYear = owned.filter((f) => f.launch_year);
  const oldestFragrance = withYear.length > 0
    ? withYear.reduce((min, f) => f.launch_year! < min.launch_year! ? f : min)
    : null;
  const newestFragrance = withYear.length > 0
    ? withYear.reduce((max, f) => f.launch_year! > max.launch_year! ? f : max)
    : null;

  // Most expensive per ml
  const mostExpensivePerMl = withPriceMl.length > 0
    ? withPriceMl.reduce((max, f) => {
        const ppm = f.purchase_price! / f.size_ml!;
        const maxPpm = max.purchase_price! / max.size_ml!;
        return ppm > maxPpm ? f : max;
      })
    : null;

  // Best sillage, longevity, compliments
  const ratedWithDetails = owned.filter((f) => f.rating && f.rating.sillage > 0);
  const bestSillage = ratedWithDetails.length > 0
    ? ratedWithDetails.reduce((best, f) => (f.rating!.sillage > (best.rating?.sillage || 0) ? f : best))
    : null;
  const bestLongevity = ratedWithDetails.length > 0
    ? ratedWithDetails.reduce((best, f) => (f.rating!.longevity > (best.rating?.longevity || 0) ? f : best))
    : null;
  const bestCompliments = ratedWithDetails.length > 0
    ? ratedWithDetails.reduce((best, f) => (f.rating!.compliments > (best.rating?.compliments || 0) ? f : best))
    : null;

  return {
    totalCount: owned.length,
    totalPurchaseValue,
    totalMarketValue,
    avgRating,
    avgPricePerMl,
    totalMl,
    brandDistribution,
    familyDistribution,
    concentrationDistribution,
    topRated,
    recentlyAdded,
    mostExpensive,
    cheapestPerMl,
    tierDistribution,
    avgFillLevel,
    unratedCount,
    wishlistCount,
    topNotes,
    avgRatingBreakdown,
    fillBuckets,
    priceRanges,
    timeline,
    blindBuyCount,
    occasionDistribution,
    seasonDistribution,
    launchYearDistribution,
    oldestFragrance,
    newestFragrance,
    mostExpensivePerMl,
    bestSillage,
    bestLongevity,
    bestCompliments,
  };
}
