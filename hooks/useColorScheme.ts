// ============================================================
// Color Scheme Hook
// Wraps React Native's useColorScheme to always return 'light' | 'dark'
// ============================================================

import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
  const scheme = useRNColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}
