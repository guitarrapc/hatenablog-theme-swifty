// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, FIXTURE_URLS, SELECTORS, TIMEOUTS } from './constants.js';

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

/** 記事を開き、後回しにしている本文も測れるようにする */
const openArticle = async (/** @type {any} */ page, /** @type {string} */ path) => {
  await page.navigateTo(path, { waitFor: 'networkidle' });
  await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });
  await page.addStyleTag({ content: '.entry-content > * { content-visibility: visible !important; }' });
};

// 書き方ごとの記事と、見出しの段ごとに期待する役割
const HEADING_ARTICLES = [
  {
    name: '「#」から書く記事',
    path: TEST_URLS.SAMPLE_ARTICLE,
    expected: { h1: 'band', h2: 'dashed', h3: 'bar', h4: 'minor', h5: 'minor', h6: 'minor' },
  },
  {
    name: '「##」から書く記事',
    path: FIXTURE_URLS.HEADINGS_H2,
    expected: { h2: 'band', h3: 'dashed', h4: 'bar', h5: 'minor', h6: 'minor' },
  },
  {
    name: 'はてな記法・見たままモードと同じh3から始まる記事',
    path: FIXTURE_URLS.HEADINGS_H3,
    expected: { h3: 'band', h4: 'dashed', h5: 'bar', h6: 'minor' },
  },
  {
    // いちばん上に使われている段が帯になるので、h1が1つでも混ざればh1が帯、h2が破線になる
    name: '「##」の記事にh1が1つ混ざる',
    path: FIXTURE_URLS.HEADINGS_H1_MIXED,
    expected: { h1: 'band', h2: 'dashed', h3: 'bar', h4: 'minor' },
  },
];

test.describe('見出し', () => {
  for (const { name, path, expected } of HEADING_ARTICLES) {
    test(`いちばん上の段を帯にし、破線・縦棒と続ける(${name})`, async ({ page }) => {
      await openArticle(page, path);
      const headings = await measureHeadings(page);

      expect(rolesByTag(headings)).toEqual(expected);

      // 縦棒は上の余白に引かず、帯では帯の高さいっぱいに引く(帯が折り返して何行になっても)
      for (const h of headings.filter((h) => h.barTop !== null)) {
        expect(h.barTop, `${h.id} の縦棒の上端`).toBeGreaterThanOrEqual(h.space - 0.5);
        expect(h.barHeight, `${h.id} の縦棒の高さ`).toBeGreaterThan(0);
        if (h.role === 'band') {
          expect(Math.abs((h.barHeight ?? 0) - h.bandHeight), `${h.id} の縦棒 ${h.barHeight}px / 帯 ${h.bandHeight}px`).toBeLessThanOrEqual(0.5);
        }
      }
    });
  }

  test('どの段が帯や破線になっても、役割が同じなら見た目(文字の大きさ)は同じ', async ({ page }) => {
    /** @type {Record<string, Set<string>>} */
    const sizes = { band: new Set(), dashed: new Set(), bar: new Set() };
    for (const { path } of HEADING_ARTICLES) {
      await openArticle(page, path);
      for (const h of await measureHeadings(page)) sizes[h.role]?.add(h.fontSize);
    }
    for (const [role, values] of Object.entries(sizes)) {
      expect([...values], `${role} の文字の大きさ`).toHaveLength(1);
    }
  });

  test('左の縦棒は見出しだけの印にし、引用の線とは色で区別する', async ({ page }) => {
    await openArticle(page, TEST_URLS.SAMPLE_ARTICLE);
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
    await openArticle(page, TEST_URLS.SAMPLE_ARTICLE);
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
    // タイトルは字間を詰めない(詰めると日本語が窮屈に見える)
    expect(result.title).toBe(0);
  });
});
