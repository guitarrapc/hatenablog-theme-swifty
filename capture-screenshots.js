// @ts-check
/**
 * 紹介記事(articles/introduce-entry.md、articles/customize-entry.md)と、テーマストアの画像(theme-store-catch.html)に載せるスクリーンショットを撮る。
 *
 * 開発サーバー(npm start)を起動した状態で `npm run screenshots` を実行する。
 * 開発用ブログ(blog.config.js)の記事を開き、画像を articles/screenshots/ に保存する。
 * 配色ごとの色の表(customize-entry.md の「配色を切り替える」)も、撮った配色の実際の値から作って出力する。
 * 配色を足したり色を変えたりしたら、撮り直して表も貼り直す。
 *
 * `npm run screenshots -- scheme-blue pc-toc` のように名前を渡すと、名前が前方一致するものだけを撮る。
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLOG_URL } from './blog.config.js';
import { TEST_URLS, SCHEMES, VIEWPORTS, schemeCss } from './tests/constants.js';

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'articles', 'screenshots');

// 端末の画面の大きさ。紹介記事の脚注と揃える
const DEVICES = {
  pc: { width: 1440, height: 900 },
  tablet: VIEWPORTS.TABLET,
  smartphone: VIEWPORTS.MOBILE,
};

// ページの一部を撮るときの画面の高さ。撮る範囲が画面に収まるよう高くする
const REGION_VIEWPORT_HEIGHT = 1600;

// 撮る範囲の周りの余白
const REGION_PADDING = 24;

// テーマストアの画像(theme-store-catch.html)で、ダークのスマートフォンの前に置くライトの配色
const STORE_SCHEMES = ['pink'];

/**
 * 配色の表に載せる色。customize-entry.md の「色のCSS変数」と同じ名前で書く
 * @type {[string, string][]}
 */
const SCHEME_COLORS = [
  ['--background', 'ページの背景'],
  ['--surface', 'カード'],
  ['--text-header', 'タイトル・見出し'],
  ['--text-body', '本文'],
  ['--text-light', '補助の文字'],
  ['--link', 'リンク'],
  ['--accent', 'アクセント'],
];

// 記事下のはてなブックマークコメント(はてなが出力する iframe)
const BOOKMARK_COMMENT_IFRAME = 'iframe.hatena-bookmark-comment-iframe';

// はてなブックマークコメントの画像に出すブックマーク。サンプル記事にブックマークはないので、はてなブックマークのAPIの応答をこれに差し替える。
// はてなは記事ページでコメントのあるものを3件まで出し、残りがあると「すべてのコメントを表示する」を出す
const BOOKMARK_COMMENTS = [
  { user: 'example-user1', color: '#6aa9d8', tags: ['デザイン'], timestamp: '2026/10/10 12:34', comment: '見出しの形が段ごとに違っていて、流し読みでも構成がつかみやすい。' },
  { user: 'example-user2', color: '#e0a15c', tags: [], timestamp: '2026/10/10 09:02', comment: 'あとで読む' },
  { user: 'example-user3', color: '#8cc084', tags: ['はてなブログ', 'テーマ'], timestamp: '2026/10/09 23:11', comment: 'ダークモードの配色が落ち着いていて良い。コードブロックの上の帯に言語名が出るのも便利。' },
  { user: 'example-user4', color: '#b59ad6', tags: [], timestamp: '2026/10/09 20:00', comment: '目次が本文の横に残るのが助かる。' },
  { user: 'example-user5', color: '#d98b9f', tags: [], timestamp: '2026/10/09 18:45', comment: '' },
];

/**
 * @typedef {{ selector: string, text?: string }} Target 要素。text を指定すると、中の文字が一致する要素を選ぶ
 * @typedef {{ from: Target, to?: Target, frame?: Target }} Region from の上端から to の下端まで。左右は frame(省略すると from)に合わせる
 * @typedef {{
 *   name: string,
 *   path: string,
 *   device?: keyof typeof DEVICES,
 *   dark?: boolean,
 *   scheme?: string,
 *   region?: Region,
 *   setup?: (page: import('@playwright/test').Page) => Promise<void>,
 *   prepare?: (page: import('@playwright/test').Page) => Promise<void>,
 * }} Shot setup はページを開く前(通信の差し替えなど)、prepare は開いた後(スクロールや操作)に呼ぶ
 */

