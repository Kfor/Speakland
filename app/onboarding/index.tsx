/**
 * Onboarding Screen (placeholder)
 *
 * Will contain the full onboarding questionnaire flow.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../constants/theme';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Onboarding</Text>
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
