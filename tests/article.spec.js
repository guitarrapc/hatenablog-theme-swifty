// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, SELECTORS, VIEWPORTS } from './constants.js';

test.describe('記事ページのテスト', () => {
  test('記事ページが正しくレンダリングされる', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });

    await page.screenshot({ path: 'screenshots/article-page.png', fullPage: true });

    // 基本的な記事要素が存在することを確認
    await expect(page.locator(SELECTORS.ENTRY_TITLE)).toBeVisible();
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();
    await expect(page.locator(SELECTORS.ENTRY_DATE)).toBeVisible();
  });

  test('本文中の箱の角丸は記事のカードと揃え、画像は小さくする', async ({ page }) => {
    // カードに角丸があり、目次が本文中に箱として出る幅で測る
    await page.setViewportSize(VIEWPORTS.BELOW_SIDE_TOC);
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();

    const radii = await page.evaluate(() => {
      const radius = (/** @type {string} */ selector, corner = 'borderTopRightRadius') => {
        const el = document.querySelector(selector);
        return el ? /** @type {any} */ (getComputedStyle(el))[corner] : null;
      };
      return {
        card: radius('.entry'),
        boxes: {
          コードブロック: radius('.entry-content pre.code'),
          アラート: radius('.entry-content .markdown-alert'),
          // 引用は左に線があるので右の角だけ丸める
          引用: radius('.entry-content > blockquote:not(.markdown-alert)'),
          折りたたみ: radius('.entry-content details'),
          目次: radius('.entry-content > :is(.table-of-contents, .toc-panel)'),
        },
        quoteLeft: radius('.entry-content > blockquote:not(.markdown-alert)', 'borderTopLeftRadius'),
        image: radius('.entry-content img.hatena-fotolife'),
      };
    });

    expect(radii.card, '前提: カードに角丸があること').not.toBe('0px');
    for (const [name, value] of Object.entries(radii.boxes)) {
      expect(value, `${name}が見つからない`).not.toBeNull();
      expect(value, `${name}の角丸`).toBe(radii.card);
    }
    expect(radii.quoteLeft).toBe('0px');
    // 画像は角丸を大きくすると画像の隅が欠けるので、カードより小さくする
    expect(parseFloat(radii.image ?? '0')).toBeLessThan(parseFloat(radii.card));
  });

  test('アバウトページが正しくレンダリングされる', async ({ page }) => {
    await page.navigateTo(TEST_URLS.ABOUT, { waitFor: 'networkidle' });

    await page.screenshot({ path: 'screenshots/about-page.png', fullPage: true });

    await expect(page.locator('.page-about')).toBeVisible();
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();
  });
});

test.describe('アーカイブページのテスト', () => {
  test('アーカイブページが正しくレンダリングされる', async ({ page }) => {
    await page.navigateTo(TEST_URLS.ARCHIVE, { waitFor: 'networkidle' });

    await page.screenshot({ path: 'screenshots/archive-page.png', fullPage: true });

    await expect(page.locator(SELECTORS.PAGE_ARCHIVE)).toBeVisible();
    await expect(page.locator(SELECTORS.ARCHIVE_ENTRIES)).toBeVisible();
    expect(await page.locator(SELECTORS.ARCHIVE_ENTRY).count()).toBeGreaterThan(0);
  });
});
