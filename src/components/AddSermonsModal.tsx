import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Search,
  Check,
  Music,
} from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  Image,
  useColorScheme,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { sermonsApi } from '@/services/api';
import { useUserStore } from '@/stores/useUserStore';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Sermon } from '@/types';

interface AddSermonsModalProps {
  visible: boolean;
  onClose: () => void;
  playlistId: string;
  playlistName?: string;
}

export function AddSermonsModal({
  visible,
  onClose,
  playlistId,
  playlistName,
}: AddSermonsModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const { playlists, addToPlaylist, removeFromPlaylist } = useUserStore();
  const playlist = playlists.find(p => p.id === playlistId);

  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadSermons();
    }
  }, [visible]);

  const loadSermons = async () => {
    try {
      setLoading(true);
      const data = await sermonsApi.getAll();
      setSermons(data);
    } catch (error) {
      console.error('Error loading sermons:', error);
    } finally {
      setLoading(false);
    }
  };

  const isInPlaylist = (sermonId: string) => {
    return playlist?.sermonIds.includes(sermonId) || false;
  };

  const toggleSermon = (sermonId: string) => {
    if (isInPlaylist(sermonId)) {
      removeFromPlaylist(playlistId, sermonId);
    } else {
      addToPlaylist(playlistId, sermonId);
    }
  };

  const filteredSermons = sermons.filter(sermon => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sermon.title.toLowerCase().includes(query) ||
      sermon.speaker.toLowerCase().includes(query)
    );
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const selectedCount = playlist?.sermonIds.length || 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color={themeColors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
              Ajouter des predications
            </Text>
            {playlistName && (
              <Text
                style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}
                numberOfLines={1}
              >
                {playlistName}
              </Text>
            )}
          </View>
          <Pressable onPress={onClose} style={styles.doneButton}>
            <Text style={[styles.doneButtonText, { color: colors.primary[500] }]}>
              OK
            </Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.searchBar, { backgroundColor: themeColors.card }]}>
            <Search size={20} color={themeColors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Rechercher une predication..."
              placeholderTextColor={themeColors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color={themeColors.textTertiary} />
              </Pressable>
            ) : null}
          </View>
          {selectedCount > 0 && (
            <Text style={[styles.selectedCount, { color: colors.primary[500] }]}>
              {selectedCount} selectionnee{selectedCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Sermons List */}
        <FlatList
          data={filteredSermons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isSelected = isInPlaylist(item.id);
            return (
              <Animated.View entering={FadeInDown.delay(index * 30).duration(200)}>
                <Pressable
                  style={[
                    styles.sermonItem,
                    {
                      backgroundColor: themeColors.card,
                      borderColor: isSelected ? colors.primary[500] : 'transparent',
                      borderWidth: isSelected ? 2 : 0,
                    },
                  ]}
                  onPress={() => toggleSermon(item.id)}
                >
                  {/* Thumbnail */}
                  <View style={styles.thumbnail}>
                    {item.cover_image ? (
                      <Image
                        source={{ uri: item.cover_image }}
                        style={styles.thumbnailImage}
                      />
                    ) : (
                      <LinearGradient
                        colors={colors.gradients.primarySoft}
                        style={styles.thumbnailImage}
                      >
                        <Music size={16} color="#FFFFFF" />
                      </LinearGradient>
                    )}
                  </View>

                  {/* Sermon Info */}
                  <View style={styles.sermonInfo}>
                    <Text
                      style={[styles.sermonTitle, { color: themeColors.text }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.sermonMeta, { color: themeColors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {item.speaker}
                      {item.duration_seconds ? ` • ${formatDuration(item.duration_seconds)}` : ''}
                    </Text>
                  </View>

                  {/* Checkbox */}
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isSelected ? colors.primary[500] : 'transparent',
                        borderColor: isSelected ? colors.primary[500] : themeColors.border,
                      },
                    ]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" />}
                  </View>
                </Pressable>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Music size={40} color={themeColors.textTertiary} />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                {searchQuery ? 'Aucun resultat' : 'Aucune predication disponible'}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing[4],
  },
  headerTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  doneButton: {
    padding: 4,
  },
  doneButtonText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  searchBar: {
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
  selectedCount: {
    ...typography.labelMedium,
    fontWeight: '600',
    marginTop: spacing[2],
    textAlign: 'center',
  },
  listContent: {
    padding: spacing[4],
    paddingTop: 0,
  },
  sermonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[2],
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginRight: spacing[3],
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sermonInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  sermonTitle: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  sermonMeta: {
    ...typography.labelSmall,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing[10],
  },
  emptyText: {
    ...typography.bodyMedium,
    marginTop: spacing[4],
  },
});
