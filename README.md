[![Build](https://github.com/guitarrapc/hatenablog-theme-swifty/actions/workflows/build.yaml/badge.svg)](https://github.com/guitarrapc/hatenablog-theme-swifty/actions/workflows/build.yaml)
[![Release](https://github.com/guitarrapc/hatenablog-theme-swifty/actions/workflows/release.yaml/badge.svg)](https://github.com/guitarrapc/hatenablog-theme-swifty/actions/workflows/release.yaml)

# Swifty

**記事を読み通しやすく、テーマ配色を切り替えられるワンカラムのはてなブログテーマ**

- 本文の幅、見出し、目次、コードブロックを、読みやすさを優先して整えています。
- 配色は複数あり、デザインCSSに1行書くと切り替えられます。どの配色もダークモードに対応し、WCAG AAのコントラストを満たします。
- ダークモードは、OSの設定に合わせて切り替わります。常にライト、常にダークにも固定できます。
- 記事の目次は、1200px以上では本文の横に常に表示し、スクロールしても画面に残ります(JavaScript不要)。Chrome・Edgeでは、いま読んでいる見出しを目次で示します。1200px未満では本文中に表示します。
- コードブロックは、ハイライトを種類ごとに色分けし、上の帯に言語名を表示します。
- はてなのヘッダーメニューとブログのヘッダーを1つにまとめ、「読者になる」をヘッダーの右端に置きます。
- 記事ページでは、パンくずリストの代わりにカテゴリをタイトルの上に表示します。

JavaScriptのカスタマイズを追加すると、次の機能も使えます(「[利用方法](#利用方法)」を参照)。

- コードブロックのコピーと折り返しの切り替え
- 目次の開け閉め(本文の横の目次を閉じると、本文が広がります)と、長い目次でいま読んでいる見出しまでのスクロール
- 読者によるライト・ダーク・自動の切り替え
- GitHubと同じアラート記法(`> [!NOTE]` など)

## カスタマイズ

デザインCSSでCSS変数を上書きして変更できます。

```css
/* 配色(mint: 既定、blue・pink・yellow・purple: ほぼ白のグレーに各色のアクセント、beige: ベージュとくすんだ緑、dusty-pink: くすみピンク、apricot: ピーチベージュとアプリコットピンク、navy: ほぼ白とネイビー、pink-green: 濃いピンクと緑) */
:root { --swifty-scheme: blue; }

/* ダークモード(未指定: OSに合わせる、light: 常にライト、dark: 常にダーク) */
:root { --swifty-color-mode: light; }

/* 色を個別に変える(配色を切り替えても効くよう body に書く) */
body { --link: #1a5fc8; --accent: #4a8ff0; }

/* 見出しの文言(目次・共有・コメント欄・前後の記事)と本文の最大幅 */
:root { --toc-label: "Contents"; --share-label: "Share"; --comment-label: "Comments"; --pager-prev-label: "Previous"; --pager-next-label: "Next"; --content-max: 720px; }

/* 記事ページでもパンくずリストを表示する */
:root { --swifty-entry-breadcrumb: show; }
```

配色、ダークモード、パンくずリストの切り替えは、Chrome・Edge 111以降、Safari 18以降、Firefox 151以降で有効です。それより前のブラウザでは既定の配色(ライト)で表示し、記事ページのパンくずリストは表示しません。

ダークモードの注意点です。

- はてなのヘッダーメニューなど、はてなの部品は明るいまま表示されます。
- 記事中で文字に付けた色や、透明な背景に黒い線の画像は見えにくくなることがあります。気になる場合は `--swifty-color-mode: light` で固定してください。
- ブログの背景設定(色・画像)は使われません。

他のテーマとして、[CodeFocus](https://github.com/guitarrapc/hatenablog-theme-codefocus)も開発しています。

## 利用方法

[最新のリリース](https://github.com/guitarrapc/hatenablog-theme-swifty/releases/latest)から `theme-バージョン.zip` をダウンロードし、中の `style.css` を「デザイン」→「カスタマイズ」→「デザインCSS」に貼り付けます。

### コードブロックのボタン

コードブロックの上に帯を追加して、右端にボタンを追加します。

- Copy: コードをコピーします(言語名やボタンの文字は含みません)。
- Wrap: 長い行の折り返しと横スクロールを切り替えます(既定は横スクロール)。

> [!TIP]
> zipの中の[customize-codeblock.html](customize-codeblock.html)を、「デザイン」→「カスタマイズ」→「ヘッダ」→「ブログタイトル下」に貼り付けます。

### 目次の開閉

目次の先頭に「目次」の行が付き、押すと開け閉めできます。

- 本文の横の目次(1200px以上): 閉じると、アイコンと縦書きの「目次」だけの細い帯になり、その分本文が広がります。
- 本文中の目次: 閉じると「目次」の行だけになります。
- 開閉の状態はブラウザに記憶し、次のページでも引き継ぎます。

> [!TIP]
> zipの中の[customize-toc-toggle.html](customize-toc-toggle.html)を、「デザイン」→「カスタマイズ」→「ヘッダ」→「ブログタイトル下」に貼り付けます。

### ダークモードの切り替え

ヘッダーの「読者になる」の左にボタンを置き、読者がライト・ダーク・自動(OSの設定)を選べるようにします。

- 選んだモードはブラウザに記憶し、次のページでも引き継ぎます。
- 読者の選択は、デザインCSSの `--swifty-color-mode` より優先します。「自動」を選ぶと、ブログの既定(デザインCSSの指定、なければOSの設定)に戻ります。

> [!TIP]
> zipの中の[customize-dark-mode.html](customize-dark-mode.html)を、「設定」→「詳細設定」→「headに要素を追加」に貼り付けます。`head`で実行するので、ページが表示される前にモードが反映され、画面がちらつきません。

### アラート記法

引用の1行目に`[!NOTE]`、`[!TIP]`、`[!IMPORTANT]`、`[!WARNING]`、`[!CAUTION]`のいずれかを書くと、アラートとして表示します。同じ原稿はGitHubでもアラートになり、スクリプトが動かない環境(RSSリーダーなど)では通常の引用として表示されます。

```markdown
> [!NOTE]
> 流し読みでも把握しておいてほしい情報です。
```

GitHubと同じく、空行で区切ってアラートを続けて書けます。`[!NOTE]`だけで本文のない引用は、アラートにせずそのまま表示します。

はてなブログは空行で区切った連続する引用を1つにまとめて出力するため、次の点がGitHubと異なります。

- アラートの直後に空行だけを挟んで通常の引用を書くと、その引用もアラートに含まれます。間に通常の段落を入れてください。
- 引用の途中に`[!NOTE]`などで始まり本文が続く段落があると、そこから新しいアラートになります。`[!NOTE]`だけの引用のすぐ後に空行を挟んで通常の引用を書いた場合も、1つのアラートになります。

> [!TIP]
> zipの中の[customize-alert.html](customize-alert.html)を、「デザイン」→「カスタマイズ」→「ヘッダ」→「ブログタイトル下」に貼り付けます。

## 開発環境を構築する

[Node.js](https://nodejs.org/) 22.12以上が必要です。

### モジュールのインストール

```shell
git clone https://github.com/guitarrapc/hatenablog-theme-swifty.git
cd hatenablog-theme-swifty
npm install
npx playwright install chromium
```

### 開発用ブログに開発サーバーを設定する

開発サーバーを使うと、SCSSの変更をすぐにブログへ反映しながら開発できます。はてなブログで次の設定をします。

1. 動作確認用のブログを用意します(普段のブログとは別に作成してください)。
2. 1.のブログの「デザイン」→「カスタマイズ」→「デザインCSS」を、次の内容に置き換えて保存します。
    ```css
    /* Responsive: yes */
    ```
3. 1.のブログの「設定」→「詳細設定」→「headに要素を追加」に、次のタグを追加します。
    ```html
    <script type="module" src="http://localhost:5173/@vite/client" crossorigin="anonymous"></script>
    <link rel="stylesheet" type="text/css" href="http://localhost:5173/scss/style.scss" crossorigin="anonymous" />
    <script type="text/javascript" src="http://localhost:5173/js/codeblock.js" crossorigin="anonymous"></script>
    <script type="text/javascript" src="http://localhost:5173/js/toc-toggle.js" crossorigin="anonymous"></script>
    <script type="text/javascript" src="http://localhost:5173/js/alert.js" crossorigin="anonymous"></script>
    <script type="text/javascript" src="http://localhost:5173/js/dark-mode.js" crossorigin="anonymous"></script>
    ```
4. [blog.config.js](blog.config.js)の`BLOG_HOST`を、1.のブログのドメイン(例: `example.hatenablog.com`)にします。開発サーバー、E2Eテスト、Lighthouseはこの設定を使います。

> [!TIP]
> CodeFocusと同じパス(`scss/style.scss`)とポートを使うので、CodeFocusの開発用ブログをそのまま使えます。起動中の開発サーバーのテーマがブログに反映されます。

### 開発サーバーを起動する

```shell
npm start
```

動作確認用のブログに、開発中のテーマが反映されます。

- ポート5173が使用中だと起動に失敗します。ほかのテーマの開発サーバーを止めてから起動してください。
- 一時的に別のブログで確認するときは、`npm start -- example.hatenablog.com`のようにドメインを渡します。E2EテストとLighthouseは、環境変数`BLOG_HOST`で切り替えます。

### テストする

開発サーバーを起動した状態で、別のターミナルで実行します。

```shell
npm run test
```

結果は`test-results/`、スクリーンショットは`screenshots/`に保存されます。`npm run test:ui`でUIモード、`npm run test:report`でHTMLレポートを開けます。

`js/`のスクリプトを変えたら、配布用の`customize-*.html`にも反映し、同じ処理になっているかを確かめます。

```shell
npm run check:customize
```

### ビルドする

```shell
npm run build
```

`build/style.css`に出力されます。このファイルを「デザインCSS」に貼り付けて使います。テーマストアにも同じファイルをアップロードします。

### Lighthouseで計測する

開発用ブログの記事をLighthouseで計測し、スコアとレポートを`lighthouse-report/`に出力します。Chromeが必要です。

```shell
npm run lighthouse
```

既定では本番と同じ状態を計測します。はてなブログの設定は変えず、ローカルのHTTPSプロキシで開発用ブログの応答を次のように書き換えます。

- `head`に追加した`http://localhost:5173`のタグを取り除く
- 「デザインCSS」を`build/style.css`に差し替える
- `customize-*.html`を「ブログタイトル下」に挿入する

開発サーバーの起動は不要です。プロキシの自己署名証明書の作成に`openssl`を使います(Git for Windowsに同梱)。

URL、端末、回数を指定できます。複数回計測すると、Performanceのスコアが中央値の回のレポートを保存します。

```shell
npm run lighthouse -- https://guitarrapc-theme.hatenablog.com/entry/2025/05/10/204601 --form=desktop --runs=3
```

開発サーバーから読み込んだ状態を計測するときは、`npm run lighthouse:dev`を使います。未圧縮のSCSSや`@vite/client`を読み込むため、Performanceは本番と一致しません。

### 紹介記事のスクリーンショットを撮る

開発サーバーを起動した状態で実行します。開発用ブログの記事を開き、紹介記事(`articles/`)の画像を`articles/screenshots/`に保存します。

```shell
npm run screenshots
```

配色ごとの色の表も出力します。配色を足したり色を変えたりしたら、撮り直して[articles/customize-entry.md](articles/customize-entry.md)の表を貼り直してください。`npm run screenshots -- scheme-blue pc-toc`のように名前を渡すと、名前が前方一致する画像だけを撮ります。

## 構成

```
hatenablog-theme-swifty/
┣ scss/
┃ ┣ style.scss          ... ビルドの起点(テーマのヘッダーコメント)
┃ ┗ lib/
┃   ┣ _variable.scss            ... メディアクエリ、レイアウト、配色(CSS変数)、共通のmixin
┃   ┣ _functions.scss           ... SVGをdata URIにする関数
┃   ┣ _core.scss                ... ページ全体の配置、パンくずリスト、フッター
┃   ┣ _header.scss              ... ヘッダー(はてなのヘッダーメニュー・読者になるボタンとの一体化)
┃   ┣ _color_mode.scss          ... ダークモードの切り替えボタン
┃   ┣ _entry.scss               ... 記事(本文、記事下、コメント欄、前後の記事)
┃   ┣ _codeblock.scss           ... コードブロック(言語名の帯、ハイライトの色、ボタン)
┃   ┣ _alert.scss               ... アラート記法
┃   ┣ _table_of_contents.scss   ... 目次(本文の横に常に表示)
┃   ┣ _archive.scss             ... 記事の一覧
┃   ┣ _modules.scss             ... ブログパーツ
┃   ┗ _print.scss               ... 印刷用のスタイル
┣ js/
┃ ┣ codeblock.js        ... コードブロックのボタン
┃ ┣ toc-toggle.js       ... 目次の開閉
┃ ┣ alert.js            ... アラート記法の変換
┃ ┗ dark-mode.js        ... ダークモードの切り替えボタン
┣ customize-codeblock.html ... コードブロックのボタンの配布用(js/codeblock.jsと同じ処理)
┣ customize-toc-toggle.html ... 目次の開閉の配布用(js/toc-toggle.jsと同じ処理)
┣ customize-alert.html  ... アラート記法の配布用(js/alert.jsと同じ処理)
┣ customize-dark-mode.html ... ダークモードの切り替えボタンの配布用(js/dark-mode.jsと同じ処理)
┣ tests/                ... PlaywrightのE2Eテスト
┣ articles/             ... テーマの紹介記事と、開発用ブログに投稿して見た目を確かめるFixture記事
┃ ┗ screenshots/        ... 紹介記事のスクリーンショット
┣ capture-screenshots.js ... 紹介記事のスクリーンショットを撮るスクリプト
┣ blog.config.js        ... 開発用ブログの設定
┗ build/
  ┣ style.css           ... ビルド成果物
  ┗ js/
```

詳しくは[.github/agent-docs/project-structure.md](.github/agent-docs/project-structure.md)を参照してください。

## ライセンス

MITライセンスです。[LICENSE.md](LICENSE.md)を参照してください。
