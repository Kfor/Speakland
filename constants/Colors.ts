// ============================================================
// Speakland Theme Colors
// ============================================================

const primaryBlue = '#4A90D9';
const primaryBlueDark = '#3A7BC8';

export const Colors = {
  light: {
    // Brand
    primary: primaryBlue,
    primaryDark: primaryBlueDark,
    accent: '#FF8C42',
    accentLight: '#FFB380',

    // Text
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',

    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F3F4F6',
    backgroundTertiary: '#E5E7EB',
    card: '#FFFFFF',

    // Borders
    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    // Tab bar
    tabIconDefault: '#9CA3AF',
    tabIconSelected: primaryBlue,
    tabBar: '#FFFFFF',

    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Feedback
    encouragement: '#10B981',
    correction: '#F59E0B',

    // Shadows
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    // Brand
    primary: '#5BA0E9',
    primaryDark: primaryBlue,
    accent: '#FF8C42',
    accentLight: '#FFB380',

    // Text
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textMuted: '#9CA3AF',
    textInverse: '#1A1A2E',

    // Backgrounds
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    backgroundTertiary: '#334155',
    card: '#1E293B',

    // Borders
    border: '#334155',
    borderLight: '#1E293B',

    // Tab bar
    tabIconDefault: '#6B7280',
    tabIconSelected: '#5BA0E9',
    tabBar: '#1E293B',

    // Status
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',

    // Feedback
    encouragement: '#34D399',
    correction: '#FBBF24',

    // Shadows
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

export type ThemeColors = {
  [K in keyof typeof Colors.light]: string;
};
