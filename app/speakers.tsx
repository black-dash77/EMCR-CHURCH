import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Search, User, Mic, ChevronLeft, X } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
  TextInput,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/TabBarBackground';
import { TransparentHeaderBackground, HEADER_HEIGHT } from '@/components/TransparentHeaderBackground';
import { speakersApi } from '@/services/api';
import { colors, typography, spacing, borderRadius, ThemeColors } from '@/theme';
import type { Speaker } from '@/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SpeakersScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [speakers, setSpeakers] = useState<(Speaker & { sermon_count: number })[]>([]);
  const [filteredSpeakers, setFilteredSpeakers] = useState<(Speaker & { sermon_count: number })[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const fetchSpeakers = useCallback(async () => {
    try {
      const data = await speakersApi.getWithSermonCount();
      setSpeakers(data);
      setFilteredSpeakers(data);
    } catch (error) {
      console.error('Error fetching speakers:', error);
    }
  }, []);

  useEffect(() => {
    fetchSpeakers();
  }, [fetchSpeakers]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = speakers.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          (s.ministry && s.ministry.toLowerCase().includes(query))
      );
      setFilteredSpeakers(filtered);
    } else {
      setFilteredSpeakers(speakers);
    }
  }, [searchQuery, speakers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSpeakers();
    setRefreshing(false);
  }, [fetchSpeakers]);

  const headerTotalHeight = HEADER_HEIGHT + insets.top + 80;

  const renderSpeaker = ({ item, index }: { item: Speaker & { sermon_count: number }; index: number }) => (
    <SpeakerCard
      speaker={item}
      index={index}
      themeColors={themeColors}
      onPress={() => router.push(`/speaker/${item.id}`)}
    />
  );

  const ListHeaderComponent = (
    <View style={{ height: headerTotalHeight }} />
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <FlashList
        data={filteredSpeakers}
        renderItem={renderSpeaker}
        keyExtractor={(item) => item.id}
        numColumns={2}
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
            progressViewOffset={headerTotalHeight}
          />
        }
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: themeColors.card }]}>
              <User size={40} color={themeColors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              Aucun orateur trouvé
            </Text>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Essayez de modifier votre recherche
            </Text>
          </Animated.View>
        }
      />

      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <TransparentHeaderBackground height={headerTotalHeight + 40} />

        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={themeColors.text} />
            </Pressable>
            <View style={styles.headerTitles}>
              <Animated.View entering={FadeInDown.duration(500).springify()}>
                <Text style={[styles.title, { color: themeColors.text }]}>Orateurs</Text>
                <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                  {speakers.length} prédicateurs
                </Text>
              </Animated.View>
            </View>
          </View>

          {/* Search */}
          <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.searchContainer}>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: themeColors.card,
                  borderColor: isSearchFocused ? colors.primary[500] : 'transparent',
                },
              ]}
            >
              <Search size={20} color={isSearchFocused ? colors.primary[500] : themeColors.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: themeColors.text }]}
                placeholder="Rechercher un orateur..."
                placeholderTextColor={themeColors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <X size={18} color={themeColors.textTertiary} />
                </Pressable>
              )}
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

function SpeakerCard({
  speaker,
  index,
  themeColors,
  onPress,
}: {
  speaker: Speaker & { sermon_count: number };
  index: number;
  themeColors: ThemeColors;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400).springify()}
      style={styles.cardContainer}
    >
      <AnimatedPressable
        style={[
          styles.speakerCard,
          { backgroundColor: themeColors.card },
          animatedStyle,
        ]}
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <View style={styles.avatarContainer}>
          {speaker.photo_url ? (
            <Image source={{ uri: speaker.photo_url }} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          ) : (
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.avatar}
            >
              <User size={32} color="#FFFFFF" />
            </LinearGradient>
          )}
        </View>

        <Text
          style={[styles.speakerName, { color: themeColors.text }]}
          numberOfLines={2}
        >
          {speaker.name}
        </Text>

        {speaker.ministry && (
          <Text
            style={[styles.speakerMinistry, { color: themeColors.textSecondary }]}
            numberOfLines={1}
          >
            {speaker.ministry}
          </Text>
        )}

        <View style={[styles.sermonBadge, { backgroundColor: colors.primary[500] + '15' }]}>
          <Mic size={12} color={colors.primary[500]} />
          <Text style={[styles.sermonCount, { color: colors.primary[500] }]}>
            {speaker.sermon_count} prédications
          </Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
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
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
  },
  headerTitles: {
    flex: 1,
    marginLeft: spacing[2],
  },
  title: {
    ...typography.headlineMedium,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  searchContainer: {
    marginTop: spacing[4],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    height: 52,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    gap: spacing[3],
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    height: '100%',
  },
  clearButton: {
    padding: spacing[1],
  },
  listContent: {
    paddingHorizontal: spacing[4],
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  cardContainer: {
    width: '48%',
  },
  speakerCard: {
    padding: spacing[4],
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: spacing[3],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerName: {
    ...typography.titleSmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  speakerMinistry: {
    ...typography.bodySmall,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  sermonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    marginTop: spacing[3],
  },
  sermonCount: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[12],
    gap: spacing[3],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  emptyTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
});
