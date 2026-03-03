/**
 * Onboarding Story Preference Screen
 *
 * User chooses their preferred story direction/genre.
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../stores';
import { MascotDisplay, OptionCard } from '../../components';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants';
import type { StoryPreference } from '../../types';

const storyOptions: Array<{
  id: StoryPreference;
  title: string;
  subtitle: string;
  icon: string;
}> = [
  {
    id: 'career_woman',
    title: 'Career & Workplace',
    subtitle: 'Office politics, ambition, and proving yourself',
    icon: '\uD83D\uDC69\u200D\uD83D\uDCBC',
  },
  {
    id: 'celebrity_romance',
    title: 'Romance & Celebrity',
    subtitle: 'Love stories and dramatic relationships',
    icon: '\uD83D\uDC95',
  },
  {
    id: 'medieval_adventure',
    title: 'Fantasy Adventure',
    subtitle: 'Epic quests in magical worlds',
    icon: '\u2694\uFE0F',
  },
  {
    id: 'mystery',
    title: 'Mystery & Thriller',
    subtitle: 'Solve puzzles and uncover secrets',
    icon: '\uD83D\uDD0D',
  },
  {
    id: 'other',
    title: 'Surprise Me!',
    subtitle: 'I\'m open to anything',
    icon: '\uD83C\uDF1F',
  },
];

export default function StoryPreferenceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, setStoryPreference } = useOnboardingStore();

  const handleSelect = (pref: StoryPreference) => {
    setStoryPreference(pref);
  };

  const handleNext = () => {
    if (data.storyPreference) {
      router.push('/onboarding/nickname');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.header}>
        <MascotDisplay size={80} expression="happy" />
        <Text style={styles.title}>What kind of story excites you?</Text>
        <Text style={styles.hint}>We'll recommend stories you'll love</Text>
      </View>

      <View style={styles.options}>
        {storyOptions.map((option) => (
          <OptionCard
            key={option.id}
            title={option.title}
            subtitle={option.subtitle}
            icon={option.icon}
            selected={data.storyPreference === option.id}
            onPress={() => handleSelect(option.id)}
          />
        ))}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <TouchableOpacity
          style={[styles.nextButton, !data.storyPreference && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!data.storyPreference}
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
