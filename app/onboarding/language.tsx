/**
 * Onboarding Language Selection Screen
 *
 * User selects their target language (English or Spanish).
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../stores';
import { MascotDisplay, OptionCard } from '../../components';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants';
import type { LearningLanguage } from '../../types';

const languageOptions: Array<{ id: LearningLanguage; title: string; icon: string }> = [
  { id: 'en', title: 'English', icon: '\uD83C\uDDEC\uD83C\uDDE7' },
  { id: 'es', title: 'Spanish', icon: '\uD83C\uDDEA\uD83C\uDDF8' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, setTargetLanguage } = useOnboardingStore();

  const handleSelect = (lang: LearningLanguage) => {
    setTargetLanguage(lang);
  };

  const handleNext = () => {
    if (data.targetLanguage) {
      router.push('/onboarding/goals');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      {/* Header with mascot */}
      <View style={styles.header}>
        <MascotDisplay size={80} expression="thinking" />
        <Text style={styles.title}>What language do you want to learn?</Text>
      </View>

      {/* Options */}
      <View style={styles.options}>
        {languageOptions.map((option) => (
          <OptionCard
            key={option.id}
            title={option.title}
            icon={option.icon}
            selected={data.targetLanguage === option.id}
            onPress={() => handleSelect(option.id)}
          />
        ))}
      </View>

      {/* Next button */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <TouchableOpacity
          style={[styles.nextButton, !data.targetLanguage && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!data.targetLanguage}
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
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: Fonts.size.xl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.base,
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
