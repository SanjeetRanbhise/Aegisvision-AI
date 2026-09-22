/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: {
          950: '#070b0f',
          900: '#0a0f14',
          850: '#0d141b',
          800: '#111a23',
          750: '#16212d',
          700: '#1b2836',
          600: '#243447',
          500: '#324659',
          400: '#4a6378',
          300: '#6b8499',
          200: '#9aafbf',
          100: '#c5d4df',
        },
        aegis: {
          50: '#ecfff5',
          100: '#d2ffe6',
          200: '#a8ffcc',
          300: '#6ffaa8',
          400: '#34ed84',
          500: '#12d667',
          600: '#06aa50',
          700: '#048542',
          800: '#066938',
          900: '#07562f',
        },
        amber: {
          400: '#ffb547',
          500: '#ff9d1c',
          600: '#f08400',
        },
        danger: {
          400: '#ff5a6b',
          500: '#ef3a4d',
          600: '#d61f33',
          700: '#b41425',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
      },
      boxShadow: {
        'glow-green': '0 0 12px rgba(18,214,103,0.35), 0 0 2px rgba(18,214,103,0.6)',
        'glow-amber': '0 0 12px rgba(255,157,28,0.35), 0 0 2px rgba(255,157,28,0.6)',
        'glow-danger': '0 0 12px rgba(239,58,77,0.4), 0 0 2px rgba(239,58,77,0.7)',
        'glow-cyan': '0 0 12px rgba(34,211,238,0.35), 0 0 2px rgba(34,211,238,0.6)',
        'inset-line': 'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.9' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'dash': {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-40' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'scan-line': 'scan-line 4s linear infinite',
        'blink': 'blink 1.4s ease-in-out infinite',
        'sweep': 'sweep 4s linear infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'dash': 'dash 1.5s linear infinite',
      },
    },
  },
  plugins: [],
};
