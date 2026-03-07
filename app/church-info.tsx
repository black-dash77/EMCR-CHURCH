import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Pressable,
  Linking,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { churchInfoApi } from '@/services/api';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { ChurchInfo } from '@/types';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 56;
const HERO_HEIGHT = height * 0.45;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ChurchInfoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [churchInfo, setChurchInfo] = useState<ChurchInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const scrollY = useSharedValue(0);

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

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HERO_HEIGHT - 150, HERO_HEIGHT - 50],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const heroAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.2, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, HERO_HEIGHT],
      [0, -HERO_HEIGHT * 0.5],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const openLink = (url: string | null) => {
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) Linking.openURL(url);
  };

  const openPhone = (phone: string | null) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const openEmail = (email: string | null) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  const openMaps = (address: string | null) => {
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
    }
  };

  // Loading State
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.fixedHeader}>
          <Pressable onPress={() => router.back()} style={[styles.backButton, { top: insets.top + spacing[2] }]}>
            <ChevronLeft size={28} color={themeColors.text} />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <Animated.View entering={FadeIn.duration(500)}>
            <Church size={64} color={colors.primary[500]} />
          </Animated.View>
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Chargement...
          </Text>
        </View>
      </View>
    );
  }

  // Empty State
  if (!churchInfo) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.fixedHeader}>
          <Pressable onPress={() => router.back()} style={[styles.backButton, { top: insets.top + spacing[2] }]}>
            <ChevronLeft size={28} color={themeColors.text} />
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Animated.View entering={FadeInDown.duration(500)}>
            <LinearGradient
              colors={colors.gradients.primarySoft}
              style={styles.emptyIcon}
            >
              <Church size={48} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
            Informations non disponibles
          </Text>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            Les informations sur notre église seront bientôt disponibles.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Animated ScrollView */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            progressViewOffset={HERO_HEIGHT}
          />
        }
      >
        {/* Hero Section */}
        <Animated.View style={[styles.heroContainer, heroAnimatedStyle]}>
          {churchInfo.cover_image ? (
            <Image source={{ uri: churchInfo.cover_image }} style={styles.heroImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          ) : (
            <Image
              source={require('../assets/icon.png')}
              style={styles.heroImageFallback}
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
            style={styles.heroGradient}
          />

          {/* Hero Content */}
          <View style={[styles.heroContent, { paddingBottom: spacing[6] }]}>
            {churchInfo.logo_url && (
              <Image source={{ uri: churchInfo.logo_url }} style={styles.logo} contentFit="cover" cachePolicy="memory-disk" transition={200} />
            )}
            <Animated.Text
              entering={FadeInDown.delay(200).duration(500)}
              style={styles.churchName}
            >
              {churchInfo.name}
            </Animated.Text>
            {churchInfo.slogan && (
              <Animated.Text
                entering={FadeInDown.delay(300).duration(500)}
                style={styles.slogan}
              >
                {churchInfo.slogan}
              </Animated.Text>
            )}
          </View>
        </Animated.View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: themeColors.background }]}>
          {/* Quick Info Cards */}
          {churchInfo.service_times && (
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <LinearGradient
                colors={colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickInfoCard}
              >
                <View style={styles.quickInfoIcon}>
                  <Clock size={24} color="#FFFFFF" />
                </View>
                <View style={styles.quickInfoContent}>
                  <Text style={styles.quickInfoLabel}>Horaires des Cultes</Text>
                  <Text style={styles.quickInfoValue}>{churchInfo.service_times}</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* About Section */}
          {churchInfo.description && (
            <Animated.View
              entering={FadeInDown.delay(150).duration(500)}
              style={[styles.section, { backgroundColor: themeColors.card }]}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.primary[500] + '15' }]}>
                  <BookOpen size={22} color={colors.primary[500]} />
                </View>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  À propos de nous
                </Text>
              </View>
              <Text style={[styles.sectionText, { color: themeColors.textSecondary }]}>
                {churchInfo.description}
              </Text>
            </Animated.View>
          )}

          {/* Mission & Vision */}
          <View style={styles.gridContainer}>
            {churchInfo.mission && (
              <Animated.View
                entering={FadeInDown.delay(200).duration(500)}
                style={[styles.gridCard, { backgroundColor: themeColors.card }]}
              >
                <View style={[styles.gridIcon, { backgroundColor: '#10B981' + '15' }]}>
                  <Target size={24} color="#10B981" />
                </View>
                <Text style={[styles.gridTitle, { color: themeColors.text }]}>
                  Notre Mission
                </Text>
                <Text style={[styles.gridText, { color: themeColors.textSecondary }]} numberOfLines={4}>
                  {churchInfo.mission}
                </Text>
              </Animated.View>
            )}

            {churchInfo.vision && (
              <Animated.View
                entering={FadeInDown.delay(250).duration(500)}
                style={[styles.gridCard, { backgroundColor: themeColors.card }]}
              >
                <View style={[styles.gridIcon, { backgroundColor: '#8B5CF6' + '15' }]}>
                  <Eye size={24} color="#8B5CF6" />
                </View>
                <Text style={[styles.gridTitle, { color: themeColors.text }]}>
                  Notre Vision
                </Text>
                <Text style={[styles.gridText, { color: themeColors.textSecondary }]} numberOfLines={4}>
                  {churchInfo.vision}
                </Text>
              </Animated.View>
            )}
          </View>

          {/* Values */}
          {churchInfo.values && churchInfo.values.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(300).duration(500)}
              style={[styles.section, { backgroundColor: themeColors.card }]}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#EF4444' + '15' }]}>
                  <Heart size={22} color="#EF4444" />
                </View>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  Nos Valeurs
                </Text>
              </View>
              <View style={styles.valuesGrid}>
                {churchInfo.values.map((value, index) => (
                  <View
                    key={index}
                    style={[styles.valueChip, { backgroundColor: themeColors.background }]}
                  >
                    <View style={[styles.valueDot, { backgroundColor: colors.primary[500] }]} />
                    <Text style={[styles.valueText, { color: themeColors.text }]}>
                      {value}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Pastor Section */}
          {(churchInfo.pastor_name || churchInfo.pastor_message) && (
            <Animated.View
              entering={FadeInDown.delay(350).duration(500)}
              style={styles.pastorCard}
            >
              <LinearGradient
                colors={isDark
                  ? ['rgba(26, 75, 255, 0.15)', 'rgba(26, 75, 255, 0.05)']
                  : ['rgba(26, 75, 255, 0.1)', 'rgba(26, 75, 255, 0.02)']}
                style={styles.pastorGradient}
              >
                <View style={styles.pastorHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.primary[500] + '20' }]}>
                    <User size={22} color={colors.primary[500]} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                    Mot du Pasteur
                  </Text>
                </View>

                <View style={styles.pastorContent}>
                  {churchInfo.pastor_photo ? (
                    <Image source={{ uri: churchInfo.pastor_photo }} style={styles.pastorPhoto} contentFit="cover" cachePolicy="memory-disk" transition={200} />
                  ) : (
                    <LinearGradient
                      colors={colors.gradients.primarySoft}
                      style={styles.pastorPhoto}
                    >
                      <User size={40} color="#FFFFFF" />
                    </LinearGradient>
                  )}

                  <View style={styles.pastorInfo}>
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
              </LinearGradient>
            </Animated.View>
          )}

          {/* History */}
          {churchInfo.history && (
            <Animated.View
              entering={FadeInDown.delay(400).duration(500)}
              style={[styles.section, { backgroundColor: themeColors.card }]}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#F59E0B' + '15' }]}>
                  <BookOpen size={22} color="#F59E0B" />
                </View>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  Notre Histoire
                </Text>
              </View>
              <Text style={[styles.sectionText, { color: themeColors.textSecondary }]}>
                {churchInfo.history}
              </Text>
            </Animated.View>
          )}

          {/* Contact Section */}
          <Animated.View entering={FadeInDown.delay(450).duration(500)}>
            <Text style={[styles.contactTitle, { color: themeColors.text }]}>
              Nous Contacter
            </Text>

            {churchInfo.address && (
              <Pressable
                style={({ pressed }) => [
                  styles.contactCard,
                  { backgroundColor: themeColors.card, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => openMaps(churchInfo.address)}
              >
                <View style={[styles.contactIcon, { backgroundColor: '#EF4444' + '15' }]}>
                  <MapPin size={22} color="#EF4444" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactLabel, { color: themeColors.textTertiary }]}>
                    Adresse
                  </Text>
                  <Text style={[styles.contactValue, { color: themeColors.text }]}>
                    {churchInfo.address}
                  </Text>
                </View>
                <ChevronRight size={20} color={themeColors.textTertiary} />
              </Pressable>
            )}

            {churchInfo.phone && (
              <Pressable
                style={({ pressed }) => [
                  styles.contactCard,
                  { backgroundColor: themeColors.card, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => openPhone(churchInfo.phone)}
              >
                <View style={[styles.contactIcon, { backgroundColor: '#10B981' + '15' }]}>
                  <Phone size={22} color="#10B981" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactLabel, { color: themeColors.textTertiary }]}>
                    Téléphone
                  </Text>
                  <Text style={[styles.contactValue, { color: themeColors.text }]}>
                    {churchInfo.phone}
                  </Text>
                </View>
                <ChevronRight size={20} color={themeColors.textTertiary} />
              </Pressable>
            )}

            {churchInfo.email && (
              <Pressable
                style={({ pressed }) => [
                  styles.contactCard,
                  { backgroundColor: themeColors.card, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => openEmail(churchInfo.email)}
              >
                <View style={[styles.contactIcon, { backgroundColor: '#3B82F6' + '15' }]}>
                  <Mail size={22} color="#3B82F6" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactLabel, { color: themeColors.textTertiary }]}>
                    Email
                  </Text>
                  <Text style={[styles.contactValue, { color: themeColors.text }]}>
                    {churchInfo.email}
                  </Text>
                </View>
                <ChevronRight size={20} color={themeColors.textTertiary} />
              </Pressable>
            )}

            {churchInfo.website && (
              <Pressable
                style={({ pressed }) => [
                  styles.contactCard,
                  { backgroundColor: themeColors.card, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => openLink(churchInfo.website)}
              >
                <View style={[styles.contactIcon, { backgroundColor: '#8B5CF6' + '15' }]}>
                  <Globe size={22} color="#8B5CF6" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactLabel, { color: themeColors.textTertiary }]}>
                    Site web
                  </Text>
                  <Text style={[styles.contactValue, { color: themeColors.text }]}>
                    {churchInfo.website}
                  </Text>
                </View>
                <ChevronRight size={20} color={themeColors.textTertiary} />
              </Pressable>
            )}
          </Animated.View>

          {/* Social Media */}
          {(churchInfo.facebook || churchInfo.instagram || churchInfo.youtube) && (
            <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.socialSection}>
              <Text style={[styles.contactTitle, { color: themeColors.text }]}>
                Réseaux Sociaux
              </Text>
              <View style={styles.socialLinks}>
                {churchInfo.facebook && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.socialButton,
                      { backgroundColor: '#1877F2', opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => openLink(churchInfo.facebook)}
                  >
                    <Facebook size={26} color="#FFFFFF" />
                  </Pressable>
                )}
                {churchInfo.instagram && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.socialButton,
                      { backgroundColor: '#E4405F', opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => openLink(churchInfo.instagram)}
                  >
                    <Instagram size={26} color="#FFFFFF" />
                  </Pressable>
                )}
                {churchInfo.youtube && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.socialButton,
                      { backgroundColor: '#FF0000', opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => openLink(churchInfo.youtube)}
                  >
                    <Youtube size={26} color="#FFFFFF" />
                  </Pressable>
                )}
              </View>
            </Animated.View>
          )}

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.3)', top: insets.top + spacing[2] }]}
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </Pressable>

        {/* Animated Header Background */}
        <Animated.View style={[styles.headerBackground, { height: HEADER_HEIGHT + insets.top }, headerAnimatedStyle]}>
          <BlurView intensity={isDark ? 40 : 80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.headerContent, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)', paddingTop: insets.top }]}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
              Notre Église
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Fixed Header
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  backButton: {
    position: 'absolute',
    left: spacing[4],
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing[3],
  },
  headerTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[4],
  },
  loadingText: {
    ...typography.bodyMedium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[4],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.titleLarge,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },

  // Hero Section
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageFallback: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[5],
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: spacing[3],
  },
  churchName: {
    ...typography.headlineLarge,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  slogan: {
    ...typography.bodyLarge,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: spacing[2],
    fontStyle: 'italic',
  },

  // Content
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    marginTop: -spacing[6],
  },

  // Quick Info Card
  quickInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing[5],
  },
  quickInfoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  quickInfoContent: {
    flex: 1,
  },
  quickInfoLabel: {
    ...typography.labelMedium,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickInfoValue: {
    ...typography.titleMedium,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 2,
  },

  // Sections
  section: {
    padding: spacing[5],
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  sectionTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  sectionText: {
    ...typography.bodyMedium,
    lineHeight: 24,
  },

  // Grid Cards
  gridContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  gridCard: {
    flex: 1,
    padding: spacing[4],
    borderRadius: borderRadius['2xl'],
  },
  gridIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  gridTitle: {
    ...typography.titleSmall,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  gridText: {
    ...typography.bodySmall,
    lineHeight: 20,
  },

  // Values
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  valueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.full,
  },
  valueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  valueText: {
    ...typography.labelMedium,
    fontWeight: '500',
  },

  // Pastor Card
  pastorCard: {
    marginBottom: spacing[4],
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
  },
  pastorGradient: {
    padding: spacing[5],
  },
  pastorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  pastorContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pastorPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: spacing[4],
    justifyContent: 'center',
    alignItems: 'center',
  },
  pastorInfo: {
    flex: 1,
  },
  pastorName: {
    ...typography.titleMedium,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  pastorMessage: {
    ...typography.bodyMedium,
    fontStyle: 'italic',
    lineHeight: 22,
  },

  // Contact
  contactTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
    marginBottom: spacing[3],
    paddingLeft: spacing[1],
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[2],
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    ...typography.labelSmall,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactValue: {
    ...typography.bodyMedium,
    marginTop: 2,
  },

  // Social
  socialSection: {
    marginTop: spacing[4],
  },
  socialLinks: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
