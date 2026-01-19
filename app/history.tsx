import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useColorScheme,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Clock, Play, Trash2 } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { sermonsApi } from '@/services/api';
import { useUserStore } from '@/stores/useUserStore';
import { useAudioStore } from '@/stores/useAudioStore';
import type { Sermon } from '@/types';

export default function HistoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const [allSermons, setAllSermons] = useState<Sermon[]>([]);
  const { getHistorySermons, clearHistory } = useUserStore();
  const { playSermon, currentSermon } = useAudioStore();

  const historySermons = getHistorySermons(allSermons);

  const fetchSermons = useCallback(async () => {
    try {
      const data = await sermonsApi.getAll();
      setAllSermons(data);
    } catch (error) {
      console.error('Error fetching sermons:', error);
    }
  }, []);

  useEffect(() => {
    fetchSermons();
  }, [fetchSermons]);

  const handleClearHistory = () => {
    Alert.alert(
      'Effacer l\'historique',
      'Voulez-vous vraiment effacer tout votre historique d\'écoute ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: clearHistory,
        },
      ]
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const renderSermon = ({ item }: { item: Sermon }) => {
    const isCurrentSermon = currentSermon?.id === item.id;

    return (
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
          <Pressable
            style={styles.playOverlay}
            onPress={() => playSermon(item)}
          >
            <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.sermonInfo}>
          <Text
            style={[
              styles.sermonTitle,
              { color: isCurrentSermon ? colors.primary[500] : themeColors.text },
            ]}
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
          {item.duration_seconds && (
            <View style={styles.duration}>
              <Clock size={12} color={themeColors.textTertiary} />
              <Text style={[styles.durationText, { color: themeColors.textTertiary }]}>
                {formatDuration(item.duration_seconds)}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
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
        <Text style={[styles.title, { color: themeColors.text }]}>Historique</Text>
        {historySermons.length > 0 ? (
          <Pressable onPress={handleClearHistory} style={styles.clearButton}>
            <Trash2 size={20} color={colors.semantic.error} />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <FlatList
        data={historySermons}
        renderItem={renderSermon}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Clock size={48} color={themeColors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              Aucun historique
            </Text>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Les prédications que vous écoutez apparaîtront ici
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
    width: 70,
    height: 70,
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
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
    gap: spacing[1],
  },
  durationText: {
    ...typography.labelSmall,
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
});
