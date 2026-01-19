import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  Image as ImageIcon,
  Mail,
  Heart,
  Clock,
  Settings,
  Moon,
  ChevronRight,
  Music,
  Info,
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  description?: string;
  route?: string;
  action?: () => void;
  rightElement?: React.ReactNode;
}

export default function MoreScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Contenu',
      items: [
        {
          icon: <Users size={22} color={colors.primary[500]} />,
          label: 'Membres',
          description: 'Équipe dirigeante et ministères',
          route: '/members',
        },
        {
          icon: <ImageIcon size={22} color={colors.primary[500]} />,
          label: 'Médias',
          description: 'Photos et vidéos',
          route: '/media',
        },
        {
          icon: <Mail size={22} color={colors.primary[500]} />,
          label: 'Contact',
          description: 'Nous contacter',
          route: '/contact',
        },
      ],
    },
    {
      title: 'Ma Bibliothèque',
      items: [
        {
          icon: <Heart size={22} color={colors.semantic.error} />,
          label: 'Favoris',
          description: 'Mes prédications favorites',
          route: '/favorites',
        },
        {
          icon: <Clock size={22} color={colors.primary[500]} />,
          label: 'Historique',
          description: 'Prédications écoutées',
          route: '/history',
        },
        {
          icon: <Music size={22} color={colors.primary[500]} />,
          label: 'File d\'attente',
          description: 'Prochaines prédications',
          route: '/queue',
        },
      ],
    },
    {
      title: 'Préférences',
      items: [
        {
          icon: <Moon size={22} color={colors.primary[500]} />,
          label: 'Mode sombre',
          description: isDark ? 'Activé' : 'Désactivé',
          rightElement: (
            <Switch
              value={isDark}
              trackColor={{
                false: themeColors.border,
                true: colors.primary[500],
              }}
              thumbColor="#FFFFFF"
              disabled
            />
          ),
        },
        {
          icon: <Settings size={22} color={colors.primary[500]} />,
          label: 'Paramètres',
          description: 'Notifications, lecture audio',
          route: '/settings',
        },
      ],
    },
    {
      title: 'À propos',
      items: [
        {
          icon: <Info size={22} color={colors.primary[500]} />,
          label: 'À propos de l\'application',
          description: 'Version 1.0.0',
        },
      ],
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <Pressable
      key={item.label}
      style={[styles.menuItem, { backgroundColor: themeColors.card }]}
      onPress={() => {
        if (item.route) {
          router.push(item.route as any);
        } else if (item.action) {
          item.action();
        }
      }}
      disabled={!item.route && !item.action}
    >
      <View style={styles.menuItemIcon}>{item.icon}</View>
      <View style={styles.menuItemContent}>
        <Text style={[styles.menuItemLabel, { color: themeColors.text }]}>
          {item.label}
        </Text>
        {item.description && (
          <Text style={[styles.menuItemDescription, { color: themeColors.textSecondary }]}>
            {item.description}
          </Text>
        )}
      </View>
      {item.rightElement || (
        item.route && <ChevronRight size={20} color={themeColors.textTertiary} />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Plus</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {menuSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
              {section.title}
            </Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderMenuItem)}
            </View>
          </View>
        ))}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  title: {
    ...typography.headlineMedium,
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
  sectionContent: {
    gap: spacing[2],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 75, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    ...typography.titleSmall,
  },
  menuItemDescription: {
    ...typography.bodySmall,
    marginTop: spacing[0.5],
  },
});
