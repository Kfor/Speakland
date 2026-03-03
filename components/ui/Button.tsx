// ============================================================
// Reusable Button Component
// ============================================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const containerStyles: StyleProp<ViewStyle> = [
    styles.base,
    sizeStyles[size],
    {
      backgroundColor:
        variant === 'primary'
          ? colors.primary
          : variant === 'secondary'
            ? colors.backgroundSecondary
            : 'transparent',
      borderWidth: variant === 'outline' ? 1.5 : 0,
      borderColor: variant === 'outline' ? colors.primary : undefined,
      opacity: disabled || loading ? 0.5 : 1,
    },
    style,
  ];

  const textColor =
    variant === 'primary'
      ? colors.textInverse
      : variant === 'secondary'
        ? colors.text
        : colors.primary;

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              textSizeStyles[size],
              { color: textColor, marginLeft: icon ? Spacing.sm : 0 },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  text: {
    fontWeight: FontWeight.semibold,
  },
});

const sizeStyles: Record<string, ViewStyle> = {
  sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl },
};

const textSizeStyles: Record<string, TextStyle> = {
  sm: { fontSize: FontSize.sm },
  md: { fontSize: FontSize.md },
  lg: { fontSize: FontSize.lg },
};
