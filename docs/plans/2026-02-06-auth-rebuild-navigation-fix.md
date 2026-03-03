# Auth Rebuild + Navigation Flow Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild Speakland's authentication system with anonymous login, Google/Apple native SDK sign-in, account transfer, and fix the navigation flow so onboarding gates correctly.

**Architecture:** Anonymous-first auth: app auto-signs-in anonymously on launch, all data binds to that user_id. When user links Google/Apple, a transfer-account Edge Function migrates data if user_id changes. Navigation is driven by auth loading state + existing `hasCompletedOnboarding()` from `services/storage.ts`. Paywall dismiss sets the final `@onboarding_completed` flag and navigates to `/(tabs)`.

**Tech Stack:** Expo 54, Supabase (auth + edge functions + postgres), Zustand (authStore), @react-native-google-signin/google-signin, expo-apple-authentication

---

## Reference Files (in template at /Users/k/MyPlayground/aigc/ai-app-template)

When implementing, read these files for patterns:
- `mobile/src/contexts/AuthContext.tsx` — AuthProvider with AppState, onAuthStateChange, signOut cleanup
- `mobile/src/stores/authStore.ts` — Zustand store synced with AuthContext
- `mobile/src/hooks/useAuth.ts` — mutations for anonymous, Google, Apple sign-in + transfer token logic
- `mobile/src/components/auth/GoogleSignIn.tsx` — Native Google sign-in component
- `backend/supabase/functions/transfer-account/index.ts` — Edge Function for data migration

## Key Codebase Facts

- **Path alias:** `@/*` maps to `./*` (tsconfig.json)
- **Trigger function name:** `handle_updated_at()` in initial_schema.sql (NOT `update_updated_at_column`)
- **user_preferences table:** Has separate `001_user_preferences.sql` (in `speakland/` archive), `user_id` has NO FK constraint, NO RLS
- **No root `app/index.tsx`** currently — `(tabs)` is default entry
- **Onboarding flow:** `complete.tsx` → `/tutorial` → `/paywall` → `/(tabs)` (paywall's `handleClose`/`handlePurchase`/`handleRestore` all call `router.replace('/(tabs)')`)
- **Storage keys:** `has_completed_questionnaire`, `has_completed_tutorial`, `has_seen_paywall` — combined into `hasCompletedOnboarding()` (checks questionnaire AND tutorial both true)
- **Existing supabase client** in `lib/supabase.ts` reads env via `Constants.expoConfig?.extra` with fallback to `process.env.EXPO_PUBLIC_*`
- **OnboardingContext** does NOT include `user_id` in insert currently

---

### Task 1: Install new dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

Run:
```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345 && npx expo install zustand @react-native-google-signin/google-signin expo-apple-authentication
```

Expected: Packages added to package.json dependencies.

**Step 2: Verify installation**

Run:
```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345 && node -e "const p=require('./package.json'); console.log('zustand:', !!p.dependencies.zustand, 'google-signin:', !!p.dependencies['@react-native-google-signin/google-signin'], 'apple:', !!p.dependencies['expo-apple-authentication'])"
```

Expected: All three `true`.

**Step 3: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add package.json package-lock.json
git commit -m "chore: add zustand, google-signin, expo-apple-authentication"
```

---

### Task 2: Update app.json with Google Sign-In config plugin

**Files:**
- Modify: `app.json`

**Step 1: Add config plugins**

In `app.json`, change the `"plugins"` array from:

```json
"plugins": [
  "expo-router"
]
```

To:

```json
"plugins": [
  "expo-router",
  "@react-native-google-signin/google-signin",
  "expo-apple-authentication"
]
```

**Step 2: Verify JSON is valid**

Run:
```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345 && node -e "const j=JSON.parse(require('fs').readFileSync('app.json','utf8')); console.log('plugins:', j.expo.plugins)"
```

Expected: Array with 3 items.

**Step 3: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add app.json
git commit -m "chore: add google-signin and apple-auth expo config plugins"
```

---

### Task 3: Environment variable validation

**Files:**
- Create: `lib/env.ts`
- Modify: `lib/supabase.ts`

**Step 1: Create `lib/env.ts`**

```typescript
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function validateUrl(url: string | undefined, name: string): string {
  if (!url) {
    throw new Error(`Missing environment variable: ${name}. Check your .env file.`);
  }
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid URL in ${name}: "${url}". Must be a valid URL.`);
  }
  return url;
}

