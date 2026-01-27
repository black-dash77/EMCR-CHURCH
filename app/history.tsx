import { LinearGradient } from 'expo-linear-gradient';

import { useNavigationLock } from '@/hooks/useNavigationLock';
import { ChevronLeft, Clock, Play, Trash2 } from 'lucide-react-native';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TransparentHeaderBackground, HEADER_HEIGHT } from '@/components/TransparentHeaderBackground';
import { sermonsApi } from '@/services/api';
import { useAudioStore } from '@/stores/useAudioStore';
import { useUserStore } from '@/stores/useUserStore';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Sermon } from '@/types';

export default function HistoryScreen() {
  const { navigateTo, router } = useNavigationLock();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

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
            onPress={() => {
              if (!item.audio_url && (item.youtube_url || item.video_url)) {
                navigateTo(`/sermon/${item.id}`);
              } else if (item.audio_url) {
                playSermon(item);
              } else {
                navigateTo(`/sermon/${item.id}`);
              }
            }}
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

  const headerTotalHeight = HEADER_HEIGHT + insets.top + 20;

  const ListHeaderComponent = <View style={{ height: headerTotalHeight }} />;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <FlatList
        data={historySermons}
        renderItem={renderSermon}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
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

      {/* Header Transparent avec gradient */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <TransparentHeaderBackground height={headerTotalHeight + 40} />

        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={28} color={themeColors.text} />
          </Pressable>

          <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.headerTitles}>
            <Text style={[styles.title, { color: themeColors.text }]}>Historique</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              {historySermons.length} écoute{historySermons.length > 1 ? 's' : ''}
            </Text>
          </Animated.View>

          {historySermons.length > 0 && (
            <Pressable onPress={handleClearHistory} style={styles.clearButton}>
              <Trash2 size={20} color={colors.semantic.error} />
            </Pressable>
          )}
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
