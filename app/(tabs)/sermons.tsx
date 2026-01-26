import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Search,
  Play,
  Clock,
  X,
  Heart,
  ListMusic,
  History,
  ChevronRight,
  Mic2,
  BookOpen,
  Shuffle,
  User,
} from 'lucide-react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/TabBarBackground';
import { sermonsApi, speakersApi, seminarsApi } from '@/services/api';
import { useAudioStore } from '@/stores/useAudioStore';
import { useUserStore } from '@/stores/useUserStore';
import { colors, typography, spacing, borderRadius, ThemeColors } from '@/theme';
import type { Sermon, Speaker, Seminar } from '@/types';

const { width } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Filter chips
const FILTER_CHIPS = [
  { id: 'all', label: 'Tout' },
  { id: 'recent', label: 'Récent' },
  { id: 'favorites', label: 'Favoris' },
  { id: 'speakers', label: 'Orateurs' },
  { id: 'seminars', label: 'Séminaires' },
];

export default function SermonsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const { setQueue, currentSermon, isPlaying } = useAudioStore();
  const { favorites, playlists, history, getHistorySermons, getFavoriteSermons } = useUserStore();

  const fetchData = useCallback(async () => {
    try {
      const [sermonsData, speakersData, seminarsData] = await Promise.all([
        sermonsApi.getAll(),
        speakersApi.getAll(),
        seminarsApi.getAll(),
      ]);
      setSermons(sermonsData);
      setSpeakers(speakersData);
      setSeminars(seminarsData);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  // Filtered/computed data
  const recentSermons = useMemo(() => sermons.slice(0, 10), [sermons]);
  const favoriteSermons = useMemo(() => getFavoriteSermons(sermons), [sermons, favorites]);
  const historySermons = useMemo(() => getHistorySermons(sermons).slice(0, 10), [sermons, history]);

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
    setQueue(queue, index);
  };

  const handleShuffleAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const shuffled = [...sermons].sort(() => Math.random() - 0.5);
    setQueue(shuffled, 0);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  // Spotify-like compact card grid
  const renderQuickAccessGrid = () => (
    <View style={styles.quickAccessGrid}>
      {/* Favoris */}
      <QuickAccessCard
        title="Favoris"
        subtitle={`${favorites.length} titre${favorites.length !== 1 ? 's' : ''}`}
        icon={<Heart size={20} color="#EC4899" fill="#EC4899" />}
        iconBgColor="rgba(236, 72, 153, 0.15)"
        image={favoriteSermons[0]?.cover_image}
        themeColors={themeColors}
        onPress={() => router.push('/favorites')}
      />

      {/* Derniere ecoute */}
      {historySermons.length > 0 && (
        <QuickAccessCard
          title={historySermons[0]?.title || 'Historique'}
          subtitle={historySermons[0]?.speaker || 'Aucune ecoute'}
          image={historySermons[0]?.cover_image}
          themeColors={themeColors}
          onPress={() => historySermons[0] && handlePlaySermon(historySermons[0], historySermons, 0)}
        />
      )}

      {/* Playlists */}
      <QuickAccessCard
        title="Playlists"
        subtitle={`${playlists.length} playlist${playlists.length !== 1 ? 's' : ''}`}
        icon={<ListMusic size={20} color={colors.primary[500]} />}
        iconBgColor={colors.primary[500] + '20'}
        themeColors={themeColors}
        onPress={() => router.push('/playlists')}
      />

      {/* Historique */}
      <QuickAccessCard
        title="Historique"
        subtitle={`${history.length} ecoute${history.length !== 1 ? 's' : ''}`}
        icon={<History size={20} color={colors.accent.orange} />}
        iconBgColor={colors.accent.orange + '20'}
        themeColors={themeColors}
        onPress={() => router.push('/history')}
      />

      {/* Orateurs */}
      <QuickAccessCard
        title="Orateurs"
        subtitle={`${speakers.length} orateur${speakers.length !== 1 ? 's' : ''}`}
        icon={<Mic2 size={20} color={colors.accent.green} />}
        iconBgColor={colors.accent.green + '20'}
        themeColors={themeColors}
        onPress={() => router.push('/speakers')}
      />

      {/* Seminaires */}
      <QuickAccessCard
        title="Séminaires"
        subtitle={`${seminars.length} série${seminars.length !== 1 ? 's' : ''}`}
        icon={<BookOpen size={20} color={colors.accent.purple} />}
        iconBgColor={colors.accent.purple + '20'}
        themeColors={themeColors}
        onPress={() => router.push('/seminars')}
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
              onPress={() => router.push(`/sermon/${item.id}`)}
              onPlay={() => handlePlaySermon(item, searchQuery ? searchResults : sermons, index)}
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
              style={[styles.searchBarTouchable, { backgroundColor: themeColors.card }]}
              onPress={() => setIsSearchFocused(true)}
            >
              <Search size={20} color={themeColors.textTertiary} />
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
              {FILTER_CHIPS.map((chip) => (
                <Pressable
                  key={chip.id}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: activeFilter === chip.id
                        ? colors.primary[500]
                        : themeColors.card,
                    },
                  ]}
                  onPress={() => {
                    setActiveFilter(chip.id);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: activeFilter === chip.id ? '#FFFFFF' : themeColors.text },
                    ]}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </View>

        {/* Quick Access Grid - Spotify style */}
        {activeFilter === 'all' && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            {renderQuickAccessGrid()}
          </Animated.View>
        )}

        {/* Shuffle All Button */}
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
        {activeFilter === 'all' && (
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
                      onPress={() => router.push(`/sermon/${sermon.id}`)}
                      onPlay={() => handlePlaySermon(sermon, historySermons, index)}
                    />
                  ))}
                </ScrollView>
              </Section>
            )}

            {/* Dernieres predications */}
            <Section
              title="Dernieres predications"
              onSeeAll={() => setActiveFilter('recent')}
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
                    onPress={() => router.push(`/sermon/${sermon.id}`)}
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

        {/* Recent filter - list view */}
        {activeFilter === 'recent' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.listSection}>
            {sermons.map((sermon, index) => (
              <SermonListItem
                key={sermon.id}
                sermon={sermon}
                index={index}
                themeColors={themeColors}
                isPlaying={currentSermon?.id === sermon.id && isPlaying}
                onPress={() => router.push(`/sermon/${sermon.id}`)}
                onPlay={() => handlePlaySermon(sermon, sermons, index)}
              />
            ))}
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
                  onPress={() => router.push(`/sermon/${sermon.id}`)}
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
            {speakersWithSermons.map((speaker, index) => (
              <SpeakerGridCard
                key={speaker.id}
                speaker={speaker}
                index={index}
                themeColors={themeColors}
                onPress={() => router.push(`/speaker/${speaker.id}`)}
              />
            ))}
          </Animated.View>
        )}

        {/* Seminars filter */}
        {activeFilter === 'seminars' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.listSection}>
            {seminarsWithDetails.map((seminar, index) => (
              <SeminarListItem
                key={seminar.id}
                seminar={seminar}
                index={index}
                themeColors={themeColors}
                onPress={() => router.push(`/seminar/${seminar.id}`)}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

// Quick Access Card - Spotify style compact
function QuickAccessCard({
  title,
  subtitle,
  icon,
  iconBgColor,
  image,
  themeColors,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  image?: string | null;
  themeColors: ThemeColors;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.quickAccessCard, { backgroundColor: themeColors.card }, animatedStyle]}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.quickAccessImage} />
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

// Album Card - Spotify style
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
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
      <AnimatedPressable
        style={[styles.albumCard, animatedStyle]}
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <View style={styles.albumCoverContainer}>
          {sermon.cover_image ? (
            <Image source={{ uri: sermon.cover_image }} style={styles.albumCover} />
          ) : (
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.albumCover}
            />
          )}
          <Pressable
            style={[styles.albumPlayButton, isPlaying && { backgroundColor: colors.primary[500] }]}
            onPress={onPlay}
          >
            <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
          </Pressable>
        </View>
        <Text style={[styles.albumTitle, { color: themeColors.text }]} numberOfLines={2}>
          {sermon.title}
        </Text>
        <Text style={[styles.albumArtist, { color: themeColors.textSecondary }]} numberOfLines={1}>
          {sermon.speaker}
        </Text>
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
            <Image source={{ uri: speaker.photo_url }} style={styles.speakerAvatar} />
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
            <Image source={{ uri: seminar.cover_image }} style={styles.seminarCover} />
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
}: {
  sermon: Sermon;
  index: number;
  themeColors: ThemeColors;
  isPlaying: boolean;
  onPress: () => void;
  onPlay: () => void;
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

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
      <AnimatedPressable
        style={[styles.sermonListItem, { backgroundColor: themeColors.card }, animatedStyle]}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <Pressable style={styles.sermonCover} onPress={onPlay}>
          {sermon.cover_image ? (
            <Image source={{ uri: sermon.cover_image }} style={styles.sermonCoverImage} />
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
          <Image source={{ uri: speaker.photo_url }} style={styles.speakerGridAvatar} />
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
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <AnimatedPressable
        style={[styles.seminarListItem, { backgroundColor: themeColors.card }, animatedStyle]}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <View style={styles.seminarListCover}>
          {seminar.cover_image ? (
            <Image source={{ uri: seminar.cover_image }} style={styles.seminarListImage} />
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
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  title: {
    ...typography.headlineLarge,
    fontWeight: '700',
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
    borderRadius: borderRadius.lg,
    gap: spacing[3],
  },
  searchBarTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    height: 44,
    borderRadius: borderRadius.lg,
    gap: spacing[3],
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    height: '100%',
  },
  searchPlaceholder: {
    ...typography.bodyMedium,
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
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  filterChipText: {
    ...typography.labelMedium,
    fontWeight: '600',
  },

  // Quick Access Grid
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  quickAccessCard: {
    width: (width - spacing[4] * 2 - spacing[2]) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    height: 56,
  },
  quickAccessImage: {
    width: 56,
    height: 56,
  },
  quickAccessIcon: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAccessInfo: {
    flex: 1,
    paddingHorizontal: spacing[3],
  },
  quickAccessTitle: {
    ...typography.labelMedium,
    fontWeight: '700',
  },

  // Shuffle
  shuffleSection: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
  },
  shuffleButtonText: {
    ...typography.labelLarge,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Section
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...typography.titleLarge,
    fontWeight: '700',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    ...typography.labelMedium,
  },
  horizontalList: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },

  // Album Card
  albumCard: {
    width: 150,
  },
  albumCoverContainer: {
    position: 'relative',
    marginBottom: spacing[2],
  },
  albumCover: {
    width: 150,
    height: 150,
    borderRadius: borderRadius.lg,
  },
  albumPlayButton: {
    position: 'absolute',
    bottom: spacing[2],
    right: spacing[2],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumTitle: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  albumArtist: {
    ...typography.labelSmall,
    marginTop: 2,
  },

  // Speaker Card
  speakerCard: {
    alignItems: 'center',
    width: 110,
  },
  speakerAvatarContainer: {
    marginBottom: spacing[2],
  },
  speakerAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  speakerAvatarPlaceholder: {
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerName: {
    ...typography.labelMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
  speakerSermons: {
    ...typography.labelSmall,
    textAlign: 'center',
  },

  // Seminar Card
  seminarCard: {
    width: 160,
  },
  seminarCoverContainer: {
    marginBottom: spacing[2],
  },
  seminarCover: {
    width: 160,
    height: 100,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seminarTitle: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  seminarCount: {
    ...typography.labelSmall,
    marginTop: 2,
  },

  // List Section
  listSection: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },

  // Sermon List Item
  sermonListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    borderRadius: borderRadius.lg,
    gap: spacing[3],
  },
  sermonCover: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  sermonCoverImage: {
    width: '100%',
    height: '100%',
  },
  sermonPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sermonInfo: {
    flex: 1,
  },
  sermonTitle: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  sermonMeta: {
    ...typography.labelSmall,
    marginTop: 2,
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
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  speakerGridInfo: {
    flex: 1,
  },
  speakerGridName: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  speakerGridCount: {
    ...typography.labelSmall,
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
    width: 70,
    height: 50,
    borderRadius: borderRadius.md,
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
    fontWeight: '600',
  },
  seminarListMeta: {
    ...typography.labelSmall,
    marginTop: 2,
  },
});
