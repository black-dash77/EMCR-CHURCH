import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, Bell, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { announcementsApi } from '@/services/api';
import type { Announcement } from '@/types';

export default function AnnouncementsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const data = await announcementsApi.getAll();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  }, [fetchAnnouncements]);

  const urgentAnnouncements = announcements.filter((a) => a.urgent);
  const regularAnnouncements = announcements.filter((a) => !a.urgent);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderAnnouncement = ({ item }: { item: Announcement }) => (
    <Pressable
      style={[
        styles.announcementCard,
        {
          backgroundColor: item.urgent
            ? colors.semantic.errorLight
            : themeColors.card,
          borderLeftColor: item.urgent
            ? colors.semantic.error
            : colors.primary[500],
        },
      ]}
    >
      <View style={styles.announcementHeader}>
        {item.urgent ? (
          <AlertTriangle size={18} color={colors.semantic.error} />
        ) : (
          <Bell size={18} color={colors.primary[500]} />
        )}
        <Text
          style={[
            styles.announcementType,
            { color: item.urgent ? colors.semantic.error : colors.primary[500] },
          ]}
        >
          {item.urgent ? 'URGENT' : item.type || 'Annonce'}
        </Text>
        <Text style={[styles.announcementDate, { color: themeColors.textTertiary }]}>
          {formatDate(item.date)}
        </Text>
      </View>

      <Text
        style={[
          styles.announcementTitle,
          { color: item.urgent ? colors.semantic.error : themeColors.text },
        ]}
      >
        {item.title}
      </Text>

      {item.description && (
        <Text
          style={[styles.announcementDescription, { color: themeColors.textSecondary }]}
          numberOfLines={3}
        >
          {item.description}
        </Text>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Annonces</Text>
      </View>

      <FlatList
        data={[...urgentAnnouncements, ...regularAnnouncements]}
        renderItem={renderAnnouncement}
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
          urgentAnnouncements.length > 0 ? (
            <View
              style={[
                styles.urgentBanner,
                { backgroundColor: colors.semantic.errorLight },
              ]}
            >
              <AlertTriangle size={20} color={colors.semantic.error} />
              <Text style={[styles.urgentBannerText, { color: colors.semantic.error }]}>
                {urgentAnnouncements.length} annonce(s) urgente(s)
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={48} color={themeColors.textTertiary} />
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Aucune annonce pour le moment
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
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  title: {
    ...typography.headlineMedium,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: 120,
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  urgentBannerText: {
    ...typography.labelLarge,
  },
  announcementCard: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
    borderLeftWidth: 4,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  announcementType: {
    ...typography.labelSmall,
    textTransform: 'uppercase',
  },
  announcementDate: {
    ...typography.labelSmall,
    marginLeft: 'auto',
  },
  announcementTitle: {
    ...typography.titleMedium,
    marginBottom: spacing[2],
  },
  announcementDescription: {
    ...typography.bodyMedium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[10],
    gap: spacing[3],
  },
  emptyText: {
    ...typography.bodyMedium,
  },
});
