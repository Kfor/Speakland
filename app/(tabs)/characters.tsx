/**
 * Characters Tab - Character list screen
 *
 * Displays the mascot character first, followed by all story characters.
 * Each character card navigates to a 1-on-1 chat screen.
 */

import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '../../constants/theme';
import { CharacterCard } from '../../components';
import { allCharacters } from '../../data/stories';
import { mascot } from '../../data/characters/mascot';
import type { Character } from '../../types';

export default function CharactersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const characters = useMemo<Character[]>(() => {
    return [mascot, ...allCharacters];
  }, []);

  const handleCharacterPress = (character: Character) => {
    router.push(`/chat/${character.id}` as const);
  };

  const renderCharacterItem = ({ item }: { item: Character }) => (
    <CharacterCard
      name={item.name}
      localizedName={item.localizedName}
      personality={item.personality}
      portraitKey={item.portraits.neutral}
      onPress={() => handleCharacterPress(item)}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Characters</Text>
        <Text style={styles.headerCount}>
          {characters.length} character{characters.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={characters}
        keyExtractor={(item) => item.id}
        renderItem={renderCharacterItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
});
