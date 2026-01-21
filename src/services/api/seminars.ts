import type { Seminar, Sermon } from '@/types';

import { supabase } from '../supabase';

export const seminarsApi = {
  async getAll(): Promise<Seminar[]> {
    const { data, error } = await supabase
      .from('seminars')
      .select('*, speaker:speakers(*)')
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Seminar | null> {
    const { data, error } = await supabase
      .from('seminars')
      .select('*, speaker:speakers(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getWithSermons(id: string): Promise<{ seminar: Seminar; sermons: Sermon[] } | null> {
    const { data: seminar, error: seminarError } = await supabase
      .from('seminars')
      .select('*, speaker:speakers(*)')
      .eq('id', id)
      .single();

    if (seminarError) throw seminarError;
    if (!seminar) return null;

    const { data: sermons, error: sermonsError } = await supabase
      .from('sermons')
      .select('*')
      .eq('seminar_id', id)
      .order('date', { ascending: true }); // Chronological within seminar

    if (sermonsError) throw sermonsError;

    return { seminar, sermons: sermons || [] };
  },

  async getWithSermonCount(): Promise<(Seminar & { sermon_count: number })[]> {
    const { data: seminars, error: seminarsError } = await supabase
      .from('seminars')
      .select('*, speaker:speakers(*)')
      .order('start_date', { ascending: false });

    if (seminarsError) throw seminarsError;
    if (!seminars) return [];

    const seminarsWithCount = await Promise.all(
      seminars.map(async (seminar) => {
        const { count } = await supabase
          .from('sermons')
          .select('*', { count: 'exact', head: true })
          .eq('seminar_id', seminar.id);

        return { ...seminar, sermon_count: count || 0 };
      })
    );

    return seminarsWithCount;
  },

  async getBySpeaker(speakerId: string): Promise<Seminar[]> {
    const { data, error } = await supabase
      .from('seminars')
      .select('*, speaker:speakers(*)')
      .eq('speaker_id', speakerId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async search(query: string): Promise<Seminar[]> {
    const { data, error } = await supabase
      .from('seminars')
      .select('*, speaker:speakers(*)')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(seminar: Omit<Seminar, 'id' | 'created_at' | 'updated_at' | 'speaker' | 'sermons' | 'sermon_count'>): Promise<Seminar> {
    const { data, error } = await supabase
      .from('seminars')
      .insert(seminar)
      .select('*, speaker:speakers(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Seminar>): Promise<Seminar> {
    const { speaker, sermons, sermon_count, ...updateData } = updates;

    const { data, error } = await supabase
      .from('seminars')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, speaker:speakers(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    // First, remove seminar_id from all associated sermons
    await supabase
      .from('sermons')
      .update({ seminar_id: null })
      .eq('seminar_id', id);

    const { error } = await supabase
      .from('seminars')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async addSermonToSeminar(seminarId: string, sermonId: string): Promise<void> {
    const { error } = await supabase
      .from('sermons')
      .update({ seminar_id: seminarId })
      .eq('id', sermonId);

    if (error) throw error;
  },

  async removeSermonFromSeminar(sermonId: string): Promise<void> {
    const { error } = await supabase
      .from('sermons')
      .update({ seminar_id: null })
      .eq('id', sermonId);

    if (error) throw error;
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('seminars-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seminars' },
        callback
      )
      .subscribe();
  },
};
