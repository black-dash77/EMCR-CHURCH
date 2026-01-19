import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Moon,
  Sun,
  Smartphone,
  Bell,
  Play,
  Gauge,
  Trash2,
  Info,
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { useUserStore } from '@/stores/useUserStore';
import { useAudioStore } from '@/stores/useAudioStore';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const {
    darkMode,
    notificationsEnabled,
    autoPlayNext,
    defaultPlaybackSpeed,
    setDarkMode,
    setNotificationsEnabled,
    setAutoPlayNext,
    setDefaultPlaybackSpeed,
    clearHistory,
  } = useUserStore();

  const { playbackPositions } = useAudioStore();

  const handleClearData = () => {
    Alert.alert(
      'Effacer les données',
      'Cette action effacera votre historique et vos positions de lecture. Vos favoris seront conservés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            Alert.alert('Données effacées', 'Vos données ont été effacées.');
          },
        },
      ]
    );
  };

  const cyclePlaybackSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = speeds.indexOf(defaultPlaybackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setDefaultPlaybackSpeed(speeds[nextIndex]);
  };

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
        <Text style={[styles.title, { color: themeColors.text }]}>Paramètres</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            Apparence
          </Text>

          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <Pressable
              style={styles.settingRow}
              onPress={() => setDarkMode('system')}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primary[100] }]}>
                <Smartphone size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                  Système
                </Text>
                <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                  Suivre le thème du système
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: darkMode === 'system' ? colors.primary[500] : themeColors.border,
                    backgroundColor: darkMode === 'system' ? colors.primary[500] : 'transparent',
                  },
                ]}
              />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />

            <Pressable
              style={styles.settingRow}
              onPress={() => setDarkMode('light')}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.semantic.warningLight }]}>
                <Sun size={20} color={colors.semantic.warning} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                  Clair
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: darkMode === 'light' ? colors.primary[500] : themeColors.border,
                    backgroundColor: darkMode === 'light' ? colors.primary[500] : 'transparent',
                  },
                ]}
              />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />

            <Pressable
              style={styles.settingRow}
              onPress={() => setDarkMode('dark')}
            >
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(100, 100, 100, 0.2)' }]}>
                <Moon size={20} color={themeColors.text} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                  Sombre
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: darkMode === 'dark' ? colors.primary[500] : themeColors.border,
                    backgroundColor: darkMode === 'dark' ? colors.primary[500] : 'transparent',
                  },
                ]}
              />
            </Pressable>
          </View>
        </View>

        {/* Playback */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            Lecture
          </Text>

          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <View style={styles.settingRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary[100] }]}>
                <Play size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                  Lecture automatique
                </Text>
                <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                  Passer à la prédication suivante
                </Text>
              </View>
              <Switch
                value={autoPlayNext}
                onValueChange={setAutoPlayNext}
                trackColor={{
                  false: themeColors.border,
                  true: colors.primary[500],
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />

            <Pressable style={styles.settingRow} onPress={cyclePlaybackSpeed}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary[100] }]}>
                <Gauge size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                  Vitesse par défaut
                </Text>
                <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                  Vitesse de lecture par défaut
                </Text>
              </View>
              <Text style={[styles.speedValue, { color: colors.primary[500] }]}>
                {defaultPlaybackSpeed}x
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            Notifications
          </Text>

          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <View style={styles.settingRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary[100] }]}>
                <Bell size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                  Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                  Recevoir des notifications
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: themeColors.border,
                  true: colors.primary[500],
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            Données
          </Text>

          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <Pressable style={styles.settingRow} onPress={handleClearData}>
              <View style={[styles.iconCircle, { backgroundColor: colors.semantic.errorLight }]}>
                <Trash2 size={20} color={colors.semantic.error} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.semantic.error }]}>
                  Effacer les données
                </Text>
                <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                  Historique et positions de lecture
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            À propos
          </Text>

          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <View style={styles.settingRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary[100] }]}>
                <Info size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                  EMCR Church
                </Text>
                <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                  Version 1.0.0
                </Text>
              </View>
            </View>
          </View>
        </View>

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
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    ...typography.labelLarge,
    textTransform: 'uppercase',
    marginBottom: spacing[2],
    paddingLeft: spacing[2],
  },
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    ...typography.bodyMedium,
  },
  settingDescription: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: spacing[3] + 40 + spacing[3],
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  speedValue: {
    ...typography.labelLarge,
  },
});
