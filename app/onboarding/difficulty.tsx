/**
 * Onboarding Difficulty Screen
 *
 * User self-assesses their current proficiency level.
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../stores';
import { MascotDisplay, OptionCard } from '../../components';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants';
import type { DifficultyLevel } from '../../types';

const difficultyOptions: Array<{
  id: DifficultyLevel;
  title: string;
  subtitle: string;
  icon: string;
}> = [
  {
    id: 'beginner',
    title: 'Beginner',
    subtitle: 'I know almost nothing',
    icon: '\uD83C\uDF31',
  },
  {
    id: 'elementary',
    title: 'Elementary',
    subtitle: 'I know basic words and phrases',
    icon: '\uD83C\uDF3F',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    subtitle: 'I can have simple conversations',
    icon: '\uD83C\uDF33',
  },
  {
    id: 'upper_intermediate',
    title: 'Upper Intermediate',
    subtitle: 'I can discuss most topics',
    icon: '\uD83C\uDF32',
  },
];

export default function DifficultyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, setDifficultyLevel } = useOnboardingStore();

  const handleSelect = (level: DifficultyLevel) => {
    setDifficultyLevel(level);
  };

  const handleNext = () => {
    if (data.difficultyLevel) {
      router.push('/onboarding/preferences');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.header}>
        <MascotDisplay size={80} expression="thinking" />
        <Text style={styles.title}>What's your current level?</Text>
        <Text style={styles.hint}>We'll match you with the right stories</Text>
      </View>

      <View style={styles.options}>
        {difficultyOptions.map((option) => (
          <OptionCard
            key={option.id}
            title={option.title}
            subtitle={option.subtitle}
            icon={option.icon}
            selected={data.difficultyLevel === option.id}
            onPress={() => handleSelect(option.id)}
          />
        ))}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <TouchableOpacity
          style={[styles.nextButton, !data.difficultyLevel && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!data.difficultyLevel}
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
