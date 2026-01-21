import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // We manually define the keys here to bypass the .env file issue
  define: {
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify("AIzaSyAqyWF8kdtZCaMdd0_BBiqoC1qAkV0qHqM"),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify("esport-9f082.firebaseapp.com"),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify("esport-9f082"),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify("esport-9f082.firebasestorage.app"),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify("9417244729"),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify("1:9417244729:web:5092d3e46674a3bdedcde8"),
  }
})