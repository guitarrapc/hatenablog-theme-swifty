// @ts-check
import { test, url, paintedColor } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, VIEWPORTS, TIMEOUTS, schemeCss } from './constants.js';
import { DEV_SERVER_URL } from '../blog.config.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * はてなブックマークコメントのテスト (theme-design-spec.md の「記事」の「はてなブックマークコメント」、component-specs.md の「はてなブックマークコメント」を参照)
 *
 * はてなの設定で表示すると、記事下に iframe(.hatena-bookmark-comment-iframe)が出力され、中ははてなブックマークのスクリプトがはてなのCSSで描く。
 * テーマのCSSだけでできるのは iframe を記事下の段の1つとして置くところまでで、js/bookmark-comment.js を入れると中もテーマの形になる。
 *
 * 開発用ブログの設定(はてなブックマークコメントを表示するか、headでスクリプトを読み込むか)と、記事に付いたブックマークに左右されないよう、
 * はてなが出力する iframe とスクリプトの読み込みをHTMLに足し、はてなブックマークのAPIの応答を差し替えて確かめる。
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bookmarkCommentJs = fs.readFileSync(path.resolve(__dirname, '../js/bookmark-comment.js'), 'utf-8');

const IFRAME = 'iframe.hatena-bookmark-comment-iframe';
const SCRIPT = 'js/bookmark-comment.js';
// スクリプトが iframe に付ける状態(themed / default)
const STATE = 'data-swifty-bookmark-comment';
// 開発用ブログのデザインCSSでモードを固定していても、書いていない状態(OSに合わせる)に戻す
const AUTO = '<style>:root { --swifty-color-mode: initial; }</style>';

// はてなが出力する iframe (2026年10月に開発用ブログで出力されたもの)。記事下のブログパーツの入れ物(.customized-footer)の先頭に出る
const iframeMarkup = (/** @type {string} */ articleUrl) => `<iframe class="hatena-bookmark-comment-iframe" data-src="${new URL('/iframe/hatena_bookmark_comment', articleUrl).href}?canonical_uri=${encodeURIComponent(articleUrl)}" frameborder="0" scrolling="no" style="border: none; width: 100%;"></iframe>`;

// はてなブックマークのAPI(JSONP)が返すブックマーク。はてなは記事ページの iframe でコメントのあるものを3件まで出し、残りは「すべてのコメントを表示する」で出す
const BOOKMARKS = [
  { user: 'example-a', tags: ['design', 'css'], timestamp: '2026/10/10 12:34', comment: 'コードブロックの折り返しボタンが便利。' },
  { user: 'example-b', tags: [], timestamp: '2026/10/10 09:02', comment: 'あとで読む' },
  { user: 'example-c', tags: ['hatenablog', 'theme'], timestamp: '2026/10/09 23:11', comment: '長いコメントの例。折り返したときに名前やタグとどう並ぶかを確かめるために、ある程度の長さの文章を入れておく。URL https://example.com/very/long/path/to/something も入る。' },
  { user: 'example-d', tags: ['tag-only'], timestamp: '2026/10/09 20:00', comment: '' },
  { user: 'example-e', tags: [], timestamp: '2026/10/09 18:45', comment: '4件目のコメント' },
  { user: 'example-f', tags: [], timestamp: '2026/10/08 08:15', comment: '5件目のコメント' },
];
// 公開していないブックマークの数(見出しの「(公開 + 非公開)」に出る)
const PRIVATE_COUNT = 5;

// 1×1pxのGIF。アイコンははてなのサーバーに取りに行かない
const ICON = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

/**
 * 記事のHTMLとはてなブックマークのAPIの応答を差し替える(記事はまだ開かない)
 * @param {any} page
 * @param {{ script?: boolean, bookmarks?: typeof BOOKMARKS | null, head?: string, headStart?: string }} [options]
 *   script: js/bookmark-comment.js を読み込むか。bookmarks: 記事のブックマーク(null はブックマークなし)。
 *   head: head の末尾に足すHTML(デザインCSSなど)。headStart: head の先頭に足すHTML(スクリプトが実行される前に効かせるもの)
 */
