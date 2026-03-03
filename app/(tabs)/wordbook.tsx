/**
 * Word Book Tab - Vocabulary list & settings (placeholder)
 */

import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../constants/theme';

export default function WordBookScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Word Book</Text>
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
