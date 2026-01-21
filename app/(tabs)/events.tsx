import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MapPin, Clock, ChevronRight, CalendarDays, Calendar, X, ImageIcon } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import { Calendar as CalendarComponent } from 'react-native-calendars';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/TabBarBackground';
import { TransparentHeaderBackground, HEADER_HEIGHT } from '@/components/TransparentHeaderBackground';
import { eventsApi } from '@/services/api';
import { colors, typography, spacing, borderRadius, ThemeColors } from '@/theme';
import type { Event } from '@/types';

const { width } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function EventsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await eventsApi.getAll();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const markedDates = events.reduce(
    (acc, event) => {
      const date = event.date.split('T')[0];
      acc[date] = {
        marked: true,
        dotColor: colors.primary[500],
        selected: selectedDate === date,
        selectedColor: colors.primary[500],
      };
      return acc;
    },
    {} as Record<string, any>
  );

  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: colors.primary[500],
    };
  }

  const filteredEvents = selectedDate
    ? events.filter((e) => e.date.split('T')[0] === selectedDate)
    : events.filter((e) => new Date(e.date) >= new Date());

  const formatTime = (time: string | null) => {
    if (!time) return '';
    return time;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const renderEvent = ({ item, index }: { item: Event; index: number }) => (
    <EventCard
      event={item}
      index={index}
      isDark={isDark}
      themeColors={themeColors}
      formatDate={formatDate}
      formatTime={formatTime}
      onPress={() => router.push(`/event/${item.id}`)}
    />
  );

  const upcomingEventsCount = events.filter((e) => new Date(e.date) >= new Date()).length;
  const headerTotalHeight = HEADER_HEIGHT + insets.top;

  const ListHeaderComponent = (
    <>
      {/* Spacer pour le header */}
      <View style={{ height: headerTotalHeight + spacing[4] }} />

      {/* Calendar */}
      {showCalendar && (
        <Animated.View
          entering={FadeInDown.delay(100).duration(500).springify()}
          style={[styles.calendarContainer, { backgroundColor: themeColors.card }]}
        >
          <CalendarComponent
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: themeColors.textSecondary,
              selectedDayBackgroundColor: colors.primary[500],
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: colors.primary[500],
              dayTextColor: themeColors.text,
              textDisabledColor: themeColors.textTertiary,
              dotColor: colors.primary[500],
              selectedDotColor: '#FFFFFF',
              arrowColor: colors.primary[500],
              monthTextColor: themeColors.text,
              indicatorColor: colors.primary[500],
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
            }}
            markedDates={markedDates}
            onDayPress={(day: { dateString: string }) => {
              setSelectedDate(
                selectedDate === day.dateString ? null : day.dateString
              );
            }}
            enableSwipeMonths
            firstDay={1}
          />
        </Animated.View>
      )}

      {/* Filter Badge */}
      {selectedDate && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.filterBadgeContainer}>
          <Pressable
            style={[styles.filterBadge, { backgroundColor: colors.primary[500] }]}
            onPress={() => setSelectedDate(null)}
          >
            <Calendar size={14} color="#FFFFFF" />
            <Text style={styles.filterBadgeText}>
              {new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </Text>
            <X size={16} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      )}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Events List */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: TAB_BAR_HEIGHT + 60 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
            progressViewOffset={headerTotalHeight}
          />
        }
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: themeColors.card }]}>
              <CalendarDays size={40} color={themeColors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              Aucun événement {selectedDate ? 'pour cette date' : 'à venir'}
            </Text>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              {selectedDate ? 'Essayez une autre date' : 'Revenez bientôt pour les prochains événements'}
            </Text>
          </Animated.View>
        }
      />

      {/* Header Transparent avec gradient de fondu */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <TransparentHeaderBackground height={headerTotalHeight + 40} />

        {/* Contenu du header */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={[styles.title, { color: themeColors.text }]}>Événements</Text>
              <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                {upcomingEventsCount} événement{upcomingEventsCount > 1 ? 's' : ''} à venir
              </Text>
            </View>
            <Pressable
              onPress={() => setShowCalendar(!showCalendar)}
              style={({ pressed }) => [
                styles.toggleButton,
                {
                  backgroundColor: showCalendar ? colors.primary[500] : themeColors.card,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <CalendarDays size={20} color={showCalendar ? '#FFFFFF' : colors.primary[500]} />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

// Composant EventCard avec animation et thumbnail
function EventCard({
  event,
  index,
  isDark,
  themeColors,
  formatDate,
  formatTime,
  onPress,
}: {
  event: Event;
  index: number;
  isDark: boolean;
  themeColors: ThemeColors;
  formatDate: (date: string) => string;
  formatTime: (time: string | null) => string;
  onPress: () => void;
}) {
  const date = new Date(event.date);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400).springify()}>
      <AnimatedPressable
        style={[
          styles.eventCard,
          { backgroundColor: themeColors.card },
          animatedStyle,
        ]}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        {/* Thumbnail Image */}
        <View style={styles.eventThumbnailContainer}>
          {event.image ? (
            <Image source={{ uri: event.image }} style={styles.eventThumbnail} />
          ) : (
            <LinearGradient
              colors={colors.gradients.primarySoft}
              style={styles.eventThumbnail}
            >
              <ImageIcon size={24} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          )}
          {/* Date Badge sur l'image */}
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeDay}>{date.getDate()}</Text>
            <Text style={styles.dateBadgeMonth}>
              {date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Event Info */}
        <View style={styles.eventContent}>
          {event.type && (
            <View style={styles.eventTypeContainer}>
              <Text style={[styles.eventType, { color: colors.primary[500] }]}>
                {event.type}
              </Text>
            </View>
          )}
          <Text
            style={[styles.eventTitle, { color: themeColors.text }]}
            numberOfLines={2}
          >
            {event.title}
          </Text>
          <View style={styles.eventMeta}>
            {event.time && (
              <View style={styles.metaItem}>
                <Clock size={13} color={themeColors.textTertiary} />
                <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
                  {formatTime(event.time)}
                </Text>
              </View>
            )}
            {event.location && (
              <View style={styles.metaItem}>
                <MapPin size={13} color={themeColors.textTertiary} />
                <Text
                  style={[styles.metaText, { color: themeColors.textSecondary }]}
                  numberOfLines={1}
                >
                  {event.location}
                </Text>
              </View>
            )}
          </View>
        </View>

        <ChevronRight size={20} color={themeColors.textTertiary} />
      </AnimatedPressable>
    </Animated.View>
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
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.headlineMedium,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  toggleButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarContainer: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    padding: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  filterBadgeContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    gap: spacing[2],
  },
  filterBadgeText: {
    ...typography.labelMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing[4],
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  eventThumbnailContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  eventThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  dateBadgeDay: {
    ...typography.labelMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 16,
  },
  dateBadgeMonth: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  eventContent: {
    flex: 1,
    marginLeft: spacing[4],
  },
  eventTypeContainer: {
    marginBottom: spacing[1],
  },
  eventType: {
    ...typography.labelSmall,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  eventTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  eventMeta: {
    marginTop: spacing[2],
    gap: spacing[1],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  metaText: {
    ...typography.bodySmall,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[12],
    gap: spacing[3],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  emptyTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
});
