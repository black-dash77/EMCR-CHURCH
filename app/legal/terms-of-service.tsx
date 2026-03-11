import { useRouter } from 'expo-router';
import { ChevronLeft, FileText } from 'lucide-react-native';
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
    title: '1. Acceptation des conditions',
    content:
      `En telechargeant, installant ou utilisant l'application ${APP_NAME}, vous acceptez d'etre lie par les presentes conditions d'utilisation. ` +
      `Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.`,
  },
  {
    title: '2. Description du service',
    content:
      `${APP_NAME} est une application gratuite qui permet :\n\n` +
      `- D'ecouter des predications et contenus audio de l'Eglise Missionnaire du Christ Roi.\n` +
      `- De consulter les evenements et annonces de l'eglise.\n` +
      `- De telecharger des contenus audio pour une ecoute hors ligne.\n` +
      `- De recevoir des notifications sur les nouvelles publications.\n\n` +
      `L'application est fournie gratuitement et sans publicite.`,
  },
  {
    title: '3. Propriete intellectuelle',
    content:
      `Tous les contenus disponibles dans l'application (predications, audio, images, textes) sont la propriete de l'Eglise Missionnaire du Christ Roi ou de leurs auteurs respectifs.\n\n` +
      `Vous etes autorise a :\n` +
      `- Ecouter les contenus pour un usage personnel.\n` +
      `- Telecharger les contenus pour une ecoute hors ligne.\n` +
      `- Partager les liens vers les contenus.\n\n` +
      `Vous n'etes pas autorise a :\n` +
      `- Redistribuer, vendre ou commercialiser les contenus.\n` +
      `- Modifier les contenus sans autorisation.\n` +
      `- Utiliser les contenus a des fins diffamatoires ou contraires aux valeurs de l'eglise.`,
  },
  {
    title: '4. Compte utilisateur',
    content:
      `L'application ne requiert pas de creation de compte. ` +
      `Vos preferences et votre historique d'ecoute sont stockes localement sur votre appareil. ` +
      `La desinstallation de l'application supprime ces donnees.`,
  },
  {
    title: '5. Comportement attendu',
    content:
      `En utilisant l'application, vous vous engagez a :\n\n` +
      `- Utiliser l'application de maniere respectueuse.\n` +
      `- Ne pas tenter de compromettre la securite de l'application.\n` +
      `- Ne pas utiliser l'application a des fins illegales.\n` +
      `- Respecter les droits de propriete intellectuelle.`,
  },
  {
    title: '6. Disponibilite du service',
    content:
      `Nous nous efforcons de maintenir l'application disponible en permanence, mais nous ne garantissons pas :\n\n` +
      `- Un fonctionnement ininterrompu ou sans erreur.\n` +
      `- La disponibilite permanente de tous les contenus.\n` +
      `- La compatibilite avec tous les appareils.\n\n` +
      `Nous nous reservons le droit de modifier, suspendre ou interrompre le service a tout moment.`,
  },
  {
    title: '7. Limitation de responsabilite',
    content:
      `L'application est fournie "en l'etat". Dans les limites autorisees par la loi, l'Eglise Missionnaire du Christ Roi ` +
      `ne peut etre tenue responsable de tout dommage direct ou indirect lie a l'utilisation de l'application.`,
  },
  {
    title: '8. Modifications',
    content:
      `Nous pouvons modifier ces conditions a tout moment. Les modifications prennent effet des leur publication dans l'application. ` +
      `L'utilisation continue de l'application apres modification vaut acceptation des nouvelles conditions.`,
  },
  {
    title: '9. Contact',
    content:
      `Pour toute question concernant ces conditions d'utilisation, contactez-nous a ${CONTACT_EMAIL}.`,
  },
];

export default function TermsOfServiceScreen() {
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
          <View style={[styles.iconCircle, { backgroundColor: '#8B5CF6' + '15' }]}>
            <FileText size={32} color="#8B5CF6" />
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
            Veuillez lire attentivement les presentes conditions d'utilisation
            avant d'utiliser l'application {APP_NAME}.
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

        {/* Footer */}
        <Animated.View entering={FadeInDown.delay(650).duration(400)} style={styles.contactSection}>
          <Text style={[styles.contactText, { color: themeColors.textTertiary }]}>
            En utilisant {APP_NAME}, vous acceptez ces conditions.
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
            Conditions d'Utilisation
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
