import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Check,
  Plus,
  Share2,
  MoreHorizontal,
  Clock,
  User,
  Smartphone,
  Heart,
  X,
  Download,
  CheckCircle,
  HardDrive,
} from 'lucide-react-native';
import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
  StatusBar,
  ScrollView,
  Modal,
  Alert,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { speakersApi } from '@/services/api';
import { downloadService, DownloadDestination } from '@/services/downloadService';
import {
  useCurrentSermon,
  useIsPlaying,
  usePlaybackProgress,
  usePlaybackSettings,
  useAudioQueue,
  useSleepTimer,
  useAudioActions,
} from '@/stores/useAudioStore';
import { useDownloadStore } from '@/stores/useDownloadStore';
import { useUserStore } from '@/stores/useUserStore';
import { colors } from '@/theme';
import type { PlaybackRate, Speaker, Sermon } from '@/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PLAYBACK_RATES: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// Couleur d'accent pour la section description
const ACCENT_COLOR = '#1DB954';

export function ExpandedPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [speakerSermons, setSpeakerSermons] = useState<Sermon[]>([]);
  const [isFollowing, setIsFollowing] = useState(true);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const scrollY = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isAtTop = useSharedValue(true);

  // Swipe down to dismiss
  const dismissPlayer = () => {
    router.back();
  };

  // Pan gesture for swipe down to dismiss
  const panGesture = Gesture.Pan()
    .activeOffsetY(20) // Activate after 20px vertical movement
    .failOffsetX([-20, 20]) // Fail if horizontal movement detected
    .onUpdate((event) => {
      // Only allow swipe down when at top of scroll
      if (event.translationY > 0 && isAtTop.value) {
        translateY.value = event.translationY * 0.8; // Resistance factor
      }
    })
    .onEnd((event) => {
      if (isAtTop.value && (event.translationY > 100 || event.velocityY > 500)) {
        translateY.value = withTiming(800, { duration: 250 });
        runOnJS(dismissPlayer)();
      } else {
        translateY.value = withSpring(0, { damping: 25, stiffness: 400 });
      }
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const { toggleFavorite, isFavorite } = useUserStore();

  const currentSermon = useCurrentSermon();
  const isPlaying = useIsPlaying();
  const { currentTime, duration } = usePlaybackProgress();
  const { playbackRate, repeatMode, shuffleEnabled } = usePlaybackSettings();
  const { queue } = useAudioQueue();
  const { sleepTimerRemaining } = useSleepTimer();
  const {
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    setPlaybackRate,
    toggleRepeat,
    toggleShuffle,
    setSleepTimer,
    playSermon,
  } = useAudioActions();

  const { isDownloaded, activeDownloads } = useDownloadStore();
  const isCurrentDownloaded = currentSermon ? isDownloaded(currentSermon.id) : false;
  const currentDownloadProgress = currentSermon ? activeDownloads[currentSermon.id] : null;

  // Fetch speaker info and their sermons
  useEffect(() => {
    let isMounted = true;

    const fetchSpeakerData = async () => {
      if (!currentSermon?.speaker_id) {
        if (isMounted) {
          setSpeaker(null);
          setSpeakerSermons([]);
        }
        return;
      }

      try {
        const data = await speakersApi.getWithSermons(currentSermon.speaker_id);
        if (isMounted && data) {
          setSpeaker(data.speaker);
          setSpeakerSermons(data.sermons.filter((s) => s.id !== currentSermon.id).slice(0, 6));
        }
      } catch (_error) {
        if (isMounted) {
        }
      }
    };

    fetchSpeakerData();

    return () => {
      isMounted = false;
    };
  }, [currentSermon?.speaker_id, currentSermon?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSleepTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await togglePlayPause();
  };

  const handlePrevious = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await playPrevious();
  };

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await playNext();
  };

  const handleSeek = async (value: number) => {
    await seek(value);
  };

  const cyclePlaybackRate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    await setPlaybackRate(PLAYBACK_RATES[nextIndex]);
  };

  const cycleSleepTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const timers = [null, 5, 10, 15, 30, 45, 60];
    const currentIndex = sleepTimerRemaining
      ? timers.findIndex((t) => t && sleepTimerRemaining <= t * 60)
      : 0;
    const nextIndex = (currentIndex + 1) % timers.length;
    setSleepTimer(timers[nextIndex]);
  };

  const handleToggleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleShuffle();
  };

  const handleToggleRepeat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleRepeat();
  };

  const handleToggleFavorite = () => {
    if (currentSermon) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleFavorite(currentSermon.id);
    }
  };

  const handleShare = async () => {
    if (!currentSermon) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // URL de la page de redirection avec l'ID du sermon
    const shareUrl = `https://emcr-church.netlify.app/sermon/${currentSermon.id}`;

    try {
      await Share.share({
        message: `🎧 ${currentSermon.title} - ${currentSermon.speaker}\n\nÉcoute cette prédication sur l'app EMCR Church!\n\n${shareUrl}`,
        url: shareUrl, // Pour iOS
      });
    } catch (_error) {
    }
  };

  const handleDownloadPress = () => {
    if (!currentSermon?.audio_url) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowOptionsMenu(false);
    setShowDownloadMenu(true);
  };

  const handleDownload = async (destination: DownloadDestination) => {
    if (!currentSermon?.audio_url) return;

    setShowDownloadMenu(false);
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const result = await downloadService.download(currentSermon, {
        destination,
        onProgress: setDownloadProgress,
      });

      if (result.success) {
        const message = `"${currentSermon.title}" est maintenant disponible hors ligne.\n\nRetrouvez vos téléchargements dans Plus → Téléchargements.`;
        Alert.alert('Téléchargement terminé', message, [{ text: 'OK' }]);
      } else {
        Alert.alert(
          'Erreur de téléchargement',
          result.error || 'Une erreur est survenue. Veuillez réessayer.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Erreur de téléchargement',
        'Une erreur est survenue lors du téléchargement. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handlePlaySermon = async (sermon: Sermon) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await playSermon(sermon, true);
  };

  // Animated scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      isAtTop.value = event.contentOffset.y <= 5;
    },
  });

  // Cover scale animation based on scroll
  const coverAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [0, 200], [1, 0.7], Extrapolation.CLAMP);
    return {
      transform: [{ scale }],
    };
  });

  if (!currentSermon) return null;

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;
  const isRepeatActive = repeatMode !== 'off';
  const isCurrentFavorite = isFavorite(currentSermon.id);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Create a native scroll gesture
  const scrollGesture = Gesture.Native();

  // Combine pan and scroll - pan takes priority when at top and swiping down
  const composedGesture = Gesture.Simultaneous(panGesture, scrollGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <StatusBar barStyle="light-content" />

        {/* Drag Handle */}
        <View style={[styles.dragHandleContainer, { paddingTop: insets.top }]}>
          <View style={styles.dragHandle} />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ChevronDown size={28} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>En cours de lecture</Text>
            <Pressable onPress={() => setShowOptionsMenu(true)} hitSlop={12}>
              <MoreHorizontal size={24} color="#fff" />
            </Pressable>
          </View>
        </View>

        <Animated.ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          bounces={false}
        >

        {/* Album Cover */}
        <Animated.View style={[styles.coverContainer, coverAnimatedStyle]}>
          <View style={styles.coverWrapper}>
            {currentSermon.cover_image ? (
              <Image source={{ uri: currentSermon.cover_image }} style={styles.coverImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
            ) : (
              <LinearGradient
                colors={[colors.primary[400], colors.primary[700]]}
                style={styles.coverImage}
              />
            )}
          </View>
        </Animated.View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <View style={styles.trackTextContainer}>
            <Text style={styles.trackTitle} numberOfLines={2}>
              {currentSermon.title}
            </Text>
            <Pressable onPress={() => speaker && router.push(`/speaker/${speaker.id}`)}>
              <Text style={styles.trackArtist}>{currentSermon.speaker}</Text>
            </Pressable>
          </View>
          <View style={styles.trackActions}>
            <Pressable
              onPress={handleDownloadPress}
              style={styles.actionBtn}
              disabled={isDownloading || currentDownloadProgress?.status === 'downloading'}
            >
              {isCurrentDownloaded ? (
                <CheckCircle size={22} color="#1DB954" />
              ) : isDownloading || currentDownloadProgress?.status === 'downloading' ? (
                <Download size={22} color="#1DB954" />
              ) : (
                <Download size={22} color="#888" />
              )}
            </Pressable>
            <Pressable
              onPress={handleToggleFavorite}
              style={styles.actionBtn}
            >
              <Heart
                size={24}
                color={isCurrentFavorite ? '#1DB954' : '#888'}
                fill={isCurrentFavorite ? '#1DB954' : 'transparent'}
              />
            </Pressable>
            <Pressable
              onPress={handleShare}
              style={styles.actionBtn}
            >
              <Share2 size={22} color="#888" />
            </Pressable>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={currentTime}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor="#fff"
            maximumTrackTintColor="rgba(255,255,255,0.2)"
            thumbTintColor="#fff"
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>-{formatTime(Math.max(0, duration - currentTime))}</Text>
          </View>
        </View>

        {/* Main Controls */}
        <View style={styles.controls}>
          <Pressable onPress={handleToggleShuffle}>
            <Shuffle size={24} color={shuffleEnabled ? '#1DB954' : '#888'} />
          </Pressable>
          <Pressable onPress={handlePrevious}>
            <SkipBack size={36} color="#ccc" fill="#ccc" />
          </Pressable>
          <Pressable onPress={handlePlayPause} style={styles.playBtn}>
            {isPlaying ? (
              <Pause size={32} color="#000" fill="#000" />
            ) : (
              <Play size={32} color="#000" fill="#000" style={{ marginLeft: 4 }} />
            )}
          </Pressable>
          <Pressable onPress={handleNext}>
            <SkipForward size={36} color="#fff" fill="#fff" />
          </Pressable>
          <Pressable onPress={handleToggleRepeat}>
            <RepeatIcon size={24} color={isRepeatActive ? '#1DB954' : '#888'} />
          </Pressable>
        </View>

        {/* Bottom Icons Row */}
        <View style={styles.bottomIcons}>
          <Pressable>
            <Smartphone size={20} color="#888" />
          </Pressable>
          <Pressable onPress={cycleSleepTimer} style={styles.timerContainer}>
            <Clock size={20} color={sleepTimerRemaining ? '#1DB954' : '#888'} />
            {sleepTimerRemaining && (
              <Text style={styles.timerText}>{formatSleepTimer(sleepTimerRemaining)}</Text>
            )}
          </Pressable>
          <Pressable onPress={cyclePlaybackRate}>
            <Text style={[styles.speedText, playbackRate !== 1 && styles.speedTextActive]}>
              {playbackRate}x
            </Text>
          </Pressable>
          <Pressable onPress={handleShare}>
            <Share2 size={20} color="#888" />
          </Pressable>
        </View>

        {/* Description Section - Spotify Lyrics Style */}
        {currentSermon.description && (
          <View style={[styles.lyricsContainer, { backgroundColor: ACCENT_COLOR }]}>
            <Text style={styles.lyricsLabel}>Aperçu de la description</Text>
            <Text style={styles.lyricLine}>{currentSermon.description}</Text>
            <Pressable style={styles.lyricsBtn}>
              <Text style={styles.lyricsBtnText}>Voir plus</Text>
            </Pressable>
          </View>
        )}

        {/* Discover Section */}
        {speakerSermons.length > 0 && (
          <View style={styles.discoverContainer}>
            <Text style={styles.discoverTitle}>Découvrez {currentSermon.speaker}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.discoverScroll}
            >
              {speakerSermons.map((sermon, index) => (
                <DiscoverCard
                  key={sermon.id}
                  sermon={sermon}
                  isActive={false}
                  label={
                    index === 0
                      ? `Titres par ${currentSermon.speaker.split(' ')[0]}`
                      : index === 1
                        ? `Titres similaires à ${currentSermon.speaker.split(' ')[0]}...`
                        : `Titres similaires`
                  }
                  onPress={() => handlePlaySermon(sermon)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* About Artist Section */}
        {speaker && (
          <View style={styles.aboutContainer}>
            <Text style={styles.aboutLabel}>À propos de l'orateur</Text>
            <View style={styles.aboutImageContainer}>
              {speaker.photo_url ? (
                <Image source={{ uri: speaker.photo_url }} style={styles.aboutImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
              ) : (
                <LinearGradient colors={['#333', '#1a1a1a']} style={styles.aboutImage}>
                  <User size={80} color="rgba(255,255,255,0.3)" />
                </LinearGradient>
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                style={styles.aboutGradient}
              />
            </View>
            <View style={styles.aboutContent}>
              <View style={styles.aboutHeader}>
                <Text style={styles.aboutName}>{speaker.name}</Text>
                <Pressable
                  onPress={() => setIsFollowing(!isFollowing)}
                  style={[styles.followBtn, !isFollowing && styles.followBtnActive]}
                >
                  <Text style={[styles.followBtnText, !isFollowing && styles.followBtnTextActive]}>
                    {isFollowing ? 'Abonné' : 'Suivre'}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.aboutListeners}>
                {speakerSermons.length + 1} prédications disponibles
              </Text>
              {speaker.bio && (
                <Text style={styles.aboutBio} numberOfLines={3}>
                  {speaker.bio}
                  <Text style={styles.aboutMore}> afficher plus</Text>
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={{ height: insets.bottom + 40 }} />
      </Animated.ScrollView>

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowOptionsMenu(false)}>
          <View style={[styles.optionsMenu, { paddingBottom: insets.bottom + 20 }]}>
            {/* Header */}
            <View style={styles.optionsHeader}>
              {currentSermon.cover_image ? (
                <Image source={{ uri: currentSermon.cover_image }} style={styles.optionsImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
              ) : (
                <View style={[styles.optionsImage, { backgroundColor: '#333' }]} />
              )}
              <View style={styles.optionsHeaderText}>
                <Text style={styles.optionsTitle} numberOfLines={1}>
                  {currentSermon.title}
                </Text>
                <Text style={styles.optionsArtist} numberOfLines={1}>
                  {currentSermon.speaker}
                </Text>
              </View>
              <Pressable onPress={() => setShowOptionsMenu(false)} hitSlop={12}>
                <X size={24} color="#888" />
              </Pressable>
            </View>

            {/* Options */}
            <View style={styles.optionsList}>
              <Pressable
                style={styles.optionItem}
                onPress={() => {
                  handleToggleFavorite();
                  setShowOptionsMenu(false);
                }}
              >
                <Heart
                  size={24}
                  color={isCurrentFavorite ? '#1DB954' : '#fff'}
                  fill={isCurrentFavorite ? '#1DB954' : 'transparent'}
                />
                <Text style={styles.optionText}>
                  {isCurrentFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.optionItem}
                onPress={() => {
                  handleShare();
                  setShowOptionsMenu(false);
                }}
              >
                <Share2 size={24} color="#fff" />
                <Text style={styles.optionText}>Partager</Text>
              </Pressable>

              <Pressable
                style={styles.optionItem}
                onPress={handleDownloadPress}
                disabled={isDownloading || currentDownloadProgress?.status === 'downloading'}
              >
                {isCurrentDownloaded ? (
                  <CheckCircle size={24} color="#1DB954" />
                ) : (
                  <Download
                    size={24}
                    color={isDownloading || currentDownloadProgress?.status === 'downloading' ? '#1DB954' : '#fff'}
                  />
                )}
                <Text style={styles.optionText}>
                  {isDownloading || currentDownloadProgress?.status === 'downloading'
                    ? `Téléchargement... ${Math.round((currentDownloadProgress?.progress || downloadProgress) * 100)}%`
                    : isCurrentDownloaded
                      ? 'Déjà téléchargé'
                      : 'Télécharger l\'audio'}
                </Text>
              </Pressable>

              {speaker && (
                <Pressable
                  style={styles.optionItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    router.push(`/speaker/${speaker.id}`);
                  }}
                >
                  <User size={24} color="#fff" />
                  <Text style={styles.optionText}>Voir l'orateur</Text>
                </Pressable>
              )}

              <Pressable
                style={styles.optionItem}
                onPress={() => {
                  cyclePlaybackRate();
                  setShowOptionsMenu(false);
                }}
              >
                <Text style={styles.optionSpeedIcon}>{playbackRate}x</Text>
                <Text style={styles.optionText}>Vitesse de lecture</Text>
              </Pressable>

              <Pressable
                style={styles.optionItem}
                onPress={() => {
                  cycleSleepTimer();
                  setShowOptionsMenu(false);
                }}
              >
                <Clock size={24} color={sleepTimerRemaining ? '#1DB954' : '#fff'} />
                <Text style={styles.optionText}>
                  Minuterie {sleepTimerRemaining ? `(${formatSleepTimer(sleepTimerRemaining)})` : ''}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Download Options Modal */}
      <Modal
        visible={showDownloadMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDownloadMenu(false)}
      >
        <Pressable style={styles.downloadModalOverlay} onPress={() => setShowDownloadMenu(false)}>
          <View style={[styles.downloadModal, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.downloadModalHandle} />

            <Pressable
              style={styles.downloadButton}
              onPress={() => handleDownload('app')}
            >
              <Download size={22} color="#1DB954" />
              <Text style={styles.downloadButtonText}>Écouter hors ligne</Text>
            </Pressable>

            <Text style={styles.downloadNote}>
              Disponible dans Plus → Téléchargements
            </Text>
          </View>
        </Pressable>
      </Modal>
      </Animated.View>
    </GestureDetector>
  );
}

// Discover Card Component
function DiscoverCard({
  sermon,
  isActive,
  label,
  onPress,
}: {
  sermon: Sermon;
  isActive: boolean;
  label: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.discoverCard, isActive && styles.discoverCardActive, animatedStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
    >
      {sermon.cover_image ? (
        <Image source={{ uri: sermon.cover_image }} style={styles.discoverImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
      ) : (
        <LinearGradient
          colors={[colors.primary[500], colors.primary[700]]}
          style={styles.discoverImage}
        />
      )}
      <Text style={styles.discoverTrackTitle} numberOfLines={2}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  dragHandleContainer: {
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  dragHandle: {
    width: 36,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    width: '100%',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  coverContainer: {
    paddingHorizontal: 32,
    marginTop: 8,
  },
  coverWrapper: {
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 24,
  },
  trackTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  trackArtist: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 24,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    color: '#1DB954',
    fontSize: 10,
    fontWeight: '600',
  },
  speedText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '700',
  },
  speedTextActive: {
    color: '#1DB954',
  },
  // Lyrics/Description Section
  lyricsContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
  },
  lyricsLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  lyricLine: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  lyricsBtn: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  lyricsBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  // Discover Section
  discoverContainer: {
    backgroundColor: 'rgba(30,30,30,0.9)',
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
  },
  discoverTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  discoverScroll: {
    gap: 12,
  },
  discoverCard: {
    width: 140,
    borderRadius: 12,
    overflow: 'hidden',
  },
  discoverCardActive: {
    borderWidth: 2,
    borderColor: '#1DB954',
  },
  discoverImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
  },
  discoverTrackTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    lineHeight: 18,
  },
  // About Artist Section
  aboutContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(40,40,40,0.9)',
  },
  aboutLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    padding: 20,
    paddingBottom: 0,
  },
  aboutImageContainer: {
    position: 'relative',
  },
  aboutImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  aboutContent: {
    padding: 20,
    marginTop: -80,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  aboutName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  followBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  followBtnActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  followBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followBtnTextActive: {
    color: '#000',
  },
  aboutListeners: {
    color: '#888',
    fontSize: 13,
    marginTop: 8,
  },
  aboutBio: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  aboutMore: {
    color: '#fff',
    fontWeight: '600',
  },
  // Options Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  optionsMenu: {
    backgroundColor: '#0d0d0d',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  optionsImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  optionsHeaderText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  optionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsArtist: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  optionsList: {
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
  optionSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 2,
  },
  downloadOptionTextContainer: {
    flex: 1,
  },
  downloadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  downloadHeaderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  downloadModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  downloadModal: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  downloadModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  downloadButtonText: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadNote: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  optionSpeedIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
});

export default ExpandedPlayer;
