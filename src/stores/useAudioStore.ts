import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { audioService } from '@/services/audioService';
import { useDownloadStore } from '@/stores/useDownloadStore';
import type { Sermon, RepeatMode, PlaybackRate } from '@/types';

interface AudioState {
  // Current playback
  currentSermon: Sermon | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds

  // Player visibility (can be hidden while audio plays)
  isPlayerHidden: boolean;
  isPlayerCompletelyHidden: boolean; // Hides both mini player AND floating button

  // Settings
  playbackRate: PlaybackRate;
  volume: number;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;

  // Queue
  queue: Sermon[];
  originalQueue: Sermon[];
  currentIndex: number;

  // Sleep timer
  sleepTimerEndTime: number | null;
  sleepTimerRemaining: number | null;

  // Saved positions for resume
  playbackPositions: Record<string, number>;

  // Actions
  playSermon: (sermon: Sermon, addToQueue?: boolean) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  pause: () => Promise<void>;
  play: () => Promise<void>;
  seek: (seconds: number) => Promise<void>;
  skipForward: (seconds?: number) => Promise<void>;
  skipBackward: (seconds?: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  setPlaybackRate: (rate: PlaybackRate) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  addToQueue: (sermon: Sermon) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setQueue: (sermons: Sermon[], startIndex?: number) => Promise<void>;
  setSleepTimer: (minutes: number | null) => void;
  updateSleepTimerRemaining: () => void;
  savePlaybackPosition: () => void;
  handlePlaybackStatusUpdate: (status: AVPlaybackStatus) => void;
  hidePlayer: () => void;
  showPlayer: () => void;
  hidePlayerCompletely: () => void;
}

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSermon: null,
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      duration: 0,
      isPlayerHidden: false,
      isPlayerCompletelyHidden: false,
      playbackRate: 1,
      volume: 1,
      repeatMode: 'off',
      shuffleEnabled: false,
      queue: [],
      originalQueue: [],
      currentIndex: -1,
      sleepTimerEndTime: null,
      sleepTimerRemaining: null,
      playbackPositions: {},

