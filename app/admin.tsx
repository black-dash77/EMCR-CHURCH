import { decode } from 'base64-arraybuffer';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
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
  ChevronDown,
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
  Switch,
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
  speaker?: string;
  speaker_id?: string;
  seminar_id?: string;
  audio_url?: string;
  cover_image?: string;
  duration?: string;
  [key: string]: any;
}

// Storage bucket mapping
const STORAGE_BUCKETS: Record<string, string> = {
  'sermons.cover_image': 'sermon-covers',
  'sermons.audio_url': 'sermons-audio',
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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

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
  const [useExistingSpeaker, setUseExistingSpeaker] = useState(false);

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

    try {
      const { data: adminData, error } = await supabase
        .from('admin_settings')
        .select('password_hash')
        .eq('id', 'default')
        .single();

      if (error) {
        setAuthError('Erreur de connexion');
        return;
      }

      if (adminData?.password_hash === password) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setAuthError('Mot de passe incorrect');
      }
    } catch (error) {
      setAuthError('Erreur de connexion');
    } finally {
      setAuthLoading(false);
    }
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
      const speaker = item.speaker || '';
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
        aspect: fieldKey === 'photo_url' || fieldKey === 'photo' ? [1, 1] : [16, 9],
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

        console.log('Audio uploaded successfully!');
        console.log('Public URL:', publicUrl);

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

      // Debug: Log formData before saving
      console.log('FormData before save:', JSON.stringify(formData, null, 2));
      console.log('Audio URL in formData:', formData.audio_url);

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

      // Debug: Log data to be saved
      console.log('Data to save:', JSON.stringify(dataToSave, null, 2));

      let result;
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
        console.log('Updated result:', JSON.stringify(result, null, 2));

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

        setData(prev => [result, ...prev]);
        setCounts(prev => ({ ...prev, [activeSection]: (prev[activeSection] || 0) + 1 }));
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
    { id: 'events', icon: <Calendar size={20} color="#FFFFFF" />, iconBg: '#10B981', label: 'Evenements', description: 'Gerer les evenements', count: counts.events },
    { id: 'announcements', icon: <Megaphone size={20} color="#FFFFFF" />, iconBg: '#F59E0B', label: 'Annonces', description: 'Gerer les annonces', count: counts.announcements },
    { id: 'members', icon: <Users size={20} color="#FFFFFF" />, iconBg: '#6366F1', label: 'Membres', description: 'Gerer les membres', count: counts.members },
    { id: 'photos', icon: <ImageIcon size={20} color="#FFFFFF" />, iconBg: '#14B8A6', label: 'Medias', description: 'Gerer les photos/videos', count: counts.photos },
    { id: 'contact_messages', icon: <MessageSquare size={20} color="#FFFFFF" />, iconBg: '#EF4444', label: 'Messages', description: 'Messages de contact', count: counts.contact_messages },
  ];

  const getItemTitle = (item: DataItem): string => {
    return item.title || item.name || item.subject || item.caption || 'Sans titre';
  };

  const getItemSubtitle = (item: DataItem): string => {
    if (activeSection === 'sermons' && item.speaker) return item.speaker;
    if (item.date) return new Date(item.date).toLocaleDateString('fr-FR');
    if (item.created_at) return new Date(item.created_at).toLocaleDateString('fr-FR');
    if (item.email) return item.email;
    if (item.role) return item.role;
    if (item.ministry) return item.ministry;
    return '';
  };

  const getItemExtra = (item: DataItem): string => {
    if (activeSection === 'sermons') {
      if (item.date) return new Date(item.date).toLocaleDateString('fr-FR');
    }
    if (activeSection === 'seminars' && item.speaker?.name) {
      return item.speaker.name;
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
      {/* Title */}
      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: themeColors.text }]}>
          Titre <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Titre de la predication"
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
        <TextInput
          style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={themeColors.textTertiary}
          value={formData.date || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
        />
      </View>

      {/* Duration & Series */}
      <View style={styles.formRow}>
        <View style={[styles.formField, { flex: 1, marginRight: spacing[2] }]}>
          <Text style={[styles.formLabel, { color: themeColors.text }]}>Duree</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
            placeholder="Ex: 45:30"
            placeholderTextColor={themeColors.textTertiary}
            value={formData.duration || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
          />
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
              <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                style={styles.loginLogo}
              >
                <Shield size={40} color="#FFFFFF" />
              </LinearGradient>

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
                  { opacity: pressed ? 0.9 : 1 },
                ]}
                onPress={handleLogin}
                disabled={authLoading}
              >
                <LinearGradient
                  colors={['#3B82F6', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButtonGradient}
                >
                  {authLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Se connecter</Text>
                      <ChevronRight size={20} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
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
                Voulez-vous vraiment supprimer "{getItemTitle(itemToDelete || {})}" ?
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
                disabled={saving || uploadingImage || uploadingAudio}
                style={[styles.formSaveButton, (saving || uploadingImage || uploadingAudio) && { opacity: 0.5 }]}
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
            onPress={() => {
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
    height: 180,
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
});
