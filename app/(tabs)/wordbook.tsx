/**
 * Word Book Tab - Vocabulary list and account section
 *
 * Shows saved words from the vocabulary store with the ability to
 * mark words as learned or remove them. Includes a login button
 * for unauthenticated users.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useAuthStore, useVocabularyStore } from '../../stores';
import type { WordEntry } from '../../types';

export default function WordBookScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const { words, markLearned, removeWord } = useVocabularyStore();

  const handleLogin = () => {
    Alert.alert('Login', 'Login functionality will be available soon.');
  };

  const handleMarkLearned = useCallback(
    (wordId: string) => {
      markLearned(wordId);
    },
    [markLearned]
  );

  const handleRemoveWord = useCallback(
    (wordId: string) => {
      Alert.alert('Remove Word', 'Remove this word from your book?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeWord(wordId),
        },
      ]);
    },
    [removeWord]
  );

  const renderWordItem = ({ item }: { item: WordEntry }) => (
    <View style={styles.wordCard}>
      <View style={styles.wordInfo}>
        <View style={styles.wordHeader}>
          <Text style={styles.word}>{item.word}</Text>
          {item.learned && (
            <View style={styles.learnedBadge}>
              <Text style={styles.learnedBadgeText}>Learned</Text>
            </View>
          )}
        </View>
        {item.translation != null && (
          <Text style={styles.translation}>{item.translation}</Text>
        )}
        {item.contextSentence != null && (
          <Text style={styles.contextSentence} numberOfLines={2}>
            {item.contextSentence}
          </Text>
        )}
      </View>
      <View style={styles.wordActions}>
        {!item.learned && (
          <TouchableOpacity
            style={styles.learnButton}
            onPress={() => handleMarkLearned(item.id)}
          >
            <Text style={styles.learnButtonText}>{'\u2713'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveWord(item.id)}
        >
          <Text style={styles.removeButtonText}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const learnedCount = words.filter((w) => w.learned).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Word Book</Text>
        {words.length > 0 && (
          <Text style={styles.headerCount}>
            {learnedCount}/{words.length} learned
          </Text>
        )}
      </View>

      {/* Login section */}
      {profile == null && (
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginIcon}>{'\uD83D\uDD12'}</Text>
          <Text style={styles.loginText}>Sign in to sync your progress</Text>
        </TouchableOpacity>
      )}

      {/* Word list */}
      <FlatList
        data={words}
        keyExtractor={(item) => item.id}
        renderItem={renderWordItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{'\uD83D\uDCD6'}</Text>
            <Text style={styles.emptyTitle}>No words saved yet</Text>
            <Text style={styles.emptySubtitle}>
              Long-press words during stories to add them!
            </Text>
          </View>
        }
        ListFooterComponent={
          words.length > 0 ? (
            <View style={styles.savedSentencesSection}>
              <Text style={styles.sectionTitle}>Saved Sentences</Text>
              <View style={styles.placeholderSection}>
                <Text style={styles.placeholderText}>
                  Sentence saving coming soon
                </Text>
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: Fonts.size['3xl'],
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerCount: {
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  loginIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  loginText: {
    fontSize: Fonts.size.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  wordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  wordInfo: {
    flex: 1,
  },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  word: {
    fontSize: Fonts.size.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  learnedBadge: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    marginLeft: Spacing.sm,
  },
  learnedBadgeText: {
    fontSize: Fonts.size.xs,
    color: Colors.textOnPrimary,
    fontWeight: 'bold',
  },
  translation: {
    fontSize: Fonts.size.md,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  contextSentence: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
    lineHeight: Fonts.size.sm * Fonts.lineHeight.normal,
  },
  wordActions: {
    flexDirection: 'row',
    marginLeft: Spacing.sm,
  },
  learnButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  learnButtonText: {
    fontSize: 16,
    color: Colors.textOnPrimary,
    fontWeight: 'bold',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontSize: Fonts.size.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Fonts.size.md * Fonts.lineHeight.relaxed,
  },
  savedSentencesSection: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  placeholderSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: Fonts.size.md,
    color: Colors.textLight,
  },
});
