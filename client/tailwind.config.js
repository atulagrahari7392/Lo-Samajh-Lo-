/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6C63FF',
          'primary-dark': '#564ec9',
          'primary-light': '#8f88ff',
          secondary: '#FF6584',
          'secondary-dark': '#e04f6e',
          dark: '#1a1a2e',
          'dark-sidebar': '#141424',
          'dark-card': '#22223b',
          success: '#2ECC71',
          warning: '#F39C12',
          danger: '#E74C3C',
          bg: '#F8FAFC',
          card: '#FFFFFF',
          navy: '#0B2A63',
          royal: '#1D64D8',
          crimson: '#DC2626',
        }
      },
      fontFamily: {
        poppins: ['Poppins', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 20px 25px -5px rgba(108, 99, 255, 0.1), 0 10px 10px -5px rgba(108, 99, 255, 0.04)',
        'admin-card': '0 4px 20px 0 rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
}
