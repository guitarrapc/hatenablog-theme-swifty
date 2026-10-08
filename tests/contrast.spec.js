// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, TIMEOUTS } from './constants.js';

/**
 * テキストのコントラストを検証する (theme-design-spec.md の「配色」を参照)。
 *
 * 補助テキストは「目立たせない」ことが目的の色なので、薄くしすぎて WCAG AA を割りやすい。
 * 指定した色ではなく、祖先のopacityや半透明の背景まで含めて実際に描かれる色で測る。
 */

const AA_TEXT = 4.5; // WCAG 1.4.3 通常サイズのテキスト
const AA_NON_TEXT = 3.0; // WCAG 1.4.11 UIの境界や状態を示す印
const DISTINCT_FROM_TEXT = 3.0; // WCAG 1.4.1 達成方法G183 下線のないリンクと周りの文字の差

/** 対象はいずれも大きなテキストの例外(24px / 太字18.66px)には当たらない */
const TARGETS = {
  ブログの説明: '#blog-description',
  読者になるボタン: '.blog-controlls-subscribe-btn',
  パンくずのリンク: '.breadcrumb a',
  カテゴリ: '.entry-categories a',
  本文: '.entry-content p',
  記事の投稿日時: '.entry-date a',
  コメント日時: '.comment-metadata',
  記事下フッタ: '.entry-footer-section',
  記事下フッタのリンク: '.entry-footer-section a',
  引用: '.entry-content blockquote',
  ページ内目次のリンク: '.entry-content .table-of-contents a',
  ページ内目次の入れ子のリンク: '.entry-content .table-of-contents ul a',
  // はてな側のCSSがopacity: 0.7を当てており、spanとtimeに入れ子で掛かって0.49になる。
  // 指定色ではなく実際に描かれる色で見ないと見逃す
  最近のコメントの日時: '.hatena-module-recent-comments time.recent-comment-time',
  コードブロックのボタン: '.code-block-button',
  ページ末尾フッタ: '#footer p',
  ページ末尾フッタのリンク: '#footer .services a',
  // はてなが文字色を !important で白にしているボタン。背景色で読めるようにしている
  はてなブログをはじめるボタン: '#footer .guest-footer .btn-register',
};

/** コードハイライト。はてなのハイライトの種類ごとに、コードブロックの背景の上で測る */
const CODE_TARGETS = {
  コード: '.entry-content pre.code',
  キーワード: '.entry-content pre .synStatement',
  型: '.entry-content pre .synType',
  インポート: '.entry-content pre .synPreProc',
  識別子: '.entry-content pre .synIdentifier',
  記号: '.entry-content pre .synSpecial',
  定数: '.entry-content pre .synConstant',
  コメント: '.entry-content pre .synComment',
};

