// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, TIMEOUTS, THEME_STYLESHEET } from './constants.js';

/**
 * 配色の切り替えのテスト (theme-design-spec.md の「配色の切り替え」を参照)
 *
 * デザインCSSに `:root { --swifty-scheme: blue; }` と書くと、コンテナのスタイルクエリで body に置いた配色の変数が切り替わる。
 * 配色ごとのコントラストは contrast.spec.js で確かめる。
 *
 * 開発用ブログのデザインCSSで配色を切り替えていることがあるので、配色に関わるテストでは配色を明示する。
 */

// テーマが持つ配色(既定の mint 以外)。_variable.scss の $schemes と揃える
const SCHEMES = ['blue', 'pink', 'yellow'];
const BLUE = ':root { --swifty-scheme: blue; }';

// 切り替えで変わる配色の変数のうち、見た目の要になるもの
const SWITCHED = ['background', 'text-body', 'text-light', 'link', 'accent', 'accent-strong', 'accent-soft', 'border'];

/** デザインCSSに書く内容。デザインCSSはテーマより後に読み込まれるので、head の末尾に足す */
const designCss = (/** @type {any} */ page, /** @type {string} */ css) => page.addStyleTag({ content: css });

/** テーマのCSSより前にCSSを置く(開発用ブログでのデザインCSSやはてなの背景設定と同じ位置) */
const beforeTheme = (/** @type {any} */ page, /** @type {string} */ css) => page.evaluate(({ css, href }) => {
  const themeLink = document.querySelector(`link[href="${href}"]`);
  if (!themeLink || !themeLink.parentNode) throw new Error('テーマCSSのlinkが見つからない。開発用ブログのhead設定を確認する');
  const style = document.createElement('style');
  style.textContent = css;
  themeLink.parentNode.insertBefore(style, themeLink);
}, { css, href: THEME_STYLESHEET });

const openArticle = async (/** @type {any} */ page) => {
  await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
  await expect(page.locator('.entry-content').first()).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });
};

/** :root と body の配色の変数と、実際に描かれた色 */
const measure = (/** @type {any} */ page) => page.evaluate((/** @type {string[]} */ names) => {
  const root = getComputedStyle(document.documentElement);
  const body = getComputedStyle(document.body);
  // 変数の値を、body の中で描いたときの色(rgb)にする
  const probe = document.createElement('span');
  document.body.appendChild(probe);
  const resolve = (/** @type {string} */ name) => {
    probe.style.color = `var(--${name})`;
    return getComputedStyle(probe).color;
  };
  const band = /** @type {Element} */ (document.querySelector('.entry-content > h1'));
  const link = /** @type {Element} */ (document.querySelector('.entry-content > p a:not(.keyword)'));
  const result = {
    scheme: root.getPropertyValue('--swifty-scheme').trim(),
    root: Object.fromEntries(names.map((n) => [n, root.getPropertyValue(`--${n}`).trim()])),
    body: Object.fromEntries(names.map((n) => [n, body.getPropertyValue(`--${n}`).trim()])),
    expected: {
      background: resolve('background'),
      surface: resolve('surface'),
      link: resolve('link'),
      accent: resolve('accent'),
    },
    rendered: {
      html: root.backgroundColor,
      background: body.backgroundColor,
      card: getComputedStyle(/** @type {Element} */ (document.querySelector('.entry'))).backgroundColor,
      link: getComputedStyle(link).color,
      bandBar: getComputedStyle(band, '::before').backgroundColor,
    },
  };
  probe.remove();
  return result;
}, SWITCHED);

