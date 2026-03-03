/**
 * OptionCard - Selectable option card for onboarding questionnaire
 *
 * Supports single-select and multi-select usage with visual
 * selected state feedback.
 */

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants';

interface OptionCardProps {
  /** Primary display text */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Whether this option is currently selected */
  selected: boolean;
  /** Callback when the option is pressed */
  onPress: () => void;
  /** Optional icon or emoji to display on the left */
  icon?: string;
  /** Whether the card is disabled */
  disabled?: boolean;
}

export function OptionCard({
  title,
  subtitle,
  selected,
  onPress,
  icon,
  disabled = false,
}: OptionCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.containerSelected,
        disabled && styles.containerDisabled,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {icon != null && (
        <Text style={styles.icon}>{icon}</Text>
      )}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            selected && styles.titleSelected,
          ]}
        >
          {title}
        </Text>
        {subtitle != null && (
          <Text
            style={[
              styles.subtitle,
              selected && styles.subtitleSelected,
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.checkbox,
          selected && styles.checkboxSelected,
        ]}
      >
        {selected && <Text style={styles.checkmark}>{'\u2713'}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  containerSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EBF2FA',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: Fonts.size['2xl'],
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Fonts.size.base,
    fontWeight: '600',
    color: Colors.text,
  },
  titleSelected: {
    color: Colors.primaryDark,
  },
  subtitle: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  subtitleSelected: {
    color: Colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  checkboxSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkmark: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
