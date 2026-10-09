// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, SELECTORS, VIEWPORTS, TIMEOUTS } from './constants.js';

/**
 * ヘッダーのテスト (theme-design-spec.md の「ヘッダー」を参照)
 *
 * はてなのヘッダーメニューは動かさず(はてなのガイドライン)、その直下にブログのヘッダーを続け、
 * はてなの「読者になる」ボタンをブログのヘッダーの右端に置いて1つのヘッダーに見せる。
 * スマホでは、ボタンをタイトルの右ではなく、タイトルの下の説明の行の右に置く。
 */

/** 2つの矩形が重なるか */
const intersects = (/** @type {DOMRect} */ a, /** @type {DOMRect} */ b) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

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
    description: rect('#blog-description'),
    button: rect('.blog-controlls-subscribe-btn'),
    toggle: rect('.color-mode-toggle-button'),
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

      // ボタンはブログのヘッダーの帯の中にあり、タイトルと重ならない(スマホではタイトルの下の説明の行にある)
      expect(m.button.top).toBeGreaterThanOrEqual(m.blogHeader.top);
      expect(m.button.bottom).toBeLessThanOrEqual(m.blogHeader.bottom);
      expect(intersects(m.button, m.title)).toBe(false);

      // ボタンの右端は記事のカードの右端に揃う。カードが画面幅いっぱいのスマホでは、カードの文字の右端に揃う
      const cardIsFullWidth = m.entry.width >= m.viewport - 1;
      const expectedRight = cardIsFullWidth ? m.viewport - 16 : m.entry.right;
      expect(Math.abs(m.button.right - expectedRight)).toBeLessThanOrEqual(1);

      // はてなが「読者になる」の帯に出すブログのアイコンとタイトルは、ヘッダーのタイトルと重複するので出さない
      expect(m.controllsTitle).toBe('none');
      expect(m.controllsIcon).toBe('none');
    });
  }

  test('スマホでは、ボタンをタイトルの下の説明の行の右に置き、タイトルには幅いっぱいを使わせる', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.MOBILE);
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.SUBSCRIBE_BUTTON)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });
    await expect(page.locator('.color-mode-toggle-button'), '前提: 開発用ブログのheadにjs/dark-mode.jsがあること').toBeVisible();
    // 長いタイトルと説明でも、ボタンがタイトルの下に付いていき、説明がボタンの左で折り返すことを確かめる
    await page.evaluate(() => {
      /** @type {Element} */ (document.querySelector('#title a')).textContent = 'ゆるく続けるエンジニアの技術メモと日々の記録とときどき料理';
      /** @type {Element} */ (document.querySelector('#blog-description')).textContent = 'クラウドとゲーム開発まわりの技術メモ。ときどき料理と旅行の記録も書きます。';
    });

    const m = await measure(page);
    if (!m.blogHeader || !m.title || !m.description || !m.button || !m.toggle) throw new Error('ヘッダーの要素が見つからない');
    const descriptionText = await page.evaluate(() => {
      const range = document.createRange();
      range.selectNodeContents(/** @type {Element} */ (document.querySelector('#blog-description')));
      const lines = [...range.getClientRects()];
      return { right: Math.max(...lines.map((line) => line.right)), firstLineMiddle: (lines[0].top + lines[0].bottom) / 2 };
    });

    // タイトルはボタンのぶん空けずに、画面の右の余白(16px)の手前まで使う
    expect(m.title.right).toBeGreaterThan(m.toggle.left);
    expect(m.title.right).toBeLessThanOrEqual(m.viewport - 16);
    // ボタンはタイトルの下の説明の行に同じ高さで並び、説明の1行目と上下中央で揃う
    expect(m.toggle.top).toBeGreaterThanOrEqual(m.title.bottom);
    expect(m.button.top).toBeCloseTo(m.toggle.top, 0);
    expect(m.button.height).toBeCloseTo(m.toggle.height, 0);
    expect((m.button.top + m.button.bottom) / 2).toBeCloseTo(descriptionText.firstLineMiddle, 0);
    // 説明はボタンの左で折り返す
    expect(descriptionText.right).toBeLessThanOrEqual(m.toggle.left);
    // 右寄せで、表示モードのボタンは「読者になる」の左隣
    expect(m.button.right).toBeCloseTo(m.viewport - 16, 0);
    expect(Math.round(m.button.left - m.toggle.right)).toBe(13);
    // ボタンも説明もヘッダーの帯の中
    expect(m.blogHeader.bottom - 1 - Math.max(m.button.bottom, m.description.bottom)).toBeCloseTo(12, 0);
  });

  for (const [name, change] of /** @type {const} */ ([
    ['説明がない', 'remove'],
    ['説明が空', 'empty'],
  ])) {
    test(`スマホで${name}ブログでも、ボタンはヘッダーの帯の中に並ぶ`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.MOBILE);
      await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
      await expect(page.locator(SELECTORS.SUBSCRIBE_BUTTON)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });
      await page.evaluate((/** @type {string} */ change) => {
        const description = /** @type {Element} */ (document.querySelector('#blog-description'));
        if (change === 'remove') description.remove();
        else description.textContent = '';
      }, change);

      const m = await measure(page);
      if (!m.blogHeader || !m.title || !m.button) throw new Error('ヘッダーの要素が見つからない');
      expect(m.button.top).toBeGreaterThanOrEqual(m.title.bottom);
      expect(m.blogHeader.bottom - 1 - m.button.bottom).toBeCloseTo(12, 0);
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
    ['記事ページ(記事のカード)', TEST_URLS.SAMPLE_ARTICLE, '#main-inner > .entry'],
    ['トップページ(記事の一覧のカード)', TEST_URLS.HOME, '#main-inner .entry, #main-inner .archive-entries'],
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
