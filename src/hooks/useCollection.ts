import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Fragrance, FragranceInput } from '@/lib/types';

export function useCollection(userId: string | undefined) {
  const [fragrances, setFragrances] = useState<Fragrance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('fragrances')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setFragrances((data as Fragrance[]) || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('fragrances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fragrances',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchAll]);

  const addFragrance = async (input: FragranceInput): Promise<Fragrance | null> => {
    if (!userId) return null;

    const { data, error: err } = await supabase
      .from('fragrances')
      .insert({ ...input, user_id: userId })
      .select()
      .single();

    if (err) {
      setError(err.message);
      return null;
    }

    return data as Fragrance;
  };

  const updateFragrance = async (
    id: string,
    updates: Partial<FragranceInput>
  ): Promise<boolean> => {
    const { error: err } = await supabase
      .from('fragrances')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (err) {
      setError(err.message);
      return false;
    }
    return true;
  };

  const deleteFragrance = async (id: string): Promise<boolean> => {
    const { error: err } = await supabase
      .from('fragrances')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (err) {
      setError(err.message);
      return false;
    }
    return true;
  };

  const collection = fragrances.filter((f) => !f.is_wishlist);
  const wishlist = fragrances.filter((f) => f.is_wishlist);

  return {
    fragrances,
    collection,
    wishlist,
    loading,
    error,
    addFragrance,
    updateFragrance,
    deleteFragrance,
    refresh: fetchAll,
  };
}
