// ============================================================
// RevenueCat SDK Integration
// Manages in-app subscriptions for iOS and Android
// ============================================================

import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';

const ENTITLEMENT_ID = 'pro';

const API_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
};

/**
 * Initialize RevenueCat SDK. Call once during app startup after auth.
 */
export async function initPurchases(userId?: string): Promise<void> {
  const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;

  if (!apiKey) {
    console.warn(
      '[RevenueCat] Missing API key for platform:',
      Platform.OS,
      '- Purchases will not function.'
    );
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({
    apiKey,
    appUserID: userId ?? null,
  });
}

/**
 * Identify the user with RevenueCat (call after login).
 * Uses Supabase user ID to sync across platforms.
 */
export async function identifyUser(userId: string): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.logIn(userId);
  return customerInfo;
}

/**
 * Log out the current user from RevenueCat.
 */
export async function logOutUser(): Promise<void> {
  await Purchases.logOut();
}

/**
 * Get available subscription offerings.
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

/**
 * Purchase a subscription package.
 * Returns true if the user now has the pro entitlement.
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo: CustomerInfo }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isActive = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    return { success: isActive, customerInfo };
  } catch (error: any) {
    if (error.userCancelled) {
      return {
        success: false,
        customerInfo: await Purchases.getCustomerInfo(),
      };
    }
    throw error;
  }
}

/**
 * Check if the current user has an active pro subscription.
 */
export async function checkSubscription(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
}

/**
 * Restore previous purchases (required by App Store guidelines).
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  customerInfo: CustomerInfo;
}> {
  const customerInfo = await Purchases.restorePurchases();
  const isActive = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  return { success: isActive, customerInfo };
}

/**
 * Get current customer info.
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}
