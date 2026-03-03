/**
 * Paywall Screen
 *
 * Shows subscription tiers with pricing. Uses RevenueCat for
 * real purchase flow, falls back to mock data on web or failure.
 * Marks onboarding as complete on purchase or dismissal.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores';
import { MascotDisplay } from '../components';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubscriptionTier {
  id: string;
  title: string;
  price: string;
  period: string;
  description: string;
  popular?: boolean;
  savings?: string;
}

// ---------------------------------------------------------------------------
// Mock data (used when RevenueCat is unavailable)
// ---------------------------------------------------------------------------

const mockTiers: SubscriptionTier[] = [
  {
    id: 'weekly',
    title: 'Weekly',
    price: '$4.99',
    period: '/week',
    description: 'Try it out for a week',
  },
  {
    id: 'monthly',
    title: 'Monthly',
    price: '$12.99',
    period: '/month',
    description: 'Full access to all stories',
    popular: true,
    savings: 'Save 35%',
  },
  {
    id: 'yearly',
    title: 'Annual',
    price: '$79.99',
    period: '/year',
    description: 'Best value for serious learners',
    savings: 'Save 70%',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setOnboarded } = useAuthStore();

  const [tiers, setTiers] = useState<SubscriptionTier[]>(mockTiers);
  const [selectedTier, setSelectedTier] = useState<string>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Try to load real offerings from RevenueCat
  useEffect(() => {
    const loadOfferings = async () => {
      if (Platform.OS === 'web') return;
      setIsLoading(true);
      try {
        const mod = await import('react-native-purchases');
        const Purchases = mod.default;
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.availablePackages.length > 0) {
          const packages = offerings.current.availablePackages.map((pkg) => ({
            id: pkg.identifier,
            title: pkg.product.title,
            price: pkg.product.priceString,
            period: '',
            description: pkg.product.description,
          }));
          setTiers(packages);
          if (packages.length > 0) {
            setSelectedTier(packages[0].id);
          }
        }
      } catch {
        // Fall back to mock data — already set as default
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[Paywall] Using mock data (RevenueCat unavailable)');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadOfferings();
  }, []);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      if (Platform.OS !== 'web') {
        const mod = await import('react-native-purchases');
        const Purchases = mod.default;
        const offerings = await Purchases.getOfferings();
        const pkg = offerings.current?.availablePackages.find(
          (p) => p.identifier === selectedTier
        );
        if (pkg) {
          await Purchases.purchasePackage(pkg);
        }
      }
    } catch {
      // Purchase failed or cancelled — continue anyway for MVP
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[Paywall] Purchase flow ended (cancelled or error)');
      }
    } finally {
      setIsPurchasing(false);
      completeOnboarding();
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      if (Platform.OS !== 'web') {
        const mod = await import('react-native-purchases');
        const Purchases = mod.default;
        await Purchases.restorePurchases();
      }
    } catch {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[Paywall] Restore failed');
      }
    } finally {
      setIsLoading(false);
      completeOnboarding();
    }
  };

  const handleFreeTrial = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    setOnboarded(true);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleFreeTrial}>
        <Text style={styles.closeText}>{'\u2715'}</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <MascotDisplay size={100} expression="happy" />
          <Text style={styles.title}>Unlock Full Access</Text>
          <Text style={styles.subtitle}>
            Unlimited stories, AI conversations, and vocabulary tracking
          </Text>
        </View>

        {/* Features list */}
        <View style={styles.features}>
          {[
            'Unlimited story chapters',
            'AI-powered conversations',
            'Personalized vocabulary book',
            'Voice practice mode',
            'No ads, ever',
          ].map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Text style={styles.featureCheck}>{'\u2713'}</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Subscription tiers */}
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={styles.loader}
          />
        ) : (
          <View style={styles.tiersContainer}>
            {tiers.map((tier) => (
              <TouchableOpacity
                key={tier.id}
                style={[
                  styles.tierCard,
                  selectedTier === tier.id && styles.tierCardSelected,
                  tier.popular === true && styles.tierCardPopular,
                ]}
                onPress={() => setSelectedTier(tier.id)}
              >
                {tier.popular === true && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                <Text style={styles.tierTitle}>{tier.title}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.tierPrice}>{tier.price}</Text>
                  {tier.period.length > 0 && (
                    <Text style={styles.tierPeriod}>{tier.period}</Text>
                  )}
                </View>
                {tier.savings != null && (
                  <Text style={styles.tierSavings}>{tier.savings}</Text>
                )}
                <Text style={styles.tierDescription}>{tier.description}</Text>

                {/* Selection indicator */}
                <View
                  style={[
                    styles.radio,
                    selectedTier === tier.id && styles.radioSelected,
                  ]}
                >
                  {selectedTier === tier.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom buttons */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.base }]}>
        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={handlePurchase}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color={Colors.textOnPrimary} />
          ) : (
            <Text style={styles.purchaseText}>Subscribe Now</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.freeTrialButton} onPress={handleFreeTrial}>
          <Text style={styles.freeTrialText}>Continue with Free Trial</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.base,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.base,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: Fonts.size['2xl'],
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.base,
  },
  subtitle: {
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  features: {
    marginBottom: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureCheck: {
    fontSize: Fonts.size.base,
    color: Colors.accent,
    fontWeight: 'bold',
    marginRight: Spacing.sm,
    width: 20,
  },
  featureText: {
    fontSize: Fonts.size.md,
    color: Colors.text,
  },
  loader: {
    marginVertical: Spacing['2xl'],
  },
  tiersContainer: {
    gap: Spacing.md,
  },
  tierCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.base,
    position: 'relative',
    ...Shadows.sm,
  },
  tierCardSelected: {
    borderColor: Colors.primary,
  },
  tierCardPopular: {
    borderColor: Colors.secondary,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.base,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  popularText: {
    fontSize: Fonts.size.xs,
    color: Colors.textOnPrimary,
    fontWeight: 'bold',
  },
  tierTitle: {
    fontSize: Fonts.size.base,
    fontWeight: '600',
    color: Colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.xs,
  },
  tierPrice: {
    fontSize: Fonts.size.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  tierPeriod: {
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  tierSavings: {
    fontSize: Fonts.size.sm,
    color: Colors.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  tierDescription: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  radio: {
    position: 'absolute',
    top: Spacing.base,
    right: Spacing.base,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  bottom: {
    paddingHorizontal: Spacing['2xl'],
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
  },
  purchaseButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  purchaseText: {
    color: Colors.textOnPrimary,
    fontSize: Fonts.size.lg,
    fontWeight: 'bold',
  },
  freeTrialButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  freeTrialText: {
    color: Colors.primary,
    fontSize: Fonts.size.base,
    fontWeight: '600',
  },
  restoreButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  restoreText: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.sm,
  },
});
