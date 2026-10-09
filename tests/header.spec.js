// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, SELECTORS, VIEWPORTS, TIMEOUTS } from './constants.js';

/**
 * ヘッダーのテスト (theme-design-spec.md の「ヘッダー」を参照)
 *
 * はてなのヘッダーメニューは動かさず(はてなのガイドライン)、その直下にブログのヘッダーを続け、
 * はてなの「読者になる」ボタンをブログのヘッダーの右端に置いて1つのヘッダーに見せる。
 */

const measure = (/** @type {any} */ page) => page.evaluate(() => {
  const rect = (/** @type {string} */ selector) => document.querySelector(selector)?.getBoundingClientRect().toJSON() ?? null;
  const display = (/** @type {string} */ selector) => {
    const el = document.querySelector(selector);
    return el ? getComputedStyle(el).display : null;
  };
  return {
    globalHeader: rect('#globalheader-container'),
    blogHeader: rect('#blog-title'),
    title: rect('#title a'),
    button: rect('.blog-controlls-subscribe-btn'),
    entry: rect('.entry'),
    viewport: document.documentElement.clientWidth,
    controllsTitle: display('.blog-controlls-title'),
    controllsIcon: display('.blog-controlls-blog-icon'),
  };
});

const VIEWPORT_CASES = {
  デスクトップ: VIEWPORTS.DESKTOP,
  タブレット: VIEWPORTS.SURFACE_PRO,
  スマートフォン: VIEWPORTS.MOBILE,
};

test.describe('ヘッダー', () => {
  for (const [name, viewport] of Object.entries(VIEWPORT_CASES)) {
    test(`はてなのヘッダーメニューの直下にブログのヘッダーが続き、読者になるボタンがその右端に並ぶ(${name})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
      await expect(page.locator(SELECTORS.SUBSCRIBE_BUTTON)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

      const m = await measure(page);
      expect(m.globalHeader, '前提: はてなのヘッダーメニューがあること').not.toBeNull();
      expect(m.button, '前提: 読者になるボタンがあること').not.toBeNull();
      if (!m.globalHeader || !m.blogHeader || !m.title || !m.button || !m.entry) return;

      // はてなのヘッダーメニューは最上部のまま動かさない
      expect(m.globalHeader.top).toBe(0);
      expect(m.globalHeader.height).toBeGreaterThan(0);
      // ブログのヘッダーは隙間なくその直下に続く
      expect(Math.abs(m.blogHeader.top - m.globalHeader.bottom)).toBeLessThanOrEqual(1);

      // ボタンはブログのヘッダーの帯の中にあり、タイトルと重ならない
      expect(m.button.top).toBeGreaterThanOrEqual(m.blogHeader.top);
      expect(m.button.bottom).toBeLessThanOrEqual(m.blogHeader.bottom);
      expect(m.button.left).toBeGreaterThanOrEqual(m.title.right);

      // ボタンの右端は記事のカードの右端に揃う。カードが画面幅いっぱいのスマホでは、カードの文字の右端に揃う
      const cardIsFullWidth = m.entry.width >= m.viewport - 1;
      const expectedRight = cardIsFullWidth ? m.viewport - 16 : m.entry.right;
      expect(Math.abs(m.button.right - expectedRight)).toBeLessThanOrEqual(1);

      // はてなが「読者になる」の帯に出すブログのアイコンとタイトルは、ヘッダーのタイトルと重複するので出さない
      expect(m.controllsTitle).toBe('none');
      expect(m.controllsIcon).toBe('none');
    });
  }

  test('ヘッダーメニューを表示しない設定(はてなブログPro)でも、ボタンはブログのヘッダーの帯の中に並ぶ', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.DESKTOP);
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.SUBSCRIBE_BUTTON)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

    // はてなはヘッダーメニューを消し、bodyに globalheader-off を付ける
    await page.evaluate(() => {
      document.querySelector('#globalheader-container')?.remove();
      document.body.classList.add('globalheader-off');
    });

    const m = await measure(page);
    if (!m.blogHeader || !m.button) throw new Error('ヘッダーか読者になるボタンが見つからない');
    expect(m.blogHeader.top).toBe(0);
    expect(m.button.top).toBeGreaterThanOrEqual(m.blogHeader.top);
    expect(m.button.bottom).toBeLessThanOrEqual(m.blogHeader.bottom);
  });

  // ヘッダーの下の余白は、続く要素の上の余白と相殺されるので、ページの作りによらず同じになる
  for (const [name, path, selector] of [
    ['記事ページ(パンくずの入ったカード)', TEST_URLS.SAMPLE_ARTICLE, '.breadcrumb'],
    ['トップページ(記事のカード)', TEST_URLS.HOME, '#main-inner .entry, #main-inner .archive-entry'],
    ['カテゴリのページ(パンくず)', '/archive/category/test', '.breadcrumb'],
  ]) {
    test(`ヘッダーとその下の間を、広い画面で48px、スマホで32px空ける(${name})`, async ({ page }) => {
      await page.navigateTo(path, { waitFor: 'networkidle' });
      await expect(page.locator(selector).first()).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

      // 余白はCSSだけで決まるので、1つのページで画面幅を変えて測る
      for (const [viewport, expected] of /** @type {const} */ ([[VIEWPORTS.SURFACE_PRO, 48], [VIEWPORTS.MOBILE, 32]])) {
        await page.setViewportSize(viewport);
        const gap = await page.evaluate((/** @type {string} */ selector) =>
          /** @type {Element} */ (document.querySelector(selector)).getBoundingClientRect().top
          - /** @type {Element} */ (document.getElementById('blog-title')).getBoundingClientRect().bottom, selector);
        expect(Math.round(gap), `${viewport.width}px`).toBe(expected);
      }
    });
  }
});
