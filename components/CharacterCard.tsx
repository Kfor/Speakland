/**
 * CharacterCard - Character card for character list
 *
 * Displays character portrait placeholder, name, and
 * personality snippet.
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants';

interface CharacterCardProps {
  /** Character name */
  name: string;
  /** Localized or display name */
  localizedName?: string;
  /** Personality snippet */
  personality: string;
  /** Portrait placeholder identifier */
  portraitKey?: string;
  /** Relationship value (0-100) */
  relationship?: number;
  /** Callback when the card is pressed */
  onPress?: () => void;
}

export function CharacterCard({
  name,
  localizedName,
  personality,
  relationship,
  onPress,
}: CharacterCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={onPress == null}
    >
      {/* Portrait placeholder */}
      <View style={styles.portrait}>
        <Text style={styles.portraitEmoji}>{'\uD83E\uDDD1'}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        {localizedName != null && localizedName !== name && (
          <Text style={styles.localizedName}>{localizedName}</Text>
        )}
        <Text style={styles.personality} numberOfLines={2}>
          {personality}
        </Text>
      </View>

      {/* Relationship indicator */}
      {relationship != null && (
        <View style={styles.relationshipContainer}>
          <Text style={styles.relationshipIcon}>{'\u2764\uFE0F'}</Text>
          <Text style={styles.relationshipValue}>{relationship}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  portrait: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  portraitEmoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: Fonts.size.base,
    fontWeight: 'bold',
    color: Colors.text,
  },
  localizedName: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  personality: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: Fonts.size.sm * Fonts.lineHeight.normal,
  },
  relationshipContainer: {
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  relationshipIcon: {
    fontSize: 16,
  },
  relationshipValue: {
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
