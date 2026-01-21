import type { ExternalService } from '@/types';

import { appleMusicService } from './appleMusic';
import { spotifyService } from './spotify';
import { youtubeMusicService } from './youtubeMusic';

export { spotifyService } from './spotify';
export { youtubeMusicService } from './youtubeMusic';
export { appleMusicService } from './appleMusic';

/**
 * Get connection status for all external services
 */
export async function getConnectionStatus(): Promise<Record<ExternalService, boolean>> {
  const [spotify, youtube, apple] = await Promise.all([
    spotifyService.isConnected(),
    youtubeMusicService.isConnected(),
    appleMusicService.isConnected(),
  ]);

  return {
    spotify,
    youtube_music: youtube,
    apple_music: apple,
  };
}

/**
 * Disconnect all external services
 */
export async function disconnectAll(): Promise<void> {
  await Promise.all([
    spotifyService.disconnect(),
    youtubeMusicService.disconnect(),
    appleMusicService.disconnect(),
  ]);
}

/**
 * Get service by type
 */
export function getService(service: ExternalService) {
  switch (service) {
    case 'spotify':
      return spotifyService;
    case 'youtube_music':
      return youtubeMusicService;
    case 'apple_music':
      return appleMusicService;
  }
}
