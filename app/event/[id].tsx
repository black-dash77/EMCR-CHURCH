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
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Calendar from 'expo-calendar';
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Share2,
  Plus,
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { eventsApi } from '@/services/api';
import type { Event } from '@/types';

const { width } = Dimensions.get('window');

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

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
        message: `${event.title} - ${formatDate(event.date)} ${event.time ? `à ${event.time}` : ''}\n${event.location || ''}\n\nPlus d'infos sur l'app EMCR Church`,
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
      ) || calendars[0];

      if (!defaultCalendar) {
        Alert.alert('Erreur', 'Aucun calendrier disponible.');
        return;
      }

      const startDate = new Date(event.date);
      if (event.time) {
        const [hours, minutes] = event.time.split(':').map(Number);
        startDate.setHours(hours, minutes);
      }

      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 2);

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

  if (loading || !event) {
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
          {event.image ? (
            <Image source={{ uri: event.image }} style={styles.coverImage} />
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
          {/* Type Badge */}
          <View style={[styles.typeBadge, { backgroundColor: colors.primary[500] }]}>
            <Text style={styles.typeText}>{event.type}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: themeColors.text }]}>
            {event.title}
          </Text>

          {/* Date & Time */}
          <View style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary[100] }]}>
                <CalendarIcon size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.infoText}>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                  Date
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  {formatDate(event.date)}
                </Text>
              </View>
            </View>

            {event.time && (
              <View style={styles.infoRow}>
                <View style={[styles.iconCircle, { backgroundColor: colors.primary[100] }]}>
                  <Clock size={20} color={colors.primary[500]} />
                </View>
                <View style={styles.infoText}>
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                    Heure
                  </Text>
                  <Text style={[styles.infoValue, { color: themeColors.text }]}>
                    {event.time}
                  </Text>
                </View>
              </View>
            )}

            {event.location && (
              <Pressable style={styles.infoRow} onPress={handleOpenMaps}>
                <View style={[styles.iconCircle, { backgroundColor: colors.primary[100] }]}>
                  <MapPin size={20} color={colors.primary[500]} />
                </View>
                <View style={styles.infoText}>
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                    Lieu
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.primary[500] }]}>
                    {event.location}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: colors.primary[500] }]}
              onPress={handleAddToCalendar}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Ajouter au calendrier</Text>
            </Pressable>

            <Pressable
              style={[styles.iconButton, { backgroundColor: themeColors.surface }]}
              onPress={handleShare}
            >
              <Share2 size={22} color={themeColors.text} />
            </Pressable>
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.descriptionSection}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                À propos
              </Text>
              <Text style={[styles.description, { color: themeColors.textSecondary }]}>
                {event.description}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
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
    height: width * 0.6,
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
    height: 100,
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
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  title: {
    ...typography.headlineSmall,
    marginBottom: spacing[4],
  },
  infoCard: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    ...typography.labelSmall,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.bodyMedium,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  primaryButtonText: {
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
