/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // ── 60-30-10 Brand Palette ──────────────────────────
        brand: {
          DEFAULT: '#6366F1', // Premium Indigo
          hover: '#4F46E5',
          glow: 'rgba(99, 102, 241, 0.25)',
          muted: 'rgba(99, 102, 241, 0.08)',
          border: 'rgba(99, 102, 241, 0.12)',
        },
        success: {
          DEFAULT: '#2DD4BF',
        },
        secondary: {
          DEFAULT: '#94A3B8',
        },
        // 60% — Deep navy page background
        'page-dark': '#0B0F1A',
        // 30% — Surface / card colour
        'surface-dark': '#161B2A',
        // Elevated surface
        'surface-dark-hover': '#1C2333',

        // CSS Variable support for theme tokens
        theme: {
          primary: 'var(--theme-primary)',
          focus: 'var(--theme-focus)',
          'text-default': 'var(--theme-text-default)',
          'text-subtle': 'var(--theme-text-subtle)',
          'text-muted': 'var(--theme-text-muted)',
          'bg-default': 'var(--theme-bg-default)',
          'bg-secondary': 'var(--theme-bg-secondary)',
          'bg-tertiary': 'var(--theme-bg-tertiary)',
          'border-default': 'var(--theme-border-default)',
          'border-subtle': 'var(--theme-border-subtle)',
        },
        primary: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        arc: {
          white: '#ffffff',
          dark: '#0B0F1A',
        },
        // Enhanced dark mode colors for better contrast
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0B0F1A',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-arc': 'linear-gradient(135deg, #0B0F1A 0%, #161B2A 100%)',
        'gradient-error': 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
        'gradient-brand': 'linear-gradient(135deg, #7C6FFF 0%, #6B5CF7 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 5s infinite',
        'fade-in': 'fadeIn 2s ease-in',
        'slide-up': 'slideUp 1.5s ease-out',
        'slide-down': 'slideDown 1.5s ease-out',
        'text-shimmer': 'text-shimmer 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'blob': 'blob 20s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'text-shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0px)' },
        },
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'Inter', 'sans-serif'],
        display: ['Instrument Serif', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