const prepare = async (page, { script = true, bookmarks = BOOKMARKS, head = '', headStart = '' } = {}) => {
  const articleUrl = url(TEST_URLS.SAMPLE_ARTICLE);
  await page.route(/\/\/b\.hatena\.ne\.jp\/entry\/jsonlite\//, (/** @type {any} */ route) => {
    const callback = new URL(route.request().url()).searchParams.get('callback');
    const entry = bookmarks && {
      count: bookmarks.length + PRIVATE_COUNT, bookmarks, url: articleUrl, requested_url: articleUrl, eid: '4700000000000000000',
      entry_url: `https://b.hatena.ne.jp/entry/s/${articleUrl.replace(/^https:\/\//, '')}`, title: 'test', screenshot: '',
    };
    return route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: `${callback}(${JSON.stringify(entry)});` });
  });
  await page.route(/\/\/cdn\.profile-image\.st-hatena\.com\//, (/** @type {any} */ route) => route.fulfill({ contentType: 'image/gif', body: ICON }));
  if (!script) await page.route(`**/${SCRIPT}`, (/** @type {any} */ route) => route.abort());
  await page.route(articleUrl, async (/** @type {any} */ route) => {
    const response = await route.fetch();
    let html = await response.text();
    if (!html.includes('hatena-bookmark-comment-iframe')) {
      html = html.replace('<div class="customized-footer">', (/** @type {string} */ open) => open + iframeMarkup(articleUrl));
    }
    const tag = script && !html.includes(SCRIPT) ? `<script src="${DEV_SERVER_URL}/${SCRIPT}" crossorigin="anonymous"></script>` : '';
    html = html.replace(/<head[^>]*>/, (/** @type {string} */ open) => open + headStart);
    await route.fulfill({ response, body: html.replace('</head>', () => `${head}${tag}</head>`) });
  });
};

/**
 * 記事を開き、はてなブックマークコメントが描かれて iframe の高さが落ち着くまで待つ
 * @param {any} page
 * @param {Parameters<typeof prepare>[1] & { themed?: boolean }} [options]
 *   themed: スクリプトが iframe をテーマの形にするのを待つか(既定はスクリプトを読み込むとき)。ほかは prepare と同じ
 */
const open = async (page, { themed, ...options } = {}) => {
  await prepare(page, options);
  themed ??= options.script ?? true;
  await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
  const iframe = page.locator(IFRAME);
  await expect(iframe, '前提: 記事下にはてなブックマークコメントの iframe があること').toBeAttached({ timeout: TIMEOUTS.VERY_LONG });
  if (themed) await expect(iframe).toHaveAttribute(STATE, 'themed', { timeout: TIMEOUTS.VERY_LONG });
  await expect(page.frameLocator(IFRAME).locator('#hatena-bookmark-container'), '前提: はてなブックマークのスクリプトが中身を描くこと').toBeAttached({ timeout: TIMEOUTS.VERY_LONG });
  await settled(page);
};

/** はてなのスクリプトは1秒ごとに中の body の高さを測り、iframe の高さを「中身 + 30px」にする。高さが中身に合うまで待つ */
const settled = (/** @type {any} */ page) => expect.poll(() => page.evaluate((/** @type {string} */ selector) => {
  const iframe = /** @type {HTMLIFrameElement} */ (document.querySelector(selector));
  const body = /** @type {Document} */ (iframe.contentDocument).body;
  return Math.round(iframe.getBoundingClientRect().height - parseFloat(getComputedStyle(body).height));
}, IFRAME), { message: '前提: はてなのスクリプトが iframe の高さを「中身 + 30px」にすること', timeout: TIMEOUTS.VERY_LONG }).toBe(30);

