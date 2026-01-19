import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Pressable,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { ChevronLeft, GripVertical, Play, Trash2, ListMusic } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { useAudioStore } from '@/stores/useAudioStore';
import type { Sermon } from '@/types';

export default function QueueScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const {
    queue,
    currentIndex,
    currentSermon,
    playSermon,
    removeFromQueue,
    clearQueue,
  } = useAudioStore();

  const handleDragEnd = ({ data }: { data: Sermon[] }) => {
    // TODO: Implement reorder in store
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<Sermon>) => {
    const index = getIndex();
    const isCurrentSermon = currentSermon?.id === item.id;
    const isPlayed = index !== undefined && index < currentIndex;

    return (
      <ScaleDecorator>
        <Pressable
          style={[
            styles.queueItem,
            { backgroundColor: isActive ? themeColors.surface : themeColors.card },
            isCurrentSermon && styles.currentItem,
          ]}
          onLongPress={drag}
          onPress={() => playSermon(item, false)}
        >
          <Pressable onLongPress={drag} style={styles.dragHandle}>
            <GripVertical size={20} color={themeColors.textTertiary} />
          </Pressable>

          <View style={styles.itemCover}>
            {item.cover_image ? (
              <Image source={{ uri: item.cover_image }} style={styles.coverImage} />
            ) : (
              <LinearGradient
                colors={[colors.primary[400], colors.primary[600]]}
                style={styles.coverImage}
              />
            )}
            {isCurrentSermon && (
              <View style={styles.playingOverlay}>
                <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.itemInfo}>
            <Text
              style={[
                styles.itemTitle,
                {
                  color: isCurrentSermon
                    ? colors.primary[500]
                    : isPlayed
                      ? themeColors.textTertiary
                      : themeColors.text,
                },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.itemSpeaker,
                { color: isPlayed ? themeColors.textTertiary : themeColors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {item.speaker}
            </Text>
          </View>

          <Pressable
            style={styles.removeButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (index !== undefined) {
                removeFromQueue(index);
              }
            }}
          >
            <Trash2 size={18} color={themeColors.textTertiary} />
          </Pressable>
        </Pressable>
      </ScaleDecorator>
    );
  };

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
        <Text style={[styles.title, { color: themeColors.text }]}>File d'attente</Text>
        {queue.length > 0 ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              clearQueue();
            }}
            style={styles.clearButton}
          >
            <Trash2 size={20} color={colors.semantic.error} />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {/* Queue Count */}
      {queue.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={[styles.countText, { color: themeColors.textSecondary }]}>
            {queue.length} prédication{queue.length > 1 ? 's' : ''} dans la file
          </Text>
        </View>
      )}

      {/* Queue List */}
      {queue.length > 0 ? (
        <DraggableFlatList
          data={queue}
          onDragEnd={handleDragEnd}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <ListMusic size={48} color={themeColors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
            File d'attente vide
          </Text>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            Ajoutez des prédications à la file d'attente pour les écouter ensuite
          </Text>
        </View>
      )}
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
  clearButton: {
    padding: spacing[2],
  },
  countContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  countText: {
    ...typography.bodySmall,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: 120,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
  },
  currentItem: {
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  dragHandle: {
    padding: spacing[2],
  },
  itemCover: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  playingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 75, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  itemTitle: {
    ...typography.titleSmall,
  },
  itemSpeaker: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  removeButton: {
    padding: spacing[2],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  emptyTitle: {
    ...typography.titleMedium,
  },
  emptyText: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
});
