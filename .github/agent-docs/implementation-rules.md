# 実装ルール

## SCSSのルール

* モジュールは `@use` で読み込み、名前空間を付けて参照します(例: `@use "./_variable" as var;` → `var.$mq-sm`)。`@import` やグローバルな組み込み関数(`darken()` など)はSass 3.0で廃止予定のため使いません。色の加工が必要なら `sass:color` の `color.adjust()` などを使います。
* ビルドで警告が出ないことを確認してください(`npm run build`)。

## 配色

* スタイルに色を直接書かず、CSS変数(`var(--text-body)` など)を参照します。仕組みは theme-design-spec.md の「配色」を参照してください。
* 色を足すときは、`_variable.scss` で次の順に定義します。
  1. カラーパレットに色の値を足す(`$color-<色名>-<濃さ>`。番号が大きいほど濃い)
  2. テーマの配色マップ(`$light-theme`)に用途の名前を足す。キーがそのままCSS変数名になる
* data URIのSVGはCSS変数を参照できないため、`_functions.scss` の `url-svg($svg, $color)` で色を焼き込みます。SVGは `_variable.scss` に読める形のまま置き、色を差し込む箇所は `currentColor` と書きます。
* テキストはWCAG 2.2 AA(4.5:1以上)を満たす色にします。色を変えたら `tests/contrast.spec.js` が通ることを確認し、選定理由を theme-design-spec.md に残します。

## CSSのルール

* cssで`!important`は可能な限り避けます。使わないとあまりに長かったり実装困難な場合は、やむなく使用しますが回避手段を模索します。はてな側が `!important` を当てている場合など、使う場合は理由をコメントに残します。
* レスポンシブデザインのテーマであるため、メディアクエリ(`var.$mq-*`)を使用して、デバイス幅に応じたスタイルを適用します。
* ユーザーがはてなの設定で変えられるもの(背景色・背景画像など)は、テーマの既定値がユーザーの指定に勝たないようにします(theme-design-spec.md の「背景色・背景画像」を参照)。
* アクセシビリティ
  * `outline: none` でフォーカスを消すときは、代わりのフォーカス表示を用意します。
  * アニメーションやトランジションを足すときは、`prefers-reduced-motion: reduce` で止めます。
  * 押せる要素は24×24px以上のタップ領域を確保します(WCAG 2.5.8)。
* 本文のマージンやはみ出しを変えたら、描画の後回し(`content-visibility`)で見た目がずれないか `tests/deferred-content.spec.js` で確認します。
* 操作専用のUIを足したら、`_print.scss` で印刷時に隠します。

## JavaScriptのルール

JavaScriptのルールは、以下のように実装します。

* 可能な限りJavaScriptを用いてDOMを操作することは避けてください。JavaScriptを用いるのはSCSSで達成できない課題を解決するときだけにします。
  * SCSSを選択する例: すでに存在するHTML構造の順序を変更する場合はSCSSでGridスタイルを用いることで解決できるケースが多くあります。
  * JavaScriptを選択する例: コードブロックのコピー機能はSCSSで実装できないため、JavaScriptを用います。
* JavaScriptはESモジュール形式で書きます。CommonJS形式は使用しない。
* JavaScriptは `js/` に置くと自動でビルド対象になります(`vite.config.js` の変更は不要)。開発用ブログのheadに `<script src="http://localhost:5173/js/<ファイル名>.js">` を足して確認します。
* ユーザーが導入するためのHTMLは `customize-<機能名>.html` としてリポジトリ直下に置きます。リリースのzipに同梱され、`npm run lighthouse` では「ブログタイトル下」に挿入されて計測されます。
* JavaScriptは、`npm run build`がエラーなく実行できて成果物が`build/`に出力されていることを確認してください。

## テストのルール

* SCSSやJavaScriptで振る舞いを足したら、`tests/` にE2Eテストを足します。
* はてなが出力するHTMLは記事やブログの設定で変わるため、測る前に前提となる要素の存在を確かめ、セレクタの誤りが「隠れている」「0px」と区別できなくならないようにします(`tests/print.spec.js` を参照)。
* 色は指定値ではなく、祖先の `opacity` や背景まで含めた描画色で測ります(`tests/contrast.spec.js` を参照)。