      playSermon: async (sermon, addToQueue = true) => {
        const { playbackPositions, playbackRate, volume, queue } = get();

        set({ isLoading: true, currentSermon: sermon, isPlayerHidden: false, isPlayerCompletelyHidden: false });

        // Setup status callback
        audioService.setStatusCallback(get().handlePlaybackStatusUpdate);

        // Get saved position for resume
        const savedPosition = playbackPositions[sermon.id] || 0;
        const startPositionMs = savedPosition * 1000;

        // Check if sermon has a valid audio URL
        if (!sermon.audio_url) {
          console.error('Sermon has no audio URL:', sermon.id, sermon.title);
          set({ isLoading: false, isPlaying: false });
          return;
        }

        // Check if sermon is downloaded locally for offline playback
        const downloadStore = useDownloadStore.getState();
        const localUri = downloadStore.getLocalUri(sermon.id);

        // Verify local file exists and has valid size before using it
        let audioUrl = sermon.audio_url;
        let useLocalFile = false;
        if (localUri) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(localUri, { size: true });
            // Check if file exists and has a reasonable size (at least 10KB)
            if (fileInfo.exists && fileInfo.size && fileInfo.size > 10000) {
              audioUrl = localUri;
              useLocalFile = true;
              console.log('Using local file:', localUri, 'Size:', fileInfo.size);
            } else {
              // File doesn't exist or is too small (corrupted), clean up
              console.warn('Local file invalid or too small, removing download record');
              await downloadStore.removeDownload(sermon.id);
            }
          } catch (e) {
            // If we can't check, use the remote URL
            console.warn('Could not verify local file, using remote URL:', e);
          }
        }

        try {
          await audioService.loadAudio(audioUrl, startPositionMs);
          await audioService.setPlaybackRate(playbackRate);
          await audioService.setVolume(volume);

          // Update queue if needed
          if (addToQueue && !queue.find((s) => s.id === sermon.id)) {
            set((state) => ({
              queue: [...state.queue, sermon],
              originalQueue: [...state.originalQueue, sermon],
              currentIndex: state.queue.length,
            }));
          } else {
            const index = queue.findIndex((s) => s.id === sermon.id);
            if (index !== -1) {
              set({ currentIndex: index });
            }
          }

          set({ isLoading: false, isPlaying: true });
        } catch (error) {
          console.error('Failed to play sermon:', error);
          console.error('Audio URL attempted:', audioUrl);

          // If local file failed, try remote URL as fallback
          if (useLocalFile && sermon.audio_url) {
            console.log('Local file failed, cleaning up and retrying with remote URL...');
            // Clean up the corrupted download
            try {
              await downloadStore.removeDownload(sermon.id);
            } catch (e) {
              console.warn('Failed to remove download record:', e);
            }

            try {
              console.log('Retrying with remote URL:', sermon.audio_url);
              await audioService.loadAudio(sermon.audio_url, startPositionMs);
              await audioService.setPlaybackRate(playbackRate);
              await audioService.setVolume(volume);
              set({ isLoading: false, isPlaying: true });
              return;
            } catch (fallbackError) {
              console.error('Remote URL also failed:', fallbackError);
            }
          }

          set({ isLoading: false, isPlaying: false });
        }
      },

      togglePlayPause: async () => {
        const { isPlaying } = get();
        if (isPlaying) {
          await audioService.pause();
        } else {
          await audioService.play();
        }
      },

      pause: async () => {
        await audioService.pause();
        get().savePlaybackPosition();
      },

      play: async () => {
        await audioService.play();
      },

      seek: async (seconds) => {
        await audioService.seekTo(seconds * 1000);
        set({ currentTime: seconds });
      },

      skipForward: async (seconds = 15) => {
        await audioService.skipForward(seconds);
      },

      skipBackward: async (seconds = 15) => {
        await audioService.skipBackward(seconds);
      },

      playNext: async () => {
        const { queue, currentIndex, repeatMode, shuffleEnabled } = get();

        if (queue.length === 0) return;

        let nextIndex = currentIndex + 1;

        if (nextIndex >= queue.length) {
          if (repeatMode === 'all') {
            nextIndex = 0;
          } else {
            // End of queue
            await audioService.pause();
            set({ isPlaying: false });
            return;
          }
        }

        const nextSermon = queue[nextIndex];
        if (nextSermon) {
          set({ currentIndex: nextIndex });
          await get().playSermon(nextSermon, false);
        }
      },

      playPrevious: async () => {
        const { queue, currentIndex, currentTime } = get();

        // If more than 3 seconds into the track, restart it
        if (currentTime > 3) {
          await audioService.seekTo(0);
          return;
        }

        if (queue.length === 0) return;

        let prevIndex = currentIndex - 1;

        if (prevIndex < 0) {
          prevIndex = queue.length - 1;
        }

        const prevSermon = queue[prevIndex];
        if (prevSermon) {
          set({ currentIndex: prevIndex });
          await get().playSermon(prevSermon, false);
        }
      },

      setPlaybackRate: async (rate) => {
        await audioService.setPlaybackRate(rate);
        set({ playbackRate: rate });
      },

      setVolume: async (volume) => {
        await audioService.setVolume(volume);
        set({ volume });
      },

      toggleRepeat: () => {
        const { repeatMode } = get();
        const modes: RepeatMode[] = ['off', 'all', 'one'];
        const currentIdx = modes.indexOf(repeatMode);
        const nextMode = modes[(currentIdx + 1) % modes.length];
        set({ repeatMode: nextMode });
      },

      toggleShuffle: () => {
        const { shuffleEnabled, queue, originalQueue, currentSermon } = get();

        if (!shuffleEnabled) {
          // Enable shuffle
          const shuffled = shuffleArray(queue);
          // Move current sermon to front
          if (currentSermon) {
            const idx = shuffled.findIndex((s) => s.id === currentSermon.id);
            if (idx > 0) {
              [shuffled[0], shuffled[idx]] = [shuffled[idx], shuffled[0]];
            }
          }
          set({
            shuffleEnabled: true,
            queue: shuffled,
            currentIndex: 0,
          });
        } else {
          // Disable shuffle - restore original order
          const currentSermonId = currentSermon?.id;
          const newIndex = originalQueue.findIndex((s) => s.id === currentSermonId);
          set({
            shuffleEnabled: false,
            queue: [...originalQueue],
            currentIndex: newIndex !== -1 ? newIndex : 0,
          });
        }
      },

      addToQueue: (sermon) => {
        set((state) => ({
          queue: [...state.queue, sermon],
          originalQueue: [...state.originalQueue, sermon],
        }));
      },

      removeFromQueue: (index) => {
        set((state) => {
          const newQueue = [...state.queue];
          newQueue.splice(index, 1);
          const newOriginalQueue = [...state.originalQueue];
          const originalIdx = newOriginalQueue.findIndex(
            (s) => s.id === state.queue[index]?.id
          );
          if (originalIdx !== -1) {
            newOriginalQueue.splice(originalIdx, 1);
          }

          let newCurrentIndex = state.currentIndex;
          if (index < state.currentIndex) {
            newCurrentIndex--;
          } else if (index === state.currentIndex) {
            newCurrentIndex = Math.min(newCurrentIndex, newQueue.length - 1);
          }

          return {
            queue: newQueue,
            originalQueue: newOriginalQueue,
            currentIndex: newCurrentIndex,
          };
        });
      },

      clearQueue: () => {
        set({
          queue: [],
          originalQueue: [],
          currentIndex: -1,
        });
      },

      setQueue: async (sermons, startIndex = 0) => {
        set({
          queue: sermons,
          originalQueue: sermons,
          currentIndex: startIndex,
        });

        if (sermons[startIndex]) {
          await get().playSermon(sermons[startIndex], false);
        }
      },

      setSleepTimer: (minutes) => {
        if (minutes === null) {
          set({ sleepTimerEndTime: null, sleepTimerRemaining: null });
          return;
        }

        const endTime = Date.now() + minutes * 60 * 1000;
        set({
          sleepTimerEndTime: endTime,
          sleepTimerRemaining: minutes * 60,
        });
      },

      updateSleepTimerRemaining: () => {
        const { sleepTimerEndTime } = get();
        if (!sleepTimerEndTime) return;

        const remaining = Math.max(0, Math.floor((sleepTimerEndTime - Date.now()) / 1000));

        if (remaining <= 0) {
          audioService.pause();
          set({
            sleepTimerEndTime: null,
            sleepTimerRemaining: null,
            isPlaying: false,
          });
        } else {
          set({ sleepTimerRemaining: remaining });
        }
      },

      savePlaybackPosition: () => {
        const { currentSermon, currentTime } = get();
        if (!currentSermon) return;

        set((state) => ({
          playbackPositions: {
            ...state.playbackPositions,
            [currentSermon.id]: currentTime,
          },
        }));
      },

      handlePlaybackStatusUpdate: (status) => {
        if (!status.isLoaded) {
          if (status.error) {
            console.error('Playback error:', status.error);
          }
          return;
        }

        const { repeatMode, currentSermon } = get();

        set({
          isPlaying: status.isPlaying,
          currentTime: status.positionMillis / 1000,
          duration: (status.durationMillis || 0) / 1000,
          isLoading: status.isBuffering,
        });

        // Auto-save position every 10 seconds
        if (status.positionMillis % 10000 < 500) {
          get().savePlaybackPosition();
        }

        // Handle track completion
        if (status.didJustFinish) {
          if (repeatMode === 'one') {
            audioService.seekTo(0);
            audioService.play();
          } else {
            // Clear saved position when completed
            if (currentSermon) {
              set((state) => {
                const newPositions = { ...state.playbackPositions };
                delete newPositions[currentSermon.id];
                return { playbackPositions: newPositions };
              });
            }
            get().playNext();
          }
        }

        // Check sleep timer
        get().updateSleepTimerRemaining();
      },

      hidePlayer: () => {
        set({ isPlayerHidden: true });
      },

      showPlayer: () => {
        set({ isPlayerHidden: false, isPlayerCompletelyHidden: false });
      },

      hidePlayerCompletely: () => {
        set({ isPlayerHidden: true, isPlayerCompletelyHidden: true });
      },
    }),
    {
      name: 'emcr-audio-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        playbackPositions: state.playbackPositions,
        playbackRate: state.playbackRate,
        volume: state.volume,
        repeatMode: state.repeatMode,
        shuffleEnabled: state.shuffleEnabled,
      }),
    }
  )
);

export default useAudioStore;
