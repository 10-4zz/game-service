import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Segoe UI"', 'sans-serif']
      },
      colors: {
        ink: '#0f172a',
        steel: '#334155',
        mist: '#e2e8f0',
        paper: '#f8fafc',
        accent: '#c2410c',
        pine: '#166534'
      },
      boxShadow: {
        panel: '0 14px 32px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
} satisfies Config;
