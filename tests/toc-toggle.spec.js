// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, VIEWPORTS, TIMEOUTS } from './constants.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * 目次の開閉のテスト (component-specs.md の「目次の開閉」、theme-design-spec.md の「目次」を参照)
 *
 * js/toc-toggle.js が ul.table-of-contents を details.toc-panel で包む。
 * 本文の横の目次は閉じると細い帯になって本文が広がり、本文中の目次は見出しの行だけになる。
 * 閉じたかどうかはブラウザに記憶する。
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tocToggleJs = fs.readFileSync(path.resolve(__dirname, '../js/toc-toggle.js'), 'utf-8');

const STORAGE_KEY = 'swifty-toc-collapsed';
const SIDE = VIEWPORTS.DESKTOP;
const INLINE = { width: 1024, height: 900 };

const openArticle = async (/** @type {any} */ page) => {
  await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
  await expect(page.locator('.entry-content > .toc-panel')).toHaveCount(1, { timeout: TIMEOUTS.VERY_LONG });
};

const measure = (/** @type {any} */ page) => page.evaluate(() => {
  const panel = /** @type {HTMLDetailsElement} */ (document.querySelector('.entry-content > .toc-panel'));
  const summary = /** @type {Element} */ (panel.querySelector(':scope > .toc-panel-summary'));
  const list = /** @type {Element} */ (panel.querySelector(':scope > .table-of-contents'));
  const content = /** @type {Element} */ (document.querySelector('.entry-content'));
  const root = getComputedStyle(document.documentElement);
  return {
    open: panel.open,
    text: document.getElementById('段落')?.nextElementSibling?.getBoundingClientRect().width ?? 0,
    content: content.getBoundingClientRect().width,
    contentMax: parseFloat(root.getPropertyValue('--content-max')),
    railWidth: parseFloat(root.getPropertyValue('--toc-rail-width')),
    railGap: parseFloat(root.getPropertyValue('--toc-rail-gap')),
    panelWidth: panel.getBoundingClientRect().width,
    // 閉じたdetailsの中身はレイアウトが省かれ、getBoundingClientRect()は開いていたときの高さを返すので、見えるかどうかで確かめる
    listVisible: list.checkVisibility(),
    summaryHeight: summary.getBoundingClientRect().height,
    labelWritingMode: getComputedStyle(/** @type {Element} */ (summary.querySelector('.toc-panel-label'))).writingMode,
    stored: (() => {
      try {
        return localStorage.getItem('swifty-toc-collapsed');
      } catch (e) {
        return 'unavailable';
      }
    })(),
  };
});