test.describe('配色の切り替え', () => {
  test('テーマは --swifty-scheme を宣言しない', async ({ page }) => {
    await openArticle(page);
    // 宣言すると、テーマより前に読み込まれたデザインCSS(開発用ブログ)の指定に、同じ詳細度のテーマの既定値が勝ってしまう。
    // 開発用ブログのデザインCSSの影響を受けないよう、ページの値ではなくテーマのCSSそのものを見る
    const declared = await page.evaluate((href) => {
      const sheet = [...document.styleSheets].find((s) => s.href === href);
      if (!sheet) return null;
      /** @type {string[]} */
      const found = [];
      const walk = (/** @type {CSSRuleList} */ rules) => {
        for (const rule of [...rules]) {
          const style = /** @type {any} */ (rule).style;
          if (style?.getPropertyValue('--swifty-scheme')) found.push(/** @type {any} */ (rule).selectorText);
          if ('cssRules' in rule) walk(/** @type {any} */ (rule).cssRules);
        }
      };
      walk(sheet.cssRules);
      return found;
    }, THEME_STYLESHEET);

    expect(declared, 'テーマCSSが読み込まれていない').not.toBeNull();
    expect(declared).toEqual([]);
  });

  test('書かなければ既定の配色(ミント)で、body は :root の配色をそのまま使う', async ({ page }) => {
    await openArticle(page);
    // 開発用ブログのデザインCSSで切り替えていても、書いていない状態に戻す
    await designCss(page, ':root { --swifty-scheme: initial; }');
    const colors = await measure(page);

    expect(colors.scheme).toBe('');
    expect(colors.body).toEqual(colors.root);
  });

  for (const scheme of SCHEMES) {
    test(`デザインCSSで --swifty-scheme: ${scheme} と書くと、ページ全体の配色が切り替わる`, async ({ page }) => {
      await openArticle(page);
      await designCss(page, `:root { --swifty-scheme: ${scheme}; }`);
      const colors = await measure(page);

      expect(colors.scheme).toBe(scheme);
      for (const name of SWITCHED) {
        expect(colors.body[name], `--${name} が切り替わる`).not.toBe(colors.root[name]);
      }
      // ページの背景は html に置かず、body の背景がページ全体に広がる
      expect(colors.rendered.html).toBe('rgba(0, 0, 0, 0)');
      expect(colors.rendered.background).toBe(colors.expected.background);
      expect(colors.rendered.card).toBe(colors.expected.surface);
      expect(colors.rendered.link).toBe(colors.expected.link);
      expect(colors.rendered.bandBar).toBe(colors.expected.accent);
    });
  }

  test('デザインCSSがテーマより前に読み込まれても、切り替わる', async ({ page }) => {
    await openArticle(page);
    // 開発用ブログでは、デザインCSS(usercss)の後に開発サーバーのテーマが読み込まれる。
    // 開発用ブログのデザインCSS(テーマより前)より後、テーマより前に置き、ブログで選んでいる配色とは別の配色にする
    await beforeTheme(page, ':root { --swifty-scheme: pink; }');
    const colors = await measure(page);

    expect(colors.scheme).toBe('pink');
    expect(colors.body.accent).not.toBe(colors.root.accent);
    expect(colors.rendered.link).toBe(colors.expected.link);
  });

  test('知らない配色の名前では、既定の配色のまま表示する', async ({ page }) => {
    await openArticle(page);
    await designCss(page, ':root { --swifty-scheme: purple; }');
    const colors = await measure(page);

    expect(colors.body).toEqual(colors.root);
  });

  test('配色を切り替えても、デザインCSSで body に書いた色が優先される', async ({ page }) => {
    await openArticle(page);
    await designCss(page, `${BLUE} body { --link: rgb(255, 0, 0); }`);
    const colors = await measure(page);

    expect(colors.rendered.link).toBe('rgb(255, 0, 0)');
    // ほかの色は切り替えた配色のまま
    expect(colors.body.accent).not.toBe(colors.root.accent);
  });

  test('配色を切り替えても、はてなの背景設定が優先され、ページ全体に広がる', async ({ page }) => {
    await openArticle(page);
    // はてなが出力する背景設定を、不利な側(テーマより前)に置く(background.spec.js と同じ)
    await beforeTheme(page, 'body{background:#ff00ff;}');
    await designCss(page, BLUE);
    const colors = await measure(page);

    expect(colors.rendered.background).toBe('rgb(255, 0, 255)');
    expect(colors.rendered.html).toBe('rgba(0, 0, 0, 0)');
  });
});
