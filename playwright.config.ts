import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: 'html',
  retries: process.env.CI ? 2 : 0,
  testDir: './tests',
  use: {
    // Trailing slash matters: tests navigate with relative paths like './sheet/'.
    baseURL: 'http://localhost:4321/experiments/',
    trace: 'on-first-retry',
  },
  webServer: {
    // --ignore-lock keeps Astro from moving the server to the background when run by a coding agent.
    command: 'pnpm astro dev --ignore-lock',
    reuseExistingServer: !process.env.CI,
    stderr: 'pipe',
    stdout: 'pipe',
    url: 'http://localhost:4321/experiments/',
  },
  workers: process.env.CI ? 1 : undefined,
});
