import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import type { ExternalServiceAuth } from '@/types';

WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '';
const STORAGE_KEY = 'spotify_auth';

// Spotify API endpoints
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Scopes needed for playlist creation
const SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
  'user-read-email',
];

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  external_urls: { spotify: string };
  images: { url: string }[];
}

class SpotifyService {
  private auth: ExternalServiceAuth | null = null;
  private redirectUri: string;

  constructor() {
    this.redirectUri = AuthSession.makeRedirectUri({
      scheme: 'emcr',
      path: 'spotify-callback',
    });
    this.loadAuth();
  }

  private async loadAuth() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
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
      console.error('Error loading Spotify auth:', error);
    }
  }

  private async saveAuth(auth: ExternalServiceAuth) {
    this.auth = auth;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }

  async authenticate(): Promise<boolean> {
    if (!SPOTIFY_CLIENT_ID) {
      console.error('Spotify Client ID not configured');
      return false;
    }

    try {
      const discovery = {
        authorizationEndpoint: SPOTIFY_AUTH_ENDPOINT,
        tokenEndpoint: SPOTIFY_TOKEN_ENDPOINT,
      };

      const request = new AuthSession.AuthRequest({
        clientId: SPOTIFY_CLIENT_ID,
        scopes: SCOPES,
        redirectUri: this.redirectUri,
        usePKCE: true,
      });

      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params.code) {
        // Exchange code for token
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: SPOTIFY_CLIENT_ID,
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
          service: 'spotify',
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          expiresAt: expiresAt.toISOString(),
        };

        // Get user info
        const user = await this.getUserInfo(auth.accessToken);
        if (user) {
          auth.userId = user.id;
        }

        await this.saveAuth(auth);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Spotify authentication error:', error);
      return false;
    }
  }

  private async refreshToken(): Promise<boolean> {
    if (!this.auth?.refreshToken) return false;

    try {
      const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.auth.refreshToken,
          client_id: SPOTIFY_CLIENT_ID,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (data.expires_in || 3600));

      const auth: ExternalServiceAuth = {
        service: 'spotify',
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.auth.refreshToken,
        expiresAt: expiresAt.toISOString(),
        userId: this.auth.userId,
      };

      await this.saveAuth(auth);
      return true;
    } catch (error) {
      console.error('Error refreshing Spotify token:', error);
      await this.disconnect();
      return false;
    }
  }

  private async getUserInfo(accessToken: string): Promise<SpotifyUser | null> {
    try {
      const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error getting Spotify user info:', error);
      return null;
    }
  }

  async isConnected(): Promise<boolean> {
    await this.loadAuth();
    return !!this.auth?.accessToken;
  }

  async disconnect(): Promise<void> {
    this.auth = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  async createPlaylist(name: string, description?: string): Promise<SpotifyPlaylist | null> {
    if (!this.auth?.accessToken || !this.auth?.userId) {
      console.error('Not authenticated with Spotify');
      return null;
    }

    try {
      const response = await fetch(
        `${SPOTIFY_API_BASE}/users/${this.auth.userId}/playlists`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.auth.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description: description || 'Created from EMCR Church App',
            public: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create playlist');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Spotify playlist:', error);
      return null;
    }
  }

  async searchTrack(query: string): Promise<string | null> {
    if (!this.auth?.accessToken) return null;

    try {
      const response = await fetch(
        `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${this.auth.accessToken}`,
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.tracks?.items?.[0]?.uri || null;
    } catch (error) {
      console.error('Error searching Spotify track:', error);
      return null;
    }
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<boolean> {
    if (!this.auth?.accessToken) return false;

    try {
      const response = await fetch(
        `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.auth.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: trackUris,
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error adding tracks to Spotify playlist:', error);
      return false;
    }
  }
}

export const spotifyService = new SpotifyService();