/** iframe と、その中の要素の位置(ページの座標)と形 */
const measure = (/** @type {any} */ page) => page.evaluate((/** @type {string} */ selector) => {
  const iframe = /** @type {HTMLIFrameElement} */ (document.querySelector(selector));
  const doc = /** @type {Document} */ (iframe.contentDocument);
  const frame = iframe.getBoundingClientRect();
  // iframe の中の要素の位置を、ページの座標にする(iframe に枠はない)
  const box = (/** @type {Element | null} */ el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: frame.top + r.top, bottom: frame.top + r.bottom, left: frame.left + r.left, right: frame.left + r.right, height: r.height };
  };
  const text = (/** @type {Element | null} */ el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    return { fontSize: s.fontSize, fontWeight: s.fontWeight, letterSpacing: s.letterSpacing, color: s.color };
  };
  const action = (/** @type {Element | null} */ el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    return { fontSize: s.fontSize, color: s.color, borderBottom: s.borderBottomWidth, height: el.getBoundingClientRect().height, textDecoration: s.textDecorationLine };
  };
  const footer = /** @type {Element} */ (document.querySelector('.entry-footer .customized-footer'));
  const share = document.querySelector('.entry-footer .social-buttons');
  const next = iframe.nextElementSibling?.querySelector('.hatena-module') ?? document.querySelector('.entry-footer .comment-box');
  const items = [...doc.querySelectorAll('.hatena-bookmark-item:not(.hatena-bookmark-addcomment-container)')].filter((li) => getComputedStyle(li).display !== 'none');
  const showAll = doc.querySelector('.hatena-bookmark-span-button');
  return {
    state: iframe.getAttribute('data-swifty-bookmark-comment'),
    embed: doc.documentElement.getAttribute('data-swifty-embed'),
    defaultCss: doc.querySelectorAll('link[href*="/css/blogparts/"]').length,
    sheets: [...doc.querySelectorAll('link[rel~="stylesheet"]')].map((link) => /** @type {HTMLLinkElement} */ (link).href),
    pageSheets: [...document.head.querySelectorAll('link[rel~="stylesheet"]')].map((link) => /** @type {HTMLLinkElement} */ (link).href),
    useUserCss: /** @type {any} */ (iframe.contentWindow).HBBlogParts?.useUserCSS,
    frame: { top: frame.top, bottom: frame.bottom + parseFloat(getComputedStyle(iframe).marginBottom), left: frame.left, right: frame.right },
    // 段の上の線(入れ物の先頭に引く)
    line: { top: footer.getBoundingClientRect().top, width: getComputedStyle(footer, '::before').borderTopWidth, content: getComputedStyle(footer, '::before').content },
    // 記事下の段の左右の端(共有の段)と、次の段の上端
    column: share ? { left: share.getBoundingClientRect().left, right: share.getBoundingClientRect().right, bottom: share.getBoundingClientRect().bottom } : null,
    nextTop: next ? next.getBoundingClientRect().top : null,
    container: box(doc.getElementById('hatena-bookmark-container')),
    containerBackground: getComputedStyle(/** @type {Element} */ (doc.getElementById('hatena-bookmark-container'))).backgroundColor,
    title: box(doc.querySelector('.hatena-bookmark-title')),
    titleText: doc.querySelector('.hatena-bookmark-title')?.textContent?.trim(),
    titleStyle: text(doc.querySelector('.hatena-bookmark-title')),
    titleLink: box(doc.querySelector('.hatena-bookmark-title a')),
    add: box(doc.querySelector('.hatena-bookmark-addcomment a')),
    addStyle: action(doc.querySelector('.hatena-bookmark-addcomment a')),
    addIcon: doc.querySelector('.hatena-bookmark-addcomment a') ? getComputedStyle(/** @type {Element} */ (doc.querySelector('.hatena-bookmark-addcomment a')), '::before').maskImage.startsWith('url(') : null,
    items: items.map((li) => ({
      text: li.textContent,
      box: box(li),
      border: [getComputedStyle(li).borderTopWidth, getComputedStyle(li).borderBottomWidth],
      color: getComputedStyle(li).color,
      icon: box(li.querySelector('.hatena-bookmark-profile-image')),
      iconRadius: li.querySelector('.hatena-bookmark-profile-image') ? getComputedStyle(/** @type {Element} */ (li.querySelector('.hatena-bookmark-profile-image'))).borderTopLeftRadius : null,
      name: box(li.querySelector('.hatena-bookmark-username')),
      tag: box(li.querySelector('.hatena-bookmark-user-tag')),
      comment: li.querySelector('.hatena-bookmark-comment')?.textContent ? box(li.querySelector('.hatena-bookmark-comment')) : null,
      date: box(li.querySelector('.hatena-bookmark-timestamp')),
      dateFont: li.querySelector('.hatena-bookmark-timestamp') ? getComputedStyle(/** @type {Element} */ (li.querySelector('.hatena-bookmark-timestamp'))).fontFamily : null,
    })),
    footerRow: { display: getComputedStyle(/** @type {Element} */ (doc.querySelector('.hatena-bookmark-footer'))).display, box: box(doc.querySelector('.hatena-bookmark-footer')) },
    showAll: showAll && /** @type {HTMLElement} */ (showAll.parentElement).style.display !== 'none'
      ? { text: showAll.textContent, box: box(showAll), style: action(showAll), chevron: getComputedStyle(showAll, '::before').transform }
      : null,
    entryLink: box(doc.querySelector('.hatena-bookmark-entrypage-link a')),
    entryLinkStyle: action(doc.querySelector('.hatena-bookmark-entrypage-link a')),
    // 比べる相手: 共有の段の見出し、「コメントを書く」、記事の日付
    shareLabel: share ? (() => {
      const s = getComputedStyle(share, '::before');
      return { fontSize: s.fontSize, fontWeight: s.fontWeight, letterSpacing: s.letterSpacing, color: s.color };
    })() : null,
    write: action(document.querySelector('.entry-footer .leave-comment-title')),
    dateFont: getComputedStyle(/** @type {Element} */ (document.querySelector('.entry-header .date'))).fontFamily,
    // 色と配色の変数。iframe の中とページで比べる
    colors: {
      frame: { text: getComputedStyle(doc.body).color, link: getComputedStyle(doc.body).getPropertyValue('--link').trim(), background: getComputedStyle(doc.body).backgroundColor },
      page: { text: getComputedStyle(document.body).color, link: getComputedStyle(document.body).getPropertyValue('--link').trim() },
      card: getComputedStyle(/** @type {Element} */ (document.querySelector('#main-inner > .entry'))).backgroundColor,
    },
    inline: doc.documentElement.getAttribute('style'),
    overflow: doc.documentElement.scrollWidth - doc.documentElement.clientWidth,
  };
}, IFRAME);

