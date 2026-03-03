// ============================================================
// Supabase Client (Expo)
// Uses expo-secure-store for auth token persistence
// ============================================================

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore adapter for Supabase auth session persistence.
// On web, falls back to localStorage since SecureStore is native-only.
const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return Promise.resolve(localStorage.getItem(key));
      } catch {
        return Promise.resolve(null);
      }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Silently fail on web storage errors
      }
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch {
        // Silently fail on web storage errors
      }
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Supabase will not function correctly. Check your .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
