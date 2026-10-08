// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, SELECTORS, VIEWPORTS, TIMEOUTS } from './constants.js';

/**
 * 目次のテスト (theme-design-spec.md の「目次」を参照)
 *
 * はてなが本文中に出力する ul.table-of-contents を、JavaScriptなしで
 * 広い画面では本文の横に常に表示し、狭い画面では書かれた位置に表示する。
 *
 * 開閉のJavaScript(js/toc-toggle.js)を導入していないブログでの表示を確かめるため、
 * 開発用ブログのheadが読み込むそのスクリプトを止めて測る。開閉は toc-toggle.spec.js で確かめる
 */
test.beforeEach(async ({ page }) => {
  await page.route('**/js/toc-toggle.js', (route) => route.abort());
});

/** 後回しにしている本文を一度描かせて、実際の高さで測れるようにする */
const renderAll = (/** @type {any} */ page) => page.evaluate(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
    scrollTo(0, y);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }
  scrollTo(0, 0);
});

/** 本文の直下の要素(目次を除く)どうしの間隔 */
const measureGaps = (/** @type {any} */ page) => page.evaluate(() => {
  const children = [...document.querySelectorAll('.entry-content > :not(.table-of-contents)')];
  return children.slice(1).map((el, i) => ({
    element: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}`,
    gap: Math.round(el.getBoundingClientRect().top - children[i].getBoundingClientRect().bottom),
  }));
});

/** 目次を本文の横に置かず、目次がない状態の本文に戻す */
const FLOW_LAYOUT = `
  .entry-content:has(> .table-of-contents) { display: block !important; }
  .entry-content > .table-of-contents { display: none !important; }
`;

/** 後回しのままだと画面外の要素が仮の高さになるので、間隔を比べるときは解除する */
const RENDER_ALL = '.entry-content > * { content-visibility: visible !important; }';

test.describe('目次を本文の横に常に表示する', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.DESKTOP);
  });

  test('目次が本文の右の列に並ぶ', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.TABLE_OF_CONTENTS)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

    const layout = await page.evaluate(() => {
      const toc = /** @type {Element} */ (document.querySelector('.entry-content > .table-of-contents'));
      const paragraph = /** @type {Element} */ (document.querySelector('.entry-content > p'));
      const header = /** @type {Element} */ (document.querySelector('.entry-header .entry-title'));
      return {
        toc: toc.getBoundingClientRect().toJSON(),
        paragraph: paragraph.getBoundingClientRect().toJSON(),
        title: header.getBoundingClientRect().toJSON(),
        position: getComputedStyle(toc).position,
      };
    });

    expect(layout.position).toBe('sticky');
    // 目次は本文の右にあり、重ならない
    expect(layout.toc.left).toBeGreaterThan(layout.paragraph.right);
    // 目次は本文の先頭の高さから始まる
    expect(Math.abs(layout.toc.top - layout.paragraph.top)).toBeLessThan(40);
    // 記事のタイトルは本文の列に揃い、目次の列にはみ出さない
    expect(layout.title.right).toBeLessThanOrEqual(layout.paragraph.right + 1);
  });

  test('スクロールしても目次が画面内に止まる', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.TABLE_OF_CONTENTS)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight / 2));
    await page.waitForTimeout(TIMEOUTS.SHORT);

    const toc = await page.evaluate(() => {
      const el = /** @type {Element} */ (document.querySelector('.entry-content > .table-of-contents'));
      const rect = el.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, stickyTop: parseFloat(getComputedStyle(el).top) };
    });

    // 画面の上端から --toc-sticky-top の位置に止まり、下端も画面内に収まる(長い目次は目次の中でスクロールする)
    expect(Math.abs(toc.top - toc.stickyTop)).toBeLessThanOrEqual(1);
    expect(toc.bottom).toBeLessThanOrEqual(VIEWPORTS.DESKTOP.height);
  });

  test('いま読んでいる見出しを目次で示す', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.TABLE_OF_CONTENTS)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

    // :target-current はChromium系のみ。非対応のブラウザでは示さないだけで目次は使える
    const supported = await page.evaluate(() => CSS.supports('selector(:target-current)'));
    test.skip(!supported, ':target-current に対応していないブラウザ');

    for (const id of ['引用', 'テーブル']) {
      await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: 'start' }), id);
      await page.waitForTimeout(TIMEOUTS.SHORT);
      const current = await page.evaluate(() =>
        [...document.querySelectorAll('.entry-content > .table-of-contents a')]
          .filter((a) => a.matches(':target-current'))
          .map((a) => decodeURIComponent(/** @type {HTMLAnchorElement} */(a).hash.slice(1))));
      expect(current).toEqual([id]);
    }

    // 色だけに頼らず、太字と線でも示す
    const style = await page.evaluate(() => {
      const of = (/** @type {string} */ id) => getComputedStyle(/** @type {Element} */(
        document.querySelector(`.entry-content > .table-of-contents a[href="#${id}"]`)));
      return {
        currentWeight: of('テーブル').fontWeight,
        currentBorder: of('テーブル').borderLeftColor,
        otherBorder: of('引用').borderLeftColor,
      };
    });
    expect(Number(style.currentWeight)).toBeGreaterThanOrEqual(700);
    expect(style.currentBorder).not.toBe(style.otherBorder);
  });

  for (const [name, path] of Object.entries({
    サンプル記事: TEST_URLS.SAMPLE_ARTICLE,
    コードハイライト記事: TEST_URLS.CODE_HIGHLIGHT,
  })) {
    test(`目次を横に置いても本文の間隔が変わらない(${name})`, async ({ page }) => {
      await page.navigateTo(path, { waitFor: 'networkidle' });
      await expect(page.locator(SELECTORS.TABLE_OF_CONTENTS)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });
      await renderAll(page);
      await page.addStyleTag({ content: RENDER_ALL });

      // 前提: 目次を横に置くために本文がグリッドになっていること
      const display = await page.evaluate(() => getComputedStyle(/** @type {Element} */(document.querySelector('.entry-content'))).display);
      expect(display).toBe('grid');
      const side = await measureGaps(page);

      await page.addStyleTag({ content: FLOW_LAYOUT });
      const flow = await measureGaps(page);

      // グリッドではマージンが相殺されないため、相殺に頼った余白があるとここで差が出る
      expect(side.length).toBe(flow.length);
      side.forEach((s, i) => {
        expect(s.gap, `${s.element} の上の間隔: 横に目次 ${s.gap}px / 目次なし ${flow[i].gap}px`).toBe(flow[i].gap);
      });
    });
  }

  test('目次が本文より長くても本文の間隔は広がらない', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.TABLE_OF_CONTENTS)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });
    await page.addStyleTag({ content: RENDER_ALL });

    // 目次より短い記事を作る(先頭の段落・目次・見出しだけ残す)
    await page.evaluate(() => {
      const content = /** @type {Element} */ (document.querySelector('.entry-content'));
      [...content.children].slice(3).forEach((el) => el.remove());
    });
    const heights = await page.evaluate(() => ({
      toc: document.querySelector('.entry-content > .table-of-contents')?.getBoundingClientRect().height ?? 0,
      content: document.querySelector('.entry-content')?.getBoundingClientRect().height ?? 0,
    }));
    // 前提: 目次のほうが長いこと
    expect(heights.toc).toBeGreaterThanOrEqual(heights.content - 1);
    const side = await measureGaps(page);

    await page.addStyleTag({ content: FLOW_LAYOUT });
    const flow = await measureGaps(page);

    // 目次の高さのぶんは本文の後ろに空き、本文の要素の間には入らない
    expect(side).toEqual(flow);
  });

  test('目次のない記事では本文を中央に置き、目次の列を作らない', async ({ page }) => {
    await page.navigateTo(TEST_URLS.ARTICLE_WITHOUT_TOC, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

    const layout = await page.evaluate(() => {
      const entry = /** @type {Element} */ (document.querySelector('.entry'));
      const content = /** @type {Element} */ (document.querySelector('.entry-content'));
      const e = entry.getBoundingClientRect();
      const c = content.getBoundingClientRect();
      return {
        hasToc: !!content.querySelector(':scope > .table-of-contents'),
        display: getComputedStyle(content).display,
        contentWidth: c.width,
        contentMax: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--content-max')),
        leftSpace: c.left - e.left,
        rightSpace: e.right - c.right,
      };
    });

    expect(layout.hasToc, '前提: 目次のない記事であること').toBe(false);
    expect(layout.display).not.toBe('grid');
    expect(layout.contentWidth).toBeLessThanOrEqual(layout.contentMax);
    expect(Math.abs(layout.leftSpace - layout.rightSpace)).toBeLessThanOrEqual(1);
  });
});

test.describe('狭い画面では目次を本文中に表示する', () => {
  test('目次は書かれた位置(先頭の段落の下)にあり、本文の幅で表示される', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.BELOW_SIDE_TOC);
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.TABLE_OF_CONTENTS)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

    const layout = await page.evaluate(() => {
      const toc = /** @type {Element} */ (document.querySelector('.entry-content > .table-of-contents'));
      const paragraph = /** @type {Element} */ (document.querySelector('.entry-content > p'));
      const content = /** @type {Element} */ (document.querySelector('.entry-content'));
      return {
        position: getComputedStyle(toc).position,
        toc: toc.getBoundingClientRect().toJSON(),
        paragraph: paragraph.getBoundingClientRect().toJSON(),
        content: content.getBoundingClientRect().toJSON(),
      };
    });

    expect(layout.position).toBe('static');
    expect(layout.toc.top).toBeGreaterThanOrEqual(layout.paragraph.bottom);
    expect(Math.abs(layout.toc.width - layout.content.width)).toBeLessThanOrEqual(1);
  });
});
