/**
 * SubtitleDisplay - Scrollable subtitle area with long-pressable words
 *
 * Renders text content where individual words can be long-pressed
 * to trigger a vocabulary popup. Supports both character and
 * narrator text styling.
 */

import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants';

type SpeakerType = 'character' | 'narrator' | 'user';

interface SubtitleDisplayProps {
  /** The text content to display */
  text: string;
  /** Optional translation below the text */
  translation?: string;
  /** Speaker type for styling */
  speaker?: SpeakerType;
  /** Speaker name to display */
  speakerName?: string;
  /** Callback when a word is long-pressed */
  onWordLongPress?: (word: string) => void;
  /** Whether to show translation */
  showTranslation?: boolean;
  /** Optional style overrides */
  style?: object;
}

export function SubtitleDisplay({
  text,
  translation,
  speaker = 'character',
  speakerName,
  onWordLongPress,
  showTranslation = true,
  style,
}: SubtitleDisplayProps) {
  const words = text.split(/(\s+)/);

  const handleWordLongPress = useCallback(
    (word: string) => {
      // Strip punctuation for lookup
      const cleanWord = word.replace(/[^a-zA-Z'-]/g, '');
      if (cleanWord.length > 0 && onWordLongPress != null) {
        onWordLongPress(cleanWord);
      }
    },
    [onWordLongPress]
  );

  const speakerStyles = speakerStyleMap[speaker];

  return (
    <View style={[styles.container, speakerStyles.container, style]}>
      {speakerName != null && (
        <Text style={[styles.speakerName, speakerStyles.speakerName]}>
          {speakerName}
        </Text>
      )}

      <View style={styles.textRow}>
        {words.map((segment, index) => {
          const isWhitespace = /^\s+$/.test(segment);
          if (isWhitespace) {
            return <Text key={index}> </Text>;
          }
          return (
            <Pressable
              key={index}
              onLongPress={() => handleWordLongPress(segment)}
              delayLongPress={400}
            >
              <Text style={[styles.word, speakerStyles.word]}>
                {segment}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {showTranslation && translation != null && (
        <Text style={styles.translation}>{translation}</Text>
      )}
    </View>
  );
}

const speakerStyleMap = {
  character: StyleSheet.create({
    container: {
      backgroundColor: Colors.surface,
      alignSelf: 'flex-start',
    },
    speakerName: {
      color: Colors.primary,
    },
    word: {
      color: Colors.text,
    },
  }),
  narrator: StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
      alignSelf: 'center',
    },
    speakerName: {
      color: Colors.textSecondary,
    },
    word: {
      color: Colors.textSecondary,
      fontStyle: 'italic',
    },
  }),
  user: StyleSheet.create({
    container: {
      backgroundColor: Colors.primaryLight,
      alignSelf: 'flex-end',
    },
    speakerName: {
      color: Colors.primaryDark,
    },
    word: {
      color: Colors.text,
    },
  }),
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    maxWidth: '85%',
  },
  speakerName: {
    fontSize: Fonts.size.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  textRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  word: {
    fontSize: Fonts.size.base,
    lineHeight: Fonts.size.base * Fonts.lineHeight.relaxed,
  },
  translation: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
});
