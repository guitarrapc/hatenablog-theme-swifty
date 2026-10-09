// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, FIXTURE_URLS, SELECTORS, VIEWPORTS } from './constants.js';

test.describe('記事ページのテスト', () => {
  test('記事ページが正しくレンダリングされる', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });

    await page.screenshot({ path: 'screenshots/article-page.png', fullPage: true });

    // 基本的な記事要素が存在することを確認
    await expect(page.locator(SELECTORS.ENTRY_TITLE)).toBeVisible();
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();
    await expect(page.locator(SELECTORS.ENTRY_DATE)).toBeVisible();
  });

  test('本文中の箱の角丸は記事のカードと揃え、画像は小さくする', async ({ page }) => {
    // カードに角丸がある幅で測る(目次は本文中でも箱にしないので含めない)
    await page.setViewportSize(VIEWPORTS.BELOW_SIDE_TOC);
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();

    const radii = await page.evaluate(() => {
      const radius = (/** @type {string} */ selector, corner = 'borderTopRightRadius') => {
        const el = document.querySelector(selector);
        return el ? /** @type {any} */ (getComputedStyle(el))[corner] : null;
      };
      return {
        // 記事ページではカードの上端にパンくずが入り、記事の上の角は丸めないので、下の角で測る
        card: radius('.entry', 'borderBottomRightRadius'),
        boxes: {
          コードブロック: radius('.entry-content pre.code'),
          アラート: radius('.entry-content .markdown-alert'),
          // 引用は左に線があるので右の角だけ丸める
          引用: radius('.entry-content > blockquote:not(.markdown-alert)'),
          // 目次(js/toc-toggle.js が包む details.toc-panel)は箱にしないので除く
          折りたたみ: radius('.entry-content details:not(.toc-panel)'),
        },
        quoteLeft: radius('.entry-content > blockquote:not(.markdown-alert)', 'borderTopLeftRadius'),
        image: radius('.entry-content img.hatena-fotolife'),
      };
    });

    expect(radii.card, '前提: カードに角丸があること').not.toBe('0px');
    for (const [name, value] of Object.entries(radii.boxes)) {
      expect(value, `${name}が見つからない`).not.toBeNull();
      expect(value, `${name}の角丸`).toBe(radii.card);
    }
    expect(radii.quoteLeft).toBe('0px');
    // 画像は角丸を大きくすると画像の隅が欠けるので、カードより小さくする
    expect(parseFloat(radii.image ?? '0')).toBeLessThan(parseFloat(radii.card));
  });

  test('表のセルは単語の途中で縮めず、収まらない表は表の中で横にスクロールする', async ({ page }) => {
    // 列の多い表が収まらない、スマートフォンの幅で測る
    await page.setViewportSize(VIEWPORTS.MOBILE);
    await page.navigateTo(FIXTURE_URLS.TABLES_DETAILS, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();
    await page.addStyleTag({ content: '.entry-content > * { content-visibility: visible !important; }' });

    const result = await page.evaluate(() => {
      const tables = [...document.querySelectorAll('.entry-content > table')];
      /** 文字列が描かれた行の数 */
      const lines = (/** @type {Element} */ el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
      };
      const cells = tables.flatMap((table) => [...table.querySelectorAll('th, td')]);
      return {
        overflowing: tables.filter((t) => t.scrollWidth > t.clientWidth).length,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        // 区切りのない英単語・数字だけのセル(Chrome、105など)
        words: cells.filter((c) => /^[A-Za-z0-9.]+$/.test(c.textContent?.trim() ?? '')).map((c) => ({ text: c.textContent?.trim(), lines: lines(c) })),
        // 日本語を含むセル
        japanese: cells.filter((c) => /[぀-ヿ一-鿿]/.test(c.textContent ?? '')).map((c) => ({
          text: c.textContent?.trim().slice(0, 10),
          width: c.getBoundingClientRect().width,
          fontSize: parseFloat(getComputedStyle(c).fontSize),
        })),
      };
    });

    expect(result.overflowing, '前提: 画面に収まらない表があること').toBeGreaterThan(0);
    expect(result.pageOverflow).toBeLessThanOrEqual(0);
    expect(result.words.length, '前提: 英単語や数字だけのセルがあること').toBeGreaterThan(0);
    for (const w of result.words) {
      expect(w.lines, `「${w.text}」が1行に収まる`).toBe(1);
    }
    for (const j of result.japanese) {
      expect(j.width, `「${j.text}」の列の幅`).toBeGreaterThanOrEqual(j.fontSize * 5 - 1);
    }
  });

  test('記事ページでは、パンくずを記事のカードの上端に入れ、タイトルの上に置く', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();

    const layout = await page.evaluate(() => {
      const rect = (/** @type {string} */ selector) => /** @type {Element} */ (document.querySelector(selector)).getBoundingClientRect().toJSON();
      const visible = (/** @type {string} */ selector) => [...document.querySelectorAll(selector)].filter((el) => el.checkVisibility()).map((el) => el.textContent?.trim());
      const breadcrumb = /** @type {Element} */ (document.querySelector('.breadcrumb'));
      const entry = /** @type {Element} */ (document.querySelector('.entry'));
      return {
        breadcrumb: rect('.breadcrumb'),
        entry: rect('.entry'),
        title: rect('.entry-title'),
        date: rect('.entry-header .date'),
        categories: rect('.entry-categories'),
        // パンくずと記事が1枚のカードに見えること: 同じ背景で、間の枠と角丸がない
        background: [getComputedStyle(breadcrumb).backgroundColor, getComputedStyle(entry).backgroundColor],
        seam: [getComputedStyle(breadcrumb).borderBottomWidth, getComputedStyle(entry).borderTopWidth, getComputedStyle(entry).borderTopLeftRadius],
        items: [...visible('.breadcrumb a'), ...visible('.breadcrumb-child > span')],
      };
    });

    // パンくずは記事のカードと同じ幅で、すぐ上につながる(継ぎ目のにじみを隠すため1px重ねる)
    expect(layout.breadcrumb.left).toBeCloseTo(layout.entry.left, 0);
    expect(layout.breadcrumb.width).toBeCloseTo(layout.entry.width, 0);
    expect(Math.abs(layout.breadcrumb.bottom - layout.entry.top)).toBeLessThanOrEqual(1);
    expect(layout.background[0]).toBe(layout.background[1]);
    expect(layout.seam).toEqual(['0px', '0px', '0px']);
    // タイトルの上にパンくず、タイトルの下に日付とカテゴリを1行に並べる
    expect(layout.title.top).toBeGreaterThan(layout.breadcrumb.top);
    expect(layout.date.top).toBeGreaterThan(layout.title.bottom - 1);
    expect(Math.abs((layout.date.top + layout.date.bottom) / 2 - (layout.categories.top + layout.categories.bottom) / 2)).toBeLessThanOrEqual(2);
    expect(layout.categories.left).toBeGreaterThan(layout.date.right);
    // パンくずの最後(記事のタイトル)は、すぐ下にタイトルがあるので出さない
    expect(layout.items).toEqual(['トップ', 'test']);
  });

  test('アバウトページが正しくレンダリングされる', async ({ page }) => {
    await page.navigateTo(TEST_URLS.ABOUT, { waitFor: 'networkidle' });

    await page.screenshot({ path: 'screenshots/about-page.png', fullPage: true });

    await expect(page.locator('.page-about')).toBeVisible();
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();
  });
});

test.describe('アーカイブページのテスト', () => {
  test('アーカイブページが正しくレンダリングされる', async ({ page }) => {
    await page.navigateTo(TEST_URLS.ARCHIVE, { waitFor: 'networkidle' });

    await page.screenshot({ path: 'screenshots/archive-page.png', fullPage: true });

    await expect(page.locator(SELECTORS.PAGE_ARCHIVE)).toBeVisible();
    await expect(page.locator(SELECTORS.ARCHIVE_ENTRIES)).toBeVisible();
    expect(await page.locator(SELECTORS.ARCHIVE_ENTRY).count()).toBeGreaterThan(0);
  });
});
