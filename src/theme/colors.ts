export const colors = {
  // Palette primaire originale
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#1A4BFF',
    600: '#1640E6',
    700: '#1235CC',
    800: '#0E2AB3',
    900: '#0A1F99',
  },

  // Accent doré pour les highlights
  accent: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    // Named colors for quick access
    orange: '#F97316',
    green: '#10B981',
    purple: '#A855F7',
    red: '#EF4444',
    pink: '#EC4899',
    blue: '#3B82F6',
    teal: '#14B8A6',
  },

  // Couleurs additionnelles
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },

  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7E22CE',
  },

  teal: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
  },

  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
  },

  light: {
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceElevated: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    border: '#E2E8F0',
    divider: '#F1F5F9',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    tabBar: 'rgba(255, 255, 255, 0.95)',
    overlay: 'rgba(15, 23, 42, 0.5)',
  },

  dark: {
    background: '#000000',
    surface: '#080808',
    surfaceElevated: '#0F0F0F',
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    border: '#1A1A1A',
    divider: '#101010',
    card: '#0C0C0C',
    cardElevated: '#121212',
    tabBar: 'rgba(0, 0, 0, 0.95)',
    overlay: 'rgba(0, 0, 0, 0.85)',
  },

  semantic: {
    success: '#10B981',
    successLight: '#D1FAE5',
    successDark: '#059669',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    warningDark: '#D97706',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    errorDark: '#DC2626',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    infoDark: '#2563EB',
  },

  gradients: {
    primary: ['#1A4BFF', '#0A1F99'],
    primarySoft: ['#1A4BFF', '#1640E6'],
    secondary: ['#A855F7', '#7E22CE'],
    hero: ['#1A4BFF', '#1235CC', '#0A1F99'],
    heroRadial: ['#1A4BFF', '#0A1F99'],
    player: ['#1A4BFF', '#0E2AB3', '#000000'],
    card: ['rgba(26, 75, 255, 0.08)', 'rgba(26, 75, 255, 0.02)'],
    cardHover: ['rgba(26, 75, 255, 0.15)', 'rgba(26, 75, 255, 0.05)'],
    accent: ['#FBBF24', '#F59E0B'],
    glass: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)'],
    glassDark: ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.15)'],
  },
} as const;

export type ColorScheme = 'light' | 'dark';

// Type pour les couleurs de thème (light/dark)
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  divider: string;
  card: string;
  cardElevated: string;
  tabBar: string;
  overlay: string;
};

export const getColors = (scheme: ColorScheme) => {
  const themeColors: ThemeColors = scheme === 'dark' ? { ...colors.dark } : { ...colors.light };

  return {
    ...colors,
    ...themeColors,
  };
};

// Helper pour obtenir les couleurs de thème uniquement
export const getThemeColors = (scheme: ColorScheme): ThemeColors => {
  return scheme === 'dark' ? { ...colors.dark } : { ...colors.light };
};
