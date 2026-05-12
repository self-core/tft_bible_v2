import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ViteDevServer } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true,
    hmr: {
      port: 3001,
    },
    host: 'localhost',
    proxy: {
      // Mock API endpoints
      '/graphql': {
        target: 'http://localhost:4000', // New simplified backend
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(''),
  },
  build: {
    outDir: 'dist',
  },
});