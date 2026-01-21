import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Play, Pause, SkipForward, X } from 'lucide-react-native';
import { View, Text, StyleSheet, Pressable, Image, useColorScheme } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';

import { TAB_BAR_HEIGHT } from '@/components/TabBarBackground';
import { useAudioStore } from '@/stores/useAudioStore';
import { colors, typography, spacing, borderRadius } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MiniPlayer() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const {
    currentSermon,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    isPlayerHidden,
    togglePlayPause,
    playNext,
    hidePlayer,
  } = useAudioStore();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.98, { damping: 15 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15 });
    }, 100);
    router.push('/player');
  };

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await togglePlayPause();
  };

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await playNext();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hidePlayer();
  };

  if (!currentSermon || isPlayerHidden) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const bg = themeColors.background;

  return (
    <View style={[styles.wrapper, { bottom: TAB_BAR_HEIGHT + 30 }]} pointerEvents="box-none">
      {/* Gradient de fondu - même style que la TabBar */}
      <LinearGradient
        colors={[
          `${bg}00`,   // 0% - transparent
          `${bg}33`,   // 20%
          `${bg}66`,   // 40%
          `${bg}99`,   // 60%
          `${bg}CC`,   // 80%
          `${bg}E6`,   // 90%
          bg,          // 100% - solide
          bg,          // 100% - solide
        ]}
        locations={[0, 0.08, 0.18, 0.3, 0.45, 0.6, 0.75, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />

      <AnimatedPressable
        style={[styles.container, animatedStyle]}
        onPress={handlePress}
      >
        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: colors.primary[500] },
            ]}
          />
        </View>

        <View style={styles.content}>
          {/* Cover */}
          <View style={styles.cover}>
            {currentSermon.cover_image ? (
              <Image
                source={{ uri: currentSermon.cover_image }}
                style={styles.coverImage}
              />
            ) : (
              <LinearGradient
                colors={[colors.primary[400], colors.primary[600]]}
                style={styles.coverImage}
              />
            )}
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text
              style={[styles.title, { color: themeColors.text }]}
              numberOfLines={1}
            >
              {currentSermon.title}
            </Text>
            <Text
              style={[styles.speaker, { color: themeColors.textSecondary }]}
              numberOfLines={1}
            >
              {currentSermon.speaker}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <Pressable
              style={styles.controlButton}
              onPress={handlePlayPause}
              hitSlop={8}
            >
              {isPlaying ? (
                <Pause size={24} color={themeColors.text} fill={themeColors.text} />
              ) : (
                <Play size={24} color={themeColors.text} fill={themeColors.text} />
              )}
            </Pressable>

            <Pressable
              style={styles.controlButton}
              onPress={handleNext}
              hitSlop={8}
            >
              <SkipForward size={22} color={themeColors.text} />
            </Pressable>

            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={8}
            >
              <X size={20} color={themeColors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[12],
    paddingBottom: spacing[2],
  },
  gradient: {
    position: 'absolute',
    top: -120,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  progressTrack: {
    height: 3,
    width: '100%',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    paddingRight: spacing[3],
  },
  cover: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    marginLeft: spacing[3],
    marginRight: spacing[2],
  },
  title: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  speaker: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  controlButton: {
    padding: spacing[2],
  },
  closeButton: {
    padding: spacing[1],
    marginLeft: spacing[1],
  },
});

export default MiniPlayer;
