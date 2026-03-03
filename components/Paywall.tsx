// ============================================================
// Paywall Component
// Displays subscription offerings and handles purchase flow
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface PaywallProps {
  onClose?: () => void;
  onPurchaseComplete?: () => void;
}

export function Paywall({ onClose, onPurchaseComplete }: PaywallProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { offerings, purchase, restore, loadOfferings, isPremium } = useSubscription();
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  // Auto-select the first package
  useEffect(() => {
    if (offerings?.availablePackages?.length && !selectedPkg) {
      setSelectedPkg(offerings.availablePackages[0]);
    }
  }, [offerings, selectedPkg]);

  const handlePurchase = async () => {
    if (!selectedPkg) return;
    setPurchasing(true);
    try {
      const success = await purchase(selectedPkg);
      if (success) {
        onPurchaseComplete?.();
      }
    } catch (error: any) {
      Alert.alert('Purchase Failed', error.message || 'An unexpected error occurred.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const success = await restore();
      if (success) {
        Alert.alert('Restored', 'Your subscription has been restored.');
        onPurchaseComplete?.();
      } else {
        Alert.alert('No Subscription Found', 'We could not find any previous purchases to restore.');
      }
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'An unexpected error occurred.');
    } finally {
      setRestoring(false);
    }
  };

  if (isPremium) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          You are a Premium member!
        </Text>
        <Button title="Continue" onPress={() => onClose?.()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Unlock Full Experience
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Get unlimited access to all stories, characters, and AI conversations
        </Text>
      </View>

      {/* Feature List */}
      <View style={styles.features}>
        {[
          'Unlimited story chapters',
          'All character conversations',
          'Advanced vocabulary tracking',
          'Personalized learning feedback',
        ].map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={[styles.featureCheck, { color: colors.success }]}>
              {'✓'}
            </Text>
            <Text style={[styles.featureText, { color: colors.text }]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {/* Package Options */}
      {!offerings?.availablePackages?.length ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : (
        <View style={styles.packages}>
          {offerings.availablePackages.map((pkg) => {
            const isSelected = selectedPkg?.identifier === pkg.identifier;
            return (
              <TouchableOpacity
                key={pkg.identifier}
                onPress={() => setSelectedPkg(pkg)}
                activeOpacity={0.7}
              >
                <Card
                  variant={isSelected ? 'elevated' : 'outlined'}
                  style={[
                    styles.packageCard,
                    isSelected && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                >
                  <Text style={[styles.packageTitle, { color: colors.text }]}>
                    {pkg.product.title}
                  </Text>
                  <Text style={[styles.packagePrice, { color: colors.primary }]}>
                    {pkg.product.priceString}
                  </Text>
                  <Text style={[styles.packageDesc, { color: colors.textSecondary }]}>
                    {pkg.product.description}
                  </Text>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Subscribe Now"
          onPress={handlePurchase}
          loading={purchasing}
          disabled={!selectedPkg}
          size="lg"
        />
        <Button
          title="Restore Purchases"
          onPress={handleRestore}
          loading={restoring}
          variant="ghost"
          size="sm"
          textStyle={{ fontSize: FontSize.sm }}
        />
        {onClose && (
          <Button
            title="Not Now"
            onPress={onClose}
            variant="ghost"
            size="sm"
            textStyle={{ fontSize: FontSize.sm }}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.lg,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    marginBottom: Spacing.xxl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featureCheck: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginRight: Spacing.md,
  },
  featureText: {
    fontSize: FontSize.lg,
  },
  loading: {
    marginVertical: Spacing.xxl,
  },
  packages: {
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  packageCard: {
    alignItems: 'center',
  },
  packageTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  packagePrice: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  packageDesc: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.md,
    alignItems: 'center',
  },
});
