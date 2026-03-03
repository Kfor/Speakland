/**
 * Constants tests
 *
 * Verifies theme constants are properly defined and accessible.
 */

import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants/theme';

describe('Theme constants', () => {
  test('Colors has primary palette', () => {
    expect(Colors.primary).toBeDefined();
    expect(Colors.primaryLight).toBeDefined();
    expect(Colors.primaryDark).toBeDefined();
    expect(typeof Colors.primary).toBe('string');
    expect(Colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  test('Colors has text colors', () => {
    expect(Colors.text).toBeDefined();
    expect(Colors.textSecondary).toBeDefined();
    expect(Colors.textLight).toBeDefined();
    expect(Colors.textOnPrimary).toBeDefined();
  });

  test('Colors has semantic colors', () => {
    expect(Colors.success).toBeDefined();
    expect(Colors.warning).toBeDefined();
    expect(Colors.error).toBeDefined();
    expect(Colors.info).toBeDefined();
  });

  test('Fonts has size scale', () => {
    expect(Fonts.size.xs).toBeLessThan(Fonts.size.sm);
    expect(Fonts.size.sm).toBeLessThan(Fonts.size.md);
    expect(Fonts.size.md).toBeLessThan(Fonts.size.base);
    expect(Fonts.size.base).toBeLessThan(Fonts.size.lg);
    expect(Fonts.size.lg).toBeLessThan(Fonts.size.xl);
  });

  test('Spacing has increasing values', () => {
    expect(Spacing.xs).toBeLessThan(Spacing.sm);
    expect(Spacing.sm).toBeLessThan(Spacing.md);
    expect(Spacing.md).toBeLessThan(Spacing.base);
    expect(Spacing.base).toBeLessThan(Spacing.lg);
  });

  test('BorderRadius has expected values', () => {
    expect(BorderRadius.sm).toBeLessThan(BorderRadius.md);
    expect(BorderRadius.md).toBeLessThan(BorderRadius.lg);
    expect(BorderRadius.full).toBe(9999);
  });

  test('Shadows has proper structure', () => {
    expect(Shadows.sm.shadowColor).toBeDefined();
    expect(Shadows.sm.shadowOffset).toBeDefined();
    expect(Shadows.sm.shadowOpacity).toBeDefined();
    expect(Shadows.sm.shadowRadius).toBeDefined();
    expect(Shadows.sm.elevation).toBeDefined();
    // lg shadow should be more prominent than sm
    expect(Shadows.lg.shadowRadius).toBeGreaterThan(Shadows.sm.shadowRadius);
  });
});
