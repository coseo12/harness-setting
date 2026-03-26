import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['__tests__/setup.ts'],
    environmentMatchGlobs: [
      ['__tests__/api/**', 'node'],
      ['__tests__/socket/**', 'node'],
    ],
    // API 테스트가 SQLite를 공유하므로 파일 병렬 실행 비활성화
    fileParallelism: false,
  },
});
