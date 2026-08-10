import { defineConfig, devices } from '@playwright/test';

/**
 * 프로덕션 빌드를 그대로 띄워서 검사한다 (GitHub Pages와 같은 base 경로).
 * 브라우저는 이미 설치된 Chromium을 쓴다 — playwright install 을 실행하지 않는다.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173/english_study/',
    trace: 'off',
    launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite preview --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173/english_study/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
