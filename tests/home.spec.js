// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, SELECTORS } from './constants.js';

test.describe('ホームページのテスト', () => {
  test('トップページが正しくレンダリングされる', async ({ page }) => {
    await page.navigateTo(TEST_URLS.HOME, { waitFor: 'networkidle' });

    await page.screenshot({ path: 'screenshots/home-page.png', fullPage: true });

    // 基本的なページ要素が存在することを確認
    await expect(page.locator(SELECTORS.BLOG_TITLE)).toBeVisible();
    await expect(page.locator(SELECTORS.CONTAINER)).toBeVisible();
    await expect(page.locator(SELECTORS.MAIN)).toBeVisible();
  });

  test('開発サーバーのテーマCSSが読み込まれている', async ({ page }) => {
    await page.navigateTo(TEST_URLS.HOME, { waitFor: 'networkidle' });

    // 開発サーバーが起動していない、または開発用ブログのhead設定が違うと、以降のテストはすべてはてな既定の見た目を測ってしまう。
    // その場合にここで原因が分かるよう、テーマのCSS変数が効いているかを見る
    const background = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--background'));
    expect(background, 'テーマCSSが読み込まれていない。`npm start` と開発用ブログのhead設定(README.md)を確認する').not.toBe('');
  });
});
