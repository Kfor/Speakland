// ============================================================
// Reusable Card Component
// ============================================================

import React, { type ReactNode } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { BorderRadius, Spacing, Shadows } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export function Card({ children, style, variant = 'elevated' }: CardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.card,
          borderColor: variant === 'outlined' ? colors.border : 'transparent',
          borderWidth: variant === 'outlined' ? 1 : 0,
        },
        variant === 'elevated' && Shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
});
