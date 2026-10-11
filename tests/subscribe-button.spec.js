// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, SELECTORS, VIEWPORTS, TIMEOUTS } from './constants.js';

/**
 * ヘッダーメニューを表示しないときの「読者になる」ボタンのテスト (theme-design-spec.md の「ヘッダー」の「ヘッダーメニューを表示しないとき」を参照)
 *
 * はてなブログProの「ブログにヘッダを表示しない」では、はてなはヘッダーメニューを隠し(body.globalheader-off)、
 * テーマがブログのヘッダーに置く「読者になる」(.blog-controlls)も出力しない。
 * 代わりに、はてなが出力するのと同じHTML(リンク先はブログの購読ページ)を「ブログタイトル下」に貼ってもらい、テーマのCSSが同じ場所に同じ形で置く。
 *
 * 開発用ブログの設定(ヘッダーメニューの表示、タイトル下のHTML)はブログ主にしか変えられないので、
 * はてなの出力をDOMで「表示しない」の状態にし、タイトル下(#top-editarea)に案内しているHTMLをそのまま入れて確かめる
 */

/**
 * はてなの「ブログにヘッダを表示しない」の出力にし(ヘッダーメニューを隠し、「読者になる」を消し、bodyに globalheader-off を付ける)、
 * タイトル下に README の「ヘッダを表示しないときの「読者になる」ボタン」のHTMLを貼る
 */
const setUp = (/** @type {any} */ page) => page.evaluate(() => {
  const globalHeader = document.getElementById('globalheader-container');
  if (globalHeader) globalHeader.style.display = 'none';
  document.querySelectorAll('.blog-controlls').forEach((el) => el.remove());
  document.body.classList.add('globalheader-off');

  const root = document.documentElement;
  const href = `${root.getAttribute('data-admin-origin')}/${root.getAttribute('data-author')}/${root.getAttribute('data-blog-host')}/subscribe`;
  let area = document.getElementById('top-editarea');
  if (!area) {
    area = document.createElement('div');
    area.id = 'top-editarea';
    /** @type {Element} */ (document.getElementById('blog-title')).after(area);
  }
  area.insertAdjacentHTML('beforeend', `<nav class="blog-controlls"><a class="blog-controlls-subscribe-btn" href="${href}">読者になる</a></nav>`);
  return href;
});

const open = async (/** @type {any} */ page, /** @type {{ width: number, height: number }} */ viewport) => {
  await page.setViewportSize(viewport);
  await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
  await expect(page.locator(SELECTORS.BLOG_HEADER)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });
  await expect(page.locator('.color-mode-toggle-button'), '前提: 開発用ブログのheadにjs/dark-mode.jsがあること').toBeVisible();
  const href = await setUp(page);
  await expect(page.locator(SELECTORS.SUBSCRIBE_BUTTON)).toBeVisible();
  return href;
};

const measure = (/** @type {any} */ page) => page.evaluate(() => {
  const rect = (/** @type {string} */ selector) => document.querySelector(selector)?.getBoundingClientRect().toJSON() ?? null;
  const button = document.querySelector('.blog-controlls-subscribe-btn');
  const controlls = document.querySelector('#top-editarea .blog-controlls');
  return {
    button: rect('.blog-controlls-subscribe-btn'),
    href: button?.getAttribute('href') ?? null,
    // テーマのボタンの形(丸い角)になっているか。はてなのCSSのままなら角丸は6px
    borderRadius: button ? getComputedStyle(button).borderRadius : null,
    display: controlls ? getComputedStyle(controlls).display : null,
    blogHeader: rect('#blog-title'),
    title: rect('#title a'),
    toggle: rect('.color-mode-toggle-button'),
    entry: rect('.entry'),
    viewport: document.documentElement.clientWidth,
  };
});

test.describe('ヘッダーメニューを表示しないときの「読者になる」ボタン(はてなと同じHTMLをタイトル下に貼る)', () => {
  test('ブログのヘッダーの右端、表示モードのボタンの右隣に、いつもの「読者になる」と同じ形で置く', async ({ page }) => {
    const href = await open(page, VIEWPORTS.DESKTOP);

    const m = await measure(page);
    if (!m.button || !m.blogHeader || !m.title || !m.toggle || !m.entry) throw new Error('ヘッダーの要素が見つからない');
    expect(m.href).toBe(href);
    expect(m.borderRadius).toBe('999px');
    // ヘッダーメニューがないので、ブログのヘッダーはページの最上部から始まる
    expect(m.blogHeader.top).toBe(0);
    // ボタンはヘッダーの帯の上下中央にあり、タイトルと重ならない
    expect((m.button.top + m.button.bottom) / 2).toBeCloseTo((m.blogHeader.top + m.blogHeader.bottom - 1) / 2, 0);
    expect(m.title.right).toBeLessThanOrEqual(m.button.left);
    // 右端は記事のカードの右端に揃い、表示モードのボタンの13px右に同じ高さで並ぶ(tests/header.spec.js、tests/dark-mode.spec.js と同じ)
    expect(Math.abs(m.button.right - m.entry.right)).toBeLessThanOrEqual(1);
    expect(Math.round(m.button.left - m.toggle.right)).toBe(13);
    expect(m.button.height).toBeCloseTo(m.toggle.height, 0);

    // タイトル下のHTMLがこのボタンだけでも、ヘッダーとその下の間は変わらない(tests/header.spec.js と同じ48px)
    expect(Math.round(m.entry.top - m.blogHeader.bottom)).toBe(48);
  });

  test('スマホでは、タイトルの下の説明の行に、表示モードのボタンと同じ高さで並ぶ', async ({ page }) => {
    await open(page, VIEWPORTS.MOBILE);

    const m = await measure(page);
    if (!m.button || !m.blogHeader || !m.title || !m.toggle) throw new Error('ヘッダーの要素が見つからない');
    expect(m.button.top).toBeGreaterThanOrEqual(m.title.bottom);
    expect(m.button.top).toBeCloseTo(m.toggle.top, 0);
    expect(m.button.height).toBeCloseTo(m.toggle.height, 0);
    expect(m.button.bottom).toBeLessThanOrEqual(m.blogHeader.bottom);
    expect(m.button.right).toBeCloseTo(m.viewport - 16, 0);
    expect(Math.round(m.button.left - m.toggle.right)).toBe(13);
  });

  test('ヘッダーメニューを表示しているときと印刷では出さない', async ({ page }) => {
    await open(page, VIEWPORTS.DESKTOP);

    await page.emulateMedia({ media: 'print' });
    expect((await measure(page)).display).toBe('none');
    await page.emulateMedia({ media: 'screen' });
    expect((await measure(page)).display).not.toBe('none');

    // ヘッダーメニューがあるブログでは、はてなの「読者になる」がヘッダーにあるので、貼ったものは出さない
    await page.evaluate(() => document.body.classList.remove('globalheader-off'));
    expect((await measure(page)).display).toBe('none');
  });
});
