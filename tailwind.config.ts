import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        zennya: {
          purple: '#7C3AED',
          dark: '#0F0F1A',
          card: '#1A1A2E',
          border: '#2D2D3F',
        },
      },
    },
  },
  plugins: [],
}
export default config
