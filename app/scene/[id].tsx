/**
 * Scene Screen (placeholder)
 *
 * Will contain the core learning scene UI with:
 * - Background image
 * - Character portraits
 * - Real-time subtitles
 * - Chat input (voice/text)
 */

import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';

export default function SceneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Scene: {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    fontSize: Fonts.size.lg,
    color: Colors.textSecondary,
  },
});
