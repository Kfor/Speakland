/**
 * Tabs Layout
 *
 * 3-tab structure:
 * - Home (stories)
 * - Characters
 * - Word Book / Settings
 */

import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Stories',
          tabBarLabel: 'Stories',
        }}
      />
      <Tabs.Screen
        name="characters"
        options={{
          title: 'Characters',
          tabBarLabel: 'Characters',
        }}
      />
      <Tabs.Screen
        name="wordbook"
        options={{
          title: 'Word Book',
          tabBarLabel: 'Words',
        }}
      />
    </Tabs>
  );
}
