/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#202a35',
        muted: '#78838d',
        line: '#e8ebed',
        canvas: '#f7f8f6',
        brand: '#d66c3c',
        'brand-dark': '#bd572d',
        green: '#278566',
        'green-soft': '#e8f4ef',
        'amber-soft': '#fbf2df',
        'red-soft': '#fae9e7',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 1px 3px rgba(27, 39, 49, 0.04), 0 1px 2px rgba(27, 39, 49, 0.02)',
        pop: '0 10px 30px rgba(27, 39, 49, 0.12)',
      },
    },
  },
  plugins: [],
}
