import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  ListMusic,
  Check,
  Plus,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  useColorScheme,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useUserStore } from '@/stores/useUserStore';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Playlist } from '@/types';

interface AddToPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  sermonId: string;
  sermonTitle?: string;
}

export function AddToPlaylistModal({
  visible,
  onClose,
  sermonId,
  sermonTitle,
}: AddToPlaylistModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const { playlists, addToPlaylist, removeFromPlaylist, createPlaylist } = useUserStore();

  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const isInPlaylist = (playlist: Playlist) => {
    return playlist.sermonIds.includes(sermonId);
  };

  const togglePlaylist = (playlist: Playlist) => {
    if (isInPlaylist(playlist)) {
      removeFromPlaylist(playlist.id, sermonId);
    } else {
      addToPlaylist(playlist.id, sermonId);
    }
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim() === '') return;

    const newPlaylist = createPlaylist(newPlaylistName.trim());
    addToPlaylist(newPlaylist.id, sermonId);
    setNewPlaylistName('');
    setShowCreateNew(false);
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color={themeColors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
              Ajouter a une playlist
            </Text>
            {sermonTitle && (
              <Text
                style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}
                numberOfLines={1}
              >
                {sermonTitle}
              </Text>
            )}
          </View>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Create New Playlist */}
          {showCreateNew ? (
            <Animated.View
              entering={FadeInDown.duration(300).springify()}
              style={[styles.createNewContainer, { backgroundColor: themeColors.card }]}
            >
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
              />
              <View style={styles.createNewActions}>
                <Pressable
                  style={[styles.cancelButton, { backgroundColor: themeColors.surface }]}
                  onPress={() => {
                    setShowCreateNew(false);
                    setNewPlaylistName('');
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>
                    Annuler
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.createButton,
                    {
                      backgroundColor: newPlaylistName.trim()
                        ? colors.primary[500]
                        : themeColors.surface,
                    },
                  ]}
                  onPress={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim()}
                >
                  <Text
                    style={[
                      styles.createButtonText,
                      {
                        color: newPlaylistName.trim()
                          ? '#FFFFFF'
                          : themeColors.textTertiary,
                      },
                    ]}
                  >
                    Creer
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          ) : (
            <Pressable
              style={[styles.createNewButton, { backgroundColor: themeColors.card }]}
              onPress={() => setShowCreateNew(true)}
            >
              <View style={[styles.createNewIcon, { backgroundColor: colors.primary[500] }]}>
                <Plus size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.createNewText, { color: themeColors.text }]}>
                Creer une nouvelle playlist
              </Text>
            </Pressable>
          )}

          {/* Existing Playlists */}
          {playlists.length > 0 && (
            <View style={styles.playlistsSection}>
              <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
                Vos playlists
              </Text>

              {playlists.map((playlist, index) => {
                const isSelected = isInPlaylist(playlist);
                return (
                  <Pressable
                    key={playlist.id}
                    style={[
                      styles.playlistItem,
                      {
                        backgroundColor: themeColors.card,
                        borderColor: isSelected ? colors.primary[500] : 'transparent',
                        borderWidth: isSelected ? 2 : 0,
                      },
                    ]}
                    onPress={() => togglePlaylist(playlist)}
                  >
                    <LinearGradient
                      colors={getPlaylistCoverColors(index)}
                      style={styles.playlistIcon}
                    >
                      <ListMusic size={18} color="rgba(255,255,255,0.9)" />
                    </LinearGradient>

                    <View style={styles.playlistInfo}>
                      <Text
                        style={[styles.playlistName, { color: themeColors.text }]}
                        numberOfLines={1}
                      >
                        {playlist.name}
                      </Text>
                      <Text style={[styles.playlistCount, { color: themeColors.textSecondary }]}>
                        {playlist.sermonIds.length} predication
                        {playlist.sermonIds.length !== 1 ? 's' : ''}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: isSelected ? colors.primary[500] : 'transparent',
                          borderColor: isSelected ? colors.primary[500] : themeColors.border,
                        },
                      ]}
                    >
                      {isSelected && <Check size={14} color="#FFFFFF" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {playlists.length === 0 && !showCreateNew && (
            <View style={styles.emptyContainer}>
              <ListMusic size={40} color={themeColors.textTertiary} />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                Aucune playlist
              </Text>
              <Text style={[styles.emptySubtext, { color: themeColors.textTertiary }]}>
                Creez votre premiere playlist ci-dessus
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
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
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing[4],
  },
  headerTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[5],
  },
  createNewIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  createNewText: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  createNewContainer: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[5],
  },
  input: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...typography.bodyMedium,
    marginBottom: spacing[3],
  },
  createNewActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  createButtonText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  playlistsSection: {
    marginTop: spacing[2],
  },
  sectionTitle: {
    ...typography.labelLarge,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: spacing[3],
    paddingLeft: spacing[2],
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[2],
  },
  playlistIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  playlistCount: {
    ...typography.labelSmall,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing[10],
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
});
