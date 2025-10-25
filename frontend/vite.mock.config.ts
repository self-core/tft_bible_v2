import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ViteDevServer } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    hmr: {
      port: 3000,
    },
    proxy: {
      // Mock API endpoints
      '/api': {
        target: 'http://localhost:8080', // This will be where your mock API runs
        changeOrigin: true,
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