// @ts-check
import { DEV_SERVER_URL } from '../blog.config.js';

/**
 * テストで使用する定数定義
 */

// テスト対象URL (開発用ブログの記事。blog.config.js のブログを変えたらここも合わせる)
export const TEST_URLS = {
  /** サンプル記事（目次・コードブロック・detailsあり） */
  SAMPLE_ARTICLE: '/entry/2025/05/10/204601',
  /** コードハイライト記事 */
  CODE_HIGHLIGHT: '/entry/2025/05/12/131258',
  /** 本文の段落中にリンクがある記事 */
  ARTICLE_WITH_LINKS: '/entry/2025/05/17/015533',
  /** アーカイブページ */
  ARCHIVE: '/archive/author/guitarrapc_tech',
  /** アバウトページ */
  ABOUT: '/about',
  /** トップページ */
  HOME: '/',
};

// 開発サーバーから読み込まれるテーマCSS。開発用ブログのheadに設定したlinkを探すのに使う
export const THEME_STYLESHEET = `${DEV_SERVER_URL}/scss/style.scss`;

// ビューポートサイズ
export const VIEWPORTS = {
  /** デスクトップ（大きめラップトップ） */
  DESKTOP: { width: 1440, height: 1440 },
  /** タブレット（iPad Pro 12.9インチ） */
  TABLET: { width: 1024, height: 1366 },
  /** スマートフォン（iPhone 14 Pro Max） */
  MOBILE: { width: 430, height: 932 },
  /** スマートフォン（標準） */
  MOBILE_STANDARD: { width: 414, height: 896 },
};

// CSSセレクタ
export const SELECTORS = {
  // 記事関連
  ENTRY_TITLE: '.entry-title',
  ENTRY_CONTENT: '.entry-content',
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
