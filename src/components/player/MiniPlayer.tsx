import { View, Text, StyleSheet, Pressable, Image, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { useAudioStore } from '@/stores/useAudioStore';

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
    togglePlayPause,
    playNext,
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

  if (!currentSermon) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatedPressable
      style={[
        styles.container,
        { backgroundColor: themeColors.surfaceElevated },
        animatedStyle,
      ]}
      onPress={handlePress}
    >
      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: themeColors.border }]}>
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
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 88, // Above tab bar
    left: spacing[3],
    right: spacing[3],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  progressTrack: {
    height: 2,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    paddingRight: spacing[3],
  },
  cover: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
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
  },
  speaker: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  controlButton: {
    padding: spacing[2],
  },
});

export default MiniPlayer;
