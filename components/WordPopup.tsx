/**
 * WordPopup - Long-press word popup
 *
 * Shows translation, pronunciation button, and
 * add/remove from word book actions when a word is long-pressed.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants';

interface WordPopupProps {
  /** Whether the popup is visible */
  visible: boolean;
  /** The word being inspected */
  word: string;
  /** Translation of the word */
  translation?: string;
  /** Pronunciation guide */
  pronunciation?: string;
  /** Part of speech */
  partOfSpeech?: string;
  /** Example sentence using the word */
  exampleSentence?: string;
  /** Whether the word is already in the word book */
  isInWordBook?: boolean;
  /** Callback to close the popup */
  onClose: () => void;
  /** Callback to play pronunciation audio */
  onPlayPronunciation?: () => void;
  /** Callback to add/remove from word book */
  onToggleWordBook?: () => void;
}

export function WordPopup({
  visible,
  word,
  translation,
  pronunciation,
  partOfSpeech,
  exampleSentence,
  isInWordBook = false,
  onClose,
  onPlayPronunciation,
  onToggleWordBook,
}: WordPopupProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.popup} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.word}>{word}</Text>
            {partOfSpeech != null && (
              <Text style={styles.pos}>{partOfSpeech}</Text>
            )}
          </View>

          {/* Pronunciation */}
          {pronunciation != null && (
            <View style={styles.pronunciationRow}>
              <Text style={styles.pronunciation}>/{pronunciation}/</Text>
              {onPlayPronunciation != null && (
                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={onPlayPronunciation}
                >
                  <Text style={styles.speakerIcon}>{'\uD83D\uDD0A'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Translation */}
          {translation != null && (
            <Text style={styles.translation}>{translation}</Text>
          )}

          {/* Example sentence */}
          {exampleSentence != null && (
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleLabel}>Example:</Text>
              <Text style={styles.exampleText}>{exampleSentence}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {onToggleWordBook != null && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isInWordBook && styles.actionButtonActive,
                ]}
                onPress={onToggleWordBook}
              >
                <Text
                  style={[
                    styles.actionText,
                    isInWordBook && styles.actionTextActive,
                  ]}
                >
                  {isInWordBook ? 'Remove from Word Book' : 'Add to Word Book'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  popup: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  word: {
    fontSize: Fonts.size['2xl'],
    fontWeight: 'bold',
    color: Colors.text,
  },
  pos: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    fontStyle: 'italic',
  },
  pronunciationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pronunciation: {
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
  },
  speakerButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  speakerIcon: {
    fontSize: 20,
  },
  translation: {
    fontSize: Fonts.size.lg,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  exampleContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  exampleLabel: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  exampleText: {
    fontSize: Fonts.size.md,
    color: Colors.text,
    lineHeight: Fonts.size.md * Fonts.lineHeight.relaxed,
    fontStyle: 'italic',
  },
  actions: {
    gap: Spacing.sm,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: Colors.error,
  },
  actionText: {
    color: Colors.textOnPrimary,
    fontSize: Fonts.size.md,
    fontWeight: '600',
  },
  actionTextActive: {
    color: Colors.textOnPrimary,
  },
  closeButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  closeText: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.md,
  },
});
