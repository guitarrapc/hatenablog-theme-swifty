// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, SELECTORS } from './constants.js';

test.describe('記事ページのテスト', () => {
  test('記事ページが正しくレンダリングされる', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });

    await page.screenshot({ path: 'screenshots/article-page.png', fullPage: true });

    // 基本的な記事要素が存在することを確認
    await expect(page.locator(SELECTORS.ENTRY_TITLE)).toBeVisible();
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();
    await expect(page.locator(SELECTORS.ENTRY_DATE)).toBeVisible();
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
