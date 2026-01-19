export { sermonsApi } from './sermons';
export { eventsApi } from './events';

import { supabase } from '../supabase';
import type { Announcement, Member, Photo, Ministry, ContactMessage } from '@/types';

export const announcementsApi = {
  async getAll(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
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
