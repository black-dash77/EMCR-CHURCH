import { useColorScheme as useNativeColorScheme } from 'react-native';

import { useUserStore } from '@stores/useUserStore';
import { colors, getColors } from '@theme/colors';

/**
 * Hook pour obtenir le schéma de couleurs actuel
 * Prend en compte les préférences utilisateur et le thème système
 */
export function useColorScheme() {
  const systemScheme = useNativeColorScheme();
  const { darkMode } = useUserStore();

  // Si l'utilisateur a défini une préférence, l'utiliser
  // Sinon, utiliser le thème système
  const scheme = darkMode ?? (systemScheme === 'dark');
  const isDark = scheme;

  return {
    isDark,
    colors: getColors(isDark ? 'dark' : 'light'),
    baseColors: colors,
  };
}
