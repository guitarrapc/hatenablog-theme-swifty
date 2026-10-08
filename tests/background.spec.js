// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, TIMEOUTS, THEME_STYLESHEET } from './constants.js';

/**
 * はてなの「デザイン > カスタマイズ > 背景」で指定した背景色が反映されることを検証する。
 *
 * はてなが出力するのは `body{background:#xxxxxx;}` で、テーマの `html, body` と詳細度が同じ。
 * そのため読み込み順だけで勝敗が決まり、はてなのCSSがテーマより前に置かれると無視される。
 * テーマ側の背景をカスケードレイヤーに入れて、順序に関係なくユーザー指定が勝つようにしている。
 */

// はてなが実際に出力する形をそのまま使う (background-colorではなくbackgroundショートハンド)。
// 色はテストブログ自身の背景設定と区別できるよう、別の値にする
const USER_BACKGROUND = 'rgb(255, 0, 255)';
const USER_BACKGROUND_CSS = 'body{background:#ff00ff;}';

/**
 * ユーザーの背景指定を「テーマCSSより前」に差し込む。
 *
 * page.addStyleTag はhead末尾 (テーマより後) に入るため、不利な側の順序を再現できない。
 * テーマのlinkの直前に置くことで、ブログ自身の背景設定 (usercss) より後ろ、
 * かつテーマより前、という狙った位置に確実に入れる。
 *
 * @param {any} page
 */
const injectBeforeThemeCss = (page) => page.evaluate(({ css, href }) => {
  const themeLink = document.querySelector(`link[href="${href}"]`);
  if (!themeLink || !themeLink.parentNode) throw new Error('テーマCSSのlinkが見つからない。開発用ブログのhead設定を確認する');
  const style = document.createElement('style');
  style.textContent = css;
  themeLink.parentNode.insertBefore(style, themeLink);
}, { css: USER_BACKGROUND_CSS, href: THEME_STYLESHEET });

test.describe('背景色のユーザー設定', () => {
  test('テーマCSSより前に置かれた背景指定でも反映される', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator('.entry-content').first()).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });
    await injectBeforeThemeCss(page);

    // 画面に見えるのはbodyの背景。ユーザーの指定が残っていること
    const body = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(body).toBe(USER_BACKGROUND);
  });

  test('テーマの背景はカスケードレイヤーに入っている', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator('.entry-content').first()).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

    // レイヤーに入っていることが、順序に関係なくユーザー指定へ譲るための条件。
    // 挙動テストだけだと、たまたま順序が有利で通っているのか区別できないので構造も見る
    const layered = await page.evaluate((href) => {
      const sheet = Array.from(document.styleSheets).find((s) => s.href === href);
      if (!sheet) return { error: 'テーマCSSが読み込まれていない' };
      /** @type {string[]} */
      const layers = [];
      for (const rule of Array.from(sheet.cssRules)) {
        // CSSLayerBlockRule のみを見る
        if (!('cssRules' in rule) || !('name' in rule)) continue;
        for (const inner of Array.from(/** @type {any} */(rule).cssRules)) {
          if (/** @type {any} */(inner).style?.backgroundColor && /body/.test(/** @type {any} */(inner).selectorText || '')) {
            layers.push(/** @type {any} */(rule).name);
          }
        }
      }
      return { layers };
    }, THEME_STYLESHEET);

    expect(layered.error, layered.error).toBeUndefined();
    expect(layered.layers).toContain('swifty-background');
  });
});
