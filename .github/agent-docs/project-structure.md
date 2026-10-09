# プロジェクト構造

## リポジトリのディレクトリ構成

ファイルの参照や変更の際は、以下のディレクトリ構成を参考にしてください。

| パス | 説明 |
| ---- | ---- |
| .github/ | GitHub Actionsの設定ファイルとエージェント向けの指示ドキュメント |
| .vscode/ | VSCodeの設定ファイル(scssのフォーマット調整に利用) |
| articles/ | テーマの紹介記事(`introduce-entry.md`、`customize-entry.md`)と、開発用ブログに投稿して見た目を確かめるFixture記事(Markdown)。投稿のしかたと記事の一覧は `articles/README.md` |
| build/ | ビルド成果物となるテーマ、本番はてなブログにはこのファイルを配布する |
| js/ | はてなブログ向けのJavaScriptのソースコード(置くとビルド対象になる)。`alert.js`(アラート記法)、`codeblock.js`(コードブロックのボタン)、`toc-toggle.js`(目次の開閉)、`dark-mode.js`(ダークモードの切り替えボタン) |
| lighthouse-report/ | Lighthouseの計測結果 |
| node_modules/ | npmのモジュール |
| screenshots/ | Playwrightで取得したスクリーンショット |
| scss/ | はてなブログ向けのSCSSのソースコード |
| test-results/ | PlaywrightのE2Eテスト結果 |
| tests/ | PlaywrightのE2Eテストコード |
| .editorconfig | エディタ設定ファイル(インデント等の統一) |
| .gitignore | Gitの無視リスト |
| .npmrc | npmの設定(バージョン固定、公開から14日未満のパッケージを入れない) |
| capture-screenshots.js | 紹介記事(`articles/introduce-entry.md`、`articles/customize-entry.md`)のスクリーンショットを `articles/screenshots/` に撮り、配色ごとの色の表を出力するスクリプト(`npm run screenshots`) |
| blog.config.js | 開発用ブログのドメインと開発サーバーのポート。開発サーバー、E2Eテスト、Lighthouseが共通で参照する |
| check-customize.js | `customize-*.html` が `js/` の同じ名前のスクリプトと同じ処理であることを確かめるスクリプト(`npm run check:customize`) |
| CLAUDE.md | Claude Code向けの指示(`.github/copilot-instructions.md` を読み込む) |
| customize-*.html | はてなブログのカスタマイズ用HTML。`js/` と同じ処理を「ブログタイトル下」(`customize-dark-mode.html` は「headに要素を追加」)に貼り付けて使う。`customize-alert.html`(アラート記法)、`customize-codeblock.html`(コードブロックのボタン)、`customize-toc-toggle.html`(目次の開閉)、`customize-dark-mode.html`(ダークモードの切り替えボタン) |
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
| `lib/_color_mode.scss` | ダークモードの切り替えボタン(`js/dark-mode.js`)と、ヘッダーのボタンの場所を定義します。ヘッダーの場所を上書きするため `_header.scss` の後に読み込みます。 |
| `lib/_entry.scss` | 記事(ヘッダー、本文、コード、脚注、記事下、コメント、ページャー)を定義します。 |
| `lib/_codeblock.scss` | コードブロック、インラインコード、ハイライトの色、コードブロックのボタン(`js/codeblock.js`)を定義します。 |
| `lib/_alert.scss` | アラート記法(`js/alert.js` で変換した引用)を定義します。本文の引用の指定を上書きするため `_entry.scss` の後に読み込みます。 |
| `lib/_table_of_contents.scss` | 目次を定義します。広い画面では本文の横に常に表示し、開閉(`js/toc-toggle.js`)の見出しの行と閉じたときの帯も定義します。本文のリストの指定を上書きするため `_entry.scss` の後に読み込みます。 |
| `lib/_archive.scss` | 記事の一覧(トップページの一覧表示、アーカイブ、カテゴリー)を定義します。 |
| `lib/_modules.scss` | ブログパーツ(サイドバーと記事下)を定義します。 |
| `lib/_print.scss` | 印刷用のスタイルを定義します。各コンポーネントを上書きするため最後に読み込みます。 |

機能を足すときは `lib/_<機能名>.scss` を作り、`style.scss` で `_print.scss` より前に `@use` します。

## テストファイル構成

| パス | 説明 |
| ---- | ---- |
| `tests/helpers.js` | リトライ付きのナビゲーションなど、テスト共通のフィクスチャ |
| `tests/constants.js` | テスト対象の記事URL(`TEST_URLS`、Fixture記事の `FIXTURE_URLS`)、ビューポート、セレクタなどの定数 |
| `tests/home.spec.js` | テーマCSSが読み込まれていること(全テストが失敗するときに最初に見る) |
| `tests/header.spec.js` | はてなのヘッダーメニューとブログのヘッダーの一体化、「読者になる」ボタンの位置 |
| `tests/article.spec.js` | 記事・アバウト・アーカイブページの表示 |
| `tests/codeblock.spec.js` | コードブロックの言語名の帯、ハイライトの色分け、アスキーアートの除外、ボタン(`js/codeblock.js`) |
| `tests/alert.spec.js` | アラート記法の変換(`js/alert.js`。変換の規則はローカルのページで確かめる)と見た目 |
| `tests/heading.spec.js` | 本文の見出し(書き方に合わせた帯・破線・縦棒の割り当て、字間と間隔) |
| `tests/toc-toggle.spec.js` | 目次の開閉(`js/toc-toggle.js`)、閉じた状態の記憶と表示のずれ |
| `tests/dark-mode.spec.js` | ダークモードの切り替えボタン(`js/dark-mode.js`)の置き場所、モードの適用と記憶、読み込み時に別のモードで描かないこと、キーボード操作 |
| `tests/scheme.spec.js` | 配色の切り替え(`--swifty-scheme`)、知らない名前では既定のまま、`body` に書いた色とはてなの背景設定が優先されること。ダークテーマ(OSに合わせる、`--swifty-color-mode`、ダークの背景がはてなの背景設定より優先、印刷はライト) |
| `tests/toc-follow.spec.js` | 本文の横の長い目次で、いま読んでいる見出しのリンクが見える位置まで目次の中をスクロールすること(`js/toc-toggle.js`) |
| `tests/toc.spec.js` | 目次を本文の横に常に表示すること、いま読んでいる見出しの表示、本文の間隔が変わらないこと |
| `tests/target-size.spec.js` | 小さいリンクやボタンのタップ領域(WCAG 2.5.8) |
| `tests/responsive.spec.js` | 画面幅ごとのトップページの表示と、横スクロールが出ないこと |
| `tests/background.spec.js` | ユーザーの背景設定がテーマより優先されること |
| `tests/contrast.spec.js` | テキスト・リンク・引用の線・状態の印のコントラスト(WCAG AA)。すべての配色を、ライトとダークのそれぞれで測る |
| `tests/deferred-content.spec.js` | 描画の後回しで本文の位置と高さが変わらないこと |
| `tests/print.spec.js` | 印刷スタイル(操作専用のUI・サイドバーを出さない、閉じた中身や画面外の本文も出す) |
