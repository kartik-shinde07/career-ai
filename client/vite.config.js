// imports for vite and react plugin below this code block
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// vite configuration object export below this code block
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
