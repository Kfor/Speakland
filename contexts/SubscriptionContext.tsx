// ============================================================
// Subscription Context & Provider
// Manages RevenueCat subscription state
// ============================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  checkSubscription,
  getOfferings,
  purchasePackage,
  restorePurchases,
} from '@/lib/revenuecat';
import { useAuth } from './AuthContext';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

interface SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  offerings: PurchasesOffering | null;
}

interface SubscriptionContextValue extends SubscriptionState {
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  loadOfferings: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isPremium: false,
    isLoading: true,
    offerings: null,
  });

  // Check subscription status when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshStatus();
    } else {
      setState({ isPremium: false, isLoading: false, offerings: null });
    }
  }, [isAuthenticated]);

  const refreshStatus = useCallback(async () => {
    try {
      const isPremium = await checkSubscription();
      setState((prev) => ({ ...prev, isPremium, isLoading: false }));
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const loadOfferings = useCallback(async () => {
    try {
      const offerings = await getOfferings();
      setState((prev) => ({ ...prev, offerings }));
    } catch (error) {
      console.warn('[Subscription] Failed to load offerings:', error);
    }
  }, []);

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const { success } = await purchasePackage(pkg);
      if (success) {
        setState((prev) => ({ ...prev, isPremium: true }));
      }
      return success;
    } catch (error) {
      console.error('[Subscription] Purchase failed:', error);
      return false;
    }
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const { success } = await restorePurchases();
      if (success) {
        setState((prev) => ({ ...prev, isPremium: true }));
      }
      return success;
    } catch (error) {
      console.error('[Subscription] Restore failed:', error);
      return false;
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        purchase,
        restore,
        refreshStatus,
        loadOfferings,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
