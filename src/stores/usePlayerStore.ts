import type { Sermon } from '@/types';

import { useAudioStore } from './useAudioStore';

/**
 * Wrapper around useAudioStore for simplified player controls
 * Used by playlist and other screens that need simple playback control
 */
export const usePlayerStore = () => {
  const audioStore = useAudioStore();

  const setCurrentSermon = async (sermon: Sermon) => {
    await audioStore.playSermon(sermon, false);
  };

  const setQueue = (sermons: Sermon[]) => {
    // Set the queue without starting playback
    useAudioStore.setState({
      queue: sermons,
      originalQueue: sermons,
    });
  };

  const setIsPlaying = async (playing: boolean) => {
    if (playing) {
      await audioStore.play();
    } else {
      await audioStore.pause();
    }
  };

  const setShuffle = (enabled: boolean) => {
    const currentState = useAudioStore.getState();
    if (currentState.shuffleEnabled !== enabled) {
      audioStore.toggleShuffle();
    }
  };

  return {
    // State from audio store
    currentSermon: audioStore.currentSermon,
    isPlaying: audioStore.isPlaying,
    isLoading: audioStore.isLoading,
    queue: audioStore.queue,
    shuffleEnabled: audioStore.shuffleEnabled,

    // Simplified actions
    setCurrentSermon,
    setQueue,
    setIsPlaying,
    setShuffle,

    // Pass through commonly used actions
    togglePlayPause: audioStore.togglePlayPause,
    playNext: audioStore.playNext,
    playPrevious: audioStore.playPrevious,
    addToQueue: audioStore.addToQueue,
  };
};

export default usePlayerStore;
