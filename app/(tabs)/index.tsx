/**
 * Home Tab - Stories list (placeholder)
 */

import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Stories</Text>
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
