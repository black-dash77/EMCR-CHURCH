import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';

import { useNavigationLock } from '@/hooks/useNavigationLock';
import {
  ArrowLeft,
  Play,
  Shuffle,
  ListMusic,
  Clock,
  Heart,
  Trash2,
  MoreVertical,
  Music,
  GripVertical,
  ListPlus,
  Plus,
} from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddToPlaylistModal, AddSermonsModal } from '@/components';
import { sermonsApi } from '@/services/api';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useUserStore } from '@/stores/useUserStore';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Playlist, Sermon } from '@/types';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.3;

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { navigateTo, router } = useNavigationLock();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const { playlists, removeFromPlaylist, reorderPlaylist } = useUserStore();
  const { setCurrentSermon, setQueue, setIsPlaying, setShuffle } = usePlayerStore();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuSermon, setMenuSermon] = useState<Sermon | null>(null);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [selectedSermonForPlaylist, setSelectedSermonForPlaylist] = useState<Sermon | null>(null);
  const [addSermonsModalVisible, setAddSermonsModalVisible] = useState(false);

  useEffect(() => {
    const foundPlaylist = playlists.find((p) => p.id === id);
    setPlaylist(foundPlaylist || null);
  }, [id, playlists]);

  useEffect(() => {
    const loadSermons = async () => {
      if (!playlist) return;

      try {
        const allSermons = await sermonsApi.getAll();
        const playlistSermons = playlist.sermonIds
          .map((sermonId) => allSermons.find((s) => s.id === sermonId))
          .filter((s): s is Sermon => s !== undefined);
        setSermons(playlistSermons);
      } catch (error) {
        console.error('Error loading sermons:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSermons();
  }, [playlist]);

  const getTotalDuration = () => {
    const total = sermons.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const hours = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayAll = () => {
    // Filter only sermons with audio
    const audioSermons = sermons.filter(s => s.audio_url);
    if (audioSermons.length === 0) {
      // If no audio sermons, open first sermon's detail page
      if (sermons.length > 0) {
        navigateTo(`/sermon/${sermons[0].id}`);
      }
      return;
    }
    setShuffle(false);
    setQueue(audioSermons);
    setCurrentSermon(audioSermons[0]);
    setIsPlaying(true);
  };

  const handleShufflePlay = () => {
    // Filter only sermons with audio
    const audioSermons = sermons.filter(s => s.audio_url);
    if (audioSermons.length === 0) {
      if (sermons.length > 0) {
        navigateTo(`/sermon/${sermons[0].id}`);
      }
      return;
    }
    setShuffle(true);
    const shuffled = [...audioSermons].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentSermon(shuffled[0]);
    setIsPlaying(true);
  };

  const handlePlaySermon = (sermon: Sermon, index: number) => {
    // If sermon has no audio but has YouTube/video, go to detail page
    if (!sermon.audio_url && (sermon.youtube_url || sermon.video_url)) {
      navigateTo(`/sermon/${sermon.id}`);
      return;
    }
    if (!sermon.audio_url) {
      navigateTo(`/sermon/${sermon.id}`);
      return;
    }
    // Filter only audio sermons for the queue
    const audioSermons = sermons.filter(s => s.audio_url);
    setQueue(audioSermons);
    setCurrentSermon(sermon);
    setIsPlaying(true);
  };

  const handleRemoveFromPlaylist = (sermon: Sermon) => {
    if (!playlist) return;

    Alert.alert(
      'Retirer de la playlist',
      `Retirer "${sermon.title}" de cette playlist ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => {
            removeFromPlaylist(playlist.id, sermon.id);
            setMenuSermon(null);
          },
        },
      ]
    );
  };

  const handleAddToPlaylist = (sermon: Sermon) => {
    setSelectedSermonForPlaylist(sermon);
    setMenuSermon(null);
    setPlaylistModalVisible(true);
  };

  if (!playlist) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: themeColors.background }]}>
        <ListMusic size={48} color={themeColors.textTertiary} />
        <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
          Playlist non trouvee
        </Text>
        <Pressable
          style={[styles.backButtonAlt, { backgroundColor: colors.primary[500] }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={[colors.primary[500], colors.primary[700]]}
            style={styles.heroGradient}
          >
            <ListMusic size={64} color="rgba(255,255,255,0.6)" />
          </LinearGradient>

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', themeColors.background]}
            locations={[0, 0.5, 1]}
            style={styles.heroOverlay}
          />

          {/* Back Button */}
          <Pressable
            style={[styles.backButton, { top: insets.top + spacing[2] }]}
            onPress={() => router.back()}
          >
            <View style={styles.backButtonInner}>
              <ArrowLeft size={20} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* Playlist Info */}
          <View style={[styles.heroContent, { bottom: spacing[4] }]}>
            <Animated.Text
              entering={FadeIn.delay(100).duration(400)}
              style={styles.playlistName}
              numberOfLines={2}
            >
              {playlist.name}
            </Animated.Text>

            <Animated.View
              entering={FadeIn.delay(200).duration(400)}
              style={styles.metaRow}
            >
              <Text style={styles.metaText}>
                {sermons.length} predication{sermons.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{getTotalDuration()}</Text>
            </Animated.View>
          </View>
        </View>

        {/* Action Buttons */}
        {sermons.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400).springify()}
            style={styles.actionsContainer}
          >
            <Pressable
              style={({ pressed }) => [
                styles.shuffleButton,
                {
                  backgroundColor: themeColors.surface,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={handleShufflePlay}
            >
              <Shuffle size={20} color={themeColors.text} />
              <Text style={[styles.shuffleText, { color: themeColors.text }]}>
                Aleatoire
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.playAllButton,
                { opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handlePlayAll}
            >
              <LinearGradient
                colors={colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.playAllGradient}
              >
                <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.playAllText}>Lire tout</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Add Button */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400).springify()}
          style={styles.addButtonContainer}
        >
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              {
                backgroundColor: themeColors.card,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={() => setAddSermonsModalVisible(true)}
          >
            <Plus size={20} color={colors.primary[500]} />
            <Text style={[styles.addButtonText, { color: themeColors.text }]}>
              Ajouter des predications
            </Text>
          </Pressable>
        </Animated.View>

        {/* Sermons List */}
        <View style={styles.sermonsContainer}>
          {sermons.length === 0 && !loading ? (
            <Animated.View
              entering={FadeIn.delay(200).duration(400)}
              style={styles.emptyContainer}
            >
              <Music size={40} color={themeColors.textTertiary} />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                Cette playlist est vide
              </Text>
              <Text style={[styles.emptySubtext, { color: themeColors.textTertiary }]}>
                Appuyez sur le bouton ci-dessus pour ajouter des predications
              </Text>
            </Animated.View>
          ) : (
            sermons.map((sermon, index) => (
              <Animated.View
                key={sermon.id}
                entering={FadeInDown.delay(150 + index * 50).duration(400).springify()}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.sermonItem,
                    {
                      backgroundColor: themeColors.card,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                  onPress={() => handlePlaySermon(sermon, index)}
                >
                  {/* Thumbnail */}
                  <View style={styles.thumbnail}>
                    {sermon.cover_image ? (
                      <Image
                        source={{ uri: sermon.cover_image }}
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
                      numberOfLines={2}
                    >
                      {sermon.title}
                    </Text>
                    <View style={styles.sermonMeta}>
                      <Text
                        style={[styles.sermonSpeaker, { color: themeColors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {sermon.speaker}
                      </Text>
                      {sermon.duration_seconds && (
                        <>
                          <Text style={[styles.metaDot, { color: themeColors.textTertiary }]}>
                            •
                          </Text>
                          <Text style={[styles.sermonDuration, { color: themeColors.textTertiary }]}>
                            {formatDuration(sermon.duration_seconds)}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Menu Button */}
                  <Pressable
                    style={styles.menuButton}
                    onPress={() => setMenuSermon(sermon)}
                  >
                    <MoreVertical size={18} color={themeColors.textSecondary} />
                  </Pressable>
                </Pressable>
              </Animated.View>
            ))
          )}
        </View>

        {/* Bottom Padding */}
        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      {/* Menu Modal */}
      {menuSermon && (
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setMenuSermon(null)}
          />
          <Animated.View
            entering={FadeInDown.duration(300).springify()}
            style={[styles.menuModal, { backgroundColor: themeColors.card }]}
          >
            <Text
              style={[styles.menuTitle, { color: themeColors.text }]}
              numberOfLines={2}
            >
              {menuSermon.title}
            </Text>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuSermon(null);
                router.push(`/sermon/${menuSermon.id}`);
              }}
            >
              <Music size={20} color={themeColors.text} />
              <Text style={[styles.menuItemText, { color: themeColors.text }]}>
                Voir les details
              </Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => handleAddToPlaylist(menuSermon)}
            >
              <ListPlus size={20} color={themeColors.text} />
              <Text style={[styles.menuItemText, { color: themeColors.text }]}>
                Ajouter a une playlist
              </Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => handleRemoveFromPlaylist(menuSermon)}
            >
              <Trash2 size={20} color={colors.semantic.error} />
              <Text style={[styles.menuItemText, { color: colors.semantic.error }]}>
                Retirer de la playlist
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        visible={playlistModalVisible}
        onClose={() => {
          setPlaylistModalVisible(false);
          setSelectedSermonForPlaylist(null);
        }}
        sermonId={selectedSermonForPlaylist?.id || ''}
        sermonTitle={selectedSermonForPlaylist?.title}
      />

      {/* Add Sermons Modal */}
      <AddSermonsModal
        visible={addSermonsModalVisible}
        onClose={() => setAddSermonsModalVisible(false)}
        playlistId={id || ''}
        playlistName={playlist?.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[4],
  },
  errorText: {
    ...typography.bodyLarge,
  },
  backButtonAlt: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    marginTop: spacing[4],
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroContainer: {
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  heroGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    left: spacing[4],
    zIndex: 10,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
  },
  playlistName: {
    ...typography.headlineMedium,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing[2],
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.8)',
  },
  metaDot: {
    marginHorizontal: spacing[2],
    color: 'rgba(255,255,255,0.6)',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  shuffleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
  },
  shuffleText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  playAllButton: {
    flex: 1,
  },
  playAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
  },
  playAllText: {
    color: '#FFFFFF',
    ...typography.labelLarge,
    fontWeight: '600',
  },
  addButtonContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
  },
  addButtonText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  sermonsContainer: {
    paddingHorizontal: spacing[4],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing[10],
  },
  emptyText: {
    ...typography.bodyLarge,
    marginTop: spacing[4],
  },
  emptySubtext: {
    ...typography.bodySmall,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  sermonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
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
    ...typography.titleSmall,
    fontWeight: '600',
    marginBottom: 4,
  },
  sermonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sermonSpeaker: {
    ...typography.labelSmall,
    flexShrink: 1,
  },
  sermonDuration: {
    ...typography.labelSmall,
  },
  menuButton: {
    padding: spacing[2],
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuModal: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing[5],
    paddingBottom: spacing[8],
  },
  menuTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  menuItemText: {
    ...typography.bodyLarge,
  },
});
