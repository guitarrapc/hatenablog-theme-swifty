// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, SELECTORS, TIMEOUTS } from './constants.js';

/**
 * 本文の見出しのテスト (theme-design-spec.md の「見出しと引用」を参照)
 *
 * 見出しの形は段(h1〜h6)ではなく役割(帯・破線・縦棒)で決め、
 * 記事でいちばん上に使われている段を帯にする。
 * 書き方で大見出しの段が違う(マークダウンの「#」はh1、「##」はh2、はてな記法と見たままモードはh3)ため。
 */

/** 本文の直下の見出しの役割と寸法を測る */
const measureHeadings = (/** @type {any} */ page) => page.evaluate(() =>
  [...document.querySelectorAll('.entry-content > :is(h1, h2, h3, h4, h5, h6)')].map((h) => {
    const cs = getComputedStyle(h);
    const bar = getComputedStyle(h, '::before');
    const hasBar = bar.content !== 'none';
    const role = hasBar && parseFloat(bar.width) === 5 && cs.backgroundImage !== 'none' ? 'band'
      : hasBar && parseFloat(bar.width) === 3 ? 'bar'
        : cs.borderBottomStyle === 'dashed' ? 'dashed'
          : 'minor';
    // 見出しの上の余白(--heading-space)をpxで測る
    const probe = document.createElement('span');
    probe.style.cssText = 'position: absolute; height: var(--heading-space);';
    h.appendChild(probe);
    const space = probe.getBoundingClientRect().height;
    probe.remove();
    const height = h.getBoundingClientRect().height;
    return {
      id: h.id,
      tag: h.tagName.toLowerCase(),
      role,
      fontSize: cs.fontSize,
      space,
      barTop: hasBar ? parseFloat(bar.top) : null,
      barHeight: hasBar ? height - parseFloat(bar.top) - parseFloat(bar.bottom) : null,
      bandHeight: height - space,
      barColor: hasBar ? bar.backgroundColor : null,
    };
  }));

/** 段ごとの役割の一覧にする(同じ段の見出しは同じ役割になっていること) */
const rolesByTag = (/** @type {{tag: string, role: string}[]} */ headings) => {
  /** @type {Record<string, string>} */
  const roles = {};
  for (const h of headings) {
    expect(roles[h.tag] ?? h.role, `${h.tag} の役割が見出しごとに違う`).toBe(h.role);
    roles[h.tag] = h.role;
  }
  return roles;
};

/** 指定した段の見出しを本文から取り除き、その書き方の記事にする */
const removeHeadings = (/** @type {any} */ page, /** @type {string[]} */ tags) => page.evaluate((tags) => {
  for (const tag of tags) document.querySelectorAll(`.entry-content > ${tag}`).forEach((el) => el.remove());
}, tags);

test.describe('見出し', () => {
  test.beforeEach(async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });
    // 後回しにしている本文も測れるようにする
    await page.addStyleTag({ content: '.entry-content > * { content-visibility: visible !important; }' });
  });

  for (const { name, removed, expected } of [
    {
      name: '「#」から書く記事',
      removed: [],
      expected: { h1: 'band', h2: 'dashed', h3: 'bar', h4: 'minor', h5: 'minor', h6: 'minor' },
    },
    {
      name: '「##」から書く記事',
      removed: ['h1'],
      expected: { h2: 'band', h3: 'dashed', h4: 'bar', h5: 'minor', h6: 'minor' },
    },
    {
      name: 'はてな記法・見たままモードの記事(h3から)',
      removed: ['h1', 'h2'],
      expected: { h3: 'band', h4: 'dashed', h5: 'bar', h6: 'minor' },
    },
  ]) {
    test(`いちばん上の段を帯にし、破線・縦棒と続ける(${name})`, async ({ page }) => {
      const reference = await measureHeadings(page);
      const bandSize = reference.find((h) => h.role === 'band')?.fontSize;

      await removeHeadings(page, removed);
      const headings = await measureHeadings(page);

      expect(rolesByTag(headings)).toEqual(expected);
      // どの段が帯になっても、帯の見た目(大きさ)は同じ
      for (const h of headings.filter((h) => h.role === 'band')) {
        expect(h.fontSize, `${h.tag} の帯の文字の大きさ`).toBe(bandSize);
      }

      // 縦棒は上の余白に引かず、帯では帯の高さいっぱいに引く
      for (const h of headings.filter((h) => h.barTop !== null)) {
        expect(h.barTop, `${h.id} の縦棒の上端`).toBeGreaterThanOrEqual(h.space - 0.5);
        expect(h.barHeight, `${h.id} の縦棒の高さ`).toBeGreaterThan(0);
        if (h.role === 'band') {
          expect(Math.abs((h.barHeight ?? 0) - h.bandHeight), `${h.id} の縦棒 ${h.barHeight}px / 帯 ${h.bandHeight}px`).toBeLessThanOrEqual(0.5);
        }
      }
    });
  }

  test('実際に「##」だけで書いた記事でも、大見出しが帯になる', async ({ page }) => {
    await page.navigateTo(TEST_URLS.CODE_HIGHLIGHT, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });

    const headings = await measureHeadings(page);
    expect(headings.some((h) => h.tag === 'h1'), '前提: h1を使っていない記事であること').toBe(false);
    expect(rolesByTag(headings).h2).toBe('band');
  });

  test('左の縦棒は見出しだけの印にし、引用の線とは色で区別する', async ({ page }) => {
    const headings = await measureHeadings(page);
    const quoteLine = await page.evaluate(() => {
      const quote = document.querySelector('.entry-content blockquote');
      return quote ? getComputedStyle(quote).borderLeftColor : null;
    });

    expect(quoteLine, '前提: 引用があること').not.toBeNull();
    for (const h of headings.filter((h) => h.barColor !== null)) {
      expect(h.barColor, `${h.id} の縦棒`).not.toBe(quoteLine);
    }
  });

  test('見出しは本文より字間を詰め、下に24px空ける', async ({ page }) => {
    const result = await page.evaluate(() => {
      const letterSpacing = (/** @type {Element | null} */ el) => {
        if (!el) return null;
        const value = getComputedStyle(el).letterSpacing;
        return value === 'normal' ? 0 : parseFloat(value);
      };
      return {
        body: letterSpacing(document.querySelector('.entry-content > p')),
        title: letterSpacing(document.querySelector('.entry-title')),
        headings: [...document.querySelectorAll('.entry-content > :is(h1, h2, h3, h4, h5, h6)')].map((h) => ({
          id: h.id,
          letterSpacing: letterSpacing(h),
          marginBottom: parseFloat(getComputedStyle(h).marginBottom),
        })),
      };
    });

    expect(result.headings.length, '前提: 見出しがあること').toBeGreaterThan(0);
    for (const h of result.headings) {
      expect(h.letterSpacing, `${h.id} の字間`).toBeLessThan(result.body ?? 0);
      expect(h.marginBottom, `${h.id} の下の間隔`).toBe(24);
    }
    // タイトルは字間を少しマイナスにする
    expect(result.title).toBeLessThan(0);
  });
});
