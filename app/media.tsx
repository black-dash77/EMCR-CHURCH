import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
  Image,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Image as ImageIcon, Video, X } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { photosApi } from '@/services/api';
import type { Photo } from '@/types';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - spacing[4] * 2 - spacing[2] * 2) / 3;

export default function MediaScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

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
      <Image source={{ uri: item.url }} style={styles.photoImage} />
      {item.type === 'video' && (
        <View style={styles.videoOverlay}>
          <Video size={24} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={themeColors.text} />
        </Pressable>
        <Text style={[styles.title, { color: themeColors.text }]}>Médias</Text>
        <View style={{ width: 44 }} />
      </View>

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
        <FlatList
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
              resizeMode="contain"
            />
          )}
          {selectedPhoto?.title && (
            <Text style={styles.modalTitle}>{selectedPhoto.title}</Text>
          )}
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  backButton: {
    padding: spacing[2],
  },
  title: {
    ...typography.titleLarge,
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
