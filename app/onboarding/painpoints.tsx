/**
 * Onboarding Pain Points Screen
 *
 * User selects their learning pain points (multi-select).
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../stores';
import { MascotDisplay, OptionCard } from '../../components';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants';
import type { LearningPain } from '../../types';

const painOptions: Array<{ id: LearningPain; title: string; subtitle: string; icon: string }> = [
  {
    id: 'cant_remember_words',
    title: "Can't Remember Words",
    subtitle: 'New vocabulary fades quickly',
    icon: '\uD83E\uDDE0',
  },
  {
    id: 'boring',
    title: 'Traditional Learning is Boring',
    subtitle: 'Textbooks and drills feel dull',
    icon: '\uD83D\uDE34',
  },
  {
    id: 'cant_persist',
    title: "Can't Stay Consistent",
    subtitle: 'Hard to keep a daily habit',
    icon: '\uD83D\uDCC9',
  },
  {
    id: 'no_practice_partner',
    title: 'No Practice Partner',
    subtitle: 'Nobody to talk to in the target language',
    icon: '\uD83E\uDDD1\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1',
  },
  {
    id: 'poor_pronunciation',
    title: 'Poor Pronunciation',
    subtitle: 'Not confident speaking out loud',
    icon: '\uD83D\uDDE3\uFE0F',
  },
];

export default function PainPointsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, setLearningPains } = useOnboardingStore();
  const [selected, setSelected] = useState<LearningPain[]>(data.learningPains ?? []);

  const handleToggle = (pain: LearningPain) => {
    setSelected((prev) => {
      const next = prev.includes(pain)
        ? prev.filter((p) => p !== pain)
        : [...prev, pain];
      setLearningPains(next);
      return next;
    });
  };

  const handleNext = () => {
    if (selected.length > 0) {
      router.push('/onboarding/highlights');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.header}>
        <MascotDisplay size={80} expression="sad" />
        <Text style={styles.title}>What makes learning hard for you?</Text>
        <Text style={styles.hint}>Select all that apply</Text>
      </View>

      <View style={styles.options}>
        {painOptions.map((option) => (
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
