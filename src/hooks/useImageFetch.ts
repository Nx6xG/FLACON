import { useState, useEffect, useRef } from 'react';

const PERFUMAPI_URL = import.meta.env.VITE_PERFUMAPI_URL || '';

// In-memory cache to avoid duplicate requests in the same session
const imageCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string | null>>();

/**
 * Hook that auto-fetches a missing perfume image from PerfumAPI.
 * If the perfume has no image_url, it calls GET /image?name=...&brand=...&perfume_id=...
 * The API scrapes Wikiparfum and saves the URL to Supabase.
 *
 * Returns the resolved image URL (or null while loading / on failure).
 */
export function useImageFetch(
  name: string,
  brand: string,
  imageUrl: string | null | undefined,
  perfumeId?: string,
): { resolvedUrl: string | null; loading: boolean } {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(imageUrl || null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Reset when fragrance changes
    fetchedRef.current = false;
    setResolvedUrl(imageUrl || null);
  }, [name, brand, imageUrl]);

  useEffect(() => {
    // Already have an image — nothing to do
    if (imageUrl) {
      setResolvedUrl(imageUrl);
      return;
    }

    // No API URL configured
    if (!PERFUMAPI_URL) return;

    // No name to search for
    if (!name) return;

    // Already fetched this render cycle
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Check in-memory cache first
    const cacheKey = `${name.toLowerCase()}_${brand.toLowerCase()}`;
    const cached = imageCache.get(cacheKey);
    if (cached) {
      setResolvedUrl(cached);
      return;
    }

    // Check if there's already a pending request for this perfume
    const pending = pendingRequests.get(cacheKey);
    if (pending) {
      pending.then((url) => {
        if (url) setResolvedUrl(url);
      });
      return;
    }

    // Fetch from PerfumAPI
    const fetchImage = async (): Promise<string | null> => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ name, brand });
        if (perfumeId) params.set('perfume_id', perfumeId);

        const resp = await fetch(`${PERFUMAPI_URL}/image?${params}`);
        if (!resp.ok) return null;

        const data = await resp.json();
        const url = data.image_url || null;

        if (url) {
          imageCache.set(cacheKey, url);
          setResolvedUrl(url);
        }

        return url;
      } catch (err) {
        console.warn(`Image fetch failed for ${name}:`, err);
        return null;
      } finally {
        setLoading(false);
        pendingRequests.delete(cacheKey);
      }
    };

    const promise = fetchImage();
    pendingRequests.set(cacheKey, promise);
  }, [name, brand, imageUrl, perfumeId]);

  return { resolvedUrl, loading };
}