/** @type {Shot[]} */
const SHOTS = [
  // 記事の上部(紹介記事の「テーマの特徴」「ダークモード」)
  ...(/** @type {const} */ (['pc', 'tablet', 'smartphone'])).flatMap((device) => [false, true].map((dark) => ({
    name: `${device}-article-top${dark ? '-dark' : ''}`,
    path: TEST_URLS.SAMPLE_ARTICLE,
    device,
    dark,
  }))),
  // 見出しの3つの形と、それより下の段(サンプル記事は「#」から書いているので、h1が大見出し)
  {
    name: 'pc-headings',
    path: TEST_URLS.SAMPLE_ARTICLE,
    region: {
      from: { selector: '.entry-content > h1', text: 'h1見出し' },
      to: { selector: '.entry-content > h4', text: 'h4見出し' },
    },
  },
  // 本文の横の目次。途中までスクロールして、いま読んでいる見出しを示す
  {
    name: 'pc-toc',
    path: TEST_URLS.SAMPLE_ARTICLE,
    prepare: (page) => scrollToHeading(page, 'アラート'),
  },
  // 本文の横の目次を閉じたとき(js/toc-toggle.js)
  {
    name: 'pc-toc-closed',
    path: TEST_URLS.SAMPLE_ARTICLE,
    prepare: async (page) => {
      // マウスで押すと、はてなの引用ボタン(文字を選んだときに出る)が写り込むことがあるので、要素を直接押す
      await page.evaluate(() => /** @type {HTMLElement} */ (document.querySelector('.toc-panel-summary')).click());
      await scrollToHeading(page, 'アラート');
    },
  },
  // コードブロックの帯とボタン(js/codeblock.js)
  {
    name: 'pc-codeblock',
    path: TEST_URLS.CODE_HIGHLIGHT,
    region: { from: { selector: '.code-block:has(pre.lang-python)' } },
  },
  // アラート記法(js/alert.js)
  ...[false, true].map((dark) => ({
    name: `pc-alert${dark ? '-dark' : ''}`,
    path: TEST_URLS.SAMPLE_ARTICLE,
    dark,
    region: {
      from: { selector: '.markdown-alert-note' },
      to: { selector: '.markdown-alert-caution' },
    },
  })),
  // 記事の下(この記事を共有・関連記事・コメント・前後の記事)。
  // 1200px以上では右に目次の列のぶんが空くので、記事の下がカードの幅いっぱいに並ぶタブレットで撮る
  {
    name: 'tablet-entry-footer',
    path: TEST_URLS.SAMPLE_ARTICLE,
    device: 'tablet',
    region: {
      from: { selector: '.entry-footer .social-buttons' },
      to: { selector: '.pager-permalink' },
      frame: { selector: '#main-inner > .entry' },
    },
  },
  // はてなブックマークコメント(カスタマイズガイドの「はてなブックマークコメントをテーマの見た目に揃える」)。
  // JavaScriptを追加する前(テーマのCSSだけ)と、追加した後(js/bookmark-comment.js)。
  // 開発用ブログではてなブックマークコメントを表示し、headでスクリプトを読み込んでいること
  ...[false, true].map((script) => ({
    name: `tablet-bookmark-comment${script ? '' : '-default'}`,
    path: TEST_URLS.SAMPLE_ARTICLE,
    device: /** @type {const} */ ('tablet'),
    setup: (/** @type {import('@playwright/test').Page} */ page) => mockBookmarkComments(page, script),
    prepare: (/** @type {import('@playwright/test').Page} */ page) => waitForBookmarkComments(page, script),
    region: {
      from: { selector: '.entry-footer .social-buttons' },
      to: { selector: BOOKMARK_COMMENT_IFRAME },
      frame: { selector: '#main-inner > .entry' },
    },
  })),
  // 記事の一覧。開発用ブログのトップページは確認用の記事(Fixture)が並ぶので、サムネイルのある記事が並ぶ2025年のアーカイブで撮る
  ...(/** @type {const} */ (['pc', 'smartphone'])).map((device) => ({
    name: `${device}-archive`,
    path: '/archive/2025',
    device,
  })),
  // ブログパーツ
  {
    name: 'pc-modules',
    path: TEST_URLS.SAMPLE_ARTICLE,
    region: { from: { selector: '#box2-inner' } },
  },
  // 配色ごとのライトとダーク(紹介記事の「配色」、カスタマイズガイドの「配色を切り替える」)
  ...SCHEMES.flatMap((scheme) => [false, true].map((dark) => ({
    name: `scheme-${scheme}${dark ? '-dark' : ''}`,
    path: TEST_URLS.SAMPLE_ARTICLE,
    scheme,
    dark,
  }))),
  // テーマストアの画像(theme-store-catch.html)のスマートフォン(ダークは smartphone-article-top-dark を使う)
  ...STORE_SCHEMES.map((scheme) => ({
    name: `store-smartphone-${scheme}`,
    path: TEST_URLS.SAMPLE_ARTICLE,
    device: /** @type {const} */ ('smartphone'),
    scheme,
  })),
];

