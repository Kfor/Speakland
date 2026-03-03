/**
 * Onboarding Layout
 *
 * Stack navigator for the multi-screen onboarding flow.
 * Header is hidden — each screen manages its own navigation.
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="language" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="difficulty" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="painpoints" />
      <Stack.Screen name="highlights" />
      <Stack.Screen name="story-preference" />
      <Stack.Screen name="nickname" />
      <Stack.Screen name="tutorial" />
    </Stack>
  );
}
