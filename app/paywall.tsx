/**
 * Paywall Screen (placeholder)
 *
 * Will contain RevenueCat subscription offerings.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../constants/theme';

export default function PaywallScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Paywall</Text>
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
