// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, TIMEOUTS } from './constants.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * ダークモードの切り替えボタンのテスト (component-specs.md の「ダークモードの切り替え」、theme-design-spec.md の「ダークテーマ」を参照)
 *
 * js/dark-mode.js は、読者がライト・ダーク・自動(OSの設定)を選べるボタンをブログのヘッダーに置き、
 * 選んだモードを <html> の --swifty-color-mode に入れて記憶する。開発用ブログはheadでこのスクリプトを読み込む。
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const darkModeJs = fs.readFileSync(path.resolve(__dirname, '../js/dark-mode.js'), 'utf-8');

const STORAGE_KEY = 'swifty-color-mode';
// 開発用ブログのデザインCSSでモードを固定していても、書いていない状態(OSに合わせる)に戻す
const AUTO = ':root { --swifty-color-mode: initial; }';

const BUTTON = '.color-mode-toggle-button';
const MENU = '.color-mode-toggle-menu';
const option = (/** @type {string} */ mode) => `.color-mode-toggle-option[data-mode="${mode}"]`;

const openArticle = async (/** @type {any} */ page) => {
  await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
  await expect(page.locator(BUTTON)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });
  await page.addStyleTag({ content: AUTO });
};

/** ページが暗い背景に明るい文字で描かれているか */
const isDark = (/** @type {any} */ page) => page.evaluate(() => {
  const luminance = (/** @type {string} */ rgb) => {
    const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const body = getComputedStyle(document.body);
  return luminance(body.backgroundColor) < luminance(body.color);
});

const state = (/** @type {any} */ page) => page.evaluate((key) => ({
  label: document.querySelector('.color-mode-toggle-button')?.getAttribute('aria-label'),
  expanded: document.querySelector('.color-mode-toggle-button')?.getAttribute('aria-expanded'),
  pressed: [...document.querySelectorAll('.color-mode-toggle-option')]
    .filter((o) => o.getAttribute('aria-pressed') === 'true')
    .map((o) => o.getAttribute('data-mode')),
  inline: document.documentElement.style.getPropertyValue('--swifty-color-mode'),
  stored: (() => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return 'unavailable';
    }
  })(),
}), STORAGE_KEY);

const choose = async (/** @type {any} */ page, /** @type {string} */ mode) => {
  await page.locator(BUTTON).click();
  await page.locator(option(mode)).click();
};

