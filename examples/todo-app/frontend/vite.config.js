import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    // BE API 프록시 — 통합 시 CORS 문제 방지
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
