import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar as CalendarComponent } from 'react-native-calendars';
import { MapPin, Clock, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { eventsApi } from '@/services/api';
import type { Event } from '@/types';

export default function EventsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

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

  const renderEvent = ({ item }: { item: Event }) => (
    <Pressable
      style={[styles.eventCard, { backgroundColor: themeColors.card }]}
      onPress={() => router.push(`/event/${item.id}`)}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.eventImage} />
      )}
      <View style={styles.eventContent}>
        <View style={styles.eventTypeContainer}>
          <Text style={[styles.eventType, { color: colors.primary[500] }]}>
            {item.type}
          </Text>
        </View>
        <Text
          style={[styles.eventTitle, { color: themeColors.text }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <Clock size={14} color={themeColors.textSecondary} />
            <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
              {formatDate(item.date)} {item.time && `• ${formatTime(item.time)}`}
            </Text>
          </View>
          {item.location && (
            <View style={styles.metaItem}>
              <MapPin size={14} color={themeColors.textSecondary} />
              <Text
                style={[styles.metaText, { color: themeColors.textSecondary }]}
                numberOfLines={1}
              >
                {item.location}
              </Text>
            </View>
          )}
        </View>
      </View>
      <ChevronRight size={20} color={themeColors.textTertiary} />
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Événements</Text>
        <Pressable
          onPress={() => setShowCalendar(!showCalendar)}
          style={[styles.toggleButton, { backgroundColor: themeColors.surface }]}
        >
          <Text style={[styles.toggleText, { color: colors.primary[500] }]}>
            {showCalendar ? 'Masquer calendrier' : 'Afficher calendrier'}
          </Text>
        </Pressable>
      </View>

      {/* Calendar */}
      {showCalendar && (
        <View style={[styles.calendarContainer, { backgroundColor: themeColors.card }]}>
          <CalendarComponent
            theme={{
              backgroundColor: themeColors.card,
              calendarBackground: themeColors.card,
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
        </View>
      )}

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
        ListHeaderComponent={
          selectedDate ? (
            <Pressable
              style={styles.clearFilter}
              onPress={() => setSelectedDate(null)}
            >
              <Text style={[styles.clearFilterText, { color: colors.primary[500] }]}>
                Effacer le filtre de date
              </Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Aucun événement {selectedDate ? 'pour cette date' : 'à venir'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  title: {
    ...typography.headlineMedium,
  },
  toggleButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
  },
  toggleText: {
    ...typography.labelMedium,
  },
  calendarContainer: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: 120,
  },
  clearFilter: {
    paddingVertical: spacing[2],
    marginBottom: spacing[2],
  },
  clearFilterText: {
    ...typography.labelMedium,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
  },
  eventImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    marginRight: spacing[3],
  },
  eventContent: {
    flex: 1,
  },
  eventTypeContainer: {
    marginBottom: spacing[1],
  },
  eventType: {
    ...typography.labelSmall,
    textTransform: 'uppercase',
  },
  eventTitle: {
    ...typography.titleSmall,
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
    paddingVertical: spacing[10],
  },
  emptyText: {
    ...typography.bodyMedium,
  },
});
