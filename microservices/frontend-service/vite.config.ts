import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Frontend development port
    proxy: {
      // Proxy API requests to the gateway API
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Use the original path as is for the gateway which has proper service discovery
      },
      // Proxy GraphQL requests to the gateway API
      '/graphql': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      // Proxy other API endpoints as needed
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    },
  },
})