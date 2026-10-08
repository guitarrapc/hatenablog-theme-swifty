[![Build](https://github.com/guitarrapc/hatenablog-theme-swifty/actions/workflows/build.yaml/badge.svg)](https://github.com/guitarrapc/hatenablog-theme-swifty/actions/workflows/build.yaml)
[![Release](https://github.com/guitarrapc/hatenablog-theme-swifty/actions/workflows/release.yaml/badge.svg)](https://github.com/guitarrapc/hatenablog-theme-swifty/actions/workflows/release.yaml)

# Swifty

**さわやかで使いやすいワンカラムのはてなブログテーマ**

- 白と淡いミントを基調に、記事やブログパーツをカードにして読みやすく並べます。
- はてなのヘッダーメニューとブログのヘッダーを1つのヘッダーにまとめ、「読者になる」ボタンをヘッダーの右端に置きます。
- 記事の目次は、PCの広い画面(1200px以上)では本文の横に常に表示し、スクロールしても画面に残ります。**JavaScriptのカスタマイズは不要です。**
- Chrome・Edgeでは、いま読んでいる見出しを目次で示します(CSSの `:target-current`)。
- 1200pxより狭い画面では目次を本文中に表示し、本文を広く取ります。
- JavaScriptのカスタマイズを追加すると、目次を開け閉めできます。本文の横の目次は閉じると細い帯になり、本文が広がります。閉じたかどうかはブラウザに記憶します。
- コードブロックは、はてなのハイライトを種類ごとに色分けし、上の帯に言語名を表示します。JavaScriptのカスタマイズを追加すると、帯にコピーボタンと折り返しの切り替えボタンが付きます。
- GitHubと同じアラート記法(`> [!NOTE]` など)を、種類ごとの色・アイコン・タイトルを付けた囲みで表示できます(JavaScriptのカスタマイズが必要です)。

デザインCSSでCSS変数を上書きすると、目次の見出し(`--toc-label`)、本文の最大幅(`--content-max`)、配色(`--link`、`--accent` など)を変えられます。

[Hatena-Blog-Theme-Boilerplate](https://github.com/hatena/Hatena-Blog-Theme-Boilerplate)をもとに、[CodeFocus](https://github.com/guitarrapc/hatenablog-theme-codefocus)で整えた開発の仕組み(CSS変数による配色、開発用ブログでのE2Eテスト、Lighthouse計測、CI)を土台にしています。

## 利用方法

最新のバージョンの`theme-バージョン.zip`をダウンロードしてください。

- https://github.com/guitarrapc/hatenablog-theme-swifty/releases/latest

中のスタイルシート`style.css`を、はてなブログの「デザイン」->「カスタマイズ」->「デザインCSS」に貼り付けて利用します。

### コードブロックの機能

コードブロックの上の帯の右端に、次のボタンを追加します。ボタンは帯の中にあるので、コードに重ならず、スマートフォンでも常に表示されます。

- Copy: コードをコピーします。言語名やボタンの文字はコピーに含まれません。
- Wrap: 長い行を折り返すか、横スクロールするかを切り替えます。既定は横スクロールです。

> [!TIP]
> zipの中の[customize-codeblock.html](customize-codeblock.html)を、はてなブログの「デザイン」->「カスタマイズ」->「ヘッダ」->「ブログタイトル下」に貼り付けます。

### 目次の開閉の機能

目次の先頭に「目次」の見出しの行が付き、押すと開け閉めできます。

- 本文の横の目次(1200px以上): 閉じると、一覧のアイコンと縦書きの「目次」だけの細い帯になり、そのぶん本文が広がります。
- 本文中の目次: 閉じると見出しの行だけになります。
- 閉じたかどうかはブラウザに記憶し、次に開いたページでも同じ状態で表示します。

> [!TIP]
> zipの中の[customize-toc-toggle.html](customize-toc-toggle.html)を、はてなブログの「デザイン」->「カスタマイズ」->「ヘッダ」->「ブログタイトル下」に貼り付けます。

### アラート記法の機能

引用の1行目に`[!NOTE]`、`[!TIP]`、`[!IMPORTANT]`、`[!WARNING]`、`[!CAUTION]`のいずれかを書くと、アラートとして表示します。同じ原稿はGitHubでもアラートとして表示され、スクリプトが動かない環境(RSSリーダーなど)では通常の引用として表示されます。

```markdown
> [!NOTE]
> 流し読みでも把握しておいてほしい情報です。
```

GitHubと同じく、アラートは空行で区切って続けて書けます。また、`[!NOTE]`だけで本文のない引用はアラートにせずそのまま表示します。

ただし、はてなブログは空行で区切った連続する引用を1つの引用にまとめて出力するため、次の点がGitHubと異なります。

- アラートの直後に空行だけで区切って通常の引用を書くと、その引用もアラートの本文に含まれます。間に通常の段落を書いてください。
- 引用の途中に、`[!NOTE]`などで始まり本文が続く段落があると、そこから新しいアラートになります。`[!NOTE]`だけの引用の直後に空行で区切って通常の引用を書いた場合も、1つのアラートになります。

> [!TIP]
> zipの中の[customize-alert.html](customize-alert.html)を、はてなブログの「デザイン」->「カスタマイズ」->「ヘッダ」->「ブログタイトル下」に貼り付けます。

## 開発環境を構築する

SCSSで開発する場合は、下記の手順でリポジトリのcloneとモジュールのインストールを行います。
必須コンポーネントは、以下の通りです。

- [Node.js](https://nodejs.org/) 22.12以上

### モジュールのインストール

```shell
git clone https://github.com/guitarrapc/hatenablog-theme-swifty.git
cd hatenablog-theme-swifty
npm install
npx playwright install chromium
```

### 開発用ブログに開発サーバーを設定する

開発サーバーを利用することで、SCSSの変更をリアルタイムにブログに反映させながらテーマの開発を行えます。

まずは[はてなブログ](https://blog.hatena.ne.jp/)の設定を行います。

1. テーマの動作確認に使うブログを1つ用意します。（普段お使いのブログとは別にブログを作成してください。）
2. 1.のブログの「デザイン設定」にアクセスし、「カスタマイズ」タブの「デザインCSS」の内容を下記に置き換えて保存します。
    ```css
    /* Responsive: yes */
    ```
3. 1.のブログの「設定」->「詳細設定」にアクセスし、「`head`要素にメタデータを追加」に次のタグを追加します。
    ```html
    <script type="module" src="http://localhost:5173/@vite/client" crossorigin="anonymous"></script>
    <link rel="stylesheet" type="text/css" href="http://localhost:5173/scss/style.scss" crossorigin="anonymous" />
    <script type="text/javascript" src="http://localhost:5173/js/codeblock.js" crossorigin="anonymous"></script>
    <script type="text/javascript" src="http://localhost:5173/js/toc-toggle.js" crossorigin="anonymous"></script>
    <script type="text/javascript" src="http://localhost:5173/js/alert.js" crossorigin="anonymous"></script>
    ```
4. [blog.config.js](blog.config.js) の `BLOG_HOST` を1.のブログのドメイン名 (例: `example.hatenablog.com`) にします。開発サーバー、E2Eテスト、Lighthouseはこの設定を参照します。

> [!TIP]
> CodeFocusと同じパス(`scss/style.scss`)とポートを使うため、CodeFocusの開発用ブログをそのまま使えます。起動している開発サーバーのテーマがブログに反映されます。

### 開発サーバーを起動する

```shell
npm start
```

以上が完了すると、動作確認用のブログに開発中のテーマが反映されます。ブログにアクセスし、表示を確認しながらテーマの開発を行なってください。

- ポート5173が使われていると起動に失敗します。他のテーマの開発サーバーを止めてから起動してください。
- 一時的に別のブログで確認するときは `npm start -- example.hatenablog.com` のようにドメイン名を渡します。E2EテストとLighthouseは環境変数 `BLOG_HOST` で切り替えられます。

### 開発コードをテストする

別ターミナルで開発サーバーを起動しておきます。
テストを実行します。

```shell
npm run test
```

結果は `test-results/`、スクリーンショットは `screenshots/` に保存されます。`npm run test:ui` でUIモード、`npm run test:report` でHTMLレポートを開けます。

### 本番用にコンパイルする

テーマの開発が完了したら、下記のコマンドでSCSSをコンパイルします。コンパイルの結果は `build/style.css` に出力されます。

```shell
npm run build
```

コンパイルされたCSSは、はてなブログの「デザイン」->「カスタマイズ」->「デザインCSS」に貼り付けて利用することができます。
ストアにアップロードするCSSも同様に `build/style.css` の内容を利用してください。

### Lighthouseで計測する

開発用ブログの記事に対してLighthouseを実行し、スコアとレポートを `lighthouse-report/` に出力します。Chromeが必要です。

```shell
npm run lighthouse
```

既定では本番相当の状態を計測します。はてなブログの設定は変更せず、ローカルのHTTPSプロキシで開発用ブログの応答を次のように書き換えます。

- `head`要素に追加した `http://localhost:5173` のタグを取り除く
- 「デザインCSS」の中身を `build/style.css` に差し替える
- `customize-*.html` があれば「ブログタイトル下」に挿入する

開発サーバーを起動しておく必要はありません。プロキシの自己署名証明書を作るため`openssl`を使います(Git for Windowsに同梱されています)。

計測するURL、端末、回数を指定できます。複数回実行した場合は、Performanceスコアが中央値の回のレポートを保存します。

```shell
npm run lighthouse -- https://guitarrapc-theme.hatenablog.com/entry/2025/05/17/015533 --form=desktop --runs=3
```

開発サーバーから読み込んだ状態をそのまま計測する場合は `npm run lighthouse:dev` を使います。ただし未圧縮のSCSSや`@vite/client`を読み込むため、Performanceは本番と一致しません。

## 構成

```
hatenablog-theme-swifty/
┣ scss/
┃ ┣ style.scss          ... ビルドの起点(テーマのヘッダーコメント)
┃ ┗ lib/
┃   ┣ _variable.scss            ... メディアクエリ、レイアウト、配色(CSS変数)、共通のmixin
┃   ┣ _functions.scss           ... SVGをdata URIにする関数
┃   ┣ _core.scss                ... ページ全体の配置、フッター
┃   ┣ _header.scss              ... ヘッダー(はてなのヘッダーメニュー・読者になるボタンとの一体化)
┃   ┣ _entry.scss               ... 記事(本文、コード、コメント、ページャー)
┃   ┣ _codeblock.scss           ... コードブロック(言語名の帯、ハイライトの色、ボタン)
┃   ┣ _alert.scss               ... アラート記法
┃   ┣ _table_of_contents.scss   ... 目次(本文の横に常に表示)
┃   ┣ _archive.scss             ... 記事の一覧
┃   ┣ _modules.scss             ... ブログパーツ
┃   ┗ _print.scss               ... 印刷用のスタイル
┣ js/
┃ ┣ codeblock.js        ... コードブロックのボタン
┃ ┣ toc-toggle.js       ... 目次の開閉
┃ ┗ alert.js            ... アラート記法の変換
┣ customize-codeblock.html ... コードブロックのボタンの配布用(js/codeblock.jsと同じ処理)
┣ customize-toc-toggle.html ... 目次の開閉の配布用(js/toc-toggle.jsと同じ処理)
┣ customize-alert.html  ... アラート記法の配布用(js/alert.jsと同じ処理)
┣ tests/                ... PlaywrightのE2Eテスト
┣ articles/             ... 開発用ブログに投稿して見た目を確かめるFixture記事
┣ blog.config.js        ... 開発用ブログの設定
┗ build/
  ┣ style.css           ... ビルド成果物
  ┗ js/
```

詳しくは [.github/agent-docs/project-structure.md](.github/agent-docs/project-structure.md) を参照してください。

## ライセンス

MITライセンスです。[LICENSE.md](LICENSE.md)を参照してください。
