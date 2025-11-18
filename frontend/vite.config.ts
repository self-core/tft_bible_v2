import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Changed back to default Vite port
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => {
          // Remove the /api/v1/ prefix for json-server
          return path.replace(/^\/api\/v1/, '');
        }
      },
    },
  },
})