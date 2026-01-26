import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

import { useDownloadStore, DOWNLOAD_DIRECTORY } from '@/stores/useDownloadStore';
import type { Sermon } from '@/types';

export type DownloadDestination = 'app' | 'device' | 'both';

interface DownloadOptions {
  destination: DownloadDestination;
  onProgress?: (progress: number) => void;
}

interface DownloadResult {
  success: boolean;
  localUri?: string;
  error?: string;
  savedToDevice?: boolean;
}

class DownloadService {
  private async ensureDownloadDirectory(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DOWNLOAD_DIRECTORY, { intermediates: true });
    }
  }

  private generateFilename(sermon: Sermon): string {
    const cleanTitle = sermon.title
      .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    const cleanSpeaker = sermon.speaker.replace(/\s+/g, '_');
    return `${cleanTitle}_${cleanSpeaker}_${sermon.id.substring(0, 8)}.mp3`;
  }

  async downloadForApp(
    sermon: Sermon,
    onProgress?: (progress: number) => void
  ): Promise<DownloadResult> {
    const store = useDownloadStore.getState();

    // Check if audio URL exists
    if (!sermon.audio_url) {
      console.error('Download failed: No audio URL for sermon', sermon.id);
      return {
        success: false,
        error: 'Cette prédication n\'a pas de fichier audio disponible.',
      };
    }

    // Check if already downloaded
    if (store.isDownloaded(sermon.id)) {
      const localUri = store.getLocalUri(sermon.id);
      // Verify file still exists
      if (localUri) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(localUri);
          if (fileInfo.exists) {
            return { success: true, localUri };
          }
          // File doesn't exist, remove from store and re-download
          await store.removeDownload(sermon.id);
        } catch {
          await store.removeDownload(sermon.id);
        }
      }
    }

    try {
      await this.ensureDownloadDirectory();

      const filename = this.generateFilename(sermon);
      const localUri = `${DOWNLOAD_DIRECTORY}${filename}`;

      store.setDownloadProgress(sermon.id, 0, 'downloading');

      console.log('Starting download from:', sermon.audio_url);
      console.log('Saving to:', localUri);

      const downloadResumable = FileSystem.createDownloadResumable(
        sermon.audio_url,
        localUri,
        {},
        (downloadProgress) => {
          const progress =
            downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          store.setDownloadProgress(sermon.id, progress, 'downloading');
          onProgress?.(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (result?.uri) {
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        const fileSize = (fileInfo as { exists: boolean; size?: number }).size || 0;

        console.log('Download completed:', result.uri, 'Size:', fileSize);

        store.addDownload(sermon, result.uri, fileSize);
        store.setDownloadProgress(sermon.id, 1, 'completed');

        // Clear progress after a short delay
        setTimeout(() => store.clearDownloadProgress(sermon.id), 1000);

        return { success: true, localUri: result.uri };
      }

      throw new Error('Download failed - no result URI');
    } catch (error) {
      store.setDownloadProgress(sermon.id, 0, 'error');
      console.error('Download error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de téléchargement',
      };
    }
  }

  async downloadToDevice(
    sermon: Sermon,
    onProgress?: (progress: number) => void
  ): Promise<DownloadResult> {
    // Check if audio URL exists
    if (!sermon.audio_url) {
      return {
        success: false,
        error: 'Cette prédication n\'a pas de fichier audio disponible.',
      };
    }

    try {
      // Request permission for media library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          error: "L'accès à la bibliothèque multimédia est nécessaire.",
        };
      }

      const filename = this.generateFilename(sermon);
      const tempUri = `${FileSystem.documentDirectory}${filename}`;

      console.log('Downloading to device from:', sermon.audio_url);

      const downloadResumable = FileSystem.createDownloadResumable(
        sermon.audio_url,
        tempUri,
        {},
        (downloadProgress) => {
          const progress =
            downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress?.(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result?.uri) {
        throw new Error('Download failed - no result URI');
      }

      console.log('Downloaded to temp:', result.uri);

      // Save to media library (Android only for audio)
      if (Platform.OS === 'android') {
        try {
          const asset = await MediaLibrary.createAssetAsync(result.uri);
          await MediaLibrary.createAlbumAsync('EMCR Church', asset, false);
          console.log('Saved to media library');

          // Clean up temp file
          await FileSystem.deleteAsync(result.uri, { idempotent: true });

          return { success: true, savedToDevice: true };
        } catch (mediaError) {
          console.error('MediaLibrary error:', mediaError);
          // Keep file in temp location on error
          return {
            success: true,
            localUri: result.uri,
            savedToDevice: false,
            error: 'Fichier téléchargé mais non ajouté à la bibliothèque',
          };
        }
      } else {
        // iOS: Keep file in documents directory (iOS doesn't allow saving audio to media library)
        // But we can use Sharing to let user save it
        console.log('iOS: File saved to documents directory');
        return {
          success: true,
          localUri: result.uri,
          savedToDevice: true,
        };
      }
    } catch (error) {
      console.error('Download to device error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de téléchargement',
      };
    }
  }

  async download(sermon: Sermon, options: DownloadOptions): Promise<DownloadResult> {
    const { destination, onProgress } = options;

    if (destination === 'app') {
      return this.downloadForApp(sermon, onProgress);
    }

    if (destination === 'device') {
      return this.downloadToDevice(sermon, onProgress);
    }

    // Both: download to app first, then to device
    const appResult = await this.downloadForApp(sermon, (p) => onProgress?.(p * 0.5));

    if (!appResult.success) {
      return appResult;
    }

    const deviceResult = await this.downloadToDevice(sermon, (p) => onProgress?.(0.5 + p * 0.5));

    return {
      success: appResult.success,
      localUri: appResult.localUri,
      savedToDevice: deviceResult.success,
      error: deviceResult.error,
    };
  }

  async verifyDownload(sermonId: string): Promise<boolean> {
    const store = useDownloadStore.getState();
    const download = store.getDownloadedSermon(sermonId);

    if (!download) return false;

    try {
      const fileInfo = await FileSystem.getInfoAsync(download.localUri);
      if (!fileInfo.exists) {
        // File was deleted externally, clean up the store
        await store.removeDownload(sermonId);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  async cleanupOrphanedDownloads(): Promise<void> {
    const store = useDownloadStore.getState();
    const downloads = store.getAllDownloads();

    for (const download of downloads) {
      const exists = await this.verifyDownload(download.sermon.id);
      if (!exists) {
        await store.removeDownload(download.sermon.id);
      }
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}

export const downloadService = new DownloadService();
