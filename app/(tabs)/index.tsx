// ============================================================
// Stories Tab (Home)
// Displays story world cards with cover images and difficulty
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';

// Placeholder story data for skeleton
const PLACEHOLDER_STORIES = [
  {
    id: '1',
    title: 'Fashion Intern in Paris',
    description: 'Start your career at a top fashion house in Paris. Navigate office politics, make friends, and learn the language of style.',
    genre: 'workplace',
    difficulty: 'beginner',
    isFree: true,
  },
  {
    id: '2',
    title: 'Summer Beach House',
    description: 'A summer getaway turns into an unforgettable adventure. Meet new people and create lasting memories.',
    genre: 'romance',
    difficulty: 'elementary',
    isFree: true,
  },
  {
    id: '3',
    title: 'Wasteland Survivor',
    description: 'Survive in a post-apocalyptic world. Form alliances, find resources, and uncover the truth.',
    genre: 'adventure',
    difficulty: 'intermediate',
    isFree: false,
  },
];

export default function StoriesScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <TextInput
            placeholder="Search stories..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {/* Section: Recommended */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recommended for You
        </Text>

        {/* Story Cards */}
        {PLACEHOLDER_STORIES.map((story) => (
          <TouchableOpacity key={story.id} activeOpacity={0.7}>
            <Card style={styles.storyCard}>
              {/* Cover image placeholder */}
              <View
                style={[
                  styles.coverPlaceholder,
                  { backgroundColor: colors.backgroundTertiary },
                ]}
              >
                <Text style={[styles.coverText, { color: colors.textMuted }]}>
                  {story.genre.toUpperCase()}
                </Text>
              </View>

              <View style={styles.storyInfo}>
                <View style={styles.storyHeader}>
                  <Text style={[styles.storyTitle, { color: colors.text }]}>
                    {story.title}
                  </Text>
                  {story.isFree && (
                    <View style={[styles.freeBadge, { backgroundColor: colors.success }]}>
                      <Text style={styles.freeBadgeText}>FREE</Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[styles.storyDescription, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {story.description}
                </Text>

                <View style={styles.storyMeta}>
                  <View style={[styles.difficultyBadge, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.difficultyText, { color: colors.primary }]}>
                      {story.difficulty}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  searchBar: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchInput: {
    fontSize: FontSize.md,
  },
  sectionTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  storyCard: {
    padding: 0,
    overflow: 'hidden',
  },
  coverPlaceholder: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    letterSpacing: 2,
  },
  storyInfo: {
    padding: Spacing.lg,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  storyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  freeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  freeBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  storyDescription: {
    fontSize: FontSize.md,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  storyMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: 'capitalize',
  },
});
