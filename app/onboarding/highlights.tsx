/**
 * Onboarding Highlights Screen
 *
 * Shows dynamic feature highlight cards based on the pain points
 * the user selected in the previous screen.
 */

import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../stores';
import { MascotDisplay } from '../../components';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../constants';
import type { LearningPain } from '../../types';

interface HighlightCard {
  painPoint: LearningPain;
  title: string;
  description: string;
  icon: string;
}

const highlightCards: HighlightCard[] = [
  {
    painPoint: 'cant_remember_words',
    title: 'Smart Word Review',
    description:
      'NPCs send you daily review words in context. Meet vocabulary naturally inside story conversations, not flashcard drills.',
    icon: '\uD83D\uDCEC',
  },
  {
    painPoint: 'boring',
    title: 'Immersive Storylines',
    description:
      'Engaging RPG stories with deep characters and real consequences. You\'re not studying — you\'re living another life.',
    icon: '\uD83C\uDFAD',
  },
  {
    painPoint: 'cant_persist',
    title: 'Bite-Sized Sessions',
    description:
      'Short daily sessions with story progression. Each chapter takes just 5-10 minutes but leaves you wanting more.',
    icon: '\u23F0',
  },
  {
    painPoint: 'no_practice_partner',
    title: 'AI Conversation Partners',
    description:
      'Chat with unique characters who respond naturally. Practice real conversations without the anxiety of talking to a real person.',
    icon: '\uD83E\uDD16',
  },
  {
    painPoint: 'poor_pronunciation',
    title: 'Voice Practice',
    description:
      'Use voice input to practice speaking. Characters respond to what you say, giving you real conversation practice.',
    icon: '\uD83C\uDF99\uFE0F',
  },
];

export default function HighlightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data } = useOnboardingStore();
  const selectedPains = data.learningPains ?? [];

  // Show highlights relevant to selected pain points, plus a default one
  const relevantHighlights = highlightCards.filter((card) =>
    selectedPains.includes(card.painPoint)
  );

  // Always show at least the immersive storyline card
  const displayCards =
    relevantHighlights.length > 0
      ? relevantHighlights
      : highlightCards.filter((c) => c.painPoint === 'boring');

  const handleNext = () => {
    router.push('/onboarding/story-preference');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.header}>
        <MascotDisplay size={80} expression="happy" />
        <Text style={styles.title}>We've got you covered!</Text>
        <Text style={styles.subtitle}>Here's how Speakland solves your challenges</Text>
      </View>

      <ScrollView
        style={styles.cardList}
        contentContainerStyle={styles.cardListContent}
        showsVerticalScrollIndicator={false}
      >
        {displayCards.map((card) => (
          <View key={card.painPoint} style={styles.card}>
            <Text style={styles.cardIcon}>{card.icon}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Continue</Text>
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
  subtitle: {
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  cardList: {
    flex: 1,
  },
  cardListContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.base,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Fonts.size.base,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
    lineHeight: Fonts.size.md * Fonts.lineHeight.normal,
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
