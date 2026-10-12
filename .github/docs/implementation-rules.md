# 実装ルール

## SCSSのルール

* モジュールは `@use` で読み込み、名前空間を付けて参照します(例: `@use "./_variable" as var;` → `var.$mq-sm`)。`@import` やグローバルな組み込み関数(`darken()` など)はSass 3.0で廃止予定のため使いません。素のCSSファイルの取り込み(`style.scss` の `@import "normalize.css";`)はSassの廃止の対象ではないので、この例外です。色の加工が必要なら `sass:color` の `color.adjust()` などを使います。
* ビルドで警告が出ないことを確認してください(`npm run build`)。

## 配色

* スタイルに色を直接書かず、CSS変数(`var(--text-body)` など)を参照します。仕組みは theme-design-spec.md の「配色」を参照してください。
* 色を足すときは、`_variable.scss` で次の順に定義します。
  1. カラーパレットに色の値を足す(`$color-<色名>-<濃さ>`。番号が大きいほど濃い)
  2. テーマの配色マップ(`$light-theme`)に用途の名前を足す。キーがそのままCSS変数名になる
  3. 切り替えられる配色(`$schemes`)で既定と違う色にしたいときは、その配色の差分に足す。足さなければ既定の配色の色を使う
  4. ダークテーマの色を足す。配色ごとの暗い色は `$dark-scheme-colors` に、配色によらない暗い色は `$dark-shared` に置く。ほかの配色と共有する色がほとんどないので、カラーパレットを経由せず値をそのまま書く(theme-design-spec.md の「ダークテーマ」)
* `$light-theme` にある変数がダークテーマ(`$dark-theme`)にない、または `$schemes` の配色に暗い色がないと、ビルドがエラーで止まります。ダークで上書きしない変数があると、ライトの色が暗い背景に残るためです。
* コードブロック(`_codeblock.scss`)で使う配色の変数を増やしたら、`$scheme-code-blocks` にも足します。ライトでもコードブロックを暗い地にする配色(`ink`、`zenn`、`qiita`)は、コードブロックの中だけ配色の変数を置き換えるので、足し忘れた変数はライトの色のまま暗い地に残ります(theme-design-spec.md の「配色の切り替え」の `ink`・`zenn`・`qiita`)。コードの色(`code-` で始まる変数)が抜けていると、ビルドがエラーで止まります。
* 配色を足したら、`tests/constants.js` の `SCHEMES` にも足します。ライトとダークの両方で、AA(`tests/contrast.spec.js`、`tests/alert.spec.js`)と切り替え(`tests/scheme.spec.js`)を確かめます。
* data URIのSVGはCSS変数を参照できないため、`_functions.scss` の `url-svg($svg, $color)` で色を焼き込みます。SVGは `_variable.scss` に読める形のまま置き、色を差し込む箇所は `currentColor` と書きます。
* テキストはWCAG 2.2 AA(4.5:1以上)を満たす色にします。色を変えたら `tests/contrast.spec.js` が通ることを確認し、選定理由を theme-design-spec.md に残します。

## CSSのルール

* cssで`!important`は可能な限り避けます。使わないとあまりに長かったり実装困難な場合は、やむなく使用しますが回避手段を模索します。はてな側が `!important` を当てている場合など、使う場合は理由をコメントに残します。
* レスポンシブデザインのテーマであるため、メディアクエリ(`var.$mq-*`)を使用して、デバイス幅に応じたスタイルを適用します。
* 幅や余白はCSS変数(`--content-max`、`--gutter`、`--card-padding-inline` など)を使い、ヘッダー・カード・ブログパーツの端を揃えます(theme-design-spec.md の「レイアウト」を参照)。
* カード、カテゴリのラベル、枠線のボタンは `_variable.scss` のmixin(`card`、`category-chip`、`outline-button`)を使い、形を揃えます。
* 本文の見出しの形は段(`h2` など)に直接書かず、役割のmixin(`_entry.scss` の `heading-band` / `heading-bar` / `heading-dashed` / `heading-minor`)で当てます。記事でいちばん上に使われている段に合わせて割り当てが変わるためです(theme-design-spec.md の「見出しと引用」を参照)。
* 本文の中で左に立てるミントの縦棒は、見出しだけの印にします。引用などほかの要素に左の線を付けるときは、ミント以外の色にします(theme-design-spec.md の「見出しと引用」を参照)。
* 本文の直下の要素の余白は下方向(`margin-bottom`)と見出しの上(`padding-top`)だけで作り、上下のマージンの相殺に頼りません。目次を本文の横に置くと本文がグリッドになり、相殺が起きなくなるためです(theme-design-spec.md の「本文の余白」を参照)。
* はてなのヘッダーメニュー(`#globalheader-container`)は移動したり隠したりせず、その上に要素を置きません(はてなのガイドライン)。
* ユーザーがはてなの設定で変えられるもの(背景色・背景画像など)は、テーマの既定値がユーザーの指定に勝たないようにします(theme-design-spec.md の「背景色・背景画像」を参照)。
* アクセシビリティ
  * `outline: none` でフォーカスを消すときは、代わりのフォーカス表示を用意します。
  * アニメーションやトランジションを足すときは、`prefers-reduced-motion: reduce` で止めます。
  * 押せる要素は24×24px以上のタップ領域を確保します(WCAG 2.5.8)。
* 本文のマージンやはみ出しを変えたら、描画の後回し(`content-visibility`)と目次の有無で見た目がずれないか、`tests/deferred-content.spec.js` と `tests/toc.spec.js` で確認します。
* 操作専用のUIを足したら、`_print.scss` で印刷時に隠します。

## JavaScriptのルール

JavaScriptのルールは、以下のように実装します。

* 可能な限りJavaScriptを用いてDOMを操作することは避けてください。JavaScriptを用いるのはSCSSで達成できない課題を解決するときだけにします。
  * SCSSを選択する例: すでに存在するHTML構造の順序を変更する場合はSCSSでGridスタイルを用いることで解決できるケースが多くあります。本文中の目次を本文の横に常に表示する機能も、グリッドと `position: sticky` で実現しています。
  * JavaScriptを選択する例: コードブロックのコピー機能はSCSSで実装できないため、JavaScriptを用います。
* JavaScriptはESモジュール形式で書きます。CommonJS形式は使用しない。
* JavaScriptは `js/` に置くと自動でビルド対象になります(`vite.config.js` の変更は不要)。開発用ブログのheadに `<script src="http://localhost:5173/js/<ファイル名>.js">` を足して確認します。
* ユーザーが導入するためのHTMLは `customize-<機能名>.html` としてリポジトリ直下に置きます。リリースのzipに同梱され、`npm run lighthouse` では「ブログタイトル下」に挿入されて計測されます。
  * 貼る場所は「ブログタイトル下」が基本です。ページが描かれる前に反映しないと明滅するもの(`customize-dark-mode.html`)は、「headに要素を追加」に貼るよう案内します。
* JavaScriptは、`npm run build`がエラーなく実行できて成果物が`build/`に出力されていることを確認してください。

## テストのルール

* SCSSやJavaScriptで振る舞いを足したら、`tests/` にE2Eテストを足します。
* はてなが出力するHTMLは記事やブログの設定で変わるため、測る前に前提となる要素の存在を確かめ、セレクタの誤りが「隠れている」「0px」と区別できなくならないようにします(`tests/print.spec.js` を参照)。
* 色は指定値ではなく、祖先の `opacity` や背景まで含めた描画色で測ります(`tests/contrast.spec.js` を参照)。
