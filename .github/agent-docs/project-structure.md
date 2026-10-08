# プロジェクト構造

## リポジトリのディレクトリ構成

ファイルの参照や変更の際は、以下のディレクトリ構成を参考にしてください。

| パス | 説明 |
| ---- | ---- |
| .github/ | GitHub Actionsの設定ファイルとエージェント向けの指示ドキュメント |
| .vscode/ | VSCodeの設定ファイル(scssのフォーマット調整に利用) |
| build/ | ビルド成果物となるテーマ、本番はてなブログにはこのファイルを配布する |
| js/ | はてなブログ向けのJavaScriptのソースコード(置くとビルド対象になる。現在はなし) |
| lighthouse-report/ | Lighthouseの計測結果 |
| node_modules/ | npmのモジュール |
| screenshots/ | Playwrightで取得したスクリーンショット |
| scss/ | はてなブログ向けのSCSSのソースコード |
| test-results/ | PlaywrightのE2Eテスト結果 |
| tests/ | PlaywrightのE2Eテストコード |
| .editorconfig | エディタ設定ファイル(インデント等の統一) |
| .gitignore | Gitの無視リスト |
| .npmrc | npmの設定(バージョン固定、公開から14日未満のパッケージを入れない) |
| blog.config.js | 開発用ブログのドメインと開発サーバーのポート。開発サーバー、E2Eテスト、Lighthouseが共通で参照する |
| CLAUDE.md | Claude Code向けの指示(`.github/copilot-instructions.md` を読み込む) |
| customize-*.html | はてなブログのカスタマイズ用HTML(JavaScriptを提供する場合に置く。現在はなし) |
| LICENSE.md | ライセンスファイル |
| lighthouse.js | 開発用ブログに対してLighthouseを実行するスクリプト |
| package-lock.json | npmのパッケージロックファイル |
| package.json | npmのパッケージファイル |
| playwright.config.js | Playwrightの設定ファイル |
| README.md | このリポジトリの説明 |
| server.js | ローカル開発サーバーの動作ファイル |
| vite.config.js | Viteの設定ファイル |

## SCSSファイル構成

scssは以下のように分割して実装します。モジュールは `@use` で読み込みます(`@import` はSass 3.0で廃止予定のため使わない。CSSの `normalize.css` だけはプレーンなCSSの `@import` として残す)。

| パス | 説明 |
| ---- | ---- |
| `style.scss` | ビルドの起点。テーマのヘッダーコメント(Theme / Responsive: yes)と読み込み順を定義します。 |
| `lib/_variable.scss` | メディアクエリ、レイアウト、フォント、SVG、カラーパレット、テーマの配色マップと、共通のmixin(CSS変数の出力、カード、カテゴリのラベル、枠線のボタン)を定義します。 |
| `lib/_functions.scss` | SVG文字列をdata URIに変換するなどのSCSS関数を定義します。 |
| `lib/_core.scss` | `:root` のCSS変数、基本の要素、ページ全体の配置、フッター、描画の後回しを定義します。 |
| `lib/_header.scss` | ヘッダーを定義します。はてなのヘッダーメニューと「読者になる」ボタンをブログのヘッダーと一体にします。 |
| `lib/_entry.scss` | 記事(ヘッダー、本文、コード、脚注、記事下、コメント、ページャー)を定義します。 |
| `lib/_table_of_contents.scss` | 目次を定義します。広い画面では本文の横に常に表示します。本文のリストの指定を上書きするため `_entry.scss` の後に読み込みます。 |
| `lib/_archive.scss` | 記事の一覧(トップページの一覧表示、アーカイブ、カテゴリー)を定義します。 |
| `lib/_modules.scss` | ブログパーツ(サイドバーと記事下)を定義します。 |
| `lib/_print.scss` | 印刷用のスタイルを定義します。各コンポーネントを上書きするため最後に読み込みます。 |

機能を足すときは `lib/_<機能名>.scss` を作り、`style.scss` で `_print.scss` より前に `@use` します。

## テストファイル構成

| パス | 説明 |
| ---- | ---- |
| `tests/helpers.js` | リトライ付きのナビゲーションなど、テスト共通のフィクスチャ |
| `tests/constants.js` | テスト対象の記事URL、ビューポート、セレクタなどの定数 |
| `tests/home.spec.js` | トップページの表示と、テーマCSSが読み込まれていること |
| `tests/header.spec.js` | はてなのヘッダーメニューとブログのヘッダーの一体化、「読者になる」ボタンの位置 |
| `tests/article.spec.js` | 記事・アバウト・アーカイブページの表示 |
| `tests/heading.spec.js` | 本文の見出し(書き方に合わせた帯・破線・縦棒の割り当て、字間と間隔) |
| `tests/toc.spec.js` | 目次を本文の横に常に表示すること、いま読んでいる見出しの表示、本文の間隔が変わらないこと |
| `tests/target-size.spec.js` | 小さいリンクやボタンのタップ領域(WCAG 2.5.8) |
| `tests/responsive.spec.js` | 画面幅ごとの表示と、横スクロールが出ないこと |
| `tests/background.spec.js` | ユーザーの背景設定がテーマより優先されること |
| `tests/contrast.spec.js` | テキストとリンクのコントラスト(WCAG AA) |
| `tests/deferred-content.spec.js` | 描画の後回しで本文の位置と高さが変わらないこと |
| `tests/print.spec.js` | 印刷スタイル |
