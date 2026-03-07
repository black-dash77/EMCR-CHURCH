import type { Speaker, Sermon } from '@/types';

import { supabase } from '../supabase';

export const speakersApi = {
  async getAll(): Promise<Speaker[]> {
    const { data, error } = await supabase
      .from('speakers')
      .select('*')
      .order('name', { ascending: true })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Speaker | null> {
    const { data, error } = await supabase
      .from('speakers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getWithSermons(id: string): Promise<{ speaker: Speaker; sermons: Sermon[] } | null> {
    const { data: speaker, error: speakerError } = await supabase
      .from('speakers')
      .select('*')
      .eq('id', id)
      .single();

    if (speakerError) throw speakerError;
    if (!speaker) return null;

    const { data: sermons, error: sermonsError } = await supabase
      .from('sermons')
      .select('*')
      .eq('speaker_id', id)
      .order('date', { ascending: false });

    if (sermonsError) throw sermonsError;

    return { speaker, sermons: sermons || [] };
  },

  async getWithSermonCount(): Promise<(Speaker & { sermon_count: number })[]> {
    const { data, error } = await supabase
      .from('speakers')
      .select('*, sermons(count)')
      .order('name', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map((speaker) => ({
      ...speaker,
      sermon_count: (speaker as any).sermons?.[0]?.count ?? 0,
    }));
  },

  async search(query: string): Promise<Speaker[]> {
    const { data, error } = await supabase
      .from('speakers')
      .select('*')
      .or(`name.ilike.%${query}%,ministry.ilike.%${query}%,bio.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(speaker: Omit<Speaker, 'id' | 'created_at' | 'updated_at'>): Promise<Speaker> {
    const { data, error } = await supabase
      .from('speakers')
      .insert(speaker)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Speaker>): Promise<Speaker> {
    const { data, error } = await supabase
      .from('speakers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('speakers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('speakers-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'speakers' },
        callback
      )
      .subscribe();
  },
};
