import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3030',
    viewport: { width: 1400, height: 900 },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx next start -p 3030',
    port: 3030,
    reuseExistingServer: true,
  },
});
