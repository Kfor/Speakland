/**
 * Onboarding Preferences Screen
 *
 * User selects learning type preferences (speaking/vocabulary/listening).
 * Uses the learningTypes field on OnboardingData.
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../stores';
import { MascotDisplay, OptionCard } from '../../components';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants';

const preferenceOptions: Array<{ id: string; title: string; subtitle: string; icon: string }> = [
  {
    id: 'speaking',
    title: 'Speaking',
    subtitle: 'Practice conversations and pronunciation',
    icon: '\uD83D\uDDE3\uFE0F',
  },
  {
    id: 'vocabulary',
    title: 'Vocabulary',
    subtitle: 'Learn new words and expressions',
    icon: '\uD83D\uDCDA',
  },
  {
    id: 'listening',
    title: 'Listening',
    subtitle: 'Understand native speakers better',
    icon: '\uD83C\uDFA7',
  },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>(data.learningTypes ?? []);

  const handleToggle = (pref: string) => {
    setSelected((prev) => {
      const next = prev.includes(pref)
        ? prev.filter((p) => p !== pref)
        : [...prev, pref];
      // Store learning types directly on the data object via the store's set mechanism
      useOnboardingStore.setState((state) => ({
        data: { ...state.data, learningTypes: next },
      }));
      return next;
    });
  };

  const handleNext = () => {
    if (selected.length > 0) {
      router.push('/onboarding/painpoints');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.header}>
        <MascotDisplay size={80} expression="encouraging" />
        <Text style={styles.title}>What do you want to focus on?</Text>
        <Text style={styles.hint}>Select all that apply</Text>
      </View>

      <View style={styles.options}>
        {preferenceOptions.map((option) => (
          <OptionCard
            key={option.id}
            title={option.title}
            subtitle={option.subtitle}
            icon={option.icon}
            selected={selected.includes(option.id)}
            onPress={() => handleToggle(option.id)}
          />
        ))}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <TouchableOpacity
          style={[styles.nextButton, selected.length === 0 && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={selected.length === 0}
        >
          <Text style={styles.nextButtonText}>Next</Text>
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
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: Fonts.size.xl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.base,
  },
  hint: {
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  options: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
  },
  bottom: {
    paddingHorizontal: Spacing['2xl'],
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  nextButtonText: {
    color: Colors.textOnPrimary,
    fontSize: Fonts.size.lg,
    fontWeight: 'bold',
  },
});
