/**
 * Onboarding Tutorial Screen
 *
 * Quick tutorial showing core UI interactions.
 * Simplified for MVP — shows 3 key features then navigates to paywall.
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MascotDisplay } from '../../components';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../constants';

interface TutorialStep {
  title: string;
  description: string;
  icon: string;
  mascotExpression: 'happy' | 'thinking' | 'encouraging' | 'surprised';
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Chat with Characters',
    description:
      'Type or speak to interact with story characters. They\'ll respond naturally, and you\'ll learn vocabulary in context.',
    icon: '\uD83D\uDCAC',
    mascotExpression: 'happy',
  },
  {
    title: 'Long-Press Words',
    description:
      'Long-press any word in the conversation to see its translation, pronunciation, and save it to your word book.',
    icon: '\uD83D\uDC46',
    mascotExpression: 'thinking',
  },
  {
    title: 'Make Story Choices',
    description:
      'Your words shape the story. Build relationships with characters and unlock different story paths.',
    icon: '\uD83C\uDFAD',
    mascotExpression: 'encouraging',
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      router.push('/paywall');
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    router.push('/paywall');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <MascotDisplay size={120} expression={step.mascotExpression} />

        <View style={styles.tutorialCard}>
          <Text style={styles.stepIcon}>{step.icon}</Text>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
        </View>

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {isLastStep ? "Let's Go!" : 'Next'}
          </Text>
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
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  skipText: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  tutorialCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginTop: Spacing['2xl'],
    alignItems: 'center',
    width: '100%',
    ...Shadows.md,
  },
  stepIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  stepTitle: {
    fontSize: Fonts.size.xl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Fonts.size.base * Fonts.lineHeight.relaxed,
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
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
  nextButtonText: {
    color: Colors.textOnPrimary,
    fontSize: Fonts.size.lg,
    fontWeight: 'bold',
  },
});
