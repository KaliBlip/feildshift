/**
 * Field Shift mobile design system (Roofi architecture + Field Shift Brand Palette):
 * - Dominant Ultramarine Blue: #3670FF
 * - Dominant Chinese Black:    #171717
 * - Bright Gray Neutral:       #EFEFEF
 * - Golden Accent:             #F9D601
 * Combined with Olive Display headlines, Suncoast Grot body text, 4-point spacing grid,
 * 24px rounded cards, floating pill bottom navigation, and 1.7px outline icons.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const brandPalette = {
  ultramarineBlue: '#3670FF',
  chineseBlack: '#171717',
  brightGray: '#EFEFEF',
  golden: '#F9D601',
} as const;

export const roofiThemes = {
  light: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSubtle: '#EFEFEF',
    surfaceRaised: '#FFFFFF',
    foreground: '#171717',
    secondary: '#52525B',
    mutedText: '#8E8E93',
    border: '#E2E4E9',
    divider: '#E2E4E9',
    primary: '#3670FF',
    primaryPressed: '#2458DB',
    accent: '#F9D601',
    onPrimary: '#FFFFFF',
    onAccent: '#171717',
    muted: '#EFEFEF',
    success: '#1FB26B',
    successSurface: '#EAF7EF',
    error: '#DC2626',
    errorSurface: '#FEF2F2',
    warning: '#9A7B00',
    warningSurface: '#FFF9D6',
    personal: {
      surface: '#EBF1FF',
      tint: '#EBF1FF',
      ink: '#1E4CE0',
      edge: '#3670FF',
    },
    company: {
      surface: '#EAF7EF',
      tint: '#EAF7EF',
      ink: '#166534',
      edge: '#1FB26B',
    },
    group: {
      surface: '#EFEFEF',
      tint: '#EFEFEF',
      ink: '#171717',
      edge: '#52525B',
    },
    pair: {
      surface: '#EBF1FF',
      tint: '#EBF1FF',
      ink: '#1E4CE0',
      edge: '#3670FF',
    },
    pink: {
      surface: '#EBF1FF',
      tint: '#EBF1FF',
      ink: '#1E4CE0',
      edge: '#3670FF',
    },
    gold: {
      surface: '#FFF9D6',
      tint: '#FFF9D6',
      ink: '#7A6200',
      edge: '#F9D601',
    },
    sage: {
      surface: '#EAF7EF',
      tint: '#EAF7EF',
      ink: '#166534',
      edge: '#1FB26B',
    },
    cyan: {
      surface: '#EBF1FF',
      tint: '#EBF1FF',
      ink: '#1E4CE0',
      edge: '#3670FF',
    },
    // Semantic aliases for Field Shift components
    text: '#171717',
    textSecondary: '#52525B',
    textMuted: '#8E8E93',
    backgroundElement: '#EFEFEF',
    backgroundSelected: '#3670FF',
    primarySoft: '#EBF1FF',
    primaryText: '#1E4CE0',
    sageSoft: '#EAF7EF',
    sageText: '#166534',
    amber: '#7A6200',
    amberSoft: '#FFF9D6',
    blue: '#3670FF',
    blueSoft: '#EBF1FF',
    iconBg: '#EFEFEF',
  },
  dark: {
    background: '#171717',
    surface: '#1F2024',
    surfaceSubtle: '#27292E',
    surfaceRaised: '#2E3036',
    foreground: '#EFEFEF',
    secondary: '#B4B6BE',
    mutedText: '#8E9099',
    border: '#32353D',
    divider: '#2A2C33',
    primary: '#3670FF',
    primaryPressed: '#5B8BFF',
    accent: '#F9D601',
    onPrimary: '#FFFFFF',
    onAccent: '#171717',
    muted: '#27292E',
    success: '#65C98A',
    successSurface: '#173222',
    error: '#FF7777',
    errorSurface: '#3A1D20',
    warning: '#F9D601',
    warningSurface: '#332D12',
    personal: {
      surface: '#1B2848',
      tint: '#1B2848',
      ink: '#8AB0FF',
      edge: '#3670FF',
    },
    company: {
      surface: '#173222',
      tint: '#173222',
      ink: '#91E0AC',
      edge: '#65C98A',
    },
    group: {
      surface: '#27292E',
      tint: '#27292E',
      ink: '#EFEFEF',
      edge: '#8E9099',
    },
    pair: {
      surface: '#1B2848',
      tint: '#1B2848',
      ink: '#8AB0FF',
      edge: '#3670FF',
    },
    pink: {
      surface: '#1B2848',
      tint: '#1B2848',
      ink: '#8AB0FF',
      edge: '#3670FF',
    },
    gold: {
      surface: '#332D12',
      tint: '#332D12',
      ink: '#F9D601',
      edge: '#F9D601',
    },
    sage: {
      surface: '#173222',
      tint: '#173222',
      ink: '#91E0AC',
      edge: '#65C98A',
    },
    cyan: {
      surface: '#1B2848',
      tint: '#1B2848',
      ink: '#8AB0FF',
      edge: '#3670FF',
    },
    // Semantic aliases for Field Shift components
    text: '#EFEFEF',
    textSecondary: '#B4B6BE',
    textMuted: '#8E9099',
    backgroundElement: '#27292E',
    backgroundSelected: '#3670FF',
    primarySoft: '#1B2848',
    primaryText: '#8AB0FF',
    sageSoft: '#173222',
    sageText: '#91E0AC',
    amber: '#F9D601',
    amberSoft: '#332D12',
    blue: '#3670FF',
    blueSoft: '#1B2848',
    iconBg: '#27292E',
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
    mono:
      Platform.select({ ios: 'ui-monospace', default: 'monospace' }) ??
      'monospace',
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
  background: '#171717',
  foreground: '#FFFFFF',
  inactive: '#9A9AA2',
  activeSurface: '#3670FF',
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
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  android: {
    elevation: 2,
  },
  default: {
    boxShadow: '0px 4px 12px rgba(23, 23, 23, 0.05)',
  },
});

export const BottomTabInset =
  Platform.select({ ios: 86, android: 92, web: 96 }) ?? 88;
export const MaxContentWidth = 800;
