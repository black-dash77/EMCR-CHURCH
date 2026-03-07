import type { Announcement, Member, Photo, Ministry, ContactMessage, ChurchSettings, ChurchInfo } from '@/types';

import { supabase } from '../supabase';

export { sermonsApi } from './sermons';
export { eventsApi } from './events';
export { speakersApi } from './speakers';
export { seminarsApi } from './seminars';

export const announcementsApi = {
  async getAll(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('date', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  async getLatest(limit: number = 1): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Announcement | null> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getUrgent(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('urgent', true)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('announcements-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        callback
      )
      .subscribe();
  },
};

export const membersApi = {
  async getAll(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByCategory(category: string): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('members-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        callback
      )
      .subscribe();
  },
};

export const photosApi = {
  async getAll(): Promise<Photo[]> {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getImages(): Promise<Photo[]> {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('type', 'image')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getVideos(): Promise<Photo[]> {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('type', 'video')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

export const ministriesApi = {
  async getAll(): Promise<Ministry[]> {
    const { data, error } = await supabase
      .from('ministries')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};

export const contactApi = {
  async sendMessage(message: Omit<ContactMessage, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase.from('contact_messages').insert([
      {
        ...message,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;
  },
};

export const settingsApi = {
  async get(): Promise<ChurchSettings | null> {
    const { data, error } = await supabase
      .from('church_settings')
      .select('*')
      .single();

    if (error) {
      // Si la table n'existe pas ou aucun enregistrement, retourner les valeurs par défaut
      console.warn('Settings not found, using defaults');
      return null;
    }
    return data;
  },

  getDefaults(): ChurchSettings {
    return {
      id: 'default',
      sunday_service_title: 'Culte de Louange et d\'Adoration',
      sunday_service_time: 'Dimanche à 10h00',
      sunday_service_label: 'Ce Dimanche',
      sunday_service_badge: 'Bientôt',
      hero_title_line1: 'Église Missionnaire',
      hero_title_line2: 'Christ est Roi',
      hero_verse: '"Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d\'eux."',
      hero_verse_reference: 'Matthieu 18:20',
      updated_at: new Date().toISOString(),
    };
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('church-settings-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'church_settings' },
        callback
      )
      .subscribe();
  },
};

export const churchInfoApi = {
  async get(): Promise<ChurchInfo | null> {
    const { data, error } = await supabase
      .from('church_info')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('church-info-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'church_info' },
        callback
      )
      .subscribe();
  },
};
