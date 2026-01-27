// ==========================================
// SPEAKER (Orateur)
// ==========================================
export interface Speaker {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  ministry: string | null;
  social_links: SpeakerSocialLinks | null;
  created_at: string;
  updated_at: string;
}

export interface SpeakerSocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
}

// ==========================================
// SEMINAR (Séminaire/Dossier)
// ==========================================
export interface Seminar {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  start_date: string | null;
  end_date: string | null;
  speaker_id: string | null;
  speaker?: Speaker;
  sermons?: Sermon[];
  sermon_count?: number;
  created_at: string;
  updated_at: string;
}

// ==========================================
// SERMON (Prédication)
// ==========================================
export type SermonContentType = 'sermon' | 'adoration' | 'louange';

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  speaker_id: string | null;
  speaker_profile?: Speaker;
  description: string | null;
  audio_url: string | null;
  video_url: string | null;
  youtube_url: string | null;
  cover_image: string | null;
  date: string;
  duration_seconds: number | null;
  tags: string[] | null;
  category: string | null;
  content_type: SermonContentType;
  seminar_id: string | null;
  seminar?: Seminar;
  created_at: string;
}

// ==========================================
// SORTING & FILTERING
// ==========================================
export type SermonSortField = 'date' | 'speaker' | 'category' | 'title' | 'duration_seconds';
export type SortDirection = 'asc' | 'desc';

export interface SermonSortOptions {
  field: SermonSortField;
  direction: SortDirection;
}

export type DurationFilter = 'short' | 'medium' | 'long'; // < 30min, 30-60min, > 60min

export interface SermonFilters {
  speakerId?: string;
  speakerName?: string;
  category?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  seminarId?: string;
  searchQuery?: string;
  durationFilter?: DurationFilter;
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
  content: string | null;
  type: string | null;
  urgent: boolean;
  date: string;
  image: string | null;
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

// ==========================================
// CHURCH INFO (Notre Église)
// ==========================================
export interface ChurchInfo {
  id: string;
  name: string;
  slogan: string | null;
  description: string | null;
  mission: string | null;
  vision: string | null;
  values: string[] | null;
  history: string | null;
  pastor_name: string | null;
  pastor_photo: string | null;
  pastor_message: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  service_times: string | null;
  logo_url: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChurchSettings {
  id: string;
  sunday_service_title: string;
  sunday_service_time: string;
  sunday_service_label: string;
  sunday_service_badge: string;
  hero_title_line1: string;
  hero_title_line2: string;
  hero_verse: string;
  hero_verse_reference: string;
  updated_at: string;
}

// ==========================================
// NOTIFICATIONS
// ==========================================
export interface DeviceToken {
  id: string;
  device_token: string;
  platform: 'ios' | 'android';
  created_at: string;
  updated_at: string;
}

// Stored format (snake_case) - for DB
export interface NotificationPreferencesDB {
  id?: string;
  device_token_id?: string;
  new_sermons: boolean;
  new_events: boolean;
  new_announcements: boolean;
}

// App format (camelCase) - for frontend
export interface NotificationPreferences {
  newSermons: boolean;
  newEvents: boolean;
  newAnnouncements: boolean;
}

export type NotificationType = 'sermon' | 'event' | 'announcement';

export interface PushNotificationData {
  type: NotificationType;
  id: string;
  title: string;
  body: string;
}

// ==========================================
// EXTERNAL SERVICES (Spotify, YouTube, etc.)
// ==========================================
export type ExternalService = 'spotify' | 'youtube_music' | 'apple_music';

export interface ExternalServiceAuth {
  service: ExternalService;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  userId?: string;
}

export interface ExternalPlaylist {
  id: string;
  name: string;
  service: ExternalService;
  externalUrl: string;
  createdAt: string;
}
