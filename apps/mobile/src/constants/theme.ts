/**
 * Field Shift mobile design tokens inspired by modern agritech telemetry UI:
 * soft off-white canvas, crisp white rounded cards, leaf-green primary pills,
 * warm amber stress accents, and clean tabular typography.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1D1F',
    textSecondary: '#6C737A',
    textMuted: '#9AA0A6',
    background: '#F5F7F6',
    surface: '#FFFFFF',
    backgroundElement: '#F3F5F6',
    backgroundSelected: '#4EA829',
    primary: '#4EA829',
    primarySoft: '#EAF7EE',
    primaryText: '#1F9D63',
    amber: '#E57A24',
    amberSoft: '#FFF4EB',
    blue: '#2B7CE9',
    blueSoft: '#EBF3FE',
    border: '#ECEEF0',
    iconBg: '#F3F5F6',
  },
  dark: {
    text: '#F3F5F6',
    textSecondary: '#A0A8B0',
    textMuted: '#757D85',
    background: '#0F1210',
    surface: '#181C19',
    backgroundElement: '#232825',
    backgroundSelected: '#4EA829',
    primary: '#57B830',
    primarySoft: '#162B1D',
    primaryText: '#4CD490',
    amber: '#F28E38',
    amberSoft: '#2E1E12',
    blue: '#4D96F2',
    blueSoft: '#162436',
    border: '#2A302C',
    iconBg: '#232825',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 14,
  four: 18,
  five: 24,
  six: 64,
} as const;

export const Radii = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const CardShadow = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  android: {
    elevation: 2,
  },
  default: {
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
  },
});

export const BottomTabInset =
  Platform.select({ ios: 58, android: 78, web: 88 }) ?? 0;
export const MaxContentWidth = 800;
