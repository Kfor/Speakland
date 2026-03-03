/**
 * FeedbackBanner - Top notification banner for learning feedback
 *
 * Shows praise or correction messages with appropriate styling.
 * Auto-dismisses after a configurable duration.
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants';

type FeedbackType = 'praise' | 'correction' | 'info';

interface FeedbackBannerProps {
  /** Whether the banner is visible */
  visible: boolean;
  /** Type of feedback */
  type: FeedbackType;
  /** Primary message */
  message: string;
  /** Optional detail or explanation */
  detail?: string;
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  autoDismissMs?: number;
  /** Callback when dismissed */
  onDismiss: () => void;
}

const typeConfig: Record<FeedbackType, { bg: string; icon: string; textColor: string }> = {
  praise: {
    bg: Colors.praiseGlow,
    icon: '\u2B50',
    textColor: Colors.accentDark,
  },
  correction: {
    bg: Colors.correctionGlow,
    icon: '\uD83D\uDCA1',
    textColor: Colors.secondaryDark,
  },
  info: {
    bg: Colors.surface,
    icon: '\u2139\uFE0F',
    textColor: Colors.text,
  },
};

export function FeedbackBanner({
  visible,
  type,
  message,
  detail,
  autoDismissMs = 3000,
  onDismiss,
}: FeedbackBannerProps) {
  const config = typeConfig[type];

  useEffect(() => {
    if (visible && autoDismissMs > 0) {
      const timer = setTimeout(onDismiss, autoDismissMs);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, autoDismissMs, onDismiss]);

  if (!visible) return null;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: config.bg }]}
      onPress={onDismiss}
      activeOpacity={0.9}
    >
      <Text style={styles.icon}>{config.icon}</Text>
      <View style={styles.textContainer}>
        <Text style={[styles.message, { color: config.textColor }]}>
          {message}
        </Text>
        {detail != null && (
          <Text style={styles.detail}>{detail}</Text>
        )}
      </View>
      <Text style={styles.dismiss}>{'\u2715'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    ...Shadows.sm,
  },
  icon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: Fonts.size.md,
    fontWeight: '600',
  },
  detail: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dismiss: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
});
