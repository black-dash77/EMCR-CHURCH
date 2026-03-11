import { useRouter } from 'expo-router';
import { ChevronLeft, Shield } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TransparentHeaderBackground, HEADER_HEIGHT } from '@/components/TransparentHeaderBackground';
import { colors, typography, spacing, borderRadius } from '@/theme';

const LAST_UPDATED = '11 mars 2025';
const APP_NAME = 'EMCR Church';
const CONTACT_EMAIL = 'contact@emcr.church';

interface SectionData {
  title: string;
  content: string;
}

const SECTIONS: SectionData[] = [
  {
    title: '1. Informations collectees',
    content:
      `${APP_NAME} collecte uniquement les informations necessaires au bon fonctionnement de l'application :\n\n` +
      `- Prenom (optionnel) : pour personnaliser votre experience.\n` +
      `- Jeton de notification push : pour vous envoyer des notifications si vous les activez.\n` +
      `- Historique d'ecoute : stocke localement sur votre appareil pour reprendre la lecture.\n` +
      `- Preferences : theme, notifications, vitesse de lecture, stockes localement.\n\n` +
      `Nous ne collectons aucune donnee de localisation, aucun contact, aucune photo, et aucune information financiere.`,
  },
  {
    title: '2. Utilisation des donnees',
    content:
      `Les donnees collectees sont utilisees exclusivement pour :\n\n` +
      `- Permettre l'ecoute de predications et contenus audio.\n` +
      `- Envoyer des notifications sur les nouvelles predications et evenements (si active).\n` +
      `- Personnaliser l'affichage de l'application.\n` +
      `- Sauvegarder votre progression d'ecoute.\n\n` +
      `Nous ne vendons, ne louons et ne partageons aucune donnee personnelle avec des tiers.`,
  },
  {
    title: '3. Stockage des donnees',
    content:
      `- Les donnees locales (historique, preferences, telechargements) sont stockees sur votre appareil via AsyncStorage et le systeme de fichiers.\n` +
      `- Les jetons de notification sont stockes de maniere securisee sur notre base de donnees Supabase.\n` +
      `- Les predications et contenus sont heberges sur des serveurs securises.\n\n` +
      `Toutes les communications entre l'application et nos serveurs sont chiffrees via HTTPS.`,
  },
  {
    title: '4. Services tiers',
    content:
      `L'application utilise les services tiers suivants :\n\n` +
      `- Supabase : hebergement de la base de donnees et authentification.\n` +
      `- Expo : infrastructure de notification push.\n` +
      `- Apple Music, Spotify, YouTube Music : liens de redirection uniquement (aucune donnee partagee).\n\n` +
      `Ces services ont leurs propres politiques de confidentialite que nous vous encourageons a consulter.`,
  },
  {
    title: '5. Vos droits',
    content:
      `Vous avez le droit de :\n\n` +
      `- Acceder a vos donnees personnelles.\n` +
      `- Demander la suppression de vos donnees.\n` +
      `- Desactiver les notifications a tout moment.\n` +
      `- Supprimer l'application, ce qui efface toutes les donnees locales.\n\n` +
      `Pour toute demande, contactez-nous a ${CONTACT_EMAIL}.`,
  },
  {
    title: '6. Donnees des enfants',
    content:
      `${APP_NAME} ne collecte pas sciemment de donnees personnelles aupres d'enfants de moins de 13 ans. ` +
      `L'application est destinee a un public general dans un contexte religieux et communautaire.`,
  },
  {
    title: '7. Modifications',
    content:
      `Nous nous reservons le droit de modifier cette politique de confidentialite. ` +
      `Les modifications seront publiees dans l'application et sur notre site web. ` +
      `La date de derniere mise a jour sera toujours indiquee en haut de cette page.`,
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const headerTotalHeight = HEADER_HEIGHT + insets.top;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerTotalHeight + spacing[6] },
        ]}
      >
        {/* Icon */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary[500] + '15' }]}>
            <Shield size={32} color={colors.primary[500]} />
          </View>
        </Animated.View>

        {/* Last Updated */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={[styles.lastUpdated, { color: themeColors.textTertiary }]}>
            Derniere mise a jour : {LAST_UPDATED}
          </Text>
        </Animated.View>

        {/* Intro */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text style={[styles.intro, { color: themeColors.textSecondary }]}>
            {APP_NAME} respecte votre vie privee. Cette politique explique quelles
            donnees nous collectons, comment nous les utilisons et quels sont vos droits.
          </Text>
        </Animated.View>

        {/* Sections */}
        {SECTIONS.map((section, index) => (
          <Animated.View
            key={section.title}
            entering={FadeInDown.delay(200 + index * 50).duration(400)}
            style={[styles.section, { backgroundColor: themeColors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionContent, { color: themeColors.textSecondary }]}>
              {section.content}
            </Text>
          </Animated.View>
        ))}

        {/* Contact */}
        <Animated.View entering={FadeInDown.delay(550).duration(400)} style={styles.contactSection}>
          <Text style={[styles.contactText, { color: themeColors.textTertiary }]}>
            Pour toute question concernant cette politique, contactez-nous a{' '}
            <Text style={{ color: colors.primary[500] }}>{CONTACT_EMAIL}</Text>
          </Text>
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <TransparentHeaderBackground height={headerTotalHeight + 40} />
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <ChevronLeft size={28} color={themeColors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Politique de Confidentialite
          </Text>
          <View style={{ width: 28 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  backButton: {
    width: 28,
  },
  headerTitle: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastUpdated: {
    ...typography.labelSmall,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  intro: {
    ...typography.bodyMedium,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing[6],
    paddingHorizontal: spacing[2],
  },
  section: {
    padding: spacing[4],
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...typography.titleSmall,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  sectionContent: {
    ...typography.bodySmall,
    lineHeight: 22,
  },
  contactSection: {
    paddingVertical: spacing[6],
    alignItems: 'center',
  },
  contactText: {
    ...typography.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
  },
});
