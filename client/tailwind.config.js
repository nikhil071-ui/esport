export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom Esports Palette
        esports: {
          dark: '#0a0a0f',
          card: '#15151e',
          primary: '#8b5cf6', // Violet
          accent: '#10b981',  // Emerald Green
          danger: '#ef4444',  // Red
        }
      }
    },
  },
  plugins: [],
}