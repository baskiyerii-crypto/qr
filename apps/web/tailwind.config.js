/** @type {import('tailwindcss').Config} */
// Monochrome "ink" system. Neutrals + surfaces are driven by CSS variables
// (see index.css) so the entire app supports light/dark without per-page edits.
// The marketing/landing surface layers vivid gradients on top via dedicated CSS.
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware semantic tokens
        background: withVar('--background'),
        foreground: withVar('--foreground'),
        surface: withVar('--background'),
        border: withVar('--border'),
        input: withVar('--input'),
        ring: withVar('--ring'),
        card: {
          DEFAULT: withVar('--card'),
          foreground: withVar('--card-foreground'),
        },
        muted: {
          DEFAULT: withVar('--muted'),
          foreground: withVar('--muted-foreground'),
        },
        primary: {
          DEFAULT: withVar('--primary'),
          foreground: withVar('--primary-foreground'),
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
        accent: {
          DEFAULT: withVar('--accent'),
          foreground: withVar('--accent-foreground'),
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
        // Warm neutral ramp mapped to CSS vars so `slate-*` usages theme-flip.
        slate: {
          50: withVar('--s-50'),
          100: withVar('--s-100'),
          200: withVar('--s-200'),
          300: withVar('--s-300'),
          400: withVar('--s-400'),
          500: withVar('--s-500'),
          600: withVar('--s-600'),
          700: withVar('--s-700'),
          800: withVar('--s-800'),
          900: withVar('--s-900'),
        },
        success: { DEFAULT: '#16a34a', 50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' },
        warning: { DEFAULT: '#d97706', 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
        danger: { DEFAULT: '#dc2626', 50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
        info: { DEFAULT: '#2563eb', 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
      },
      fontFamily: {
        sans: ['"Inter"', '"Inter Variable"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Inter"', '"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter: '-0.02em',
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(28 25 23 / 0.04)',
        card: '0 1px 3px 0 rgb(28 25 23 / 0.06), 0 1px 2px -1px rgb(28 25 23 / 0.04)',
        'card-hover': '0 4px 12px -2px rgb(28 25 23 / 0.08), 0 2px 6px -2px rgb(28 25 23 / 0.05)',
        elevated: '0 12px 24px -6px rgb(28 25 23 / 0.10), 0 4px 8px -4px rgb(28 25 23 / 0.06)',
        overlay: '0 24px 48px -12px rgb(28 25 23 / 0.18)',
        glow: '0 0 0 1px rgb(255 255 255 / 0.06), 0 8px 40px -8px rgb(0 0 0 / 0.5)',
      },
      backgroundImage: {
        'aurora':
          'radial-gradient(60% 60% at 20% 10%, rgba(99,102,241,0.35) 0%, transparent 60%), radial-gradient(50% 50% at 80% 20%, rgba(236,72,153,0.28) 0%, transparent 55%), radial-gradient(60% 60% at 60% 90%, rgba(16,185,129,0.25) 0%, transparent 55%)',
        'shine': 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'aurora-move': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(0,-3%,0) scale(1.08)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        scan: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0' },
          '12%': { opacity: '1' },
          '55%': { transform: 'translateY(5.5rem)', opacity: '1' },
          '65%': { opacity: '0' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        'scale-in': 'scale-in 0.15s ease-out',
        'gradient-x': 'gradient-x 6s ease infinite',
        'aurora-move': 'aurora-move 14s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
};
