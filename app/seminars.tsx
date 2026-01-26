import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Search,
  ArrowLeft,
  FolderOpen,
  Calendar,
  Music,
  User,
  X,
  Plus,
} from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  FlatList,
  Pressable,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddSermonsToSeminarModal } from '@/components/AddSermonsToSeminarModal';
import { CreateSeminarModal } from '@/components/CreateSeminarModal';
import { seminarsApi } from '@/services/api';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Seminar } from '@/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing[4] * 2 - spacing[3]) / 2;

export default function SeminarsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [seminars, setSeminars] = useState<(Seminar & { sermon_count: number })[]>([]);
  const [filteredSeminars, setFilteredSeminars] = useState<(Seminar & { sermon_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addSermonsModalVisible, setAddSermonsModalVisible] = useState(false);
  const [createSeminarModalVisible, setCreateSeminarModalVisible] = useState(false);
  const [selectedSeminar, setSelectedSeminar] = useState<(Seminar & { sermon_count: number }) | null>(null);

  const loadSeminars = useCallback(async () => {
    try {
      const data = await seminarsApi.getWithSermonCount();
      setSeminars(data);
      setFilteredSeminars(data);
    } catch (error) {
      console.error('Error loading seminars:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSeminars();
  }, [loadSeminars]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSeminars(seminars);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = seminars.filter(
        (seminar) =>
          seminar.name.toLowerCase().includes(query) ||
          seminar.description?.toLowerCase().includes(query) ||
          seminar.speaker?.name.toLowerCase().includes(query)
      );
      setFilteredSeminars(filtered);
    }
  }, [searchQuery, seminars]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSeminars();
  }, [loadSeminars]);

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return null;

    const start = new Date(startDate);
    const startStr = start.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    if (!endDate) return startStr;

    const end = new Date(endDate);
    const endStr = end.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return `${startStr} - ${endStr}`;
  };

  const renderSeminarCard = ({ item, index }: { item: Seminar & { sermon_count: number }; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400).springify()}
      style={styles.cardWrapper}
    >
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: themeColors.card,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
        onPress={() => router.push(`/seminar/${item.id}`)}
      >
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          {item.cover_image ? (
            <Image
              source={{ uri: item.cover_image }}
              style={styles.cover}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={colors.gradients.primarySoft}
              style={styles.cover}
            >
              <FolderOpen size={32} color="#FFFFFF" />
            </LinearGradient>
          )}

          {/* Sermon Count Badge */}
          <View style={[styles.countBadge, { backgroundColor: colors.primary[500] }]}>
            <Music size={12} color="#FFFFFF" />
            <Text style={styles.countText}>{item.sermon_count}</Text>
          </View>

          {/* Add Sermons Button */}
          <Pressable
            style={[styles.addButton, { backgroundColor: colors.primary[500] }]}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedSeminar(item);
              setAddSermonsModalVisible(true);
            }}
          >
            <Plus size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <Text
            style={[styles.seminarName, { color: themeColors.text }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>

          {item.speaker && (
            <View style={styles.speakerRow}>
              <User size={12} color={themeColors.textSecondary} />
              <Text
                style={[styles.speakerName, { color: themeColors.textSecondary }]}
                numberOfLines={1}
              >
                {item.speaker.name}
              </Text>
            </View>
          )}

          {item.start_date && (
            <View style={styles.dateRow}>
              <Calendar size={12} color={themeColors.textTertiary} />
              <Text
                style={[styles.dateText, { color: themeColors.textTertiary }]}
                numberOfLines={1}
              >
                {formatDateRange(item.start_date, item.end_date)}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <View style={styles.headerTop}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: themeColors.surface,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={themeColors.text} />
          </Pressable>

          <Animated.View entering={FadeIn.duration(400)} style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
              Seminaires
            </Text>
            <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
              {seminars.length} serie{seminars.length > 1 ? 's' : ''} de predications
            </Text>
          </Animated.View>

          {/* Create Seminar Button */}
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              {
                backgroundColor: colors.primary[500],
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => setCreateSeminarModalVisible(true)}
          >
            <Plus size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400).springify()}
          style={[styles.searchContainer, { backgroundColor: themeColors.surface }]}
        >
          <Search size={18} color={themeColors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Rechercher un seminaire..."
            placeholderTextColor={themeColors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={18} color={themeColors.textSecondary} />
            </Pressable>
          )}
        </Animated.View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={filteredSeminars}
          renderItem={renderSeminarCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
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
          ListEmptyComponent={
            <Animated.View
              entering={FadeIn.delay(200).duration(400)}
              style={styles.emptyContainer}
            >
              <FolderOpen size={48} color={themeColors.textTertiary} />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                {searchQuery ? 'Aucun seminaire trouve' : 'Aucun seminaire disponible'}
              </Text>
              {searchQuery && (
                <Text style={[styles.emptySubtext, { color: themeColors.textTertiary }]}>
                  Essayez avec un autre terme de recherche
                </Text>
              )}
            </Animated.View>
          }
        />
      )}

      {/* Add Sermons to Seminar Modal */}
      <AddSermonsToSeminarModal
        visible={addSermonsModalVisible}
        onClose={() => {
          setAddSermonsModalVisible(false);
          setSelectedSeminar(null);
        }}
        seminarId={selectedSeminar?.id || ''}
        seminarName={selectedSeminar?.name}
        onSermonsUpdated={loadSeminars}
      />

      {/* Create Seminar Modal */}
      <CreateSeminarModal
        visible={createSeminarModalVisible}
        onClose={() => setCreateSeminarModalVisible(false)}
        onSeminarCreated={loadSeminars}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.titleLarge,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    gap: spacing[3],
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  coverContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadge: {
    position: 'absolute',
    bottom: spacing[2],
    right: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  addButton: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: spacing[3],
  },
  seminarName: {
    ...typography.titleSmall,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  speakerName: {
    ...typography.labelSmall,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    ...typography.labelSmall,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing[20],
  },
  emptyText: {
    ...typography.bodyLarge,
    marginTop: spacing[4],
  },
  emptySubtext: {
    ...typography.bodySmall,
    marginTop: spacing[2],
  },
});
