import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ViteDevServer } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Mock API endpoints
      '/api': {
        target: 'http://localhost:8080', // This will be where your mock API runs
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});