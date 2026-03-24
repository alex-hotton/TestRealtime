/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#5E6AD2',
          hover: '#4F5BC1',
          light: '#E8E9F8',
        },
        surface: {
          primary: '#ffffff',
          secondary: '#f7f7f8',
          tertiary: '#ebebef',
        },
        content: {
          primary: '#1d1d1f',
          secondary: '#6e6e73',
          tertiary: '#aeaeb2',
        },
        border: '#e5e5ea',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'sans-serif',
        ],
        mono: ['"SF Mono"', '"Fira Code"', '"Fira Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0,0,0,0.06)',
        card: '0 2px 8px rgba(0,0,0,0.06)',
        elevated: '0 4px 16px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
