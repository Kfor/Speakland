// ============================================================
// 404 Not Found Screen
// ============================================================

import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight, Spacing } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function NotFoundScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          This screen does not exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Go to home screen
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  link: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  linkText: {
    fontSize: FontSize.md,
  },
});
