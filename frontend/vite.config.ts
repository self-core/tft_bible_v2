import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Frontend development port
    proxy: {
      // Proxy GraphQL requests to the new simplified backend
      '/graphql': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy health check to the new simplified backend
      '/health': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      // Proxy image requests to the backend image cache
      '/api/images': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      }
    },
  },
})