import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
  Image,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Church,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Heart,
  Target,
  Eye,
  BookOpen,
  Facebook,
  Instagram,
  Youtube,
  User,
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { churchInfoApi } from '@/services/api';
import type { ChurchInfo } from '@/types';

export default function ChurchInfoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const [churchInfo, setChurchInfo] = useState<ChurchInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchChurchInfo = useCallback(async () => {
    try {
      const data = await churchInfoApi.get();
      setChurchInfo(data);
    } catch (error) {
      console.error('Error fetching church info:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChurchInfo();
  }, [fetchChurchInfo]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChurchInfo();
    setRefreshing(false);
  }, [fetchChurchInfo]);

  const openLink = (url: string | null) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const openPhone = (phone: string | null) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const openEmail = (email: string | null) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const openMaps = (address: string | null) => {
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
    }
  };

  const renderSection = (
    icon: React.ReactNode,
    title: string,
    content: string | null | undefined
  ) => {
    if (!content) return null;
    return (
      <View style={[styles.section, { backgroundColor: themeColors.card }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary[500] + '20' }]}>
            {icon}
          </View>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{title}</Text>
        </View>
        <Text style={[styles.sectionContent, { color: themeColors.textSecondary }]}>
          {content}
        </Text>
      </View>
    );
  };

  const renderContactItem = (
    icon: React.ReactNode,
    label: string,
    value: string | null | undefined,
    onPress: () => void
  ) => {
    if (!value) return null;
    return (
      <Pressable
        style={[styles.contactItem, { backgroundColor: themeColors.card }]}
        onPress={onPress}
      >
        <View style={[styles.contactIcon, { backgroundColor: colors.primary[500] + '20' }]}>
          {icon}
        </View>
        <View style={styles.contactInfo}>
          <Text style={[styles.contactLabel, { color: themeColors.textTertiary }]}>{label}</Text>
          <Text style={[styles.contactValue, { color: themeColors.text }]}>{value}</Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={28} color={themeColors.text} />
          </Pressable>
          <Text style={[styles.title, { color: themeColors.text }]}>Notre Église</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!churchInfo) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={28} color={themeColors.text} />
          </Pressable>
          <Text style={[styles.title, { color: themeColors.text }]}>Notre Église</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyState}>
          <Church size={64} color={themeColors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
            Informations non disponibles
          </Text>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            Les informations sur notre église seront bientôt disponibles.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={[styles.title, { color: themeColors.text }]}>Notre Église</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Cover Image */}
        {churchInfo.cover_image && (
          <Image source={{ uri: churchInfo.cover_image }} style={styles.coverImage} />
        )}

        {/* Church Name & Slogan */}
        <View style={styles.headerSection}>
          {churchInfo.logo_url && (
            <Image source={{ uri: churchInfo.logo_url }} style={styles.logo} />
          )}
          <Text style={[styles.churchName, { color: themeColors.text }]}>
            {churchInfo.name}
          </Text>
          {churchInfo.slogan && (
            <Text style={[styles.slogan, { color: themeColors.textSecondary }]}>
              {churchInfo.slogan}
            </Text>
          )}
        </View>

        {/* Description */}
        {renderSection(
          <BookOpen size={20} color={colors.primary[500]} />,
          'À propos de nous',
          churchInfo.description
        )}

        {/* Mission */}
        {renderSection(
          <Target size={20} color={colors.primary[500]} />,
          'Notre Mission',
          churchInfo.mission
        )}

        {/* Vision */}
        {renderSection(
          <Eye size={20} color={colors.primary[500]} />,
          'Notre Vision',
          churchInfo.vision
        )}

        {/* Values */}
        {churchInfo.values && churchInfo.values.length > 0 && (
          <View style={[styles.section, { backgroundColor: themeColors.card }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary[500] + '20' }]}>
                <Heart size={20} color={colors.primary[500]} />
              </View>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Nos Valeurs</Text>
            </View>
            <View style={styles.valuesList}>
              {churchInfo.values.map((value, index) => (
                <View key={index} style={styles.valueItem}>
                  <View style={[styles.valueDot, { backgroundColor: colors.primary[500] }]} />
                  <Text style={[styles.valueText, { color: themeColors.textSecondary }]}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* History */}
        {renderSection(
          <BookOpen size={20} color={colors.primary[500]} />,
          'Notre Histoire',
          churchInfo.history
        )}

        {/* Pastor Section */}
        {(churchInfo.pastor_name || churchInfo.pastor_message) && (
          <View style={[styles.section, { backgroundColor: themeColors.card }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary[500] + '20' }]}>
                <User size={20} color={colors.primary[500]} />
              </View>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Mot du Pasteur
              </Text>
            </View>
            <View style={styles.pastorSection}>
              {churchInfo.pastor_photo && (
                <Image source={{ uri: churchInfo.pastor_photo }} style={styles.pastorPhoto} />
              )}
              {churchInfo.pastor_name && (
                <Text style={[styles.pastorName, { color: themeColors.text }]}>
                  {churchInfo.pastor_name}
                </Text>
              )}
              {churchInfo.pastor_message && (
                <Text style={[styles.pastorMessage, { color: themeColors.textSecondary }]}>
                  "{churchInfo.pastor_message}"
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Service Times */}
        {churchInfo.service_times && (
          <View style={[styles.section, { backgroundColor: themeColors.card }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary[500] + '20' }]}>
                <Clock size={20} color={colors.primary[500]} />
              </View>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Horaires des Cultes
              </Text>
            </View>
            <Text style={[styles.sectionContent, { color: themeColors.textSecondary }]}>
              {churchInfo.service_times}
            </Text>
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={[styles.contactSectionTitle, { color: themeColors.text }]}>
            Nous Contacter
          </Text>

          {renderContactItem(
            <MapPin size={20} color={colors.primary[500]} />,
            'Adresse',
            churchInfo.address,
            () => openMaps(churchInfo.address)
          )}

          {renderContactItem(
            <Phone size={20} color={colors.primary[500]} />,
            'Téléphone',
            churchInfo.phone,
            () => openPhone(churchInfo.phone)
          )}

          {renderContactItem(
            <Mail size={20} color={colors.primary[500]} />,
            'Email',
            churchInfo.email,
            () => openEmail(churchInfo.email)
          )}

          {renderContactItem(
            <Globe size={20} color={colors.primary[500]} />,
            'Site web',
            churchInfo.website,
            () => openLink(churchInfo.website)
          )}
        </View>

        {/* Social Media */}
        {(churchInfo.facebook || churchInfo.instagram || churchInfo.youtube) && (
          <View style={styles.socialSection}>
            <Text style={[styles.contactSectionTitle, { color: themeColors.text }]}>
              Réseaux Sociaux
            </Text>
            <View style={styles.socialLinks}>
              {churchInfo.facebook && (
                <Pressable
                  style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
                  onPress={() => openLink(churchInfo.facebook)}
                >
                  <Facebook size={24} color="#FFFFFF" />
                </Pressable>
              )}
              {churchInfo.instagram && (
                <Pressable
                  style={[styles.socialButton, { backgroundColor: '#E4405F' }]}
                  onPress={() => openLink(churchInfo.instagram)}
                >
                  <Instagram size={24} color="#FFFFFF" />
                </Pressable>
              )}
              {churchInfo.youtube && (
                <Pressable
                  style={[styles.socialButton, { backgroundColor: '#FF0000' }]}
                  onPress={() => openLink(churchInfo.youtube)}
                >
                  <Youtube size={24} color="#FFFFFF" />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: spacing[4],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  emptyTitle: {
    ...typography.titleMedium,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
  coverImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.xl,
    marginBottom: spacing[4],
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing[3],
  },
  churchName: {
    ...typography.headlineMedium,
    textAlign: 'center',
  },
  slogan: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginTop: spacing[2],
    fontStyle: 'italic',
  },
  section: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  sectionTitle: {
    ...typography.titleMedium,
  },
  sectionContent: {
    ...typography.bodyMedium,
    lineHeight: 24,
  },
  valuesList: {
    gap: spacing[2],
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[3],
  },
  valueText: {
    ...typography.bodyMedium,
    flex: 1,
  },
  pastorSection: {
    alignItems: 'center',
  },
  pastorPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing[3],
  },
  pastorName: {
    ...typography.titleSmall,
    marginBottom: spacing[2],
  },
  pastorMessage: {
    ...typography.bodyMedium,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  contactSection: {
    marginBottom: spacing[4],
  },
  contactSectionTitle: {
    ...typography.titleMedium,
    marginBottom: spacing[3],
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    ...typography.labelSmall,
    textTransform: 'uppercase',
  },
  contactValue: {
    ...typography.bodyMedium,
    marginTop: 2,
  },
  socialSection: {
    marginBottom: spacing[4],
  },
  socialLinks: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
