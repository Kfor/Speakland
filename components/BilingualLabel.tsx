/**
 * BilingualLabel - Displays text with translation annotation
 *
 * Shows the primary text with an optional smaller translation
 * annotation below or beside it, used for non-basic vocabulary
 * in the UI.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../constants';

type AnnotationPosition = 'below' | 'inline';

interface BilingualLabelProps {
  /** Primary text (target language) */
  text: string;
  /** Translation annotation */
  translation?: string;
  /** Position of the annotation */
  position?: AnnotationPosition;
  /** Font size of primary text */
  fontSize?: number;
  /** Color of primary text */
  color?: string;
  /** Whether to show the translation */
  showTranslation?: boolean;
  /** Optional style overrides */
  style?: object;
}

export function BilingualLabel({
  text,
  translation,
  position = 'below',
  fontSize = Fonts.size.base,
  color = Colors.text,
  showTranslation = true,
  style,
}: BilingualLabelProps) {
  const isInline = position === 'inline';

  return (
    <View
      style={[
        isInline ? styles.inlineContainer : styles.stackContainer,
        style,
      ]}
    >
      <Text style={[styles.primaryText, { fontSize, color }]}>{text}</Text>
      {showTranslation && translation != null && (
        <Text
          style={[
            styles.translation,
            isInline && styles.translationInline,
            { fontSize: fontSize * 0.75 },
          ]}
        >
          {isInline ? `(${translation})` : translation}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stackContainer: {
    alignItems: 'flex-start',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  primaryText: {
    fontWeight: '500',
  },
  translation: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  translationInline: {
    marginTop: 0,
    marginLeft: Spacing.xs,
  },
});
