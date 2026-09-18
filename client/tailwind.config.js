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
          dark: '#0B1F4A',
          'dark-sidebar': '#091733',
          'dark-card': '#0F2456',
          success: '#2ECC71',
          warning: '#D97706',
          danger: '#DC2626',
          bg: '#F0F4FF',
          card: '#FFFFFF',
          navy: '#0B2A63',
          'navy-light': '#1a3a6e',
          'navy-dark': '#061530',
          royal: '#1D4ED8',
          crimson: '#DC2626',
          'crimson-dark': '#991B1B',
          gold: '#D97706',
          'gold-light': '#F59E0B',
        }
      },
      fontFamily: {
        poppins: ['Poppins', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 20px 25px -5px rgba(11, 42, 99, 0.15), 0 10px 10px -5px rgba(220, 38, 38, 0.08)',
        'admin-card': '0 4px 20px 0 rgba(0,0,0,0.05)',
        'navy-glow': '0 0 30px rgba(11, 42, 99, 0.3), 0 4px 20px rgba(11, 42, 99, 0.2)',
        'red-glow': '0 0 20px rgba(220, 38, 38, 0.4), 0 4px 12px rgba(220, 38, 38, 0.25)',
        'gold-glow': '0 0 20px rgba(217, 119, 6, 0.35)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out both',
        'fade-in': 'fadeIn 0.5s ease-out both',
        'slide-in-left': 'slideInLeft 0.5s ease-out both',
        'slide-in-right': 'slideInRight 0.5s ease-out both',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'marquee': 'marquee 35s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'bounce-slow': 'bounce 2.5s infinite',
        'spin-slow': 'spin 8s linear infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(220, 38, 38, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(220, 38, 38, 0.6)' },
        },
      },
      backgroundSize: {
        '200': '200% 200%',
        '300': '300% 300%',
      },
    },
  },
  plugins: [],
}
