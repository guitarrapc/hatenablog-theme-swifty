---
title: "Fixture: 文字と段落"
---

<!-- https://guitarrapc-theme.hatenablog.com/entry/2026/10/08/224746 -->

段落、文字の装飾、リンク、インラインコード、脚注など、文章の中に現れる要素を並べた確認用の記事です。

[:contents]

## 段落

ブログの記事は、ほとんどが段落でできています。1行の長さ、行の高さ、段落の間の余白がちょうどよいと、長い記事でも読み疲れません。この段落は、本文の幅いっぱいに文字が並んだときの1行の文字数と、折り返した行の頭の揃い方を確かめるために、句読点を含めて長めに書いています。

短い段落です。

The quick brown fox jumps over the lazy dog. This paragraph is written in English to check the letter spacing and line height for Latin text, which often looks different from Japanese text with the same settings.

日本語の中にEnglishの単語や、2026年10月8日のような数字、「かぎかっこ」や（全角のかっこ）、半角の(かっこ)が混ざった段落です。「『入れ子のかっこ』」のように約物が続く箇所や、……三点リーダー、――ダッシュも含めています。

行末に半角スペースを2つ置いて改行した段落です。
ここは同じ段落の2行目です。
ここは3行目です。

行末に何も置かずに改行した段落です。
はてなブログの設定によっては、ここも改行されます。

## 文字の装飾

**太字**、*斜体*、***太字の斜体***、`インラインコード`を並べます。

~~打ち消し線(マークダウンの記法)~~、<del>削除(del)</del>、<ins>挿入(ins)</ins>、<s>取り消し(s)</s>、<u>下線(u)</u>です。

<mark>マーカー(mark)</mark>、<small>小さい文字(small)</small>、H<sub>2</sub>O(sub)、E = mc<sup>2</sup>(sup)です。

<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> でコマンドパレットを開きます(kbd)。

<abbr title="Cascading Style Sheets">CSS</abbr>(abbr)、<ruby>漢字<rp>(</rp><rt>かんじ</rt><rp>)</rp></ruby>(ruby)、<q>短い引用(q)</q>、<cite>作品名(cite)</cite>、<var>x</var>(var)、<samp>出力(samp)</samp>、<dfn>定義語(dfn)</dfn>です。

## リンク

本文中の[リンク](https://github.com/guitarrapc/hatenablog-theme-swifty)は、色だけでなく下線でも本文と見分けられるようにします。[**太字のリンク**](https://github.com/guitarrapc/hatenablog-theme-swifty)、[`コードのリンク`](https://github.com/guitarrapc/hatenablog-theme-swifty)、[1つ目](https://hatenablog.com/)と[2つ目](https://help.hatenablog.com/)のように続くリンクも並べます。

山かっこで囲んだURL: <https://github.com/guitarrapc/hatenablog-theme-codefocus>

URLをそのまま書いた行: https://github.com/hatena/Hatena-Blog-Theme-Boilerplate

はてな記法のタイトル付きリンク: [https://github.com/hatena/Hatena-Blog-Theme-Boilerplate:title]

段落の終わりにリンクを置きます。詳しくは[はてなブログのヘルプ](https://help.hatenablog.com/)を参照してください。

## インラインコード

`npm start` のような短いコード、`<div class="entry-content">` のような記号を含むコード、``console.log(`template`)`` のようにバッククォートを含むコードです。

`.entry-content` で始まる行と、コードで終わる行 `--content-max`

**太字の中の `code`** と、[リンクの中の `code`](https://github.com/guitarrapc/hatenablog-theme-swifty) です。

長いコード `Microsoft.Extensions.DependencyInjection.ServiceCollectionServiceExtensions.AddSingleton<TService, TImplementation>()` が本文の幅を超えたときの折り返しです。

## はみ出しやすい文字列

スマートフォンの狭い画面で、本文の幅を超えて横にはみ出さないかを確かめます。

長いURLの文字列: https://example.com/very/long/path/to/the/resource/that/does/not/contain/any/spaces/and/may/overflow/the/content/area?query=parameter&another=value

長い英単語: Pneumonoultramicroscopicsilicovolcanoconiosis Supercalifragilisticexpialidocious

長い数字: 3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651

絵文字: 😀 🎉 👍🏽 👨‍👩‍👧‍👦 🇯🇵 ✅ ⚠️

記号: ① ② ③ ㈱ ℃ № ♪ → ← ↑ ↓ ※ 〜 ～ ・ ￥

## 脚注

脚注の付いた文です[^1]。同じ段落に2つ目の脚注を付けます[^2]。

脚注の本文が長い場合です[^3]。

[^1]: 短い脚注です。
[^2]: [Swifty](https://github.com/guitarrapc/hatenablog-theme-swifty)へのリンクと `インラインコード` を含む脚注です。
[^3]: 脚注は記事の末尾にまとめて表示されます。脚注の本文が複数行に折り返したときに、番号と本文の頭が揃っているか、行の高さが本文と同じように読みやすいかを確かめるため、この脚注は長めに書いています。

## 罫線

罫線の前の段落です。

---

罫線の後の段落です。

## 空の要素

次の段落とのあいだに、空の段落(`<p></p>`)を置いています。ほかの段落の間隔と同じなら問題ありません。

<p></p>

空の段落の後の段落です。