function validateKey(key: string | undefined, name: string): string {
  if (!key) {
    throw new Error(`Missing environment variable: ${name}. Check your .env file.`);
  }
  return key;
}

export const env = {
  supabaseUrl: validateUrl(SUPABASE_URL, 'EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: validateKey(SUPABASE_ANON_KEY, 'EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
} as const;
```

**Step 2: Update `lib/supabase.ts` to use `env.ts`**

Replace the credential reading section. Change:

```typescript
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'http://127.0.0.1:54321';

const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
```

To:

```typescript
import { env } from './env';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
```

Remove the `Constants` import. Keep all the `Db*` interfaces unchanged.

**Step 3: Verify TypeScript compiles**

Run:
```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345 && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors related to env.ts or supabase.ts.

**Step 4: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add lib/env.ts lib/supabase.ts
git commit -m "feat: add environment variable validation, update supabase client"
```

---

### Task 4: Create Zustand authStore

**Files:**
- Create: `stores/authStore.ts`

**Step 1: Create the store**

Create `stores/authStore.ts`:

```typescript
import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),

  setLoading: (loading) => set({ loading }),

  clearAuth: () =>
    set({
      session: null,
      user: null,
      loading: false,
    }),
}));

export const getAuthState = () => useAuthStore.getState();

export const subscribeToAuth = (callback: (state: AuthState) => void) =>
  useAuthStore.subscribe(callback);
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345 && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors related to authStore.ts.

**Step 3: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add stores/authStore.ts
git commit -m "feat: add Zustand auth store for non-React auth access"
```

---

### Task 5: Rewrite AuthContext with anonymous login + AppState awareness

**Files:**
- Modify: `contexts/AuthContext.tsx`

**Step 1: Rewrite AuthContext.tsx**

Replace the entire file with:

```typescript
import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface AuthContextType {
  session: Session | null;
  user: Session['user'] | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isSigningOutRef = useRef(false);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      useAuthStore.getState().setSession(session);
    } catch (error) {
      console.error('[Auth] Error refreshing session:', error);
    }
  }, []);

  useEffect(() => {
    // Get initial session, then auto sign in anonymously if none
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        useAuthStore.getState().setSession(initialSession);
        setLoading(false);
        useAuthStore.getState().setLoading(false);
        console.info('[Auth] Restored session, userId:', initialSession.user.id);
      } else {
        // No existing session — sign in anonymously
        try {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.error('[Auth] Anonymous sign-in failed:', error);
          } else {
            console.info('[Auth] Anonymous sign-in success, userId:', data.session?.user.id);
            setSession(data.session);
            useAuthStore.getState().setSession(data.session);
          }
        } catch (e) {
          console.error('[Auth] Anonymous sign-in exception:', e);
        } finally {
          setLoading(false);
          useAuthStore.getState().setLoading(false);
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State changed:', event, session ? 'with session' : 'no session');

        if (isSigningOutRef.current) return;

        setSession(session);
        useAuthStore.getState().setSession(session);
        setLoading(false);
        useAuthStore.getState().setLoading(false);

        if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] Token refreshed');
        }
      }
    );

    // AppState: start/stop auto refresh
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    supabase.auth.startAutoRefresh();
    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      isSigningOutRef.current = true;
      await supabase.auth.signOut();
      setSession(null);
      useAuthStore.getState().clearAuth();
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
    } finally {
      isSigningOutRef.current = false;
    }
  }, []);

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    loading,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

