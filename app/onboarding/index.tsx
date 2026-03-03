/**
 * Onboarding Welcome Screen
 *
 * First screen showing mascot and a "Start" button.
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MascotDisplay } from '../../components';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants';

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleStart = () => {
    router.push('/onboarding/language');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <View style={styles.content}>
        <MascotDisplay size={160} expression="happy" />
        <Text style={styles.title}>Welcome to Speakland!</Text>
        <Text style={styles.subtitle}>
          Learn languages through immersive RPG stories.{'\n'}
          Chat with characters, explore worlds, and master new words naturally.
        </Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Get Started</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  title: {
    fontSize: Fonts.size['3xl'],
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing['2xl'],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: Fonts.size.base * Fonts.lineHeight.relaxed,
  },
  bottom: {
    paddingHorizontal: Spacing['2xl'],
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  startButtonText: {
    color: Colors.textOnPrimary,
    fontSize: Fonts.size.lg,
    fontWeight: 'bold',
  },
});
