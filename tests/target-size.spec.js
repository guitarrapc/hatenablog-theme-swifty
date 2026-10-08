// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, TIMEOUTS } from './constants.js';

/**
 * タップ領域(WCAG 2.5.8)のテスト (theme-design-spec.md の「タップ領域」を参照)
 *
 * 小さい文字のリンクは高さが24pxに届きにくい。テーマで高さを確保している要素を測る。
 */

const MIN_TARGET = 24;

const TARGETS = {
  読者になるボタン: '.blog-controlls-subscribe-btn',
  記事のカテゴリ: '.entry-categories a',
  コメントを書く: '.leave-comment-title',
  ページャー: '.pager a',
  カテゴリのブログパーツ: '.hatena-module-category .hatena-urllist a',
  ブログパーツの日付: '.hatena-urllist .urllist-date-link a',
  月別アーカイブの年: '.archive-module-year-title',
};

test.describe('タップ領域', () => {
  test('小さい文字のリンクやボタンも高さ24px以上ある', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator('#box2').first()).toBeAttached({ timeout: TIMEOUTS.VERY_LONG });
    // ブログパーツは画面外にある間は描かれない(描画の後回し)ので、測れるようにする
    await page.addStyleTag({ content: '#box2 { content-visibility: visible !important; }' });

    const measured = await page.evaluate((targets) => Object.fromEntries(Object.entries(targets).map(([name, selector]) => {
      const heights = [...document.querySelectorAll(selector)]
        .map((el) => el.getBoundingClientRect())
        .filter((rect) => rect.width > 0)
        .map((rect) => Math.round(rect.height * 10) / 10);
      return [name, heights];
    })), TARGETS);

    for (const [name, heights] of Object.entries(measured)) {
      expect(heights.length, `${name} が見つからない。テストデータかセレクタを確認する`).toBeGreaterThan(0);
      expect(Math.min(...heights), `${name} の高さ: ${heights.join(', ')}`).toBeGreaterThanOrEqual(MIN_TARGET);
    }
  });
});
