/**
 * Onboarding Goals Screen
 *
 * User selects learning goals (multi-select).
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../stores';
import { MascotDisplay, OptionCard } from '../../components';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants';
import type { LearningGoal } from '../../types';

const goalOptions: Array<{ id: LearningGoal; title: string; subtitle: string; icon: string }> = [
  { id: 'business', title: 'Business & Career', subtitle: 'Workplace communication', icon: '\uD83D\uDCBC' },
  { id: 'exam', title: 'Exam Preparation', subtitle: 'Tests and certifications', icon: '\uD83D\uDCDD' },
  { id: 'communication', title: 'Daily Communication', subtitle: 'Everyday conversations', icon: '\uD83D\uDCAC' },
  { id: 'travel', title: 'Travel', subtitle: 'Navigate foreign countries', icon: '\u2708\uFE0F' },
  { id: 'entertainment', title: 'Entertainment', subtitle: 'Movies, music, and culture', icon: '\uD83C\uDFAC' },
];

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, setLearningGoals } = useOnboardingStore();
  const [selected, setSelected] = useState<LearningGoal[]>(data.learningGoals ?? []);

  const handleToggle = (goal: LearningGoal) => {
    setSelected((prev) => {
      const next = prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal];
      setLearningGoals(next);
      return next;
    });
  };

  const handleNext = () => {
    if (selected.length > 0) {
      router.push('/onboarding/difficulty');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.header}>
        <MascotDisplay size={80} expression="encouraging" />
        <Text style={styles.title}>What are your learning goals?</Text>
        <Text style={styles.hint}>Select all that apply</Text>
      </View>

      <View style={styles.options}>
        {goalOptions.map((option) => (
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
