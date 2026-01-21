import type { Event } from '@/types';

import { supabase } from '../supabase';

export const eventsApi = {
  async getAll(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getUpcoming(limit: number = 5): Promise<Event[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getByType(type: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('type', type)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByMonth(year: number, month: number): Promise<Event[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('events-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        callback
      )
      .subscribe();
  },
};
