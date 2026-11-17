/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0B0D14',
          800: '#111422',
          700: '#181C30',
          600: '#232842',
        },
        brand: {
          purple: '#8B5CF6',
          purpleLight: '#A78BFA',
          emerald: '#10B981',
          emeraldLight: '#34D399',
          pink: '#EC4899',
        }
      }
    },
  },
  plugins: [],
}
