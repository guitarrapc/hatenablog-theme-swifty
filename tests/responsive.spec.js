// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, SELECTORS, VIEWPORTS, TIMEOUTS } from './constants.js';

/** ページ全体が横にはみ出していないか(横スクロールが出ていないか)を測る */
const horizontalOverflow = (/** @type {any} */ page) => page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe('レスポンシブデザインのテスト', () => {
  for (const [name, viewport] of Object.entries({
    デスクトップ: VIEWPORTS.DESKTOP,
    タブレット: VIEWPORTS.TABLET,
    スマートフォン: VIEWPORTS.MOBILE,
  })) {
    test(`${name}でのレイアウト確認`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.navigateTo(TEST_URLS.HOME, { waitFor: 'networkidle' });
      await page.waitForTimeout(TIMEOUTS.MEDIUM);

      await page.screenshot({ path: `screenshots/responsive-${viewport.width}.png`, fullPage: true });

      await expect(page.locator(SELECTORS.CONTAINER)).toBeAttached();
      await expect(page.locator(SELECTORS.MAIN)).toBeAttached();
      expect(await horizontalOverflow(page), '横スクロールが発生している').toBeLessThanOrEqual(0);
    });
  }

  // 目次を本文中に置く幅(1024px)と横に置く幅(1440px)のどちらでも、本文は上限(--content-max)まで広がる。
  // 目次を横に出す幅を下げたり、目次や余白を広げたりすると本文が狭くなる(theme-design-spec.md の「レイアウト」を参照)
  for (const width of [1024, 1440]) {
    test(`本文は上限の幅まで広がる(${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
      await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();

      const result = await page.evaluate(() => ({
        text: document.querySelector('.entry-content > p')?.getBoundingClientRect().width,
        contentMax: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--content-max')),
      }));
      expect(result.text).toBeCloseTo(result.contentMax, 0);
    });
  }

  test('スマートフォンでの記事ページ確認', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.MOBILE_STANDARD);
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    await page.screenshot({ path: 'screenshots/responsive-smartphone-article.png', fullPage: true });

    await expect(page.locator(SELECTORS.ENTRY_TITLE)).toBeAttached();
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeAttached();
    expect(await horizontalOverflow(page), '横スクロールが発生している').toBeLessThanOrEqual(0);
  });
});
