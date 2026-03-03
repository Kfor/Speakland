// ============================================================
// Auth Context & Provider
// Manages authentication state with Google and Apple Sign-In
// ============================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { identifyUser, logOutUser } from '@/lib/revenuecat';
import type { User } from '@/types';
import type { Session } from '@supabase/supabase-js';

// Complete the auth session for web-based OAuth flows
WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri({ scheme: 'speakland' });

// ---- Types ----

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---- Provider ----

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Fetch user profile from Supabase
  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('[Auth] Failed to fetch user profile:', error.message);
      return null;
    }
    return data as User;
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id).then((profile) => {
          setState({
            session,
            user: profile,
            isLoading: false,
            isAuthenticated: true,
          });
        });
        // Identify user with RevenueCat
        identifyUser(session.user.id).catch(console.warn);
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setState({
          session,
          user: profile,
          isLoading: false,
          isAuthenticated: true,
        });
        identifyUser(session.user.id).catch(console.warn);
      } else {
        setState({
          session: null,
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Google Sign-In via Supabase OAuth + expo-auth-session
  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('No OAuth URL returned');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

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
  }, []);

  // Apple Sign-In (native on iOS, OAuth fallback elsewhere)
  const signInWithApple = useCallback(async () => {
    if (Platform.OS === 'ios') {
      // Native Apple Sign-In
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('No identity token from Apple');
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce,
      });

      if (error) throw error;
    } else {
      // Fallback to OAuth for non-iOS platforms
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

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
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await logOutUser().catch(console.warn);
    setState({
      session: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  // Refresh user profile
  const refreshUser = useCallback(async () => {
    if (!state.session?.user) return;
    const profile = await fetchUserProfile(state.session.user.id);
    setState((prev) => ({ ...prev, user: profile }));
  }, [state.session, fetchUserProfile]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithGoogle,
        signInWithApple,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---- Hook ----

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
