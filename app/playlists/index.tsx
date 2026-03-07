import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  ListMusic,
  Music,
  MoreHorizontal,
  Trash2,
  Edit2,
  X,
} from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Pressable,
  TextInput,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUserStore } from '@/stores/useUserStore';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Playlist } from '@/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing[4] * 2 - spacing[3]) / 2;

export default function PlaylistsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const { playlists, createPlaylist, deletePlaylist, renamePlaylist } = useUserStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [menuPlaylist, setMenuPlaylist] = useState<Playlist | null>(null);

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim() === '') {
      Alert.alert('Erreur', 'Le nom de la playlist ne peut pas être vide');
      return;
    }

    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    Alert.alert(
      'Supprimer la playlist',
      `Voulez-vous vraiment supprimer "${playlist.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deletePlaylist(playlist.id);
            setMenuPlaylist(null);
          },
        },
      ]
    );
  };

  const handleRenamePlaylist = () => {
    if (!editingPlaylist || newPlaylistName.trim() === '') return;

    renamePlaylist(editingPlaylist.id, newPlaylistName.trim());
    setEditingPlaylist(null);
    setNewPlaylistName('');
  };

  const openRenameModal = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setNewPlaylistName(playlist.name);
    setMenuPlaylist(null);
  };

  const getPlaylistCoverColors = (index: number): readonly [string, string, ...string[]] => {
    const colorSets: readonly [string, string][] = [
      [colors.primary[500], colors.primary[700]],
      ['#8B5CF6', '#6D28D9'],
      ['#EC4899', '#DB2777'],
      ['#F59E0B', '#D97706'],
      ['#10B981', '#059669'],
      ['#06B6D4', '#0891B2'],
    ];
    return colorSets[index % colorSets.length];
  };

  const renderPlaylistCard = ({ item, index }: { item: Playlist; index: number }) => (
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
        onPress={() => router.push(`/playlists/${item.id}`)}
        onLongPress={() => setMenuPlaylist(item)}
      >
        {/* Cover */}
        <LinearGradient
          colors={getPlaylistCoverColors(index)}
          style={styles.cover}
        >
          <ListMusic size={32} color="rgba(255,255,255,0.9)" />
        </LinearGradient>

        {/* Menu Button */}
        <Pressable
          style={styles.menuButton}
          onPress={() => setMenuPlaylist(item)}
        >
          <MoreHorizontal size={18} color={themeColors.textSecondary} />
        </Pressable>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <Text
            style={[styles.playlistName, { color: themeColors.text }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>

          <View style={styles.countRow}>
            <Music size={12} color={themeColors.textSecondary} />
            <Text style={[styles.countText, { color: themeColors.textSecondary }]}>
              {item.sermonIds.length} predication{item.sermonIds.length !== 1 ? 's' : ''}
            </Text>
          </View>
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
              Mes Playlists
            </Text>
            <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
              {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
            </Text>
          </Animated.View>

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              {
                backgroundColor: colors.primary[500],
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <FlashList
        data={playlists}
        renderItem={renderPlaylistCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing[6] },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View
            entering={FadeIn.delay(200).duration(400)}
            style={styles.emptyContainer}
          >
            <ListMusic size={48} color={themeColors.textTertiary} />
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Aucune playlist
            </Text>
            <Text style={[styles.emptySubtext, { color: themeColors.textTertiary }]}>
              Creez votre premiere playlist pour organiser vos predications preferees
            </Text>
            <Pressable
              style={[styles.createButton, { backgroundColor: colors.primary[500] }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Creer une playlist</Text>
            </Pressable>
          </Animated.View>
        }
      />

      {/* Create/Edit Modal */}
      {(showCreateModal || editingPlaylist) && (
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setShowCreateModal(false);
              setEditingPlaylist(null);
              setNewPlaylistName('');
            }}
          />
          <Animated.View
            entering={FadeInDown.duration(300).springify()}
            style={[styles.modal, { backgroundColor: themeColors.card, paddingBottom: insets.bottom + spacing[5] }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                {editingPlaylist ? 'Renommer la playlist' : 'Nouvelle playlist'}
              </Text>
              <Pressable
                onPress={() => {
                  setShowCreateModal(false);
                  setEditingPlaylist(null);
                  setNewPlaylistName('');
                }}
              >
                <X size={24} color={themeColors.textSecondary} />
              </Pressable>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.surface,
                  color: themeColors.text,
                  borderColor: themeColors.border,
                },
              ]}
              placeholder="Nom de la playlist"
              placeholderTextColor={themeColors.textTertiary}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={editingPlaylist ? handleRenamePlaylist : handleCreatePlaylist}
            />

            <Pressable
              style={[styles.submitButton, { backgroundColor: colors.primary[500] }]}
              onPress={editingPlaylist ? handleRenamePlaylist : handleCreatePlaylist}
            >
              <Text style={styles.submitButtonText}>
                {editingPlaylist ? 'Renommer' : 'Créer'}
              </Text>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      )}

      {/* Menu Modal */}
      {menuPlaylist && (
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setMenuPlaylist(null)}
          />
          <Animated.View
            entering={FadeInDown.duration(300).springify()}
            style={[styles.menuModal, { backgroundColor: themeColors.card, paddingBottom: insets.bottom + spacing[5] }]}
          >
            <Text style={[styles.menuTitle, { color: themeColors.text }]}>
              {menuPlaylist.name}
            </Text>

            <Pressable
              style={styles.menuItem}
              onPress={() => openRenameModal(menuPlaylist)}
            >
              <Edit2 size={20} color={themeColors.text} />
              <Text style={[styles.menuItemText, { color: themeColors.text }]}>
                Renommer
              </Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => handleDeletePlaylist(menuPlaylist)}
            >
              <Trash2 size={20} color={colors.semantic.error} />
              <Text style={[styles.menuItemText, { color: colors.semantic.error }]}>
                Supprimer
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
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
  },
  backButton: {
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
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
  cover: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: spacing[3],
  },
  playlistName: {
    ...typography.titleSmall,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    ...typography.labelSmall,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing[20],
    paddingHorizontal: spacing[6],
  },
  emptyText: {
    ...typography.bodyLarge,
    marginTop: spacing[4],
  },
  emptySubtext: {
    ...typography.bodySmall,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    marginTop: spacing[6],
  },
  createButtonText: {
    color: '#FFFFFF',
    ...typography.labelLarge,
    fontWeight: '600',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing[5],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
  },
  modalTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  input: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...typography.bodyMedium,
    marginBottom: spacing[4],
  },
  submitButton: {
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    ...typography.titleSmall,
    fontWeight: '600',
  },
  menuModal: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing[5],
  },
  menuTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  menuItemText: {
    ...typography.bodyLarge,
  },
});
