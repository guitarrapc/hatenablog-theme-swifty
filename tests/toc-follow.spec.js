// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { FIXTURE_URLS, VIEWPORTS, TIMEOUTS } from './constants.js';

/**
 * 長い目次で、いま読んでいる見出しを追うテスト (component-specs.md の「目次の開閉」、theme-design-spec.md の「目次」を参照)
 *
 * 本文の横の目次は画面の高さに収めて中でスクロールするので、長い目次ではいま読んでいる見出しのリンク(:target-current)が
 * 目次の見えている範囲の外に出る。js/toc-toggle.js は、ページがスクロールしたら目次の中だけをスクロールしてリンクを見せる。
 *
 * 印はブラウザが付ける。テストを並べて動かして負荷が高いとき、Chromiumがそのページを開いている間ずっと印を移さなくなることがある
 * (16並列で180回中10回。スクリプトの有無、本文の描画の後回しの有無に関わらない。ページの先頭に戻ってから戻る、
 * ホイールでスクロールする、画面の大きさを変えるのでは戻らない)。
 * 印が止まるとスクリプトは追えないので、印が移ったことを前提として確かめ、止まったときは新しいページでやり直す
 */

const SIDE = VIEWPORTS.DESKTOP;
const INLINE = { width: 1024, height: 900 };

