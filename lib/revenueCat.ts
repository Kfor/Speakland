/**
 * RevenueCat Initialization
 *
 * Configures RevenueCat Purchases SDK with platform-specific API keys.
 * Must be called once at app startup (before any paywall interactions).
 *
 * Note: RevenueCat is not available on web — all calls are no-ops on web.
 */

import { Platform } from 'react-native';

const REVENUECAT_API_KEY_IOS =
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? '';
const REVENUECAT_API_KEY_ANDROID =
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ?? '';

let isConfigured = false;

/**
 * Dynamically import Purchases to avoid crashes on web where the native
 * module is not available.
 */
async function getPurchases() {
  if (Platform.OS === 'web') return null;
  try {
    const mod = await import('react-native-purchases');
    return mod.default;
  } catch {
    console.warn('[RevenueCat] Failed to load react-native-purchases');
    return null;
  }
}

/**
 * Initialize RevenueCat with the appropriate platform API key.
 * Safe to call multiple times — only configures on first call.
 * No-op on web platform.
 *
 * @param userId - Optional Supabase user ID for attribution
 */
export async function configureRevenueCat(userId?: string): Promise<void> {
  if (isConfigured || Platform.OS === 'web') return;

  const Purchases = await getPurchases();
  if (!Purchases) return;

  const apiKey =
    Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

  if (!apiKey) {
    console.warn(
      '[RevenueCat] Missing API key for platform:',
      Platform.OS
    );
    return;
  }

  Purchases.configure({
    apiKey,
    appUserID: userId ?? null,
  });

  isConfigured = true;
}

/**
 * Identify a user in RevenueCat (call after login).
 * No-op on web platform.
 */
export async function identifyRevenueCatUser(
  userId: string
): Promise<void> {
  if (Platform.OS === 'web') return;
  const Purchases = await getPurchases();
  if (!Purchases) return;
  try {
    await Purchases.logIn(userId);
  } catch (err) {
    console.error('[RevenueCat] Failed to identify user:', err);
  }
}

/**
 * Reset RevenueCat user (call on logout).
 * No-op on web platform.
 */
export async function resetRevenueCatUser(): Promise<void> {
  if (Platform.OS === 'web') return;
  const Purchases = await getPurchases();
  if (!Purchases) return;
  try {
    await Purchases.logOut();
  } catch (err) {
    console.error('[RevenueCat] Failed to reset user:', err);
  }
}
