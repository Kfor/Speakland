/**
 * Auth Store - Zustand store for auth-related UI state
 *
 * Note: The actual auth session is managed by AuthProvider/Supabase.
 * This store holds derived UI state and preferences.
 */

import { create } from 'zustand';
import type { UserProfile } from '../types/user';
import { loadUserProfile } from '../lib/db';

interface AuthStoreState {
  profile: UserProfile | null;
  isOnboarded: boolean;

  setProfile: (profile: UserProfile | null) => void;
  setOnboarded: (value: boolean) => void;
  loadFromDb: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  profile: null,
  isOnboarded: false,

  setProfile: (profile) => set({ profile }),
  setOnboarded: (value) => set({ isOnboarded: value }),

  loadFromDb: async (userId) => {
    const profile = await loadUserProfile(userId);
    if (profile) {
      const hasOnboarding =
        profile.onboardingData != null &&
        Object.keys(profile.onboardingData).length > 0;
      set({ profile, isOnboarded: hasOnboarding });
    }
  },

  reset: () => set({ profile: null, isOnboarded: false }),
}));
