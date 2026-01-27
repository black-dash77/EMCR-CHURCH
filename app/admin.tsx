import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { decode } from 'base64-arraybuffer';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  Mic,
  Calendar,
  Megaphone,
  Users,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  UserCircle,
  FolderOpen,
  Plus,
  Trash2,
  X,
  ArrowLeft,
  RefreshCw,
  Upload,
  Save,
  Edit3,
  Search,
  Music,
  Check,
  Video,
  Bell,
  Church,
} from 'lucide-react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/services/supabase';
import { colors, typography, spacing, borderRadius } from '@/theme';

// Types
interface Speaker {
  id: string;
  name: string;
  ministry?: string;
  bio?: string;
  photo_url?: string;
}

interface Seminar {
  id: string;
  name: string;
  description?: string;
  speaker_id?: string;
  speaker?: Speaker;
}

interface AdminSection {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description: string;
  count?: number;
}

interface DataItem {
  id: string;
  title?: string;
  name?: string;
  date?: string;
  created_at?: string;
  speaker?: string | Speaker;
  speaker_id?: string;
  seminar_id?: string;
  audio_url?: string;
  cover_image?: string;
  duration?: string;
  description?: string;
  content?: string;
  bio?: string;
  ministry?: string;
  photo_url?: string;
  image?: string;
  url?: string;
  caption?: string;
  email?: string;
  message?: string;
  phone?: string;
  download_url?: string;
  year?: number;
  is_active?: boolean;
  [key: string]: string | number | boolean | Speaker | undefined;
}


// ChurchInfo interface
interface ChurchInfo {
  id?: string;
  name: string;
  slogan: string;
  description: string;
  mission: string;
  vision: string;
  values: string[];
  history: string;
  pastor_name: string;
  pastor_photo: string;
  pastor_message: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  facebook: string;
  instagram: string;
  youtube: string;
  service_times: string;
  logo_url: string;
  cover_image: string;
}

// Supabase config for notifications
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// ChurchInfo Section Component
interface ChurchInfoSectionProps {
  themeColors: any;
  insets: { top: number; bottom: number };
  onBack: () => void;
}

