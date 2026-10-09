// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, FIXTURE_URLS, SELECTORS, VIEWPORTS, TIMEOUTS } from './constants.js';

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

    await page.screenshot({ path: 'screenshots/responsive-smartphone-article.png', fullPage: true });

    await expect(page.locator(SELECTORS.ENTRY_TITLE)).toBeAttached();
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeAttached();
    expect(await horizontalOverflow(page), '横スクロールが発生している').toBeLessThanOrEqual(0);
  });
  // Fixture記事のはみ出しやすい要素(長いタイトル、区切りのない文字列、表、長い行のコード、数式、画像)で確かめる。
  // Fixtureのカテゴリのページでは、記事の一覧に並ぶ長いタイトルとカテゴリを確かめる。
  // 本文の幅がいちばん狭く、はみ出しやすいスマートフォンの幅で測る
  for (const [name, path] of Object.entries({ ...FIXTURE_URLS, CATEGORY: '/archive/category/Fixture' })) {
    test(`記事が横にはみ出さない(Fixture: ${name})`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.MOBILE);
      await page.navigateTo(path, { waitFor: 'networkidle' });
      await expect(page.locator(SELECTORS.MAIN)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });
      // 後回しにしている本文は仮の大きさなので、描いてから測る
      await page.addStyleTag({ content: '.entry-content > * { content-visibility: visible !important; }' });

      // はみ出した要素を、横スクロールする枠の中のものを除いて挙げる(失敗したときの手がかり)
      const offenders = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.right <= document.documentElement.clientWidth + 0.5) return false;
        for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
          if (getComputedStyle(parent).overflowX !== 'visible') return false;
        }
        return true;
      }).slice(0, 5).map((el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).join('.')}` : ''}`));
      expect(await horizontalOverflow(page), `横スクロールが発生している: ${offenders.join(', ')}`).toBeLessThanOrEqual(0);
    });
  }
});
