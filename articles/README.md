# Fixture記事

開発用ブログ([blog.config.js](../blog.config.js) の `BLOG_HOST`)に投稿して、テーマ(Swifty、CodeFocus)の見た目を確かめるための記事です。見出しの割り当てや目次は記事ごとに決まるため、確かめる観点ごとに記事を分けています。

## 投稿のしかた

* 編集モードはMarkdownで投稿します。front matterの `title` を記事のタイトルにし、front matterより下を本文に貼ります。
* 編集オプションの「カスタムURL」を下の表のとおりにすると、`/entry/fixture-text` のように日付によらないURLになり、`tests/constants.js` の `TEST_URLS` に足しやすくなります。
* カテゴリには `Fixture` を付けます。カテゴリのページ(`/archive/category/Fixture`)で一覧できます。
* 画像は開発用ブログのはてなフォトライフ(`guitarrapc_tech`)にある画像を参照しています。別のアカウントのブログに投稿するときは差し替えてください。

## 記事の一覧

| ファイル | カスタムURL | 確かめること |
| ---- | ---- | ---- |
| [fixture-text.md](fixture-text.md) | `fixture-text` | 段落と改行、文字の装飾、リンク、インラインコード、はみ出しやすい文字列、脚注、罫線、空の段落 |
| [fixture-headings-h2.md](fixture-headings-h2.md) | `fixture-headings-h2` | `##` から書く記事の見出し(h2が帯)。見出しの連続、長い見出し、装飾を含む見出し、見出しの直後の要素、目次の直後の見出し |
| [fixture-headings-h3.md](fixture-headings-h3.md) | `fixture-headings-h3` | はてな記法・見たままモードと同じh3から始まる記事の見出し(h3が帯)。本文の先頭の見出し、本文の途中に置いた目次 |
| [fixture-headings-h1-mixed.md](fixture-headings-h1-mixed.md) | `fixture-headings-h1-mixed` | `##` の記事にh1が1つ混ざったときの見出し(h1が帯、h2が破線)。目次のない記事 |
| [fixture-lists.md](fixture-lists.md) | `fixture-lists` | 入れ子、2桁と3桁の番号、長い項目、段落を含む項目、リストの中のコードブロックと引用、定義リスト |
| [fixture-quotes-alerts.md](fixture-quotes-alerts.md) | `fixture-quotes-alerts` | 引用(出典、入れ子、リスト・コードブロック・見出しを含む)、アラート(5種類、複数の段落、リスト・コードブロック・画像を含む、通常の引用と続く)、アラートにしない引用 |
| [fixture-codeblocks.md](fixture-codeblocks.md) | `fixture-codeblocks` | 言語ごとのハイライト(diffなど)、`synError`、長い行、区切りのない長い文字列、タブ、全角の文字、言語名なし、はてなが対応していない言語名、アスキーアート、リスト・引用・アラート・折りたたみの中のコードブロック |
| [fixture-tables-details.md](fixture-tables-details.md) | `fixture-tables-details` | 揃えを指定した表、列の多い表、空のセル、HTMLで書いた表(`caption`、結合、`tfoot`)、折りたたみ(開いた・入れ子・続けて置く・長い見出し) |
| [fixture-media.md](fixture-media.md) | `fixture-media` | 画像の大きさと形、リンク付き・キャプション付きの画像、文中の画像、ブログカード、数式 |
| [fixture-toc-long.md](fixture-toc-long.md) | `fixture-toc-long` | 画面の高さより長い目次、いま読んでいる見出しの表示、折り返す目次の項目 |
| [fixture-long-title.md](fixture-long-title.md) | `fixture-long-title` | 長いタイトル(区切りのない英単語を含む)と、何行にも並ぶカテゴリ。記事のヘッダー、記事の一覧、ページャー、関連記事。カテゴリは `Fixture` に加えて、`とても長い名前のカテゴリで折り返しを確かめる` などを5つ以上付けます |

開発用ブログの既存の記事(`tests/constants.js` の `TEST_URLS`)で確かめられるもの(`#` から書く記事、Python・C#・Go・CSS・Terraformのハイライト、asin、続きを読む、目次のない短い記事)は重ねていません。

## 投稿後に確かめること

はてなの出力を確かめずに書いている箇所があります。投稿したら実際のHTMLを見て、結果を仕様書(`.github/agent-docs/`)に反映してください。

* `diff` のコードブロックに付くクラス(fixture-codeblocks.md)。theme-design-spec.md の「未対応の項目」では、追加行が `synIdentifier`、削除行が `synSpecial` になると見込んでいます。
* ```` ```aa ```` が、はてな記法の `>|aa|` と同じ `pre.lang-aa` になるか(fixture-codeblocks.md)。
* `synError` が付くか(fixture-codeblocks.md のCの閉じかっこと、JSONの末尾のカンマ)。
* `ps1`、`typescript`、`rust`、`dockerfile`、`make` を、はてなが言語として扱うか(`lang-` の付いたクラスになるか)。
* `~~打ち消し線~~` が `<del>` になるか、空の段落(`<p></p>`)がそのまま出力されるか(fixture-text.md)。
* 数式の `\_` が `_` としてMathJaxに渡り、添え字として表示されるか(fixture-media.md)。

## 収録していないもの

* はてな記法・見たままモードで書いた記事: 編集モードを切り替える必要があるため、同じ見出しの出力(h3から始まる)をMarkdownで作った fixture-headings-h3.md で代わりに確かめます。
* YouTubeやX(Twitter)などの埋め込み: 埋め込むURLを決めてから足してください。
* コメント: 投稿した記事にコメントを書いて確かめます。
