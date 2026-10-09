// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS } from './constants.js';

// トップページの表示は responsive.spec.js の「レイアウト確認」で、画面幅ごとに確かめる
test.describe('ホームページのテスト', () => {
  test('開発サーバーのテーマCSSが読み込まれている', async ({ page }) => {
    await page.navigateTo(TEST_URLS.HOME, { waitFor: 'networkidle' });

    // 開発サーバーが起動していない、または開発用ブログのhead設定が違うと、以降のテストはすべてはてな既定の見た目を測ってしまう。
    // その場合にここで原因が分かるよう、テーマのCSS変数が効いているかを見る
    const background = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--background'));
    expect(background, 'テーマCSSが読み込まれていない。`npm start` と開発用ブログのhead設定(README.md)を確認する').not.toBe('');
  });
});
