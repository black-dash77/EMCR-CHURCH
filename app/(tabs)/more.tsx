import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
  Sparkles,
  Mic,
  FolderOpen,
  ListMusic,
  Church,
} from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Pressable,
  Switch,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/TabBarBackground';
import { TransparentHeaderBackground, HEADER_HEIGHT } from '@/components/TransparentHeaderBackground';
import { colors, typography, spacing, borderRadius, ThemeColors } from '@/theme';

const { width } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MenuItem {
  icon: React.ReactNode;
  iconBg: string;
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
  const insets = useSafeAreaInsets();

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Contenu',
      items: [
        {
          icon: <Church size={20} color="#FFFFFF" />,
          iconBg: '#7C3AED',
          label: 'Notre Église',
          description: 'Découvrez notre communauté',
          route: '/church-info',
        },
        {
          icon: <Mic size={20} color="#FFFFFF" />,
          iconBg: '#059669',
          label: 'Orateurs',
          description: 'Nos predicateurs',
          route: '/speakers',
        },
        {
          icon: <FolderOpen size={20} color="#FFFFFF" />,
          iconBg: '#D97706',
          label: 'Seminaires',
          description: 'Series de predications',
          route: '/seminars',
        },
        {
          icon: <Users size={20} color="#FFFFFF" />,
          iconBg: colors.primary[500],
          label: 'Membres',
          description: 'Equipe dirigeante et ministeres',
          route: '/members',
        },
        {
          icon: <ImageIcon size={20} color="#FFFFFF" />,
          iconBg: '#8B5CF6',
          label: 'Medias',
          description: 'Photos et videos',
          route: '/media',
        },
        {
          icon: <Mail size={20} color="#FFFFFF" />,
          iconBg: '#10B981',
          label: 'Contact',
          description: 'Nous contacter',
          route: '/contact',
        },
      ],
    },
    {
      title: 'Ma Bibliotheque',
      items: [
        {
          icon: <Heart size={20} color="#FFFFFF" />,
          iconBg: '#EF4444',
          label: 'Favoris',
          description: 'Mes predications favorites',
          route: '/favorites',
        },
        {
          icon: <ListMusic size={20} color="#FFFFFF" />,
          iconBg: '#8B5CF6',
          label: 'Mes Playlists',
          description: 'Listes de lecture personnelles',
          route: '/playlists',
        },
        {
          icon: <Clock size={20} color="#FFFFFF" />,
          iconBg: '#F59E0B',
          label: 'Historique',
          description: 'Predications ecoutees',
          route: '/history',
        },
        {
          icon: <Music size={20} color="#FFFFFF" />,
          iconBg: '#06B6D4',
          label: 'File d\'attente',
          description: 'Prochaines predications',
          route: '/queue',
        },
      ],
    },
    {
      title: 'Préférences',
      items: [
        {
          icon: <Moon size={20} color="#FFFFFF" />,
          iconBg: '#6366F1',
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
          icon: <Settings size={20} color="#FFFFFF" />,
          iconBg: '#64748B',
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
          icon: <Info size={20} color="#FFFFFF" />,
          iconBg: '#EC4899',
          label: 'À propos de l\'application',
          description: 'Version 1.0.0',
        },
      ],
    },
  ];

  const headerTotalHeight = HEADER_HEIGHT + insets.top;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TAB_BAR_HEIGHT + 60 },
        ]}
      >
        {/* Spacer pour le header */}
        <View style={{ height: headerTotalHeight + spacing[4] }} />

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()}>
          <Pressable
            style={({ pressed }) => [
              styles.profileCard,
              { backgroundColor: themeColors.card, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={colors.gradients.primarySoft}
              style={styles.profileAvatar}
            >
              <Sparkles size={24} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: themeColors.text }]}>
                Bienvenue
              </Text>
              <Text style={[styles.profileSubtitle, { color: themeColors.textSecondary }]}>
                Explorez toutes les fonctionnalités
              </Text>
            </View>
            <ChevronRight size={20} color={themeColors.textTertiary} />
          </Pressable>
        </Animated.View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <Animated.View
            key={section.title}
            entering={FadeInDown.delay(150 + sectionIndex * 50).duration(500).springify()}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionContent, { backgroundColor: themeColors.card }]}>
              {section.items.map((item, itemIndex) => (
                <MenuItemComponent
                  key={item.label}
                  item={item}
                  index={itemIndex}
                  isLast={itemIndex === section.items.length - 1}
                  themeColors={themeColors}
                  onPress={() => {
                    if (item.route) {
                      router.push(item.route as any);
                    } else if (item.action) {
                      item.action();
                    }
                  }}
                />
              ))}
            </View>
          </Animated.View>
        ))}

        {/* Footer */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500).springify()}
          style={styles.footer}
        >
          <Text style={[styles.footerText, { color: themeColors.textTertiary }]}>
            EMCR Church App
          </Text>
          <Text style={[styles.footerVersion, { color: themeColors.textTertiary }]}>
            Version 1.0.0
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Header Transparent avec gradient de fondu */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <TransparentHeaderBackground height={headerTotalHeight + 40} />

        {/* Contenu du header */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.headerContent}>
          <Text style={[styles.title, { color: themeColors.text }]}>Plus</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Paramètres et contenu
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

function MenuItemComponent({
  item,
  index,
  isLast,
  themeColors,
  onPress,
}: {
  item: MenuItem;
  index: number;
  isLast: boolean;
  themeColors: ThemeColors;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const hasAction = item.route || item.action;

  return (
    <AnimatedPressable
      style={[
        styles.menuItem,
        !isLast && [styles.menuItemBorder, { borderBottomColor: themeColors.border }],
        animatedStyle,
      ]}
      onPressIn={() => {
        if (hasAction) scale.value = withSpring(0.98);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      onPress={onPress}
      disabled={!hasAction}
    >
      <View style={[styles.menuItemIcon, { backgroundColor: item.iconBg }]}>
        {item.icon}
      </View>
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
        hasAction && <ChevronRight size={20} color={themeColors.textTertiary} />
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  title: {
    ...typography.headlineMedium,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing[4],
  },
  profileName: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  profileSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing[5],
  },
  sectionTitle: {
    ...typography.labelLarge,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: spacing[2],
    paddingLeft: spacing[2],
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  menuItemBorder: {
    borderBottomWidth: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  menuItemLabel: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  menuItemDescription: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  footerText: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  footerVersion: {
    ...typography.labelSmall,
    marginTop: spacing[1],
  },
});
