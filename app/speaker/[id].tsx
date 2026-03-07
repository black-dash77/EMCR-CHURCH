import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';

import { useNavigationLock } from '@/hooks/useNavigationLock';
import { useSpeakerWithSermons } from '@/hooks/queries/useSpeakers';
import { queryClient } from '@/lib/queryClient';
import {
  ChevronLeft,
  User,
  Play,
  Clock,
  Calendar,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from 'lucide-react-native';
import React, { useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
  Linking,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/TabBarBackground';
import { useAudioStore } from '@/stores/useAudioStore';
import { colors, typography, spacing, borderRadius, ThemeColors } from '@/theme';
import type { Sermon } from '@/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SpeakerDetailScreen() {
  const { navigateTo, router } = useNavigationLock();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const { data, isLoading: loading, isRefetching: refreshing } = useSpeakerWithSermons(id || '');
  const speaker = data?.speaker ?? null;
  const sermons = data?.sermons ?? [];
  const hasAnimated = useRef(false);

  const { setQueue } = useAudioStore();

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['speakers', 'detail', id] });
  }, [id]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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

  const openSocialLink = (url: string) => {
    if (url.startsWith('https://') || url.startsWith('http://')) Linking.openURL(url);
  };

  // Mémoriser le header pour éviter les re-animations
  const headerComponent = useMemo(() => (
    <View>
      {/* Hero Section */}
      <View style={[styles.heroSection, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#000000', '#0a0a0a', '#000000']}
          style={StyleSheet.absoluteFill}
        />

        {/* Back Button */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </Pressable>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {speaker?.photo_url ? (
            <Image source={{ uri: speaker.photo_url }} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <User size={48} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Name & Ministry */}
        <Text style={styles.speakerName}>{speaker?.name}</Text>
        {speaker?.ministry && (
          <Text style={styles.speakerMinistry}>{speaker.ministry}</Text>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sermons.length}</Text>
            <Text style={styles.statLabel}>Predications</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{getTotalDuration()}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Social Links */}
        {speaker?.social_links && Object.keys(speaker.social_links).length > 0 && (
          <View style={styles.socialLinks}>
            {speaker.social_links.facebook && (
              <Pressable
                style={styles.socialButton}
                onPress={() => openSocialLink(speaker.social_links!.facebook!)}
              >
                <Facebook size={20} color="#FFFFFF" />
              </Pressable>
            )}
            {speaker.social_links.instagram && (
              <Pressable
                style={styles.socialButton}
                onPress={() => openSocialLink(speaker.social_links!.instagram!)}
              >
                <Instagram size={20} color="#FFFFFF" />
              </Pressable>
            )}
            {speaker.social_links.twitter && (
              <Pressable
                style={styles.socialButton}
                onPress={() => openSocialLink(speaker.social_links!.twitter!)}
              >
                <Twitter size={20} color="#FFFFFF" />
              </Pressable>
            )}
            {speaker.social_links.youtube && (
              <Pressable
                style={styles.socialButton}
                onPress={() => openSocialLink(speaker.social_links!.youtube!)}
              >
                <Youtube size={20} color="#FFFFFF" />
              </Pressable>
            )}
            {speaker.social_links.website && (
              <Pressable
                style={styles.socialButton}
                onPress={() => openSocialLink(speaker.social_links!.website!)}
              >
                <Globe size={20} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Bio Section */}
      {speaker?.bio && (
        <View style={[styles.bioSection, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Biographie
          </Text>
          <Text style={[styles.bioText, { color: themeColors.textSecondary }]}>
            {speaker.bio}
          </Text>
        </View>
      )}

      {/* Sermons Section Header */}
      <View style={styles.sermonsHeader}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Predications ({sermons.length})
        </Text>
        {sermons.length > 0 && (
          <Pressable
            style={[styles.playAllButton, { backgroundColor: colors.primary[500] }]}
            onPress={() => {
              const audioSermons = sermons.filter(s => s.audio_url);
              if (audioSermons.length === 0) {
                if (sermons.length > 0) navigateTo(`/sermon/${sermons[0].id}`);
                return;
              }
              setQueue(audioSermons, 0);
            }}
          >
            <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.playAllText}>Tout ecouter</Text>
          </Pressable>
        )}
      </View>
    </View>
  ), [speaker, sermons, themeColors, insets.top, router, setQueue]);

  const renderSermon = useCallback(({ item, index }: { item: Sermon; index: number }) => (
    <SermonItem
      sermon={item}
      index={index}
      themeColors={themeColors}
      formatDate={formatDate}
      formatDuration={formatDuration}
      onPress={() => {
        if (!item.audio_url && (item.youtube_url || item.video_url)) {
          navigateTo(`/sermon/${item.id}`);
          return;
        }
        if (!item.audio_url) {
          navigateTo(`/sermon/${item.id}`);
          return;
        }
        const audioSermons = sermons.filter(s => s.audio_url);
        const audioIndex = audioSermons.findIndex(s => s.id === item.id);
        setQueue(audioSermons, audioIndex >= 0 ? audioIndex : 0);
      }}
      shouldAnimate={!hasAnimated.current}
    />
  ), [themeColors, sermons, setQueue, router]);

  // Marquer que les animations ont été jouées après le premier rendu
  useEffect(() => {
    if (!loading && speaker) {
      const timer = setTimeout(() => {
        hasAnimated.current = true;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, speaker]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          Chargement...
        </Text>
      </View>
    );
  }

  if (!speaker) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          Orateur non trouve
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary[500], marginTop: spacing[4] }}>
            Retour
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <FlashList
        data={sermons}
        renderItem={renderSermon}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: TAB_BAR_HEIGHT + 60 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={
          <View style={styles.emptySermons}>
            <Text style={[styles.emptySermonsText, { color: themeColors.textSecondary }]}>
              Aucune predication disponible
            </Text>
          </View>
        }
      />
    </View>
  );
}

const SermonItem = memo(function SermonItem({
  sermon,
  index,
  themeColors,
  formatDate,
  formatDuration,
  onPress,
  shouldAnimate,
}: {
  sermon: Sermon;
  index: number;
  themeColors: ThemeColors;
  formatDate: (date: string) => string;
  formatDuration: (seconds: number | null) => string;
  onPress: () => void;
  shouldAnimate: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <AnimatedPressable
      style={[
        styles.sermonItem,
        { backgroundColor: themeColors.card },
        animatedStyle,
      ]}
      onPressIn={() => { scale.value = withSpring(0.98); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
    >
      <View style={styles.sermonCover}>
        {sermon.cover_image ? (
          <Image source={{ uri: sermon.cover_image }} style={styles.sermonImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
        ) : (
          <LinearGradient
            colors={colors.gradients.primary}
            style={styles.sermonImage}
          />
        )}
        <View style={styles.playOverlay}>
          <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
        </View>
      </View>

      <View style={styles.sermonInfo}>
        <Text
          style={[styles.sermonTitle, { color: themeColors.text }]}
          numberOfLines={2}
        >
          {sermon.title}
        </Text>

        <View style={styles.sermonMeta}>
          <View style={styles.metaItem}>
            <Calendar size={12} color={themeColors.textTertiary} />
            <Text style={[styles.metaText, { color: themeColors.textTertiary }]}>
              {formatDate(sermon.date)}
            </Text>
          </View>
          {sermon.duration_seconds && (
            <View style={styles.metaItem}>
              <Clock size={12} color={themeColors.textTertiary} />
              <Text style={[styles.metaText, { color: themeColors.textTertiary }]}>
                {formatDuration(sermon.duration_seconds)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );

  // Animer seulement au premier rendu
  if (shouldAnimate) {
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(400).springify()}>
        {content}
      </Animated.View>
    );
  }

  return <View>{content}</View>;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
  },
  heroSection: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: spacing[4],
    padding: spacing[2],
    zIndex: 10,
  },
  avatarContainer: {
    marginTop: spacing[8],
    marginBottom: spacing[4],
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerName: {
    ...typography.headlineMedium,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  speakerMinistry: {
    ...typography.bodyMedium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing[1],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[5],
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.xl,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  statValue: {
    ...typography.titleMedium,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    ...typography.labelSmall,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: spacing[1],
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bioSection: {
    padding: spacing[4],
    marginHorizontal: spacing[4],
    marginTop: -spacing[4],
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  bioText: {
    ...typography.bodyMedium,
    lineHeight: 24,
  },
  sermonsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.full,
  },
  playAllText: {
    ...typography.labelMedium,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing[4],
  },
  sermonItem: {
    flexDirection: 'row',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[3],
    alignItems: 'center',
  },
  sermonCover: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  sermonImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sermonInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  sermonTitle: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  sermonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[2],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    ...typography.labelSmall,
  },
  emptySermons: {
    paddingVertical: spacing[8],
    alignItems: 'center',
  },
  emptySermonsText: {
    ...typography.bodyMedium,
  },
});
