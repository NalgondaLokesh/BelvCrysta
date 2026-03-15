/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'neon-pink': '#ec4899',
        'neon-purple': '#a855f7',
        'neon-cyan': '#06b6d4',
        'neon-green': '#10b981',
        'neon-dark': '#0f0f23',
        'neon-darker': '#0a0a0f',
        'neon-light': '#1a1a2e'
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
        'neon-gradient-light': 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
        'neon-hero': 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #ec4899 100%)',
        'neon-glow': 'linear-gradient(135deg, #a855f7 0%, #06b6d4 50%, #10b981 100%)'
      },
      boxShadow: {
        'neon-pink': '0 0 10px rgba(236, 72, 153, 0.3), 0 0 20px rgba(236, 72, 153, 0.1)',
        'neon-purple': '0 0 10px rgba(168, 85, 247, 0.3), 0 0 20px rgba(168, 85, 247, 0.1)',
        'neon-cyan': '0 0 10px rgba(6, 182, 212, 0.3), 0 0 20px rgba(6, 182, 212, 0.1)',
        'neon-green': '0 0 10px rgba(16, 185, 129, 0.3), 0 0 20px rgba(16, 185, 129, 0.1)'
      },
      animation: {
        'neon-pulse': 'neonPulse 2s ease-in-out infinite',
        'neon-float': 'neonFloat 3s ease-in-out infinite',
        'neon-glow': 'neonGlow 3s ease-in-out infinite alternate'
      },
      keyframes: {
        neonPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        neonFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        neonGlow: {
          '0%': { filter: 'brightness(1)' },
          '100%': { filter: 'brightness(1.2)' }
        }
      }
    },
  },
  plugins: [],
};