test.describe('目次の開閉(js/toc-toggle.js)', () => {
  test('目次を details で包み、見出しの行に「目次」を出す。最初は開いている', async ({ page }) => {
    await page.setViewportSize(INLINE);
    await openArticle(page);

    const panel = page.locator('.entry-content > .toc-panel');
    // はてなのリストはそのまま中に移す(リンクを作り直さない)
    await expect(panel.locator(':scope > .table-of-contents a').first()).toBeVisible();
    await expect(panel).toHaveAttribute('open', '');
    // 見出しの文字は --toc-label から出し、そのままアクセシブルな名前になる
    await expect(panel.locator('.toc-panel-summary')).toHaveAccessibleName('目次');

    // スクリプトを何度実行しても包み直さない
    await page.evaluate(tocToggleJs);
    await expect(page.locator('.toc-panel')).toHaveCount(1);
    await expect(page.locator('.toc-panel .toc-panel')).toHaveCount(0);
  });

  test('本文の横の目次は、閉じると細い帯になって本文が広がり、開くと元に戻る', async ({ page }) => {
    await page.setViewportSize(SIDE);
    await openArticle(page);

    const opened = await measure(page);
    expect(opened.open).toBe(true);
    expect(opened.text).toBeCloseTo(opened.contentMax, 0);

    await page.locator('.toc-panel-summary').click();
    const closed = await measure(page);
    expect(closed.open).toBe(false);
    // 目次の列は帯の幅になり、本文は残りいっぱいに広がる
    expect(closed.panelWidth).toBeCloseTo(closed.railWidth, 0);
    expect(closed.text).toBeCloseTo(closed.content - closed.railWidth - closed.railGap, 0);
    expect(closed.text).toBeGreaterThan(opened.text);
    // 帯には縦書きの「目次」を出す
    expect(closed.labelWritingMode).toBe('vertical-rl');
    expect(closed.listVisible).toBe(false);

    await page.locator('.toc-panel-summary').click();
    const reopened = await measure(page);
    expect(reopened.open).toBe(true);
    expect(reopened.text).toBeCloseTo(opened.text, 0);
  });

  test('本文の横の目次を開け閉めしても、タイトルの折り返しは変わらない', async ({ page }) => {
    await page.setViewportSize(SIDE);
    await openArticle(page);

    const header = () => page.evaluate(() => {
      const title = /** @type {Element} */ (document.querySelector('.entry-header .entry-title'));
      const footer = /** @type {Element} */ (document.querySelector('.entry-footer'));
      return {
        title: title.getBoundingClientRect().toJSON(),
        // 記事下は本文の列に揃うので、目次を閉じると本文と一緒に広がる
        footerTextWidth: footer.getBoundingClientRect().width - parseFloat(getComputedStyle(footer).paddingRight),
        text: document.querySelector('.entry-content > p')?.getBoundingClientRect().width ?? 0,
      };
    });

    const opened = await header();
    await page.locator('.toc-panel-summary').click();
    const closed = await header();

    // タイトルは目次の列と重ならない位置にあるので、目次の状態に関わらずカードの内側いっぱいで同じ形
    expect(closed.title).toEqual(opened.title);
    expect(closed.footerTextWidth).toBeCloseTo(closed.text, 0);
    expect(opened.footerTextWidth).toBeCloseTo(opened.text, 0);
  });

  test('本文中の目次は、閉じると見出しの行だけになる', async ({ page }) => {
    await page.setViewportSize(INLINE);
    await openArticle(page);

    const opened = await measure(page);
    await page.locator('.toc-panel-summary').click();
    const closed = await measure(page);

    expect(closed.open).toBe(false);
    expect(closed.listVisible).toBe(false);
    expect(closed.summaryHeight).toBeGreaterThanOrEqual(24); // タップ領域(WCAG 2.5.8)
    // 本文の幅は変わらない
    expect(closed.text).toBe(opened.text);
  });

  test('キーボードでも開け閉めできる', async ({ page }) => {
    await page.setViewportSize(INLINE);
    await openArticle(page);

    const summary = page.locator('.toc-panel-summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    expect((await measure(page)).open).toBe(false);
    await page.keyboard.press('Space');
    expect((await measure(page)).open).toBe(true);
  });

  test('閉じたことを記憶し、次に開いたページでは最初から閉じていて表示がずれない', async ({ page }) => {
    await page.setViewportSize(SIDE);
    await openArticle(page);
    await page.locator('.toc-panel-summary').click();
    expect((await measure(page)).stored).toBe('true');

    // 次のページの読み込みで起きたレイアウトのずれを、動いた要素と一緒に記録する
    await page.addInitScript(() => {
      /** @type {any} */ (window).layoutShifts = [];
      new PerformanceObserver((list) => {
        for (const entry of /** @type {any[]} */ (list.getEntries())) {
          /** @type {any} */ (window).layoutShifts.push({
            value: entry.value,
            sources: entry.sources.map((/** @type {any} */ s) => {
              const node = s.node;
              const name = node ? (node.id || (typeof node.className === 'string' && node.className) || node.nodeName) : '?';
              return `${name} y${Math.round(s.previousRect.y)}->${Math.round(s.currentRect.y)} w${Math.round(s.previousRect.width)}->${Math.round(s.currentRect.width)}`;
            }),
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await openArticle(page);

    const closed = await measure(page);
    expect(closed.open).toBe(false);
    expect(closed.text).toBeGreaterThan(closed.contentMax);
    // 本文が描かれる前に閉じた状態にするので、開いた状態から広がるずれが起きない
    const shifts = await page.evaluate(() => /** @type {any} */ (window).layoutShifts);
    const total = shifts.reduce((/** @type {number} */ sum, /** @type {any} */ shift) => sum + shift.value, 0);
    expect(total, JSON.stringify(shifts)).toBe(0);

    // 開け直すと、それも記憶する
    await page.locator('.toc-panel-summary').click();
    expect((await measure(page)).stored).toBe('false');
  });

  test('記憶できない環境でも開け閉めできる', async ({ page }) => {
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
    await page.setViewportSize(INLINE);
    await openArticle(page);

    expect((await measure(page)).open).toBe(true);
    await page.locator('.toc-panel-summary').click();
    expect((await measure(page)).open).toBe(false);
  });

  // 本文の横に置くときは本文がグリッドになるので、マージンの相殺に頼った余白がないことを、開閉のどちらの状態でも確かめる
  for (const state of ['開いている', '閉じている']) {
    test(`本文の横の目次が${state}ときも本文の間隔は変わらない`, async ({ page }) => {
      await page.setViewportSize(SIDE);
      await openArticle(page);
      if (state === '閉じている') await page.locator('.toc-panel-summary').click();
      await page.addStyleTag({ content: '.entry-content > * { content-visibility: visible !important; }' });

      const gaps = () => page.evaluate(() => {
        const children = [...document.querySelectorAll('.entry-content > :not(.toc-panel)')];
        return children.slice(1).map((el, i) => Math.round(el.getBoundingClientRect().top - children[i].getBoundingClientRect().bottom));
      });
      const side = await gaps();
      await page.addStyleTag({ content: '.entry-content > .toc-panel { display: none !important; } .entry-content { display: block !important; }' });
      const flow = await gaps();
      expect(side).toEqual(flow);
    });
  }

  test('印刷では閉じた目次も中身を出す', async ({ page }) => {
    await page.setViewportSize(INLINE);
    await openArticle(page);
    await page.locator('.toc-panel-summary').click();
    expect((await measure(page)).listVisible).toBe(false);

    await page.emulateMedia({ media: 'print' });
    expect((await measure(page)).listVisible).toBe(true);
  });

  test('配布用のcustomize-toc-toggle.htmlはjs/toc-toggle.jsと同じ処理である', async ({ page }) => {
    const html = fs.readFileSync(path.resolve(__dirname, '../customize-toc-toggle.html'), 'utf-8');
    // 正規表現ではなくブラウザのHTMLパーサーでscript要素を取り出す(DOMParserはスクリプトを実行しない)
    const scripts = await page.evaluate((source) => Array.from(new DOMParser().parseFromString(source, 'text/html').scripts)
      .map((script) => script.textContent ?? ''), html);
    expect(scripts).toHaveLength(1);

    // インデントとコメント行を除いて比較する
    const normalize = (/** @type {string} */ code) => code
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('//') && !line.startsWith('/**') && !line.startsWith('*'))
      .join('\n');
    expect(normalize(scripts[0])).toBe(normalize(tocToggleJs));
  });
});
