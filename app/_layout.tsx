/**
 * Root Layout
 *
 * Wraps the entire app with providers:
 * - AuthProvider (session management)
 * - SafeAreaProvider
 *
 * Checks onboarding status to determine initial route:
 * - If not onboarded -> show onboarding flow
 * - If onboarded -> show tabs
 *
 * expo-router uses this as the entry point for navigation.
 */

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../providers/AuthProvider';
import { useAuthStore } from '../stores';

// Prevent auto-hide so we can manually hide after loading
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { isOnboarded } = useAuthStore();

  useEffect(() => {
    // Wait until the navigator is mounted (segments will be populated)
    if (segments.length === 0) return;

    const inOnboarding =
      segments[0] === 'onboarding' || segments[0] === 'paywall';

    if (!isOnboarded && !inOnboarding) {
      // User hasn't completed onboarding — redirect
      router.replace('/onboarding');
    } else if (isOnboarded && inOnboarding) {
      // User is onboarded but somehow in onboarding screens — redirect to tabs
      router.replace('/(tabs)');
    }
  }, [isOnboarded, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="onboarding"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="scene/[id]"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen once layout is ready
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
