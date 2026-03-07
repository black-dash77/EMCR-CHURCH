import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import {
  Home,
  Headphones,
  Calendar,
  Bell,
  Menu,
  Play,
  Pause,
} from 'lucide-react-native';
import { useColorScheme, Platform, View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { MiniPlayer } from '@/components/player';
import { TabBarBackground, TAB_BAR_HEIGHT } from '@/components/TabBarBackground';
import {
  useCurrentSermon,
  useIsPlaying,
  usePlayerVisibility,
  useAudioActions,
} from '@/stores/useAudioStore';
import { colors, borderRadius, spacing } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabIcon({
  Icon,
  color,
  focused,
}: {
  Icon: typeof Home;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={styles.iconContainer}>
      <Icon
        size={22}
        color={color}
        strokeWidth={2}
      />
    </View>
  );
}

function FloatingPlayButton() {
  const currentSermon = useCurrentSermon();
  const isPlaying = useIsPlaying();
  const { isPlayerHidden, isPlayerCompletelyHidden } = usePlayerVisibility();
  const { showPlayer, togglePlayPause } = useAudioActions();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showPlayer();
  };

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await togglePlayPause();
  };

  // Don't show if no sermon, player is visible, or player is completely hidden
  if (!currentSermon || !isPlayerHidden || isPlayerCompletelyHidden) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.floatingContainer}
    >
      <AnimatedPressable
        style={[styles.floatingButton, animatedStyle]}
        onPress={handlePress}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      >
        {/* Cover image */}
        {currentSermon.cover_image ? (
          <Image source={{ uri: currentSermon.cover_image }} style={styles.floatingCover} contentFit="cover" cachePolicy="memory-disk" transition={200} />
        ) : (
          <LinearGradient
            colors={[colors.primary[400], colors.primary[600]]}
            style={styles.floatingCover}
          />
        )}
        {/* Play/Pause overlay */}
        <Pressable style={styles.floatingPlayOverlay} onPress={handlePlayPause}>
          {isPlaying ? (
            <Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
          )}
        </Pressable>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'none',
          lazy: true,

          // Couleurs - blanc inactif, bleu actif
          tabBarActiveTintColor: colors.primary[500],
          tabBarInactiveTintColor: '#FFFFFF',

          // Style de la barre - TRANSPARENT avec position absolute
          tabBarStyle: {
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 34 : 16,
            left: 0,
            right: 0,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            paddingTop: 4,
            paddingBottom: 4,
            height: TAB_BAR_HEIGHT,
            elevation: 0,
          },

          // Le gradient de fondu
          tabBarBackground: () => <TabBarBackground />,

          // Style des labels
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon Icon={Home} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="sermons"
          options={{
            title: 'Prédications',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon Icon={Headphones} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: 'Événements',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon Icon={Calendar} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="announcements"
          options={{
            title: 'Annonces',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon Icon={Bell} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'Plus',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon Icon={Menu} color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>
      <MiniPlayer />
      <FloatingPlayButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingContainer: {
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT + (Platform.OS === 'ios' ? 34 : 16) + spacing[4],
    right: spacing[4],
    zIndex: 100,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCover: {
    width: '100%',
    height: '100%',
  },
  floatingPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
