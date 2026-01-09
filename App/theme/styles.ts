import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import * as colorTheme from './colors';

/**
 * Shared style utilities for vintage card game theme
 */

// Re-export colors for convenience
export const colors = colorTheme.colors;

// Shadow presets
export const cardShadow: ViewStyle = {
  shadowColor: colorTheme.colors.shadow.color,
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: colorTheme.colors.shadow.opacity,
  shadowRadius: 4,
  elevation: 3,
};

export const cardShadowStrong: ViewStyle = {
  shadowColor: colorTheme.colors.shadow.color,
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: colorTheme.colors.shadow.opacity + 0.05,
  shadowRadius: 6,
  elevation: 5,
};

// Card styles
export const cardBase: ViewStyle = {
  backgroundColor: colorTheme.colors.background.card,
  borderRadius: 14,
  borderWidth: 2,
  borderColor: colorTheme.colors.border.default,
  ...cardShadow,
};

export const cardSelected: ViewStyle = {
  borderColor: colorTheme.colors.border.selected,
  backgroundColor: colorTheme.colors.background.cardAlt,
  borderWidth: 3,
};

// Typography
export const typography = {
  heading: {
    fontSize: 26,
    fontWeight: 'bold' as const,
    color: colorTheme.colors.text.primary,
    letterSpacing: 0.5,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colorTheme.colors.text.primary,
    letterSpacing: 0.3,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colorTheme.colors.text.primary,
    letterSpacing: 0.2,
  },
  bodySecondary: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colorTheme.colors.text.secondary,
    letterSpacing: 0.2,
  },
  score: {
    fontSize: 36,
    fontWeight: 'bold' as const,
    color: colorTheme.colors.accent.red,
    letterSpacing: 1,
  },
  scoreSmall: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colorTheme.colors.accent.red,
    letterSpacing: 0.5,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
};

