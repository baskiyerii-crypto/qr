export const colors = {
  // Brand: monochrome "ink" (warm near-black). Elegant, not garish — buttons and
  // emphasis use the dark end; subtle highlights use the light end.
  primary: {
    50: '#f6f6f5',
    100: '#e7e7e4',
    200: '#d6d5d1',
    300: '#b5b3ad',
    400: '#8f8c85',
    500: '#6b6862',
    600: '#2a2926',
    700: '#1f1e1c',
    800: '#181716',
    900: '#0f0f0e',
  },
  // Accent kept intentionally neutral in-app (warm stone). Vivid gradients live
  // only on the marketing/landing surface via dedicated CSS.
  accent: {
    50: '#f7f6f4',
    100: '#eeece8',
    200: '#ddd9d2',
    300: '#c3bdb2',
    400: '#a29a8c',
    500: '#847b6c',
    600: '#6b6355',
    700: '#544e43',
    800: '#3d3931',
    900: '#292620',
  },
  // Neutral: warm stone scale (kept in sync with Tailwind's stone scale).
  slate: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#2563eb',
  white: '#ffffff',
  background: '#fafaf9',
  foreground: '#1c1917',
  muted: '#78716c',
  border: 'rgba(231, 229, 228, 0.9)',
} as const;

export const typography = {
  fontFamily: {
    sans: '"Inter", "Inter Variable", system-ui, -apple-system, sans-serif',
    display: '"Inter", "Inter Variable", system-ui, sans-serif',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625',
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
} as const;

export const radius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.625rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

export const shadows = {
  xs: '0 1px 2px 0 rgb(15 23 42 / 0.04)',
  sm: '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.04)',
  md: '0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 6px -2px rgb(15 23 42 / 0.05)',
  lg: '0 12px 24px -6px rgb(15 23 42 / 0.10), 0 4px 8px -4px rgb(15 23 42 / 0.06)',
  xl: '0 24px 48px -12px rgb(15 23 42 / 0.18)',
} as const;

export const motion = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/** React Native-safe numeric values (RN styles do not accept rem/px strings). */
export const nativeRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const nativeSpacing = {
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

export const nativeFontSize = {
  xs: 12,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 34,
} as const;

/** Native elevation presets (iOS shadow + Android elevation). */
export const nativeShadow = {
  sm: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lg: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const tokens = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  motion,
  nativeRadius,
  nativeSpacing,
  nativeFontSize,
  nativeShadow,
} as const;

export type Tokens = typeof tokens;
