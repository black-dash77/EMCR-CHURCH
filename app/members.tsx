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
import { ChevronLeft, User } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { membersApi } from '@/services/api';
import type { Member } from '@/types';

export default function MembersScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

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

  const renderMember = ({ item }: { item: Member }) => (
    <View style={[styles.memberCard, { backgroundColor: themeColors.card }]}>
      <View style={styles.memberAvatar}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary[100] }]}>
            <User size={24} color={colors.primary[500]} />
          </View>
        )}
      </View>
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: themeColors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.memberRole, { color: themeColors.textSecondary }]}>
          {item.role}
        </Text>
        {item.bio && (
          <Text
            style={[styles.memberBio, { color: themeColors.textTertiary }]}
            numberOfLines={2}
          >
            {item.bio}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={themeColors.text} />
        </Pressable>
        <Text style={[styles.title, { color: themeColors.text }]}>Membres</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.title}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
              {section.title}
            </Text>
            {section.data.map((member) => (
              <View key={member.id}>{renderMember({ item: member })}</View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <User size={48} color={themeColors.textTertiary} />
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Aucun membre
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  backButton: {
    padding: spacing[2],
  },
  title: {
    ...typography.titleLarge,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: 40,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    ...typography.labelLarge,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
  },
  memberCard: {
    flexDirection: 'row',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
  },
  memberAvatar: {
    marginRight: spacing[3],
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.titleSmall,
  },
  memberRole: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  memberBio: {
    ...typography.bodySmall,
    marginTop: spacing[1],
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
