import { LinearGradient } from 'expo-linear-gradient';

import { useNavigationLock } from '@/hooks/useNavigationLock';
import { ChevronLeft, Music, Play, Clock, Video } from 'lucide-react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Pressable,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TransparentHeaderBackground, HEADER_HEIGHT } from '@/components/TransparentHeaderBackground';
import { sermonsApi } from '@/services/api';
import { useCurrentSermon, useAudioActions } from '@/stores/useAudioStore';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Sermon } from '@/types';

export default function WorshipScreen() {
  const { navigateTo, router } = useNavigationLock();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [allSermons, setAllSermons] = useState<Sermon[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'adoration' | 'louange'>('all');
  const currentSermon = useCurrentSermon();
  const { playSermon, setQueue } = useAudioActions();

  const fetchSermons = useCallback(async () => {
    try {
      const data = await sermonsApi.getAll();
      setAllSermons(data);
    } catch (error) {
      console.error('Error fetching sermons:', error);
    }
  }, []);

  useEffect(() => {
    fetchSermons();
  }, [fetchSermons]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSermons();
    setRefreshing(false);
  }, [fetchSermons]);

  // Filter worship content
  const worshipSermons = useMemo(() => {
    const worship = allSermons.filter(
      s => s.content_type === 'adoration' || s.content_type === 'louange'
    );
    if (activeTab === 'all') return worship;
    return worship.filter(s => s.content_type === activeTab);
  }, [allSermons, activeTab]);

  const adorationCount = useMemo(() =>
    allSermons.filter(s => s.content_type === 'adoration').length,
    [allSermons]
  );

  const louangeCount = useMemo(() =>
    allSermons.filter(s => s.content_type === 'louange').length,
    [allSermons]
  );

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    });
  };

  const handlePlaySermon = (item: Sermon, index: number) => {
    if (!item.audio_url && (item.youtube_url || item.video_url)) {
      navigateTo(`/sermon/${item.id}`);
    } else if (item.audio_url) {
      const audioSermons = worshipSermons.filter(s => s.audio_url);
      const audioIndex = audioSermons.findIndex(s => s.id === item.id);
      setQueue(audioSermons, audioIndex >= 0 ? audioIndex : 0);
    } else {
      navigateTo(`/sermon/${item.id}`);
    }
  };

  const renderSermon = ({ item, index }: { item: Sermon; index: number }) => {
    const isCurrentSermon = currentSermon?.id === item.id;
    const isAdoration = item.content_type === 'adoration';
    const typeColor = isAdoration ? '#EC4899' : '#8B5CF6';

    return (
      <Pressable
        style={styles.sermonCard}
        onPress={() => navigateTo(`/sermon/${item.id}`)}
      >
        <View style={styles.sermonCover}>
          {item.cover_image ? (
            <Image source={{ uri: item.cover_image }} style={styles.sermonImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          ) : (
            <LinearGradient
              colors={isAdoration ? ['#EC4899', '#BE185D'] : ['#8B5CF6', '#6D28D9']}
              style={styles.sermonImage}
            />
          )}
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
            <Music size={10} color="#FFFFFF" />
            <Text style={styles.typeBadgeText}>
              {isAdoration ? 'Adoration' : 'Louange'}
            </Text>
          </View>
          {item.youtube_url && (
            <View style={styles.playIcon}>
              <Video size={14} color="#FFFFFF" />
            </View>
          )}
        </View>

        <Text
          style={[
            styles.sermonTitle,
            { color: isCurrentSermon ? colors.primary[500] : themeColors.text },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.sermonSpeaker, { color: themeColors.textSecondary }]}
          numberOfLines={1}
        >
          {item.speaker}
        </Text>
      </Pressable>
    );
  };

  const headerTotalHeight = HEADER_HEIGHT + insets.top + 20;

  const ListHeaderComponent = (
    <View style={{ paddingTop: headerTotalHeight }}>
      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[
            styles.tab,
            { backgroundColor: themeColors.card },
            activeTab === 'all' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[
            styles.tabText,
            { color: themeColors.text },
            activeTab === 'all' && styles.tabTextActive,
          ]}>
            Tout ({adorationCount + louangeCount})
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            { backgroundColor: themeColors.card },
            activeTab === 'adoration' && { backgroundColor: '#EC4899' },
          ]}
          onPress={() => setActiveTab('adoration')}
        >
          <Text style={[
            styles.tabText,
            { color: themeColors.text },
            activeTab === 'adoration' && { color: '#FFFFFF' },
          ]}>
            Adoration ({adorationCount})
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            { backgroundColor: themeColors.card },
            activeTab === 'louange' && { backgroundColor: '#8B5CF6' },
          ]}
          onPress={() => setActiveTab('louange')}
        >
          <Text style={[
            styles.tabText,
            { color: themeColors.text },
            activeTab === 'louange' && { color: '#FFFFFF' },
          ]}>
            Louange ({louangeCount})
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <FlashList
        data={worshipSermons}
        renderItem={renderSermon}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Music size={48} color={themeColors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              Aucun contenu
            </Text>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Les chants d'adoration et de louange apparaîtront ici
            </Text>
          </View>
        }
      />

      {/* Header Transparent avec gradient */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <TransparentHeaderBackground height={headerTotalHeight + 40} />

        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={28} color={themeColors.text} />
          </Pressable>

          <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.headerTitles}>
            <Text style={[styles.title, { color: themeColors.text }]}>Adoration & Louange</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              {worshipSermons.length} chant{worshipSermons.length > 1 ? 's' : ''}
            </Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitles: {
    flex: 1,
    marginLeft: spacing[2],
  },
  title: {
    ...typography.titleLarge,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    gap: spacing[2],
  },
  tab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  tabActive: {
    backgroundColor: colors.primary[500],
  },
  tabText: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sermonCard: {
    width: '48%',
  },
  sermonCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  sermonImage: {
    width: '100%',
    height: '100%',
  },
  typeBadge: {
    position: 'absolute',
    top: spacing[2],
    left: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  typeBadgeText: {
    ...typography.labelSmall,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 10,
  },
  playIcon: {
    position: 'absolute',
    bottom: spacing[2],
    right: spacing[2],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sermonTitle: {
    ...typography.labelLarge,
    fontWeight: '600',
    marginTop: spacing[2],
    paddingHorizontal: spacing[1],
  },
  sermonSpeaker: {
    ...typography.labelSmall,
    marginTop: 2,
    paddingHorizontal: spacing[1],
    paddingBottom: spacing[2],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[6],
  },
  emptyTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
    marginTop: spacing[4],
  },
  emptyText: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginTop: spacing[2],
  },
});
