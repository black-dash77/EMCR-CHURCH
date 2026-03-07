import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, StyleSheet, useColorScheme, Platform } from 'react-native';

import { colors } from '@/theme';

export const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 70 : 52;
const TAB_BAR_BOTTOM_OFFSET = Platform.OS === 'ios' ? 34 : 16;
const FADE_HEIGHT = 120;

export function TabBarBackground() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const bg = themeColors.background;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[
          `${bg}00`,   // 0% - transparent
          `${bg}33`,   // 20%
          `${bg}66`,   // 40%
          `${bg}99`,   // 60%
          `${bg}CC`,   // 80%
          `${bg}E6`,   // 90%
          bg,          // 100% - solide
          bg,          // 100% - solide
        ]}
        locations={[0, 0.08, 0.18, 0.3, 0.45, 0.6, 0.75, 1]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -TAB_BAR_BOTTOM_OFFSET,
          height: TAB_BAR_HEIGHT + FADE_HEIGHT + TAB_BAR_BOTTOM_OFFSET,
        }}
      />
    </View>
  );
}

export default React.memo(TabBarBackground);
