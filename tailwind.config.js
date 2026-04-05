/** @type {import('tailwindcss').Config} */
// Created: 2026-02-13
// Last Updated: 2026-02-13
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#1a1d2e',
          800: '#252842',
          700: '#2f3352',
          600: '#3a3f62',
        },
        accent: {
          blue: '#4F6FFF',
          'blue-hover': '#3d5ce6',
          gold: '#f59e0b',
          'gold-hover': '#d97706',
        },
        surface: {
          light: '#f5f7fa',
          card: '#ffffff',
        },
        content: {
          primary: '#1f2937',
          secondary: '#6b7280',
          muted: '#9ca3af',
          inverse: '#ffffff',
        },
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        display: ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-1': ['2rem', { lineHeight: '1.2', fontWeight: '600' }],
        'heading-2': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.5', fontWeight: '400' }],
        body: ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      borderRadius: {
        pill: '9999px',
        card: '1rem',
        'card-lg': '1.5rem',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        button: '0 2px 4px rgba(79, 111, 255, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
