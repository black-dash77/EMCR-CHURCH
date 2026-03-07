import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import {
  Search,
  Play,
  X,
  Heart,
  ChevronLeft,
  Filter,
  Grid3X3,
  List,
  LayoutList,
  ArrowUpDown,
  Calendar,
  Clock,
  User,
  Tag,
  Headphones,
  WifiOff,
  Check,
  ChevronDown,
  Music,
  Video,
  Youtube,
} from 'lucide-react-native';
import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
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
  Modal,
  TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/TabBarBackground';
import { sermonsApi, speakersApi } from '@/services/api';
import { useCurrentSermon, useIsPlaying, useAudioActions } from '@/stores/useAudioStore';
import { useUserStore } from '@/stores/useUserStore';
import { colors, typography, spacing, borderRadius, ThemeColors } from '@/theme';
import type { Sermon, Speaker, SermonFilters, SermonSortOptions, DurationFilter, SermonSortField, SortDirection } from '@/types';

const { width } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const GRID_CARD_WIDTH = (width - spacing[4] * 2 - spacing[3]) / 2;
const GRID_CARD_WIDTH_3 = (width - spacing[4] * 2 - spacing[3] * 2) / 3;

// View modes
type ViewMode = 'list' | 'grid' | 'compact';

// Sort options
const SORT_OPTIONS: { id: SermonSortField; label: string }[] = [
  { id: 'date', label: 'Date' },
  { id: 'speaker', label: 'Orateur' },
  { id: 'title', label: 'Titre' },
  { id: 'duration_seconds', label: 'Duree' },
];

// Duration filter options
const DURATION_OPTIONS: { id: DurationFilter | 'all'; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'short', label: '< 30 min' },
  { id: 'medium', label: '30-60 min' },
  { id: 'long', label: '> 60 min' },
];

// Content type options
const CONTENT_TYPE_OPTIONS = [
  { id: 'all', label: 'Tous' },
  { id: 'sermon', label: 'Predications' },
  { id: 'adoration', label: 'Adoration' },
  { id: 'louange', label: 'Louange' },
];

