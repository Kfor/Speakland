// ============================================================
// Settings Tab
// User profile, vocabulary book, saved sentences, account settings
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
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, type ThemeColors } from '@/constants/Colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();
  const { isPremium } = useSubscription();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Login / Profile Section */}
        {!isAuthenticated ? (
          <Card style={styles.loginCard}>
            <Text style={[styles.loginTitle, { color: colors.text }]}>
              Sign in to sync your progress
            </Text>
            <Text style={[styles.loginSubtitle, { color: colors.textSecondary }]}>
              Keep your vocabulary, progress, and settings across devices
            </Text>
            <Button
              title="Sign In"
              onPress={() => router.push('/(auth)/login')}
              size="md"
              style={{ marginTop: Spacing.md }}
            />
          </Card>
        ) : (
          <Card style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.profileAvatarText}>
                  {user?.display_name?.[0] ?? user?.email?.[0] ?? '?'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {user?.display_name ?? 'User'}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                  {user?.email}
                </Text>
                {isPremium && (
                  <View style={[styles.premiumBadge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </View>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Subscription */}
        {!isPremium && (
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/paywall')}>
            <Card style={[styles.upgradeCard, { backgroundColor: colors.primary }]}>
              <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
              <Text style={styles.upgradeSubtitle}>
                Unlock all stories and advanced features
              </Text>
            </Card>
          </TouchableOpacity>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>
            Learning
          </Text>
          <MenuRow
            title="Vocabulary Book"
            subtitle="Review your saved words"
            colors={colors}
          />
          <MenuRow
            title="Saved Sentences"
            subtitle="Sentences you've bookmarked"
            colors={colors}
          />
          <MenuRow
            title="Pronunciation Tips"
            subtitle="Review accent suggestions"
            colors={colors}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>
            Preferences
          </Text>
          <MenuRow
            title="Target Language"
            subtitle={user?.target_language === 'es' ? 'Spanish' : 'English'}
            colors={colors}
          />
          <MenuRow
            title="Difficulty Level"
            subtitle={user?.proficiency_level ?? 'Beginner'}
            colors={colors}
          />
        </View>

        {/* Sign Out */}
        {isAuthenticated && (
          <Button
            title="Sign Out"
            onPress={signOut}
            variant="outline"
            size="md"
            style={{ marginTop: Spacing.lg }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({
  title,
  subtitle,
  colors,
}: {
  title: string;
  subtitle: string;
  colors: ThemeColors;
}) {
  return (
    <TouchableOpacity activeOpacity={0.7}>
      <View style={[menuStyles.row, { borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[menuStyles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[menuStyles.subtitle, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        </View>
        <Text style={[menuStyles.arrow, { color: colors.textMuted }]}>{'>'}</Text>
      </View>
    </TouchableOpacity>
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
  loginCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loginTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  loginSubtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 20,
  },
  profileCard: {
    padding: Spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  profileEmail: {
    fontSize: FontSize.sm,
  },
  premiumBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  upgradeCard: {
    padding: Spacing.xl,
  },
  upgradeTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  upgradeSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.md,
  },
  menuSection: {
    gap: 0,
  },
  menuSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
});

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FontSize.sm,
  },
  arrow: {
    fontSize: FontSize.lg,
  },
});
