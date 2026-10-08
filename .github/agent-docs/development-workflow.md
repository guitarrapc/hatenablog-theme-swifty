# 開発ワークフロー

## 開発環境

* デザインテーマの確認には、[README.md](../../README.md)に記載されているnpmコマンドを実行してローカル開発サーバーを立ち上げる必要がありますが、あなたに指示する前に実行されているものとします。
* 開発サーバーを起動しておくことで、変更されたscssやJSは自動的にブログへ反映されます。反映のための`npm run build`は不要です。
* 開発用ブログのドメインと開発サーバーのポートは[blog.config.js](../../blog.config.js)にまとめています。開発サーバー、E2Eテスト、Lighthouseはすべてここを参照します。
  * 開発用ブログのheadは `http://localhost:5173/scss/style.scss` を決め打ちで参照します。開発サーバーはポート5173が使われていると起動に失敗します(別のポートへ逃げると、ブログに別のテーマのCSSが読み込まれたまま気づけないため)。CodeFocusなど他のテーマの開発サーバーを止めてから起動してください。
* 使うターミナルは、Windowsなら`cmd.exe`、Macなら`Terminal.app`、Linuxは`bash`を想定しています。実行するコマンドは、各ターミナルが扱える文法に適合したものを選択してください。
* ファイルのインデントは、.editorconfigに沿ってください。

## E2Eテスト

* テーマのレンダリング結果は、開発用ブログの[トップページ](https://guitarrapc-theme.hatenablog.com/)、[サンプル記事](https://guitarrapc-theme.hatenablog.com/entry/2025/05/10/204601)、[アーカイブ](https://guitarrapc-theme.hatenablog.com/archive/author/guitarrapc_tech)、[アバウト](https://guitarrapc-theme.hatenablog.com/about)を参照してください。テストで使う記事は `tests/constants.js` の `TEST_URLS` にまとめています。
  * 要素ごとの見た目を確かめるFixture記事の原稿は `articles/` に置いています。開発用ブログの記事にない要素を確かめるときは、ここに足して投稿します(`articles/README.md` を参照)。投稿した記事のURLは `tests/constants.js` の `FIXTURE_URLS` にまとめています。
* SCSSやJavaScriptの変更をした場合、PlaywrightでE2Eテストを実行します。
  * E2Eテストは`npm run test`で実行し、コマンドが終了するまでテスト結果の判断を待ってください。テスト結果`test-results/`でエラーが発生しているかどうかを確認できます。
  * E2Eテストは自動化、繰り返し実行を前提とするため、ユーザープロンプトやキャンセルをしないと完了しないようなテストコマンドは使用しないでください。
  * E2Eテストのレンダリング結果を適宜スクリーンショットで確認してください。スクリーンショットは`screenshots/`に保存されます。
  * E2EテストのPlaywrightコードは、`tests/`以下に配置されています。
  * E2Eテスト結果は、`test-results/`に保存されます。エラーが発生すると、`test-results/`にエラーの詳細が保存されます。
* テストは開発用ブログの実際の記事に対して実行します。前提となる要素(閉じたdetailsやコメントなど)が記事から無くなったときにテストが素通りしないよう、測る前に「前提」として要素の存在を確かめます。
  * 記事の書き方による違い(見出しの段、目次の位置、長い目次など)は、DOMを書き換えて真似せず、その書き方のFixture記事を開いて確かめます。
* テストは、テーマやスクリプトが約束することを直接確かめます。ページ全体のCLSのように、はてなの出力の順序や読み込みの速さで揺れる値を合計して比べると、確かめたいこととは関係なく失敗します。
  * 例: 目次の開閉は、CLSではなく「読み込み中に開いた目次を一度も描かない」ことを、フレームごとの状態の記録で確かめる(`tests/toc-toggle.spec.js`)。
  * テストを足したら、壊した実装(スクリプトを遅らせる、指定を外すなど)で一度失敗することを確かめてから残します。
* 全テストが失敗するときは、まず `tests/home.spec.js` の「開発サーバーのテーマCSSが読み込まれている」を見ます。開発サーバーが起動していないか、開発用ブログのhead設定が違います。

## Lighthouse

* `npm run lighthouse` で、本番相当の状態(ビルドしたCSSをデザインCSSに差し替え、開発サーバーのタグを除いた状態)を計測します。はてなブログの設定は変更しません。
* 描画の後回しの影響でスコアがときどき大きく下がる回があるため、比較するときは `npm run lighthouse -- --runs=3` で中央値を見ます(theme-design-spec.md の「描画の後回し」を参照)。
* 計測結果は `lighthouse-report/` に保存されます。

## CI/CD

GitHub ActionsでCIを実行して、SCSSやJavaScriptの動作を担保します。

### ビルドワークフロー

* `master`ブランチにpushした、PRが作成された際に自動で実行されます。
* `npm run build`でビルドを実行し、ビルドしたCSSの先頭に `Responsive: yes` があることを確かめます。
* ランナー上で開発サーバーを起動し、`npx playwright test`でE2Eテストを実行します。開発用ブログのheadが `localhost:5173` を参照するため、ランナー上の開発サーバーがテーマを配信します。

### リリースワークフロー

* タグがpushされた際に自動で実行されます。
* `npm run build`でビルドを実行します。
* [gh](https://cli.github.com/manual/gh_release_create)コマンドを使ってGitHubリリースをドラフトで作成します。
  * リリース文章は`--generate-notes`オプションを指定して自動生成します。
  * リリースアーティファクトとして、`build/`以下のファイル + `customize-*.html`ファイル(あれば)をzip圧縮してリリースに添付します。
* リリースするときは、`scss/style.scss` のヘッダーコメントの「変更履歴」も更新します。
