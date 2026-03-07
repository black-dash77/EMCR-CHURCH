import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { useNavigationLock } from '@/hooks/useNavigationLock';
import {
  Search,
  Play,
  X,
  Heart,
  ListMusic,
  History,
  ChevronRight,
  Mic2,
  BookOpen,
  Shuffle,
  User,
  Plus,
  Headphones,
  Music,
  Video,
  WifiOff,
  Download,
  Clock,
  Calendar,
  Library,
} from 'lucide-react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
  TextInput,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddSermonsToSeminarModal } from '@/components/AddSermonsToSeminarModal';
import { TAB_BAR_HEIGHT } from '@/components/TabBarBackground';
import { useSermons } from '@/hooks/queries/useSermons';
import { useSpeakersWithCount } from '@/hooks/queries/useSpeakers';
import { useSeminarsWithCount } from '@/hooks/queries/useSeminars';
import { queryClient } from '@/lib/queryClient';
import { useAudioStore } from '@/stores/useAudioStore';
import { useUserStore } from '@/stores/useUserStore';
import { colors, typography, spacing, borderRadius, ThemeColors } from '@/theme';
import type { Sermon, Speaker, Seminar } from '@/types';

const { width } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const CARD_WIDTH = (width - spacing[4] * 2 - spacing[3]) / 2;

// Filter chips
const FILTER_CHIPS = [
  { id: 'all', label: 'Accueil' },
  { id: 'list', label: 'Toutes' },
  { id: 'favorites', label: 'Favoris' },
  { id: 'speakers', label: 'Orateurs' },
  { id: 'seminars', label: 'Séminaires' },
];

// Sort options for list view
const SORT_OPTIONS = [
  { id: 'recent', label: 'Plus récent' },
  { id: 'oldest', label: 'Plus ancien' },
  { id: 'speaker', label: 'Par orateur' },
  { id: 'duration', label: 'Par durée' },
];