**IMPORTANT:** This removes `signIn`, `signUp`, `isAuthenticated` from the old API. Files that import these will need updates (handled in Task 15).

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345 && npx tsc --noEmit 2>&1 | head -30
```

Expected: May see errors in files that used the old API — that's fine, fixed in Task 15.

**Step 3: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add contexts/AuthContext.tsx
git commit -m "feat: rewrite AuthContext with anonymous login, AppState refresh, Zustand sync"
```

---

### Task 6: Create useAuthActions hook with Google/Apple sign-in + transfer tokens

**Files:**
- Create: `hooks/useAuthActions.ts`

**Step 1: Create `hooks/useAuthActions.ts`**

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { User } from '@supabase/supabase-js';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import { getAuthState, subscribeToAuth } from '@/stores/authStore';

// Configure Google Sign-In (call once at module level)
if (env.googleWebClientId) {
  GoogleSignin.configure({
    webClientId: env.googleWebClientId,
    iosClientId: env.googleIosClientId || undefined,
  });
}

function generateTransferToken(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function waitForAuthUserChange(
  previousUserId?: string | null,
): Promise<User | null> {
  const current = getAuthState().user;
  if (current?.id && current.id !== previousUserId) return current;

  return new Promise((resolve) => {
    let unsubscribe: () => void = () => {};
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(getAuthState().user);
    }, 3000);

    unsubscribe = subscribeToAuth((state) => {
      const nextUser = state.user ?? null;
      if (nextUser?.id && nextUser.id !== previousUserId) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(nextUser);
      }
    });
  });
}

async function createTransferToken(oldUserId: string): Promise<string | null> {
  const token = generateTransferToken();
  try {
    await supabase
      .from('account_transfer_tokens')
      .insert({ old_user_id: oldUserId, token });
    return token;
  } catch (e) {
    console.warn('[Auth] Failed to create transfer token', e);
    return null;
  }
}

async function triggerTransferIfNeeded(
  oldUserId: string | undefined,
  transferToken: string | null,
) {
  if (!oldUserId || !transferToken) return;
  try {
    const afterUser = await waitForAuthUserChange(oldUserId);
    if (afterUser?.id && afterUser.id !== oldUserId) {
      await supabase.functions.invoke('transfer-account', {
        body: { old_user_id: oldUserId, token: transferToken },
      });
      console.info('[Auth] Account transfer completed');
    }
  } catch (e) {
    console.warn('[Auth] Auto transfer failed:', e);
  }
}

export function useAuthActions() {
  const { user, signOut } = useAuth();

  const signInWithGoogle = async () => {
    const beforeUser = getAuthState().user;
    const oldUserId = beforeUser?.id;
    const transferToken = oldUserId ? await createTransferToken(oldUserId) : null;

    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;
    if (!idToken) throw new Error('No ID token from Google');

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;

    await triggerTransferIfNeeded(oldUserId, transferToken);
    return data;
  };

  const signInWithApple = async () => {
    const beforeUser = getAuthState().user;
    const oldUserId = beforeUser?.id;
    const transferToken = oldUserId ? await createTransferToken(oldUserId) : null;

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('No identity token from Apple');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) throw error;

    // Update name if available
    if (data.user && credential.fullName) {
      const displayName = [credential.fullName.givenName, credential.fullName.familyName]
        .filter(Boolean)
        .join(' ');
      if (displayName) {
        await supabase.auth.updateUser({ data: { full_name: displayName } });
      }
    }

    await triggerTransferIfNeeded(oldUserId, transferToken);
    return data;
  };

  return {
    user,
    signOut,
    signInWithGoogle,
    signInWithApple,
    isAnonymous: user?.is_anonymous ?? true,
  };
}
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345 && npx tsc --noEmit 2>&1 | head -30
```

Note: If `expo-apple-authentication` static import causes issues on Android, wrap calls with `Platform.OS === 'ios'` guard at call site (not import site).

**Step 3: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add hooks/useAuthActions.ts
git commit -m "feat: add useAuthActions hook with Google/Apple sign-in and account transfer"
```

