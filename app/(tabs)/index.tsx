import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { useNavigationLock } from '@/hooks/useNavigationLock';
import {
  Play,
  Pause,
  ChevronRight,
  Clock,
  MapPin,
  Headphones,
  ImageIcon,
  Megaphone,
  AlertCircle,
  Wifi,
  Video,
} from 'lucide-react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sermonsApi, eventsApi, announcementsApi } from '@/services/api';
import { useAudioStore } from '@/stores/useAudioStore';
import { useUserStore } from '@/stores/useUserStore';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Sermon, Event, Announcement } from '@/types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { navigateTo, router } = useNavigationLock();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [latestSermons, setLatestSermons] = useState<Sermon[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);

  const { currentSermon, isPlaying, playSermon, togglePlayPause, setQueue } = useAudioStore();
  const { firstName } = useUserStore();

  const fetchData = useCallback(async () => {
    try {
      const [sermons, events, announcements] = await Promise.all([
        sermonsApi.getLatest(6),
        eventsApi.getUpcoming(2),
        announcementsApi.getLatest(1),
      ]);
      setLatestSermons(sermons);
      setUpcomingEvents(events);
      setLatestAnnouncement(announcements[0] || null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Filter sermons by type
  const sermonsByType = useMemo(() => {
    const sermons = latestSermons.filter(s => !s.content_type || s.content_type === 'sermon');
    const adorations = latestSermons.filter(s => s.content_type === 'adoration');
    const louanges = latestSermons.filter(s => s.content_type === 'louange');
    return { sermons, adorations, louanges };
  }, [latestSermons]);

  const featuredSermon = sermonsByType.sermons[0] || latestSermons[0];
  const recentSermons = sermonsByType.sermons.slice(1, 6);
  const latestAdoration = sermonsByType.adorations[0];
  const latestLouange = sermonsByType.louanges[0];
  const nextEvent = upcomingEvents[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const handlePlayFeatured = async () => {
    if (!featuredSermon) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // If sermon has YouTube or video but no audio, navigate to detail page
    if (!featuredSermon.audio_url && (featuredSermon.youtube_url || featuredSermon.video_url)) {
      navigateTo(`/sermon/${featuredSermon.id}`);
      return;
    }

    // If sermon has YouTube, navigate to detail page for embedded player
    if (featuredSermon.youtube_url) {
      navigateTo(`/sermon/${featuredSermon.id}`);
      return;
    }

    if (currentSermon?.id === featuredSermon.id) {
      await togglePlayPause();
      router.push('/player');
    } else {
      await playSermon(featuredSermon);
      router.push('/player');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      return `${hrs}h${mins % 60 > 0 ? ` ${mins % 60}min` : ''}`;
    }
    return `${mins} min`;
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Demain';
    if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'long' });
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const isFeaturedPlaying = currentSermon?.id === featuredSermon?.id && isPlaying;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: themeColors.textSecondary }]}>
              {getGreeting()}{firstName ? `, ${firstName}` : ''}
            </Text>
            <Text style={[styles.churchName, { color: themeColors.text }]}>
              EMCR Church
            </Text>
          </View>
        </Animated.View>

        {/* Page Title */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.pageTitleContainer}>
          <Text style={[styles.pageTitle, { color: themeColors.text }]}>
            Prédications
          </Text>
        </Animated.View>

        {/* Empty State */}
        {!loading && !featuredSermon && latestSermons.length === 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: themeColors.card }]}>
              <Wifi size={40} color={themeColors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              Bienvenue sur EMCR Church
            </Text>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Les predications et evenements apparaitront ici des qu'ils seront disponibles.
            </Text>
            <Pressable
              style={[styles.emptyButton, { backgroundColor: colors.primary[500] }]}
              onPress={onRefresh}
            >
              <Text style={styles.emptyButtonText}>Actualiser</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Featured Sermon */}
        {featuredSermon && (
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.featuredSection}>
            <Pressable
              style={({ pressed }) => [
                styles.featuredCard,
                { opacity: pressed ? 0.95 : 1 },
              ]}
              onPress={() => router.push(`/sermon/${featuredSermon.id}`)}
            >
              <View style={styles.featuredImageContainer}>
                {featuredSermon.cover_image ? (
                  <Image
                    source={{ uri: featuredSermon.cover_image }}
                    style={styles.featuredImage}
                  />
                ) : (
                  <LinearGradient
                    colors={[colors.primary[400], colors.primary[700]]}
                    style={styles.featuredImage}
                  />
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.featuredGradient}
                />

                {/* Play Button */}
                <Pressable
                  style={[styles.featuredPlayButton, { backgroundColor: colors.primary[500] }]}
                  onPress={handlePlayFeatured}
                >
                  {isFeaturedPlaying ? (
                    <Pause size={28} color="#FFFFFF" fill="#FFFFFF" />
                  ) : (
                    <Play size={28} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
                  )}
                </Pressable>

                {/* Content overlay */}
                <View style={styles.featuredContent}>
                  <View style={styles.featuredBadge}>
                    {featuredSermon.youtube_url ? (
                      <Video size={12} color="#FF0000" />
                    ) : !featuredSermon.audio_url && featuredSermon.video_url ? (
                      <Video size={12} color={colors.primary[400]} />
                    ) : (
                      <Headphones size={12} color={colors.primary[400]} />
                    )}
                    <Text style={[
                      styles.featuredBadgeText,
                      featuredSermon.youtube_url && { color: '#FF0000' }
                    ]}>
                      {featuredSermon.youtube_url ? 'YouTube' : !featuredSermon.audio_url && featuredSermon.video_url ? 'Vidéo' : 'Dernière prédication'}
                    </Text>
                  </View>
                  <Text style={styles.featuredTitle} numberOfLines={2}>
                    {featuredSermon.title}
                  </Text>
                  <View style={styles.featuredMeta}>
                    <Text style={styles.featuredSpeaker}>{featuredSermon.speaker}</Text>
                    {featuredSermon.duration_seconds && (
                      <>
                        <View style={styles.metaDot} />
                        <Text style={styles.featuredDuration}>
                          {formatDuration(featuredSermon.duration_seconds)}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Latest Announcement */}
        {latestAnnouncement && (
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Dernière annonce
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/announcements')}
                hitSlop={8}
              >
                <Text style={[styles.seeAll, { color: colors.primary[500] }]}>
                  Tout voir
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.announcementCard,
                {
                  backgroundColor: latestAnnouncement.urgent
                    ? isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'
                    : themeColors.card,
                  borderColor: latestAnnouncement.urgent ? '#ef4444' : 'transparent',
                  borderWidth: latestAnnouncement.urgent ? 1 : 0,
                  opacity: pressed ? 0.95 : 1,
                },
              ]}
              onPress={() => router.push('/(tabs)/announcements')}
            >
              {/* Image ou icône */}
              <View style={styles.announcementImageContainer}>
                {latestAnnouncement.image ? (
                  <Image source={{ uri: latestAnnouncement.image }} style={styles.announcementImage} />
                ) : (
                  <LinearGradient
                    colors={latestAnnouncement.urgent
                      ? ['#ef4444', '#dc2626']
                      : colors.gradients.primarySoft
                    }
                    style={styles.announcementImage}
                  >
                    {latestAnnouncement.urgent ? (
                      <AlertCircle size={24} color="rgba(255,255,255,0.9)" />
                    ) : (
                      <Megaphone size={24} color="rgba(255,255,255,0.7)" />
                    )}
                  </LinearGradient>
                )}
              </View>

              {/* Contenu */}
              <View style={styles.announcementContent}>
                {latestAnnouncement.urgent && (
                  <View style={styles.urgentBadge}>
                    <AlertCircle size={10} color="#FFFFFF" />
                    <Text style={styles.urgentBadgeText}>Urgent</Text>
                  </View>
                )}
                <Text
                  style={[styles.announcementTitle, { color: themeColors.text }]}
                  numberOfLines={2}
                >
                  {latestAnnouncement.title}
                </Text>
                {latestAnnouncement.description && (
                  <Text
                    style={[styles.announcementDescription, { color: themeColors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {latestAnnouncement.description}
                  </Text>
                )}
                <Text style={[styles.announcementDate, { color: themeColors.textTertiary }]}>
                  {new Date(latestAnnouncement.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                  })}
                </Text>
              </View>

              <ChevronRight size={20} color={themeColors.textTertiary} />
            </Pressable>
          </Animated.View>
        )}

        {/* Recent Sermons */}
        {recentSermons.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Prédications récentes
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/sermons')}
                hitSlop={8}
              >
                <Text style={[styles.seeAll, { color: colors.primary[500] }]}>
                  Tout voir
                </Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sermonsScroll}
            >
              {recentSermons.map((sermon) => (
                <Pressable
                  key={sermon.id}
                  style={({ pressed }) => [
                    styles.sermonCard,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    // If sermon has YouTube or video but no audio, go to detail page
                    if (!sermon.audio_url && (sermon.youtube_url || sermon.video_url)) {
                      navigateTo(`/sermon/${sermon.id}`);
                    } else if (sermon.audio_url) {
                      // Play the clicked sermon directly
                      playSermon(sermon);
                      router.push('/player');
                    } else {
                      // No media at all, just go to detail page
                      navigateTo(`/sermon/${sermon.id}`);
                    }
                  }}
                >
                  <View style={styles.sermonImageContainer}>
                    {sermon.cover_image ? (
                      <Image source={{ uri: sermon.cover_image }} style={styles.sermonImage} />
                    ) : (
                      <LinearGradient
                        colors={[colors.primary[300], colors.primary[600]]}
                        style={styles.sermonImage}
                      />
                    )}
                    <View style={[
                      styles.sermonPlayIcon,
                      sermon.youtube_url && { backgroundColor: '#FF0000' }
                    ]}>
                      {sermon.youtube_url ? (
                        <Video size={14} color="#FFFFFF" />
                      ) : (
                        <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                      )}
                    </View>
                  </View>
                  <Text style={[styles.sermonTitle, { color: themeColors.text }]} numberOfLines={2}>
                    {sermon.title}
                  </Text>
                  <Text style={[styles.sermonSpeaker, { color: themeColors.textSecondary }]} numberOfLines={1}>
                    {sermon.speaker}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Adoration & Louange Section */}
        {(latestAdoration || latestLouange) && (
          <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                {latestAdoration && latestLouange
                  ? 'Adorations & Louanges'
                  : latestAdoration
                    ? 'Adorations'
                    : 'Louanges'}
              </Text>
              <Pressable
                onPress={() => router.push('/worship')}
                hitSlop={8}
              >
                <Text style={[styles.seeAll, { color: colors.primary[500] }]}>
                  Voir tout
                </Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sermonsScroll}
            >
              {/* Latest Adoration */}
              {latestAdoration && (
                <Pressable
                  style={({ pressed }) => [
                    styles.sermonCard,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (latestAdoration.audio_url) {
                      playSermon(latestAdoration);
                      router.push('/player');
                    } else {
                      navigateTo(`/sermon/${latestAdoration.id}`);
                    }
                  }}
                >
                  <View style={styles.sermonImageContainer}>
                    {latestAdoration.cover_image ? (
                      <Image source={{ uri: latestAdoration.cover_image }} style={styles.sermonImage} />
                    ) : (
                      <LinearGradient
                        colors={['#EC4899', '#BE185D']}
                        style={styles.sermonImage}
                      />
                    )}
                    <View style={styles.sermonPlayIcon}>
                      <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={[styles.sermonTitle, { color: themeColors.text }]} numberOfLines={2}>
                    {latestAdoration.title}
                  </Text>
                  <Text style={[styles.sermonSpeaker, { color: themeColors.textSecondary }]} numberOfLines={1}>
                    {latestAdoration.speaker}
                  </Text>
                </Pressable>
              )}

              {/* Latest Louange */}
              {latestLouange && (
                <Pressable
                  style={({ pressed }) => [
                    styles.sermonCard,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (latestLouange.audio_url) {
                      playSermon(latestLouange);
                      router.push('/player');
                    } else {
                      navigateTo(`/sermon/${latestLouange.id}`);
                    }
                  }}
                >
                  <View style={styles.sermonImageContainer}>
                    {latestLouange.cover_image ? (
                      <Image source={{ uri: latestLouange.cover_image }} style={styles.sermonImage} />
                    ) : (
                      <LinearGradient
                        colors={['#8B5CF6', '#6D28D9']}
                        style={styles.sermonImage}
                      />
                    )}
                    <View style={styles.sermonPlayIcon}>
                      <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={[styles.sermonTitle, { color: themeColors.text }]} numberOfLines={2}>
                    {latestLouange.title}
                  </Text>
                  <Text style={[styles.sermonSpeaker, { color: themeColors.textSecondary }]} numberOfLines={1}>
                    {latestLouange.speaker}
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </Animated.View>
        )}

        {/* Next Event */}
        {nextEvent && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Prochain événement
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/events')}
                hitSlop={8}
              >
                <Text style={[styles.seeAll, { color: colors.primary[500] }]}>
                  Calendrier
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.eventCard,
                { backgroundColor: themeColors.card, opacity: pressed ? 0.95 : 1 },
              ]}
              onPress={() => router.push(`/event/${nextEvent.id}`)}
            >
              {/* Thumbnail avec date en overlay */}
              <View style={styles.eventThumbnailContainer}>
                {nextEvent.image ? (
                  <Image source={{ uri: nextEvent.image }} style={styles.eventThumbnail} />
                ) : (
                  <LinearGradient
                    colors={colors.gradients.primarySoft}
                    style={styles.eventThumbnail}
                  >
                    <ImageIcon size={24} color="rgba(255,255,255,0.7)" />
                  </LinearGradient>
                )}
                <View style={styles.eventDateBadge}>
                  <Text style={styles.eventDateDay}>
                    {new Date(nextEvent.date).getDate()}
                  </Text>
                  <Text style={styles.eventDateMonth}>
                    {new Date(nextEvent.date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.eventContent}>
                <Text style={[styles.eventWhen, { color: colors.primary[500] }]}>
                  {formatEventDate(nextEvent.date)}
                </Text>
                <Text style={[styles.eventTitle, { color: themeColors.text }]} numberOfLines={1}>
                  {nextEvent.title}
                </Text>
                <View style={styles.eventMeta}>
                  {nextEvent.time && (
                    <View style={styles.eventMetaItem}>
                      <Clock size={13} color={themeColors.textTertiary} />
                      <Text style={[styles.eventMetaText, { color: themeColors.textSecondary }]}>
                        {nextEvent.time}
                      </Text>
                    </View>
                  )}
                  {nextEvent.location && (
                    <View style={styles.eventMetaItem}>
                      <MapPin size={13} color={themeColors.textTertiary} />
                      <Text style={[styles.eventMetaText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                        {nextEvent.location}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <ChevronRight size={20} color={themeColors.textTertiary} />
            </Pressable>

            {/* Second event if exists */}
            {upcomingEvents[1] && (
              <Pressable
                style={({ pressed }) => [
                  styles.eventCard,
                  styles.eventCardSecondary,
                  { backgroundColor: themeColors.card, opacity: pressed ? 0.95 : 1 },
                ]}
                onPress={() => router.push(`/event/${upcomingEvents[1].id}`)}
              >
                {/* Thumbnail avec date en overlay */}
                <View style={styles.eventThumbnailContainerSmall}>
                  {upcomingEvents[1].image ? (
                    <Image source={{ uri: upcomingEvents[1].image }} style={styles.eventThumbnail} />
                  ) : (
                    <LinearGradient
                      colors={colors.gradients.primarySoft}
                      style={styles.eventThumbnail}
                    >
                      <ImageIcon size={18} color="rgba(255,255,255,0.7)" />
                    </LinearGradient>
                  )}
                  <View style={styles.eventDateBadgeSmall}>
                    <Text style={styles.eventDateDaySmall}>
                      {new Date(upcomingEvents[1].date).getDate()}
                    </Text>
                    <Text style={styles.eventDateMonthSmall}>
                      {new Date(upcomingEvents[1].date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.eventContent}>
                  <Text style={[styles.eventTitle, styles.eventTitleSmall, { color: themeColors.text }]} numberOfLines={1}>
                    {upcomingEvents[1].title}
                  </Text>
                  <Text style={[styles.eventMetaText, { color: themeColors.textSecondary }]}>
                    {formatEventDate(upcomingEvents[1].date)}
                    {upcomingEvents[1].time && ` • ${upcomingEvents[1].time}`}
                  </Text>
                </View>

                <ChevronRight size={18} color={themeColors.textTertiary} />
              </Pressable>
            )}
          </Animated.View>
        )}

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
  },
  greeting: {
    ...typography.bodyMedium,
    marginBottom: 2,
  },
  churchName: {
    ...typography.headlineSmall,
    fontWeight: '600',
    letterSpacing: -0.5,
  },

  // Page Title
  pageTitleContainer: {
    paddingHorizontal: spacing[5],
    marginBottom: spacing[4],
  },
  pageTitle: {
    ...typography.headlineLarge,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Featured
  featuredSection: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[6],
  },
  featuredCard: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.6)',
  },
  featuredImageContainer: {
    width: '100%',
    aspectRatio: 16 / 10,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredPlayButton: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[5],
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    marginBottom: spacing[2],
  },
  featuredBadgeText: {
    ...typography.labelSmall,
    color: colors.primary[400],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuredTitle: {
    ...typography.headlineSmall,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: spacing[2],
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredSpeaker: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: spacing[2],
  },
  featuredDuration: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Section
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  seeAll: {
    ...typography.labelLarge,
    fontWeight: '600',
  },

  // Sermons
  sermonsScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  sermonCard: {
    width: 140,
  },
  sermonImageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  sermonImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
  },
  sermonPlayIcon: {
    position: 'absolute',
    bottom: spacing[2],
    right: spacing[2],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sermonTitle: {
    ...typography.labelLarge,
    fontWeight: '500',
    marginTop: spacing[2],
    paddingHorizontal: spacing[1],
  },
  sermonSpeaker: {
    ...typography.labelSmall,
    marginTop: 2,
    paddingHorizontal: spacing[1],
    paddingBottom: spacing[2],
  },

  // Events
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[4],
    padding: spacing[3],
    borderRadius: borderRadius['2xl'],
    gap: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.6)',
  },
  eventCardSecondary: {
    marginTop: spacing[3],
    paddingVertical: spacing[3],
  },
  eventThumbnailContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  eventThumbnailContainerSmall: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  eventThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDateBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  eventDateBadgeSmall: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  eventDateDay: {
    ...typography.labelMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 16,
  },
  eventDateDaySmall: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 14,
  },
  eventDateMonth: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  eventDateMonthSmall: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  eventContent: {
    flex: 1,
  },
  eventWhen: {
    ...typography.labelSmall,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventTitle: {
    ...typography.titleSmall,
    fontWeight: '500',
    marginBottom: spacing[1],
  },
  eventTitleSmall: {
    ...typography.bodyMedium,
    fontWeight: '500',
    marginBottom: 2,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  eventMetaText: {
    ...typography.labelSmall,
  },

  // Announcements
  announcementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[4],
    padding: spacing[4],
    borderRadius: borderRadius['2xl'],
    gap: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.6)',
  },
  announcementImageContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  announcementImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    ...typography.titleSmall,
    fontWeight: '500',
    marginBottom: spacing[1],
  },
  announcementDescription: {
    ...typography.bodySmall,
    marginBottom: spacing[1],
  },
  announcementDate: {
    ...typography.labelSmall,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ef4444',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
    marginBottom: spacing[1],
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[16],
    gap: spacing[3],
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  emptyTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    ...typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
  },
  emptyButtonText: {
    ...typography.labelLarge,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
