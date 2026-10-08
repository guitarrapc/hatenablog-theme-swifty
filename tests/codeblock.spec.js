// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, VIEWPORTS, TIMEOUTS } from './constants.js';
import { BLOG_URL } from '../blog.config.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * コードブロックのテスト (theme-design-spec.md の「コードブロック」、component-specs.md の「コードブロック」を参照)
 *
 * ハイライトははてなのコードブロック(synXxx)を使い、言語名の帯はCSSだけで出す。
 * js/codeblock.js は帯の右端に折り返し・コピーのボタンを置く。
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const codeblockJs = fs.readFileSync(path.resolve(__dirname, '../js/codeblock.js'), 'utf-8');

const HEADER_HEIGHT = 36; // _codeblock.scss の $code-header-height (2.25rem)

/** WCAGのコントラスト比(rgb()の値どうし) */
const contrast = (/** @type {string} */ foreground, /** @type {string} */ background) => {
  const luminance = (/** @type {string} */ value) => {
    const [r, g, b] = (value.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = luminance(foreground) + 0.05;
  const b = luminance(background) + 0.05;
  return Number((Math.max(a, b) / Math.min(a, b)).toFixed(2));
};

const openCodeArticle = async (/** @type {any} */ page) => {
  await page.navigateTo(TEST_URLS.CODE_HIGHLIGHT, { waitFor: 'networkidle' });
  await expect(page.locator('.entry-content pre.code').first()).toBeVisible({ timeout: TIMEOUTS.VERY_LONG });
  // 後回しにしている本文も測れるようにする
  await page.addStyleTag({ content: '.entry-content > * { content-visibility: visible !important; }' });
};

test.describe('コードブロック(CSS)', () => {
  test('はてなのコードブロックの上の帯に言語名を出し、横にスクロールしても帯は左端に残る', async ({ page }) => {
    await openCodeArticle(page);

    const blocks = await page.evaluate(() => [...document.querySelectorAll('.entry-content pre.code')].map((pre) => {
      const header = getComputedStyle(pre, '::before');
      return {
        lang: pre.getAttribute('data-lang'),
        content: header.content,
        position: header.position,
        left: header.left,
        height: header.height,
        color: header.color,
        background: header.backgroundColor,
      };
    }));

    expect(blocks.length, '前提: コードブロックがあること').toBeGreaterThan(0);
    for (const b of blocks) {
      expect(b.content, `${b.lang} の言語名`).toBe(`"${b.lang}"`);
      expect(b.position).toBe('sticky');
      expect(b.left).toBe('0px');
      expect(b.height).toBe(`${HEADER_HEIGHT}px`);
      // 言語名は帯の背景に対してWCAG AA(4.5:1)
      expect(contrast(b.color, b.background), `${b.lang} の言語名 ${b.color} on ${b.background}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('はてなのハイライトの種類ごとに色を分ける', async ({ page }) => {
    await openCodeArticle(page);

    const colors = await page.evaluate(() => Object.fromEntries(
      ['synStatement', 'synPreProc', 'synType', 'synIdentifier', 'synConstant', 'synSpecial', 'synComment'].map((cls) => {
        const el = document.querySelector(`.entry-content pre.code .${cls}`);
        return [cls, el ? getComputedStyle(el).color : null];
      })));

    for (const [cls, color] of Object.entries(colors)) {
      expect(color, `前提: ${cls} がコードハイライト記事にあること`).not.toBeNull();
    }
    // 7種類がすべて違う色(キーワードと型、記号と本文の文字が同じ色にならない)
    expect(new Set(Object.values(colors)).size).toBe(7);
    const text = await page.evaluate(() => getComputedStyle(/** @type {Element} */(document.querySelector('.entry-content pre.code'))).color);
    expect(Object.values(colors)).not.toContain(text);
  });

  test('はてなのアスキーアート(pre.lang-aa)はコードブロックにしない', async ({ page }) => {
    await openCodeArticle(page);

    const aa = await page.evaluate((script) => {
      document.querySelector('.entry-content')?.insertAdjacentHTML('beforeend', '<pre class="code lang-aa" data-lang="aa" data-unlink>(´・ω・`)</pre>');
      // 読み込み後に追加したので、スクリプトをもう一度実行して対象にならないことも確かめる
      new Function(script)();
      const pre = /** @type {Element} */ (document.querySelector('.entry-content pre.lang-aa'));
      return {
        fontFamily: getComputedStyle(pre).fontFamily,
        header: getComputedStyle(pre, '::before').content,
        wrapped: pre.parentElement?.classList.contains('code-block'),
      };
    }, codeblockJs);

    // はてなが指定するアスキーアート用のフォントのまま
    expect(aa.fontFamily).toContain('Mona');
    expect(aa.header).toBe('none');
    expect(aa.wrapped).toBe(false);
  });
});

test.describe('コードブロック(js/codeblock.js)', () => {
  test('コードブロックごとに、帯の中に折り返しとコピーのボタンを1組置く', async ({ page }) => {
    await openCodeArticle(page);

    const result = await page.evaluate(() => [...document.querySelectorAll('.entry-content pre.code')].map((pre) => {
      const wrapper = pre.parentElement;
      const toolbar = wrapper?.querySelector(':scope > .code-block-toolbar');
      const preRect = pre.getBoundingClientRect();
      const toolbarRect = toolbar?.getBoundingClientRect();
      return {
        lang: pre.getAttribute('data-lang'),
        wrapped: wrapper?.classList.contains('code-block'),
        buttons: [...(toolbar?.querySelectorAll('button') ?? [])].map((b) => ({ text: b.textContent, type: b.getAttribute('type'), height: b.getBoundingClientRect().height })),
        toolbarTop: toolbarRect ? toolbarRect.top - preRect.top : null,
        toolbarBottom: toolbarRect ? toolbarRect.bottom - preRect.top : null,
        toolbarRight: toolbarRect ? preRect.right - toolbarRect.right : null,
      };
    }));

    expect(result.length, '前提: コードブロックがあること').toBeGreaterThan(0);
    for (const r of result) {
      expect(r.wrapped, r.lang ?? '').toBe(true);
      expect(r.buttons.map((b) => b.text), r.lang ?? '').toEqual(['Wrap', 'Copy']);
      for (const b of r.buttons) {
        expect(b.type).toBe('button');
        // タップ領域(WCAG 2.5.8)
        expect(b.height).toBeGreaterThanOrEqual(24);
      }
      // ボタンは帯の中に収まり、コードに重ならない
      expect(r.toolbarTop ?? -1).toBeGreaterThanOrEqual(0);
      expect(r.toolbarBottom ?? Infinity).toBeLessThanOrEqual(HEADER_HEIGHT + 1);
      expect(r.toolbarRight ?? -1).toBeGreaterThan(0);
    }
  });

  test('ボタンを置いてもコードブロックの高さもコードの位置も変わらない', async ({ page }) => {
    await openCodeArticle(page);

    const measure = () => page.evaluate(() => {
      const pre = /** @type {Element} */ (document.getElementById('added-code'));
      const range = document.createRange();
      range.selectNodeContents(pre);
      return { height: pre.getBoundingClientRect().height, codeTop: range.getClientRects()[0].top - pre.getBoundingClientRect().top };
    });

    // 読み込み後に追加したコードブロックで、スクリプトを実行する前後を比べる
    await page.evaluate(() => {
      document.querySelector('.entry-content')?.insertAdjacentHTML('beforeend',
        '<pre class="code lang-sh" data-lang="sh" data-unlink id="added-code"><span class="synStatement">echo</span> <span class="synConstant">&quot;hello&quot;</span>\n</pre>');
    });
    const before = await measure();
    await page.evaluate(codeblockJs);
    await expect(page.locator('#added-code')).toHaveCount(1);
    expect(await page.evaluate(() => document.getElementById('added-code')?.parentElement?.className)).toBe('code-block');
    const after = await measure();

    expect(after).toEqual(before);
  });

  test('スクリプトを複数回実行してもボタンは増えない', async ({ page }) => {
    await openCodeArticle(page);

    const count = () => page.locator('.entry-content .code-block-toolbar').count();
    const before = await count();
    await page.evaluate(codeblockJs);
    expect(await count()).toBe(before);
    expect(await page.locator('.entry-content .code-block > .code-block').count()).toBe(0);
  });

  test('コピーボタンでコードだけをコピーし、結果をボタンとスクリーンリーダーに伝える', async ({ page }) => {
    // 同じoriginへの許可は置き換わるので、開発サーバーを読むための local-network-access も渡し直す
    await page.context().grantPermissions(['local-network-access', 'clipboard-read', 'clipboard-write'], { origin: BLOG_URL });
    await openCodeArticle(page);

    const block = page.locator('.entry-content .code-block').first();
    const copy = block.locator('.code-block-copy');
    const status = block.locator('.code-block-status');
    const expected = await block.locator('pre').evaluate((pre) => pre.textContent);

    await copy.click();
    await expect(copy).toHaveText('Copied!');
    await expect(copy).toHaveClass(/is-copied/);
    await expect(status).toHaveText('Copied!');
    await expect(status).toHaveAttribute('role', 'status');
    // 言語名(疑似要素)やボタンの文字は含まず、コードだけ。
    // Windowsのクリップボードは読み出すときに改行をCRLFにするので、改行をそろえて比べる
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.replace(/\r\n/g, '\n')).toBe(expected);

    // 2秒で元に戻る
    await expect(copy).toHaveText('Copy', { timeout: 4000 });
    await expect(status).toHaveText('');
  });

  test('コピーできなかったときは失敗を伝える', async ({ page }) => {
    await openCodeArticle(page);
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true });
    });

    const block = page.locator('.entry-content .code-block').first();
    await block.locator('.code-block-copy').click();
    await expect(block.locator('.code-block-copy')).toHaveText('Copy failed');
    await expect(block.locator('.code-block-status')).toHaveText('Copy failed');
  });

  test('折り返しボタンで、横スクロールと折り返しを切り替える', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.MOBILE);
    await openCodeArticle(page);

    const block = page.locator('.entry-content .code-block').nth(1);
    const wrap = block.locator('.code-block-wrap');
    const overflow = () => block.locator('pre').evaluate((pre) => pre.scrollWidth - pre.clientWidth);

    // 前提: 狭い画面では横にはみ出していること
    await expect(wrap).toHaveAttribute('aria-pressed', 'false');
    expect(await overflow()).toBeGreaterThan(0);

    await wrap.click();
    await expect(wrap).toHaveAttribute('aria-pressed', 'true');
    expect(await overflow()).toBe(0);

    await wrap.click();
    await expect(wrap).toHaveAttribute('aria-pressed', 'false');
    expect(await overflow()).toBeGreaterThan(0);
  });

  test('配布用のcustomize-codeblock.htmlはjs/codeblock.jsと同じ処理である', async ({ page }) => {
    const html = fs.readFileSync(path.resolve(__dirname, '../customize-codeblock.html'), 'utf-8');
    // 正規表現ではなくブラウザのHTMLパーサーでscript要素を取り出す(DOMParserはスクリプトを実行しない)
    const scripts = await page.evaluate((source) => Array.from(new DOMParser().parseFromString(source, 'text/html').scripts)
      .map((script) => script.textContent ?? ''), html);
    expect(scripts).toHaveLength(1);

    // インデントとコメント行を除いて比較する
    const normalize = (/** @type {string} */ code) => code
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('//') && !line.startsWith('/**') && !line.startsWith('*'))
      .join('\n');
    expect(normalize(scripts[0])).toBe(normalize(codeblockJs));
  });
});