---

### Task 7: Database schema migrations

**Files:**
- Create: `supabase/migrations/20260206000001_user_profiles.sql`
- Create: `supabase/migrations/20260206000002_account_transfer_tokens.sql`
- Create: `supabase/migrations/20260206000003_fix_user_preferences.sql`

**Step 1: Create user_profiles migration**

Create `supabase/migrations/20260206000001_user_profiles.sql`:

```sql
-- user_profiles: extends auth.users with app-specific data
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  target_language TEXT,
  subscription_status TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  revenuecat_customer_id TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at (reuse existing handle_updated_at from initial_schema)
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Step 2: Create account_transfer_tokens migration**

Create `supabase/migrations/20260206000002_account_transfer_tokens.sql`:

```sql
-- account_transfer_tokens: secure tokens for anonymous->OAuth data migration
CREATE TABLE IF NOT EXISTS public.account_transfer_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_user_id UUID NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_transfer_tokens_lookup
  ON public.account_transfer_tokens(old_user_id, token)
  WHERE used_at IS NULL;

-- RLS: only the old user can create a token for themselves
ALTER TABLE public.account_transfer_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own transfer tokens"
  ON public.account_transfer_tokens FOR INSERT
  WITH CHECK (auth.uid() = old_user_id);

CREATE POLICY "Users can view own transfer tokens"
  ON public.account_transfer_tokens FOR SELECT
  USING (auth.uid() = old_user_id);
```

**Step 3: Create user_preferences fix migration**

Create `supabase/migrations/20260206000003_fix_user_preferences.sql`:

```sql
-- Fix user_preferences: add FK constraint and RLS
-- Note: user_preferences table was created by 001_user_preferences.sql
-- with user_id UUID but no FK and no RLS

-- Add FK constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_preferences_user_id_fkey'
    AND table_name = 'user_preferences'
  ) THEN
    ALTER TABLE public.user_preferences
      ADD CONSTRAINT user_preferences_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);
```

**Step 4: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add supabase/migrations/
git commit -m "feat: add DB migrations for user_profiles, transfer_tokens, fix user_preferences RLS"
```

---

### Task 8: Create transfer-account Edge Function

**Files:**
- Create: `supabase/functions/transfer-account/index.ts`

**Step 1: Create the Edge Function**

