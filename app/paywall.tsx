// ============================================================
// Paywall Modal Screen
// ============================================================

import React from 'react';
import { useRouter } from 'expo-router';
import { Paywall } from '@/components/Paywall';

export default function PaywallScreen() {
  const router = useRouter();

  return (
    <Paywall
      onClose={() => router.back()}
      onPurchaseComplete={() => router.back()}
    />
  );
}
