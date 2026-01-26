import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { useColorScheme, View, AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { notificationService, getDeepLinkFromNotification } from '@/services/notificationService';
import { useDownloadStore } from '@/stores/useDownloadStore';
import { useUserStore } from '@/stores/useUserStore';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { notificationsEnabled } = useUserStore();
  const appState = useRef(AppState.currentState);

  const [fontsLoaded] = useFonts({
    // Add custom fonts here if needed
  });

  // Initialize notifications
  useEffect(() => {
    if (!notificationsEnabled) return;

    const initNotifications = async () => {
      await notificationService.initialize();

      // Listen for notification taps
      notificationService.addNotificationResponseListener((response) => {
        const deepLink = getDeepLinkFromNotification(response);
        if (deepLink) {
          router.push(deepLink as any);
        }
      });

      // Clear badge when app becomes active
      const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          notificationService.clearBadge();
        }
        appState.current = nextAppState;
      });

      return () => {
        subscription.remove();
        notificationService.removeAllListeners();
      };
    };

    initNotifications();
  }, [notificationsEnabled]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Verify downloaded files on startup (clean orphaned records)
  useEffect(() => {
    useDownloadStore.getState().verifyDownloads();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: themeColors.background }}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
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
          </Stack>
        </View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
