export const colors = {
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
    tabBar: 'rgba(255, 255, 255, 0.95)',
  },

  dark: {
    background: '#000000',
    surface: '#0F0F0F',
    surfaceElevated: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    border: '#27272A',
    divider: '#18181B',
    card: '#1A1A1A',
    tabBar: 'rgba(0, 0, 0, 0.95)',
  },

  semantic: {
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
  },

  gradients: {
    primary: ['#1A4BFF', '#0A1F99'],
    player: ['#1A4BFF', '#0E2AB3', '#000000'],
    card: ['rgba(26, 75, 255, 0.1)', 'rgba(26, 75, 255, 0.05)'],
  },
} as const;

export type ColorScheme = 'light' | 'dark';

export const getColors = (scheme: ColorScheme) => ({
  ...colors,
  ...(scheme === 'dark' ? colors.dark : colors.light),
});
