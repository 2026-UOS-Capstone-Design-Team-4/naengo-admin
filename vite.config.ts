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
        target:
          'http://naengo-api-server-alb-176175450.ap-northeast-2.elb.amazonaws.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/auth-api/, '/api/v1'),
      },
    },
    watch: {
      usePolling: true,
    },
  },
});