Create `supabase/functions/transfer-account/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const authToken = authHeader.replace('Bearer ', '')
    const userClient = createClient(supabaseUrl, supabaseAnonKey)
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify calling user
    const { data: userRes, error: userErr } = await userClient.auth.getUser(authToken)
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }
    const newUserId = userRes.user.id

    const body: { old_user_id?: string; token?: string } = await req.json().catch(() => ({}))
    const oldUserId = body.old_user_id
    const token = body.token

    if (!oldUserId || !token) {
      return new Response(JSON.stringify({ error: 'Missing old_user_id or token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (oldUserId === newUserId) {
      return new Response(JSON.stringify({ success: true, message: 'No transfer needed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify token: must exist, unused, within 30 minutes
    const { data: tokenRow, error: tokenErr } = await admin
      .from('account_transfer_tokens')
      .select('*')
      .eq('old_user_id', oldUserId)
      .eq('token', token)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (tokenErr || !tokenRow) {
      return new Response(JSON.stringify({ error: 'Invalid or used token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const createdAt = new Date(tokenRow.created_at)
    const diffMinutes = (Date.now() - createdAt.getTime()) / 60000
    if (diffMinutes > 30) {
      return new Response(JSON.stringify({ error: 'Token expired' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Ensure old user is anonymous
    const { data: oldUser } = await admin.auth.admin.getUserById(oldUserId)
    if (oldUser?.user && (oldUser.user as any).is_anonymous === false) {
      return new Response(JSON.stringify({ error: 'Only anonymous accounts can be transferred' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Transfer data: update user_id references in all user-owned tables
    // vocabulary
    await admin.from('vocabulary').update({ user_id: newUserId }).eq('user_id', oldUserId)

    // saved_sentences
    await admin.from('saved_sentences').update({ user_id: newUserId }).eq('user_id', oldUserId)

    // user_preferences
    await admin.from('user_preferences').update({ user_id: newUserId }).eq('user_id', oldUserId)

    // user_profiles: merge profile data
    const { data: oldProfile } = await admin
      .from('user_profiles')
      .select('*')
      .eq('user_id', oldUserId)
      .maybeSingle()

    if (oldProfile) {
      const updateData: Record<string, any> = {}
      if (oldProfile.nickname) updateData.nickname = oldProfile.nickname
      if (oldProfile.target_language) updateData.target_language = oldProfile.target_language
      if (oldProfile.onboarding_completed) updateData.onboarding_completed = true

      if (Object.keys(updateData).length > 0) {
        await admin
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', newUserId)
      }

      // Delete old profile
      await admin.from('user_profiles').delete().eq('user_id', oldUserId)
    }

    // unlocked_characters
    await admin.from('unlocked_characters').update({ user_id: newUserId }).eq('user_id', oldUserId)

    // user_settings
    await admin.from('user_settings').update({ user_id: newUserId }).eq('user_id', oldUserId)

    // Mark token as used
    await admin
      .from('account_transfer_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('transfer-account error:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

**Step 2: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add supabase/functions/
git commit -m "feat: add transfer-account Edge Function for anonymous->OAuth data migration"
```

---

### Task 9: Fix OnboardingContext to include user_id in submissions

**Files:**
- Modify: `contexts/OnboardingContext.tsx`

**Step 1: Add authStore import and include user_id in insert**

At the top of the file, add:

```typescript
import { getAuthState } from '@/stores/authStore';
```

In the `submitToSupabase` function, change the insert from:

```typescript
const { error } = await supabase.from('user_preferences').insert({
  target_language: data.targetLanguage,
  learning_purpose: data.learningPurpose,
  difficulty_level: data.difficultyLevel,
  learning_types: data.learningTypes,
  pain_points: data.painPoints,
  script_preference: data.scriptPreference,
  nickname: data.nickname || null,
});
```

To:

```typescript
const userId = getAuthState().user?.id;
const { error } = await supabase.from('user_preferences').insert({
  user_id: userId,
  target_language: data.targetLanguage,
  learning_purpose: data.learningPurpose,
  difficulty_level: data.difficultyLevel,
  learning_types: data.learningTypes,
  pain_points: data.painPoints,
  script_preference: data.scriptPreference,
  nickname: data.nickname || null,
});
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345 && npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add contexts/OnboardingContext.tsx
git commit -m "fix: include user_id in onboarding preference submissions"
```

---

### Task 10: Create unified AppProviders

**Files:**
- Create: `contexts/index.tsx`

**Step 1: Create `contexts/index.tsx`**

```typescript
import React from 'react';
import { AuthProvider } from './AuthContext';
import { OnboardingProvider } from './OnboardingContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OnboardingProvider>
        {children}
      </OnboardingProvider>
    </AuthProvider>
  );
}
```

**Step 2: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add contexts/index.tsx
git commit -m "feat: create unified AppProviders wrapper"
```

---

### Task 11: Create root index.tsx for navigation gating

**Files:**
- Create: `app/index.tsx`

**Step 1: Create `app/index.tsx`**

The entry point checks auth loading state + onboarding completion, then redirects.

```typescript
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { hasCompletedOnboarding } from '@/services/storage';

