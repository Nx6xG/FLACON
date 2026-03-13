import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface PublicShare {
  id: string;
  user_id: string;
  share_code: string;
  enabled: boolean;
  created_at: string;
}

function generateCode(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function usePublicShare(userId: string | undefined) {
  const [share, setShare] = useState<PublicShare | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    supabase
      .from('public_shares')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        setShare(data as PublicShare | null);
        setLoading(false);
      });
  }, [userId]);

  const createShare = useCallback(async () => {
    if (!userId) return null;

    const code = generateCode();
    const { data, error } = await supabase
      .from('public_shares')
      .insert({ user_id: userId, share_code: code, enabled: true })
      .select()
      .single();

    if (error) {
      // If already exists, fetch it
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('public_shares')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (existing) {
          setShare(existing as PublicShare);
          return existing as PublicShare;
        }
      }
      return null;
    }

    setShare(data as PublicShare);
    return data as PublicShare;
  }, [userId]);

  const toggleShare = useCallback(async () => {
    if (!share) return;

    const { data, error } = await supabase
      .from('public_shares')
      .update({ enabled: !share.enabled })
      .eq('id', share.id)
      .select()
      .single();

    if (!error && data) {
      setShare(data as PublicShare);
    }
  }, [share]);

  const shareUrl = share?.enabled
    ? `${window.location.origin}/share/${share.share_code}`
    : null;

  return { share, loading, createShare, toggleShare, shareUrl };
}