/**
 * 見出しが画面の上端の少し下に来るまでスクロールする
 * @param {import('@playwright/test').Page} page
 * @param {string} text
 */
async function scrollToHeading(page, text) {
  const scroll = () => page.evaluate((text) => {
    const heading = [...document.querySelectorAll('.entry-content > :is(h1, h2, h3)')].find((el) => el.textContent?.trim() === text);
    if (!heading) throw new Error(`見出し「${text}」が見つからない`);
    window.scrollTo(0, heading.getBoundingClientRect().top + window.scrollY - 120);
  }, text);
  // 描画の後回し(content-visibility)の対象が描かれると見出しの位置が変わるので、描かれてからもう一度合わせる
  await scroll();
  await page.waitForTimeout(500);
  await scroll();
  // いま読んでいる見出し(:target-current)と、目次の中のスクロール(js/toc-toggle.js)が追いつくのを待つ
  await page.waitForTimeout(1000);
}

/**
 * はてなブックマークのAPI(JSONP)とアイコンの応答を、画像用のブックマークに差し替える
 * @param {import('@playwright/test').Page} page
 * @param {boolean} script js/bookmark-comment.js を読み込むか(読み込まなければ、はてなの見た目のまま)
 */
async function mockBookmarkComments(page, script) {
  const articleUrl = `${BLOG_URL}${TEST_URLS.SAMPLE_ARTICLE}`;
  await page.route(/\/\/b\.hatena\.ne\.jp\/entry\/jsonlite\//, (route) => {
    const callback = new URL(route.request().url()).searchParams.get('callback');
    const entry = {
      // 公開していないブックマークが2件あることにする(見出しの「(公開 + 非公開)」に出る)
      count: BOOKMARK_COMMENTS.length + 2,
      bookmarks: BOOKMARK_COMMENTS.map(({ user, tags, timestamp, comment }) => ({ user, tags, timestamp, comment })),
      url: articleUrl, requested_url: articleUrl, eid: '4700000000000000000',
      entry_url: `https://b.hatena.ne.jp/entry/s/${articleUrl.replace(/^https:\/\//, '')}`, title: '', screenshot: '',
    };
    return route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: `${callback}(${JSON.stringify(entry)});` });
  });
  // アイコンは、ブックマークごとの色の四角にする。はてなのアイコン(16pxの画像)と同じ大きさを持たせる
  // (はてなのCSSは img の幅と高さの指定を外すので、大きさのない画像は箱いっぱいに広がる)
  await page.route(/\/\/cdn\.profile-image\.st-hatena\.com\/users\//, (route) => {
    const user = new URL(route.request().url()).pathname.split('/')[2];
    const color = BOOKMARK_COMMENTS.find((bookmark) => bookmark.user === user)?.color ?? '#999999';
    return route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="${color}"/></svg>` });
  });
  if (!script) await page.route('**/js/bookmark-comment.js', (route) => route.abort());
}

/**
 * はてなブックマークコメントが描かれ、iframe の高さが落ち着くまで待つ
 * @param {import('@playwright/test').Page} page
 * @param {boolean} themed テーマの形になるのを待つか
 */
async function waitForBookmarkComments(page, themed) {
  if (themed) await page.locator(`${BOOKMARK_COMMENT_IFRAME}[data-swifty-bookmark-comment="themed"]`).waitFor({ state: 'attached', timeout: 15000 });
  await page.frameLocator(BOOKMARK_COMMENT_IFRAME).locator('.hatena-bookmark-username').first().waitFor({ state: 'attached', timeout: 15000 });
  // はてなのスクリプトは1秒ごとに中の高さを測り、iframe の高さを「中身 + 30px」にする
  await page.waitForFunction((selector) => {
    const iframe = /** @type {HTMLIFrameElement} */ (document.querySelector(selector));
    const body = iframe.contentDocument?.body;
    return Boolean(body) && Math.round(iframe.getBoundingClientRect().height - parseFloat(getComputedStyle(/** @type {HTMLElement} */ (body)).height)) === 30;
  }, BOOKMARK_COMMENT_IFRAME, { timeout: 15000 });
}

/**
 * 撮る範囲を画面の座標で求める。描画の後回し(content-visibility)の対象を描かせるため、先に範囲の上端までスクロールする
 * @param {import('@playwright/test').Page} page
 * @param {Region} region
 */
async function clipOf(page, region) {
  const measure = () => page.evaluate(({ region, padding }) => {
    /** @param {{ selector: string, text?: string }} target */
    const find = ({ selector, text }) => {
      const element = [...document.querySelectorAll(selector)].find((el) => text === undefined || el.textContent?.trim() === text);
      if (!element) throw new Error(`${selector}${text ? `(${text})` : ''} が見つからない`);
      return element.getBoundingClientRect();
    };
    const from = find(region.from);
    const to = region.to ? find(region.to) : from;
    const frame = region.frame ? find(region.frame) : from;
    const x = Math.max(0, frame.left - padding);
    const y = from.top - padding;
    return {
      x,
      y,
      width: Math.min(document.documentElement.clientWidth, frame.right + padding) - x,
      height: to.bottom + padding - y,
      scrollY: window.scrollY,
    };
  }, { region, padding: REGION_PADDING });

  const first = await measure();
  await page.evaluate((top) => window.scrollTo(0, top), first.scrollY + first.y);
  await page.waitForTimeout(800);
  const { scrollY, ...clip } = await measure();
  return clip;
}

/**
 * 配色の色を、配色の表の1列ぶんとして読む
 * @param {import('@playwright/test').Page} page
 */
function readColors(page) {
  return page.evaluate((names) => {
    const style = getComputedStyle(document.body);
    return names.map((name) => style.getPropertyValue(name).trim().toLowerCase().replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, '#$1$1$2$2$3$3'));
  }, SCHEME_COLORS.map(([name]) => name));
}

/**
 * 色見本と色の値。見本は全角の空白に背景色を付けて描く(はてなの記事に書けるHTMLで、原稿が読みにくくならないよう短く書く)
 * @param {string} color
 */
const swatch = (color) => `<span style="background:${color};border:1px solid #8886;border-radius:3px">　</span> \`${color}\``;

/**
 * @param {import('@playwright/test').Browser} browser
 * @param {Shot} shot
 */
async function capture(browser, shot) {
  const device = DEVICES[shot.device ?? 'pc'];
  const context = await browser.newContext({
    // Chromium 141以降で、HTTPSの開発用ブログから開発サーバー(http://localhost)を読み込むのに要る
    permissions: ['local-network-access'],
    viewport: shot.region ? { width: device.width, height: REGION_VIEWPORT_HEIGHT } : device,
    colorScheme: shot.dark ? 'dark' : 'light',
  });
  try {
    const page = await context.newPage();
    await shot.setup?.(page);
    await page.goto(`${BLOG_URL}${shot.path}`, { waitUntil: 'load', timeout: 60000 });
    // 開発用ブログのデザインCSSで配色を切り替えていても、狙った配色で撮る
    await page.addStyleTag({ content: schemeCss(shot.scheme ?? 'mint') });
    // はてなスターやシェアボタンなど、後から差し込まれる部品を待つ
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);

    await shot.prepare?.(page);
    const clip = shot.region ? await clipOf(page, shot.region) : undefined;
    await page.screenshot({ path: path.join(OUT_DIR, `${shot.name}.png`), clip });
    console.log(`✓ ${shot.name}.png`);

    return shot.scheme ? await readColors(page) : undefined;
  } finally {
    await context.close();
  }
}