export default function IndexScreen() {
  const { loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const checkOnboarding = async () => {
      try {
        const completed = await hasCompletedOnboarding();
        if (completed) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } catch {
        router.replace('/onboarding');
      }
    };

    checkOnboarding();
  }, [loading]);

  // Show splash-like loading while checking auth + onboarding
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F1',
  },
});
```

**Key decisions:**
- Uses existing `hasCompletedOnboarding()` from `services/storage.ts` (checks both questionnaire AND tutorial)
- Routes to `/onboarding` (which redirects to `/onboarding/questionnaire`)
- Splash color `#6366F1` matches `app.json` splash background

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345 && npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add app/index.tsx
git commit -m "feat: add root index.tsx with auth + onboarding gate navigation"
```

---

### Task 12: Update root _layout.tsx with AppProviders + navigation structure

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: Update `app/_layout.tsx`**

Replace the entire file with:

```typescript
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/contexts';

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="tutorial" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="auth/login"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="chat/[characterId]" options={{ headerShown: true, title: 'Chat' }} />
        <Stack.Screen name="story/[storyId]" options={{ headerShown: true, title: 'Story' }} />
      </Stack>
    </AppProviders>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345 && npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add app/_layout.tsx
git commit -m "feat: update root layout with AppProviders and navigation structure"
```

---

### Task 13: Fix paywall.tsx to set onboarding completed flag

**Files:**
- Modify: `app/paywall.tsx`

**Step 1: Update paywall.tsx**

The paywall is the LAST screen before entering `/(tabs)`. All three exit paths (`handlePurchase`, `handleRestore`, `handleClose`) currently call `router.replace('/(tabs)')`. We need to also set the full onboarding completed flag.

Import at the top of the file (add to existing imports from `@/services/storage`):

```typescript
import { setPaywallSeen, setPremiumStatus, setOnboardingCompleted } from '@/services/storage';
```

Note: `setOnboardingCompleted` already exists and sets all three flags (`has_seen_onboarding`, `has_completed_questionnaire`, `has_completed_tutorial`).

In `handlePurchase`, after `await setPremiumStatus(true)` and `await setPaywallSeen()`, add:

```typescript
await setOnboardingCompleted();
```

In `handleRestore`, after `await setPremiumStatus(true)` and `await setPaywallSeen()`, add:

```typescript
await setOnboardingCompleted();
```

In `handleClose`, after `await setPaywallSeen()`, add:

```typescript
await setOnboardingCompleted();
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345 && npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add app/paywall.tsx
git commit -m "fix: set onboarding_completed flag when leaving paywall to tabs"
```

---

### Task 14: Update login screen to use new auth hook

**Files:**
- Modify: `app/auth/login.tsx`

**Step 1: Rewrite login screen**

Replace the entire file with:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthActions } from '@/hooks/useAuthActions';
import { statusCodes } from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithApple, isAnonymous } = useAuthActions();
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);

  const handleGoogle = async () => {
    setLoading('google');
    try {
      await signInWithGoogle();
      Alert.alert('Success', 'Account linked successfully!');
      router.back();
    } catch (error: any) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) return;
      console.error('Google sign-in error:', error);
      Alert.alert('Error', error?.message || 'Google sign-in failed');
    } finally {
      setLoading(null);
    }
  };

  const handleApple = async () => {
    setLoading('apple');
    try {
      await signInWithApple();
      Alert.alert('Success', 'Account linked successfully!');
      router.back();
    } catch (error: any) {
      if (error?.code === 'ERR_REQUEST_CANCELED') return;
      console.error('Apple sign-in error:', error);
      Alert.alert('Error', error?.message || 'Apple sign-in failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <Text style={styles.title}>Speakland</Text>
        <Text style={styles.subtitle}>
          {isAnonymous
            ? 'Link your account to sync across devices'
            : 'You are already signed in'}
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogle}
            disabled={!!loading}
          >
            {loading === 'google' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue with Google</Text>
            )}
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.appleButton, loading && styles.buttonDisabled]}
              onPress={handleApple}
              disabled={!!loading}
            >
              {loading === 'apple' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue with Apple</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 24, paddingVertical: 16 },
  cancelText: { fontSize: 16, color: '#4ECDC4' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  logoPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#4ECDC4', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  logoText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  buttons: { width: '100%', gap: 12 },
  googleButton: {
    backgroundColor: '#4285F4', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  appleButton: {
    backgroundColor: '#000', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345 && npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add app/auth/login.tsx
git commit -m "feat: replace email login with Google/Apple OAuth for account binding"
```

