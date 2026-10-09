// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, TIMEOUTS } from './constants.js';

/**
 * 印刷スタイルのテスト (theme-design-spec.md の「印刷」を参照)
 *
 * 紙は横スクロールも開閉操作もできないため、画面と同じ描画では内容が欠落する。
 */
test.describe('印刷スタイルのテスト', () => {
  /** 印刷時に問題になる箇所をまとめて測る */
  const measure = (/** @type {any} */ page) => page.evaluate(() => {
    // 要素が無いときはnullを返す。'none'などの文字列を返すとセレクタの誤りが
    // 「隠れている」と区別できず、間違ったセレクタのまま通ってしまう
    const displayOf = (/** @type {string} */ selector) => {
      const el = document.querySelector(selector);
      return el ? getComputedStyle(el).display : null;
    };
    const codeBlocks = [...document.querySelectorAll('.entry-content pre')];
    const details = [...document.querySelectorAll('.entry-content details:not([open])')];
    return {
      // 紙幅をはみ出している量。0でなければその分が印刷されない
      codeOverflow: codeBlocks.map((el) => Math.round(el.scrollWidth - el.clientWidth)),
      // 閉じたdetailsの高さ。summaryだけだと中身が印刷されない
      closedDetailsHeights: details.map((el) => Math.round(el.getBoundingClientRect().height)),
      hidden: {
        codeBlockToolbar: displayOf('.code-block-toolbar'),
        colorModeToggle: displayOf('.color-mode-toggle'),
        sidebar: displayOf('#box2'),
        entryFooterModules: displayOf('#entry-footer-secondary-modules'),
        globalHeader: displayOf('#globalheader-container'),
        blogControlls: displayOf('.blog-controlls'),
        entryHeaderMenu: displayOf('.entry-header-menu'),
        star: displayOf('.hatena-star-container'),
        socialButtons: displayOf('.social-buttons'),
        pager: displayOf('.pager'),
      },
    };
  });

  test('印刷時にコードブロックが紙幅で折り返される', async ({ page }) => {
    await page.navigateTo(TEST_URLS.CODE_HIGHLIGHT, { waitFor: 'networkidle' });
    await expect(page.locator('.entry-content pre').first()).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

    await page.emulateMedia({ media: 'print' });
    const print = await measure(page);

    // 前提: コードブロックがあること
    expect(print.codeOverflow.length).toBeGreaterThan(0);
    // 紙では1文字も欠けない
    expect(print.codeOverflow.every((over) => over === 0), `はみ出し量: ${print.codeOverflow}`).toBe(true);
  });

  test('印刷時に閉じたdetailsの中身も出力される', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator('.entry-content details').first()).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

    const screen = await measure(page);
    // 前提: 閉じたdetailsが存在すること
    expect(screen.closedDetailsHeights.length).toBeGreaterThan(0);

    await page.emulateMedia({ media: 'print' });
    const print = await measure(page);

    // summaryだけの高さから増えていること(中身が展開されている)
    print.closedDetailsHeights.forEach((height, i) => {
      expect(height).toBeGreaterThan(screen.closedDetailsHeights[i]);
    });
  });

  test('印刷時は画面外の本文も描画される', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    // 画面外にある最後の段落を測る。描画を後回しにしている間は仮の高さ(contain-intrinsic-size)になる
    const measureLast = () => page.evaluate(() => {
      const paragraphs = [...document.querySelectorAll('.entry-content > p')].filter((el) => el.textContent?.trim());
      const el = paragraphs[paragraphs.length - 1];
      return {
        offscreen: el.getBoundingClientRect().top > innerHeight,
        contentVisibility: getComputedStyle(el).contentVisibility,
        height: el.getBoundingClientRect().height,
      };
    });
    const screen = await measureLast();
    // 前提: 画面では画面外の段落の描画を後回しにしていること
    expect(screen.offscreen).toBe(true);
    expect(screen.contentVisibility).toBe('auto');

    await page.emulateMedia({ media: 'print' });
    const print = await measureLast();
    // 画面用のセレクタより詳細度が低いと戻せない(theme-design-spec.md の「描画の後回し」を参照)
    expect(print.contentVisibility).toBe('visible');
    // 仮の高さから実際の高さに変わっていること
    expect(print.height).not.toBe(screen.height);
  });

  test('印刷時は目次を本文の横に止めず、本文中にすべて出す', async ({ page }) => {
    // 横向きの紙のように幅が広くても、止める・中でスクロールする目次は紙では途中が切れる
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator('.entry-content > :is(.table-of-contents, .toc-panel)')).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

    const measureToc = () => page.evaluate(() => {
      const toc = /** @type {Element} */ (document.querySelector('.entry-content > :is(.table-of-contents, .toc-panel)'));
      return {
        position: getComputedStyle(toc).position,
        clipped: toc.scrollHeight - toc.clientHeight,
      };
    });
    // 前提: 画面では本文の横に止めていること
    expect((await measureToc()).position).toBe('sticky');

    await page.emulateMedia({ media: 'print' });
    const print = await measureToc();
    expect(print.position).toBe('static');
    expect(print.clipped).toBe(0);
  });

  test('印刷時に操作専用のUIとサイドバーが出力されない', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator('.entry-content').first()).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

    // 記事の編集ボタンはブログ主のログイン時のみ描画されるため、同じclassのダミーで代替する
    await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'entry-header-menu';
      document.querySelector('.entry-header')?.appendChild(el);
    });

    // 前提: 対象がページに存在し、画面では表示されていること。
    // 存在チェックを先に置くことで、セレクタを間違えたときに印刷側ではなくここで落ちる
    const screen = await measure(page);
    Object.entries(screen.hidden).forEach(([name, display]) => {
      expect(display, `${name}がページに存在しない(セレクタの誤り、またはこのブログの構成に無い)`).not.toBeNull();
      expect(display, `画面で${name}が表示されていない`).not.toBe('none');
    });

    await page.emulateMedia({ media: 'print' });
    const print = await measure(page);

    Object.entries(print.hidden).forEach(([name, display]) => {
      expect(display, `印刷時に${name}が隠れていない`).toBe('none');
    });
  });
});
