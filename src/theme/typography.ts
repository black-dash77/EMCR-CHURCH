import { TextStyle } from 'react-native';

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const typography = {
  // Display - Hero titles
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.25,
  } as TextStyle,
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: fontWeights.bold,
    letterSpacing: 0,
  } as TextStyle,
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: fontWeights.bold,
    letterSpacing: 0,
  } as TextStyle,

  // Headlines
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0,
  } as TextStyle,
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0,
  } as TextStyle,
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0,
  } as TextStyle,

  // Titles
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0,
  } as TextStyle,
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.15,
  } as TextStyle,
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.1,
  } as TextStyle,

  // Body
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.5,
  } as TextStyle,
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.25,
  } as TextStyle,
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.4,
  } as TextStyle,

  // Labels
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.1,
  } as TextStyle,
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.5,
  } as TextStyle,
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.5,
  } as TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
