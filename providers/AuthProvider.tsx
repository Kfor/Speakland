/**
 * AuthProvider - Authentication context provider
 *
 * Handles:
 * - Session restoration on app launch
 * - Google Sign-In via expo-auth-session
 * - Apple Sign-In via expo-apple-authentication
 * - Sign out
 * - Auth state change subscription
 * - Store hydration on SIGNED_IN, store reset on SIGNED_OUT
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { configureRevenueCat, identifyRevenueCatUser, resetRevenueCatUser } from '../lib/revenueCat';
import { useAuthStore, useGameStore, useVocabularyStore, useOnboardingStore } from '../stores';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

/** Load all store data from DB in parallel */
function hydrateStores(userId: string): void {
  Promise.all([
    useAuthStore.getState().loadFromDb(userId),
    useGameStore.getState().loadFromDb(userId),
    useVocabularyStore.getState().loadFromDb(userId),
  ]).catch((err) => {
    console.warn('[Auth] Store hydration error:', err);
  });
}

/** Reset all stores to initial state */
function resetAllStores(): void {
  useAuthStore.getState().reset();
  useGameStore.getState().reset();
  useVocabularyStore.getState().reset();
  useOnboardingStore.getState().reset();
}

const GOOGLE_CLIENT_ID_WEB =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? '';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount + subscribe to changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setIsLoading(false);
      if (initialSession?.user) {
        const userId = initialSession.user.id;
        configureRevenueCat(userId);
        identifyRevenueCatUser(userId);
        hydrateStores(userId);
      } else {
        configureRevenueCat();
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      if (event === 'SIGNED_IN' && newSession?.user) {
        identifyRevenueCatUser(newSession.user.id);
        hydrateStores(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        resetAllStores();
      } else if (newSession?.user) {
        identifyRevenueCatUser(newSession.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Google Sign-In
  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectUri = AuthSession.makeRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            client_id: GOOGLE_CLIENT_ID_WEB,
          },
        },
      });

      if (error) throw error;

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        );

        if (result.type === 'success') {
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }
    } catch (err) {
      console.error('[Auth] Google sign-in error:', err);
      throw err;
    }
  }, []);

  // Apple Sign-In
  const signInWithApple = useCallback(async () => {
    try {
      if (Platform.OS !== 'ios') {
        // On non-iOS, use OAuth flow
        const redirectUri = AuthSession.makeRedirectUri();
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: { redirectTo: redirectUri },
        });
        if (error) throw error;
        if (data.url) {
          await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        }
        return;
      }

      // Native Apple Sign-In on iOS
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token from Apple');
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;
    } catch (err) {
      console.error('[Auth] Apple sign-in error:', err);
      throw err;
    }
  }, []);

  // Sign Out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      await resetRevenueCatUser();
      setSession(null);
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signInWithGoogle,
        signInWithApple,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
