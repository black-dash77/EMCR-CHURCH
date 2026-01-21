import type { Sermon, SermonFilters, SermonSortOptions } from '@/types';

import { supabase } from '../supabase';

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

  // ==========================================
  // ADVANCED FILTERING & SORTING
  // ==========================================

  async getFiltered(
    filters: SermonFilters = {},
    sort: SermonSortOptions = { field: 'date', direction: 'desc' },
    limit?: number
  ): Promise<Sermon[]> {
    let query = supabase
      .from('sermons')
      .select('*, speaker_profile:speakers(*), seminar:seminars(*)');

    // Apply filters
    if (filters.speakerId) {
      query = query.eq('speaker_id', filters.speakerId);
    }
    if (filters.speakerName) {
      query = query.ilike('speaker', `%${filters.speakerName}%`);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    if (filters.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('date', filters.dateTo);
    }
    if (filters.seminarId) {
      query = query.eq('seminar_id', filters.seminarId);
    }
    if (filters.searchQuery) {
      const searchTerm = filters.searchQuery.toLowerCase();
      query = query.or(
        `title.ilike.%${searchTerm}%,speaker.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getBySpeaker(speakerId: string): Promise<Sermon[]> {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('speaker_id', speakerId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getBySeminar(seminarId: string): Promise<Sermon[]> {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('seminar_id', seminarId)
      .order('date', { ascending: true }); // Chronological within seminar

    if (error) throw error;
    return data || [];
  },

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('sermons')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;
    const categories = data?.map(d => d.category).filter(Boolean) as string[];
    return [...new Set(categories)];
  },

  async getSpeakerNames(): Promise<string[]> {
    const { data, error } = await supabase
      .from('sermons')
      .select('speaker')
      .not('speaker', 'is', null);

    if (error) throw error;
    const speakers = data?.map(d => d.speaker).filter(Boolean) as string[];
    return [...new Set(speakers)].sort();
  },

  async getAllTags(): Promise<string[]> {
    const { data, error } = await supabase
      .from('sermons')
      .select('tags')
      .not('tags', 'is', null);

    if (error) throw error;
    const allTags = data?.flatMap(d => d.tags || []) || [];
    return [...new Set(allTags)].sort();
  },

  async getWithSpeakerProfile(id: string): Promise<Sermon | null> {
    const { data, error } = await supabase
      .from('sermons')
      .select('*, speaker_profile:speakers(*), seminar:seminars(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
};
