import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AlertTriangle, Megaphone, ChevronRight, Calendar } from 'lucide-react-native';
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
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/TabBarBackground';
import { TransparentHeaderBackground, HEADER_HEIGHT } from '@/components/TransparentHeaderBackground';
import { announcementsApi } from '@/services/api';
import { colors, typography, spacing, borderRadius, ThemeColors } from '@/theme';
import type { Announcement } from '@/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AnnouncementsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const handleAnnouncementPress = (announcement: Announcement) => {
    router.push(`/announcement/${announcement.id}`);
  };

  const renderAnnouncement = ({ item, index }: { item: Announcement; index: number }) => (
    <AnnouncementCard
      announcement={item}
      index={index}
      isDark={isDark}
      themeColors={themeColors}
      formatDate={formatDate}
      onPress={() => handleAnnouncementPress(item)}
    />
  );

  const headerTotalHeight = HEADER_HEIGHT + insets.top;

  const ListHeaderComponent = (
    <>
      {/* Spacer pour le header */}
      <View style={{ height: headerTotalHeight + spacing[4] }} />

      {/* Urgent Banner */}
      {urgentAnnouncements.length > 0 && (
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()}>
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)']}
            style={styles.urgentBanner}
          >
            <View style={styles.urgentIconContainer}>
              <AlertTriangle size={18} color={colors.semantic.error} />
            </View>
            <View style={styles.urgentContent}>
              <Text style={[styles.urgentBannerTitle, { color: colors.semantic.error }]}>
                Annonces Urgentes
              </Text>
              <Text style={[styles.urgentBannerText, { color: themeColors.textSecondary }]}>
                {urgentAnnouncements.length} message{urgentAnnouncements.length > 1 ? 's' : ''} important{urgentAnnouncements.length > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>{urgentAnnouncements.length}</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Announcements List */}
      <FlatList
        data={[...urgentAnnouncements, ...regularAnnouncements]}
        renderItem={renderAnnouncement}
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
              <Megaphone size={40} color={themeColors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              Aucune annonce
            </Text>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Les nouvelles annonces apparaîtront ici
            </Text>
          </Animated.View>
        }
      />

      {/* Header Transparent avec gradient de fondu */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <TransparentHeaderBackground height={headerTotalHeight + 40} />

        {/* Contenu du header */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.headerContent}>
          <Text style={[styles.title, { color: themeColors.text }]}>Annonces</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {announcements.length} annonce{announcements.length > 1 ? 's' : ''} récente{announcements.length > 1 ? 's' : ''}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

// Composant AnnouncementCard avec design moderne
function AnnouncementCard({
  announcement,
  index,
  isDark,
  themeColors,
  formatDate,
  onPress,
}: {
  announcement: Announcement;
  index: number;
  isDark: boolean;
  themeColors: ThemeColors;
  formatDate: (date: string) => string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isUrgent = announcement.urgent;
  const hasImage = !!announcement.image;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400).springify()}>
      <AnimatedPressable
        style={[
          styles.announcementCard,
          {
            backgroundColor: themeColors.card,
          },
          animatedStyle,
        ]}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        {/* Image de couverture */}
        {hasImage && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: announcement.image! }}
              style={styles.coverImage}
              resizeMode="cover"
            />
            {isUrgent && (
              <View style={styles.urgentImageBadge}>
                <AlertTriangle size={12} color="#FFFFFF" />
                <Text style={styles.urgentImageText}>URGENT</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.cardContent}>
          {/* Header avec badge urgent si pas d'image */}
          <View style={styles.announcementHeader}>
            {!hasImage && isUrgent && (
              <View style={styles.urgentPillNoImage}>
                <AlertTriangle size={12} color="#FFFFFF" />
                <Text style={styles.urgentPillText}>URGENT</Text>
              </View>
            )}

            {announcement.type && !isUrgent && (
              <View style={[styles.typeBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : colors.primary[50] }]}>
                <Text style={[styles.typeText, { color: colors.primary[500] }]}>
                  {announcement.type}
                </Text>
              </View>
            )}

            <View style={styles.dateContainer}>
              <Calendar size={12} color={themeColors.textTertiary} />
              <Text style={[styles.announcementDate, { color: themeColors.textTertiary }]}>
                {formatDate(announcement.date)}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text
            style={[
              styles.announcementTitle,
              { color: isUrgent && !hasImage ? colors.semantic.error : themeColors.text },
            ]}
            numberOfLines={2}
          >
            {announcement.title}
          </Text>

          {/* Description */}
          {(announcement.description || announcement.content) && (
            <Text
              style={[styles.announcementDescription, { color: themeColors.textSecondary }]}
              numberOfLines={hasImage ? 2 : 3}
            >
              {announcement.description || announcement.content}
            </Text>
          )}

          {/* Footer - Lire plus */}
          <View style={styles.cardFooter}>
            <Text style={[styles.readMore, { color: colors.primary[500] }]}>
              Lire plus
            </Text>
            <ChevronRight size={16} color={colors.primary[500]} />
          </View>
        </View>
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
  title: {
    ...typography.headlineMedium,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: spacing[4],
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing[4],
  },
  urgentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  urgentBannerTitle: {
    ...typography.titleSmall,
    fontWeight: '700',
  },
  urgentBannerText: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  urgentBadge: {
    backgroundColor: colors.semantic.error,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  urgentBadgeText: {
    ...typography.labelMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  announcementCard: {
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing[3],
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  urgentImageBadge: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    backgroundColor: colors.semantic.error,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgentImageText: {
    ...typography.labelSmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardContent: {
    padding: spacing[4],
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  urgentPillNoImage: {
    backgroundColor: colors.semantic.error,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgentPillText: {
    ...typography.labelSmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  typeText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  announcementDate: {
    ...typography.labelSmall,
  },
  announcementTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  announcementDescription: {
    ...typography.bodyMedium,
    lineHeight: 22,
    marginBottom: spacing[3],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  readMore: {
    ...typography.labelMedium,
    fontWeight: '600',
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