const measure = (/** @type {any} */ page, /** @type {Record<string,string>} */ targets) => page.evaluate((targets) => {
  const channels = (/** @type {string} */ rgb) => (rgb.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
  const luminance = (/** @type {number[]} */ rgb) => {
    const [r, g, b] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (/** @type {number[]} */ fg, /** @type {number[]} */ bg) => {
    const a = luminance(fg) + 0.05;
    const b = luminance(bg) + 0.05;
    return Number((Math.max(a, b) / Math.min(a, b)).toFixed(2));
  };
  // 半透明の背景を持つ要素があるため、実際に色が乗っている祖先まで遡る
  const effectiveBackground = (/** @type {Element | null} */ el) => {
    let node = el;
    while (node) {
      const color = getComputedStyle(node).backgroundColor;
      if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') return color;
      node = node.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor;
  };
  // opacityは祖先のぶんも掛かる
  const effectiveOpacity = (/** @type {Element | null} */ el) => {
    let node = el;
    let opacity = 1;
    while (node && node !== document.documentElement) {
      opacity *= Number(getComputedStyle(node).opacity);
      node = node.parentElement;
    }
    return opacity;
  };
  /** opacityぶんだけ背景と混ぜて、実際に画面に出る色を求める */
  const flatten = (/** @type {number[]} */ fg, /** @type {number[]} */ bg, /** @type {number} */ opacity) =>
    fg.map((v, i) => v * opacity + bg[i] * (1 - opacity));
  const toRgb = (/** @type {number[]} */ c) => `rgb(${c.map((v) => Math.round(v)).join(', ')})`;

  /** @type {Record<string, {color: string, rendered: string, background: string, opacity: number, ratio: number, fontSize: string} | null>} */
  const result = {};
  for (const [name, selector] of Object.entries(targets)) {
    const el = document.querySelector(selector);
    if (!el) { result[name] = null; continue; }
    const style = getComputedStyle(el);
    const background = effectiveBackground(el);
    const opacity = effectiveOpacity(el);
    const rendered = flatten(channels(style.color), channels(background), opacity);
    result[name] = {
      color: style.color,
      rendered: toRgb(rendered),
      background,
      opacity: Number(opacity.toFixed(2)),
      ratio: contrast(rendered, channels(background)),
      fontSize: style.fontSize,
    };
  }

  // 本文中のリンク。下線を引かない場合は、色だけで周りの文字と区別できる必要がある。
  // 本文直下の段落に限る。はてなの埋め込み(Amazonの商品カードなど)の中の段落は、はてな側が下線を消している
  const link = document.querySelector('.entry-content > p > a:not(.keyword)');
  const paragraph = link?.parentElement;
  const linkResult = link && paragraph ? {
    color: getComputedStyle(link).color,
    body: getComputedStyle(paragraph).color,
    decoration: getComputedStyle(link).textDecorationLine,
    vsText: contrast(channels(getComputedStyle(link).color), channels(getComputedStyle(paragraph).color)),
    vsBackground: contrast(channels(getComputedStyle(link).color), channels(effectiveBackground(link))),
  } : null;

  return { result, link: linkResult };
}, targets);

/**
 * テストブログ側の背景設定を打ち消して、テーマ本来の背景に戻す。
 *
 * はてなの「デザイン > カスタマイズ > 背景」で背景色を設定すると、テーマの配色は
 * その色の上に載る (ユーザーが自由に決められるのが正しい挙動。background.spec.js を参照)。
 * ただしここで見たいのは「テーマが持つ配色がAAを満たすか」なので、
 * ブログの設定に左右されないようテーマの既定背景へ戻してから測る。
 *
 * head末尾に足すのでusercssより後になり、確実に勝つ。
 *
 * @param {any} page
 */
const resetToThemeBackground = (page) => page.addStyleTag({ content: 'html, body { background: var(--background); }' });

test.describe('テキストのコントラスト', () => {
  for (const [name, { path, targets }] of Object.entries({
    本文と補助テキスト: { path: TEST_URLS.SAMPLE_ARTICLE, targets: TARGETS },
    コードハイライト: { path: TEST_URLS.CODE_HIGHLIGHT, targets: CODE_TARGETS },
  })) {
    test(`${name}がWCAG AAを満たす`, async ({ page }) => {
      await page.navigateTo(path, { waitFor: 'networkidle' });
      await expect(page.locator('#footer').first()).toBeAttached({ timeout: TIMEOUTS.VERY_LONG });
      await resetToThemeBackground(page);

      const { result } = await measure(page, targets);

      for (const [target, measured] of Object.entries(result)) {
        expect(measured, `${target} が見つからない。テストデータかセレクタを確認する`).not.toBeNull();
        // 失敗時に「指定色は足りているが描画色が足りない」を読み取れるよう、両方を出す
        expect(measured?.ratio,
          `${target}: 指定 ${measured?.color} / opacity ${measured?.opacity} → 描画 ${measured?.rendered} on ${measured?.background} (${measured?.fontSize})`)
          .toBeGreaterThanOrEqual(AA_TEXT);
      }
    });
  }

  test('引用の左の線がカードと引用の背景の両方に対して3:1以上ある', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator('.entry-content blockquote').first()).toBeAttached({ timeout: TIMEOUTS.VERY_LONG });

    // 引用であることを示す主な手がかり(背景はカードとほとんど差がなく、Windowsのハイコントラストでは消える)なので、
    // 非テキストのコントラスト(WCAG 1.4.11)を満たす
    const result = await page.evaluate(() => {
      const channels = (/** @type {string} */ rgb) => (rgb.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
      const luminance = (/** @type {number[]} */ rgb) => {
        const [r, g, b] = rgb.map((v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const contrast = (/** @type {string} */ fg, /** @type {string} */ bg) => {
        const a = luminance(channels(fg)) + 0.05;
        const b = luminance(channels(bg)) + 0.05;
        return Number((Math.max(a, b) / Math.min(a, b)).toFixed(2));
      };
      const quote = /** @type {Element} */ (document.querySelector('.entry-content blockquote'));
      const line = getComputedStyle(quote).borderLeftColor;
      const card = getComputedStyle(/** @type {Element} */(quote.closest('.entry'))).backgroundColor;
      const inside = getComputedStyle(quote).backgroundColor;
      return { line, card, inside, vsCard: contrast(line, card), vsInside: contrast(line, inside) };
    });

    expect(result.vsCard, `引用の線 ${result.line} とカード ${result.card}`).toBeGreaterThanOrEqual(AA_NON_TEXT);
    expect(result.vsInside, `引用の線 ${result.line} と引用の背景 ${result.inside}`).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  test('本文中のリンクが背景と周りの文字の両方から見分けられる', async ({ page }) => {
    await page.navigateTo(TEST_URLS.ARTICLE_WITH_LINKS, { waitFor: 'networkidle' });
    await expect(page.locator('.entry-content > p > a').first()).toBeAttached({ timeout: TIMEOUTS.VERY_LONG });
    await resetToThemeBackground(page);

    const { link } = await measure(page, {});

    expect(link, '本文中のリンクが見つからない。テストデータを確認する').not.toBeNull();
    expect(link?.vsBackground, `リンク ${link?.color} と背景`).toBeGreaterThanOrEqual(AA_TEXT);
    // 下線があれば色の差に頼らなくてよい
    if (link?.decoration !== 'underline') {
      expect(link?.vsText, `下線のないリンク ${link?.color} と本文 ${link?.body}`).toBeGreaterThanOrEqual(DISTINCT_FROM_TEXT);
    }
  });
});
