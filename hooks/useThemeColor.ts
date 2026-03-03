// ============================================================
// Theme Color Hook
// Returns the correct color for the current color scheme
// ============================================================

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, type ThemeColors } from '@/constants/Colors';

export function useThemeColor(colorName: keyof ThemeColors): string {
  const scheme = useColorScheme();
  return Colors[scheme][colorName];
}

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return Colors[scheme];
}
