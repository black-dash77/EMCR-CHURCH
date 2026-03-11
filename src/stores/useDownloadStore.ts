import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { Sermon } from '@/types';

export interface DownloadedSermon {
  sermon: Sermon;
  localUri: string;
  downloadedAt: string;
  fileSize: number;
}

export interface DownloadProgress {
  sermonId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error';
}

interface DownloadState {
  // Downloaded files
  downloads: Record<string, DownloadedSermon>;

  // Active downloads progress
  activeDownloads: Record<string, DownloadProgress>;

  // Actions
  addDownload: (sermon: Sermon, localUri: string, fileSize: number) => void;
  removeDownload: (sermonId: string) => Promise<void>;
  isDownloaded: (sermonId: string) => boolean;
  getDownloadedSermon: (sermonId: string) => DownloadedSermon | null;
  getLocalUri: (sermonId: string) => string | null;
  getAllDownloads: () => DownloadedSermon[];
  getTotalSize: () => number;
  clearAllDownloads: () => Promise<void>;

  // Download progress tracking
  setDownloadProgress: (sermonId: string, progress: number, status: DownloadProgress['status']) => void;
  clearDownloadProgress: (sermonId: string) => void;

  // Verification
  verifyDownloads: () => Promise<void>;
}

const DOWNLOAD_DIRECTORY = `${FileSystem.documentDirectory}downloads/`;

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      downloads: {},
      activeDownloads: {},

      addDownload: (sermon, localUri, fileSize) => {
        set((state) => ({
          downloads: {
            ...state.downloads,
            [sermon.id]: {
              sermon,
              localUri,
              downloadedAt: new Date().toISOString(),
              fileSize,
            },
          },
        }));
      },

      removeDownload: async (sermonId) => {
        const download = get().downloads[sermonId];
        if (download) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(download.localUri);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(download.localUri);
            }
          } catch (error) {
          }
        }

        set((state) => {
          const newDownloads = { ...state.downloads };
          delete newDownloads[sermonId];
          return { downloads: newDownloads };
        });
      },

      isDownloaded: (sermonId) => {
        return !!get().downloads[sermonId];
      },

      getDownloadedSermon: (sermonId) => {
        return get().downloads[sermonId] || null;
      },

      getLocalUri: (sermonId) => {
        const download = get().downloads[sermonId];
        return download?.localUri || null;
      },

      // Verify and clean orphaned downloads on startup
      verifyDownloads: async () => {
        const downloads = get().downloads;
        const invalidIds: string[] = [];

        for (const [id, download] of Object.entries(downloads)) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(download.localUri);
            if (!fileInfo.exists) {
              invalidIds.push(id);
            }
          } catch {
            invalidIds.push(id);
          }
        }

        if (invalidIds.length > 0) {
          set((state) => {
            const newDownloads = { ...state.downloads };
            for (const id of invalidIds) {
              delete newDownloads[id];
            }
            return { downloads: newDownloads };
          });
        }
      },

      getAllDownloads: () => {
        return Object.values(get().downloads).sort(
          (a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()
        );
      },

      getTotalSize: () => {
        return Object.values(get().downloads).reduce((total, d) => total + d.fileSize, 0);
      },

      clearAllDownloads: async () => {
        const downloads = get().downloads;

        for (const download of Object.values(downloads)) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(download.localUri);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(download.localUri);
            }
          } catch (error) {
          }
        }

        set({ downloads: {} });
      },

      setDownloadProgress: (sermonId, progress, status) => {
        set((state) => ({
          activeDownloads: {
            ...state.activeDownloads,
            [sermonId]: { sermonId, progress, status },
          },
        }));
      },

      clearDownloadProgress: (sermonId) => {
        set((state) => {
          const newActiveDownloads = { ...state.activeDownloads };
          delete newActiveDownloads[sermonId];
          return { activeDownloads: newActiveDownloads };
        });
      },
    }),
    {
      name: 'emcr-downloads-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        downloads: state.downloads,
      }),
    }
  )
);

export { DOWNLOAD_DIRECTORY };
export default useDownloadStore;
