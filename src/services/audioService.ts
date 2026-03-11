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
      throw error;
    }
  }

  setStatusCallback(callback: PlaybackStatusCallback): void {
    this.statusCallback = callback;
  }

  clearStatusCallback(): void {
    this.statusCallback = null;
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
          progressUpdateIntervalMillis: 1000,
        },
        this.handlePlaybackStatusUpdate
      );

      this.sound = sound;
    } catch (error) {
      throw error;
    }
  }

  async play(): Promise<void> {
    if (!this.sound) {
      return;
    }
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await this.sound.playAsync();
      }
    } catch (error) {
    }
  }

  async pause(): Promise<void> {
    if (!this.sound) {
      return;
    }
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.sound.pauseAsync();
      }
    } catch (error) {
      // Try to reinitialize if sound object is corrupted
      try {
        await this.initialize();
      } catch (initError) {
      }
    }
  }

  async stop(): Promise<void> {
    if (!this.sound) return;
    try {
      await this.sound.stopAsync();
    } catch (error) {
    }
  }

  async seekTo(positionMs: number): Promise<void> {
    if (!this.sound) return;
    try {
      await this.sound.setPositionAsync(positionMs);
    } catch (error) {
    }
  }

  async setPlaybackRate(rate: number): Promise<void> {
    if (!this.sound) return;
    try {
      await this.sound.setRateAsync(rate, true);
    } catch (error) {
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.sound) return;
    try {
      await this.sound.setVolumeAsync(volume);
    } catch (error) {
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
    }
    return 0;
  }

  async unload(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (error) {
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
