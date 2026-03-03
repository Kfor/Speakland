// ============================================================
// Characters Tab
// Displays unlocked NPC characters for one-on-one conversation
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';

// Placeholder character data
const PLACEHOLDER_CHARACTERS = [
  {
    id: 'mascot',
    name: 'Miko',
    bio: 'Your friendly learning companion. Always ready to help you practice!',
    isMascot: true,
    traits: ['friendly', 'patient', 'encouraging'],
  },
  {
    id: 'char-1',
    name: 'Sophie',
    bio: 'A fashion designer in Paris with a passion for art and culture.',
    isMascot: false,
    traits: ['creative', 'sophisticated', 'warm'],
  },
  {
    id: 'char-2',
    name: 'Marco',
    bio: 'A beach lifeguard with big dreams and an even bigger heart.',
    isMascot: false,
    traits: ['adventurous', 'laid-back', 'caring'],
  },
];

export default function CharactersScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Your Characters
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Tap a character to start a conversation
        </Text>

        {PLACEHOLDER_CHARACTERS.map((character) => (
          <TouchableOpacity key={character.id} activeOpacity={0.7}>
            <Card style={styles.characterCard}>
              <View style={styles.characterRow}>
                {/* Avatar placeholder */}
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: character.isMascot
                        ? colors.accent
                        : colors.primary,
                    },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {character.name[0]}
                  </Text>
                </View>

                <View style={styles.characterInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.characterName, { color: colors.text }]}>
                      {character.name}
                    </Text>
                    {character.isMascot && (
                      <View style={[styles.mascotBadge, { backgroundColor: colors.accentLight }]}>
                        <Text style={[styles.mascotBadgeText, { color: colors.accent }]}>
                          Mascot
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.characterBio, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {character.bio}
                  </Text>
                  <View style={styles.traits}>
                    {character.traits.map((trait) => (
                      <View
                        key={trait}
                        style={[styles.traitBadge, { backgroundColor: colors.backgroundSecondary }]}
                      >
                        <Text style={[styles.traitText, { color: colors.textSecondary }]}>
                          {trait}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  sectionSubtitle: {
    fontSize: FontSize.md,
    marginTop: -Spacing.sm,
  },
  characterCard: {
    padding: Spacing.lg,
  },
  characterRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  characterInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  characterName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  mascotBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  mascotBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  characterBio: {
    fontSize: FontSize.md,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  traits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  traitBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  traitText: {
    fontSize: FontSize.xs,
    textTransform: 'capitalize',
  },
});
