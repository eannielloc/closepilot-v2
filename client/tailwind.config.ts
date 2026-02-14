import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: { 900: '#0f1117', 800: '#161925', 700: '#1e2235' },
        brand: { 400: '#6366f1', 500: '#4f46e5', 600: '#4338ca' },
        accent: { 400: '#34d399', 500: '#10b981' }
      }
    }
  },
  plugins: []
} satisfies Config;
