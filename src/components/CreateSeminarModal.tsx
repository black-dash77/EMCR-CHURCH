import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  FolderOpen,
  Camera,
  User,
  Calendar,
} from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Image,
  useColorScheme,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { seminarsApi, speakersApi } from '@/services/api';
import { supabase } from '@/services/supabase';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { Speaker } from '@/types';

interface CreateSeminarModalProps {
  visible: boolean;
  onClose: () => void;
  onSeminarCreated: () => void;
}

export function CreateSeminarModal({
  visible,
  onClose,
  onSeminarCreated,
}: CreateSeminarModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [speakerId, setSpeakerId] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSpeakerPicker, setShowSpeakerPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSpeakers();
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSpeakerId(null);
    setCoverImage(null);
    setStartDate('');
    setEndDate('');
  };

  const loadSpeakers = async () => {
    try {
      const data = await speakersApi.getAll();
      setSpeakers(data);
    } catch (error) {
      console.error('Error loading speakers:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `seminar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('seminars-covers')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('seminars-covers')
        .getPublicUrl(fileName);

      setCoverImage(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      await seminarsApi.create({
        name: name.trim(),
        description: description.trim() || null,
        speaker_id: speakerId,
        cover_image: coverImage,
        start_date: startDate || null,
        end_date: endDate || null,
      });

      onSeminarCreated();
      onClose();
    } catch (error) {
      console.error('Error creating seminar:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedSpeaker = speakers.find(s => s.id === speakerId);

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
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Nouveau seminaire
          </Text>
          <Pressable
            onPress={handleSubmit}
            style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]}
            disabled={!name.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : (
              <Text
                style={[
                  styles.saveButtonText,
                  { color: name.trim() ? colors.primary[500] : themeColors.textTertiary },
                ]}
              >
                Creer
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing[6] }}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover Image */}
          <Pressable
            style={[styles.coverPicker, { backgroundColor: themeColors.card }]}
            onPress={pickImage}
            disabled={uploading}
          >
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.coverImage} />
            ) : (
              <LinearGradient
                colors={colors.gradients.primarySoft}
                style={styles.coverPlaceholder}
              >
                {uploading ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : (
                  <>
                    <Camera size={32} color="#FFFFFF" />
                    <Text style={styles.coverPlaceholderText}>
                      Ajouter une image
                    </Text>
                  </>
                )}
              </LinearGradient>
            )}
          </Pressable>

          {/* Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              Nom du seminaire *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.card,
                  color: themeColors.text,
                  borderColor: themeColors.border,
                },
              ]}
              placeholder="Ex: Les fondements de la foi"
              placeholderTextColor={themeColors.textTertiary}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: themeColors.card,
                  color: themeColors.text,
                  borderColor: themeColors.border,
                },
              ]}
              placeholder="Description du seminaire..."
              placeholderTextColor={themeColors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Speaker */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              Orateur
            </Text>
            <Pressable
              style={[
                styles.pickerButton,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => setShowSpeakerPicker(!showSpeakerPicker)}
            >
              {selectedSpeaker ? (
                <View style={styles.selectedSpeaker}>
                  {selectedSpeaker.photo_url ? (
                    <Image
                      source={{ uri: selectedSpeaker.photo_url }}
                      style={styles.speakerAvatar}
                    />
                  ) : (
                    <View style={[styles.speakerAvatar, styles.speakerAvatarPlaceholder]}>
                      <User size={14} color="#FFFFFF" />
                    </View>
                  )}
                  <Text style={[styles.pickerText, { color: themeColors.text }]}>
                    {selectedSpeaker.name}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.pickerText, { color: themeColors.textTertiary }]}>
                  Selectionner un orateur
                </Text>
              )}
            </Pressable>

            {showSpeakerPicker && (
              <View style={[styles.speakerList, { backgroundColor: themeColors.card }]}>
                <Pressable
                  style={[styles.speakerItem, { borderBottomColor: themeColors.border }]}
                  onPress={() => {
                    setSpeakerId(null);
                    setShowSpeakerPicker(false);
                  }}
                >
                  <Text style={[styles.speakerItemText, { color: themeColors.textSecondary }]}>
                    Aucun orateur
                  </Text>
                </Pressable>
                {speakers.map(speaker => (
                  <Pressable
                    key={speaker.id}
                    style={[styles.speakerItem, { borderBottomColor: themeColors.border }]}
                    onPress={() => {
                      setSpeakerId(speaker.id);
                      setShowSpeakerPicker(false);
                    }}
                  >
                    {speaker.photo_url ? (
                      <Image
                        source={{ uri: speaker.photo_url }}
                        style={styles.speakerAvatar}
                      />
                    ) : (
                      <View style={[styles.speakerAvatar, styles.speakerAvatarPlaceholder]}>
                        <User size={14} color="#FFFFFF" />
                      </View>
                    )}
                    <Text style={[styles.speakerItemText, { color: themeColors.text }]}>
                      {speaker.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: themeColors.text }]}>
                Date de debut
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.card,
                    color: themeColors.text,
                    borderColor: themeColors.border,
                  },
                ]}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={themeColors.textTertiary}
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: themeColors.text }]}>
                Date de fin
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.card,
                    color: themeColors.text,
                    borderColor: themeColors.border,
                  },
                ]}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={themeColors.textTertiary}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>
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
  headerTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  saveButton: {
    padding: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  coverPicker: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing[5],
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
  },
  coverPlaceholderText: {
    color: '#FFFFFF',
    ...typography.labelMedium,
    fontWeight: '600',
  },
  field: {
    marginBottom: spacing[4],
  },
  label: {
    ...typography.labelMedium,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  input: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...typography.bodyMedium,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing[3],
  },
  pickerButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  pickerText: {
    ...typography.bodyMedium,
  },
  selectedSpeaker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  speakerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  speakerAvatarPlaceholder: {
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerList: {
    marginTop: spacing[2],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    maxHeight: 200,
  },
  speakerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  speakerItemText: {
    ...typography.bodyMedium,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
});
