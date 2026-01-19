import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Play, Clock, Heart } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { sermonsApi } from '@/services/api';
import type { Sermon } from '@/types';

export default function SermonsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [filteredSermons, setFilteredSermons] = useState<Sermon[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = [...new Set(sermons.flatMap((s) => s.tags || []))];

  const fetchSermons = useCallback(async () => {
    try {
      const data = await sermonsApi.getAll();
      setSermons(data);
      setFilteredSermons(data);
    } catch (error) {
      console.error('Error fetching sermons:', error);
    }
  }, []);

  useEffect(() => {
    fetchSermons();
  }, [fetchSermons]);

  useEffect(() => {
    let filtered = sermons;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.speaker.toLowerCase().includes(query)
      );
    }

    if (selectedTag) {
      filtered = filtered.filter((s) => s.tags?.includes(selectedTag));
    }

    setFilteredSermons(filtered);
  }, [searchQuery, selectedTag, sermons]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSermons();
    setRefreshing(false);
  }, [fetchSermons]);

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
      year: 'numeric',
    });
  };

  const renderSermon = ({ item }: { item: Sermon }) => (
    <Pressable
      style={[styles.sermonCard, { backgroundColor: themeColors.card }]}
      onPress={() => router.push(`/sermon/${item.id}`)}
    >
      <View style={styles.sermonCover}>
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.sermonImage} />
        ) : (
          <LinearGradient
            colors={[colors.primary[400], colors.primary[600]]}
            style={styles.sermonImage}
          />
        )}
        <View style={styles.playOverlay}>
          <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
        </View>
      </View>

      <View style={styles.sermonInfo}>
        <Text
          style={[styles.sermonTitle, { color: themeColors.text }]}
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
        <View style={styles.sermonMeta}>
          <Text style={[styles.sermonDate, { color: themeColors.textTertiary }]}>
            {formatDate(item.date)}
          </Text>
          {item.duration_seconds && (
            <View style={styles.duration}>
              <Clock size={12} color={themeColors.textTertiary} />
              <Text style={[styles.durationText, { color: themeColors.textTertiary }]}>
                {formatDuration(item.duration_seconds)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Pressable style={styles.favoriteButton}>
        <Heart size={20} color={themeColors.textTertiary} />
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Prédications</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <Search size={20} color={themeColors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Rechercher une prédication..."
            placeholderTextColor={themeColors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <View style={styles.tagsContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['Tous', ...allTags]}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.tagsList}
            renderItem={({ item }) => {
              const isSelected = item === 'Tous' ? !selectedTag : selectedTag === item;
              return (
                <Pressable
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: isSelected
                        ? colors.primary[500]
                        : themeColors.surface,
                      borderColor: isSelected
                        ? colors.primary[500]
                        : themeColors.border,
                    },
                  ]}
                  onPress={() => setSelectedTag(item === 'Tous' ? null : item)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: isSelected ? '#FFFFFF' : themeColors.text },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {/* Sermons List */}
      <FlatList
        data={filteredSermons}
        renderItem={renderSermon}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Aucune prédication trouvée
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  title: {
    ...typography.headlineMedium,
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    height: 44,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
  },
  tagsContainer: {
    marginBottom: spacing[3],
  },
  tagsList: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  tagChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  tagText: {
    ...typography.labelMedium,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: 120,
  },
  sermonCard: {
    flexDirection: 'row',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
    alignItems: 'center',
  },
  sermonCover: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
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
  },
  sermonSpeaker: {
    ...typography.bodySmall,
    marginTop: spacing[1],
  },
  sermonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
    gap: spacing[3],
  },
  sermonDate: {
    ...typography.labelSmall,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  durationText: {
    ...typography.labelSmall,
  },
  favoriteButton: {
    padding: spacing[2],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[10],
  },
  emptyText: {
    ...typography.bodyMedium,
  },
});
