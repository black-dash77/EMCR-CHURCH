import { Audio, AVPlaybackStatus, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

type PlaybackStatusCallback = (status: AVPlaybackStatus) => void;

class AudioService {
  private sound: Audio.Sound | null = null;
  private statusCallback: PlaybackStatusCallback | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }

  setStatusCallback(callback: PlaybackStatusCallback): void {
    this.statusCallback = callback;
  }

  private handlePlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  };

  async loadAudio(uri: string, startPositionMs: number = 0): Promise<void> {
    await this.initialize();

    // Unload existing sound
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: true,
          positionMillis: startPositionMs,
          progressUpdateIntervalMillis: 500,
        },
        this.handlePlaybackStatusUpdate
      );

      this.sound = sound;
    } catch (error) {
      console.error('Failed to load audio:', error);
      throw error;
    }
  }

  async play(): Promise<void> {
    if (!this.sound) {
      console.warn('Play called but no sound loaded');
      return;
    }
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await this.sound.playAsync();
      }
    } catch (error) {
      console.error('Failed to play:', error);
    }
  }

  async pause(): Promise<void> {
    if (!this.sound) {
      console.warn('Pause called but no sound loaded');
      return;
    }
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.sound.pauseAsync();
      }
    } catch (error) {
      console.error('Failed to pause:', error);
      // Try to reinitialize if sound object is corrupted
      try {
        await this.initialize();
      } catch (initError) {
        console.error('Failed to reinitialize audio:', initError);
      }
    }
  }

  async stop(): Promise<void> {
    if (!this.sound) return;
    try {
      await this.sound.stopAsync();
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  }

  async seekTo(positionMs: number): Promise<void> {
    if (!this.sound) return;
    try {
      await this.sound.setPositionAsync(positionMs);
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  }

  async setPlaybackRate(rate: number): Promise<void> {
    if (!this.sound) return;
    try {
      await this.sound.setRateAsync(rate, true);
    } catch (error) {
      console.error('Failed to set rate:', error);
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.sound) return;
    try {
      await this.sound.setVolumeAsync(volume);
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  }

  async skipForward(seconds: number = 15): Promise<void> {
    if (!this.sound) return;
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.min(
          status.positionMillis + seconds * 1000,
          status.durationMillis || status.positionMillis
        );
        await this.sound.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error('Failed to skip forward:', error);
    }
  }

  async skipBackward(seconds: number = 15): Promise<void> {
    if (!this.sound) return;
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.max(status.positionMillis - seconds * 1000, 0);
        await this.sound.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error('Failed to skip backward:', error);
    }
  }

  async getCurrentPosition(): Promise<number> {
    if (!this.sound) return 0;
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        return status.positionMillis;
      }
    } catch (error) {
      console.error('Failed to get position:', error);
    }
    return 0;
  }

  async unload(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (error) {
        console.error('Failed to unload:', error);
      }
      this.sound = null;
    }
  }

  isLoaded(): boolean {
    return this.sound !== null;
  }
}

export const audioService = new AudioService();
export default audioService;
