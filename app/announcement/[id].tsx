import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Calendar,
  Share2,
  AlertTriangle,
  Megaphone,
  ImageIcon,
} from 'lucide-react-native';
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
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { announcementsApi } from '@/services/api';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Announcement } from '@/types';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.35;

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!id) return;
      try {
        const data = await announcementsApi.getById(id);
        setAnnouncement(data);
      } catch (error) {
        console.error('Error fetching announcement:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id]);

  const handleShare = async () => {
    if (!announcement) return;
    try {
      await Share.share({
        title: announcement.title,
        message: `${announcement.title}\n\n${announcement.description || announcement.content || ''}\n\n📅 ${formatDate(announcement.date)}\n\nVia l'app EMCR Church`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!announcement) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorText, { color: themeColors.text }]}>
          Annonce introuvable
        </Text>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.primary[500] }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const hasImage = !!announcement.image;
  const isUrgent = announcement.urgent;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Header ou Placeholder */}
        {hasImage ? (
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: announcement.image! }}
                style={styles.headerImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.imageGradient}
              />
              {isUrgent && (
                <View style={styles.urgentBadgeOnImage}>
                  <AlertTriangle size={14} color="#FFFFFF" />
                  <Text style={styles.urgentBadgeText}>URGENT</Text>
                </View>
              )}
            </View>
          </Animated.View>
        ) : (
          <View style={[styles.placeholderHeader, { backgroundColor: isUrgent ? 'rgba(239, 68, 68, 0.1)' : themeColors.card }]}>
            <View style={[styles.placeholderIcon, { backgroundColor: isUrgent ? 'rgba(239, 68, 68, 0.15)' : isDark ? 'rgba(59, 130, 246, 0.15)' : colors.primary[50] }]}>
              {isUrgent ? (
                <AlertTriangle size={48} color={colors.semantic.error} />
              ) : (
                <Megaphone size={48} color={colors.primary[500]} />
              )}
            </View>
            {isUrgent && (
              <View style={styles.urgentBadgeNoImage}>
                <AlertTriangle size={14} color="#FFFFFF" />
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </View>
            )}
          </View>
        )}

        {/* Content */}
        <View style={[styles.content, { backgroundColor: themeColors.background }]}>
          {/* Type Badge */}
          {announcement.type && (
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <View style={[styles.typeBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : colors.primary[50] }]}>
                <Text style={[styles.typeText, { color: colors.primary[500] }]}>
                  {announcement.type}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Title */}
          <Animated.Text
            entering={FadeInDown.delay(150).duration(400)}
            style={[styles.title, { color: isUrgent ? colors.semantic.error : themeColors.text }]}
          >
            {announcement.title}
          </Animated.Text>

          {/* Date */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.dateRow}
          >
            <Calendar size={16} color={themeColors.textSecondary} />
            <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>
              {formatDate(announcement.date)}
            </Text>
          </Animated.View>

          {/* Divider */}
          <Animated.View
            entering={FadeInDown.delay(250).duration(400)}
            style={[styles.divider, { backgroundColor: themeColors.border }]}
          />

          {/* Description / Content */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Text style={[styles.description, { color: themeColors.text }]}>
              {announcement.content || announcement.description || 'Aucun contenu disponible.'}
            </Text>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={hasImage
            ? ['rgba(0,0,0,0.5)', 'transparent']
            : [themeColors.background, themeColors.background + '00']
          }
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          style={[styles.headerButton, { backgroundColor: hasImage ? 'rgba(0,0,0,0.3)' : themeColors.card }]}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={hasImage ? '#FFFFFF' : themeColors.text} />
        </Pressable>
        <Pressable
          style={[styles.headerButton, { backgroundColor: hasImage ? 'rgba(0,0,0,0.3)' : themeColors.card }]}
          onPress={handleShare}
        >
          <Share2 size={20} color={hasImage ? '#FFFFFF' : themeColors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  errorText: {
    ...typography.titleMedium,
    marginBottom: spacing[4],
  },
  backButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
  },
  backButtonText: {
    ...typography.labelLarge,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: IMAGE_HEIGHT * 0.5,
  },
  urgentBadgeOnImage: {
    position: 'absolute',
    top: 80,
    left: spacing[4],
    backgroundColor: colors.semantic.error,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urgentBadgeNoImage: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    backgroundColor: colors.semantic.error,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urgentBadgeText: {
    ...typography.labelSmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  placeholderHeader: {
    width: '100%',
    height: IMAGE_HEIGHT * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  placeholderIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: spacing[5],
    marginTop: -spacing[4],
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    marginBottom: spacing[3],
  },
  typeText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  title: {
    ...typography.headlineMedium,
    fontWeight: '700',
    marginBottom: spacing[3],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  dateText: {
    ...typography.bodyMedium,
  },
  divider: {
    height: 1,
    marginBottom: spacing[5],
  },
  description: {
    ...typography.bodyLarge,
    lineHeight: 28,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
