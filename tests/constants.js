// @ts-check
import { DEV_SERVER_URL } from '../blog.config.js';

/**
 * テストで使用する定数定義
 */

// テスト対象URL (開発用ブログの記事。blog.config.js のブログを変えたらここも合わせる)
export const TEST_URLS = {
  /** サンプル記事（目次・コードブロック・details・アラート記法あり） */
  SAMPLE_ARTICLE: '/entry/2025/05/10/204601',
  /** サンプル記事（英語版。アラート記法あり） */
  SAMPLE_ARTICLE_EN: '/entry/2026/01/08/004234',
  /** コードハイライト記事 */
  CODE_HIGHLIGHT: '/entry/2025/05/12/131258',
  /** 目次のない記事 */
  ARTICLE_WITHOUT_TOC: '/entry/2025/05/15/015031',
  /** アーカイブページ */
  ARCHIVE: '/archive/author/guitarrapc_tech',
  /** アバウトページ */
  ABOUT: '/about',
  /** トップページ */
  HOME: '/',
};

// Fixture記事 (articles/ の原稿を開発用ブログに投稿したもの。原稿の先頭のコメントにURLがある)
// 確かめる観点ごとに記事を分けている。各記事の内容は articles/README.md を参照
export const FIXTURE_URLS = {
  /** 段落、文字の装飾、リンク、インラインコード、はみ出しやすい文字列、脚注、空の段落 */
  TEXT: '/entry/2026/10/08/224737',
  /** 「##」から書く記事の見出し。目次あり */
  HEADINGS_H2: '/entry/2026/10/08/224622',
  /** はてな記法・見たままモードと同じh3から始まる記事の見出し。目次は先頭の見出しの後(本文の途中) */
  HEADINGS_H3: '/entry/2026/10/08/224633',
  /** 「##」の記事にh1が1つ混ざる。目次なし */
  HEADINGS_H1_MIXED: '/entry/2026/10/08/224609',
  /** 入れ子や長い番号のリスト、リストの中のコードブロック */
  LISTS: '/entry/2026/10/08/224645',
  /** 引用とアラート */
  QUOTES_ALERTS: '/entry/2026/10/08/224718',
  /** 言語ごとのハイライト(diffなど)、言語名なし、はてなが対応していない言語名、リストの中のコードブロック */
  CODEBLOCKS: '/entry/2026/10/08/224556',
  /** 表と折りたたみ */
  TABLES_DETAILS: '/entry/2026/10/08/224728',
  /** 画像、ブログカード、数式 */
  MEDIA: '/entry/2026/10/08/224708',
  /** 画面の高さより長い目次 */
  TOC_LONG: '/entry/2026/10/08/224746',
  /** 長いタイトルと何行にも並ぶカテゴリ。目次なし */
  LONG_TITLE: '/entry/2026/10/08/224657',
};

// 配色(theme-design-spec.md の「配色の切り替え」)。先頭が既定の配色で、残りは _variable.scss の $schemes と揃える。
// 配色を足したら、ここにも足す。切り替わること(scheme.spec.js)と、配色ごとのAA(contrast.spec.js、alert.spec.js)を確かめる
export const SCHEMES = ['mint', 'blue', 'pink', 'yellow', 'purple', 'beige', 'dusty-pink', 'apricot', 'navy', 'pink-green'];

/**
 * 配色を切り替えるデザインCSS。開発用ブログのデザインCSSで配色を切り替えていても狙った配色で測れるよう、既定の配色(mint)も明示する
 * @param {string} scheme
 */
export const schemeCss = (scheme) => `:root { --swifty-scheme: ${scheme}; }`;

// 開発サーバーから読み込まれるテーマCSS。開発用ブログのheadに設定したlinkを探すのに使う
export const THEME_STYLESHEET = `${DEV_SERVER_URL}/scss/style.scss`;

// ビューポートサイズ
export const VIEWPORTS = {
  /** デスクトップ（大きめラップトップ） */
  DESKTOP: { width: 1440, height: 1440 },
  /** タブレット（iPad Pro 12.9インチ） */
  TABLET: { width: 1024, height: 1366 },
  /** 目次を本文の横に出さない最大の幅(_variable.scss の $mq-lg の1px手前) */
  BELOW_SIDE_TOC: { width: 1199, height: 1000 },
  /** Surface Pro 7 */
  SURFACE_PRO: { width: 912, height: 1368 },
  /** スマートフォン（iPhone 14 Pro Max） */
  MOBILE: { width: 430, height: 932 },
  /** スマートフォン（標準） */
  MOBILE_STANDARD: { width: 414, height: 896 },
};

// CSSセレクタ
export const SELECTORS = {
  // ヘッダー関連
  GLOBAL_HEADER: '#globalheader-container',
  BLOG_HEADER: '#blog-title',
  SUBSCRIBE_BUTTON: '.blog-controlls-subscribe-btn',

  // 記事関連
  ENTRY: '.entry',
  ENTRY_TITLE: '.entry-title',
  ENTRY_CONTENT: '.entry-content',
  TABLE_OF_CONTENTS: '.entry-content > .table-of-contents',
  ENTRY_DATE: '.entry-date',
  ENTRY_CATEGORIES: '.entry-categories',
  ENTRY_HEADER: '.entry-header',

  // レイアウト関連
  CONTAINER: '#container',
  MAIN: '#main',
  BLOG_TITLE: '#title',
  BOX2: '#box2',
  FOOTER: '#footer',

  // アーカイブ関連
  PAGE_ARCHIVE: '.page-archive',
  ARCHIVE_ENTRIES: '.archive-entries',
  ARCHIVE_ENTRY: '.archive-entry',
};

// タイムアウト値（ミリ秒）
export const TIMEOUTS = {
  /** 短い待機（アニメーション） */
  SHORT: 1000,
  /** 中程度の待機 */
  MEDIUM: 2000,
  /** 長い待機（要素の表示） */
  LONG: 5000,
  /** 非常に長い待機 */
  VERY_LONG: 15000,
};
