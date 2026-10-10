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

  test('日本語を描けるフォントがある', async ({ page }) => {
    // 日本語フォントのない環境(フォントを入れていないLinuxなど)では、日本語がすべて豆腐(□)で描かれ、文字の幅が読者の環境と変わる。
    // 文字の幅で決まる配置のテスト(「読者になる」の左隣に置くボタンなど)が数pxの差で失敗し、原因が分かりにくいので、ここで分かるようにする。
    // 豆腐はどの文字でも同じ形なので、別の2文字を描いて同じ画像になるかで見分ける。フォントはページによらないので、ブログは開かない
    const isTofu = await page.evaluate(() => {
      const draw = (/** @type {string} */ char) => {
        const canvas = document.createElement('canvas');
        const context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
        context.font = '64px sans-serif';
        context.fillText(char, 10, 100);
        return canvas.toDataURL();
      };
      return draw('読') === draw('者');
    });
    expect(isTofu, '日本語を描けるフォントがない。Linuxでは `sudo apt-get install fonts-noto-cjk` で入れる(development-workflow.md の「E2Eテスト」)').toBe(false);
  });
});
