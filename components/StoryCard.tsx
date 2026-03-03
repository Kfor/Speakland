/**
 * StoryCard - World/story card with cover image placeholder
 *
 * Displays story information including difficulty badge,
 * title, and description for the stories listing screen.
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants';

interface StoryCardProps {
  /** Story title */
  title: string;
  /** Story description */
  description: string;
  /** Difficulty level 1-5 */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Background image placeholder identifier */
  backgroundImage?: string;
  /** Tags for the story */
  tags?: string[];
  /** Estimated play time in minutes */
  estimatedMinutes?: number;
  /** Callback when the card is pressed */
  onPress?: () => void;
}

const difficultyLabels: Record<number, string> = {
  1: 'Beginner',
  2: 'Elementary',
  3: 'Intermediate',
  4: 'Upper Int.',
  5: 'Advanced',
};

const difficultyColors: Record<number, string> = {
  1: Colors.accent,
  2: Colors.accentDark,
  3: Colors.secondary,
  4: Colors.secondaryDark,
  5: Colors.error,
};

export function StoryCard({
  title,
  description,
  difficulty,
  tags,
  estimatedMinutes,
  onPress,
}: StoryCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={onPress == null}
    >
      {/* Cover image placeholder */}
      <View style={styles.coverPlaceholder}>
        <Text style={styles.coverEmoji}>
          {difficulty <= 2 ? '\uD83C\uDFAD' : '\u2694\uFE0F'}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Difficulty badge */}
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: difficultyColors[difficulty] ?? Colors.accent },
          ]}
        >
          <Text style={styles.difficultyText}>
            {difficultyLabels[difficulty] ?? `Lv.${difficulty}`}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        {/* Footer row */}
        <View style={styles.footer}>
          {tags != null && tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          {estimatedMinutes != null && (
            <Text style={styles.duration}>{estimatedMinutes} min</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    ...Shadows.md,
  },
  coverPlaceholder: {
    height: 140,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverEmoji: {
    fontSize: 48,
  },
  content: {
    padding: Spacing.base,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  difficultyText: {
    color: Colors.textOnPrimary,
    fontSize: Fonts.size.xs,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: Fonts.size.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
    lineHeight: Fonts.size.md * Fonts.lineHeight.normal,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  tag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  tagText: {
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
  },
  duration: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
});
