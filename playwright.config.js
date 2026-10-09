import { defineConfig } from '@playwright/test';
import { BLOG_URL } from './blog.config.js';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  // テスト全体のタイムアウト。helpers.jsのnavigateToが1回20秒のナビゲーションを3回試せるよう90秒にする
  timeout: 90 * 1000,
  expect: {
    timeout: 10000 // 期待値の検証タイムアウトを10秒に拡張
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1, // テストの失敗時に再試行する回数を増やす
  workers: process.env.CI ? 1 : undefined,
  use: {
    actionTimeout: 30000, // アクションタイムアウトを30秒に設定
    baseURL: BLOG_URL,
    trace: 'on-first-retry', // 失敗してやり直すときだけトレースを取得
    screenshot: 'only-on-failure', // 失敗時のみスクリーンショットを取得
  },
  reporter: [
    ['html'],
    ['list']
  ],
  // 画面幅で見た目が変わることは、テストの中で幅を指定して確かめる(tests/constants.js の VIEWPORTS)。
  // 幅ごとのプロジェクトに分けると、幅に関係のないテストまで同じことを幅の数だけ繰り返す
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 912, height: 1368 }, // Surface Pro7の解像度
      },
    },
  ],
});
