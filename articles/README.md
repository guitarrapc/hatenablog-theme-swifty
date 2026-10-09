# 記事の原稿

テーマの紹介記事と、Fixture記事の原稿です。

Fixture記事は、開発用ブログ([blog.config.js](../blog.config.js) の `BLOG_HOST`)に投稿して、テーマ(Swifty、CodeFocus)の見た目を確かめるための記事です。見出しの割り当てや目次は記事ごとに決まるため、確かめる観点ごとに記事を分けています。

## テーマの紹介記事

テーマを紹介する記事です。Fixture記事ではないので、カテゴリ `Fixture` は付けず、`FIXTURE_URLS` にも足しません。

| ファイル | 内容 |
| ---- | ---- |
| [introduce-entry.md](introduce-entry.md) | テーマの特徴、導入方法、導入後の設定(レスポンシブデザイン、JavaScriptの追加) |
| [customize-entry.md](customize-entry.md) | デザインCSSで変えられる項目(配色、ダークモード、色、見出しの文言、本文の幅と角丸、パンくずリスト、フォント) |

* 画像は `screenshots/` を相対パスで参照しています(GitHubやエディタのプレビューで確かめられる)。投稿するときは、はてなフォトライフにアップロードして `[f:id:...:plain:alt=...]` に差し替えます。
* 画像はリポジトリのルートの `capture-screenshots.js`(`npm run screenshots`)で撮ります。開発用ブログの記事を開いて撮るので、開発サーバーを起動しておきます。
* カスタマイズガイドの「配色を切り替える」の色の表は、`npm run screenshots` が撮った配色の実際の値から出力します。配色を足したり色を変えたりしたら、撮り直して表を貼り直し、配色の節(説明・書き方・画像)も足します。
* テーマの仕様(CSS変数の名前や既定値、配色の名前)を変えたら、記事も合わせて直します。

## 投稿のしかた

* 編集モードはMarkdownで投稿します。front matterの `title` を記事のタイトルにし、front matterより下を本文に貼ります。
* 投稿したら、記事のURLを原稿のfront matterの下にコメント(`<!-- https://... -->`)で書き、`tests/constants.js` の `FIXTURE_URLS` に足します。テストは `FIXTURE_URLS` の記事を開いて確かめます。
* カテゴリには `Fixture` を付けます。カテゴリのページ(`/archive/category/Fixture`)で一覧できます。
* 画像は開発用ブログのはてなフォトライフ(`guitarrapc_tech`)にある画像を参照しています。別のアカウントのブログに投稿するときは差し替えてください。

## Fixture記事の一覧

| ファイル | `FIXTURE_URLS` | 確かめること |
| ---- | ---- | ---- |
| [fixture-text.md](fixture-text.md) | `TEXT` | 段落と改行、文字の装飾、リンク、インラインコード、はみ出しやすい文字列、脚注、罫線、空の段落 |
| [fixture-headings-h2.md](fixture-headings-h2.md) | `HEADINGS_H2` | `##` から書く記事の見出し(h2が帯)。見出しの連続、長い見出し、装飾を含む見出し、見出しの直後の要素、目次の直後の見出し |
| [fixture-headings-h3.md](fixture-headings-h3.md) | `HEADINGS_H3` | はてな記法・見たままモードと同じh3から始まる記事の見出し(h3が帯)。本文の先頭の見出し、本文の途中に置いた目次 |
| [fixture-headings-h1-mixed.md](fixture-headings-h1-mixed.md) | `HEADINGS_H1_MIXED` | `##` の記事にh1が1つ混ざったときの見出し(h1が帯、h2が破線)。目次のない記事 |
| [fixture-lists.md](fixture-lists.md) | `LISTS` | 入れ子、2桁と3桁の番号、長い項目、段落を含む項目、リストの中のコードブロックと引用、定義リスト |
| [fixture-quotes-alerts.md](fixture-quotes-alerts.md) | `QUOTES_ALERTS` | 引用(出典、入れ子、リスト・コードブロック・見出しを含む)、アラート(5種類、複数の段落、リスト・コードブロック・画像を含む、通常の引用と続く)、アラートにしない引用 |
| [fixture-codeblocks.md](fixture-codeblocks.md) | `CODEBLOCKS` | 言語ごとのハイライト(diffなど)、`synError`、長い行、区切りのない長い文字列、タブ、全角の文字、言語名なし、はてなが対応していない言語名、アスキーアート、リスト・引用・アラート・折りたたみの中のコードブロック |
| [fixture-tables-details.md](fixture-tables-details.md) | `TABLES_DETAILS` | 揃えを指定した表、列の多い表、空のセル、HTMLで書いた表(`caption`、結合、`tfoot`)、折りたたみ(開いた・入れ子・続けて置く・長い見出し) |
| [fixture-media.md](fixture-media.md) | `MEDIA` | 画像の大きさと形、リンク付き・キャプション付きの画像、文中の画像、ブログカード、数式 |
| [fixture-toc-long.md](fixture-toc-long.md) | `TOC_LONG` | 画面の高さより長い目次、いま読んでいる見出しの表示、折り返す目次の項目 |
| [fixture-long-title.md](fixture-long-title.md) | `LONG_TITLE` | 長いタイトル(区切りのない英単語を含む)と、何行にも並ぶカテゴリ。記事のヘッダー、記事の一覧、ページャー、関連記事。カテゴリは `Fixture` に加えて、`とても長い名前のカテゴリで折り返しを確かめる` などを5つ以上付けます |

開発用ブログの既存の記事(`tests/constants.js` の `TEST_URLS`)で確かめられるもの(`#` から書く記事、Python・C#・Go・CSS・Terraformのハイライト、asin、続きを読む、目次のない短い記事)は重ねていません。

## はてなの出力を確かめた結果

投稿した記事の実際のHTMLで、はてなの出力を確かめました。結果は仕様書(`.github/agent-docs/theme-design-spec.md`)に反映しています。原稿を足したり書き換えたりしたときも、投稿して実際のHTMLを確かめてください。

* `diff` のコードブロックは `pre.code.lang-diff` になり、追加行に `synIdentifier`、削除行に `synSpecial` が付きます(ファイル名の行は `synType`、`@@` は `synStatement`)。テーマはこの行を塗り分けます。
* ```` ```aa ```` は `pre.lang-aa` にならず、`pre.code.aa`(`data-lang="aa"`)になります。はてなもアスキーアート用のフォントを当てません。
* `synError` は付きます(Cの余分な閉じかっこと、JSONの末尾のカンマ・その後の閉じかっこの3か所)。`synTodo`(`TODO` `FIXME`)と `synUnderlined` も付きます。
* `ps1`、`typescript`、`rust`、`dockerfile`、`make` は `lang-` の付いたクラスになり、ハイライトされます。`bash`、`js` は `pre.code.bash` のように `lang-` が付かず、ハイライトされません。
* リストの項目の中のコードブロックは、ハイライトされず `<pre><code class="sh">` になります。
* `~~打ち消し線~~` は `<del>` になり、空の段落(`<p></p>`)もそのまま出力されます。
* 数式はMathJaxではなく、はてながGoogle Chart APIの数式の画像(`alt` に数式)にして出力します。原稿の `\_` は `_` として渡り、添え字になります。

## 収録していないもの

* はてな記法・見たままモードで書いた記事: 編集モードを切り替える必要があるため、同じ見出しの出力(h3から始まる)をMarkdownで作った fixture-headings-h3.md で代わりに確かめます。
* YouTubeやX(Twitter)などの埋め込み: 埋め込むURLを決めてから足してください。
* コメント: 投稿した記事にコメントを書いて確かめます。
