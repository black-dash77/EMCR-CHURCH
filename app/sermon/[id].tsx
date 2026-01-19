import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Play,
  Pause,
  Heart,
  Share2,
  Clock,
  Calendar,
  User,
  ListPlus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { sermonsApi } from '@/services/api';
import { useAudioStore } from '@/stores/useAudioStore';
import type { Sermon } from '@/types';

const { width } = Dimensions.get('window');

export default function SermonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);

  const { currentSermon, isPlaying, playSermon, togglePlayPause } = useAudioStore();

  const isCurrentSermon = currentSermon?.id === id;
  const isSermonPlaying = isCurrentSermon && isPlaying;

  useEffect(() => {
    const fetchSermon = async () => {
      if (!id) return;
      try {
        const data = await sermonsApi.getById(id);
        setSermon(data);
      } catch (error) {
        console.error('Error fetching sermon:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSermon();
  }, [id]);

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!sermon) return;

    if (isCurrentSermon) {
      await togglePlayPause();
    } else {
      await playSermon(sermon);
    }
  };

  const handleShare = async () => {
    if (!sermon) return;
    try {
      await Share.share({
        title: sermon.title,
        message: `Écoutez "${sermon.title}" par ${sermon.speaker} sur l'app EMCR Church`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}min`;
    }
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

  if (loading || !sermon) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.headerImage}>
          {sermon.cover_image ? (
            <Image
              source={{ uri: sermon.cover_image }}
              style={styles.coverImage}
            />
          ) : (
            <LinearGradient
              colors={[colors.primary[400], colors.primary[700]]}
              style={styles.coverImage}
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.headerGradient}
          />

          {/* Back Button */}
          <SafeAreaView style={styles.headerButtons} edges={['top']}>
            <Pressable
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={28} color="#FFFFFF" />
            </Pressable>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Tags */}
          {sermon.tags && sermon.tags.length > 0 && (
            <View style={styles.tags}>
              {sermon.tags.map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: colors.primary[100] }]}
                >
                  <Text style={[styles.tagText, { color: colors.primary[600] }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Title & Speaker */}
          <Text style={[styles.title, { color: themeColors.text }]}>
            {sermon.title}
          </Text>

          <View style={styles.metadata}>
            <View style={styles.metaItem}>
              <User size={16} color={themeColors.textSecondary} />
              <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
                {sermon.speaker}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={16} color={themeColors.textSecondary} />
              <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
                {formatDate(sermon.date)}
              </Text>
            </View>
            {sermon.duration_seconds && (
              <View style={styles.metaItem}>
                <Clock size={16} color={themeColors.textSecondary} />
                <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
                  {formatDuration(sermon.duration_seconds)}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.playButton, { backgroundColor: colors.primary[500] }]}
              onPress={handlePlayPause}
            >
              {isSermonPlaying ? (
                <Pause size={24} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
              )}
              <Text style={styles.playButtonText}>
                {isSermonPlaying ? 'Pause' : 'Écouter'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.iconButton, { backgroundColor: themeColors.surface }]}
            >
              <Heart size={22} color={themeColors.text} />
            </Pressable>

            <Pressable
              style={[styles.iconButton, { backgroundColor: themeColors.surface }]}
            >
              <ListPlus size={22} color={themeColors.text} />
            </Pressable>

            <Pressable
              style={[styles.iconButton, { backgroundColor: themeColors.surface }]}
              onPress={handleShare}
            >
              <Share2 size={22} color={themeColors.text} />
            </Pressable>
          </View>

          {/* Description */}
          {sermon.description && (
            <View style={styles.descriptionSection}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Description
              </Text>
              <Text style={[styles.description, { color: themeColors.textSecondary }]}>
                {sermon.description}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
  },
  headerImage: {
    width: width,
    height: width,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing[4],
    marginTop: spacing[2],
  },
  content: {
    padding: spacing[4],
    marginTop: -spacing[8],
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  tag: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  tagText: {
    ...typography.labelSmall,
  },
  title: {
    ...typography.headlineSmall,
    marginBottom: spacing[3],
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    marginBottom: spacing[5],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  metaText: {
    ...typography.bodySmall,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  playButtonText: {
    ...typography.labelLarge,
    color: '#FFFFFF',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionSection: {
    marginTop: spacing[2],
  },
  sectionTitle: {
    ...typography.titleMedium,
    marginBottom: spacing[2],
  },
  description: {
    ...typography.bodyMedium,
    lineHeight: 24,
  },
});
