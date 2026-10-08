[![Build](https://github.com/guitarrapc/hatenablog-theme-swifty/actions/workflows/build.yaml/badge.svg)](https://github.com/guitarrapc/hatenablog-theme-swifty/actions/workflows/build.yaml)
[![Release](https://github.com/guitarrapc/hatenablog-theme-swifty/actions/workflows/release.yaml/badge.svg)](https://github.com/guitarrapc/hatenablog-theme-swifty/actions/workflows/release.yaml)

# Swifty

はてなブログのデザインテーマ Swifty です。

[Hatena-Blog-Theme-Boilerplate](https://github.com/hatena/Hatena-Blog-Theme-Boilerplate)をもとに、[CodeFocus](https://github.com/guitarrapc/hatenablog-theme-codefocus)で整えた開発の仕組み(CSS変数による配色、開発用ブログでのE2Eテスト、Lighthouse計測、CI)を土台にしています。

## 利用方法

最新のバージョンの`theme-バージョン.zip`をダウンロードしてください。

- https://github.com/guitarrapc/hatenablog-theme-swifty/releases/latest

中のスタイルシート`style.css`を、はてなブログの「デザイン」->「カスタマイズ」->「デザインCSS」に貼り付けて利用します。

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
┃   ┣ _variable.scss    ... メディアクエリ、フォント、配色(CSS変数)
┃   ┣ _functions.scss   ... SVGをdata URIにする関数
┃   ┣ _core.scss        ... テーマ全体のスタイル
┃   ┗ _print.scss       ... 印刷用のスタイル
┣ tests/                ... PlaywrightのE2Eテスト
┣ blog.config.js        ... 開発用ブログの設定
┗ build/
  ┗ style.css           ... ビルド成果物
```

詳しくは [.github/agent-docs/project-structure.md](.github/agent-docs/project-structure.md) を参照してください。

## ライセンス

MITライセンスです。[LICENSE.md](LICENSE.md)を参照してください。
