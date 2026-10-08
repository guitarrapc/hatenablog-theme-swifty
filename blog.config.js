/**
 * 開発用ブログの設定。開発サーバー(server.js)、E2Eテスト(playwright.config.js / tests/)、Lighthouse(lighthouse.js)が共通で参照する。
 *
 * 開発用ブログを変えるときは BLOG_HOST を書き換えるか、環境変数 BLOG_HOST で上書きする。
 * 開発用ブログの「head要素にメタデータを追加」は DEV_SERVER_URL を向けておく(README.md を参照)。
 */
export const BLOG_HOST = process.env.BLOG_HOST || "guitarrapc-theme.hatenablog.com";
export const BLOG_URL = `https://${BLOG_HOST}`;

// 開発用ブログのheadはこのポートを決め打ちで参照するため、空いていなければ起動を失敗させる(server.js)
export const DEV_SERVER_PORT = 5173;
export const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;
