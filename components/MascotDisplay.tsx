/**
 * MascotDisplay - Cat spirit mascot display component
 *
 * Renders a placeholder colored view with cat emoji as a mascot
 * illustration until real assets are available.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants';

interface MascotDisplayProps {
  /** Size of the mascot display in points */
  size?: number;
  /** Optional expression to display (maps to future asset states) */
  expression?: 'neutral' | 'happy' | 'sad' | 'thinking' | 'surprised' | 'encouraging';
  /** Optional style overrides for the container */
  style?: object;
}

const expressionEmojis: Record<string, string> = {
  neutral: '\uD83D\uDC31',
  happy: '\uD83D\uDE3A',
  sad: '\uD83D\uDE3F',
  thinking: '\uD83D\uDE3C',
  surprised: '\uD83D\uDE40',
  encouraging: '\uD83D\uDE38',
};

export function MascotDisplay({
  size = 120,
  expression = 'neutral',
  style,
}: MascotDisplayProps) {
  const emoji = expressionEmojis[expression] ?? expressionEmojis.neutral;
  const emojiSize = size * 0.5;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Text style={[styles.emoji, { fontSize: emojiSize }]}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  emoji: {
    textAlign: 'center',
  },
});
