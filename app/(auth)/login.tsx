// ============================================================
// Login Screen
// Google Sign-In + Apple Sign-In
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight, Spacing } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function LoginScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const router = useRouter();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading('google');
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Could not sign in with Google.');
    } finally {
      setLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading('apple');
    try {
      await signInWithApple();
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        Alert.alert('Sign In Failed', error.message || 'Could not sign in with Apple.');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Logo / Mascot area */}
        <View style={styles.logoArea}>
          <Text style={[styles.appName, { color: colors.primary }]}>Speakland</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Learn languages through immersive stories
          </Text>
        </View>

        {/* Sign-in buttons */}
        <View style={styles.buttons}>
          <Button
            title="Continue with Google"
            onPress={handleGoogleSignIn}
            loading={loading === 'google'}
            disabled={loading !== null}
            variant="outline"
            size="lg"
            style={styles.signInButton}
          />

          {Platform.OS === 'ios' && (
            <Button
              title="Continue with Apple"
              onPress={handleAppleSignIn}
              loading={loading === 'apple'}
              disabled={loading !== null}
              size="lg"
              style={[
                styles.signInButton,
                {
                  backgroundColor: scheme === 'dark' ? '#FFFFFF' : '#000000',
                },
              ]}
              textStyle={{
                color: scheme === 'dark' ? '#000000' : '#FFFFFF',
              }}
            />
          )}

          <Button
            title="Skip for now"
            onPress={handleSkip}
            variant="ghost"
            size="md"
          />
        </View>

        {/* Footer */}
        <Text style={[styles.terms, { color: colors.textMuted }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  appName: {
    fontSize: 42,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: FontSize.lg,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttons: {
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  signInButton: {
    width: '100%',
  },
  terms: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
});
