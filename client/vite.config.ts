import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for embedding
  server: {
    proxy: {
      // Forward /api requests to your backend server
      '/api': {
        target: 'http://localhost:3000', // Change this to your backend server port
        changeOrigin: true,
      }
    }
  }
})