export default function PredicationsScreen() {
  const { navigateTo, router } = useNavigationLock();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  // Data state
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<SermonFilters>({});
  const [sortOptions, setSortOptions] = useState<SermonSortOptions>({
    field: 'date',
    direction: 'desc',
  });
  const [selectedContentType, setSelectedContentType] = useState<string>('all');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<DurationFilter | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const currentSermon = useCurrentSermon();
  const isPlaying = useIsPlaying();
  const { setQueue } = useAudioActions();
  const { favorites, toggleFavorite } = useUserStore();

  const fetchData = useCallback(async () => {
    try {
      const [sermonsData, speakersData, categoriesData, tagsData] = await Promise.all([
        sermonsApi.getAll(),
        speakersApi.getAll(),
        sermonsApi.getCategories(),
        sermonsApi.getAllTags(),
      ]);
      setSermons(sermonsData);
      setSpeakers(speakersData);
      setCategories(categoriesData);
      setAllTags(tagsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Apply filters and sorting
  const filteredSermons = useMemo(() => {
    let result = [...sermons];

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.speaker.toLowerCase().includes(query) ||
        (s.description?.toLowerCase().includes(query))
      );
    }

    // Content type filter
    if (selectedContentType !== 'all') {
      result = result.filter(s => s.content_type === selectedContentType);
    }

    // Speaker filter
    if (selectedSpeakerId) {
      result = result.filter(s => s.speaker_id === selectedSpeakerId);
    }

    // Duration filter
    if (selectedDuration !== 'all') {
      result = result.filter(s => {
        const duration = s.duration_seconds || 0;
        switch (selectedDuration) {
          case 'short':
            return duration < 1800; // < 30 min
          case 'medium':
            return duration >= 1800 && duration < 3600; // 30-60 min
          case 'long':
            return duration >= 3600; // > 60 min
          default:
            return true;
        }
      });
    }

    // Tags filter
    if (selectedTags.length > 0) {
      result = result.filter(s =>
        s.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    // Date range filter
    if (dateRange.from) {
      result = result.filter(s => new Date(s.date) >= new Date(dateRange.from!));
    }
    if (dateRange.to) {
      result = result.filter(s => new Date(s.date) <= new Date(dateRange.to!));
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortOptions.field) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'speaker':
          comparison = a.speaker.localeCompare(b.speaker);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'duration_seconds':
          comparison = (a.duration_seconds || 0) - (b.duration_seconds || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOptions.direction === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [sermons, searchQuery, selectedContentType, selectedSpeakerId, selectedDuration, selectedTags, dateRange, sortOptions]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedContentType !== 'all') count++;
    if (selectedSpeakerId) count++;
    if (selectedDuration !== 'all') count++;
    if (selectedTags.length > 0) count++;
    if (dateRange.from || dateRange.to) count++;
    return count;
  }, [selectedContentType, selectedSpeakerId, selectedDuration, selectedTags, dateRange]);

  const clearAllFilters = () => {
    setSelectedContentType('all');
    setSelectedSpeakerId(null);
    setSelectedDuration('all');
    setSelectedTags([]);
    setDateRange({});
    setSearchQuery('');
  };

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
    router.push('/player');
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getMediaIcon = (sermon: Sermon) => {
    if (sermon.youtube_url) return <Youtube size={12} color="#FF0000" />;
    if (sermon.video_url) return <Video size={12} color={colors.primary[500]} />;
    return <Music size={12} color={themeColors.textTertiary} />;
  };

  // Render item based on view mode
  const renderSermonItem = ({ item, index }: { item: Sermon; index: number }) => {
    const isCurrentlyPlaying = currentSermon?.id === item.id && isPlaying;
    const isFavorite = favorites.includes(item.id);

    switch (viewMode) {
      case 'grid':
        return (
          <GridCard
            sermon={item}
            index={index}
            themeColors={themeColors}
            isPlaying={isCurrentlyPlaying}
            isFavorite={isFavorite}
            onPress={() => handlePlaySermon(item, filteredSermons, index)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            getMediaIcon={getMediaIcon}
          />
        );
      case 'compact':
        return (
          <CompactItem
            sermon={item}
            index={index}
            themeColors={themeColors}
            isPlaying={isCurrentlyPlaying}
            isFavorite={isFavorite}
            onPress={() => handlePlaySermon(item, filteredSermons, index)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            formatDuration={formatDuration}
            getMediaIcon={getMediaIcon}
          />
        );
      default:
        return (
          <ListItem
            sermon={item}
            index={index}
            themeColors={themeColors}
            isPlaying={isCurrentlyPlaying}
            isFavorite={isFavorite}
            onPress={() => handlePlaySermon(item, filteredSermons, index)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            formatDuration={formatDuration}
            formatDate={formatDate}
            getMediaIcon={getMediaIcon}
          />
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <View style={styles.headerTop}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <ChevronLeft size={24} color={themeColors.text} />
          </Pressable>
          <Text style={[styles.title, { color: themeColors.text }]}>Predications</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <List size={18} color={viewMode === 'list' ? colors.primary[500] : themeColors.textSecondary} />
            </Pressable>
            <Pressable
              style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <Grid3X3 size={18} color={viewMode === 'grid' ? colors.primary[500] : themeColors.textSecondary} />
            </Pressable>
            <Pressable
              style={[styles.viewModeButton, viewMode === 'compact' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('compact')}
            >
              <LayoutList size={18} color={viewMode === 'compact' ? colors.primary[500] : themeColors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: themeColors.card }]}>
          <Search size={18} color={themeColors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Rechercher une predication..."
            placeholderTextColor={themeColors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={18} color={themeColors.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Filter & Sort Bar */}
        <View style={styles.filterBar}>
          <Pressable
            style={[
              styles.filterButton,
              { backgroundColor: themeColors.card },
              activeFiltersCount > 0 && { backgroundColor: colors.primary[500] + '15', borderColor: colors.primary[500] },
            ]}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={16} color={activeFiltersCount > 0 ? colors.primary[500] : themeColors.textSecondary} />
            <Text style={[
              styles.filterButtonText,
              { color: activeFiltersCount > 0 ? colors.primary[500] : themeColors.textSecondary }
            ]}>
              Filtres {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterButton, { backgroundColor: themeColors.card }]}
            onPress={() => setShowSortModal(true)}
          >
            <ArrowUpDown size={16} color={themeColors.textSecondary} />
            <Text style={[styles.filterButtonText, { color: themeColors.textSecondary }]}>
              {SORT_OPTIONS.find(o => o.id === sortOptions.field)?.label}
            </Text>
            <ChevronDown size={14} color={themeColors.textTertiary} />
          </Pressable>

          {activeFiltersCount > 0 && (
            <Pressable
              style={styles.clearFiltersButton}
              onPress={clearAllFilters}
            >
              <X size={14} color={colors.primary[500]} />
              <Text style={[styles.clearFiltersText, { color: colors.primary[500] }]}>Effacer</Text>
            </Pressable>
          )}
        </View>

        {/* Quick filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFiltersContainer}
        >
          {CONTENT_TYPE_OPTIONS.map(option => (
            <Pressable
              key={option.id}
              style={[
                styles.quickFilterChip,
                {
                  backgroundColor: selectedContentType === option.id
                    ? colors.primary[500]
                    : themeColors.card,
                },
              ]}
              onPress={() => {
                setSelectedContentType(option.id);
                Haptics.selectionAsync();
              }}
            >
              <Text
                style={[
                  styles.quickFilterText,
                  {
                    color: selectedContentType === option.id ? '#FFFFFF' : themeColors.textSecondary,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Results count */}
      <View style={styles.resultsBar}>
        <Text style={[styles.resultsCount, { color: themeColors.textTertiary }]}>
          {filteredSermons.length} predication{filteredSermons.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Chargement...</Text>
        </View>
      ) : isConnected === false && sermons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <WifiOff size={48} color={themeColors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Pas de connexion</Text>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            Verifiez votre connexion internet
          </Text>
        </View>
      ) : filteredSermons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Headphones size={48} color={themeColors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Aucun resultat</Text>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            Essayez de modifier vos filtres
          </Text>
          {activeFiltersCount > 0 && (
            <Pressable
              style={[styles.clearButton, { backgroundColor: colors.primary[500] }]}
              onPress={clearAllFilters}
            >
              <Text style={styles.clearButtonText}>Effacer les filtres</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlashList
          data={filteredSermons}
          keyExtractor={(item) => item.id}
          renderItem={renderSermonItem}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render on view mode change
          contentContainerStyle={[
            styles.listContent,
            viewMode === 'grid' && styles.gridContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        themeColors={themeColors}
        isDark={isDark}
        speakers={speakers}
        allTags={allTags}
        selectedSpeakerId={selectedSpeakerId}
        setSelectedSpeakerId={setSelectedSpeakerId}
        selectedDuration={selectedDuration}
        setSelectedDuration={setSelectedDuration}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        dateRange={dateRange}
        setDateRange={setDateRange}
        onClearAll={clearAllFilters}
      />

      {/* Sort Modal */}
      <SortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        themeColors={themeColors}
        isDark={isDark}
        sortOptions={sortOptions}
        setSortOptions={setSortOptions}
      />
    </View>
  );
}

// List Item Component
const ListItem = memo(function ListItem({
  sermon,
  index,
  themeColors,
  isPlaying,
  isFavorite,
  onPress,
  onToggleFavorite,
  formatDuration,
  formatDate,
  getMediaIcon,
}: {
  sermon: Sermon;
  index: number;
  themeColors: ThemeColors;
  isPlaying: boolean;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  formatDuration: (seconds: number | null) => string;
  formatDate: (date: string) => string;
  getMediaIcon: (sermon: Sermon) => React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 30).duration(250)}>
      <AnimatedPressable
        style={[styles.listItem, { backgroundColor: themeColors.card }, animatedStyle]}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        {/* Cover */}
        <View style={styles.listItemCover}>
          {sermon.cover_image ? (
            <Image source={{ uri: sermon.cover_image }} style={styles.listItemImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          ) : (
            <LinearGradient colors={colors.gradients.primary} style={styles.listItemImage} />
          )}
          <View style={[styles.playOverlay, isPlaying && { backgroundColor: colors.primary[500] }]}>
            <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>

        {/* Info */}
        <View style={styles.listItemInfo}>
          <View style={styles.listItemTitleRow}>
            <Text
              style={[styles.listItemTitle, { color: isPlaying ? colors.primary[500] : themeColors.text }]}
              numberOfLines={2}
            >
              {sermon.title}
            </Text>
          </View>
          <Text style={[styles.listItemSpeaker, { color: themeColors.textSecondary }]} numberOfLines={1}>
            {sermon.speaker}
          </Text>
          <View style={styles.listItemMeta}>
            {getMediaIcon(sermon)}
            <Text style={[styles.listItemMetaText, { color: themeColors.textTertiary }]}>
              {formatDate(sermon.date)}
            </Text>
            {sermon.duration_seconds && (
              <>
                <View style={[styles.metaDot, { backgroundColor: themeColors.textTertiary }]} />
                <Text style={[styles.listItemMetaText, { color: themeColors.textTertiary }]}>
                  {formatDuration(sermon.duration_seconds)}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Favorite */}
        <Pressable
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          hitSlop={8}
        >
          <Heart
            size={20}
            color={isFavorite ? '#EC4899' : themeColors.textTertiary}
            fill={isFavorite ? '#EC4899' : 'transparent'}
          />
        </Pressable>
      </AnimatedPressable>
    </Animated.View>
  );
});

// Grid Card Component
const GridCard = memo(function GridCard({
  sermon,
  index,
  themeColors,
  isPlaying,
  isFavorite,
  onPress,
  onToggleFavorite,
  getMediaIcon,
}: {
  sermon: Sermon;
  index: number;
  themeColors: ThemeColors;
  isPlaying: boolean;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  getMediaIcon: (sermon: Sermon) => React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 30).duration(250)}
      style={styles.gridCardWrapper}
    >
      <AnimatedPressable
        style={[styles.gridCard, animatedStyle]}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        {/* Cover */}
        <View style={styles.gridCardCoverContainer}>
          {sermon.cover_image ? (
            <Image source={{ uri: sermon.cover_image }} style={styles.gridCardCover} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          ) : (
            <LinearGradient colors={colors.gradients.primary} style={styles.gridCardCover} />
          )}
          <View style={[styles.gridPlayButton, isPlaying && { backgroundColor: colors.primary[500] }]}>
            <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
          </View>
          <Pressable
            style={styles.gridFavoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Heart
              size={16}
              color={isFavorite ? '#EC4899' : '#FFFFFF'}
              fill={isFavorite ? '#EC4899' : 'transparent'}
            />
          </Pressable>
          <View style={styles.gridMediaBadge}>
            {getMediaIcon(sermon)}
          </View>
        </View>

        {/* Info */}
        <Text
          style={[styles.gridCardTitle, { color: isPlaying ? colors.primary[500] : themeColors.text }]}
          numberOfLines={2}
        >
          {sermon.title}
        </Text>
        <Text style={[styles.gridCardSpeaker, { color: themeColors.textSecondary }]} numberOfLines={1}>
          {sermon.speaker}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
});

// Compact Item Component
const CompactItem = memo(function CompactItem({
  sermon,
  index,
  themeColors,
  isPlaying,
  isFavorite,
  onPress,
  onToggleFavorite,
  formatDuration,
  getMediaIcon,
}: {
  sermon: Sermon;
  index: number;
  themeColors: ThemeColors;
  isPlaying: boolean;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  formatDuration: (seconds: number | null) => string;
  getMediaIcon: (sermon: Sermon) => React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 20).duration(200)}>
      <AnimatedPressable
        style={[styles.compactItem, animatedStyle]}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <View style={[styles.compactIndex, isPlaying && { backgroundColor: colors.primary[500] }]}>
          {isPlaying ? (
            <Play size={10} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Text style={[styles.compactIndexText, { color: isPlaying ? '#FFFFFF' : themeColors.textTertiary }]}>
              {index + 1}
            </Text>
          )}
        </View>

        <View style={styles.compactInfo}>
          <Text
            style={[styles.compactTitle, { color: isPlaying ? colors.primary[500] : themeColors.text }]}
            numberOfLines={1}
          >
            {sermon.title}
          </Text>
          <View style={styles.compactMeta}>
            {getMediaIcon(sermon)}
            <Text style={[styles.compactMetaText, { color: themeColors.textTertiary }]}>
              {sermon.speaker}
            </Text>
            {sermon.duration_seconds && (
              <>
                <View style={[styles.metaDot, { backgroundColor: themeColors.textTertiary }]} />
                <Text style={[styles.compactMetaText, { color: themeColors.textTertiary }]}>
                  {formatDuration(sermon.duration_seconds)}
                </Text>
              </>
            )}
          </View>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          hitSlop={8}
        >
          <Heart
            size={18}
            color={isFavorite ? '#EC4899' : themeColors.textTertiary}
            fill={isFavorite ? '#EC4899' : 'transparent'}
          />
        </Pressable>
      </AnimatedPressable>
      <View style={[styles.compactDivider, { backgroundColor: themeColors.border }]} />
    </Animated.View>
  );
});

// Filter Modal
function FilterModal({
  visible,
  onClose,
  themeColors,
  isDark,
  speakers,
  allTags,
  selectedSpeakerId,
  setSelectedSpeakerId,
  selectedDuration,
  setSelectedDuration,
  selectedTags,
  setSelectedTags,
  dateRange,
  setDateRange,
  onClearAll,
}: {
  visible: boolean;
  onClose: () => void;
  themeColors: ThemeColors;
  isDark: boolean;
  speakers: Speaker[];
  allTags: string[];
  selectedSpeakerId: string | null;
  setSelectedSpeakerId: (id: string | null) => void;
  selectedDuration: DurationFilter | 'all';
  setSelectedDuration: (duration: DurationFilter | 'all') => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  dateRange: { from?: string; to?: string };
  setDateRange: (range: { from?: string; to?: string }) => void;
  onClearAll: () => void;
}) {
  const insets = useSafeAreaInsets();

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
          <Text style={[styles.modalTitle, { color: themeColors.text }]}>Filtres</Text>
          <Pressable onPress={onClose}>
            <X size={24} color={themeColors.text} />
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Speaker Filter */}
          <View style={styles.filterSection}>
            <View style={styles.filterSectionHeader}>
              <User size={18} color={colors.primary[500]} />
              <Text style={[styles.filterSectionTitle, { color: themeColors.text }]}>Orateur</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsScroll}
            >
              <Pressable
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: !selectedSpeakerId ? colors.primary[500] : themeColors.card,
                  },
                ]}
                onPress={() => setSelectedSpeakerId(null)}
              >
                <Text style={[styles.filterChipText, { color: !selectedSpeakerId ? '#FFFFFF' : themeColors.textSecondary }]}>
                  Tous
                </Text>
              </Pressable>
              {speakers.map(speaker => (
                <Pressable
                  key={speaker.id}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selectedSpeakerId === speaker.id ? colors.primary[500] : themeColors.card,
                    },
                  ]}
                  onPress={() => setSelectedSpeakerId(selectedSpeakerId === speaker.id ? null : speaker.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedSpeakerId === speaker.id ? '#FFFFFF' : themeColors.textSecondary },
                    ]}
                  >
                    {speaker.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Duration Filter */}
          <View style={styles.filterSection}>
            <View style={styles.filterSectionHeader}>
              <Clock size={18} color={colors.primary[500]} />
              <Text style={[styles.filterSectionTitle, { color: themeColors.text }]}>Duree</Text>
            </View>
            <View style={styles.filterChipsWrap}>
              {DURATION_OPTIONS.map(option => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selectedDuration === option.id ? colors.primary[500] : themeColors.card,
                    },
                  ]}
                  onPress={() => setSelectedDuration(option.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedDuration === option.id ? '#FFFFFF' : themeColors.textSecondary },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Tag size={18} color={colors.primary[500]} />
                <Text style={[styles.filterSectionTitle, { color: themeColors.text }]}>Tags</Text>
              </View>
              <View style={styles.filterChipsWrap}>
                {allTags.map(tag => (
                  <Pressable
                    key={tag}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selectedTags.includes(tag) ? colors.primary[500] : themeColors.card,
                      },
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: selectedTags.includes(tag) ? '#FFFFFF' : themeColors.textSecondary },
                      ]}
                    >
                      {tag}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.modalFooter, { paddingBottom: insets.bottom + spacing[4] }]}>
          <Pressable
            style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: themeColors.border }]}
            onPress={onClearAll}
          >
            <Text style={[styles.modalButtonText, { color: themeColors.text }]}>Tout effacer</Text>
          </Pressable>
          <Pressable
            style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary[500] }]}
            onPress={onClose}
          >
            <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Appliquer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Sort Modal
