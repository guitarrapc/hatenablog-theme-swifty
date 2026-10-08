// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, TIMEOUTS } from './constants.js';

/**
 * 画面外の描画の後回し(content-visibility: auto)が見た目を変えていないことを検証する
 * (theme-design-spec.md の「描画の後回し」を参照)。
 *
 * content-visibility: auto は画面内でもレイアウト・ペイントの包含を伴うため、
 * 子のマージンの相殺やはみ出しの扱いが変わり、要素の位置や高さがずれることがある。
 * 後回しを無効にした状態と、本文直下の要素の位置と高さを比べる。
 */

const TOLERANCE = 1; // px。サブピクセルの丸め誤差

/** ページを最後までスクロールし、後回しにしていた要素を一度描かせて実際の高さを覚えさせる */
const renderAll = (/** @type {any} */ page) => page.evaluate(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
    scrollTo(0, y);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }
  scrollTo(0, 0);
});

const measure = (/** @type {any} */ page) => page.evaluate(() =>
  [...document.querySelectorAll('.entry-content > *, #box2')].map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      element: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.className ? `.${String(el.className).trim().split(/\s+/).join('.')}` : ''}`,
      top: Math.round(rect.top + scrollY),
      height: Math.round(rect.height),
    };
  }));

test.describe('描画の後回し', () => {
  for (const [name, path] of Object.entries({
    サンプル記事: TEST_URLS.SAMPLE_ARTICLE,
    コードハイライト記事: TEST_URLS.CODE_HIGHLIGHT,
  })) {
    test(`後回しにしても本文の位置と高さが変わらない(${name})`, async ({ page }) => {
      await page.navigateTo(path, { waitFor: 'networkidle' });
      await expect(page.locator('.entry-content').first()).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

      // 前提: 後回しが効いていること(ここが崩れると比較が意味を失う)
      const contentVisibility = await page.evaluate(() =>
        getComputedStyle(/** @type {Element} */(document.querySelector('.entry-content > p'))).contentVisibility);
      expect(contentVisibility).toBe('auto');

      await renderAll(page);
      const deferred = await measure(page);

      await page.addStyleTag({ content: '.entry-content > *, #box2 { content-visibility: visible !important; }' });
      const visible = await measure(page);

      expect(deferred.length).toBe(visible.length);
      deferred.forEach((d, i) => {
        const v = visible[i];
        expect(Math.abs(d.top - v.top), `${d.element} の位置: 後回し ${d.top}px / 無効 ${v.top}px`).toBeLessThanOrEqual(TOLERANCE);
        expect(Math.abs(d.height - v.height), `${d.element} の高さ: 後回し ${d.height}px / 無効 ${v.height}px`).toBeLessThanOrEqual(TOLERANCE);
      });
    });
  }
});
