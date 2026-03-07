import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, User } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { membersApi } from '@/services/api';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Member } from '@/types';

const { width } = Dimensions.get('window');
const CARD_GAP = spacing[3];
const CARD_WIDTH = (width - spacing[4] * 2 - CARD_GAP) / 2;

export default function MembersScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [members, setMembers] = useState<Member[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await membersApi.getAll();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  }, [fetchMembers]);

  // Group by category
  const groupedMembers = members.reduce(
    (acc, member) => {
      const category = member.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(member);
      return acc;
    },
    {} as Record<string, Member[]>
  );

  const categoryLabels: Record<string, string> = {
    leadership: 'Équipe Dirigeante',
    diacres: 'Diacres',
    ministeres: 'Responsables des Ministères',
    other: 'Autres',
  };

  const sections = Object.entries(groupedMembers).map(([key, items]) => ({
    title: categoryLabels[key] || key,
    data: items,
  }));

  const renderMemberCard = (member: Member, index: number) => {
    // Support multiple possible column names for the image
    const imageUrl = member.photo_url || (member as any).photo || (member as any).image_url || (member as any).avatar;

    return (
      <Animated.View
        key={member.id}
        entering={FadeInDown.delay(index * 50).duration(400)}
        style={styles.cardWrapper}
      >
        <View style={styles.card}>
          {/* Photo */}
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.memberImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: themeColors.surface }]}>
                <User size={48} color={themeColors.textTertiary} />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={[styles.memberName, { color: themeColors.text }]} numberOfLines={2}>
              {member.name}
            </Text>
            <Text style={[styles.memberRole, { color: colors.primary[500] }]} numberOfLines={1}>
              {member.role}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderSection = (section: { title: string; data: Member[] }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
        {section.title}
      </Text>
      <View style={styles.grid}>
        {section.data.map((member, index) => renderMemberCard(member, index))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <View style={styles.headerRow}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: themeColors.surface, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={themeColors.text} />
          </Pressable>

          <Animated.View entering={FadeIn.duration(400)} style={styles.headerCenter}>
            <Text style={[styles.title, { color: themeColors.text }]}>Membres</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              {members.length} personne{members.length !== 1 ? 's' : ''}
            </Text>
          </Animated.View>

          {/* Spacer for centering */}
          <View style={styles.backButton} />
        </View>
      </View>

      {/* Content */}
      <FlashList
        data={sections}
        keyExtractor={(item) => item.title}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing[6] },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
        renderItem={({ item }) => renderSection(item)}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: themeColors.surface }]}>
              <User size={32} color={themeColors.textTertiary} />
            </View>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Aucun membre
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    ...typography.titleLarge,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },

  // Content
  listContent: {
    paddingHorizontal: spacing[4],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    ...typography.labelLarge,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[4],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },

  // Card
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing[3],
  },
  memberImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    paddingHorizontal: spacing[1],
  },
  memberName: {
    ...typography.titleSmall,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberRole: {
    ...typography.bodySmall,
    fontWeight: '500',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  emptyText: {
    ...typography.bodyMedium,
  },
});
