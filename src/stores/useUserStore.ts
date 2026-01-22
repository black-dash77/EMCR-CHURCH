import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { Playlist, HistoryEntry, Sermon } from '@/types';

interface UserState {
  // User Profile
  firstName: string;
  lastName: string;
  hasCompletedOnboarding: boolean;

  // Favorites
  favorites: string[];

  // Playlists
  playlists: Playlist[];

  // History
  history: HistoryEntry[];

  // Preferences
  darkMode: 'system' | 'light' | 'dark';
  notificationsEnabled: boolean;
  notifyNewSermons: boolean;
  notifyNewEvents: boolean;
  notifyNewAnnouncements: boolean;
  autoPlayNext: boolean;
  defaultPlaybackSpeed: number;

  // Actions
  toggleFavorite: (sermonId: string) => void;
  isFavorite: (sermonId: string) => boolean;
  getFavoriteSermons: (sermons: Sermon[]) => Sermon[];

  // Playlist actions
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  renamePlaylist: (playlistId: string, name: string) => void;
  addToPlaylist: (playlistId: string, sermonId: string) => void;
  removeFromPlaylist: (playlistId: string, sermonId: string) => void;
  getPlaylist: (playlistId: string) => Playlist | undefined;

  // History actions
  addToHistory: (sermonId: string) => void;
  clearHistory: () => void;
  getHistorySermons: (sermons: Sermon[]) => Sermon[];

  // Preference actions
  setDarkMode: (mode: 'system' | 'light' | 'dark') => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotifyNewSermons: (enabled: boolean) => void;
  setNotifyNewEvents: (enabled: boolean) => void;
  setNotifyNewAnnouncements: (enabled: boolean) => void;
  setAutoPlayNext: (enabled: boolean) => void;
  setDefaultPlaybackSpeed: (speed: number) => void;

  // Additional actions
  addFavorite: (sermonId: string) => void;
  removeFavorite: (sermonId: string) => void;
  reorderPlaylist: (playlistId: string, sermonIds: string[]) => void;

  // Onboarding actions
  completeOnboarding: (firstName: string, lastName: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      firstName: '',
      lastName: '',
      hasCompletedOnboarding: false,
      favorites: [],
      playlists: [],
      history: [],
      darkMode: 'system',
      notificationsEnabled: true,
      notifyNewSermons: true,
      notifyNewEvents: true,
      notifyNewAnnouncements: true,
      autoPlayNext: true,
      defaultPlaybackSpeed: 1,

      // Favorite actions
      toggleFavorite: (sermonId) => {
        set((state) => {
          const isFav = state.favorites.includes(sermonId);
          return {
            favorites: isFav
              ? state.favorites.filter((id) => id !== sermonId)
              : [...state.favorites, sermonId],
          };
        });
      },

      isFavorite: (sermonId) => {
        return get().favorites.includes(sermonId);
      },

      getFavoriteSermons: (sermons) => {
        const { favorites } = get();
        return sermons.filter((s) => favorites.includes(s.id));
      },

      // Playlist actions
      createPlaylist: (name) => {
        const newPlaylist: Playlist = {
          id: generateId(),
          name,
          sermonIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          playlists: [...state.playlists, newPlaylist],
        }));

        return newPlaylist;
      },

      deletePlaylist: (playlistId) => {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== playlistId),
        }));
      },

      renamePlaylist: (playlistId, name) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, name, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      addToPlaylist: (playlistId, sermonId) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId && !p.sermonIds.includes(sermonId)
              ? {
                  ...p,
                  sermonIds: [...p.sermonIds, sermonId],
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      removeFromPlaylist: (playlistId, sermonId) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  sermonIds: p.sermonIds.filter((id) => id !== sermonId),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      getPlaylist: (playlistId) => {
        return get().playlists.find((p) => p.id === playlistId);
      },

      // History actions
      addToHistory: (sermonId) => {
        set((state) => {
          // Remove existing entry for this sermon
          const filteredHistory = state.history.filter(
            (h) => h.sermonId !== sermonId
          );

          // Add new entry at the beginning
          return {
            history: [
              {
                sermonId,
                playedAt: new Date().toISOString(),
              },
              ...filteredHistory,
            ].slice(0, 100), // Keep only last 100 entries
          };
        });
      },

      clearHistory: () => {
        set({ history: [] });
      },

      getHistorySermons: (sermons) => {
        const { history } = get();
        return history
          .map((h) => sermons.find((s) => s.id === h.sermonId))
          .filter((s): s is Sermon => s !== undefined);
      },

      // Preference actions
      setDarkMode: (mode) => {
        set({ darkMode: mode });
      },

      setNotificationsEnabled: (enabled) => {
        set({ notificationsEnabled: enabled });
      },

      setNotifyNewSermons: (enabled) => {
        set({ notifyNewSermons: enabled });
      },

      setNotifyNewEvents: (enabled) => {
        set({ notifyNewEvents: enabled });
      },

      setNotifyNewAnnouncements: (enabled) => {
        set({ notifyNewAnnouncements: enabled });
      },

      setAutoPlayNext: (enabled) => {
        set({ autoPlayNext: enabled });
      },

      setDefaultPlaybackSpeed: (speed) => {
        set({ defaultPlaybackSpeed: speed });
      },

      // Additional actions
      addFavorite: (sermonId) => {
        set((state) => {
          if (state.favorites.includes(sermonId)) return state;
          return { favorites: [...state.favorites, sermonId] };
        });
      },

      removeFavorite: (sermonId) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== sermonId),
        }));
      },

      reorderPlaylist: (playlistId, sermonIds) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, sermonIds, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      // Onboarding
      completeOnboarding: (firstName, lastName) => {
        set({
          firstName,
          lastName,
          hasCompletedOnboarding: true,
        });
      },
    }),
    {
      name: 'emcr-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useUserStore;
