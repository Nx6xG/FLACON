import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Fragrance, FragranceInput } from '@/lib/types';

export function useCollection(userId: string | undefined) {
  const [fragrances, setFragrances] = useState<Fragrance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialLoadDone = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    if (!initialLoadDone.current) setLoading(true);
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
    initialLoadDone.current = true;
  }, [userId]);

  useEffect(() => {
    initialLoadDone.current = false;
    fetchAll();
  }, [fetchAll]);

  // Real-time subscription — granular event handling
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('fragrances-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fragrances',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newItem = payload.new as Fragrance;
          setFragrances((prev) => {
            if (prev.some((f) => f.id === newItem.id)) return prev;
            return [newItem, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fragrances',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Fragrance;
          setFragrances((prev) =>
            prev.map((f) => f.id === updated.id ? updated : f)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'fragrances',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const deletedId = (payload.old as any).id;
          if (deletedId) {
            setFragrances((prev) => prev.filter((f) => f.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

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

    const added = data as Fragrance;
    setFragrances((prev) => [added, ...prev]);
    return added;
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

    setFragrances((prev) =>
      prev.map((f) => f.id === id ? { ...f, ...updates, updated_at: new Date().toISOString() } as Fragrance : f)
    );
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

    setFragrances((prev) => prev.filter((f) => f.id !== id));
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