function SortModal({
  visible,
  onClose,
  themeColors,
  isDark,
  sortOptions,
  setSortOptions,
}: {
  visible: boolean;
  onClose: () => void;
  themeColors: ThemeColors;
  isDark: boolean;
  sortOptions: SermonSortOptions;
  setSortOptions: (options: SermonSortOptions) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
          <Text style={[styles.modalTitle, { color: themeColors.text }]}>Trier par</Text>
          <Pressable onPress={onClose}>
            <X size={24} color={themeColors.text} />
          </Pressable>
        </View>

        <View style={styles.modalContent}>
          {SORT_OPTIONS.map(option => (
            <Pressable
              key={option.id}
              style={[styles.sortOption, { backgroundColor: themeColors.card }]}
              onPress={() => {
                if (sortOptions.field === option.id) {
                  // Toggle direction
                  setSortOptions({
                    ...sortOptions,
                    direction: sortOptions.direction === 'asc' ? 'desc' : 'asc',
                  });
                } else {
                  setSortOptions({
                    field: option.id,
                    direction: 'desc',
                  });
                }
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  { color: sortOptions.field === option.id ? colors.primary[500] : themeColors.text },
                ]}
              >
                {option.label}
              </Text>
              {sortOptions.field === option.id && (
                <View style={styles.sortOptionIndicator}>
                  <ArrowUpDown size={16} color={colors.primary[500]} />
                  <Text style={[styles.sortDirectionText, { color: colors.primary[500] }]}>
                    {sortOptions.direction === 'asc' ? 'Croissant' : 'Decroissant'}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Footer */}
        <View style={[styles.modalFooter, { paddingBottom: insets.bottom + spacing[4] }]}>
          <Pressable
            style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary[500], flex: 1 }]}
            onPress={onClose}
          >
            <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Appliquer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    paddingBottom: spacing[3],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: spacing[1],
  },
  title: {
    ...typography.titleLarge,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  viewModeButton: {
    padding: spacing[2],
    borderRadius: borderRadius.md,
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary[500] + '15',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    height: 44,
    borderRadius: borderRadius.xl,
    gap: spacing[3],
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    height: '100%',
  },

  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    gap: spacing[2],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonText: {
    ...typography.labelSmall,
    fontWeight: '500',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginLeft: 'auto',
  },
  clearFiltersText: {
    ...typography.labelSmall,
    fontWeight: '500',
  },

  // Quick Filters
  quickFiltersContainer: {
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  quickFilterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  quickFilterText: {
    ...typography.labelSmall,
    fontWeight: '500',
  },

  // Results Bar
  resultsBar: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  resultsCount: {
    ...typography.labelSmall,
  },

  // List Content
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: TAB_BAR_HEIGHT + 100,
    gap: spacing[2],
  },
  gridContent: {
    gap: spacing[3],
  },

  // List Item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    gap: spacing[3],
  },
  listItemCover: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  listItemImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  listItemTitle: {
    ...typography.labelLarge,
    fontWeight: '500',
    flex: 1,
  },
  listItemSpeaker: {
    ...typography.labelSmall,
    marginTop: 2,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: 4,
  },
  listItemMetaText: {
    fontSize: 11,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  favoriteButton: {
    padding: spacing[2],
  },

  // Grid Card
  gridCardWrapper: {
    width: GRID_CARD_WIDTH,
    marginBottom: spacing[2],
  },
  gridCard: {
    width: '100%',
  },
  gridCardCoverContainer: {
    position: 'relative',
    marginBottom: spacing[2],
  },
  gridCardCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
  },
  gridPlayButton: {
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
  gridFavoriteButton: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridMediaBadge: {
    position: 'absolute',
    top: spacing[2],
    left: spacing[2],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardTitle: {
    ...typography.labelMedium,
    fontWeight: '500',
  },
  gridCardSpeaker: {
    ...typography.labelSmall,
    marginTop: 2,
  },

  // Compact Item
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  compactIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactIndexText: {
    fontSize: 12,
    fontWeight: '600',
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    ...typography.labelMedium,
    fontWeight: '500',
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: 2,
  },
  compactMetaText: {
    fontSize: 11,
  },
  compactDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing[4] + 24 + spacing[3],
    marginRight: spacing[4],
  },

  // Empty/Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  emptyTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
  clearButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
  },
  clearButtonText: {
    ...typography.labelLarge,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: spacing[4],
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  modalButtonPrimary: {},
  modalButtonSecondary: {
    borderWidth: 1,
  },
  modalButtonText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },

  // Filter Section
  filterSection: {
    marginBottom: spacing[6],
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  filterSectionTitle: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  filterChipsScroll: {
    gap: spacing[2],
  },
  filterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    borderRadius: borderRadius.full,
  },
  filterChipText: {
    ...typography.labelSmall,
    fontWeight: '500',
  },

  // Sort Option
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[2],
  },
  sortOptionText: {
    ...typography.bodyMedium,
    fontWeight: '500',
  },
  sortOptionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  sortDirectionText: {
    ...typography.labelSmall,
    fontWeight: '500',
  },
});