function ChurchInfoSection({ themeColors, insets, onBack }: ChurchInfoSectionProps) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ChurchInfo>({
    name: 'Église Missionnaire Christ est Roi',
    slogan: '',
    description: '',
    mission: '',
    vision: '',
    values: [],
    history: '',
    pastor_name: '',
    pastor_photo: '',
    pastor_message: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    facebook: '',
    instagram: '',
    youtube: '',
    service_times: '',
    logo_url: '',
    cover_image: '',
  });
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    loadChurchInfo();
  }, []);

  const loadChurchInfo = async () => {
    try {
      const { data } = await supabase.from('church_info').select('*').single();
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.log('No church info found, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const handleAddValue = () => {
    if (newValue.trim()) {
      setFormData({
        ...formData,
        values: [...(formData.values || []), newValue.trim()],
      });
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setFormData({
      ...formData,
      values: (formData.values || []).filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      // Check if record exists
      const { data: existingData } = await supabase.from('church_info').select('id').single();

      let error;
      if (existingData) {
        ({ error } = await supabase.from('church_info').update(dataToSave).eq('id', existingData.id));
      } else {
        // UUID is auto-generated by the database
        ({ error } = await supabase.from('church_info').insert([dataToSave]));
      }

      if (error) {
        Alert.alert('Erreur', error.message);
      } else {
        Alert.alert('Succes', 'Informations enregistrees');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.sectionHeader, { paddingTop: insets.top + 10, backgroundColor: themeColors.background }]}>
        <Pressable onPress={onBack} style={styles.headerBackButton}>
          <ArrowLeft size={24} color={themeColors.text} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Notre Eglise</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveHeaderButton, { backgroundColor: colors.primary[500], opacity: saving ? 0.5 : 1 }]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Save size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identite */}
        <View style={[styles.formSection, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.formSectionTitle, { color: themeColors.text }]}>Identite de l'eglise</Text>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>Nom de l'eglise</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Nom de l'eglise"
              placeholderTextColor={themeColors.textTertiary}
            />
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>Slogan</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={formData.slogan}
              onChangeText={(text) => setFormData({ ...formData, slogan: text })}
              placeholder="ex: Une famille unie dans la foi"
              placeholderTextColor={themeColors.textTertiary}
            />
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Description de l'eglise..."
              placeholderTextColor={themeColors.textTertiary}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Mission & Vision */}
        <View style={[styles.formSection, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.formSectionTitle, { color: themeColors.text }]}>Mission & Vision</Text>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>Mission</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={formData.mission}
              onChangeText={(text) => setFormData({ ...formData, mission: text })}
              placeholder="Notre mission..."
              placeholderTextColor={themeColors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>Vision</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={formData.vision}
              onChangeText={(text) => setFormData({ ...formData, vision: text })}
              placeholder="Notre vision..."
              placeholderTextColor={themeColors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>Valeurs</Text>
            <View style={styles.valuesContainer}>
              {(formData.values || []).map((value, index) => (
                <View key={index} style={[styles.valueChip, { backgroundColor: colors.primary[500] }]}>
                  <Text style={styles.valueChipText}>{value}</Text>
                  <Pressable onPress={() => handleRemoveValue(index)}>
                    <X size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
            <View style={styles.addValueContainer}>
              <TextInput
                style={[styles.formInput, { flex: 1, backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                value={newValue}
                onChangeText={setNewValue}
                placeholder="Ajouter une valeur"
                placeholderTextColor={themeColors.textTertiary}
              />
              <Pressable
                onPress={handleAddValue}
                style={[styles.addValueButton, { backgroundColor: colors.primary[500] }]}
              >
                <Plus size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Contact */}
        <View style={[styles.formSection, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.formSectionTitle, { color: themeColors.text }]}>Contact</Text>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>Adresse</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Adresse complete"
              placeholderTextColor={themeColors.textTertiary}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formField, { flex: 1, marginRight: spacing[2] }]}>
              <Text style={[styles.formLabel, { color: themeColors.text }]}>Telephone</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="+33 1 23 45 67 89"
                placeholderTextColor={themeColors.textTertiary}
                keyboardType="phone-pad"
              />
            </View>
            <View style={[styles.formField, { flex: 1, marginLeft: spacing[2] }]}>
              <Text style={[styles.formLabel, { color: themeColors.text }]}>Email</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="contact@eglise.fr"
                placeholderTextColor={themeColors.textTertiary}
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>Site web</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={formData.website}
              onChangeText={(text) => setFormData({ ...formData, website: text })}
              placeholder="https://www.eglise.fr"
              placeholderTextColor={themeColors.textTertiary}
              keyboardType="url"
            />
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>Horaires des cultes</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={formData.service_times}
              onChangeText={(text) => setFormData({ ...formData, service_times: text })}
              placeholder="Dimanche 10h, Mercredi 19h..."
              placeholderTextColor={themeColors.textTertiary}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Reseaux sociaux */}
        <View style={[styles.formSection, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.formSectionTitle, { color: themeColors.text }]}>Reseaux sociaux</Text>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>Facebook</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={formData.facebook}
              onChangeText={(text) => setFormData({ ...formData, facebook: text })}
              placeholder="https://facebook.com/..."
              placeholderTextColor={themeColors.textTertiary}
            />
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>Instagram</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={formData.instagram}
              onChangeText={(text) => setFormData({ ...formData, instagram: text })}
              placeholder="https://instagram.com/..."
              placeholderTextColor={themeColors.textTertiary}
            />
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>YouTube</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={formData.youtube}
              onChangeText={(text) => setFormData({ ...formData, youtube: text })}
              placeholder="https://youtube.com/..."
              placeholderTextColor={themeColors.textTertiary}
            />
          </View>
        </View>

        {/* Pasteur */}
        <View style={[styles.formSection, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.formSectionTitle, { color: themeColors.text }]}>Pasteur</Text>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>Nom du pasteur</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={formData.pastor_name}
              onChangeText={(text) => setFormData({ ...formData, pastor_name: text })}
              placeholder="Nom complet"
              placeholderTextColor={themeColors.textTertiary}
            />
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>Message du pasteur</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={formData.pastor_message}
              onChangeText={(text) => setFormData({ ...formData, pastor_message: text })}
              placeholder="Message de bienvenue..."
              placeholderTextColor={themeColors.textTertiary}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Histoire */}
        <View style={[styles.formSection, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.formSectionTitle, { color: themeColors.text }]}>Histoire</Text>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>Histoire de l'eglise</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border, minHeight: 150 }]}
              value={formData.history}
              onChangeText={(text) => setFormData({ ...formData, history: text })}
              placeholder="L'histoire de notre eglise..."
              placeholderTextColor={themeColors.textTertiary}
              multiline
              numberOfLines={8}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Notifications Section Component
interface NotificationsSectionProps {
  themeColors: any;
  insets: { top: number; bottom: number };
  onBack: () => void;
  sermons: DataItem[];
}

function NotificationsSection({ themeColors, insets, onBack, sermons }: NotificationsSectionProps) {
  const [sending, setSending] = useState(false);
  const [notifType, setNotifType] = useState<'sermon' | 'custom'>('sermon');
  const [selectedSermon, setSelectedSermon] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [recentSermons, setRecentSermons] = useState<DataItem[]>([]);

  // Load recent sermons on mount
  useEffect(() => {
    loadRecentSermons();
  }, []);

  const loadRecentSermons = async () => {
    try {
      const { data } = await supabase
        .from('sermons')
        .select('id, title, speaker')
        .order('date', { ascending: false })
        .limit(20);
      if (data) setRecentSermons(data);
    } catch (error) {
      console.error('Error loading sermons:', error);
    }
  };

  // Auto-fill when sermon selected
  useEffect(() => {
    if (selectedSermon && notifType === 'sermon') {
      const sermon = recentSermons.find(s => s.id === selectedSermon);
      if (sermon) {
        setCustomTitle(`Nouvelle predication : ${sermon.title}`);
        setCustomBody(sermon.speaker ? `Par ${sermon.speaker}` : 'Ecoutez maintenant');
      }
    }
  }, [selectedSermon, notifType, recentSermons]);

  const handleSendNotification = async () => {
    if (!customTitle || !customBody) {
      Alert.alert('Erreur', 'Veuillez remplir le titre et le message');
      return;
    }

    Alert.alert(
      'Confirmer',
      `Envoyer la notification "${customTitle}" a tous les appareils ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            setSending(true);
            try {
              const payload: any = {
                title: customTitle,
                body: customBody,
                type: notifType === 'sermon' ? 'sermon' : 'custom',
              };

              if (notifType === 'sermon' && selectedSermon) {
                payload.contentId = selectedSermon;
                payload.data = {
                  sermon_id: selectedSermon,
                };
              }

              const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify(payload),
              });

              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.error || 'Erreur lors de l\'envoi');
              }

              Alert.alert(
                'Succes',
                `Notification envoyee a ${result.sent || 0} appareil(s)`,
                [{ text: 'OK' }]
              );

              // Reset form
              setSelectedSermon('');
              setCustomTitle('');
              setCustomBody('');
            } catch (error: any) {
              console.error('Error sending notification:', error);
              Alert.alert('Erreur', error.message || 'Impossible d\'envoyer la notification');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[notifStyles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[notifStyles.header, { paddingTop: insets.top + 10, backgroundColor: themeColors.background }]}>
        <Pressable onPress={onBack} style={notifStyles.backButton}>
          <ArrowLeft size={24} color={themeColors.text} />
        </Pressable>
        <View style={notifStyles.headerTitleContainer}>
          <Text style={[notifStyles.title, { color: themeColors.text }]}>Notifications Push</Text>
          <Text style={[notifStyles.subtitle, { color: themeColors.textSecondary }]}>
            Envoyez des notifications aux utilisateurs
          </Text>
        </View>
      </View>

      <ScrollView
        style={notifStyles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Type Selection */}
        <View style={notifStyles.section}>
          <Text style={[notifStyles.sectionTitle, { color: themeColors.text }]}>Type de notification</Text>
          <View style={notifStyles.typeButtons}>
            <Pressable
              style={[
                notifStyles.typeButton,
                { backgroundColor: notifType === 'sermon' ? '#3B82F6' : themeColors.card },
              ]}
              onPress={() => setNotifType('sermon')}
            >
              <Mic size={18} color={notifType === 'sermon' ? '#FFFFFF' : themeColors.text} />
              <Text style={[
                notifStyles.typeButtonText,
                { color: notifType === 'sermon' ? '#FFFFFF' : themeColors.text },
              ]}>Predication</Text>
            </Pressable>
            <Pressable
              style={[
                notifStyles.typeButton,
                { backgroundColor: notifType === 'custom' ? '#3B82F6' : themeColors.card },
              ]}
              onPress={() => {
                setNotifType('custom');
                setSelectedSermon('');
                setCustomTitle('');
                setCustomBody('');
              }}
            >
              <Edit3 size={18} color={notifType === 'custom' ? '#FFFFFF' : themeColors.text} />
              <Text style={[
                notifStyles.typeButtonText,
                { color: notifType === 'custom' ? '#FFFFFF' : themeColors.text },
              ]}>Personnalise</Text>
            </Pressable>
          </View>
        </View>

        {/* Sermon Selection */}
        {notifType === 'sermon' && (
          <View style={notifStyles.section}>
            <Text style={[notifStyles.sectionTitle, { color: themeColors.text }]}>Selectionner une predication</Text>
            <View style={[notifStyles.pickerContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <ScrollView style={{ maxHeight: 200 }}>
                {recentSermons.map((sermon) => (
                  <Pressable
                    key={sermon.id}
                    style={[
                      notifStyles.sermonItem,
                      selectedSermon === sermon.id && { backgroundColor: '#DBEAFE' },
                    ]}
                    onPress={() => setSelectedSermon(sermon.id)}
                  >
                    <View style={notifStyles.radioCircle}>
                      {selectedSermon === sermon.id && <View style={notifStyles.radioSelected} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[notifStyles.sermonTitle, { color: themeColors.text }]} numberOfLines={1}>
                        {sermon.title}
                      </Text>
                      {sermon.speaker && (
                        <Text style={[notifStyles.sermonSpeaker, { color: themeColors.textSecondary }]}>
                          {typeof sermon.speaker === 'string' ? sermon.speaker : ''}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
                {recentSermons.length === 0 && (
                  <Text style={[notifStyles.emptyText, { color: themeColors.textSecondary }]}>
                    Aucune predication disponible
                  </Text>
                )}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Title & Body */}
        <View style={notifStyles.section}>
          <Text style={[notifStyles.sectionTitle, { color: themeColors.text }]}>Titre</Text>
          <TextInput
            style={[notifStyles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
            placeholder="Titre de la notification"
            placeholderTextColor={themeColors.textTertiary}
            value={customTitle}
            onChangeText={setCustomTitle}
          />
        </View>

        <View style={notifStyles.section}>
          <Text style={[notifStyles.sectionTitle, { color: themeColors.text }]}>Message</Text>
          <TextInput
            style={[notifStyles.textArea, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
            placeholder="Contenu de la notification"
            placeholderTextColor={themeColors.textTertiary}
            value={customBody}
            onChangeText={setCustomBody}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Send Button */}
        <Pressable
          style={[
            notifStyles.sendButton,
            (!customTitle || !customBody || sending) && { opacity: 0.5 },
          ]}
          onPress={handleSendNotification}
          disabled={!customTitle || !customBody || sending}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={notifStyles.sendButtonGradient}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Bell size={20} color="#FFFFFF" />
                <Text style={notifStyles.sendButtonText}>Envoyer la notification</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const notifStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sermonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  sermonTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  sermonSpeaker: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
  },
  sendButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Storage bucket mapping
const STORAGE_BUCKETS: Record<string, string> = {
  'sermons.cover_image': 'sermon-covers',
  'sermons.audio_url': 'sermons-audio',
  'sermons.video_url': 'sermons-video',
  'speakers.photo_url': 'speakers-photos',
  'seminars.cover_image': 'seminars-covers',
  'events.image': 'events-images',
  'announcements.image': 'announcements-images',
  'members.photo': 'members-photos',
  'photos.url': 'gallery-photos',
};

export default function AdminScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Check for existing admin session on mount
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const adminSession = await AsyncStorage.getItem('admin_session');
        if (adminSession === 'authenticated') {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking admin session:', error);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAdminSession();
  }, []);

  // Data state
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DataItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Speakers and Seminars for selection
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [seminars, setSeminars] = useState<Seminar[]>([]);

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DataItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add/Edit modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DataItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [useExistingSpeaker, setUseExistingSpeaker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load counts and reference data on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadCounts();
      loadReferenceData();
    }
  }, [isAuthenticated]);

  const loadCounts = async () => {
    try {
      const tables = ['sermons', 'events', 'announcements', 'members', 'photos', 'contact_messages', 'speakers', 'seminars'];
      const newCounts: Record<string, number> = {};

      for (const table of tables) {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        newCounts[table] = count || 0;
      }

      setCounts(newCounts);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  const loadReferenceData = async () => {
    try {
      // Load speakers
      const { data: speakersData } = await supabase
        .from('speakers')
        .select('*')
        .order('name', { ascending: true });
      if (speakersData) setSpeakers(speakersData);

      // Load seminars with speaker info
      const { data: seminarsData } = await supabase
        .from('seminars')
        .select('*, speaker:speakers(*)')
        .order('name', { ascending: true });
      if (seminarsData) setSeminars(seminarsData);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      setAuthError('Veuillez entrer le mot de passe');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    // Mot de passe admin
    if (password === 'emcr2024') {
      try {
        await AsyncStorage.setItem('admin_session', 'authenticated');
        setIsAuthenticated(true);
        setPassword('');
      } catch (error) {
        console.error('Error saving admin session:', error);
        setAuthError('Erreur lors de la connexion');
      }
    } else {
      setAuthError('Mot de passe incorrect');
    }

    setAuthLoading(false);
  };

  const loadSectionData = async (sectionId: string) => {
    setLoading(true);
    setActiveSection(sectionId);
    setSearchTerm('');

    try {
      let query;
      switch (sectionId) {
        case 'sermons':
          query = supabase.from('sermons').select('*').order('date', { ascending: false });
          break;
        case 'events':
          query = supabase.from('events').select('*').order('date', { ascending: false });
          break;
        case 'announcements':
          query = supabase.from('announcements').select('*').order('date', { ascending: false });
          break;
        case 'members':
          query = supabase.from('members').select('*').order('name', { ascending: true });
          break;
        case 'photos':
          query = supabase.from('photos').select('*').order('created_at', { ascending: false });
          break;
        case 'contact_messages':
          query = supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
          break;
        case 'speakers':
          query = supabase.from('speakers').select('*').order('name', { ascending: true });
          break;
        case 'seminars':
          query = supabase.from('seminars').select('*, speaker:speakers(*)').order('created_at', { ascending: false });
          break;
        case 'notifications':
          // Section notifications - pas de données à charger
          setData([]);
          setLoading(false);
          return;
        default:
          setData([]);
          setLoading(false);
          return;
      }

      const { data: result, error } = await query;
      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les donnees');
    } finally {
      setLoading(false);
    }
  };

  // Filtered data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const q = searchTerm.toLowerCase();
    return data.filter(item => {
      const title = item.title || item.name || item.caption || '';
      const speaker = typeof item.speaker === 'string' ? item.speaker : '';
      return title.toLowerCase().includes(q) || speaker.toLowerCase().includes(q);
    });
  }, [data, searchTerm]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeSection) {
      await loadSectionData(activeSection);
    }
    await loadCounts();
    await loadReferenceData();
    setRefreshing(false);
  }, [activeSection]);

  const handleDelete = async () => {
    if (!itemToDelete || !activeSection) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from(activeSection).delete().eq('id', itemToDelete.id);
      if (error) throw error;

      setData(prev => prev.filter(item => item.id !== itemToDelete.id));
      setCounts(prev => ({ ...prev, [activeSection]: (prev[activeSection] || 1) - 1 }));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting:', error);
      Alert.alert('Erreur', 'Impossible de supprimer');
    } finally {
      setDeleting(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ date: new Date().toISOString().split('T')[0] });
    setUseExistingSpeaker(false);
    setShowFormModal(true);
  };

  const openEditModal = (item: DataItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setUseExistingSpeaker(!!item.speaker_id);
    setShowFormModal(true);
  };

  const pickImage = async (fieldKey: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Carré pour toutes les images (cohérent avec l'affichage du lecteur)
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const asset = result.assets[0];
        const bucketKey = `${activeSection}.${fieldKey}`;
        const bucket = STORAGE_BUCKETS[bucketKey] || 'photos';

        const fileExt = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}.${fileExt}`;

        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });

        const contentType = fileExt === 'png' ? 'image/png' : fileExt === 'gif' ? 'image/gif' : 'image/jpeg';

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, decode(base64), {
            contentType,
            upsert: true,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('Erreur', `Impossible d'uploader l'image: ${uploadError.message}`);
          return;
        }

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        setFormData(prev => ({ ...prev, [fieldKey]: publicUrl }));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Erreur', 'Impossible de selectionner l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingAudio(true);
        const asset = result.assets[0];
        const bucket = 'sermons-audio';

        const fileExt = asset.name.split('.').pop()?.toLowerCase() || 'mp3';
        const fileName = `${Date.now()}.${fileExt}`;

        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });

        const contentType = asset.mimeType || (fileExt === 'm4a' ? 'audio/mp4' : 'audio/mpeg');

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, decode(base64), {
            contentType,
            upsert: true,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('Erreur', `Impossible d'uploader l'audio: ${uploadError.message}`);
          return;
        }

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);

        if (__DEV__) {
          console.log('Audio uploaded successfully!');
        }

        setFormData(prev => ({
          ...prev,
          audio_url: publicUrl,
          download_url: publicUrl
        }));

        Alert.alert('Succes', `Audio uploade!\n\nURL: ${publicUrl}`);
      }
    } catch (error) {
      console.error('Audio picker error:', error);
      Alert.alert('Erreur', 'Impossible de selectionner l\'audio');
    } finally {
      setUploadingAudio(false);
    }
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingVideo(true);
        setVideoUploadProgress(0);
        const asset = result.assets[0];
        const bucket = 'sermons-video';

        const fileExt = asset.name.split('.').pop()?.toLowerCase() || 'mp4';
        const fileName = `${Date.now()}.${fileExt}`;
        const contentType = asset.mimeType || 'video/mp4';

        // Obtenir le blob du fichier
        const response = await fetch(asset.uri);
        const blob = await response.blob();

        // Simuler la progression (estimation)
        const progressInterval = setInterval(() => {
          setVideoUploadProgress(prev => Math.min(prev + 5, 90));
        }, 1000);

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, blob, {
            contentType,
            upsert: true,
          });

        clearInterval(progressInterval);
        setVideoUploadProgress(100);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('Erreur', `Impossible d'uploader la video: ${uploadError.message}`);
          return;
        }

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);

        setFormData(prev => ({
          ...prev,
          video_url: publicUrl,
        }));

        Alert.alert('Succes', 'Video uploadee!');
      }
    } catch (error) {
      console.error('Video picker error:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader la video');
    } finally {
      setUploadingVideo(false);
      setVideoUploadProgress(0);
    }
  };

  const handleSpeakerSelect = (speakerId: string) => {
    if (speakerId) {
      const selectedSpeaker = speakers.find(s => s.id === speakerId);
      setFormData(prev => ({
        ...prev,
        speaker_id: speakerId,
        speaker: selectedSpeaker?.name || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, speaker_id: '', speaker: '' }));
    }
  };

  const handleSave = async () => {
    if (!activeSection) return;

    // Basic validation
    if (activeSection === 'sermons' && !formData.title) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }
    if ((activeSection === 'speakers' || activeSection === 'members') && !formData.name) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }
    if (activeSection === 'seminars' && !formData.name) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }
    if (activeSection === 'events' && !formData.title) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = { ...formData };

      // Debug: Log formData before saving (dev only)
      if (__DEV__) {
        console.log('FormData before save:', JSON.stringify(formData, null, 2));
      }

      // Clean up data
      delete dataToSave.id;
      delete dataToSave.created_at;
      delete dataToSave.updated_at;

      // Handle speaker relationship for seminars
      if (activeSection === 'seminars') {
        delete dataToSave.speaker; // Remove nested speaker object
      }

      // Add year for sermons
      if (activeSection === 'sermons' && formData.date) {
        dataToSave.year = new Date(formData.date).getFullYear();
      }

      // Handle empty seminar_id
      if (dataToSave.seminar_id === '') {
        dataToSave.seminar_id = null;
      }
      if (dataToSave.speaker_id === '') {
        dataToSave.speaker_id = null;
      }

      // Debug: Log data to be saved (dev only)
      if (__DEV__) {
        console.log('Data to save:', JSON.stringify(dataToSave, null, 2));
      }

      let result: DataItem | null = null;
      if (editingItem) {
        // Update existing
        const { data: updatedItem, error } = await supabase
          .from(activeSection)
          .update(dataToSave)
          .eq('id', editingItem.id)
          .select()
          .single();

        if (error) throw error;
        result = updatedItem;

        // Update local data
        setData(prev => prev.map(item =>
          item.id === editingItem.id ? { ...item, ...result } : item
        ));
      } else {
        // Insert new
        const { data: newItem, error } = await supabase
          .from(activeSection)
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        result = newItem;

        if (result) {
          setData(prev => [result as DataItem, ...prev]);
          setCounts(prev => ({ ...prev, [activeSection]: (prev[activeSection] || 0) + 1 }));
        }
      }

      setShowFormModal(false);
      setFormData({});
      setEditingItem(null);
      Alert.alert('Succes', editingItem ? 'Element modifie avec succes' : 'Element ajoute avec succes');
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer');
    } finally {
      setSaving(false);
    }
  };

  const sections: AdminSection[] = [
    { id: 'sermons', icon: <Mic size={20} color="#FFFFFF" />, iconBg: '#3B82F6', label: 'Predications', description: 'Gerer les predications', count: counts.sermons },
    { id: 'speakers', icon: <UserCircle size={20} color="#FFFFFF" />, iconBg: '#8B5CF6', label: 'Orateurs', description: 'Gerer les orateurs', count: counts.speakers },
    { id: 'seminars', icon: <FolderOpen size={20} color="#FFFFFF" />, iconBg: '#EC4899', label: 'Seminaires', description: 'Gerer les seminaires', count: counts.seminars },
    { id: 'churchInfo', icon: <Church size={20} color="#FFFFFF" />, iconBg: '#7C3AED', label: 'Notre Eglise', description: 'Informations de l\'eglise' },
    { id: 'notifications', icon: <Bell size={20} color="#FFFFFF" />, iconBg: '#EF4444', label: 'Notifications', description: 'Envoyer des notifications push' },
    // Sections cachées temporairement - à réactiver plus tard
    // { id: 'events', icon: <Calendar size={20} color="#FFFFFF" />, iconBg: '#10B981', label: 'Evenements', description: 'Gerer les evenements', count: counts.events },
    // { id: 'announcements', icon: <Megaphone size={20} color="#FFFFFF" />, iconBg: '#F59E0B', label: 'Annonces', description: 'Gerer les annonces', count: counts.announcements },
    // { id: 'members', icon: <Users size={20} color="#FFFFFF" />, iconBg: '#6366F1', label: 'Membres', description: 'Gerer les membres', count: counts.members },
    // { id: 'photos', icon: <ImageIcon size={20} color="#FFFFFF" />, iconBg: '#14B8A6', label: 'Medias', description: 'Gerer les photos/videos', count: counts.photos },
    // { id: 'contact_messages', icon: <MessageSquare size={20} color="#FFFFFF" />, iconBg: '#EF4444', label: 'Messages', description: 'Messages de contact', count: counts.contact_messages },
  ];

  const getItemTitle = (item: DataItem): string => {
    return item.title || item.name || (item as { subject?: string }).subject || item.caption || 'Sans titre';
  };

  const getItemSubtitle = (item: DataItem): string => {
    if (activeSection === 'sermons' && item.speaker) {
      return typeof item.speaker === 'string' ? item.speaker : '';
    }
    if (item.date) return new Date(item.date).toLocaleDateString('fr-FR');
    if (item.created_at) return new Date(item.created_at).toLocaleDateString('fr-FR');
    if (item.email) return item.email;
    const role = (item as { role?: string }).role;
    if (role) return role;
    if (item.ministry) return item.ministry;
    return '';
  };

  const getItemExtra = (item: DataItem): string => {
    if (activeSection === 'sermons') {
      if (item.date) return new Date(item.date).toLocaleDateString('fr-FR');
    }
    if (activeSection === 'seminars' && item.speaker && typeof item.speaker === 'object' && 'name' in item.speaker) {
      return (item.speaker as { name: string }).name;
    }
    return '';
  };

  const canAddToSection = (sectionId: string) => {
    return sectionId !== 'contact_messages';
  };

  // Render form based on section
  const renderFormContent = () => {
    switch (activeSection) {
      case 'sermons':
        return renderSermonForm();
      case 'speakers':
        return renderSpeakerForm();
      case 'seminars':
        return renderSeminarForm();
      case 'events':
        return renderEventForm();
      case 'announcements':
        return renderAnnouncementForm();
      case 'members':
        return renderMemberForm();
      case 'photos':
        return renderPhotoForm();
      default:
        return null;
    }
  };

  const renderSermonForm = () => (
    <>
      {/* Content Type Selection */}
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Type de contenu <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <View style={[styles.selectWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectScroll}>
            {[
              { id: 'sermon', label: 'Prédication', color: '#3B82F6' },
              { id: 'adoration', label: 'Adoration', color: '#EC4899' },
              { id: 'louange', label: 'Louange', color: '#8B5CF6' },
            ].map((type) => (
              <Pressable
                key={type.id}
                style={[
                  styles.selectChip,
                  { borderColor: themeColors.border },
                  (formData.content_type || 'sermon') === type.id && { backgroundColor: type.color, borderColor: type.color },
                ]}
                onPress={() => setFormData(prev => ({ ...prev, content_type: type.id }))}
              >
                <Text style={[
                  styles.selectChipText,
                  { color: themeColors.text },
                  (formData.content_type || 'sermon') === type.id && { color: '#FFFFFF' },
                ]}>
                  {type.label}
                </Text>
                {(formData.content_type || 'sermon') === type.id && (
                  <Check size={14} color="#FFFFFF" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Title */}
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Titre <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder={formData.content_type === 'adoration' || formData.content_type === 'louange' ? "Titre du chant" : "Titre de la predication"}
          placeholderTextColor={themeColors.textTertiary}
          value={formData.title || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
        />
      </View>

      {/* Speaker Selection */}
      <View style={styles.formField}>
        <View style={styles.formLabelRow}>
          <Text style={[styles.formLabel, { color: themeColors.text }]}>
            Orateur <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <Pressable
            style={styles.toggleButton}
            onPress={() => {
              setUseExistingSpeaker(!useExistingSpeaker);
              if (!useExistingSpeaker) {
                setFormData(prev => ({ ...prev, speaker: '', speaker_id: '' }));
              }
            }}
          >
            <Text style={[styles.toggleButtonText, { color: '#3B82F6' }]}>
              {useExistingSpeaker ? 'Saisir manuellement' : 'Choisir existant'}
            </Text>
          </Pressable>
        </View>

        {useExistingSpeaker ? (
          <View style={[styles.selectWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectScroll}>
              {speakers.map((speaker) => (
                <Pressable
                  key={speaker.id}
                  style={[
                    styles.selectChip,
                    { borderColor: themeColors.border },
                    formData.speaker_id === speaker.id && styles.selectChipActive,
                  ]}
                  onPress={() => handleSpeakerSelect(speaker.id)}
                >
                  <Text style={[
                    styles.selectChipText,
                    { color: themeColors.text },
                    formData.speaker_id === speaker.id && styles.selectChipTextActive,
                  ]}>
                    {speaker.name}
                  </Text>
                  {formData.speaker_id === speaker.id && (
                    <Check size={14} color="#FFFFFF" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : (
          <TextInput
            style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
            placeholder="Nom de l'orateur"
            placeholderTextColor={themeColors.textTertiary}
            value={formData.speaker || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, speaker: text, speaker_id: '' }))}
          />
        )}

        {formData.speaker_id && (
          <Text style={styles.linkedText}>
            ✓ Orateur lie : {formData.speaker}
          </Text>
        )}
      </View>

      {/* Date */}
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Date <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <Pressable
          style={[styles.formInput, styles.datePickerButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar size={18} color={themeColors.textTertiary} />
          <Text style={[styles.datePickerText, { color: formData.date ? themeColors.text : themeColors.textTertiary }]}>
            {formData.date || 'Selectionner une date'}
          </Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={formData.date ? new Date(formData.date) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                const dateString = selectedDate.toISOString().split('T')[0];
                setFormData(prev => ({ ...prev, date: dateString }));
              }
            }}
            maximumDate={new Date()}
          />
        )}
        {Platform.OS === 'ios' && showDatePicker && (
          <Pressable
            style={[styles.datePickerDoneButton, { backgroundColor: colors.primary[500] }]}
            onPress={() => setShowDatePicker(false)}
          >
            <Text style={styles.datePickerDoneText}>Confirmer</Text>
          </Pressable>
        )}
      </View>

      {/* Duration & Series */}
      <View style={styles.formRow}>
        <View style={[styles.formField, { flex: 1, marginRight: spacing[2] }]}>
          <Text style={[styles.formLabel, { color: themeColors.text }]}>Duree</Text>
          <View
            style={[styles.formInput, styles.durationDisplay, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          >
            <Text style={[styles.durationText, { color: formData.duration ? themeColors.text : themeColors.textTertiary }]}>
              {formData.duration || 'Auto'}
            </Text>
          </View>
        </View>
        <View style={[styles.formField, { flex: 1, marginLeft: spacing[2] }]}>
          <Text style={[styles.formLabel, { color: themeColors.text }]}>Serie</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
            placeholder="Nom de la serie"
            placeholderTextColor={themeColors.textTertiary}
            value={formData.series || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, series: text }))}
          />
        </View>
      </View>

      {/* Seminar Selection */}
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Seminaire (optionnel)
        </Text>
        <View style={[styles.selectWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectScroll}>
            <Pressable
              style={[
                styles.selectChip,
                { borderColor: themeColors.border },
                !formData.seminar_id && styles.selectChipActive,
              ]}
              onPress={() => setFormData(prev => ({ ...prev, seminar_id: '' }))}
            >
              <Text style={[
                styles.selectChipText,
                { color: themeColors.text },
                !formData.seminar_id && styles.selectChipTextActive,
              ]}>
                Aucun
              </Text>
            </Pressable>
            {seminars.map((seminar) => (
              <Pressable
                key={seminar.id}
                style={[
                  styles.selectChip,
                  { borderColor: themeColors.border },
                  formData.seminar_id === seminar.id && styles.selectChipActive,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, seminar_id: seminar.id }))}
              >
                <Text style={[
                  styles.selectChipText,
                  { color: themeColors.text },
                  formData.seminar_id === seminar.id && styles.selectChipTextActive,
                ]}>
                  {seminar.name}
                </Text>
                {formData.seminar_id === seminar.id && (
                  <Check size={14} color="#FFFFFF" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
        {formData.seminar_id && (
          <Text style={styles.linkedText}>
            ✓ Cette predication sera liee au seminaire
          </Text>
        )}
      </View>

      {/* Cover Image */}
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Image de couverture</Text>
        {formData.cover_image ? (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: formData.cover_image }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <Pressable
              style={styles.removeImageButton}
              onPress={() => setFormData(prev => ({ ...prev, cover_image: '' }))}
            >
              <X size={16} color="#FFFFFF" />
            </Pressable>
            <Pressable
              style={[styles.replaceImageButton, { backgroundColor: themeColors.card }]}
              onPress={() => pickImage('cover_image')}
            >
              <Text style={[styles.replaceImageText, { color: '#3B82F6' }]}>Remplacer</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.imagePickerButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => pickImage('cover_image')}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
              <>
                <Upload size={24} color={themeColors.textTertiary} />
                <Text style={[styles.imagePickerText, { color: themeColors.textSecondary }]}>
                  Choisir une image
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Audio File */}
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Fichier audio</Text>
        {formData.audio_url ? (
          <View style={[styles.audioPreview, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.audioPreviewContent}>
              <Music size={24} color="#10B981" />
              <View style={styles.audioPreviewText}>
                <Text style={[styles.audioUploadedText, { color: '#10B981' }]}>
                  ✓ Fichier audio uploade
                </Text>
                <Text style={[styles.audioUrlText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                  {formData.audio_url.split('/').pop()}
                </Text>
              </View>
            </View>
            <View style={styles.audioActions}>
              <Pressable
                style={styles.audioActionButton}
                onPress={pickAudio}
              >
                <Text style={[styles.audioActionText, { color: '#3B82F6' }]}>Remplacer</Text>
              </Pressable>
              <Pressable
                style={styles.audioActionButton}
                onPress={() => setFormData(prev => ({ ...prev, audio_url: '', download_url: '' }))}
              >
                <Text style={[styles.audioActionText, { color: '#EF4444' }]}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={[styles.audioPickerButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={pickAudio}
            disabled={uploadingAudio}
          >
            {uploadingAudio ? (
              <>
                <ActivityIndicator color="#3B82F6" />
                <Text style={[styles.audioPickerText, { color: themeColors.textSecondary }]}>
                  Upload en cours...
                </Text>
              </>
            ) : (
              <>
                <Music size={32} color={themeColors.textTertiary} />
                <Text style={[styles.audioPickerText, { color: themeColors.textSecondary }]}>
                  Glissez ou cliquez pour ajouter un fichier audio
                </Text>
                <View style={styles.audioPickerButtonInner}>
                  <Upload size={16} color="#FFFFFF" />
                  <Text style={styles.audioPickerButtonText}>Parcourir</Text>
                </View>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Video File */}
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Fichier video (optionnel)</Text>
        {formData.video_url ? (
          <View style={[styles.audioPreview, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.audioPreviewContent}>
              <Video size={24} color="#8B5CF6" />
              <View style={styles.audioPreviewText}>
                <Text style={[styles.audioUploadedText, { color: '#8B5CF6' }]}>
                  ✓ Fichier video uploade
                </Text>
                <Text style={[styles.audioUrlText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                  {formData.video_url.split('/').pop()}
                </Text>
              </View>
            </View>
            <View style={styles.audioActions}>
              <Pressable
                style={styles.audioActionButton}
                onPress={pickVideo}
              >
                <Text style={[styles.audioActionText, { color: '#3B82F6' }]}>Remplacer</Text>
              </Pressable>
              <Pressable
                style={styles.audioActionButton}
                onPress={() => setFormData(prev => ({ ...prev, video_url: '' }))}
              >
                <Text style={[styles.audioActionText, { color: '#EF4444' }]}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={[styles.audioPickerButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={pickVideo}
            disabled={uploadingVideo}
          >
            {uploadingVideo ? (
              <View style={styles.uploadProgressContainer}>
                <ActivityIndicator color="#8B5CF6" />
                <Text style={[styles.audioPickerText, { color: themeColors.textSecondary }]}>
                  Upload en cours... {videoUploadProgress}%
                </Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${videoUploadProgress}%` }]} />
                </View>
              </View>
            ) : (
              <>
                <Video size={32} color={themeColors.textTertiary} />
                <Text style={[styles.audioPickerText, { color: themeColors.textSecondary }]}>
                  Glissez ou cliquez pour ajouter une video
                </Text>
                <View style={[styles.audioPickerButtonInner, { backgroundColor: '#8B5CF6' }]}>
                  <Upload size={16} color="#FFFFFF" />
                  <Text style={styles.audioPickerButtonText}>Parcourir</Text>
                </View>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* YouTube URL - Recommended for faster streaming */}
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Lien YouTube (recommande)
        </Text>
        <Text style={[styles.formHint, { color: themeColors.textTertiary }]}>
          Plus rapide que l'upload video. Collez le lien YouTube de la predication.
        </Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="https://www.youtube.com/watch?v=..."
          placeholderTextColor={themeColors.textTertiary}
          value={formData.youtube_url || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, youtube_url: text }))}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {formData.youtube_url && (
          <Text style={styles.linkedText}>
            ✓ Lien YouTube ajoute
          </Text>
        )}
      </View>
    </>
  );

  const renderSpeakerForm = () => (
    <>
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Nom <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Nom complet"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.name || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
        />
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Ministere</Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Ex: Pasteur, Evangeliste"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.ministry || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, ministry: text }))}
        />
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Biographie</Text>
        <TextInput
          style={[styles.formInput, styles.formTextarea, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Biographie de l'orateur"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.bio || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Photo</Text>
        {formData.photo_url ? (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: formData.photo_url }}
              style={[styles.imagePreview, { aspectRatio: 1, height: 150 }]}
              resizeMode="cover"
            />
            <Pressable
              style={styles.removeImageButton}
              onPress={() => setFormData(prev => ({ ...prev, photo_url: '' }))}
            >
              <X size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.imagePickerButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => pickImage('photo_url')}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
              <>
                <Upload size={24} color={themeColors.textTertiary} />
                <Text style={[styles.imagePickerText, { color: themeColors.textSecondary }]}>
                  Choisir une photo
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </>
  );

  const renderSeminarForm = () => (
    <>
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Nom du seminaire <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Nom du seminaire"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.name || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
        />
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Description</Text>
        <TextInput
          style={[styles.formInput, styles.formTextarea, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Description du seminaire"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.description || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Orateur</Text>
        <View style={[styles.selectWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectScroll}>
            <Pressable
              style={[
                styles.selectChip,
                { borderColor: themeColors.border },
                !formData.speaker_id && styles.selectChipActive,
              ]}
              onPress={() => setFormData(prev => ({ ...prev, speaker_id: '' }))}
            >
              <Text style={[
                styles.selectChipText,
                { color: themeColors.text },
                !formData.speaker_id && styles.selectChipTextActive,
              ]}>
                Aucun
              </Text>
            </Pressable>
            {speakers.map((speaker) => (
              <Pressable
                key={speaker.id}
                style={[
                  styles.selectChip,
                  { borderColor: themeColors.border },
                  formData.speaker_id === speaker.id && styles.selectChipActive,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, speaker_id: speaker.id }))}
              >
                <Text style={[
                  styles.selectChipText,
                  { color: themeColors.text },
                  formData.speaker_id === speaker.id && styles.selectChipTextActive,
                ]}>
                  {speaker.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formField, { flex: 1, marginRight: spacing[2] }]}>
          <Text style={[styles.formLabel, { color: themeColors.text }]}>Date debut</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={themeColors.textTertiary}
            value={formData.start_date || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, start_date: text }))}
          />
        </View>
        <View style={[styles.formField, { flex: 1, marginLeft: spacing[2] }]}>
          <Text style={[styles.formLabel, { color: themeColors.text }]}>Date fin</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={themeColors.textTertiary}
            value={formData.end_date || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, end_date: text }))}
          />
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Image de couverture</Text>
        {formData.cover_image ? (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: formData.cover_image }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <Pressable
              style={styles.removeImageButton}
              onPress={() => setFormData(prev => ({ ...prev, cover_image: '' }))}
            >
              <X size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.imagePickerButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => pickImage('cover_image')}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
              <>
                <Upload size={24} color={themeColors.textTertiary} />
                <Text style={[styles.imagePickerText, { color: themeColors.textSecondary }]}>
                  Choisir une image
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </>
  );

  const renderEventForm = () => (
    <>
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Titre <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Titre de l'evenement"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.title || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
        />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formField, { flex: 1, marginRight: spacing[2] }]}>
          <Text style={[styles.formLabel, { color: themeColors.text }]}>
            Date <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={themeColors.textTertiary}
            value={formData.date || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
          />
        </View>
        <View style={[styles.formField, { flex: 1, marginLeft: spacing[2] }]}>
          <Text style={[styles.formLabel, { color: themeColors.text }]}>
            Heure <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
            placeholder="Ex: 10h00"
            placeholderTextColor={themeColors.textTertiary}
            value={formData.time || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, time: text }))}
          />
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Lieu <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Adresse ou lieu"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.location || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
        />
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Type</Text>
        <View style={styles.selectContainer}>
          {['culte', 'conference', 'reunion', 'autre'].map((type) => (
            <Pressable
              key={type}
              style={[
                styles.selectOption,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                formData.type === type && styles.selectOptionActive,
              ]}
              onPress={() => setFormData(prev => ({ ...prev, type }))}
            >
              <Text style={[
                styles.selectOptionText,
                { color: themeColors.text },
                formData.type === type && styles.selectOptionTextActive,
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Description</Text>
        <TextInput
          style={[styles.formInput, styles.formTextarea, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Description de l'evenement"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.description || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Image</Text>
        {formData.image ? (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: formData.image }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <Pressable
              style={styles.removeImageButton}
              onPress={() => setFormData(prev => ({ ...prev, image: '' }))}
            >
              <X size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.imagePickerButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => pickImage('image')}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
              <>
                <Upload size={24} color={themeColors.textTertiary} />
                <Text style={[styles.imagePickerText, { color: themeColors.textSecondary }]}>
                  Choisir une image
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </>
  );

  const renderAnnouncementForm = () => (
    <>
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Titre <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Titre de l'annonce"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.title || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
        />
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Contenu <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <TextInput
          style={[styles.formInput, styles.formTextarea, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Contenu de l'annonce"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.content || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Date <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.date || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
        />
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Type</Text>
        <View style={styles.selectContainer}>
          {['general', 'urgent', 'info'].map((type) => (
            <Pressable
              key={type}
              style={[
                styles.selectOption,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                formData.type === type && styles.selectOptionActive,
              ]}
              onPress={() => setFormData(prev => ({ ...prev, type }))}
            >
              <Text style={[
                styles.selectOptionText,
                { color: themeColors.text },
                formData.type === type && styles.selectOptionTextActive,
              ]}>
                {type === 'general' ? 'General' : type === 'urgent' ? 'Urgent' : 'Information'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Image</Text>
        {formData.image ? (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: formData.image }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <Pressable
              style={styles.removeImageButton}
              onPress={() => setFormData(prev => ({ ...prev, image: '' }))}
            >
              <X size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.imagePickerButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => pickImage('image')}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
              <>
                <Upload size={24} color={themeColors.textTertiary} />
                <Text style={[styles.imagePickerText, { color: themeColors.textSecondary }]}>
                  Choisir une image
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </>
  );

  const renderMemberForm = () => (
    <>
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Nom <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Nom complet"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.name || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
        />
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Role <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Ex: Pasteur, Diacre"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.role || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, role: text }))}
        />
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Categorie <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Ex: leadership, diacres, ministeres"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.category || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
        />
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Photo</Text>
        {formData.photo ? (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: formData.photo }}
              style={[styles.imagePreview, { aspectRatio: 1, height: 150 }]}
              resizeMode="cover"
            />
            <Pressable
              style={styles.removeImageButton}
              onPress={() => setFormData(prev => ({ ...prev, photo: '' }))}
            >
              <X size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.imagePickerButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => pickImage('photo')}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
              <>
                <Upload size={24} color={themeColors.textTertiary} />
                <Text style={[styles.imagePickerText, { color: themeColors.textSecondary }]}>
                  Choisir une photo
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </>
  );

  const renderPhotoForm = () => (
    <>
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Image <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        {formData.url ? (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: formData.url }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <Pressable
              style={styles.removeImageButton}
              onPress={() => setFormData(prev => ({ ...prev, url: '' }))}
            >
              <X size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.imagePickerButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => pickImage('url')}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
              <>
                <Upload size={24} color={themeColors.textTertiary} />
                <Text style={[styles.imagePickerText, { color: themeColors.textSecondary }]}>
                  Choisir une image
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>Legende</Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Description de l'image"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.caption || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, caption: text }))}
        />
      </View>
    </>
  );

  // Loading Screen - checking for existing session
  if (checkingAuth) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.loginContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              style={[styles.backButton, { top: insets.top + 10 }]}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={themeColors.text} />
            </Pressable>

            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.loginContent}>
              <View style={styles.loginLogoContainer}>
                <Image
                  source={require('../assets/icon.png')}
                  style={styles.loginLogoImage}
                />
              </View>

              <Text style={[styles.loginTitle, { color: themeColors.text }]}>
                Administration
              </Text>
              <Text style={[styles.loginSubtitle, { color: themeColors.textSecondary }]}>
                Entrez le mot de passe pour acceder au panneau d'administration
              </Text>

              <View style={[styles.inputContainer, { backgroundColor: themeColors.card, borderColor: authError ? '#EF4444' : themeColors.border }]}>
                <Lock size={20} color={themeColors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Mot de passe"
                  placeholderTextColor={themeColors.textTertiary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={handleLogin}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color={themeColors.textTertiary} />
                  ) : (
                    <Eye size={20} color={themeColors.textTertiary} />
                  )}
                </Pressable>
              </View>

              {authError ? (
                <Animated.Text entering={FadeIn} style={styles.errorText}>
                  {authError}
                </Animated.Text>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  styles.loginButtonSolid,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
                onPress={handleLogin}
                disabled={authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Se connecter</Text>
                    <ChevronRight size={20} color="#FFFFFF" />
                  </>
                )}
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Notifications Section View
  if (activeSection === 'notifications') {
    return (
      <NotificationsSection
        themeColors={themeColors}
        insets={insets}
        onBack={() => setActiveSection(null)}
        sermons={data}
      />
    );
  }

  // Church Info Section View
  if (activeSection === 'churchInfo') {
    return (
      <ChurchInfoSection
        themeColors={themeColors}
        insets={insets}
        onBack={() => setActiveSection(null)}
      />
    );
  }

  // Data List View
  if (activeSection) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <View style={[styles.sectionHeader, { paddingTop: insets.top + 10, backgroundColor: themeColors.background }]}>
          <Pressable onPress={() => setActiveSection(null)} style={styles.headerBackButton}>
            <ArrowLeft size={24} color={themeColors.text} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              {sections.find(s => s.id === activeSection)?.label}
            </Text>
            <Text style={[styles.sectionCount, { color: themeColors.textSecondary }]}>
              {filteredData.length} elements
            </Text>
          </View>
          <Pressable onPress={onRefresh} style={styles.refreshButton}>
            <RefreshCw size={20} color={themeColors.text} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Search size={18} color={themeColors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Rechercher..."
              placeholderTextColor={themeColors.textTertiary}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm ? (
              <Pressable onPress={() => setSearchTerm('')}>
                <X size={18} color={themeColors.textTertiary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Data List */}
        <ScrollView
          style={styles.dataList}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                Chargement...
              </Text>
            </View>
          ) : filteredData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                {searchTerm ? 'Aucun resultat' : 'Aucun element'}
              </Text>
            </View>
          ) : (
            filteredData.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 30).duration(200)}
              >
                <View style={[styles.dataItem, { backgroundColor: themeColors.card }]}>
                  <Pressable
                    style={styles.dataItemContent}
                    onPress={() => openEditModal(item)}
                  >
                    <Text style={[styles.dataItemTitle, { color: themeColors.text }]} numberOfLines={1}>
                      {getItemTitle(item)}
                    </Text>
                    <Text style={[styles.dataItemSubtitle, { color: themeColors.textSecondary }]} numberOfLines={1}>
                      {getItemSubtitle(item)}
                    </Text>
                    {getItemExtra(item) ? (
                      <Text style={[styles.dataItemExtra, { color: themeColors.textTertiary }]} numberOfLines={1}>
                        {getItemExtra(item)}
                      </Text>
                    ) : null}
                  </Pressable>
                  <View style={styles.dataItemActions}>
                    <Pressable
                      style={[styles.editButton, { backgroundColor: '#DBEAFE' }]}
                      onPress={() => openEditModal(item)}
                    >
                      <Edit3 size={16} color="#3B82F6" />
                    </Pressable>
                    <Pressable
                      style={[styles.deleteButton, { backgroundColor: '#FEE2E2' }]}
                      onPress={() => {
                        setItemToDelete(item);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </ScrollView>

        {/* Add Button */}
        {canAddToSection(activeSection) && (
          <Pressable
            style={styles.fab}
            onPress={openAddModal}
          >
            <View style={styles.fabGradient}>
              <Plus size={28} color="#FFFFFF" />
            </View>
          </Pressable>
        )}

        {/* Delete Modal */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Confirmer la suppression
              </Text>
              <Text style={[styles.modalMessage, { color: themeColors.textSecondary }]}>
                Voulez-vous vraiment supprimer "{itemToDelete ? getItemTitle(itemToDelete) : ''}" ?
              </Text>
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton, { borderColor: themeColors.border }]}
                  onPress={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>Annuler</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Supprimer</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add/Edit Form Modal */}
        <Modal
          visible={showFormModal}
          animationType="slide"
          onRequestClose={() => setShowFormModal(false)}
        >
          <View style={[styles.formModalContainer, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
            {/* Form Header */}
            <View style={[styles.formHeader, { borderBottomColor: themeColors.border }]}>
              <Pressable onPress={() => setShowFormModal(false)} style={styles.formCloseButton}>
                <X size={24} color={themeColors.text} />
              </Pressable>
              <Text style={[styles.formTitle, { color: themeColors.text }]}>
                {editingItem ? 'Modifier' : 'Ajouter'}
              </Text>
              <Pressable
                onPress={handleSave}
                disabled={saving || uploadingImage || uploadingAudio || uploadingVideo}
                style={[styles.formSaveButton, (saving || uploadingImage || uploadingAudio || uploadingVideo) && { opacity: 0.5 }]}
              >
                {saving ? (
                  <ActivityIndicator color="#3B82F6" size="small" />
                ) : (
                  <Save size={24} color="#3B82F6" />
                )}
              </Pressable>
            </View>

            {/* Form Content */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView
                style={styles.formContent}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                keyboardShouldPersistTaps="handled"
              >
                {renderFormContent()}
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>
    );
  }

  // Main Admin Dashboard
  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.dashboardHeader}>
          <Pressable onPress={() => router.back()} style={styles.headerBackButton}>
            <ArrowLeft size={24} color={themeColors.text} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.dashboardTitle, { color: themeColors.text }]}>
              Administration
            </Text>
            <Text style={[styles.dashboardSubtitle, { color: themeColors.textSecondary }]}>
              Gerez votre contenu
            </Text>
          </View>
        </View>

        <View style={styles.sectionsGrid}>
          {sections.map((section, index) => (
            <Animated.View
              key={section.id}
              entering={FadeInDown.delay(index * 50).duration(400)}
              style={styles.sectionCardWrapper}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.sectionCard,
                  { backgroundColor: themeColors.card, transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
                onPress={() => loadSectionData(section.id)}
              >
                <View style={[styles.sectionIcon, { backgroundColor: section.iconBg }]}>
                  {section.icon}
                </View>
                <Text style={[styles.sectionLabel, { color: themeColors.text }]}>
                  {section.label}
                </Text>
                <Text style={[styles.sectionDescription, { color: themeColors.textSecondary }]} numberOfLines={1}>
                  {section.description}
                </Text>
                {section.count !== undefined && (
                  <View style={[styles.countBadge, { backgroundColor: section.iconBg + '20' }]}>
                    <Text style={[styles.countText, { color: section.iconBg }]}>
                      {section.count}
                    </Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <View style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
            <View style={[styles.infoIcon, { backgroundColor: '#3B82F620' }]}>
              <Settings size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: themeColors.text }]}>
                Panneau Web
              </Text>
              <Text style={[styles.infoDescription, { color: themeColors.textSecondary }]}>
                Pour une gestion complete, utilisez le panneau d'administration web
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450).duration(400)}>
          <Pressable
            style={[styles.logoutButton, { borderColor: '#EF4444' }]}
            onPress={async () => {
              try {
                await AsyncStorage.removeItem('admin_session');
              } catch (error) {
                console.error('Error removing admin session:', error);
              }
              setIsAuthenticated(false);
              setActiveSection(null);
              setData([]);
            }}
          >
            <Text style={styles.logoutText}>Se deconnecter</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loginContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  backButton: {
    position: 'absolute',
    left: spacing[4],
    zIndex: 10,
    padding: spacing[2],
  },
  loginContent: {
    alignItems: 'center',
  },
  loginLogo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  loginLogoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: spacing[6],
  },
  loginLogoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  loginTitle: {
    ...typography.headlineMedium,
    fontWeight: '700',
    marginBottom: spacing[2],
  },
  loginSubtitle: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginBottom: spacing[6],
    paddingHorizontal: spacing[4],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  input: {
    flex: 1,
    ...typography.bodyLarge,
  },
  errorText: {
    color: '#EF4444',
    ...typography.bodySmall,
    marginBottom: spacing[4],
  },
  loginButton: {
    width: '100%',
    marginTop: spacing[2],
  },
  loginButtonSolid: {
    backgroundColor: '#1A4BFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[2],
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[2],
  },
  loginButtonText: {
    color: '#FFFFFF',
    ...typography.titleMedium,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  headerBackButton: {
    padding: spacing[2],
    marginRight: spacing[2],
  },
  headerTitleContainer: {
    flex: 1,
  },
  dashboardTitle: {
    ...typography.headlineMedium,
    fontWeight: '700',
  },
  dashboardSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing[2],
    marginBottom: spacing[6],
  },
  sectionCardWrapper: {
    width: '50%',
    padding: spacing[2],
  },
  sectionCard: {
    padding: spacing[4],
    borderRadius: borderRadius['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionLabel: {
    ...typography.titleSmall,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  sectionDescription: {
    ...typography.bodySmall,
  },
  countBadge: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  countText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    padding: spacing[4],
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...typography.titleSmall,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  infoDescription: {
    ...typography.bodySmall,
  },
  logoutButton: {
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    ...typography.titleSmall,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  sectionTitle: {
    ...typography.titleLarge,
    fontWeight: '700',
  },
  sectionCount: {
    ...typography.bodySmall,
  },
  refreshButton: {
    padding: spacing[2],
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    paddingVertical: spacing[1],
  },
  dataList: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[10],
  },
  loadingText: {
    ...typography.bodyMedium,
    marginTop: spacing[3],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[10],
  },
  emptyText: {
    ...typography.bodyMedium,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dataItemContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  dataItemTitle: {
    ...typography.titleSmall,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  dataItemSubtitle: {
    ...typography.bodySmall,
  },
  dataItemExtra: {
    ...typography.labelSmall,
    marginTop: spacing[1],
  },
  dataItemActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    padding: spacing[6],
    borderRadius: borderRadius['2xl'],
  },
  modalTitle: {
    ...typography.titleLarge,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  modalMessage: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    ...typography.titleSmall,
    fontWeight: '600',
  },
  formModalContainer: {
    flex: 1,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  formCloseButton: {
    padding: spacing[2],
  },
  formTitle: {
    ...typography.titleLarge,
    fontWeight: '700',
  },
  formSaveButton: {
    padding: spacing[2],
  },
  formContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  formField: {
    marginBottom: spacing[5],
  },
  formLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  formLabel: {
    ...typography.titleSmall,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  formHint: {
    ...typography.bodySmall,
    marginBottom: spacing[2],
    marginTop: -spacing[1],
  },
  toggleButton: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  toggleButtonText: {
    ...typography.labelSmall,
    fontWeight: '500',
  },
  formRow: {
    flexDirection: 'row',
  },
  formInput: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...typography.bodyMedium,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  datePickerText: {
    ...typography.bodyMedium,
  },
  datePickerDoneButton: {
    marginTop: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  datePickerDoneText: {
    color: '#FFFFFF',
    fontWeight: '600',
    ...typography.bodyMedium,
  },
  durationDisplay: {
    justifyContent: 'center',
  },
  durationText: {
    ...typography.bodyMedium,
  },
  formTextarea: {
    minHeight: 100,
    paddingTop: spacing[3],
  },
  selectWrapper: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing[2],
  },
  selectScroll: {
    flexGrow: 0,
  },
  selectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginRight: spacing[2],
    gap: spacing[1],
  },
  selectChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  selectChipText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  selectChipTextActive: {
    color: '#FFFFFF',
  },
  linkedText: {
    ...typography.labelSmall,
    color: '#10B981',
    marginTop: spacing[2],
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  selectOption: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  selectOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  selectOptionText: {
    ...typography.bodyMedium,
  },
  selectOptionTextActive: {
    color: '#FFFFFF',
  },
  imagePickerButton: {
    height: 120,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
  },
  imagePickerText: {
    ...typography.bodyMedium,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  replaceImageButton: {
    position: 'absolute',
    bottom: spacing[2],
    right: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
  },
  replaceImageText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  audioPickerButton: {
    padding: spacing[6],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[3],
  },
  audioPickerText: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
  audioPickerButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  audioPickerButtonText: {
    color: '#FFFFFF',
    ...typography.bodySmall,
    fontWeight: '600',
  },
  uploadProgressContainer: {
    alignItems: 'center',
    width: '100%',
    gap: spacing[3],
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  audioPreview: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing[4],
  },
  audioPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  audioPreviewText: {
    flex: 1,
  },
  audioUploadedText: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  audioUrlText: {
    ...typography.labelSmall,
  },
  audioActions: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  audioActionButton: {
    paddingVertical: spacing[1],
  },
  audioActionText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  // ChurchInfo styles
  formContainer: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  formSection: {
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  formSectionTitle: {
    ...typography.titleMedium,
    fontWeight: '700',
    marginBottom: spacing[4],
  },
  valuesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  valueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    gap: spacing[2],
  },
  valueChipText: {
    color: '#FFFFFF',
    ...typography.bodySmall,
    fontWeight: '500',
  },
  addValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  addValueButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveHeaderButton: {
    padding: spacing[2],
    borderRadius: borderRadius.lg,
  },
});