export default function SermonsScreen() {
  const { navigateTo, router } = useNavigationLock();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const { data: sermons = [], isLoading: loading } = useSermons();
  const { data: speakers = [] } = useSpeakersWithCount();
  const { data: seminars = [] } = useSeminarsWithCount();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [addSermonsModalVisible, setAddSermonsModalVisible] = useState(false);
  const [selectedSeminar, setSelectedSeminar] = useState<Seminar | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  const { setQueue, currentSermon, isPlaying } = useAudioStore();
  const { favorites, playlists, history, getHistorySermons, getFavoriteSermons } = useUserStore();

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, []);

  // Filtered/computed data
  const recentSermons = useMemo(() => sermons.slice(0, 10), [sermons]);
  const favoriteSermons = useMemo(() => getFavoriteSermons(sermons), [sermons, favorites, getFavoriteSermons]);
  const historySermons = useMemo(() => getHistorySermons(sermons).slice(0, 10), [sermons, history, getHistorySermons]);
  const worshipSermons = useMemo(() =>
    sermons.filter(s => s.content_type === 'adoration' || s.content_type === 'louange'),
    [sermons]
  );

  const speakersWithSermons = useMemo(() => {
    return speakers.map(speaker => ({
      ...speaker,
      sermons: sermons.filter(s => s.speaker_id === speaker.id || s.speaker === speaker.name).slice(0, 5),
      sermonCount: sermons.filter(s => s.speaker_id === speaker.id || s.speaker === speaker.name).length,
    })).filter(s => s.sermonCount > 0).sort((a, b) => b.sermonCount - a.sermonCount);
  }, [speakers, sermons]);

  const seminarsWithDetails = useMemo(() => {
    return seminars.map(seminar => ({
      ...seminar,
      sermons: sermons.filter(s => s.seminar_id === seminar.id),
    })).filter(s => s.sermons.length > 0);
  }, [seminars, sermons]);

  // Sorted sermons for list view
  const sortedSermons = useMemo(() => {
    const sorted = [...sermons];
    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'speaker':
        return sorted.sort((a, b) => a.speaker.localeCompare(b.speaker));
      case 'duration':
        return sorted.sort((a, b) => (b.duration_seconds || 0) - (a.duration_seconds || 0));
      default:
        return sorted;
    }
  }, [sermons, sortBy]);

  // Get latest sermon with cover image for each category
  const latestPlaylistImage = useMemo(() => {
    // Collect all sermon IDs from all playlists
    const allPlaylistSermonIds: string[] = [];
    for (const playlist of playlists) {
      if (playlist?.sermonIds?.length) {
        allPlaylistSermonIds.push(...playlist.sermonIds);
      }
    }
    // Find the first sermon with a cover image
    for (const sermonId of allPlaylistSermonIds) {
      const sermon = sermons.find(s => s.id === sermonId);
      if (sermon?.cover_image) return sermon.cover_image;
    }
    // Fallback: if we have playlists with sermons but none have cover images,
    // use the first sermon's cover from all sermons
    if (allPlaylistSermonIds.length > 0) {
      const firstSermonInPlaylist = sermons.find(s => allPlaylistSermonIds.includes(s.id));
      if (firstSermonInPlaylist) {
        // Try to get any cover image from recent sermons as fallback
        const anySermonWithCover = sermons.find(s => s.cover_image);
        if (anySermonWithCover?.cover_image) return anySermonWithCover.cover_image;
      }
    }
    return null;
  }, [playlists, sermons]);

  const latestHistoryImage = useMemo(() => {
    const historyWithImage = historySermons.find(s => s.cover_image);
    return historyWithImage?.cover_image || null;
  }, [historySermons]);

  const latestSpeakerImage = useMemo(() => {
    // Get the latest sermon with cover image from the most popular speaker
    const topSpeaker = speakersWithSermons[0];
    if (topSpeaker?.sermons?.length) {
      const sermonWithImage = topSpeaker.sermons.find(s => s.cover_image);
      if (sermonWithImage) return sermonWithImage.cover_image;
    }
    // Fallback: find any recent sermon with a cover image
    const recentWithImage = sermons.find(s => s.cover_image);
    return recentWithImage?.cover_image || null;
  }, [speakersWithSermons, sermons]);

  const latestSeminarImage = useMemo(() => {
    // Get image from the first seminar's cover or its first sermon
    const firstSeminar = seminarsWithDetails[0];
    if (firstSeminar?.cover_image) return firstSeminar.cover_image;
    if (firstSeminar?.sermons?.length) {
      const sermonWithImage = firstSeminar.sermons.find(s => s.cover_image);
      if (sermonWithImage) return sermonWithImage.cover_image;
    }
    return null;
  }, [seminarsWithDetails]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return sermons.filter(s =>
      s.title.toLowerCase().includes(query) ||
      s.speaker.toLowerCase().includes(query)
    );
  }, [sermons, searchQuery]);

  const handlePlaySermon = (sermon: Sermon, queue: Sermon[] = [sermon], index: number = 0) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // If sermon has no audio but has YouTube/video, go to detail page
    if (!sermon.audio_url && (sermon.youtube_url || sermon.video_url)) {
      navigateTo(`/sermon/${sermon.id}`);
      return;
    }
    if (!sermon.audio_url) {
      navigateTo(`/sermon/${sermon.id}`);
      return;
    }
    // Filter queue to only include sermons with audio
    const audioQueue = queue.filter(s => s.audio_url);
    const audioIndex = audioQueue.findIndex(s => s.id === sermon.id);
    setQueue(audioQueue, audioIndex >= 0 ? audioIndex : 0);
    // Open the full screen player like Spotify
    router.push('/player');
  };

  const handleShuffleAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Only shuffle sermons with audio
    const audioSermons = sermons.filter(s => s.audio_url);
    if (audioSermons.length === 0) return;
    const shuffled = [...audioSermons].sort(() => Math.random() - 0.5);
    setQueue(shuffled, 0);
    // Open the full screen player like Spotify
    router.push('/player');
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  // Modern compact card grid
  const renderQuickAccessGrid = () => (
    <View style={styles.quickAccessGrid}>
      {/* Favoris */}
      <QuickAccessCard
        title="Favoris"
        subtitle={`${favorites.length} titre${favorites.length !== 1 ? 's' : ''}`}
        icon={<Heart size={18} color="#EC4899" fill="#EC4899" />}
        iconBgColor="rgba(236, 72, 153, 0.12)"
        image={favoriteSermons[0]?.cover_image}
        themeColors={themeColors}
        isDark={isDark}
        onPress={() => navigateTo('/favorites')}
      />

      {/* Derniere ecoute */}
      {historySermons.length > 0 && (
        <QuickAccessCard
          title={historySermons[0]?.title || 'Historique'}
          subtitle={historySermons[0]?.speaker || 'Aucune ecoute'}
          image={historySermons[0]?.cover_image}
          themeColors={themeColors}
          isDark={isDark}
          onPress={() => historySermons[0] && handlePlaySermon(historySermons[0], historySermons, 0)}
        />
      )}

      {/* Playlists */}
      <QuickAccessCard
        title="Playlists"
        subtitle={`${playlists.length} playlist${playlists.length !== 1 ? 's' : ''}`}
        icon={!latestPlaylistImage ? <ListMusic size={18} color={colors.primary[500]} /> : undefined}
        iconBgColor={!latestPlaylistImage ? colors.primary[500] + '15' : undefined}
        image={latestPlaylistImage}
        themeColors={themeColors}
        isDark={isDark}
        onPress={() => navigateTo('/playlists')}
      />

      {/* Historique */}
      <QuickAccessCard
        title="Historique"
        subtitle={`${history.length} ecoute${history.length !== 1 ? 's' : ''}`}
        icon={!latestHistoryImage ? <History size={18} color={colors.accent.orange} /> : undefined}
        iconBgColor={!latestHistoryImage ? colors.accent.orange + '15' : undefined}
        image={latestHistoryImage}
        themeColors={themeColors}
        isDark={isDark}
        onPress={() => navigateTo('/history')}
      />

      {/* Orateurs */}
      <QuickAccessCard
        title="Orateurs"
        subtitle={`${speakers.length} orateur${speakers.length !== 1 ? 's' : ''}`}
        icon={!latestSpeakerImage ? <Mic2 size={18} color={colors.accent.green} /> : undefined}
        iconBgColor={!latestSpeakerImage ? colors.accent.green + '15' : undefined}
        image={latestSpeakerImage}
        themeColors={themeColors}
        isDark={isDark}
        onPress={() => navigateTo('/speakers')}
      />

      {/* Seminaires */}
      <QuickAccessCard
        title="Séminaires"
        subtitle={`${seminars.length} série${seminars.length !== 1 ? 's' : ''}`}
        icon={!latestSeminarImage ? <BookOpen size={18} color={colors.accent.purple} /> : undefined}
        iconBgColor={!latestSeminarImage ? colors.accent.purple + '15' : undefined}
        image={latestSeminarImage}
        themeColors={themeColors}
        isDark={isDark}
        onPress={() => navigateTo('/seminars')}
      />

      {/* Adoration & Louange */}
      <QuickAccessCard
        title="Adoration & Louange"
        subtitle={`${worshipSermons.length} chant${worshipSermons.length !== 1 ? 's' : ''}`}
        icon={<Music size={18} color="#EC4899" />}
        iconBgColor="rgba(236, 72, 153, 0.12)"
        image={worshipSermons[0]?.cover_image}
        themeColors={themeColors}
        isDark={isDark}
        onPress={() => navigateTo('/worship')}
      />

      {/* Filtres predications */}
      <QuickAccessCard
        title="Filtres"
        subtitle={`${sermons.length} predication${sermons.length !== 1 ? 's' : ''}`}
        icon={<Library size={18} color={colors.accent.teal} />}
        iconBgColor={colors.accent.teal + '15'}
        themeColors={themeColors}
        isDark={isDark}
        onPress={() => navigateTo('/predications')}
      />
    </View>
  );

  // Search results view
  if (isSearchFocused) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Search Header */}
        <View style={[styles.searchHeader, { paddingTop: insets.top + spacing[2] }]}>
          <View style={[styles.searchBar, { backgroundColor: themeColors.card }]}>
            <Search size={20} color={colors.primary[500]} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Rechercher..."
              placeholderTextColor={themeColors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              autoFocus
            />
            <Pressable onPress={() => { setSearchQuery(''); setIsSearchFocused(false); }}>
              <X size={20} color={themeColors.textTertiary} />
            </Pressable>
          </View>
        </View>

        <FlatList
          data={searchQuery ? searchResults : sermons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 80, paddingHorizontal: spacing[4] }}
          ListHeaderComponent={
            !searchQuery ? (
              <Text style={[styles.searchSuggestionTitle, { color: themeColors.textSecondary }]}>
                Toutes les prédications
              </Text>
            ) : null
          }
          renderItem={({ item, index }) => (
            <SermonListItem
              sermon={item}
              index={index}
              themeColors={themeColors}
              isPlaying={currentSermon?.id === item.id && isPlaying}
              onPress={() => handlePlaySermon(item, searchQuery ? searchResults : sermons, index)}
              onPlay={() => handlePlaySermon(item, searchQuery ? searchResults : sermons, index)}
              variant="flat"
            />
          )}
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.emptySearch}>
                <Text style={[styles.emptySearchText, { color: themeColors.textSecondary }]}>
                  Aucun résultat pour "{searchQuery}"
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
          <Animated.View entering={FadeIn.duration(400)}>
            <Text style={[styles.title, { color: themeColors.text }]}>Prédications</Text>
          </Animated.View>

          {/* Search Bar */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Pressable
              style={[
                styles.searchBarTouchable,
                {
                  backgroundColor: themeColors.card,
                  borderColor: 'rgba(0,0,0,0.6)',
                },
              ]}
              onPress={() => setIsSearchFocused(true)}
            >
              <Search size={18} color={themeColors.textTertiary} />
              <Text style={[styles.searchPlaceholder, { color: themeColors.textTertiary }]}>
                Rechercher une predication...
              </Text>
            </Pressable>
          </Animated.View>

          {/* Filter Chips */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsContainer}
            >
              {FILTER_CHIPS.map((chip) => {
                const isActive = activeFilter === chip.id;
                return (
                  <Pressable
                    key={chip.id}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isActive
                          ? colors.primary[500]
                          : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                        borderColor: isActive
                          ? colors.primary[500]
                          : 'rgba(0,0,0,0.6)',
                      },
                    ]}
                    onPress={() => {
                      // Navigate to predications page for "list" filter
                      if (chip.id === 'list') {
                        navigateTo('/predications');
                        Haptics.selectionAsync();
                        return;
                      }
                      setActiveFilter(chip.id);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: isActive ? '#FFFFFF' : themeColors.textSecondary,
                          fontWeight: isActive ? '600' : '500',
                        },
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>

        {/* Quick Access Grid - Spotify style (toujours visible) */}
        {activeFilter === 'all' && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            {renderQuickAccessGrid()}
          </Animated.View>
        )}

        {/* Empty State - No sermons (apres les blocs rapides) */}
        {!loading && sermons.length === 0 && activeFilter === 'all' && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.emptyStateContainer}>
            <View style={[styles.emptyStateIcon, { backgroundColor: themeColors.card }]}>
              {isConnected === false ? (
                <WifiOff size={40} color={themeColors.textTertiary} />
              ) : (
                <Headphones size={40} color={themeColors.textTertiary} />
              )}
            </View>
            <Text style={[styles.emptyStateTitle, { color: themeColors.text }]}>
              {isConnected === false ? 'Pas de connexion internet' : 'Aucune predication'}
            </Text>
            <Text style={[styles.emptyStateDescription, { color: themeColors.textSecondary }]}>
              {isConnected === false
                ? 'Vous pouvez toujours acceder a vos audios telecharges en mode hors ligne.'
                : 'Les predications apparaitront ici des qu\'elles seront ajoutees.'}
            </Text>
            {isConnected === false ? (
              <Pressable
                style={[styles.emptyStateButton, { backgroundColor: colors.primary[500], flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => navigateTo('/downloads')}
              >
                <Download size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.emptyStateButtonText}>Mes telechargements</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.emptyStateButton, { backgroundColor: colors.primary[500] }]}
                onPress={onRefresh}
              >
                <Text style={styles.emptyStateButtonText}>Actualiser</Text>
              </Pressable>
            )}
          </Animated.View>
        )}

        {/* Shuffle All Button - only show when we have sermons */}
        {activeFilter === 'all' && sermons.length > 0 && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.shuffleSection}>
            <Pressable
              style={[styles.shuffleButton, { backgroundColor: colors.primary[500] }]}
              onPress={handleShuffleAll}
            >
              <Shuffle size={20} color="#FFFFFF" />
              <Text style={styles.shuffleButtonText}>Lecture aleatoire</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Content based on active filter */}
        {activeFilter === 'all' && sermons.length > 0 && (
          <>
            {/* Recemment ecoutees */}
            {historySermons.length > 0 && (
              <Section
                title="Reprendre l'ecoute"
                onSeeAll={() => router.push('/history')}
                themeColors={themeColors}
                delay={300}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                  {historySermons.map((sermon, index) => (
                    <AlbumCard
                      key={sermon.id}
                      sermon={sermon}
                      index={index}
                      themeColors={themeColors}
                      isPlaying={currentSermon?.id === sermon.id && isPlaying}
                      onPress={() => handlePlaySermon(sermon, historySermons, index)}
                      onPlay={() => handlePlaySermon(sermon, historySermons, index)}
                    />
                  ))}
                </ScrollView>
              </Section>
            )}

            {/* Dernieres predications */}
            <Section
              title="Dernieres predications"
              onSeeAll={() => navigateTo('/predications')}
              themeColors={themeColors}
              delay={350}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                {recentSermons.map((sermon, index) => (
                  <AlbumCard
                    key={sermon.id}
                    sermon={sermon}
                    index={index}
                    themeColors={themeColors}
                    isPlaying={currentSermon?.id === sermon.id && isPlaying}
                    onPress={() => handlePlaySermon(sermon, recentSermons, index)}
                    onPlay={() => handlePlaySermon(sermon, recentSermons, index)}
                  />
                ))}
              </ScrollView>
            </Section>

            {/* Par orateur */}
            {speakersWithSermons.length > 0 && (
              <Section
                title="Orateurs populaires"
                onSeeAll={() => router.push('/speakers')}
                themeColors={themeColors}
                delay={400}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                  {speakersWithSermons.slice(0, 8).map((speaker, index) => (
                    <SpeakerCard
                      key={speaker.id}
                      speaker={speaker}
                      index={index}
                      themeColors={themeColors}
                      onPress={() => router.push(`/speaker/${speaker.id}`)}
                    />
                  ))}
                </ScrollView>
              </Section>
            )}

            {/* Seminaires */}
            {seminarsWithDetails.length > 0 && (
              <Section
                title="Séminaires"
                onSeeAll={() => router.push('/seminars')}
                themeColors={themeColors}
                delay={450}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                  {seminarsWithDetails.map((seminar, index) => (
                    <SeminarCard
                      key={seminar.id}
                      seminar={seminar}
                      index={index}
                      themeColors={themeColors}
                      onPress={() => router.push(`/seminar/${seminar.id}`)}
                    />
                  ))}
                </ScrollView>
              </Section>
            )}
          </>
        )}

        {/* List filter - all sermons with sort options */}
        {activeFilter === 'list' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.listSection}>
            {/* Sort options */}
            <View style={styles.sortContainer}>
              <Text style={[styles.sortLabel, { color: themeColors.textSecondary }]}>Trier par:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortOptions}>
                {SORT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => setSortBy(option.id)}
                    style={[
                      styles.sortChip,
                      { backgroundColor: sortBy === option.id ? colors.primary[500] : themeColors.surface },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortChipText,
                        { color: sortBy === option.id ? '#fff' : themeColors.textSecondary },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Sermons count */}
            <Text style={[styles.sermonsCount, { color: themeColors.textTertiary }]}>
              {sortedSermons.length} prédication{sortedSermons.length > 1 ? 's' : ''}
            </Text>

            {sortedSermons.length > 0 ? (
              sortedSermons.map((sermon, index) => (
                <SermonListItem
                  key={sermon.id}
                  sermon={sermon}
                  index={index}
                  themeColors={themeColors}
                  isPlaying={currentSermon?.id === sermon.id && isPlaying}
                  onPress={() => handlePlaySermon(sermon, sortedSermons, index)}
                  onPlay={() => handlePlaySermon(sermon, sortedSermons, index)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Headphones size={48} color={themeColors.textTertiary} />
                <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
                  Aucune prédication disponible
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Favorites filter */}
        {activeFilter === 'favorites' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.listSection}>
            {favoriteSermons.length > 0 ? (
              favoriteSermons.map((sermon, index) => (
                <SermonListItem
                  key={sermon.id}
                  sermon={sermon}
                  index={index}
                  themeColors={themeColors}
                  isPlaying={currentSermon?.id === sermon.id && isPlaying}
                  onPress={() => handlePlaySermon(sermon, favoriteSermons, index)}
                  onPlay={() => handlePlaySermon(sermon, favoriteSermons, index)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Heart size={48} color={themeColors.textTertiary} />
                <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
                  Aucun favori pour le moment
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Speakers filter */}
        {activeFilter === 'speakers' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.speakersGrid}>
            {speakersWithSermons.length > 0 ? (
              speakersWithSermons.map((speaker, index) => (
                <SpeakerGridCard
                  key={speaker.id}
                  speaker={speaker}
                  index={index}
                  themeColors={themeColors}
                  onPress={() => router.push(`/speaker/${speaker.id}`)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Mic2 size={48} color={themeColors.textTertiary} />
                <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
                  Aucun orateur disponible
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Seminars filter */}
        {activeFilter === 'seminars' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.listSection}>
            {seminarsWithDetails.length > 0 ? (
              seminarsWithDetails.map((seminar, index) => (
                <SeminarListItem
                  key={seminar.id}
                  seminar={seminar}
                  index={index}
                  themeColors={themeColors}
                  onPress={() => router.push(`/seminar/${seminar.id}`)}
                  onAddSermons={() => {
                    setSelectedSeminar(seminar);
                    setAddSermonsModalVisible(true);
                  }}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <BookOpen size={48} color={themeColors.textTertiary} />
                <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
                  Aucun seminaire disponible
                </Text>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Add Sermons to Seminar Modal */}
      <AddSermonsToSeminarModal
        visible={addSermonsModalVisible}
        onClose={() => {
          setAddSermonsModalVisible(false);
          setSelectedSeminar(null);
        }}
        seminarId={selectedSeminar?.id || ''}
        seminarName={selectedSeminar?.name}
        onSermonsUpdated={() => queryClient.invalidateQueries()}
      />
    </View>
  );
}

// Quick Access Card - Modern compact design
function QuickAccessCard({
  title,
  subtitle,
  icon,
  iconBgColor,
  image,
  themeColors,
  onPress,
  isDark,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  image?: string | null;
  themeColors: ThemeColors;
  onPress: () => void;
  isDark?: boolean;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.quickAccessCard,
        {
          backgroundColor: themeColors.card,
          borderColor: 'rgba(0,0,0,0.6)',
        },
        animatedStyle,
      ]}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.quickAccessImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
      ) : icon ? (
        <View style={[styles.quickAccessIcon, { backgroundColor: iconBgColor }]}>
          {icon}
        </View>
      ) : (
        <LinearGradient
          colors={colors.gradients.primary}
          style={styles.quickAccessImage}
        />
      )}
      <View style={styles.quickAccessInfo}>
        <Text style={[styles.quickAccessTitle, { color: themeColors.text }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

// Section Header
function Section({
  title,
  onSeeAll,
  themeColors,
  delay,
  children,
}: {
  title: string;
  onSeeAll?: () => void;
  themeColors: ThemeColors;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{title}</Text>
        {onSeeAll && (
          <Pressable style={styles.seeAllButton} onPress={onSeeAll}>
            <Text style={[styles.seeAllText, { color: themeColors.textSecondary }]}>Voir tout</Text>
            <ChevronRight size={16} color={themeColors.textSecondary} />
          </Pressable>
        )}
      </View>
      {children}
    </Animated.View>
  );
}

// Album Card - Clean modern style
function AlbumCard({
  sermon,
  index,
  themeColors,
  isPlaying,
  onPress,
  onPlay,
}: {
  sermon: Sermon;
  index: number;
  themeColors: ThemeColors;
  isPlaying: boolean;
  onPress: () => void;
  onPlay: () => void;
}) {
  const scale = useSharedValue(1);
  const playButtonOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const playButtonStyle = useAnimatedStyle(() => ({
    opacity: playButtonOpacity.value,
    transform: [{ scale: 0.9 + playButtonOpacity.value * 0.1 }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(index * 40).duration(350)}>
      <AnimatedPressable
        style={[styles.albumCard, animatedStyle]}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
          playButtonOpacity.value = withTiming(1, { duration: 150 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
          playButtonOpacity.value = withTiming(0, { duration: 200 });
        }}
        onPress={onPress}
      >
        <View style={styles.albumCoverContainer}>
          {sermon.cover_image ? (
            <Image source={{ uri: sermon.cover_image }} style={styles.albumCover} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          ) : (
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.albumCover}
            />
          )}
          <Animated.View style={[styles.albumPlayButton, isPlaying && styles.albumPlayButtonActive, playButtonStyle]}>
            <Pressable onPress={onPlay} style={styles.albumPlayButtonInner}>
              <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
            </Pressable>
          </Animated.View>
        </View>
        <Text style={[styles.albumTitle, { color: isPlaying ? colors.primary[500] : themeColors.text }]} numberOfLines={2}>
          {sermon.title}
        </Text>
        <Text style={[styles.albumArtist, { color: themeColors.textSecondary }]} numberOfLines={1}>
          {sermon.speaker}
        </Text>
        <View style={styles.albumMeta}>
          {sermon.date && (
            <View style={styles.albumMetaItem}>
              <Calendar size={10} color={themeColors.textTertiary} />
              <Text style={[styles.albumMetaText, { color: themeColors.textTertiary }]}>
                {new Date(sermon.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          )}
          {sermon.duration_seconds && (
            <View style={styles.albumMetaItem}>
              <Clock size={10} color={themeColors.textTertiary} />
              <Text style={[styles.albumMetaText, { color: themeColors.textTertiary }]}>
                {Math.floor(sermon.duration_seconds / 60)} min
              </Text>
            </View>
          )}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

// Speaker Card - Circle style
function SpeakerCard({
  speaker,
  index,
  themeColors,
  onPress,
}: {
  speaker: Speaker & { sermonCount: number };
  index: number;
  themeColors: ThemeColors;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
      <AnimatedPressable
        style={[styles.speakerCard, animatedStyle]}
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <View style={styles.speakerAvatarContainer}>
          {speaker.photo_url ? (
            <Image source={{ uri: speaker.photo_url }} style={styles.speakerAvatar} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          ) : (
            <View style={[styles.speakerAvatar, styles.speakerAvatarPlaceholder]}>
              <User size={32} color="#FFFFFF" />
            </View>
          )}
        </View>
        <Text style={[styles.speakerName, { color: themeColors.text }]} numberOfLines={1}>
          {speaker.name}
        </Text>
        <Text style={[styles.speakerSermons, { color: themeColors.textSecondary }]}>
          {speaker.sermonCount} predication{speaker.sermonCount > 1 ? 's' : ''}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

// Seminar Card
function SeminarCard({
  seminar,
  index,
  themeColors,
  onPress,
}: {
  seminar: Seminar & { sermons: Sermon[] };
  index: number;
  themeColors: ThemeColors;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
      <AnimatedPressable
        style={[styles.seminarCard, animatedStyle]}
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <View style={styles.seminarCoverContainer}>
          {seminar.cover_image ? (
            <Image source={{ uri: seminar.cover_image }} style={styles.seminarCover} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          ) : (
            <LinearGradient
              colors={colors.gradients.secondary}
              style={styles.seminarCover}
            >
              <BookOpen size={32} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          )}
        </View>
        <Text style={[styles.seminarTitle, { color: themeColors.text }]} numberOfLines={2}>
          {seminar.name}
        </Text>
        <Text style={[styles.seminarCount, { color: themeColors.textSecondary }]}>
          {seminar.sermons.length} partie{seminar.sermons.length > 1 ? 's' : ''}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

// Sermon List Item
function SermonListItem({
  sermon,
  index,
  themeColors,
  isPlaying,
  onPress,
  onPlay,
  variant = 'card',
}: {
  sermon: Sermon;
  index: number;
  themeColors: ThemeColors;
  isPlaying: boolean;
  onPress: () => void;
  onPlay: () => void;
  variant?: 'card' | 'flat';
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const isFlat = variant === 'flat';

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
      <AnimatedPressable
        style={[
          isFlat ? styles.sermonListItemFlat : styles.sermonListItem,
          !isFlat && { backgroundColor: themeColors.card },
          animatedStyle,
        ]}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <Pressable style={styles.sermonCover} onPress={onPlay}>
          {sermon.cover_image ? (
            <Image source={{ uri: sermon.cover_image }} style={styles.sermonCoverImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          ) : (
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.sermonCoverImage}
            />
          )}
          <View style={[styles.sermonPlayOverlay, isPlaying && { backgroundColor: colors.primary[500] }]}>
            <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </Pressable>

        <View style={styles.sermonInfo}>
          <Text style={[styles.sermonTitle, { color: isPlaying ? colors.primary[500] : themeColors.text }]} numberOfLines={1}>
            {sermon.title}
          </Text>
          <Text style={[styles.sermonMeta, { color: themeColors.textSecondary }]} numberOfLines={1}>
            {sermon.speaker}
            {sermon.duration_seconds ? ` • ${formatDuration(sermon.duration_seconds)}` : ''}
          </Text>
        </View>
      </AnimatedPressable>
      {isFlat && <View style={[styles.sermonDivider, { backgroundColor: themeColors.border }]} />}
    </Animated.View>
  );
}

// Speaker Grid Card
function SpeakerGridCard({
  speaker,
  index,
  themeColors,
  onPress,
}: {
  speaker: Speaker & { sermonCount: number };
  index: number;
  themeColors: ThemeColors;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <AnimatedPressable
        style={[styles.speakerGridCard, { backgroundColor: themeColors.card }, animatedStyle]}
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        {speaker.photo_url ? (
          <Image source={{ uri: speaker.photo_url }} style={styles.speakerGridAvatar} contentFit="cover" cachePolicy="memory-disk" transition={200} />
        ) : (
          <View style={[styles.speakerGridAvatar, styles.speakerAvatarPlaceholder]}>
            <User size={24} color="#FFFFFF" />
          </View>
        )}
        <View style={styles.speakerGridInfo}>
          <Text style={[styles.speakerGridName, { color: themeColors.text }]} numberOfLines={1}>
            {speaker.name}
          </Text>
          <Text style={[styles.speakerGridCount, { color: themeColors.textSecondary }]}>
            {speaker.sermonCount} predication{speaker.sermonCount > 1 ? 's' : ''}
          </Text>
        </View>
        <ChevronRight size={18} color={themeColors.textTertiary} />
      </AnimatedPressable>
    </Animated.View>
  );
}

// Seminar List Item
function SeminarListItem({
  seminar,
  index,
  themeColors,
  onPress,
  onAddSermons,
}: {
  seminar: Seminar & { sermons: Sermon[] };
  index: number;
  themeColors: ThemeColors;
  onPress: () => void;
  onAddSermons?: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <AnimatedPressable
        style={[styles.seminarListItem, { backgroundColor: themeColors.card }, animatedStyle]}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <View style={styles.seminarListCover}>
          {seminar.cover_image ? (
            <Image source={{ uri: seminar.cover_image }} style={styles.seminarListImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          ) : (
            <LinearGradient
              colors={colors.gradients.secondary}
              style={styles.seminarListImage}
            >
              <BookOpen size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          )}
        </View>
        <View style={styles.seminarListInfo}>
          <Text style={[styles.seminarListTitle, { color: themeColors.text }]} numberOfLines={1}>
            {seminar.name}
          </Text>
          <Text style={[styles.seminarListMeta, { color: themeColors.textSecondary }]}>
            {seminar.sermons.length} partie{seminar.sermons.length > 1 ? 's' : ''}
            {seminar.speaker && ` • ${seminar.speaker.name}`}
          </Text>
        </View>
        {onAddSermons && (
          <Pressable
            style={[styles.seminarAddButton, { backgroundColor: colors.primary[500] }]}
            onPress={(e) => {
              e.stopPropagation();
              onAddSermons();
            }}
          >
            <Plus size={16} color="#FFFFFF" />
          </Pressable>
        )}
        <ChevronRight size={18} color={themeColors.textTertiary} />
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: spacing[4],
    gap: spacing[4],
    marginBottom: spacing[3],
  },
  title: {
    ...typography.headlineLarge,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Search
  searchHeader: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    height: 48,
    borderRadius: borderRadius.xl,
    gap: spacing[3],
  },
  searchBarTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    height: 46,
    borderRadius: borderRadius.xl,
    gap: spacing[3],
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    height: '100%',
  },
  searchPlaceholder: {
    ...typography.bodyMedium,
    fontSize: 15,
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptySearchText: {
    ...typography.bodyMedium,
  },
  searchSuggestionTitle: {
    ...typography.labelMedium,
    fontWeight: '600',
    marginBottom: spacing[3],
    marginTop: spacing[2],
  },

  // Filter Chips
  filterChipsContainer: {
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    ...typography.labelMedium,
    fontSize: 13,
  },

  // Quick Access Grid
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  quickAccessCard: {
    width: CARD_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    height: 58,
    borderWidth: 1,
  },
  quickAccessImage: {
    width: 58,
    height: 58,
  },
  quickAccessIcon: {
    width: 58,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAccessInfo: {
    flex: 1,
    paddingHorizontal: spacing[3],
  },
  quickAccessTitle: {
    ...typography.labelMedium,
    fontWeight: '600',
    fontSize: 13,
  },

  // Shuffle
  shuffleSection: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3] + 2,
    borderRadius: borderRadius.full,
  },
  shuffleButtonText: {
    ...typography.labelLarge,
    fontWeight: '600',
    color: '#FFFFFF',
    fontSize: 15,
  },

  // Section
  section: {
    marginBottom: spacing[7],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...typography.titleLarge,
    fontWeight: '600',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    ...typography.labelMedium,
    fontSize: 13,
  },
  horizontalList: {
    paddingHorizontal: spacing[4],
    gap: spacing[4],
  },

  // Album Card
  albumCard: {
    width: 140,
  },
  albumCoverContainer: {
    position: 'relative',
    marginBottom: spacing[3],
  },
  albumCover: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.lg + 2,
  },
  albumPlayButton: {
    position: 'absolute',
    bottom: spacing[2],
    right: spacing[2],
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumPlayButtonActive: {
    backgroundColor: colors.primary[500],
  },
  albumPlayButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumTitle: {
    ...typography.labelMedium,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18,
  },
  albumArtist: {
    ...typography.labelSmall,
    marginTop: 3,
    fontSize: 12,
  },
  albumMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  albumMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  albumMetaText: {
    fontSize: 10,
  },

  // Speaker Card
  speakerCard: {
    alignItems: 'center',
    width: 100,
  },
  speakerAvatarContainer: {
    marginBottom: spacing[3],
  },
  speakerAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  speakerAvatarPlaceholder: {
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerName: {
    ...typography.labelMedium,
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 13,
  },
  speakerSermons: {
    ...typography.labelSmall,
    textAlign: 'center',
    marginTop: 2,
    fontSize: 11,
  },

  // Seminar Card
  seminarCard: {
    width: 160,
  },
  seminarCoverContainer: {
    marginBottom: spacing[3],
  },
  seminarCover: {
    width: 160,
    height: 100,
    borderRadius: borderRadius.lg + 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seminarTitle: {
    ...typography.labelMedium,
    fontWeight: '500',
    fontSize: 14,
  },
  seminarCount: {
    ...typography.labelSmall,
    marginTop: 3,
    fontSize: 12,
  },

  // List Section
  listSection: {
    paddingHorizontal: spacing[4],
    gap: spacing[1],
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  sortChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sermonsCount: {
    fontSize: 12,
    marginBottom: spacing[2],
  },

  // Sermon List Item
  sermonListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    gap: spacing[3],
  },
  sermonListItemFlat: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  sermonDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56 + spacing[3],
  },
  sermonCover: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md + 2,
    overflow: 'hidden',
    position: 'relative',
  },
  sermonCoverImage: {
    width: '100%',
    height: '100%',
  },
  sermonPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sermonInfo: {
    flex: 1,
  },
  sermonTitle: {
    ...typography.labelLarge,
    fontWeight: '500',
    fontSize: 15,
  },
  sermonMeta: {
    ...typography.labelSmall,
    marginTop: 3,
    fontSize: 12,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
    gap: spacing[3],
  },
  emptyStateText: {
    ...typography.bodyMedium,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[16],
    gap: spacing[3],
  },
  emptyStateIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  emptyStateTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateDescription: {
    ...typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
  },
  emptyStateButtonText: {
    ...typography.labelLarge,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Speaker Grid
  speakersGrid: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  speakerGridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    gap: spacing[3],
  },
  speakerGridAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  speakerGridInfo: {
    flex: 1,
  },
  speakerGridName: {
    ...typography.labelLarge,
    fontWeight: '500',
    fontSize: 15,
  },
  speakerGridCount: {
    ...typography.labelSmall,
    marginTop: 2,
    fontSize: 12,
  },

  // Seminar List Item
  seminarListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    gap: spacing[3],
  },
  seminarListCover: {
    width: 68,
    height: 48,
    borderRadius: borderRadius.md + 2,
    overflow: 'hidden',
  },
  seminarListImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seminarListInfo: {
    flex: 1,
  },
  seminarListTitle: {
    ...typography.labelLarge,
    fontWeight: '500',
    fontSize: 15,
  },
  seminarListMeta: {
    ...typography.labelSmall,
    marginTop: 3,
    fontSize: 12,
  },
  seminarAddButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[2],
  },
});
