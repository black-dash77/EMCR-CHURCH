export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  description: string | null;
  audio_url: string;
  cover_image: string | null;
  date: string;
  duration_seconds: number | null;
  tags: string[] | null;
  category: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  time: string | null;
  location: string | null;
  image: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  urgent: boolean;
  date: string;
  created_at: string;
}

export interface Member {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  bio: string | null;
  photo_url: string | null;
  category: 'leadership' | 'diacres' | 'ministeres' | string;
  created_at: string;
}

export interface Photo {
  id: string;
  title: string | null;
  url: string;
  type: 'image' | 'video';
  date: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  newsletter: boolean;
  created_at: string;
}

export interface Ministry {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  color: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  sermonIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  sermonId: string;
  playedAt: string;
  completedAt?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type PlaybackRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;
