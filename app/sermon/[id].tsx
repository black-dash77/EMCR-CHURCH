import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Play,
  Pause,
  Heart,
  Share2,
  Clock,
  Calendar,
  ListPlus,
  SkipBack,
  SkipForward,
  Headphones,
  Video as VideoIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Share,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddToPlaylistModal } from '@/components';
import { sermonsApi } from '@/services/api';
import { useAudioStore } from '@/stores/useAudioStore';
import { useUserStore } from '@/stores/useUserStore';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Sermon } from '@/types';

const { width } = Dimensions.get('window');
const COVER_SIZE = width * 0.65;

export default function SermonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [mediaMode, setMediaMode] = useState<'audio' | 'video' | null>(null);

  const { currentSermon, isPlaying, playSermon, togglePlayPause, playPrevious, playNext } = useAudioStore();
  const { favorites, addFavorite, removeFavorite } = useUserStore();

  const isCurrentSermon = currentSermon?.id === id;
  const isSermonPlaying = isCurrentSermon && isPlaying;
  const isFavorite = id ? favorites.includes(id) : false;

  // Open video in browser
  const handleWatchVideo = async () => {
    if (!sermon?.video_url) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await WebBrowser.openBrowserAsync(sermon.video_url);
  };

  useEffect(() => {
    const fetchSermon = async () => {
      if (!id) return;
      try {
        const data = await sermonsApi.getById(id);
        if (!data) return;
        setSermon(data);
        // Set default media mode based on available media
        if (!data.audio_url && data.video_url) {
          setMediaMode('video');
        } else if (data.video_url) {
          // If has video, default to video mode
          setMediaMode('video');
        } else {
          setMediaMode('audio');
        }
      } catch (error) {
        console.error('Error fetching sermon:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSermon();
  }, [id]);


  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!sermon) return;

    if (isCurrentSermon) {
      await togglePlayPause();
    } else {
      await playSermon(sermon);
    }
  };

  const handleShare = async () => {
    if (!sermon) return;
    try {
      await Share.share({
        title: sermon.title,
        message: `Écoutez "${sermon.title}" par ${sermon.speaker} sur l'app EMCR Church`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleToggleFavorite = () => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isFavorite) {
      removeFavorite(id);
    } else {
      addFavorite(id);
    }
  };

  const handleAddToPlaylist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlaylistModalVisible(true);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}min`;
    }
    return `${mins} min`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading || !sermon) {
    return (
      <View
        style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Chargement...
          </Text>
        </View>
      </View>
    );
  }

  const handlePrevious = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await playPrevious();
  };

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await playNext();
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={isDark
          ? [colors.primary[900], themeColors.background, themeColors.background]
          : [colors.primary[100], themeColors.background, themeColors.background]
        }
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + spacing[2] }]}
      >
        <Pressable
          style={[styles.headerButton, { backgroundColor: themeColors.surface }]}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={themeColors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Headphones size={16} color={colors.primary[500]} />
          <Text style={[styles.headerLabel, { color: themeColors.textSecondary }]}>
            Prédication
          </Text>
        </View>

        <Pressable
          style={[styles.headerButton, { backgroundColor: themeColors.surface }]}
          onPress={handleShare}
        >
          <Share2 size={20} color={themeColors.text} />
        </Pressable>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={mediaMode === 'video' ? styles.scrollContentVideo : styles.scrollContent}
      >
        {/* Video Thumbnail with Play Button */}
        {sermon.video_url && mediaMode === 'video' && (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400).springify()}
            style={styles.videoSectionTop}
          >
            <Pressable
              style={styles.videoThumbnailContainer}
              onPress={handleWatchVideo}
            >
              {sermon.cover_image ? (
                <Image
                  source={{ uri: sermon.cover_image }}
                  style={styles.videoThumbnailImage}
                />
              ) : (
                <LinearGradient
                  colors={[colors.primary[400], colors.primary[700]]}
                  style={styles.videoThumbnailImage}
                />
              )}

              {/* Dark overlay */}
              <View style={styles.videoThumbnailOverlay} />

              {/* Play button */}
              <View style={styles.videoPlayButton}>
                <Play size={40} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 4 }} />
              </View>

              {/* Label */}
              <View style={styles.videoLabel}>
                <VideoIcon size={16} color="#FFFFFF" />
                <Text style={styles.videoLabelText}>Regarder la vidéo</Text>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Cover Art (only for audio mode) */}
        {mediaMode === 'audio' && (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400).springify()}
            style={styles.coverContainer}
          >
            <View style={[styles.coverWrapper, { shadowColor: colors.primary[500] }]}>
              {sermon.cover_image ? (
                <Image
                  source={{ uri: sermon.cover_image }}
                  style={styles.coverImage}
                />
              ) : (
                <LinearGradient
                  colors={[colors.primary[400], colors.primary[700]]}
                  style={styles.coverImage}
                >
                  <Headphones size={60} color="rgba(255,255,255,0.4)" />
                </LinearGradient>
              )}
            </View>
          </Animated.View>
        )}

        {/* Info Section */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400).springify()}
          style={styles.infoSection}
        >
          {/* Tags */}
          {sermon.tags && sermon.tags.length > 0 && (
            <View style={styles.tags}>
              {sermon.tags.map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: colors.primary[500] + '20' }]}
                >
                  <Text style={[styles.tagText, { color: colors.primary[500] }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Title */}
          <Text style={[styles.title, { color: themeColors.text }]}>
            {sermon.title}
          </Text>

          {/* Speaker */}
          <Text style={[styles.speaker, { color: colors.primary[500] }]}>
            {sermon.speaker}
          </Text>

          {/* Meta Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Calendar size={14} color={themeColors.textTertiary} />
              <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
                {formatDate(sermon.date)}
              </Text>
            </View>
            {sermon.duration_seconds && (
              <View style={styles.metaItem}>
                <Clock size={14} color={themeColors.textTertiary} />
                <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
                  {formatDuration(sermon.duration_seconds)}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Quick Actions for Video Mode */}
        {mediaMode === 'video' && (
          <Animated.View
            entering={FadeInDown.delay(250).duration(400).springify()}
            style={styles.videoActionsSection}
          >
            <View style={styles.videoActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.videoActionButton,
                  { backgroundColor: themeColors.card, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleToggleFavorite}
              >
                <Heart
                  size={22}
                  color={isFavorite ? colors.accent.red : themeColors.text}
                  fill={isFavorite ? colors.accent.red : 'transparent'}
                />
                <Text style={[styles.videoActionText, { color: themeColors.textSecondary }]}>
                  {isFavorite ? 'Favori' : 'J\'aime'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.videoActionButton,
                  { backgroundColor: themeColors.card, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleAddToPlaylist}
              >
                <ListPlus size={22} color={themeColors.text} />
                <Text style={[styles.videoActionText, { color: themeColors.textSecondary }]}>
                  Playlist
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.videoActionButton,
                  { backgroundColor: themeColors.card, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleShare}
              >
                <Share2 size={22} color={themeColors.text} />
                <Text style={[styles.videoActionText, { color: themeColors.textSecondary }]}>
                  Partager
                </Text>
              </Pressable>
            </View>

          </Animated.View>
        )}

        {/* Media Mode Selector (only if both audio and video available) */}
        {sermon.audio_url && sermon.video_url && (
          <Animated.View
            entering={FadeInDown.delay(250).duration(400).springify()}
            style={styles.mediaModeSection}
          >
            <View style={[styles.mediaModeContainer, { backgroundColor: themeColors.card }]}>
              <Pressable
                style={[
                  styles.mediaModeButton,
                  mediaMode === 'audio' && { backgroundColor: colors.primary[500] },
                ]}
                onPress={() => setMediaMode('audio')}
              >
                <Headphones size={18} color={mediaMode === 'audio' ? '#FFFFFF' : themeColors.text} />
                <Text style={[
                  styles.mediaModeText,
                  { color: mediaMode === 'audio' ? '#FFFFFF' : themeColors.textSecondary }
                ]}>
                  Audio
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.mediaModeButton,
                  mediaMode === 'video' && { backgroundColor: colors.primary[500] },
                ]}
                onPress={() => setMediaMode('video')}
              >
                <VideoIcon size={18} color={mediaMode === 'video' ? '#FFFFFF' : themeColors.text} />
                <Text style={[
                  styles.mediaModeText,
                  { color: mediaMode === 'video' ? '#FFFFFF' : themeColors.textSecondary }
                ]}>
                  Vidéo
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}


        {/* Player Controls (for audio mode, only if audio available) */}
        {sermon.audio_url && mediaMode === 'audio' && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(400).springify()}
            style={styles.controlsSection}
          >
            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.quickActionButton,
                  { backgroundColor: themeColors.card, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleAddToPlaylist}
              >
                <ListPlus size={20} color={themeColors.text} />
                <Text style={[styles.quickActionText, { color: themeColors.textSecondary }]}>
                  Playlist
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.quickActionButton,
                  {
                    backgroundColor: isFavorite ? colors.accent.red + '15' : themeColors.card,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={handleToggleFavorite}
              >
                <Heart
                  size={20}
                  color={isFavorite ? colors.accent.red : themeColors.text}
                  fill={isFavorite ? colors.accent.red : 'transparent'}
                />
                <Text style={[
                  styles.quickActionText,
                  { color: isFavorite ? colors.accent.red : themeColors.textSecondary }
                ]}>
                  {isFavorite ? 'Favori' : 'J\'aime'}
                </Text>
              </Pressable>
            </View>

            {/* Main Play Controls */}
            <View style={styles.mainControls}>
              <Pressable
                style={styles.skipButton}
                onPress={handlePrevious}
              >
                <SkipBack size={32} color={themeColors.text} fill={themeColors.text} />
              </Pressable>

              <Pressable
                style={[styles.playButton, { backgroundColor: colors.primary[500] }]}
                onPress={handlePlayPause}
              >
                {isSermonPlaying ? (
                  <Pause size={32} color="#FFFFFF" fill="#FFFFFF" />
                ) : (
                  <Play size={32} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 4 }} />
                )}
              </Pressable>

              <Pressable
                style={styles.skipButton}
                onPress={handleNext}
              >
                <SkipForward size={32} color={themeColors.text} fill={themeColors.text} />
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Description */}
        {sermon.description && (
          <Animated.View
            entering={FadeInDown.delay(400).duration(400).springify()}
            style={styles.descriptionSection}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              À propos
            </Text>
            <Text style={[styles.description, { color: themeColors.textSecondary }]}>
              {sermon.description}
            </Text>
          </Animated.View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add to Playlist Modal */}
      {id && (
        <AddToPlaylistModal
          visible={playlistModalVisible}
          onClose={() => setPlaylistModalVisible(false)}
          sermonId={id}
          sermonTitle={sermon?.title}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerLabel: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: spacing[4],
  },
  scrollContentVideo: {
    paddingTop: 0,
  },
  coverContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  coverWrapper: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  tag: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  tagText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  title: {
    ...typography.headlineSmall,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  speaker: {
    ...typography.titleMedium,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  metaText: {
    ...typography.bodySmall,
  },
  controlsSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  quickActionButton: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.xl,
    gap: spacing[1],
  },
  quickActionText: {
    ...typography.labelSmall,
    fontWeight: '500',
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
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
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  descriptionSection: {
    paddingHorizontal: spacing[5],
    marginTop: spacing[4],
  },
  sectionTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  description: {
    ...typography.bodyMedium,
    lineHeight: 24,
  },
  mediaModeSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
    alignItems: 'center',
  },
  mediaModeContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    padding: spacing[1],
    gap: spacing[1],
  },
  mediaModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  mediaModeText: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  videoSectionTop: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  videoThumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  videoLabel: {
    position: 'absolute',
    bottom: spacing[3],
    left: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  videoLabelText: {
    color: '#FFFFFF',
    ...typography.labelMedium,
    fontWeight: '600',
  },
  videoActionsSection: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  videoActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
  },
  videoActionButton: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[1],
    minWidth: 80,
  },
  videoActionText: {
    ...typography.labelSmall,
    fontWeight: '500',
  },
});