test.describe('はてなブックマークコメント(テーマのCSSだけ)', () => {
  test('はてなの箱を記事下の段の1つとして置き、上に線を引いて左右の端を揃える', async ({ page }) => {
    await open(page, { script: false });
    const m = await measure(page);

    expect(m.state).toBeNull();
    expect(m.defaultCss, '前提: 中ははてなのCSSで描かれていること').toBe(1);
    expect(m.containerBackground, '前提: はてなの箱に背景があること').not.toBe('rgba(0, 0, 0, 0)');
    expect(m.column, '前提: 開発用ブログで記事下のソーシャルボタンを出していること').not.toBeNull();
    const column = /** @type {NonNullable<typeof m.column>} */ (m.column);
    const container = /** @type {NonNullable<typeof m.container>} */ (m.container);

    // 前の段のすぐ下に線を引き、その下に iframe を置く
    expect(m.line.width).toBe('1px');
    expect(m.line.top).toBeCloseTo(column.bottom, 0);
    expect(m.frame.top).toBeCloseTo(m.line.top + 1, 0);
    // はてなの箱の左右の端は、記事下の段に揃える(iframe の中の body の余白のぶん、iframe を外へ広げる)
    expect(container.left).toBeCloseTo(column.left, 0);
    expect(container.right).toBeCloseTo(column.right, 0);
    // 次の段の線は、iframe のすぐ下に続く
    expect(m.nextTop, '前提: 後ろに段(関連記事かコメント欄)があること').not.toBeNull();
    expect(m.nextTop).toBeCloseTo(m.frame.bottom, 0);
  });

  test('ダークでも iframe を白く塗らず、カードを透かす', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await open(page, { script: false, head: AUTO });
    const m = await measure(page);

    // iframe の中はライトの配色の別のページ。ダークの color-scheme の中に置くと、ブラウザが iframe を不透明な白で塗る。
    // 左上は中の body の余白(はてなの箱の外)なので、カードの色が透ける
    expect(await paintedColor(page, page.locator(IFRAME), 2, 2)).toBe(m.colors.card);
  });

  test('共有の段も関連記事もなければ最初の段になり、コメント欄の線は iframe のすぐ下に続く', async ({ page }) => {
    await open(page, { script: false });
    await expect(page.locator('.entry-footer .comment-box'), '前提: コメント欄があること').toBeAttached();
    // はてなの設定で共有のボタンを1つも出さず、記事下のブログパーツもないときの出力にする
    await page.evaluate(() => {
      document.querySelector('.entry-footer .social-buttons')?.replaceChildren();
      document.getElementById('entry-footer-secondary-modules')?.remove();
    });

    const m = await page.evaluate((/** @type {string} */ selector) => {
      const iframe = /** @type {Element} */ (document.querySelector(selector));
      const footer = /** @type {Element} */ (document.querySelector('.entry-footer .customized-footer'));
      const comments = /** @type {Element} */ (document.querySelector('.entry-footer .comment-box'));
      return {
        firstGap: getComputedStyle(footer).marginTop,
        commentGap: getComputedStyle(comments).marginTop,
        commentTop: comments.getBoundingClientRect().top,
        frameBottom: iframe.getBoundingClientRect().bottom,
      };
    }, IFRAME);
    // 最初の段だけ、上から32px空ける。コメント欄は前の段(はてなブックマークコメント)に続けるので空けない
    expect(m.firstGap).toBe('32px');
    expect(m.commentGap).toBe('0px');
    expect(m.commentTop).toBeCloseTo(m.frameBottom, 0);
  });

  test('印刷では出さない', async ({ page }) => {
    await open(page, { script: false });
    const display = () => page.locator(IFRAME).evaluate((el) => getComputedStyle(el).display);
    expect(await display()).toBe('block');
    expect((await measure(page)).line.content).toBe('""');

    await page.emulateMedia({ media: 'print' });
    expect(await display()).toBe('none');
    // 段の上の線も出さない
    expect(await page.locator('.entry-footer .customized-footer').evaluate((el) => getComputedStyle(el, '::before').content)).toBe('none');
  });
});