test.describe('長い目次で、いま読んでいる見出しを追う', () => {
  test.describe.configure({ retries: 2 });

  const LONG_SIDE = { width: SIDE.width, height: 900 };

  /** いま読んでいる見出しのリンクが、目次の見えている範囲(見出しの行の下、画面の中)にあるか */
  const followState = (/** @type {any} */ page) => page.evaluate(() => {
    const panel = /** @type {HTMLElement} */ (document.querySelector('.entry-content > .toc-panel'));
    const summary = /** @type {Element} */ (panel.querySelector(':scope > .toc-panel-summary'));
    const current = [...panel.querySelectorAll('a')].find((a) => a.matches(':target-current'));
    const rect = current?.getBoundingClientRect();
    const top = Math.max(summary.getBoundingClientRect().bottom, 0);
    const bottom = Math.min(panel.getBoundingClientRect().bottom, innerHeight);
    return {
      current: current ? decodeURIComponent(/** @type {HTMLAnchorElement} */ (current).hash.slice(1)) : null,
      visible: !!rect && rect.top >= top - 0.5 && rect.bottom <= bottom + 0.5,
      scrollY: Math.round(scrollY),
      tocScrollTop: panel.scrollTop,
      tocOverflows: panel.scrollHeight > panel.clientHeight,
      // 目次の上の線(clientTop)の内側から測る
      summaryOffset: summary.getBoundingClientRect().top - panel.getBoundingClientRect().top - panel.clientTop,
      summaryPosition: getComputedStyle(summary).position,
    };
  });

  /**
   * 本文の見出しのうち、記事の中での位置(0〜1)にあるものの id。
   * Fixture記事の見出しの名前は書き換えられることがあるので、名前ではなく位置で選ぶ
   */
  const headingAt = (/** @type {any} */ page, /** @type {number} */ position) => page.evaluate((/** @type {number} */ position) => {
    const ids = [...document.querySelectorAll('.entry-content > :is(h1, h2, h3, h4, h5, h6)')].map((h) => h.id);
    return ids[Math.min(ids.length - 1, Math.floor(ids.length * position))];
  }, position);

  /** その節の見出しが画面の上に来るまでページをスクロールし、ブラウザが印をその節に移すのを待つ */
  const readSection = async (/** @type {any} */ page, /** @type {string} */ id) => {
    await page.evaluate((/** @type {string} */ id) => document.getElementById(id)?.scrollIntoView({ block: 'start' }), id);
    // 印はスクロールの次のフレームで移る
    await expect.poll(async () => (await followState(page)).current, { message: `前提: ブラウザが印を「${id}」に移すこと` }).toBe(id);
    return page.evaluate(() => Math.round(scrollY));
  };

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(LONG_SIDE);
    await page.navigateTo(FIXTURE_URLS.TOC_LONG, { waitFor: 'networkidle' });
    await expect(page.locator('.entry-content > .toc-panel')).toHaveCount(1, { timeout: TIMEOUTS.VERY_LONG });
    // 後回しにしている本文が描かれて高さが変わると、ブラウザがページのスクロール位置を直すので、
    // 目次のスクリプトがページをスクロールしていないことを測れるよう、先に全部描く
    await page.addStyleTag({ content: '.entry-content > * { content-visibility: visible !important; }' });
    // :target-current はChromium系のみ。非対応のブラウザでは現在地の印がないので追わない
    const supported = await page.evaluate(() => CSS.supports('selector(:target-current)'));
    test.skip(!supported, ':target-current に対応していないブラウザ');
  });

  test('いま読んでいる見出しのリンクが見える位置まで、目次の中だけをスクロールする', async ({ page }) => {
    expect((await followState(page)).tocOverflows, '前提: 目次が画面より長く、中でスクロールすること').toBe(true);

    // 目次の下のほう(見えている範囲の外)の見出しと、本文の終わりで目次も上へ流れる最後の見出し
    for (const position of [0.6, 0.8, 1]) {
      const id = await headingAt(page, position);
      const scrollY = await readSection(page, id);
      await expect.poll(async () => (await followState(page)).visible, { message: `「${id}」のリンクが見える` }).toBe(true);
      // ページはスクロールしない
      expect((await followState(page)).scrollY).toBe(scrollY);
    }
    expect((await followState(page)).tocScrollTop).toBeGreaterThan(0);
  });

  test('読み手が目次の中を自分でスクロールしたときは、いま読んでいる見出しへ引き戻さない', async ({ page }) => {
    await readSection(page, await headingAt(page, 0.8));
    await expect.poll(async () => (await followState(page)).visible).toBe(true);

    // 目次の上でホイールを回して先頭まで戻す。いま読んでいる見出しのリンクは見えている範囲の外に出る
    const box = /** @type {{ x: number, y: number, width: number, height: number }} */ (await page.locator('.entry-content > .toc-panel').boundingBox());
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // 一度に大きく回したり、間を空けずに続けて回したりするとスクロールしないので、少しずつ間を空けて回す
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, -600);
      await page.waitForTimeout(300);
    }
    await expect.poll(async () => (await followState(page)).tocScrollTop).toBe(0);

    // スクロールが止まった後(目次の scrollend)も、目次はそのまま
    await page.waitForTimeout(1000);
    const state = await followState(page);
    expect(state.tocScrollTop).toBe(0);
    expect(state.visible).toBe(false);
  });

  test('目次の中をスクロールしても、見出しの行は目次の上に残り、閉じられる', async ({ page }) => {
    await readSection(page, await headingAt(page, 0.8));
    await expect.poll(async () => (await followState(page)).tocScrollTop).toBeGreaterThan(0);

    const state = await followState(page);
    expect(state.summaryPosition).toBe('sticky');
    // 目次の内側の余白(4px)の下に止まる
    expect(state.summaryOffset).toBeCloseTo(4, 0);
    await page.locator('.toc-panel-summary').click();
    await expect(page.locator('.entry-content > .toc-panel')).not.toHaveAttribute('open');
  });

  test('本文中の目次は目次の中でスクロールしないので追わず、見出しの行も画面に張り付かない', async ({ page }) => {
    await page.setViewportSize(INLINE);
    const scrollY = await readSection(page, await headingAt(page, 0.8));
    await page.waitForTimeout(TIMEOUTS.SHORT);

    const state = await followState(page);
    expect(state.tocOverflows).toBe(false);
    expect(state.tocScrollTop).toBe(0);
    expect(state.scrollY).toBe(scrollY);
    expect(state.summaryPosition).not.toBe('sticky');
  });
});
