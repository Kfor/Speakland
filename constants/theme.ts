/**
 * Speakland Theme Constants
 *
 * Centralized design tokens for colors, typography, spacing, etc.
 */

export const Colors = {
  // Primary
  primary: '#4A90D9',
  primaryLight: '#7AB5E8',
  primaryDark: '#2D6CB5',

  // Secondary
  secondary: '#FF8A65',
  secondaryLight: '#FFB899',
  secondaryDark: '#E65100',

  // Accent
  accent: '#66BB6A',
  accentLight: '#98EE99',
  accentDark: '#338A3E',

  // Neutral
  background: '#FFFFFF',
  surface: '#F5F5F5',
  card: '#FFFFFF',
  border: '#E0E0E0',
  divider: '#EEEEEE',

  // Text
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#BDBDBD',
  textOnPrimary: '#FFFFFF',

  // Semantic
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',

  // Learning-specific
  wordHighlight: '#FFF9C4',
  praiseGlow: '#E8F5E9',
  correctionGlow: '#FFF3E0',
} as const;

export const Fonts = {
  // Font families (loaded via expo-font if custom)
  family: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'monospace',
  },

  // Font sizes
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;