test.describe('はてなブックマークコメント(js/bookmark-comment.js)', () => {
  test('はてなのCSSを外し、ページと同じCSSを iframe にも読み込ませる', async ({ page }) => {
    await open(page);
    const m = await measure(page);

    expect(m.embed).toBe('bookmark-comment');
    // はてなのCSS(青い帯の付いた灰色の箱)は残さず、後から足されないようにする
    expect(m.defaultCss).toBe(0);
    expect(m.useUserCss).toBe(true);
    expect(m.containerBackground).toBe('rgba(0, 0, 0, 0)');
    // ページの head のスタイルシート(テーマとデザインCSS)を、同じ順で読み込む
    expect(m.pageSheets.length, '前提: ページにスタイルシートがあること').toBeGreaterThan(0);
    expect(m.sheets).toEqual(m.pageSheets);
  });

  test('記事下の段と同じ形にする(線から16px空けて見出し、操作は右、次の段の線まで16px)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.DESKTOP);
    await open(page);
    const m = await measure(page);
    const column = /** @type {NonNullable<typeof m.column>} */ (m.column);
    const title = /** @type {NonNullable<typeof m.title>} */ (m.title);
    const add = /** @type {NonNullable<typeof m.add>} */ (m.add);
    const entryLink = /** @type {NonNullable<typeof m.entryLink>} */ (m.entryLink);

    // 見出しは、共有の段の見出しと同じ形で、線(1px)から16px空けた高さ32pxの行に置く
    expect(m.titleText).toBe(`はてなブックマークでのコメント (${BOOKMARKS.length} + ${PRIVATE_COUNT})`);
    expect(m.shareLabel, '前提: 開発用ブログで記事下のソーシャルボタンを出していること').not.toBeNull();
    expect(m.titleStyle).toEqual(m.shareLabel);
    expect(m.line.width).toBe('1px');
    expect(title.top - m.line.top).toBeCloseTo(17, 0);
    expect(title.height).toBe(32);
    expect(title.left).toBeCloseTo(column.left, 0);

    // 操作(はてなブックマークでコメントする)は、「コメントを書く」と同じ形(ロゴと名前、下線)で、見出しの行の右端に置く
    expect(m.write, '前提: コメント欄の「コメントを書く」があること').not.toBeNull();
    expect(m.addStyle).toEqual(m.write);
    expect(m.addIcon).toBe(true);
    expect(add.top).toBeCloseTo(title.top, 0);
    expect(add.right).toBeCloseTo(column.right, 0);

    // コメントの下の行: 左に「すべてのコメントを表示する」、右に「はてなブックマークで確認」。どちらも操作の形
    expect(m.showAll?.text).toBe('すべてのコメントを表示する');
    expect(m.showAll?.style).toEqual(m.write);
    expect(m.showAll?.box?.left).toBeCloseTo(column.left, 0);
    expect(m.entryLinkStyle).toEqual(m.write);
    expect(entryLink.right).toBeCloseTo(column.right, 0);
    expect(entryLink.top).toBeCloseTo(/** @type {number} */ (m.showAll?.box?.top), 0);

    // 次の段の線は、最後の行から16px下(ほかの段の下の余白と同じ)
    expect(m.nextTop, '前提: 後ろに段(関連記事かコメント欄)があること').not.toBeNull();
    expect(m.nextTop).toBeCloseTo(m.frame.bottom, 0);
    expect(/** @type {number} */ (m.nextTop) - entryLink.bottom).toBeCloseTo(16, 0);
  });

  test('コメントは、アイコンを左の列に置いて名前・本文・日付を揃え、線ではなく余白で区切る', async ({ page }) => {
    await open(page);
    const m = await measure(page);
    const column = /** @type {NonNullable<typeof m.column>} */ (m.column);

    // はてなは、コメントのあるブックマークを3件まで出す
    expect(m.items.map((item) => item.text?.slice(0, 9))).toEqual(['example-a', 'example-b', 'example-c']);
    for (const [i, item] of m.items.entries()) {
      const icon = /** @type {NonNullable<typeof item.icon>} */ (item.icon);
      const name = /** @type {NonNullable<typeof item.name>} */ (item.name);
      // アイコン(16pxの丸)は左の列、名前・本文・日付はその右の同じ位置から始まる
      expect(icon.left, `${i}番目のアイコン`).toBeCloseTo(column.left, 0);
      expect(icon.height, `${i}番目のアイコン`).toBe(16);
      expect(item.iconRadius, `${i}番目のアイコン`).toBe('50%');
      expect(name.left - column.left, `${i}番目の名前`).toBeCloseTo(24, 0);
      expect(item.comment?.left, `${i}番目の本文`).toBeCloseTo(name.left, 0);
      expect(item.date?.left, `${i}番目の日付`).toBeCloseTo(name.left, 0);
      // 名前、本文、日付の順に縦に並ぶ
      expect(item.comment?.top, `${i}番目の本文`).toBeGreaterThanOrEqual(name.bottom - 1);
      expect(item.date?.top, `${i}番目の日付`).toBeGreaterThanOrEqual(/** @type {number} */ (item.comment?.bottom) - 1);
      expect(item.border, `${i}番目`).toEqual(['0px', '0px']);
      // 本文は本文の色、日付は記事の日付と同じ書体
      expect(item.color, `${i}番目`).toBe(m.colors.page.text);
      expect(item.dateFont, `${i}番目`).toBe(m.dateFont);
      // 長い本文も段の幅に収まる
      expect(item.box?.right, `${i}番目`).toBeCloseTo(column.right, 0);
    }
    // タグは名前の横(同じ行)に並ぶ
    const tagged = m.items[0];
    expect(tagged.tag?.left).toBeGreaterThan(/** @type {number} */ (tagged.name?.right));
    expect(tagged.tag?.top).toBeLessThan(/** @type {number} */ (tagged.name?.bottom));
    expect(m.overflow).toBe(0);
  });

  test('「すべてのコメントを表示する」で残りを出し、コメントのないブックマークは名前の行に日付を続ける', async ({ page }) => {
    await open(page);
    const before = await measure(page);
    expect(before.items).toHaveLength(3);
    expect(before.showAll?.chevron).toBe('none');

    await page.frameLocator(IFRAME).locator('.hatena-bookmark-span-button').click();
    // はてなのスクリプトが iframe の高さを中身に合わせ直す
    await settled(page);
    const after = await measure(page);

    expect(after.items).toHaveLength(BOOKMARKS.length);
    expect(after.showAll?.text).toBe('元に戻す');
    // 開いたあとは、山形を上向きにする
    expect(after.showAll?.chevron).not.toBe('none');
    expect(after.nextTop).toBeCloseTo(after.frame.bottom, 0);

    // コメントのないブックマーク: 本文の行を取らず、日付を名前の行に置く
    const empty = after.items.find((item) => item.text?.startsWith('example-d'));
    expect(empty, '前提: コメントのないブックマークが出ること').toBeTruthy();
    expect(empty?.comment).toBeNull();
    expect(empty?.date?.top).toBeLessThan(/** @type {number} */ (empty?.name?.bottom));
    expect(empty?.date?.left).toBeGreaterThan(/** @type {number} */ (empty?.tag?.right));
  });

  test('ブックマークがないときは、見出し・操作・文言だけを出す', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.DESKTOP);
    await open(page, { bookmarks: null });
    const m = await measure(page);
    const title = /** @type {NonNullable<typeof m.title>} */ (m.title);

    expect(m.titleText).toBe('はてなブックマークでのコメント');
    expect(m.add?.top).toBeCloseTo(title.top, 0);
    expect(m.items.map((item) => item.text)).toEqual(['まだこの記事のブックマークはありません。']);
    // 文言は補助テキストの色で、見出しと同じ左端から始める(アイコンの列は空けない)
    expect(m.items[0].color).toBe(m.titleStyle?.color);
    expect(m.items[0].box?.left).toBeCloseTo(title.left, 0);
    // コメントの下の行は空なので、行を取らない
    expect(m.footerRow.display).toBe('none');
    expect(/** @type {number} */ (m.nextTop) - /** @type {number} */ (m.items[0].box?.bottom)).toBeCloseTo(16, 0);
  });

  test('狭い幅では、操作を見出しの下の行に左から並べ、横にはみ出さない', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.MOBILE_STANDARD);
    await open(page);
    const m = await measure(page);
    const title = /** @type {NonNullable<typeof m.title>} */ (m.title);
    const add = /** @type {NonNullable<typeof m.add>} */ (m.add);

    expect(add.top).toBeGreaterThanOrEqual(title.bottom);
    expect(add.left).toBeCloseTo(title.left, 0);
    expect(m.overflow).toBe(0);
    for (const [i, item] of m.items.entries()) {
      expect(item.box?.right, `${i}番目`).toBeLessThanOrEqual(/** @type {number} */ (m.column?.right) + 1);
    }
  });

  test('キーボードのフォーカスの枠が iframe の端で切れないよう、左右に4px空ける', async ({ page }) => {
    await open(page);
    const m = await measure(page);
    const column = /** @type {NonNullable<typeof m.column>} */ (m.column);

    // フォーカスの枠は、リンクの外側に2px離して2pxで描く。左端の見出しのリンクと右端のリンクの外に、そのぶんの場所がある
    expect(/** @type {number} */ (m.titleLink?.left) - m.frame.left).toBeCloseTo(4, 0);
    expect(m.frame.right - /** @type {number} */ (m.entryLink?.right)).toBeCloseTo(4, 0);
    // 中身の端は記事下の段に揃える
    expect(m.titleLink?.left).toBeCloseTo(column.left, 0);
    // キーボードで見出しのリンクへ移る(次のリンクから Shift+Tab で戻る)
    await page.frameLocator(IFRAME).locator('.hatena-bookmark-addcomment a').focus();
    await page.keyboard.press('Shift+Tab');
    const outline = await page.frameLocator(IFRAME).locator('.hatena-bookmark-title a').evaluate((el) => {
      const s = getComputedStyle(el);
      return { focused: el.ownerDocument.activeElement === el, reach: parseFloat(s.outlineWidth) + parseFloat(s.outlineOffset) };
    });
    expect(outline).toEqual({ focused: true, reach: 4 });
  });

  test('配色とモードはページに合わせ、ダークでもカードを透かす', async ({ page }) => {
    // OSはライト、デザインCSSで常にダーク。iframe はOSではなくページのモードに合わせる
    await page.emulateMedia({ colorScheme: 'light' });
    await open(page, { head: `<style>${schemeCss('blue')} :root { --swifty-color-mode: dark; }</style>` });
    const dark = await measure(page);

    expect(dark.inline).toContain('--swifty-scheme: blue');
    expect(dark.inline).toContain('--swifty-color-mode: dark');
    expect(dark.colors.frame.text).toBe(dark.colors.page.text);
    expect(dark.colors.frame.link).toBe(dark.colors.page.link);
    // ページの背景は塗らず、カードの色が透ける
    expect(dark.colors.frame.background).toBe('rgba(0, 0, 0, 0)');
    expect(await paintedColor(page, page.locator(IFRAME), 2, 2)).toBe(dark.colors.card);

    // 既定の配色のライトとは色が違う(配色とモードが iframe に届いている)
    await page.unrouteAll({ behavior: 'wait' });
    await open(page, { head: `<style>${schemeCss('mint')} :root { --swifty-color-mode: light; }</style>` });
    const light = await measure(page);
    expect(light.colors.frame.text).toBe(light.colors.page.text);
    expect(light.colors.frame.link).toBe(light.colors.page.link);
    expect(light.colors.frame.text).not.toBe(dark.colors.frame.text);
    expect(light.colors.frame.link).not.toBe(dark.colors.frame.link);
  });

  test('デザインCSSで変えた色とフォントも、iframe の中に効く', async ({ page }) => {
    // カスタマイズガイド(articles/customize-entry.md)の書き方: 色は body のCSS変数、フォントは要素に直接
    await open(page, { head: '<style>body { --text-body: rgb(1, 2, 3); } html, body { font-family: "Courier New", monospace; }</style>' });
    const m = await measure(page);
    const fonts = await page.evaluate((/** @type {string} */ selector) => {
      const iframe = /** @type {HTMLIFrameElement} */ (document.querySelector(selector));
      const comment = /** @type {Element} */ (/** @type {Document} */ (iframe.contentDocument).querySelector('.hatena-bookmark-comment'));
      return { frame: getComputedStyle(comment).fontFamily, page: getComputedStyle(document.body).fontFamily };
    }, IFRAME);

    expect(m.items[0].color).toBe('rgb(1, 2, 3)');
    expect(fonts.page, '前提: ページのフォントが変わっていること').toContain('Courier New');
    expect(fonts.frame).toBe(fonts.page);
  });

  test('OSがダークのときも、iframe を塗らずカードを透かす', async ({ page }) => {
    // テーマのCSSは、OSがダークのとき :root の color-scheme をダークにする。iframe の中の :root もそうなると、
    // ライトのままにしている iframe の入れ物と食い違い、ブラウザが iframe を不透明に塗る
    await page.emulateMedia({ colorScheme: 'dark' });
    await open(page, { head: AUTO });
    const m = await measure(page);

    expect(m.inline).toContain('--swifty-color-mode: dark');
    expect(m.colors.frame.text).toBe(m.colors.page.text);
    expect(await paintedColor(page, page.locator(IFRAME), 2, 2)).toBe(m.colors.card);
  });

  test('読者がモードを切り替えたときと、OSの設定が変わったときも、ページに合わせる', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await open(page, { head: AUTO });
    const colors = async () => (await measure(page)).colors;
    const light = await colors();
    expect(light.frame.text).toBe(light.page.text);

    // 表示モードのボタン(js/dark-mode.js)は、読者の選択を <html> の style に書く
    await page.evaluate(() => document.documentElement.style.setProperty('--swifty-color-mode', 'dark'));
    await expect.poll(async () => (await colors()).frame.text).not.toBe(light.frame.text);
    const chosen = await colors();
    expect(chosen.frame.text).toBe(chosen.page.text);

    // 「自動」に戻すと、OSの設定に従う
    await page.evaluate(() => document.documentElement.style.removeProperty('--swifty-color-mode'));
    await expect.poll(async () => (await colors()).frame.text).toBe(light.frame.text);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(async () => (await colors()).frame.text).toBe(chosen.frame.text);
    expect((await colors()).page.text).toBe(chosen.page.text);
  });

  test('テーマのCSSが届くまで iframe を見せず、テーマの形になる前の中身を一度も描かない', async ({ page }) => {
    // iframe に読み込ませるスタイルシートが届くのを遅らせ、はてなブックマークのスクリプトが先に中身を描くようにする
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() === 'stylesheet' && route.request().frame() !== page.mainFrame()) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      await route.fallback();
    });
    // 読み込み中、描くフレームごとに iframe の状態を記録する
    await page.addInitScript(() => {
      if (window.top !== window) return;
      const frames = /** @type {string[]} */ ([]);
      /** @type {any} */ (window).bookmarkFrames = frames;
      const sample = () => {
        const iframe = /** @type {HTMLIFrameElement | null} */ (document.querySelector('iframe.hatena-bookmark-comment-iframe'));
        const doc = iframe?.contentDocument;
        // 読み込みが始まった直後の文書には、まだ <html> がない
        if (iframe && doc?.documentElement) {
          const shown = getComputedStyle(iframe).visibility === 'visible';
          const drawn = Boolean(doc.getElementById('hatena-bookmark-container'));
          // テーマの形: はてなのCSSがなく、読み込ませたスタイルシートがすべて届いている
          const sheets = [...doc.querySelectorAll('link[rel~="stylesheet"]')];
          const themed = doc.documentElement.hasAttribute('data-swifty-embed')
            && !doc.querySelector('link[href*="/css/blogparts/"]')
            && sheets.length > 0 && sheets.every((link) => /** @type {HTMLLinkElement} */ (link).sheet);
          const state = `${shown ? 'shown' : 'hidden'}-${!drawn ? 'empty' : themed ? 'themed' : 'unthemed'}`;
          if (frames[frames.length - 1] !== state) frames.push(state);
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await open(page);

    const frames = await page.evaluate(() => /** @type {any} */ (window).bookmarkFrames);
    expect(frames, '前提: スタイルシートが届く前に中身が描かれていること').toContain('hidden-unthemed');
    expect(frames[frames.length - 1]).toBe('shown-themed');
    expect(frames).not.toContain('shown-unthemed');
    // 見せないあいだも場所は取り、見せたときに下の段を動かさない
    expect(await page.locator(IFRAME).evaluate((el) => {
      el.removeAttribute('data-swifty-bookmark-comment');
      const s = getComputedStyle(el);
      return [s.visibility, s.display];
    })).toEqual(['hidden', 'block']);
  });

  test('デザインCSSがページの body に高さを指定していても、iframe が伸び続けない', async ({ page }) => {
    // はてなのスクリプトは中の body の高さを iframe の高さにする。body が iframe の高さに合わせると、測るたびに30pxずつ伸びる
    await open(page, { head: '<style>html, body { height: 100%; min-height: 100%; }</style>' });
    const height = () => page.locator(IFRAME).evaluate((el) => el.getBoundingClientRect().height);
    const first = await height();
    // はてなのスクリプトが測り直す間隔(1秒)より長く待つ
    await page.waitForTimeout(2500);
    expect(await height()).toBe(first);
  });

  test('テーマのCSSが iframe の中の形を持っていなければ、はてなの形のままにする', async ({ page }) => {
    // 古い版のテーマのCSS(中の形を持つことを示す値がない)と同じ状態にする
    // スクリプトは実行された時点でこの値を確かめるので、開発用ブログのheadのスクリプトより前に置く。テーマの :root の指定に勝つよう詳細度を上げる
    await open(page, { headStart: '<style>html:root { --swifty-bookmark-comment: initial; }</style>', themed: false });
    const m = await measure(page);

    // はてなのCSSを外さず、iframe も隠さない
    expect(m.state).toBeNull();
    expect(m.embed).toBeNull();
    expect(m.defaultCss).toBe(1);
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-swifty-bookmark-comment'))).toBe(false);
    expect(await page.locator(IFRAME).evaluate((el) => getComputedStyle(el).visibility)).toBe('visible');
  });

  test('中の文書の処理で例外が起きても、iframe を見せないままにしない', async ({ page }) => {
    // iframe の中で、はてなブックマークのスクリプトの設定に触ると例外になるようにする
    await page.addInitScript(() => {
      if (window.top === window) return;
      Object.defineProperty(window, 'HBBlogParts', { get: () => { throw new Error('blocked'); }, set: () => {} });
    });
    await prepare(page);
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });

    const iframe = page.locator(IFRAME);
    await expect(iframe).toHaveAttribute(STATE, 'default', { timeout: TIMEOUTS.VERY_LONG });
    expect(await iframe.evaluate((el) => getComputedStyle(el).visibility)).toBe('visible');
  });

  test('ページの読み込みが終わった後に実行しても、テーマの形にする。2回実行しても変わらない', async ({ page }) => {
    await open(page, { script: false });
    expect((await measure(page)).defaultCss, '前提: はてなの形で描かれていること').toBe(1);

    await page.addScriptTag({ content: bookmarkCommentJs });
    await expect(page.locator(IFRAME)).toHaveAttribute(STATE, 'themed', { timeout: TIMEOUTS.VERY_LONG });
    await settled(page);
    const first = await measure(page);
    expect(first.defaultCss).toBe(0);
    expect(first.sheets).toEqual(first.pageSheets);

    await page.addScriptTag({ content: bookmarkCommentJs });
    await page.waitForTimeout(TIMEOUTS.SHORT);
    const second = await measure(page);
    expect(second.sheets).toEqual(first.sheets);
    expect(second.state).toBe('themed');
  });
});
