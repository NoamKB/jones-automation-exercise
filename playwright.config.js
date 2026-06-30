// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'https://test.netlify.app',
    trace: 'on-first-retry',
    // set SLOWMO (ms) to slow each action down when watching with --headed,
    // e.g. SLOWMO=800 npx playwright test --headed
    launchOptions: { slowMo: Number(process.env.SLOWMO) || 0 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
