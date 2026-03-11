import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { View, AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/player';
import { sermonKeys } from '@/hooks/queries/useSermons';
import { eventKeys } from '@/hooks/queries/useEvents';
import { queryClient } from '@/lib/queryClient';
import { sermonsApi } from '@/services/api/sermons';
import { eventsApi } from '@/services/api/events';
import { notificationService, getDeepLinkFromNotification } from '@/services/notificationService';
import { useDownloadStore } from '@/stores/useDownloadStore';
import { useUserStore } from '@/stores/useUserStore';
import { colors } from '@/theme';

// Global MiniPlayer that only shows on non-tabs screens
function GlobalMiniPlayer() {
  const segments = useSegments();
  const isTabsScreen = segments[0] === '(tabs)';
  const isPlayerScreen = segments[0] === 'player';

  // Don't show on tabs (they have their own) or on player screen
  if (isTabsScreen || isPlayerScreen) return null;

  return <MiniPlayer />;
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Force dark mode only
  const isDark = true;
  const router = useRouter();
  const { notificationsEnabled } = useUserStore();
  const appState = useRef(AppState.currentState);

  const [fontsLoaded] = useFonts({
    // Add custom fonts here if needed
  });

  // Initialize notifications
  useEffect(() => {
    if (!notificationsEnabled) return;

    let subscription: ReturnType<typeof AppState.addEventListener> | null = null;
    let isMounted = true;

    const initNotifications = async () => {
      await notificationService.initialize();

      if (!isMounted) return;

      // Listen for notification taps
      notificationService.addNotificationResponseListener((response) => {
        const deepLink = getDeepLinkFromNotification(response);
        if (deepLink) {
          router.push(deepLink as any);
        }
      });

      // Clear badge when app becomes active
      subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          notificationService.clearBadge();
        }
        appState.current = nextAppState;
      });
    };

    initNotifications();

    return () => {
      isMounted = false;
      subscription?.remove();
      notificationService.removeAllListeners();
    };
  }, [notificationsEnabled, router]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Verify downloaded files on startup (clean orphaned records)
  useEffect(() => {
    useDownloadStore.getState().verifyDownloads();
  }, []);

  // Prefetch homepage data
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: sermonKeys.latest(6),
      queryFn: () => sermonsApi.getLatest(6),
    });
    queryClient.prefetchQuery({
      queryKey: eventKeys.upcoming(2),
      queryFn: () => eventsApi.getUpcoming(2),
    });
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <QueryClientProvider client={queryClient}>
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: themeColors.background }}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: themeColors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="sermon/[id]"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="event/[id]"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="members"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="media"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="contact"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="favorites"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="history"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="queue"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="speakers"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="speaker/[id]"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="seminars"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="seminar/[id]"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="playlists/index"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="playlists/[id]"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="player"
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="downloads"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="church-info"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="legal/privacy-policy"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="legal/terms-of-service"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
          </Stack>
          <GlobalMiniPlayer />
        </View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
    </QueryClientProvider>
  );
}
