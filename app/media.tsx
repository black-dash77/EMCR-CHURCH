import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronLeft, Image as ImageIcon, Video, X } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
  Dimensions,
  Modal,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TransparentHeaderBackground, HEADER_HEIGHT } from '@/components/TransparentHeaderBackground';
import { photosApi } from '@/services/api';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Photo } from '@/types';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - spacing[4] * 2 - spacing[2] * 2) / 3;

export default function MediaScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

  const fetchPhotos = useCallback(async () => {
    try {
      const data = await photosApi.getAll();
      setPhotos(data);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPhotos();
    setRefreshing(false);
  }, [fetchPhotos]);

  const filteredPhotos =
    filter === 'all'
      ? photos
      : photos.filter((p) => p.type === filter);

  const renderPhoto = ({ item }: { item: Photo }) => (
    <Pressable
      style={styles.photoItem}
      onPress={() => setSelectedPhoto(item)}
    >
      <Image source={{ uri: item.url }} style={styles.photoImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
      {item.type === 'video' && (
        <View style={styles.videoOverlay}>
          <Video size={24} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );

  const headerTotalHeight = HEADER_HEIGHT + insets.top + 20;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Spacer pour le header */}
      <View style={{ height: headerTotalHeight }} />

      {/* Filters */}
      <View style={styles.filters}>
        {(['all', 'image', 'video'] as const).map((f) => (
          <Pressable
            key={f}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === f ? colors.primary[500] : themeColors.surface,
                borderColor:
                  filter === f ? colors.primary[500] : themeColors.border,
              },
            ]}
            onPress={() => setFilter(f)}
          >
            {f === 'all' && (
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f ? '#FFFFFF' : themeColors.text },
                ]}
              >
                Tous
              </Text>
            )}
            {f === 'image' && (
              <>
                <ImageIcon
                  size={16}
                  color={filter === f ? '#FFFFFF' : themeColors.text}
                />
                <Text
                  style={[
                    styles.filterText,
                    { color: filter === f ? '#FFFFFF' : themeColors.text },
                  ]}
                >
                  Photos
                </Text>
              </>
            )}
            {f === 'video' && (
              <>
                <Video
                  size={16}
                  color={filter === f ? '#FFFFFF' : themeColors.text}
                />
                <Text
                  style={[
                    styles.filterText,
                    { color: filter === f ? '#FFFFFF' : themeColors.text },
                  ]}
                >
                  Vidéos
                </Text>
              </>
            )}
          </Pressable>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.listContainer}>
        <FlashList
          data={filteredPhotos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id}
          numColumns={3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ImageIcon size={48} color={themeColors.textTertiary} />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                Aucun média
              </Text>
            </View>
          }
        />
      </View>

      {/* Lightbox Modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={styles.closeButton}
            onPress={() => setSelectedPhoto(null)}
          >
            <X size={28} color="#FFFFFF" />
          </Pressable>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto.url }}
              style={styles.modalImage}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={200}
            />
          )}
          {selectedPhoto?.title && (
            <Text style={styles.modalTitle}>{selectedPhoto.title}</Text>
          )}
        </View>
      </Modal>

      {/* Header Transparent avec gradient */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <TransparentHeaderBackground height={headerTotalHeight + 40} />

        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={28} color={themeColors.text} />
          </Pressable>

          <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.headerTitles}>
            <Text style={[styles.title, { color: themeColors.text }]}>Médias</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              {photos.length} élément{photos.length > 1 ? 's' : ''}
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
  headerTitles: {
    flex: 1,
    marginLeft: spacing[2],
  },
  backButton: {
    padding: spacing[2],
  },
  title: {
    ...typography.headlineMedium,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[2],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing[1],
  },
  filterText: {
    ...typography.labelMedium,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: 40,
  },
  photoItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: spacing[1],
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[16],
    gap: spacing[3],
  },
  emptyText: {
    ...typography.bodyMedium,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: spacing[2],
  },
  modalImage: {
    width: width,
    height: width,
  },
  modalTitle: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
    textAlign: 'center',
  },
});
