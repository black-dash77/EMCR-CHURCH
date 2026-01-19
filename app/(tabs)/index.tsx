import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Calendar, ChevronRight, Users } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { sermonsApi, eventsApi, ministriesApi } from '@/services/api';
import type { Sermon, Event, Ministry } from '@/types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const [refreshing, setRefreshing] = useState(false);
  const [latestSermons, setLatestSermons] = useState<Sermon[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [sermons, events, mins] = await Promise.all([
        sermonsApi.getLatest(5),
        eventsApi.getUpcoming(3),
        ministriesApi.getAll(),
      ]);
      setLatestSermons(sermons);
      setUpcomingEvents(events);
      setMinistries(mins);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[colors.primary[500], colors.primary[700]]}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>Église Missionnaire</Text>
          <Text style={styles.heroSubtitle}>Christ est Roi</Text>
          <Text style={styles.heroVerse}>
            "Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux."
          </Text>
          <Text style={styles.heroReference}>Matthieu 18:20</Text>
        </LinearGradient>

        {/* This Sunday */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <View style={styles.sundayHeader}>
            <Calendar size={20} color={colors.primary[500]} />
            <Text style={[styles.sundayLabel, { color: colors.primary[500] }]}>
              Ce Dimanche
            </Text>
          </View>
          <Text style={[styles.sundayTitle, { color: themeColors.text }]}>
            Culte de Louange et d'Adoration
          </Text>
          <Text style={[styles.sundayTime, { color: themeColors.textSecondary }]}>
            Dimanche à 10h00
          </Text>
        </View>

        {/* Latest Sermons */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Dernières Prédications
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/sermons')}
              style={styles.seeAllButton}
            >
              <Text style={[styles.seeAllText, { color: colors.primary[500] }]}>
                Voir tout
              </Text>
              <ChevronRight size={16} color={colors.primary[500]} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {latestSermons.map((sermon) => (
              <Pressable
                key={sermon.id}
                style={[styles.sermonCard, { backgroundColor: themeColors.card }]}
                onPress={() => router.push(`/sermon/${sermon.id}`)}
              >
                <View style={styles.sermonCover}>
                  {sermon.cover_image ? (
                    <Image
                      source={{ uri: sermon.cover_image }}
                      style={styles.sermonImage}
                    />
                  ) : (
                    <LinearGradient
                      colors={[colors.primary[400], colors.primary[600]]}
                      style={styles.sermonImagePlaceholder}
                    />
                  )}
                  <View style={styles.playButton}>
                    <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                </View>
                <Text
                  style={[styles.sermonTitle, { color: themeColors.text }]}
                  numberOfLines={2}
                >
                  {sermon.title}
                </Text>
                <Text
                  style={[styles.sermonSpeaker, { color: themeColors.textSecondary }]}
                  numberOfLines={1}
                >
                  {sermon.speaker}
                </Text>
                <Text style={[styles.sermonDate, { color: themeColors.textTertiary }]}>
                  {formatDate(sermon.date)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Upcoming Events */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Événements à Venir
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/events')}
              style={styles.seeAllButton}
            >
              <Text style={[styles.seeAllText, { color: colors.primary[500] }]}>
                Voir tout
              </Text>
              <ChevronRight size={16} color={colors.primary[500]} />
            </Pressable>
          </View>

          {upcomingEvents.map((event) => (
            <Pressable
              key={event.id}
              style={[styles.eventCard, { backgroundColor: themeColors.card }]}
              onPress={() => router.push(`/event/${event.id}`)}
            >
              <View style={styles.eventDateBox}>
                <Text style={styles.eventDay}>
                  {new Date(event.date).getDate()}
                </Text>
                <Text style={styles.eventMonth}>
                  {new Date(event.date).toLocaleDateString('fr-FR', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={[styles.eventTitle, { color: themeColors.text }]}>
                  {event.title}
                </Text>
                <Text style={[styles.eventTime, { color: themeColors.textSecondary }]}>
                  {event.time} • {event.location}
                </Text>
              </View>
              <ChevronRight size={20} color={themeColors.textTertiary} />
            </Pressable>
          ))}
        </View>

        {/* Ministries */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Nos Ministères
          </Text>
          <View style={styles.ministriesGrid}>
            {ministries.slice(0, 6).map((ministry) => (
              <View
                key={ministry.id}
                style={[styles.ministryCard, { backgroundColor: themeColors.card }]}
              >
                <View
                  style={[
                    styles.ministryIcon,
                    { backgroundColor: colors.primary[100] },
                  ]}
                >
                  <Users size={24} color={colors.primary[500]} />
                </View>
                <Text
                  style={[styles.ministryName, { color: themeColors.text }]}
                  numberOfLines={2}
                >
                  {ministry.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    padding: spacing[6],
    paddingTop: spacing[10],
    paddingBottom: spacing[10],
    alignItems: 'center',
  },
  heroTitle: {
    ...typography.displaySmall,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.headlineLarge,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: spacing[1],
  },
  heroVerse: {
    ...typography.bodyMedium,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: spacing[6],
    fontStyle: 'italic',
    paddingHorizontal: spacing[4],
  },
  heroReference: {
    ...typography.labelMedium,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: spacing[2],
  },
  section: {
    margin: spacing[4],
    padding: spacing[4],
    borderRadius: borderRadius.xl,
  },
  sundayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  sundayLabel: {
    ...typography.labelLarge,
  },
  sundayTitle: {
    ...typography.titleLarge,
  },
  sundayTime: {
    ...typography.bodyMedium,
    marginTop: spacing[1],
  },
  sectionContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...typography.titleLarge,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  seeAllText: {
    ...typography.labelLarge,
  },
  horizontalScroll: {
    paddingRight: spacing[4],
    gap: spacing[3],
  },
  sermonCard: {
    width: width * 0.4,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  sermonCover: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  sermonImage: {
    width: '100%',
    height: '100%',
  },
  sermonImagePlaceholder: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    bottom: spacing[2],
    right: spacing[2],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sermonTitle: {
    ...typography.titleSmall,
    padding: spacing[3],
    paddingBottom: 0,
  },
  sermonSpeaker: {
    ...typography.bodySmall,
    paddingHorizontal: spacing[3],
    marginTop: spacing[1],
  },
  sermonDate: {
    ...typography.labelSmall,
    padding: spacing[3],
    paddingTop: spacing[1],
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
  },
  eventDateBox: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDay: {
    ...typography.titleMedium,
    color: '#FFFFFF',
  },
  eventMonth: {
    ...typography.labelSmall,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  eventInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  eventTitle: {
    ...typography.titleSmall,
  },
  eventTime: {
    ...typography.bodySmall,
    marginTop: spacing[1],
  },
  ministriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  ministryCard: {
    width: (width - spacing[4] * 2 - spacing[3] * 2) / 3,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  ministryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  ministryName: {
    ...typography.labelMedium,
    textAlign: 'center',
  },
});
