import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  ScrollViewProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

import { colors } from '@/theme';

interface FadingScrollViewProps extends ScrollViewProps {
  children: ReactNode;
  showTopFade?: boolean;
  showBottomFade?: boolean;
  topFadeHeight?: number;
  bottomFadeHeight?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function FadingScrollView({
  children,
  showTopFade = false,
  showBottomFade = true,
  topFadeHeight = 60,
  bottomFadeHeight = 80,
  contentContainerStyle,
  ...props
}: FadingScrollViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const bg = themeColors.background;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        {...props}
      >
        {children}
      </ScrollView>

      {/* Gradient de fondu en haut */}
      {showTopFade && (
        <LinearGradient
          colors={[
            bg,
            `${bg}E6`,
            `${bg}99`,
            `${bg}33`,
            `${bg}00`,
          ]}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          style={[styles.topFade, { height: topFadeHeight }]}
          pointerEvents="none"
        />
      )}

      {/* Gradient de fondu en bas */}
      {showBottomFade && (
        <LinearGradient
          colors={[
            `${bg}00`,
            `${bg}33`,
            `${bg}99`,
            `${bg}E6`,
            bg,
          ]}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          style={[styles.bottomFade, { height: bottomFadeHeight }]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default FadingScrollView;