---

### Task 15: Fix remaining TypeScript errors and verify build

**Files:**
- Potentially multiple files depending on errors

**Step 1: Run full TypeScript check**

Run:
```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345 && npx tsc --noEmit 2>&1
```

**Step 2: Fix all errors**

Common issues to expect and how to fix:
- **Files importing `signIn`/`signUp`/`isAuthenticated` from old AuthContext**: The old `useAuth()` no longer exposes these. Find all usages and either remove them or update them to use `useAuthActions()`.
- **`expo-constants` import in `lib/supabase.ts`**: Should have been removed in Task 3.
- **`OnboardingContext` default export**: The current file has `export default OnboardingContext` — remove it since `contexts/index.tsx` only needs the named exports.
- **`app/(tabs)/vocabulary.tsx`**: Check if it imports `useAuth` for the login button — update to navigate to `auth/login` route.

**Step 3: Verify the app bundler starts**

Run:
```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345 && npx expo export --platform web 2>&1 | tail -5
```

Expected: No fatal errors. Web export completes (or only platform-specific errors for native modules).

**Step 4: Commit all remaining fixes**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add -A
git commit -m "fix: resolve TypeScript errors and verify build"
```

---

### Task 16: Update .env.example with all required variables

**Files:**
- Modify: `.env.example`

**Step 1: Update .env.example**

Replace content with:

```
# Supabase
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Google OAuth (get from Google Cloud Console)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=

# RevenueCat (optional, for subscriptions)
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=
```

**Step 2: Commit**

```bash
cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770373587345
git add .env.example
git commit -m "docs: update .env.example with all required environment variables"
```

---

## Task Dependency Graph

```
T1 (deps) → T2 (app.json) → T3 (env) → T4 (authStore) → T5 (AuthContext) → T6 (useAuthActions)
                                                                                      ↓
T7 (DB migrations) ──────────────────────────────────────────────────→ T8 (Edge Function)
                                                                                      ↓
T9 (OnboardingCtx) → T10 (AppProviders) → T11 (index.tsx) → T12 (_layout.tsx)
                                                     ↓
                                              T13 (paywall.tsx) → T14 (login.tsx) → T15 (fix errors) → T16 (.env)
```

Tasks 1-6 are sequential (each builds on previous).
Tasks 7-8 can run in parallel with Tasks 5-6.
Tasks 9-14 are sequential.
Task 15 depends on all prior tasks.

**Parallelization opportunities for subagent-driven development:**
- T7 + T8 can run in parallel with T5 + T6
- T9 can start once T4 is done (needs authStore import)

---

## Verification Checklist

After all tasks complete, verify these acceptance criteria:

1. **Anonymous login:** `npx expo start`, open app — console shows `[Auth] Anonymous sign-in success, userId: <uuid>` OR `[Auth] Restored session, userId: <uuid>`
2. **Onboarding gate:** First launch goes to onboarding flow, not tabs
3. **Onboarding complete → tutorial → paywall → tabs:** After finishing onboarding, flows through tutorial and paywall to `/(tabs)`
4. **Return visit skips onboarding:** Close and reopen app → goes directly to `/(tabs)`
5. **Google/Apple sign-in works:** Login page shows OAuth buttons, clicking them triggers native flow
6. **Data preserved after binding:** Vocabulary/preferences from anonymous session persist after OAuth link
7. **Missing env var error:** Remove `EXPO_PUBLIC_SUPABASE_URL` from .env, restart → clear error message (not white screen)
8. **TypeScript clean:** `npx tsc --noEmit` passes with no errors
