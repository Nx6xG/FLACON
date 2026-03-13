import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface WearEntry {
  id: string;
  user_id: string;
  fragrance_id: string;
  worn_at: string; // YYYY-MM-DD
  sprays: number | null;
  note: string;
  created_at: string;
}

export function useWearLog(userId: string | undefined) {
  const [entries, setEntries] = useState<WearEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('wear_log')
      .select('*')
      .eq('user_id', userId)
      .order('worn_at', { ascending: false });
    setEntries((data as WearEntry[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const logWear = async (fragranceId: string, date?: string, sprays?: number, note?: string): Promise<boolean> => {
    if (!userId) return false;
    const { data, error } = await supabase
      .from('wear_log')
      .insert({
        user_id: userId,
        fragrance_id: fragranceId,
        worn_at: date || new Date().toISOString().split('T')[0],
        sprays: sprays || null,
        note: note || '',
      })
      .select()
      .single();
    if (error) return false;
    setEntries((prev) => [data as WearEntry, ...prev]);
    return true;
  };

  const removeEntry = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('wear_log')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return false;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    return true;
  };

  return { entries, loading, logWear, removeEntry, refresh: fetchAll };
}
