/**
 * Field Shift mobile design system adopted from Autis Planner (Roofi design system):
 * warm white & cream surfaces (#FFFFFF / #F4F4F2), crisp ink typography (#111111),
 * vibrant terracotta-orange primary (#FF6A2B), sage/gold/cyan semantic palettes,
 * Olive Display headlines, Suncoast Grot body text, 4-point spacing grid,
 * 24px rounded cards, floating pill bottom navigation, and 1.7px outline icons.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const roofiThemes = {
  light: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSubtle: '#F4F4F2',
    surfaceRaised: '#FFFFFF',
    foreground: '#111111',
    secondary: '#6B6B6B',
    mutedText: '#9A9A9A',
    border: '#E6E3D8',
    divider: '#E6E3D8',
    primary: '#FF6A2B',
    primaryPressed: '#E25318',
    accent: '#FF6A2B',
    onPrimary: '#FFFFFF',
    onAccent: '#FFFFFF',
    muted: '#F4F4F2',
    success: '#1FB26B',
    successSurface: '#EAF7EF',
    error: '#DC2626',
    errorSurface: '#FEF2F2',
    warning: '#B45309',
    warningSurface: '#FFF7E8',
    personal: { surface: '#FFF1EB', tint: '#FFF1EB', ink: '#C8491C', edge: '#FF6A2B' },
    company: { surface: '#EAF7EF', tint: '#EAF7EF', ink: '#166534', edge: '#1FB26B' },
    group: { surface: '#F4F4F2', tint: '#F4F4F2', ink: '#3A2E28', edge: '#6B6B6B' },
    pair: { surface: '#EEF4FF', tint: '#EEF4FF', ink: '#1D4ED8', edge: '#2563EB' },
    pink: { surface: '#FFF1EB', tint: '#FFF1EB', ink: '#C8491C', edge: '#FF6A2B' },
    gold: { surface: '#FFF7E8', tint: '#FFF7E8', ink: '#B45309', edge: '#B45309' },
    sage: { surface: '#EAF7EF', tint: '#EAF7EF', ink: '#166534', edge: '#1FB26B' },
    cyan: { surface: '#EEF4FF', tint: '#EEF4FF', ink: '#1D4ED8', edge: '#2563EB' },
    // Semantic aliases for Field Shift components
    text: '#111111',
    textSecondary: '#6B6B6B',
    textMuted: '#9A9A9A',
    backgroundElement: '#F4F4F2',
    backgroundSelected: '#FF6A2B',
    primarySoft: '#FFF1EB',
    primaryText: '#C8491C',
    sageSoft: '#EAF7EF',
    sageText: '#166534',
    amber: '#B45309',
    amberSoft: '#FFF7E8',
    blue: '#2563EB',
    blueSoft: '#EEF4FF',
    iconBg: '#F4F4F2',
  },
  dark: {
    background: '#0B0C0E',
    surface: '#18191C',
    surfaceSubtle: '#212225',
    surfaceRaised: '#27282C',
    foreground: '#F4F4F5',
    secondary: '#B7B7BF',
    mutedText: '#92929B',
    border: '#34353A',
    divider: '#2B2C30',
    primary: '#FF8759',
    primaryPressed: '#FFA17D',
    accent: '#FF8759',
    onPrimary: '#1C100B',
    onAccent: '#1C100B',
    muted: '#212225',
    success: '#65C98A',
    successSurface: '#173222',
    error: '#FF7777',
    errorSurface: '#3A1D20',
    warning: '#F0B35A',
    warningSurface: '#382A16',
    personal: { surface: '#352018', tint: '#352018', ink: '#FFA17D', edge: '#FF8759' },
    company: { surface: '#173222', tint: '#173222', ink: '#91E0AC', edge: '#65C98A' },
    group: { surface: '#27282C', tint: '#27282C', ink: '#D7D7DC', edge: '#92929B' },
    pair: { surface: '#1D2B46', tint: '#1D2B46', ink: '#A8C1FF', edge: '#7EA5FF' },
    pink: { surface: '#352018', tint: '#352018', ink: '#FFA17D', edge: '#FF8759' },
    gold: { surface: '#382A16', tint: '#382A16', ink: '#F0B35A', edge: '#C9963F' },
    sage: { surface: '#173222', tint: '#173222', ink: '#91E0AC', edge: '#65C98A' },
    cyan: { surface: '#1D2B46', tint: '#1D2B46', ink: '#A8C1FF', edge: '#7EA5FF' },
    // Semantic aliases for Field Shift components
    text: '#F4F4F5',
    textSecondary: '#B7B7BF',
    textMuted: '#92929B',
    backgroundElement: '#212225',
    backgroundSelected: '#FF8759',
    primarySoft: '#352018',
    primaryText: '#FFA17D',
    sageSoft: '#173222',
    sageText: '#91E0AC',
    amber: '#F0B35A',
    amberSoft: '#382A16',
    blue: '#7EA5FF',
    blueSoft: '#1D2B46',
    iconBg: '#212225',
  },
} as const;

export const roofiSpacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const roofiRadii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  frame: 40,
  pill: 9999,
} as const;

export const roofiTypography = {
  fontFamily: {
    display: 'OliveDisplay-Bold',
    displayMedium: 'OliveDisplay-Medium',
    body: 'SuncoastGrot-Medium',
    bodyBold: 'SuncoastGrot-Bold',
    bodyHeavy: 'SuncoastGrot-Black',
    mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }) ?? 'monospace',
  },
  fontSize: {
    caption: 11,
    label: 12,
    button: 13,
    body: 14,
    price: 16,
    screenTitle: 24,
    stat: 28,
    displayM: 36,
    displayL: 48,
    displayXL: 64,
  },
  lineHeight: {
    caption: 16,
    label: 16,
    button: 16,
    body: 20,
    price: 20,
    screenTitle: 32,
    stat: 32,
    displayM: 38,
    displayL: 48,
    displayXL: 60,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '900',
  },
} as const;

export const roofiNavigation = {
  background: '#0B0C0E',
  foreground: '#FFFFFF',
  inactive: '#A6A6A8',
  activeSurface: '#252629',
} as const;

export const Colors = roofiThemes;

export type ThemeColor =
  | 'background'
  | 'surface'
  | 'surfaceSubtle'
  | 'surfaceRaised'
  | 'foreground'
  | 'secondary'
  | 'mutedText'
  | 'border'
  | 'divider'
  | 'primary'
  | 'primaryPressed'
  | 'accent'
  | 'onPrimary'
  | 'onAccent'
  | 'muted'
  | 'success'
  | 'successSurface'
  | 'error'
  | 'errorSurface'
  | 'warning'
  | 'warningSurface'
  | 'text'
  | 'textSecondary'
  | 'textMuted'
  | 'backgroundElement'
  | 'backgroundSelected'
  | 'primarySoft'
  | 'primaryText'
  | 'sageSoft'
  | 'sageText'
  | 'amber'
  | 'amberSoft'
  | 'blue'
  | 'blueSoft'
  | 'iconBg';

export const Fonts = {
  sans: roofiTypography.fontFamily.body,
  sansBold: roofiTypography.fontFamily.bodyBold,
  sansHeavy: roofiTypography.fontFamily.bodyHeavy,
  display: roofiTypography.fontFamily.display,
  displayMedium: roofiTypography.fontFamily.displayMedium,
  serif: roofiTypography.fontFamily.display,
  rounded: roofiTypography.fontFamily.bodyBold,
  mono: roofiTypography.fontFamily.mono,
};

export const Spacing = {
  half: 2,
  one: roofiSpacing[1],
  two: roofiSpacing[2],
  three: roofiSpacing[4],
  four: roofiSpacing[5],
  five: roofiSpacing[6],
  six: roofiSpacing[16],
} as const;

export const Radii = {
  xs: roofiRadii.md,
  sm: roofiRadii.lg,
  md: roofiRadii.xl,
  lg: roofiRadii['2xl'],
  xl: 26,
  pill: roofiRadii.pill,
} as const;

export const CardShadow = Platform.select({
  ios: {
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  android: {
    elevation: 2,
  },
  default: {
    boxShadow: '0px 4px 12px rgba(17, 17, 17, 0.04)',
  },
});

export const BottomTabInset =
  Platform.select({ ios: 86, android: 92, web: 96 }) ?? 88;
export const MaxContentWidth = 800;
