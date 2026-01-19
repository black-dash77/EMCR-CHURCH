import { View, Text, StyleSheet, Pressable, Image, useColorScheme, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Share2,
  ListMusic,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { useAudioStore } from '@/stores/useAudioStore';
import type { PlaybackRate } from '@/types';

const { width } = Dimensions.get('window');
const COVER_SIZE = width - spacing[12] * 2;

const PLAYBACK_RATES: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function ExpandedPlayer() {
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
    playbackRate,
    repeatMode,
    shuffleEnabled,
    sleepTimerRemaining,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    skipForward,
    skipBackward,
    setPlaybackRate,
    toggleRepeat,
    toggleShuffle,
    setSleepTimer,
  } = useAudioStore();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSleepTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await togglePlayPause();
  };

  const handlePrevious = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await playPrevious();
  };

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await playNext();
  };

  const handleSeek = async (value: number) => {
    await seek(value);
  };

  const cyclePlaybackRate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    await setPlaybackRate(PLAYBACK_RATES[nextIndex]);
  };

  const cycleSleepTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const timers = [null, 5, 10, 15, 30, 45, 60];
    const currentIndex = sleepTimerRemaining
      ? timers.findIndex((t) => t && sleepTimerRemaining <= t * 60)
      : 0;
    const nextIndex = (currentIndex + 1) % timers.length;
    setSleepTimer(timers[nextIndex]);
  };

  const handleToggleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleShuffle();
  };

  const handleToggleRepeat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleRepeat();
  };

  if (!currentSermon) return null;

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;
  const isRepeatActive = repeatMode !== 'off';

  return (
    <LinearGradient
      colors={isDark ? ['#1a1a2e', '#000000'] : ['#f0f4ff', '#ffffff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <ChevronDown size={28} color={themeColors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: themeColors.textSecondary }]}>
            En cours de lecture
          </Text>
          <Pressable style={styles.headerButton}>
            <ListMusic size={24} color={themeColors.text} />
          </Pressable>
        </View>

        {/* Cover Art */}
        <View style={styles.coverContainer}>
          <View style={styles.coverShadow}>
            {currentSermon.cover_image ? (
              <Image
                source={{ uri: currentSermon.cover_image }}
                style={styles.coverImage}
              />
            ) : (
              <LinearGradient
                colors={[colors.primary[400], colors.primary[700]]}
                style={styles.coverImage}
              />
            )}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={2}>
            {currentSermon.title}
          </Text>
          <Text style={[styles.speaker, { color: themeColors.textSecondary }]}>
            {currentSermon.speaker}
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={currentTime}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor={colors.primary[500]}
            maximumTrackTintColor={themeColors.border}
            thumbTintColor={colors.primary[500]}
          />
          <View style={styles.timeContainer}>
            <Text style={[styles.time, { color: themeColors.textSecondary }]}>
              {formatTime(currentTime)}
            </Text>
            <Text style={[styles.time, { color: themeColors.textSecondary }]}>
              -{formatTime(Math.max(0, duration - currentTime))}
            </Text>
          </View>
        </View>

        {/* Main Controls */}
        <View style={styles.mainControls}>
          <Pressable
            style={[
              styles.secondaryControl,
              shuffleEnabled && styles.activeControl,
            ]}
            onPress={handleToggleShuffle}
          >
            <Shuffle
              size={22}
              color={shuffleEnabled ? colors.primary[500] : themeColors.textSecondary}
            />
          </Pressable>

          <Pressable style={styles.skipButton} onPress={handlePrevious}>
            <SkipBack size={32} color={themeColors.text} fill={themeColors.text} />
          </Pressable>

          <Pressable
            style={[styles.playButton, { backgroundColor: colors.primary[500] }]}
            onPress={handlePlayPause}
          >
            {isPlaying ? (
              <Pause size={32} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={32} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 4 }} />
            )}
          </Pressable>

          <Pressable style={styles.skipButton} onPress={handleNext}>
            <SkipForward size={32} color={themeColors.text} fill={themeColors.text} />
          </Pressable>

          <Pressable
            style={[
              styles.secondaryControl,
              isRepeatActive && styles.activeControl,
            ]}
            onPress={handleToggleRepeat}
          >
            <RepeatIcon
              size={22}
              color={isRepeatActive ? colors.primary[500] : themeColors.textSecondary}
            />
          </Pressable>
        </View>

        {/* Secondary Controls */}
        <View style={styles.secondaryControls}>
          <Pressable style={styles.actionButton} onPress={cyclePlaybackRate}>
            <Text
              style={[
                styles.speedText,
                {
                  color:
                    playbackRate !== 1
                      ? colors.primary[500]
                      : themeColors.textSecondary,
                },
              ]}
            >
              {playbackRate}x
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => skipBackward(15)}
          >
            <Text style={[styles.skipText, { color: themeColors.textSecondary }]}>
              -15
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => skipForward(15)}
          >
            <Text style={[styles.skipText, { color: themeColors.textSecondary }]}>
              +15
            </Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={cycleSleepTimer}>
            <Clock
              size={20}
              color={
                sleepTimerRemaining
                  ? colors.primary[500]
                  : themeColors.textSecondary
              }
            />
            {sleepTimerRemaining && (
              <Text style={[styles.timerText, { color: colors.primary[500] }]}>
                {formatSleepTimer(sleepTimerRemaining)}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Pressable style={styles.bottomButton}>
            <Heart size={24} color={themeColors.textSecondary} />
          </Pressable>
          <Pressable style={styles.bottomButton}>
            <Share2 size={24} color={themeColors.textSecondary} />
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  headerButton: {
    padding: spacing[2],
  },
  headerTitle: {
    ...typography.labelLarge,
  },
  coverContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[6],
  },
  coverShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  coverImage: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: borderRadius.xl,
  },
  infoContainer: {
    paddingHorizontal: spacing[6],
    alignItems: 'center',
  },
  title: {
    ...typography.titleLarge,
    textAlign: 'center',
  },
  speaker: {
    ...typography.bodyLarge,
    marginTop: spacing[1],
  },
  progressContainer: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing[2],
  },
  time: {
    ...typography.labelSmall,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    marginTop: spacing[4],
    gap: spacing[4],
  },
  secondaryControl: {
    padding: spacing[2],
  },
  activeControl: {
    backgroundColor: 'rgba(26, 75, 255, 0.1)',
    borderRadius: borderRadius.full,
  },
  skipButton: {
    padding: spacing[2],
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing[2],
  },
  secondaryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    marginTop: spacing[6],
    gap: spacing[6],
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing[2],
  },
  speedText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  skipText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  timerText: {
    ...typography.labelSmall,
    marginTop: spacing[0.5],
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    marginTop: 'auto',
    marginBottom: spacing[6],
    gap: spacing[8],
  },
  bottomButton: {
    padding: spacing[3],
  },
});

export default ExpandedPlayer;
