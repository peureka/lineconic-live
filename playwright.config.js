import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
  },
  webServer: {
    command: 'npx serve . -l 8080 -s',
    port: 8080,
    reuseExistingServer: true,
  },
});
