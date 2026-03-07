import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Download,
  Play,
  Clock,
  Trash2,
  CheckCircle,
  HardDrive,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Pressable,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TransparentHeaderBackground, HEADER_HEIGHT } from '@/components/TransparentHeaderBackground';
import { downloadService } from '@/services/downloadService';
import { useCurrentSermon, useAudioActions } from '@/stores/useAudioStore';
import { useDownloadStore, DownloadedSermon } from '@/stores/useDownloadStore';
import { colors, typography, spacing, borderRadius } from '@/theme';

export default function DownloadsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const { getAllDownloads, removeDownload, getTotalSize, clearAllDownloads } = useDownloadStore();
  const currentSermon = useCurrentSermon();
  const { playSermon } = useAudioActions();

  const downloads = getAllDownloads();
  const totalSize = getTotalSize();

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
    });
  };

  const handleDelete = (download: DownloadedSermon) => {
    Alert.alert(
      'Supprimer le téléchargement',
      `Voulez-vous supprimer "${download.sermon.title}" de vos téléchargements ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => removeDownload(download.sermon.id),
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (downloads.length === 0) return;

    Alert.alert(
      'Supprimer tous les téléchargements',
      `Voulez-vous supprimer ${downloads.length} fichier${downloads.length > 1 ? 's' : ''} (${downloadService.formatFileSize(totalSize)}) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: clearAllDownloads,
        },
      ]
    );
  };

  const handlePlay = async (download: DownloadedSermon) => {
    // Create a sermon object with local URI for offline playback
    const offlineSermon = {
      ...download.sermon,
      audio_url: download.localUri,
    };
    await playSermon(offlineSermon);
    router.push('/player');
  };

  const renderDownload = ({ item }: { item: DownloadedSermon }) => {
    const isCurrentSermon = currentSermon?.id === item.sermon.id;

    return (
      <Pressable
        style={[styles.sermonCard, { backgroundColor: themeColors.card }]}
        onPress={() => handlePlay(item)}
      >
        <View style={styles.sermonCover}>
          {item.sermon.cover_image ? (
            <Image source={{ uri: item.sermon.cover_image }} style={styles.sermonImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          ) : (
            <LinearGradient
              colors={[colors.primary[400], colors.primary[600]]}
              style={styles.sermonImage}
            />
          )}
          <View style={styles.playOverlay}>
            <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
          </View>
          <View style={styles.downloadedBadge}>
            <CheckCircle size={14} color="#10B981" fill="#10B981" />
          </View>
        </View>

        <View style={styles.sermonInfo}>
          <Text
            style={[
              styles.sermonTitle,
              { color: isCurrentSermon ? colors.primary[500] : themeColors.text },
            ]}
            numberOfLines={2}
          >
            {item.sermon.title}
          </Text>
          <Text
            style={[styles.sermonSpeaker, { color: themeColors.textSecondary }]}
            numberOfLines={1}
          >
            {item.sermon.speaker}
          </Text>
          <View style={styles.sermonMeta}>
            <View style={styles.fileSizeContainer}>
              <HardDrive size={12} color={themeColors.textTertiary} />
              <Text style={[styles.fileSize, { color: themeColors.textTertiary }]}>
                {downloadService.formatFileSize(item.fileSize)}
              </Text>
            </View>
            {item.sermon.duration_seconds && (
              <View style={styles.duration}>
                <Clock size={12} color={themeColors.textTertiary} />
                <Text style={[styles.durationText, { color: themeColors.textTertiary }]}>
                  {formatDuration(item.sermon.duration_seconds)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Pressable
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Trash2 size={20} color={colors.semantic.error} />
        </Pressable>
      </Pressable>
    );
  };

  const headerTotalHeight = HEADER_HEIGHT + insets.top + 20;

  const ListHeaderComponent = <View style={{ height: headerTotalHeight }} />;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <FlashList
        data={downloads}
        renderItem={renderDownload}
        keyExtractor={(item) => item.sermon.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Download size={48} color={themeColors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              Aucun téléchargement
            </Text>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Téléchargez des prédications pour les écouter hors ligne
            </Text>
          </View>
        }
        ListFooterComponent={
          downloads.length > 0 ? (
            <View style={styles.footer}>
              <View style={styles.storageInfo}>
                <HardDrive size={16} color={themeColors.textSecondary} />
                <Text style={[styles.storageText, { color: themeColors.textSecondary }]}>
                  {downloadService.formatFileSize(totalSize)} utilisés
                </Text>
              </View>
              <Pressable
                style={[styles.clearAllButton, { borderColor: colors.semantic.error }]}
                onPress={handleClearAll}
              >
                <Trash2 size={16} color={colors.semantic.error} />
                <Text style={[styles.clearAllText, { color: colors.semantic.error }]}>
                  Tout supprimer
                </Text>
              </Pressable>
            </View>
          ) : null
        }
      />

      {/* Header Transparent avec gradient */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <TransparentHeaderBackground height={headerTotalHeight + 40} />

        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={28} color={themeColors.text} />
          </Pressable>

          <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.headerTitles}>
            <Text style={[styles.title, { color: themeColors.text }]}>Téléchargements</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              {downloads.length} fichier{downloads.length > 1 ? 's' : ''} hors ligne
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
  downloadedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 2,
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
  fileSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  fileSize: {
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
  deleteButton: {
    padding: spacing[2],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[16],
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
  footer: {
    paddingVertical: spacing[4],
    alignItems: 'center',
    gap: spacing[4],
  },
  storageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  storageText: {
    ...typography.bodySmall,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  clearAllText: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
});
