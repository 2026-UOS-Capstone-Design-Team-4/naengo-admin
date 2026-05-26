import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  server: {
    proxy: {
      '/auth-api': {
        target: 'https://api.naengo.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/auth-api/, '/api/v1'),
      },
      '/api': {
        target: 'http://3.34.187.42:8000',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
    },
  },
});