const filters = process.argv.slice(2);
const shots = filters.length ? SHOTS.filter((shot) => filters.some((filter) => shot.name.startsWith(filter))) : SHOTS;
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
/** @type {Map<string, { light?: string[], dark?: string[] }>} */
const colors = new Map();
let failed = 0;
for (const shot of shots) {
  try {
    const values = await capture(browser, shot);
    if (shot.name.startsWith('scheme-') && values) {
      colors.set(shot.scheme, { ...colors.get(shot.scheme), [shot.dark ? 'dark' : 'light']: values });
    }
  } catch (error) {
    failed++;
    console.error(`✗ ${shot.name}: ${error instanceof Error ? error.message : error}`);
  }
}
await browser.close();

// 配色の表(customize-entry.md の「配色を切り替える」に貼る)
for (const [scheme, { light, dark }] of colors) {
  if (!light || !dark) continue;
  console.log(`\n--- ${scheme} ---\n`);
  console.log('| 色 | ライト | ダーク |');
  console.log('| ---- | ---- | ---- |');
  SCHEME_COLORS.forEach(([name, label], i) => console.log(`| ${label}(\`${name}\`) | ${swatch(light[i])} | ${swatch(dark[i])} |`));
}

if (failed) {
  console.error(`\n${failed}枚の撮影に失敗しました`);
  process.exitCode = 1;
}
