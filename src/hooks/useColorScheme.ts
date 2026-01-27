import { colors, getColors } from '@theme/colors';

/**
 * Hook pour obtenir le schéma de couleurs actuel
 * Mode dark uniquement - pas de mode jour
 */
export function useColorScheme() {
  // Force dark mode only
  const isDark = true;

  return {
    isDark,
    colors: getColors('dark'),
    baseColors: colors,
  };
}
