// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, TIMEOUTS, THEME_STYLESHEET, SCHEMES, schemeCss } from './constants.js';

/**
 * 配色の切り替えのテスト (theme-design-spec.md の「配色の切り替え」を参照)
 *
 * デザインCSSに `:root { --swifty-scheme: blue; }` と書くと、コンテナのスタイルクエリで body に置いた配色の変数が切り替わる。
 * 配色ごとのコントラストは contrast.spec.js で確かめる。
 *
 * 開発用ブログのデザインCSSで配色を切り替えていることがあるので、配色に関わるテストでは配色を明示する。
 */

const [DEFAULT_SCHEME, ...SWITCHABLE] = SCHEMES;
const BLUE = schemeCss('blue');

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
      text: body.color,
      colorScheme: body.colorScheme,
      header: getComputedStyle(/** @type {Element} */ (document.getElementById('blog-title'))).backgroundColor,
      card: getComputedStyle(/** @type {Element} */ (document.querySelector('.entry'))).backgroundColor,
      link: getComputedStyle(link).color,
      bandBar: getComputedStyle(band, '::before').backgroundColor,
    },
  };
  probe.remove();
  return result;
}, SWITCHED);

test.describe('配色の切り替え', () => {
  test(`書かなければ既定の配色(${DEFAULT_SCHEME})で、body は :root の配色をそのまま使う`, async ({ page }) => {
    await openArticle(page);
    // 開発用ブログのデザインCSSで切り替えていても、書いていない状態に戻す
    await designCss(page, ':root { --swifty-scheme: initial; }');
    const colors = await measure(page);

    expect(colors.scheme).toBe('');
    expect(colors.body).toEqual(colors.root);
  });

  // 1つのページで配色を順に切り替えて測る(後から足した指定が勝つ)。失敗はすべて集めて出す(expect.soft)
  test('デザインCSSで --swifty-scheme を書くと、どの配色でもページ全体の配色が切り替わる', async ({ page }) => {
    await openArticle(page);

    for (const scheme of SWITCHABLE) {
      await designCss(page, schemeCss(scheme));
      const colors = await measure(page);

      expect.soft(colors.scheme).toBe(scheme);
      for (const name of SWITCHED) {
        expect.soft(colors.body[name], `${scheme}: --${name} が切り替わる`).not.toBe(colors.root[name]);
      }
      // ページの背景は html に置かず、body の背景がページ全体に広がる
      expect.soft(colors.rendered.html, scheme).toBe('rgba(0, 0, 0, 0)');
      expect.soft(colors.rendered.background, scheme).toBe(colors.expected.background);
      expect.soft(colors.rendered.card, scheme).toBe(colors.expected.surface);
      expect.soft(colors.rendered.link, scheme).toBe(colors.expected.link);
      expect.soft(colors.rendered.bandBar, scheme).toBe(colors.expected.accent);
    }
  });

  test('どの配色でも、ブログのヘッダーの帯ははてなのヘッダーメニューと同じ白にする', async ({ page }) => {
    await openArticle(page);
    // はてなのヘッダーメニューは別ドメインのiframeで白固定。ブログのヘッダーと続けて1つのヘッダーに見せる
    for (const scheme of SCHEMES) {
      await designCss(page, schemeCss(scheme));
      const header = await page.evaluate(() => getComputedStyle(/** @type {Element} */ (document.getElementById('blog-title'))).backgroundColor);
      expect(header, scheme).toBe('rgb(255, 255, 255)');
    }
  });

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
    // 配色の名前にはしない名前(配色を足しても、ここが既存の配色と重ならないように)
    await designCss(page, ':root { --swifty-scheme: no-such-scheme; }');
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

/** 相対輝度(rgb()の値) */
const luminance = (/** @type {string} */ rgb) => {
  const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** 暗い背景に明るい文字で描かれているか */
const isDark = (/** @type {any} */ colors) => luminance(colors.rendered.background) < luminance(colors.rendered.text);

// 開発用ブログのデザインCSSで切り替えていても、書いていない状態(OSに合わせる)と既定の配色に戻す
const AUTO = ':root { --swifty-color-mode: initial; --swifty-scheme: initial; }';

/**
 * ダークテーマのテスト (theme-design-spec.md の「ダークテーマ」を参照)
 *
 * OSのダークモード(prefers-color-scheme: dark)に合わせ、デザインCSSの --swifty-color-mode で常にライト・常にダークにもできる。
 * 配色ごとのコントラストは contrast.spec.js と alert.spec.js で、ライトとダークの両方を確かめる。
 */
test.describe('ダークテーマ', () => {
  for (const os of /** @type {const} */ (['light', 'dark'])) {
    test(`書かなければOSに合わせる(OS: ${os})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: os });
      await openArticle(page);
      await designCss(page, AUTO);
      const colors = await measure(page);

      expect(isDark(colors)).toBe(os === 'dark');
      // 入力欄など、ブラウザが描く部品もそのモードにする
      expect(colors.rendered.colorScheme).toBe(os);
      // ダークの変数は body に置く(:root はライトのまま)
      expect(colors.body.background === colors.root.background).toBe(os === 'light');
    });
  }

  for (const [mode, os] of /** @type {const} */ ([['light', 'dark'], ['dark', 'light']])) {
    test(`デザインCSSで --swifty-color-mode: ${mode} と書くと、OSが${os}でも${mode}にする`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: os });
      await openArticle(page);
      await designCss(page, `${AUTO} :root { --swifty-color-mode: ${mode}; }`);

      expect(isDark(await measure(page))).toBe(mode === 'dark');
    });
  }

  test('デザインCSSがテーマより前に読み込まれても、--swifty-color-mode が効く', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await openArticle(page);
    // 開発用ブログでは、デザインCSS(usercss)の後に開発サーバーのテーマが読み込まれる。テーマが既定値を宣言していると負ける
    await beforeTheme(page, ':root { --swifty-color-mode: dark; }');

    expect(isDark(await measure(page))).toBe(true);
  });

  test('どの配色にもダークがあり、配色ごとに色が違う', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openArticle(page);
    await designCss(page, AUTO);

    /** @type {string[]} */
    const accents = [];
    for (const scheme of SCHEMES) {
      await designCss(page, schemeCss(scheme));
      const colors = await measure(page);
      expect.soft(isDark(colors), `${scheme} がダークになる`).toBe(true);
      // ページの背景はカードより暗くし、明るさの差で階層を作る(影はダークでは見えにくい)
      expect.soft(luminance(colors.rendered.background), `${scheme} の背景はカードより暗い`).toBeLessThan(luminance(colors.rendered.card));
      // ブログのヘッダーの帯もダークにする(はてなのヘッダーメニューは白のまま変えられない)
      expect.soft(colors.rendered.header, `${scheme} のヘッダーの帯`).toBe(colors.rendered.card);
      accents.push(colors.expected.accent);
    }
    // 配色の見分けがつくよう、アクセントの色は配色ごとに違う
    expect(new Set(accents).size).toBe(SCHEMES.length);
  });

  test('ダークでは、はてなの背景設定よりテーマの暗い背景を優先する', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openArticle(page);
    await designCss(page, AUTO);
    // はてなの背景設定(明るい色)を、テーマより前に置く。明るい背景が残ると、明るい文字が読めなくなる
    await beforeTheme(page, 'body{background:#ffffff;}');
    const colors = await measure(page);

    expect(colors.rendered.background).toBe(colors.expected.background);
    expect(isDark(colors)).toBe(true);
  });

  test('印刷はOSがダークモードでもライトにする', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openArticle(page);
    await designCss(page, `${AUTO} :root { --swifty-color-mode: dark; }`);
    // 紙は白地なので、明るい文字が読めなくなる
    await page.emulateMedia({ media: 'print', colorScheme: 'dark' });

    expect(isDark(await measure(page))).toBe(false);
  });
});