test.describe('ダークモードの切り替え(js/dark-mode.js)', () => {
  test('ブログのヘッダーの「読者になる」の左隣に、表示モードのボタンを置く', async ({ page }) => {
    await openArticle(page);

    const layout = await page.evaluate(() => {
      const rect = (/** @type {string} */ selector) => /** @type {Element} */ (document.querySelector(selector)).getBoundingClientRect().toJSON();
      return {
        button: rect('.color-mode-toggle-button'),
        subscribe: rect('.blog-controlls-subscribe-btn'),
        title: rect('#blog-title-content'),
        // タイトルの後にあり、Tabキーではタイトルの次に移る
        afterTitle: Boolean(document.querySelector('#blog-title-content ~ .color-mode-toggle')),
      };
    });

    // 「読者になる」の左に13px離して、同じ高さで並べる
    expect(Math.round(layout.subscribe.left - layout.button.right)).toBe(13);
    expect(layout.button.top).toBeCloseTo(layout.subscribe.top, 0);
    expect(layout.button.height).toBeCloseTo(layout.subscribe.height, 0);
    // タイトルとは重ならない
    expect(layout.title.right).toBeLessThanOrEqual(layout.button.left);
    expect(layout.afterTitle).toBe(true);
    await expect(page.locator(BUTTON)).toHaveAccessibleName('表示モード: 自動');

    // スクリプトを何度実行してもボタンは1つ
    await page.evaluate(darkModeJs);
    await expect(page.locator('.color-mode-toggle')).toHaveCount(1);
  });

  test('選んだモードをページ全体に適用し、記憶して次のページでも使う', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await openArticle(page);
    expect(await state(page)).toMatchObject({ label: '表示モード: 自動', pressed: ['auto'], inline: '' });

    await page.locator(BUTTON).click();
    await expect(page.locator(MENU)).toBeVisible();
    expect((await state(page)).expanded).toBe('true');
    await page.locator(option('dark')).click();

    // 選ぶとメニューを閉じ、ボタンにフォーカスを戻す
    await expect(page.locator(MENU)).toBeHidden();
    await expect(page.locator(BUTTON)).toBeFocused();
    expect(await state(page)).toMatchObject({ label: '表示モード: ダーク', pressed: ['dark'], inline: 'dark', stored: 'dark' });
    expect(await isDark(page)).toBe(true);

    // 次のページでも記憶したモードで表示する
    await openArticle(page);
    expect(await state(page)).toMatchObject({ label: '表示モード: ダーク', inline: 'dark' });
    expect(await isDark(page)).toBe(true);

    // 自動に戻すと、OSの設定(ライト)に合わせる
    await choose(page, 'auto');
    expect(await state(page)).toMatchObject({ label: '表示モード: 自動', inline: '', stored: 'auto' });
    expect(await isDark(page)).toBe(false);
  });

  test('ライトを選ぶと、OSがダークモードでもライトにする', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openArticle(page);
    expect(await isDark(page)).toBe(true);

    await choose(page, 'light');
    expect(await isDark(page)).toBe(false);
  });

  test('読者が選んだモードは、ブログのデザインCSSの指定より優先する。自動に戻すとブログの指定に従う', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openArticle(page);
    // ブログ主が「常にライト」にしている
    await page.addStyleTag({ content: ':root { --swifty-color-mode: light; }' });
    expect(await isDark(page)).toBe(false);

    await choose(page, 'dark');
    expect(await isDark(page)).toBe(true);
    await choose(page, 'auto');
    expect(await isDark(page)).toBe(false);
  });

  test('記憶したモードは、最初に描くときから使う', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript((key) => {
      try {
        localStorage.setItem(key, 'dark');
      } catch (e) {
        // ignore
      }
      // 描くフレームごとに、本文が描かれていればページの明るさを記録する
      const frames = /** @type {string[]} */ ([]);
      /** @type {any} */ (window).colorFrames = frames;
      const sample = () => {
        if (document.body && document.querySelector('.entry-content')) {
          const style = getComputedStyle(document.body);
          const value = (/** @type {string} */ rgb) => (rgb.match(/\d+/g) || []).slice(0, 3).map(Number).reduce((a, b) => a + b, 0);
          const state = value(style.backgroundColor) < value(style.color) ? 'dark' : 'light';
          if (frames[frames.length - 1] !== state) frames.push(state);
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }, STORAGE_KEY);
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await page.addStyleTag({ content: AUTO });

    // 開発用ブログはheadでスクリプトを読み込むので、本文が描かれる前に記憶したモードが入っている
    expect(await page.evaluate(() => /** @type {any} */ (window).colorFrames)).toEqual(['dark']);
  });

  test('キーボードで開け閉めでき、Escapeで閉じてボタンに戻る。外を押しても閉じる', async ({ page }) => {
    await openArticle(page);

    await page.locator(BUTTON).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator(MENU)).toBeVisible();
    // メニューはボタンの直後にあり、Tabキーで選択肢に移れる
    await page.keyboard.press('Tab');
    await expect(page.locator(option('light'))).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator(MENU)).toBeHidden();
    await expect(page.locator(BUTTON)).toBeFocused();

    await page.locator(BUTTON).click();
    await expect(page.locator(MENU)).toBeVisible();
    await page.locator('.entry-content p').first().click();
    await expect(page.locator(MENU)).toBeHidden();
  });

  test('記憶できない環境でも選べる', async ({ page }) => {
    await page.addInitScript((key) => {
      const getItem = Storage.prototype.getItem;
      const setItem = Storage.prototype.setItem;
      Storage.prototype.getItem = function (/** @type {string} */ name) {
        if (name === key) throw new Error('blocked');
        return getItem.call(this, name);
      };
      Storage.prototype.setItem = function (/** @type {string} */ name, /** @type {string} */ value) {
        if (name === key) throw new Error('blocked');
        return setItem.call(this, name, value);
      };
    }, STORAGE_KEY);
    await page.emulateMedia({ colorScheme: 'light' });
    await openArticle(page);

    await choose(page, 'dark');
    expect(await isDark(page)).toBe(true);
  });

  // 印刷でボタンを出さないことは print.spec.js の「操作専用のUI」で確かめる
});
