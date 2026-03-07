import * as Calendar from 'expo-calendar';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Share2,
  CalendarPlus,
  Navigation,
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
  Dimensions,
  Share,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TransparentHeaderBackground, HEADER_HEIGHT } from '@/components/TransparentHeaderBackground';
import { eventsApi } from '@/services/api';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Event } from '@/types';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.3;

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const data = await eventsApi.getById(id);
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        title: event.title,
        message: `${event.title}\n\n📅 ${formatDate(event.date)}${event.time ? `\n🕐 ${event.time}` : ''}${event.location ? `\n📍 ${event.location}` : ''}\n\nPlus d'infos sur l'app EMCR Church`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAddToCalendar = async () => {
    if (!event) return;

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Autorisez l\'accès au calendrier pour ajouter cet événement.'
        );
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(
        (cal) => cal.allowsModifications && cal.source.name === 'Default'
      ) || calendars.find(cal => cal.allowsModifications) || calendars[0];

      if (!defaultCalendar) {
        Alert.alert('Erreur', 'Aucun calendrier disponible.');
        return;
      }

      const startDate = new Date(event.date);

      // Validate the date
      if (isNaN(startDate.getTime())) {
        Alert.alert('Erreur', 'La date de l\'événement est invalide.');
        return;
      }

      if (event.time) {
        const timeParts = event.time.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
          startDate.setHours(hours, minutes, 0, 0);
        }
      } else {
        // Default to 9 AM if no time specified
        startDate.setHours(9, 0, 0, 0);
      }

      const endDate = new Date(startDate.getTime());
      endDate.setTime(endDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours in milliseconds

      await Calendar.createEventAsync(defaultCalendar.id, {
        title: event.title,
        startDate,
        endDate,
        location: event.location || undefined,
        notes: event.description || undefined,
      });

      Alert.alert('Succès', 'Événement ajouté à votre calendrier !');
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'événement au calendrier.');
    }
  };

  const handleOpenMaps = () => {
    if (!event?.location) return;
    const url = `https://maps.google.com/?q=${encodeURIComponent(event.location)}`;
    Linking.openURL(url);
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

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase(),
      weekday: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
    };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
          Événement introuvable
        </Text>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.primary[500], marginTop: spacing[4] }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const dateInfo = formatShortDate(event.date);

  const headerTotalHeight = HEADER_HEIGHT + insets.top;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Spacer pour le header */}
        <View style={{ height: headerTotalHeight + spacing[2] }} />
        {/* Hero Image Section - en dessous du header */}
        <View style={styles.heroSection}>
          {event.image ? (
            <Image source={{ uri: event.image }} style={styles.heroImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          ) : (
            <LinearGradient
              colors={[colors.primary[400], colors.primary[600]]}
              style={styles.heroImage}
            >
              <ImageIcon size={60} color="rgba(255,255,255,0.3)" />
            </LinearGradient>
          )}

          {/* Gradient overlay pour lisibilité */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.heroGradient}
          />

          {/* Date Badge flottant */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(400)}
            style={styles.floatingDateBadge}
          >
            <LinearGradient
              colors={[colors.primary[500], colors.primary[600]]}
              style={styles.dateBadgeGradient}
            >
              <Text style={styles.dateBadgeDay}>{dateInfo.day}</Text>
              <Text style={styles.dateBadgeMonth}>{dateInfo.month}</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Content Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.contentCard, { backgroundColor: themeColors.background }]}
        >
          {/* Type Badge */}
          {event.type && (
            <View style={styles.typeBadgeContainer}>
              <View style={[styles.typeBadge, { backgroundColor: colors.primary[50] }]}>
                <Text style={[styles.typeText, { color: colors.primary[600] }]}>
                  {event.type}
                </Text>
              </View>
            </View>
          )}

          {/* Title */}
          <Text style={[styles.title, { color: themeColors.text }]}>
            {event.title}
          </Text>

          {/* Info Pills */}
          <View style={styles.infoPillsContainer}>
            {/* Date & Time Pill */}
            <View style={[styles.infoPill, { backgroundColor: themeColors.card }]}>
              <View style={[styles.pillIcon, { backgroundColor: colors.primary[100] }]}>
                <CalendarIcon size={18} color={colors.primary[500]} />
              </View>
              <View style={styles.pillContent}>
                <Text style={[styles.pillLabel, { color: themeColors.textSecondary }]}>
                  {dateInfo.weekday}
                </Text>
                <Text style={[styles.pillValue, { color: themeColors.text }]}>
                  {dateInfo.day} {dateInfo.month.toLowerCase()}
                  {event.time && ` • ${event.time}`}
                </Text>
              </View>
            </View>

            {/* Location Pill */}
            {event.location && (
              <Pressable
                style={[styles.infoPill, { backgroundColor: themeColors.card }]}
                onPress={handleOpenMaps}
              >
                <View style={[styles.pillIcon, { backgroundColor: colors.primary[100] }]}>
                  <MapPin size={18} color={colors.primary[500]} />
                </View>
                <View style={styles.pillContent}>
                  <Text style={[styles.pillLabel, { color: themeColors.textSecondary }]}>
                    Lieu
                  </Text>
                  <Text
                    style={[styles.pillValue, { color: colors.primary[500] }]}
                    numberOfLines={1}
                  >
                    {event.location}
                  </Text>
                </View>
                <Navigation size={16} color={colors.primary[500]} />
              </Pressable>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryActionButton,
                { backgroundColor: colors.primary[500], opacity: pressed ? 0.9 : 1 }
              ]}
              onPress={handleAddToCalendar}
            >
              <CalendarPlus size={20} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>Ajouter au calendrier</Text>
            </Pressable>

            {event.location && (
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryActionButton,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.border,
                    opacity: pressed ? 0.9 : 1
                  }
                ]}
                onPress={handleOpenMaps}
              >
                <MapPin size={20} color={colors.primary[500]} />
                <Text style={[styles.secondaryActionText, { color: themeColors.text }]}>
                  Itinéraire
                </Text>
              </Pressable>
            )}
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.descriptionSection}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                À propos de l'événement
              </Text>
              <Text style={[styles.description, { color: themeColors.textSecondary }]}>
                {event.description}
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Header Transparent avec gradient de fondu */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <TransparentHeaderBackground height={headerTotalHeight + 40} />

        {/* Contenu du header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.headerContent}>
          <View style={styles.headerRow}>
            <Pressable
              style={({ pressed }) => [
                styles.headerIconButton,
                { backgroundColor: themeColors.card, opacity: pressed ? 0.8 : 1 }
              ]}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={themeColors.text} />
            </Pressable>

            <Text style={[styles.headerTitle, { color: themeColors.text }]} numberOfLines={1}>
              Événement
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.headerIconButton,
                { backgroundColor: themeColors.card, opacity: pressed ? 0.8 : 1 }
              ]}
              onPress={handleShare}
            >
              <Share2 size={22} color={themeColors.text} />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  errorText: {
    ...typography.bodyMedium,
  },
  backButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
  },
  backButtonText: {
    ...typography.labelLarge,
    color: '#FFFFFF',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing[2],
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    height: IMAGE_HEIGHT,
    position: 'relative',
    borderRadius: borderRadius['2xl'],
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  floatingDateBadge: {
    position: 'absolute',
    bottom: spacing[3],
    left: spacing[3],
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  dateBadgeGradient: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBadgeDay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  dateBadgeMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
  },
  contentCard: {
    flex: 1,
    paddingTop: spacing[5],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[8],
  },
  typeBadgeContainer: {
    marginBottom: spacing[3],
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
  },
  typeText: {
    ...typography.labelSmall,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    ...typography.headlineSmall,
    fontWeight: '700',
    marginBottom: spacing[5],
    lineHeight: 32,
  },
  infoPillsContainer: {
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    gap: spacing[3],
  },
  pillIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillContent: {
    flex: 1,
  },
  pillLabel: {
    ...typography.labelSmall,
    marginBottom: 2,
  },
  pillValue: {
    ...typography.bodyMedium,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3.5],
    borderRadius: borderRadius.xl,
    gap: spacing[2],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    ...typography.labelLarge,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3.5],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    gap: spacing[2],
  },
  secondaryActionText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  descriptionSection: {
    marginTop: spacing[2],
  },
  sectionTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  description: {
    ...typography.bodyMedium,
    lineHeight: 24,
  },
});
