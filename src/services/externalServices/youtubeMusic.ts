import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import type { ExternalServiceAuth } from '@/types';

WebBrowser.maybeCompleteAuthSession();

const YOUTUBE_CLIENT_ID = process.env.EXPO_PUBLIC_YOUTUBE_CLIENT_ID || '';
const STORAGE_KEY = 'youtube_music_auth';

// Google OAuth endpoints
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Scopes needed for YouTube operations
const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
];

export interface YouTubePlaylist {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
}

export interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    thumbnails: {
      default: { url: string };
    };
  };
}

class YouTubeMusicService {
  private auth: ExternalServiceAuth | null = null;
  private redirectUri: string;

  constructor() {
    this.redirectUri = AuthSession.makeRedirectUri({
      scheme: 'emcr',
      path: 'youtube-callback',
    });
    this.loadAuth();
  }

  private async loadAuth() {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        this.auth = JSON.parse(stored);
        // Check if token is expired
        if (this.auth && this.auth.expiresAt) {
          if (new Date(this.auth.expiresAt) < new Date()) {
            // Token expired, try to refresh
            await this.refreshToken();
          }
        }
      }
    } catch (error) {
      console.error('Error loading YouTube auth:', error);
    }
  }

  private async saveAuth(auth: ExternalServiceAuth) {
    this.auth = auth;
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(auth));
  }

  async authenticate(): Promise<boolean> {
    if (!YOUTUBE_CLIENT_ID) {
      console.error('YouTube Client ID not configured');
      return false;
    }

    try {
      const discovery = {
        authorizationEndpoint: GOOGLE_AUTH_ENDPOINT,
        tokenEndpoint: GOOGLE_TOKEN_ENDPOINT,
      };

      const request = new AuthSession.AuthRequest({
        clientId: YOUTUBE_CLIENT_ID,
        scopes: SCOPES,
        redirectUri: this.redirectUri,
        usePKCE: true,
      });

      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params.code) {
        // Exchange code for token
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: YOUTUBE_CLIENT_ID,
            code: result.params.code,
            redirectUri: this.redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier || '',
            },
          },
          discovery
        );

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (tokenResponse.expiresIn || 3600));

        const auth: ExternalServiceAuth = {
          service: 'youtube_music',
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          expiresAt: expiresAt.toISOString(),
        };

        // Get channel info
        const channel = await this.getMyChannel(auth.accessToken);
        if (channel) {
          auth.userId = channel.id;
        }

        await this.saveAuth(auth);
        return true;
      }

      return false;
    } catch (error) {
      console.error('YouTube authentication error:', error);
      return false;
    }
  }

  private async refreshToken(): Promise<boolean> {
    if (!this.auth?.refreshToken) return false;

    try {
      const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.auth.refreshToken,
          client_id: YOUTUBE_CLIENT_ID,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (data.expires_in || 3600));

      const auth: ExternalServiceAuth = {
        service: 'youtube_music',
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.auth.refreshToken,
        expiresAt: expiresAt.toISOString(),
        userId: this.auth.userId,
      };

      await this.saveAuth(auth);
      return true;
    } catch (error) {
      console.error('Error refreshing YouTube token:', error);
      await this.disconnect();
      return false;
    }
  }

  private async getMyChannel(accessToken: string): Promise<YouTubeChannel | null> {
    try {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/channels?part=snippet&mine=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.items?.[0] || null;
    } catch (error) {
      console.error('Error getting YouTube channel:', error);
      return null;
    }
  }

  async isConnected(): Promise<boolean> {
    await this.loadAuth();
    return !!this.auth?.accessToken;
  }

  async disconnect(): Promise<void> {
    this.auth = null;
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  }

  async createPlaylist(
    title: string,
    description?: string,
    privacyStatus: 'public' | 'private' | 'unlisted' = 'private'
  ): Promise<YouTubePlaylist | null> {
    if (!this.auth?.accessToken) {
      console.error('Not authenticated with YouTube');
      return null;
    }

    try {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/playlists?part=snippet,status`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.auth.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              title,
              description: description || 'Created from EMCR Church App',
            },
            status: {
              privacyStatus,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create playlist');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating YouTube playlist:', error);
      return null;
    }
  }

  async searchVideo(query: string): Promise<string | null> {
    if (!this.auth?.accessToken) return null;

    try {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1`,
        {
          headers: {
            Authorization: `Bearer ${this.auth.accessToken}`,
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.items?.[0]?.id?.videoId || null;
    } catch (error) {
      console.error('Error searching YouTube video:', error);
      return null;
    }
  }

  async addVideoToPlaylist(playlistId: string, videoId: string): Promise<boolean> {
    if (!this.auth?.accessToken) return false;

    try {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/playlistItems?part=snippet`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.auth.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              playlistId,
              resourceId: {
                kind: 'youtube#video',
                videoId,
              },
            },
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error adding video to YouTube playlist:', error);
      return false;
    }
  }
}

export const youtubeMusicService = new YouTubeMusicService();
