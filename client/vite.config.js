import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'ws://localhost:5000',
        ws: true,
      },
    },
  },
  define: {
    'process.env': {
      VITE_BACKEND_URL: 'http://localhost:5000',
      VITE_WS_URL: 'ws://localhost:5000',
    },
  },
});
