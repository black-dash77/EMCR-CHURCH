import type { Sermon } from '@/types';

import {
  useCurrentSermon,
  useIsPlaying,
  useIsLoading,
  useAudioQueue,
  usePlaybackSettings,
  useAudioActions,
  useAudioStore,
} from './useAudioStore';

/**
 * Wrapper around useAudioStore for simplified player controls
 * Used by playlist and other screens that need simple playback control
 */
export const usePlayerStore = () => {
  const currentSermon = useCurrentSermon();
  const isPlaying = useIsPlaying();
  const isLoading = useIsLoading();
  const { queue } = useAudioQueue();
  const { shuffleEnabled } = usePlaybackSettings();
  const actions = useAudioActions();

  const setCurrentSermon = async (sermon: Sermon) => {
    await actions.playSermon(sermon, false);
  };

  const setQueue = (sermons: Sermon[]) => {
    useAudioStore.setState({
      queue: sermons,
      originalQueue: sermons,
    });
  };

  const setIsPlaying = async (playing: boolean) => {
    if (playing) {
      await actions.play();
    } else {
      await actions.pause();
    }
  };

  const setShuffle = (enabled: boolean) => {
    const currentState = useAudioStore.getState();
    if (currentState.shuffleEnabled !== enabled) {
      actions.toggleShuffle();
    }
  };

  return {
    currentSermon,
    isPlaying,
    isLoading,
    queue,
    shuffleEnabled,
    setCurrentSermon,
    setQueue,
    setIsPlaying,
    setShuffle,
    togglePlayPause: actions.togglePlayPause,
    playNext: actions.playNext,
    playPrevious: actions.playPrevious,
    addToQueue: actions.addToQueue,
  };
};

export default usePlayerStore;
