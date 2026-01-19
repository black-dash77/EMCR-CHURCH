import { supabase } from '../supabase';
import type { Sermon } from '@/types';

export const sermonsApi = {
  async getAll(): Promise<Sermon[]> {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Sermon | null> {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getLatest(limit: number = 5): Promise<Sermon[]> {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async search(query: string): Promise<Sermon[]> {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .or(`title.ilike.%${query}%,speaker.ilike.%${query}%,description.ilike.%${query}%`)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByTags(tags: string[]): Promise<Sermon[]> {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .overlaps('tags', tags)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByYear(year: number): Promise<Sermon[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('sermons-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sermons' },
        callback
      )
      .subscribe();
  },
};
