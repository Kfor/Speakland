/**
 * Home Tab - Stories listing screen
 *
 * Displays a search bar, "Recommended for You" horizontal scroll,
 * and "All Worlds" vertical list. Each StoryCard navigates to the
 * scene screen for that story.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { StoryCard } from '../../components';
import { allStories } from '../../data/stories';
import type { Story } from '../../types';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStories = useMemo(() => {
    if (searchQuery.trim().length === 0) return allStories;
    const q = searchQuery.toLowerCase();
    return allStories.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Recommended stories: show easiest-first as recommendations
  const recommendedStories = useMemo(() => {
    return [...allStories].sort((a, b) => a.difficulty - b.difficulty);
  }, []);

  const handleStoryPress = (story: Story) => {
    router.push(`/scene/${story.id}` as const);
  };

  const renderStoryItem = ({ item }: { item: Story }) => (
    <StoryCard
      title={item.title}
      description={item.description}
      difficulty={item.difficulty}
      tags={item.tags}
      estimatedMinutes={item.estimatedMinutes}
      onPress={() => handleStoryPress(item)}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stories</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>{'\uD83D\uDD0D'}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stories..."
          placeholderTextColor={Colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={filteredStories}
        keyExtractor={(item) => item.id}
        renderItem={renderStoryItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          searchQuery.trim().length === 0 ? (
            <View>
              {/* Recommended section */}
              <Text style={styles.sectionTitle}>Recommended for You</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {recommendedStories.map((story) => (
                  <View key={story.id} style={styles.horizontalCard}>
                    <StoryCard
                      title={story.title}
                      description={story.description}
                      difficulty={story.difficulty}
                      tags={story.tags}
                      estimatedMinutes={story.estimatedMinutes}
                      onPress={() => handleStoryPress(story)}
                    />
                  </View>
                ))}
              </ScrollView>

              {/* All Worlds header */}
              <Text style={styles.sectionTitle}>All Worlds</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{'\uD83D\uDD0D'}</Text>
            <Text style={styles.emptyText}>
              No stories found for &quot;{searchQuery}&quot;
            </Text>
          </View>
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
  },
  headerTitle: {
    fontSize: Fonts.size['3xl'],
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Fonts.size.base,
    color: Colors.text,
    height: 44,
  },
  sectionTitle: {
    fontSize: Fonts.size.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  horizontalScroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  horizontalCard: {
    width: 280,
    marginRight: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.base,
  },
  emptyText: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
