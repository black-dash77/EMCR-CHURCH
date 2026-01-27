import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';

import { useNavigationLock } from '@/hooks/useNavigationLock';
import {
  ArrowLeft,
  FolderOpen,
  Calendar,
  Music,
  Play,
  User,
  Clock,
  Share2,
  Heart,
  ChevronRight,
  ListPlus,
  Plus,
} from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddSermonsToSeminarModal } from '@/components/AddSermonsToSeminarModal';
import { AddToPlaylistModal } from '@/components/AddToPlaylistModal';
import { seminarsApi } from '@/services/api';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useUserStore } from '@/stores/useUserStore';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Seminar, Sermon } from '@/types';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.35;

export default function SeminarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { navigateTo, router } = useNavigationLock();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [seminar, setSeminar] = useState<Seminar | null>(null);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [addSermonsModalVisible, setAddSermonsModalVisible] = useState(false);

  const { setCurrentSermon, setQueue, setIsPlaying } = usePlayerStore();
  const { favorites, addFavorite, removeFavorite } = useUserStore();

  const loadSeminar = useCallback(async () => {
    if (!id) return;

    try {
      const data = await seminarsApi.getWithSermons(id);
      if (data) {
        setSeminar(data.seminar);
        setSermons(data.sermons);
      }
    } catch (error) {
      console.error('Error loading seminar:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadSeminar();
  }, [loadSeminar]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSeminar();
  }, [loadSeminar]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const getTotalDuration = () => {
    const total = sermons.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const hours = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  };

  const handlePlayAll = () => {
    // Filter only sermons with audio
    const audioSermons = sermons.filter(s => s.audio_url);
    if (audioSermons.length === 0) {
      // If no audio sermons, open first sermon's detail page
      if (sermons.length > 0) {
        navigateTo(`/sermon/${sermons[0].id}`);
      }
      return;
    }
    setQueue(audioSermons);
    setCurrentSermon(audioSermons[0]);
    setIsPlaying(true);
  };

  const handlePlaySermon = (sermon: Sermon, index: number) => {
    // If sermon has no audio but has YouTube/video, go to detail page
    if (!sermon.audio_url && (sermon.youtube_url || sermon.video_url)) {
      navigateTo(`/sermon/${sermon.id}`);
      return;
    }
    if (!sermon.audio_url) {
      navigateTo(`/sermon/${sermon.id}`);
      return;
    }
    // Filter only audio sermons for the queue
    const audioSermons = sermons.filter(s => s.audio_url);
    setQueue(audioSermons);
    setCurrentSermon(sermon);
    setIsPlaying(true);
  };

  const isFavorite = (sermonId: string) => favorites.includes(sermonId);

  const toggleFavorite = (sermonId: string) => {
    if (isFavorite(sermonId)) {
      removeFavorite(sermonId);
    } else {
      addFavorite(sermonId);
    }
  };

  const handleAddToPlaylist = (sermon: Sermon) => {
    setSelectedSermon(sermon);
    setPlaylistModalVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!seminar) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: themeColors.background }]}>
        <FolderOpen size={48} color={themeColors.textTertiary} />
        <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
          Seminaire non trouve
        </Text>
        <Pressable
          style={[styles.backButtonAlt, { backgroundColor: colors.primary[500] }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          {seminar.cover_image ? (
            <Image
              source={{ uri: seminar.cover_image }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.heroImage}
            >
              <FolderOpen size={64} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          )}

          {/* Top Gradient for Status Bar protection */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={[styles.topGradient, { height: insets.top + 40 }]}
          />

          {/* Bottom Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', themeColors.background]}
            locations={[0, 0.6, 1]}
            style={styles.heroOverlay}
          />

          {/* Back Button */}
          <Pressable
            style={[styles.backButton, { top: insets.top + spacing[2] }]}
            onPress={() => router.back()}
          >
            <View style={styles.backButtonInner}>
              <ArrowLeft size={20} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* Add Sermons Button */}
          <Pressable
            style={[styles.addButton, { top: insets.top + spacing[2] }]}
            onPress={() => setAddSermonsModalVisible(true)}
          >
            <View style={styles.addButtonInner}>
              <Plus size={20} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* Seminar Info on Hero */}
          <View style={[styles.heroContent, { bottom: spacing[4] }]}>
            <Animated.Text
              entering={FadeInUp.delay(100).duration(400)}
              style={styles.seminarName}
              numberOfLines={3}
            >
              {seminar.name}
            </Animated.Text>

            {seminar.speaker && (
              <Animated.View
                entering={FadeInUp.delay(200).duration(400)}
                style={styles.speakerInfo}
              >
                <Pressable
                  style={styles.speakerButton}
                  onPress={() => router.push(`/speaker/${seminar.speaker?.id}`)}
                >
                  {seminar.speaker.photo_url ? (
                    <Image
                      source={{ uri: seminar.speaker.photo_url }}
                      style={styles.speakerAvatar}
                    />
                  ) : (
                    <View style={[styles.speakerAvatar, styles.speakerAvatarPlaceholder]}>
                      <User size={16} color="#FFFFFF" />
                    </View>
                  )}
                  <Text style={styles.speakerName}>{seminar.speaker.name}</Text>
                  <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Stats & Actions */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400).springify()}
          style={styles.statsContainer}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Music size={18} color={colors.primary[500]} />
              <Text style={[styles.statValue, { color: themeColors.text }]}>
                {sermons.length}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                predications
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />

            <View style={styles.statItem}>
              <Clock size={18} color={colors.primary[500]} />
              <Text style={[styles.statValue, { color: themeColors.text }]}>
                {getTotalDuration()}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                duree totale
              </Text>
            </View>

            {seminar.start_date && (
              <>
                <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
                <View style={styles.statItem}>
                  <Calendar size={18} color={colors.primary[500]} />
                  <Text style={[styles.statValue, { color: themeColors.text }]} numberOfLines={1}>
                    {formatDate(seminar.start_date)}
                  </Text>
                  <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                    debut
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Play All Button */}
          {sermons.length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.playAllButton,
                { opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handlePlayAll}
            >
              <LinearGradient
                colors={colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.playAllGradient}
              >
                <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.playAllText}>Ecouter tout</Text>
              </LinearGradient>
            </Pressable>
          )}
        </Animated.View>

        {/* Description */}
        {seminar.description && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400).springify()}
            style={styles.descriptionContainer}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              A propos
            </Text>
            <Text style={[styles.description, { color: themeColors.textSecondary }]}>
              {seminar.description}
            </Text>
          </Animated.View>
        )}

        {/* Sermons List */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400).springify()}
          style={styles.sermonsContainer}
        >
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Predications ({sermons.length})
          </Text>

          {sermons.map((sermon, index) => (
            <Animated.View
              key={sermon.id}
              entering={FadeInDown.delay(350 + index * 50).duration(400).springify()}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.sermonItem,
                  {
                    backgroundColor: themeColors.card,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
                onPress={() => handlePlaySermon(sermon, index)}
              >
                {/* Number Badge */}
                <View style={[styles.numberBadge, { backgroundColor: colors.primary[500] + '20' }]}>
                  <Text style={[styles.numberText, { color: colors.primary[500] }]}>
                    {index + 1}
                  </Text>
                </View>

                {/* Sermon Info */}
                <View style={styles.sermonInfo}>
                  <Text
                    style={[styles.sermonTitle, { color: themeColors.text }]}
                    numberOfLines={2}
                  >
                    {sermon.title}
                  </Text>
                  <View style={styles.sermonMeta}>
                    {sermon.date && (
                      <Text style={[styles.sermonDate, { color: themeColors.textTertiary }]}>
                        {formatDate(sermon.date)}
                      </Text>
                    )}
                    {sermon.duration_seconds && (
                      <>
                        <Text style={[styles.metaDot, { color: themeColors.textTertiary }]}>
                          •
                        </Text>
                        <Text style={[styles.sermonDuration, { color: themeColors.textTertiary }]}>
                          {formatDuration(sermon.duration_seconds)}
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.sermonActions}>
                  <Pressable
                    style={styles.favoriteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleAddToPlaylist(sermon);
                    }}
                  >
                    <ListPlus size={18} color={themeColors.textTertiary} />
                  </Pressable>
                  <Pressable
                    style={styles.favoriteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFavorite(sermon.id);
                    }}
                  >
                    <Heart
                      size={18}
                      color={isFavorite(sermon.id) ? colors.accent.red : themeColors.textTertiary}
                      fill={isFavorite(sermon.id) ? colors.accent.red : 'transparent'}
                    />
                  </Pressable>
                  <View style={[styles.playIcon, { backgroundColor: colors.primary[500] }]}>
                    <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Bottom Padding */}
        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        visible={playlistModalVisible}
        onClose={() => {
          setPlaylistModalVisible(false);
          setSelectedSermon(null);
        }}
        sermonId={selectedSermon?.id || ''}
        sermonTitle={selectedSermon?.title}
      />

      {/* Add Sermons to Seminar Modal */}
      <AddSermonsToSeminarModal
        visible={addSermonsModalVisible}
        onClose={() => setAddSermonsModalVisible(false)}
        seminarId={id || ''}
        seminarName={seminar?.name}
        currentSermonIds={sermons.map(s => s.id)}
        onSermonsUpdated={loadSeminar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[4],
  },
  errorText: {
    ...typography.bodyLarge,
  },
  backButtonAlt: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    marginTop: spacing[4],
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroContainer: {
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  backButton: {
    position: 'absolute',
    left: spacing[4],
    zIndex: 10,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    right: spacing[4],
    zIndex: 10,
  },
  addButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
  },
  seminarName: {
    ...typography.headlineMedium,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing[2],
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  speakerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  speakerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  speakerAvatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerName: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  statsContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...typography.titleMedium,
    fontWeight: '700',
    marginTop: spacing[1],
  },
  statLabel: {
    ...typography.labelSmall,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  playAllButton: {
    marginBottom: spacing[4],
  },
  playAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
  },
  playAllText: {
    color: '#FFFFFF',
    ...typography.titleSmall,
    fontWeight: '600',
  },
  descriptionContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  sectionTitle: {
    ...typography.titleMedium,
    fontWeight: '700',
    marginBottom: spacing[3],
  },
  description: {
    ...typography.bodyMedium,
    lineHeight: 24,
  },
  sermonsContainer: {
    paddingHorizontal: spacing[4],
  },
  sermonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  numberText: {
    ...typography.titleSmall,
    fontWeight: '700',
  },
  sermonInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  sermonTitle: {
    ...typography.titleSmall,
    fontWeight: '600',
    marginBottom: 4,
  },
  sermonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sermonDate: {
    ...typography.labelSmall,
  },
  metaDot: {
    marginHorizontal: spacing[1],
  },
  sermonDuration: {
    ...typography.labelSmall,
  },
  sermonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  favoriteButton: {
    padding: spacing[2],
  },
  playIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
