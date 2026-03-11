import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationPreferences } from '@/types';

import { supabase } from './supabase';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationPayload {
  type: 'sermon' | 'event' | 'announcement';
  id: string;
  title: string;
  body: string;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Initialize the notification service
   * Call this at app startup
   */
  async initialize(): Promise<string | null> {
    try {
      // Register for push notifications
      const token = await this.registerForPushNotifications();

      if (token) {
        this.expoPushToken = token;
        await this.saveDeviceToken(token);
      }

      return token;
    } catch (error) {
      return null;
    }
  }

  /**
   * Register for push notifications and get the Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Must be a physical device
    if (!Device.isDevice) {
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    try {
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenResponse.data;

      // Set up Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'EMCR Church',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563EB',
        });
      }

      return token;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save device token to Supabase
   */
  async saveDeviceToken(token: string): Promise<void> {
    try {
      // Use upsert to handle duplicate tokens gracefully
      const { error } = await supabase
        .from('device_tokens')
        .upsert(
          {
            device_token: token,
            platform: Platform.OS,
          },
          {
            onConflict: 'device_token',
            ignoreDuplicates: true,
          }
        );

      if (error) throw error;


      // Create default notification preferences
      await this.initializePreferences(token);
    } catch (error) {
    }
  }

  /**
   * Initialize default notification preferences for a new device
   */
  async initializePreferences(token: string): Promise<void> {
    try {
      // Get device token ID
      const { data: deviceData } = await supabase
        .from('device_tokens')
        .select('id')
        .eq('device_token', token)
        .single();

      if (!deviceData) return;

      // Check if preferences already exist
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('device_token_id', deviceData.id)
        .single();

      if (existing) return;

      // Create default preferences
      await supabase.from('notification_preferences').insert({
        device_token_id: deviceData.id,
        new_sermons: true,
        new_events: true,
        new_announcements: true,
      });
    } catch (error) {
    }
  }

  /**
   * Get notification preferences for current device
   */
  async getPreferences(): Promise<NotificationPreferences | null> {
    if (!this.expoPushToken) return null;

    try {
      const { data: deviceData } = await supabase
        .from('device_tokens')
        .select('id')
        .eq('device_token', this.expoPushToken)
        .single();

      if (!deviceData) return null;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('device_token_id', deviceData.id)
        .single();

      if (error) throw error;

      return {
        newSermons: data.new_sermons,
        newEvents: data.new_events,
        newAnnouncements: data.new_announcements,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      const { data: deviceData } = await supabase
        .from('device_tokens')
        .select('id')
        .eq('device_token', this.expoPushToken)
        .single();

      if (!deviceData) return;

      const updates: any = {};
      if (preferences.newSermons !== undefined) {
        updates.new_sermons = preferences.newSermons;
      }
      if (preferences.newEvents !== undefined) {
        updates.new_events = preferences.newEvents;
      }
      if (preferences.newAnnouncements !== undefined) {
        updates.new_announcements = preferences.newAnnouncements;
      }

      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('device_token_id', deviceData.id);

      if (error) throw error;
    } catch (error) {
    }
  }

  /**
   * Add listener for incoming notifications (app in foreground)
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): void {
    this.notificationListener = Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add listener for notification responses (user tapped notification)
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): void {
    this.responseListener = Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Remove all notification listeners
   */
  removeAllListeners(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }

  /**
   * Schedule a local notification (for testing or reminders)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: trigger || null,
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Get the current push token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Delete device token from database (for logout or unregister)
   */
  async deleteDeviceToken(): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      await supabase
        .from('device_tokens')
        .delete()
        .eq('device_token', this.expoPushToken);

      this.expoPushToken = null;
    } catch (error) {
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export helper function to get deep link from notification
export function getDeepLinkFromNotification(
  response: Notifications.NotificationResponse
): string | null {
  const rawData = response.notification.request.content.data;

  // Type guard pour vérifier si les données sont valides
  if (
    !rawData ||
    typeof rawData !== 'object' ||
    !('type' in rawData) ||
    !('id' in rawData)
  ) {
    return null;
  }

  const data = rawData as unknown as PushNotificationPayload;

  switch (data.type) {
    case 'sermon':
      return `/sermon/${data.id}`;
    case 'event':
      return `/event/${data.id}`;
    case 'announcement':
      return '/announcements';
    default:
      return null;
  }
}
