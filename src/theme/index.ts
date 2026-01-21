export { colors, getColors, getThemeColors, type ColorScheme, type ThemeColors } from './colors';
export { typography, fontWeights, type TypographyVariant } from './typography';
export { spacing, borderRadius, shadows } from './spacing';

export const theme = {
  light: {
    colors: {
      primary: '#1A4BFF',
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
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
  dark: {
    colors: {
      primary: '#1A4BFF',
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
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
} as const;

export type Theme = typeof theme.light;
