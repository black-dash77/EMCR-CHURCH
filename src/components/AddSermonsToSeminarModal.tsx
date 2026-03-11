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
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { sermonsApi, seminarsApi } from '@/services/api';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Sermon } from '@/types';

interface AddSermonsToSeminarModalProps {
  visible: boolean;
  onClose: () => void;
  seminarId: string;
  seminarName?: string;
  currentSermonIds?: string[];
  onSermonsUpdated: () => void;
}

export function AddSermonsToSeminarModal({
  visible,
  onClose,
  seminarId,
  seminarName,
  currentSermonIds,
  onSermonsUpdated,
}: AddSermonsToSeminarModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentSermonIds || []));
  const [initialSermonIds, setInitialSermonIds] = useState<string[]>(currentSermonIds || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && seminarId) {
      loadData();
    }
  }, [visible, seminarId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all sermons
      const allSermons = await sermonsApi.getAll();
      setSermons(allSermons);

      // If currentSermonIds not provided, load from seminar
      if (!currentSermonIds) {
        const seminarData = await seminarsApi.getWithSermons(seminarId);
        if (seminarData) {
          const sermonIds = seminarData.sermons.map(s => s.id);
          setSelectedIds(new Set(sermonIds));
          setInitialSermonIds(sermonIds);
        }
      } else {
        setSelectedIds(new Set(currentSermonIds));
        setInitialSermonIds(currentSermonIds);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (sermonId: string) => selectedIds.has(sermonId);

  const toggleSermon = (sermonId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sermonId)) {
        newSet.delete(sermonId);
      } else {
        newSet.add(sermonId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentSet = new Set(initialSermonIds);

      // Find sermons to add (in selectedIds but not in current)
      const toAdd = [...selectedIds].filter(id => !currentSet.has(id));

      // Find sermons to remove (in current but not in selectedIds)
      const toRemove = initialSermonIds.filter(id => !selectedIds.has(id));

      // Add new sermons to seminar
      for (const sermonId of toAdd) {
        await seminarsApi.addSermonToSeminar(seminarId, sermonId);
      }

      // Remove sermons from seminar
      for (const sermonId of toRemove) {
        await seminarsApi.removeSermonFromSeminar(sermonId);
      }

      onSermonsUpdated();
      onClose();
    } catch (error) {
    } finally {
      setSaving(false);
    }
  };

  const filteredSermons = sermons.filter(sermon => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sermon.title.toLowerCase().includes(query) ||
      sermon.speaker?.toLowerCase().includes(query)
    );
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const selectedCount = selectedIds.size;
  const hasChanges = selectedIds.size !== initialSermonIds.length ||
    [...selectedIds].some(id => !initialSermonIds.includes(id));

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
            {seminarName && (
              <Text
                style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}
                numberOfLines={1}
              >
                {seminarName}
              </Text>
            )}
          </View>
          <Pressable
            onPress={handleSave}
            style={[styles.doneButton, !hasChanges && styles.doneButtonDisabled]}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : (
              <Text
                style={[
                  styles.doneButtonText,
                  { color: hasChanges ? colors.primary[500] : themeColors.textTertiary },
                ]}
              >
                OK
              </Text>
            )}
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
          </View>
        ) : (
          <FlatList
            data={filteredSermons}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const selected = isSelected(item.id);
              return (
                <Animated.View entering={FadeInDown.delay(index * 30).duration(200)}>
                  <Pressable
                    style={[
                      styles.sermonItem,
                      {
                        backgroundColor: themeColors.card,
                        borderColor: selected ? colors.primary[500] : 'transparent',
                        borderWidth: selected ? 2 : 0,
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
                          contentFit="cover"
                          cachePolicy="memory-disk"
                          transition={200}
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
                          backgroundColor: selected ? colors.primary[500] : 'transparent',
                          borderColor: selected ? colors.primary[500] : themeColors.border,
                        },
                      ]}
                    >
                      {selected && <Check size={14} color="#FFFFFF" />}
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
        )}
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
    minWidth: 40,
    alignItems: 'center',
  },
  doneButtonDisabled: {
    opacity: 0.5,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
