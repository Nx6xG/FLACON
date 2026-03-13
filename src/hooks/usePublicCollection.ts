import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Fragrance } from '@/lib/types';

interface PublicCollectionData {
  fragrances: Fragrance[];
  profile: { display_name: string | null; avatar_url: string | null } | null;
  loading: boolean;
  error: string | null;
}

export function usePublicCollection(shareCode: string | undefined): PublicCollectionData {
  const [fragrances, setFragrances] = useState<Fragrance[]>([]);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareCode) { setLoading(false); return; }

    async function load() {
      setLoading(true);
      setError(null);

      // 1. Get the share record
      const { data: share, error: shareErr } = await supabase
        .from('public_shares')
        .select('user_id')
        .eq('share_code', shareCode)
        .eq('enabled', true)
        .maybeSingle();

      if (shareErr || !share) {
        setError('Sammlung nicht gefunden oder nicht öffentlich.');
        setLoading(false);
        return;
      }

      // 2. Fetch fragrances
      const { data: items, error: fragErr } = await supabase
        .from('fragrances')
        .select('*')
        .eq('user_id', share.user_id)
        .eq('is_wishlist', false)
        .order('created_at', { ascending: false });

      if (fragErr) {
        setError('Fehler beim Laden der Sammlung.');
        setLoading(false);
        return;
      }

      setFragrances((items as Fragrance[]) || []);

      // 3. Fetch profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', share.user_id)
        .maybeSingle();

      setProfile(prof);
      setLoading(false);
    }

    load();
  }, [shareCode]);

  return { fragrances, profile, loading, error };
}
