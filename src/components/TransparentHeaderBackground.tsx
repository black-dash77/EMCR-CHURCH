import { LinearGradient } from 'expo-linear-gradient';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

interface TransparentHeaderBackgroundProps {
  height?: number;
}

export const HEADER_HEIGHT = 56;

export function TransparentHeaderBackground({ height }: TransparentHeaderBackgroundProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const themeColors = isDark ? colors.dark : colors.light;
  const bg = themeColors.background;

  const totalHeight = height || HEADER_HEIGHT + insets.top + 40;

  // Créer un gradient de fondu progressif
  // Part de la couleur de fond solide en haut vers transparent
  return (
    <View style={[styles.container, { height: totalHeight }]} pointerEvents="none">
      <LinearGradient
        colors={[
          bg,                    // 100% - solide
          bg,                    // 100% - zone solide étendue
          bg,                    // 100% - solide
          `${bg}F5`,             // 96% opacity
          `${bg}E6`,             // 90% opacity
          `${bg}B3`,             // 70% opacity
          `${bg}66`,             // 40% opacity
          `${bg}26`,             // 15% opacity
          `${bg}00`,             // 0% - transparent
        ]}
        locations={[0, 0.4, 0.55, 0.65, 0.72, 0.8, 0.88, 0.95, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});

export default TransparentHeaderBackground;
