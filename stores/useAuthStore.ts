/**
 * Auth Store - Zustand store for auth-related UI state
 *
 * Note: The actual auth session is managed by AuthProvider/Supabase.
 * This store holds derived UI state and preferences.
 */

import { create } from 'zustand';
import type { UserProfile } from '../types/user';

interface AuthStoreState {
  profile: UserProfile | null;
  isOnboarded: boolean;

  setProfile: (profile: UserProfile | null) => void;
  setOnboarded: (value: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  profile: null,
  isOnboarded: false,

  setProfile: (profile) => set({ profile }),
  setOnboarded: (value) => set({ isOnboarded: value }),
  reset: () => set({ profile: null, isOnboarded: false }),
}));
