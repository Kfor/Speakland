/**
 * Theme constants tests
 *
 * Validates that theme constants are correctly defined and export expected values.
 */

import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants';

describe('Theme Constants', () => {
  describe('Colors', () => {
    it('should define primary colors', () => {
      expect(Colors.primary).toBeDefined();
      expect(Colors.primaryLight).toBeDefined();
      expect(Colors.primaryDark).toBeDefined();
    });

    it('should define text colors', () => {
      expect(Colors.text).toBeDefined();
      expect(Colors.textSecondary).toBeDefined();
      expect(Colors.textLight).toBeDefined();
      expect(Colors.textOnPrimary).toBeDefined();
    });

    it('should define semantic colors', () => {
      expect(Colors.success).toBeDefined();
      expect(Colors.warning).toBeDefined();
      expect(Colors.error).toBeDefined();
      expect(Colors.info).toBeDefined();
    });

    it('should define learning-specific colors', () => {
      expect(Colors.wordHighlight).toBeDefined();
      expect(Colors.praiseGlow).toBeDefined();
      expect(Colors.correctionGlow).toBeDefined();
    });

    it('should use valid hex color format', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      expect(Colors.primary).toMatch(hexRegex);
      expect(Colors.background).toMatch(hexRegex);
      expect(Colors.text).toMatch(hexRegex);
    });
  });

  describe('Fonts', () => {
    it('should define font sizes', () => {
      expect(Fonts.size.xs).toBeLessThan(Fonts.size.sm);
      expect(Fonts.size.sm).toBeLessThan(Fonts.size.md);
      expect(Fonts.size.md).toBeLessThan(Fonts.size.base);
      expect(Fonts.size.base).toBeLessThan(Fonts.size.lg);
    });

    it('should define font families', () => {
      expect(Fonts.family.regular).toBeDefined();
      expect(Fonts.family.bold).toBeDefined();
    });

    it('should define line heights', () => {
      expect(Fonts.lineHeight.tight).toBeLessThan(Fonts.lineHeight.normal);
      expect(Fonts.lineHeight.normal).toBeLessThan(Fonts.lineHeight.relaxed);
    });
  });

  describe('Spacing', () => {
    it('should define spacing scale in ascending order', () => {
      expect(Spacing.xs).toBeLessThan(Spacing.sm);
      expect(Spacing.sm).toBeLessThan(Spacing.md);
      expect(Spacing.md).toBeLessThan(Spacing.base);
      expect(Spacing.base).toBeLessThan(Spacing.lg);
    });
  });

  describe('BorderRadius', () => {
    it('should define border radius scale', () => {
      expect(BorderRadius.sm).toBeLessThan(BorderRadius.md);
      expect(BorderRadius.md).toBeLessThan(BorderRadius.lg);
      expect(BorderRadius.full).toBe(9999);
    });
  });

  describe('Shadows', () => {
    it('should define shadow levels with increasing elevation', () => {
      expect(Shadows.sm.elevation).toBeLessThan(Shadows.md.elevation);
      expect(Shadows.md.elevation).toBeLessThan(Shadows.lg.elevation);
    });

    it('should have required shadow properties', () => {
      expect(Shadows.md).toHaveProperty('shadowColor');
      expect(Shadows.md).toHaveProperty('shadowOffset');
      expect(Shadows.md).toHaveProperty('shadowOpacity');
      expect(Shadows.md).toHaveProperty('shadowRadius');
      expect(Shadows.md).toHaveProperty('elevation');
    });
  });
});
