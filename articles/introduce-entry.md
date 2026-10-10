---
title: Swifty - 長い記事も読み通しやすいはてなブログデザインテーマ
---

[Swifty](https://blog.hatena.ne.jp/-/store/theme/14945776032088160769)は、長い記事も読み通しやすいワンカラムのはてなブログテーマです。配色テーマや目次だけでなく、コードブロックや細かなデザインも工夫しています。

> [!NOTE]
> このサンプルブログは`apricot`テーマで表示しています。

[:contents]

## テーマの特徴

あなたの好きな配色に切り替えて楽しめます。

- 広めの本文幅で長い記事でも行を追いやすい
- 広い画面では、目次を本文の横に常に表示して今いる見出しもわかる
- コードブロックのハイライトと、ブロック上部に帯を追加して言語名を表示
- デザインCSSでテーマを指定するだけで配色が変えられる
- 共有ボタン・関連記事・コメント・ブログパーツのデザインをいい感じに調整

PC[^1]、タブレット[^2]、スマートフォン[^3]で、次のように表示します。

| PC | タブレット | スマートフォン |
| ---- | ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="PC表示">[f:id:guitarrapc_tech:20261009190514p:plain]<figcaption>PC表示</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="タブレット表示">[f:id:guitarrapc_tech:20261009190817p:plain]<figcaption>タブレット表示</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="スマートフォン表示">[f:id:guitarrapc_tech:20261009190649p:plain]<figcaption>スマートフォン表示</figcaption></figure> |

<!-- screenshots/pc-article-top.png | screenshots/tablet-article-top.png | screenshots/smartphone-article-top.png -->

## 本文のデザイン

### コンテンツ幅

コンテンツは最大824pxで、全角の文字で1行に50文字です。

大きな画面でも本文は真ん中に表示して、広がったぶんは目次の列と余白に回します。タブレットやスマートフォンでは画面幅に合わせてコンテンツを広げます。

### 見出し

記事でいちばん上に使った見出しを大見出しとして調整します。

| 役割 | 形 |
| ---- | ---- |
| 大見出し | 左の太い縦棒と、右へ薄れる淡い帯 |
| 中見出し | 全幅の破線の下線 |
| 小見出し | 文字の高さだけの細い縦棒 |

Markdownで `##` から書いた記事はh2が、はてな記法や見たままモードで書いた記事はh3が大見出しになり、書き方が違っても同じ形で表示します。

<figure class="figure-image figure-image-fotolife" title="大見出し・中見出し・小見出しと、その下の段の見出し">[f:id:guitarrapc_tech:20261009190916p:plain]<figcaption>大見出し・中見出し・小見出しと、その下の段の見出し</figcaption></figure>

<!-- screenshots/pc-headings.png -->

### 目次

`[:contents]` で表示される目次は、画面の幅で置き場所が変わります。

- **横幅1200px以上**: 本文の横に常に表示し、スクロールしても画面に残ります。
- **横幅1200px未満**: 書いた位置にそのまま表示します。

Chrome・Edgeでは、いま読んでいる見出しを目次で示します。

デザインを一貫させるため、目次のない記事も目次部分は空きます。

<figure class="figure-image figure-image-fotolife" title="本文の横の目次。いま読んでいる見出しを太字と線の色で示す">[f:id:guitarrapc_tech:20261009190958p:plain]<figcaption>本文の横の目次。いま読んでいる見出しを太字と線の色で示す</figcaption></figure>

<!-- screenshots/pc-toc.png -->

### コードブロック

はてなのコードハイライトを調整しています。コードブロックの上部に言語名を表示します。JavaScriptでカスタマイズすると折り返しやコピーボタンを追加できます。

```python
from dataclasses import dataclass


# 2次元の点
@dataclass(frozen=True)
class Point:
    x: float
    y: float

    def __add__(self, other: "Point") -> "Point":
        return Point(self.x + other.x, self.y + other.y)


points = [Point(i, i * i % 5) for i in range(5)]
print(f"Total = {sum(points, Point(0, 0))}")
```

```diff
 function fetchUser(id) {
-  return fetch(`/users/${id}`);
+  return fetch(`/api/users/${id}`, { cache: "no-store" });
 }
```

## 配色とダークモード

### テーマで配色を切り替える

配色は、デザインCSSに1行書けば指定できます。

```css
:root { --swifty-scheme: blue; }
```

デフォルトのミントの他に、ほぼ白のグレーに青・ピンク・黄色・紫のアクセント、ベージュとくすんだ緑、くすみピンク、アプリコットピンク、ネイビー、濃いピンクと緑があります。

どの配色も、本文・リンク・補助の文字は背景に対して4.5:1以上のコントラスト(WCAG AA)を満たします。配色ごとの色と書き方は、[Swiftyテーマのカスタマイズガイド](https://swifty.hatenablog.jp/entry/2026/10/09/200331)の`配色を切り替える`で紹介しています。

| 配色 | ライト | ダーク |
| ---- | ---- | ---- |
| `mint`(既定) | <figure class="figure-image figure-image-fotolife" title="mintのライト">[f:id:guitarrapc_tech:20261009191134p:plain]<figcaption>mintのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="mintのダーク">[f:id:guitarrapc_tech:20261009191151p:plain]<figcaption>mintのダーク</figcaption></figure> |
| `blue` | <figure class="figure-image figure-image-fotolife" title="blueのライト">[f:id:guitarrapc_tech:20261009191215p:plain]<figcaption>blueのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="blueのダーク">[f:id:guitarrapc_tech:20261009191231p:plain]<figcaption>blueのダーク</figcaption></figure> |
| `pink` | <figure class="figure-image figure-image-fotolife" title="pinkのライト">[f:id:guitarrapc_tech:20261009191253p:plain]<figcaption>pinkのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="pinkのダーク">[f:id:guitarrapc_tech:20261009191308p:plain]<figcaption>pinkのダーク</figcaption></figure> |
| `yellow` | <figure class="figure-image figure-image-fotolife" title="yellowのライト">[f:id:guitarrapc_tech:20261009191330p:plain]<figcaption>yellowのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="yellowのダーク">[f:id:guitarrapc_tech:20261009191347p:plain]<figcaption>yellowのダーク</figcaption></figure> |
| `purple` | <figure class="figure-image figure-image-fotolife" title="purpleのライト">[f:id:guitarrapc_tech:20261009191415p:plain]<figcaption>purpleのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="purpleのダーク">[f:id:guitarrapc_tech:20261009191426p:plain]<figcaption>purpleのダーク</figcaption></figure> |
| `beige` | <figure class="figure-image figure-image-fotolife" title="beigeのライト">[f:id:guitarrapc_tech:20261009191448p:plain]<figcaption>beigeのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="beigeのダーク">[f:id:guitarrapc_tech:20261009191501p:plain]<figcaption>beigeのダーク</figcaption></figure> |
| `dusty-pink` | <figure class="figure-image figure-image-fotolife" title="dusty-pinkのライト">[f:id:guitarrapc_tech:20261009191522p:plain]<figcaption>dusty-pinkのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="dusty-pinkのダーク">[f:id:guitarrapc_tech:20261009191538p:plain]<figcaption>dusty-pinkのダーク</figcaption></figure> |
| `apricot` | <figure class="figure-image figure-image-fotolife" title="apricotのライト">[f:id:guitarrapc_tech:20261009191610p:plain]<figcaption>apricotのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="apricotのダーク">[f:id:guitarrapc_tech:20261009191624p:plain]<figcaption>apricotのダーク</figcaption></figure> |
| `navy` | <figure class="figure-image figure-image-fotolife" title="navyのライト">[f:id:guitarrapc_tech:20261009191645p:plain]<figcaption>navyのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="navyのダーク">[f:id:guitarrapc_tech:20261009191658p:plain]<figcaption>navyのダーク</figcaption></figure> |
| `pink-green` | <figure class="figure-image figure-image-fotolife" title="pink-greenのライト">[f:id:guitarrapc_tech:20261009191718p:plain]<figcaption>pink-greenのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="pink-greenのダーク">[f:id:guitarrapc_tech:20261009191733p:plain]<figcaption>pink-greenのダーク</figcaption></figure> |
| `ink` | <figure class="figure-image figure-image-fotolife" title="inkのライト">[f:id:guitarrapc_tech:20261011013111p:plain]<figcaption>inkのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="inkのダーク">[f:id:guitarrapc_tech:20261011013126p:plain]<figcaption>inkのダーク</figcaption></figure> |
| `zenn` | <figure class="figure-image figure-image-fotolife" title="zennのライト">[f:id:guitarrapc_tech:20261011013148p:plain]<figcaption>zennのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="zennのダーク">[f:id:guitarrapc_tech:20261011013207p:plain]<figcaption>zennのダーク</figcaption></figure> |
| `qiita` | <figure class="figure-image figure-image-fotolife" title="qiitaのライト">[f:id:guitarrapc_tech:20261011014655p:plain]<figcaption>qiitaのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="qiitaのダーク">[f:id:guitarrapc_tech:20261011014706p:plain]<figcaption>qiitaのダーク</figcaption></figure> |

<!-- screenshots/scheme-mint.png | screenshots/scheme-mint-dark.png -->
<!-- screenshots/scheme-blue.png | screenshots/scheme-blue-dark.png -->
<!-- screenshots/scheme-pink.png | screenshots/scheme-pink-dark.png -->
<!-- screenshots/scheme-yellow.png | screenshots/scheme-yellow-dark.png -->
<!-- screenshots/scheme-purple.png | screenshots/scheme-purple-dark.png -->
<!-- screenshots/scheme-beige.png | screenshots/scheme-beige-dark.png -->
<!-- screenshots/scheme-dusty-pink.png | screenshots/scheme-dusty-pink-dark.png -->
<!-- screenshots/scheme-apricot.png | screenshots/scheme-apricot-dark.png -->
<!-- screenshots/scheme-navy.png | screenshots/scheme-navy-dark.png -->
<!-- screenshots/scheme-pink-green.png | screenshots/scheme-pink-green-dark.png -->
<!-- screenshots/scheme-ink.png | screenshots/scheme-ink-dark.png -->
<!-- screenshots/scheme-zenn.png | screenshots/scheme-zenn-dark.png -->
<!-- screenshots/scheme-qiita.png | screenshots/scheme-qiita-dark.png -->

### ダークモード

どの配色も、OSのダークモードに合わせてダーク表示へ自動切換えします。ライト/ダークいずれかの配色に固定したい場合、デザインCSSで設定できます。

```css
:root { --swifty-color-mode: light; } /* 常にライト */
:root { --swifty-color-mode: dark; } /* 常にダーク */
```

JavaScriptでカスタマイズすると、ヘッダーにボタンを追加して読者がライト・ダーク・自動を選べるようになります。

ダークモードには、次の注意点があります。

- はてなのヘッダーメニューやスターなど、はてなの部品は明るいまま表示されます。
- 記事中で文字に付けた色や、透明な背景に黒い線で描いた画像は、見えにくくなることがあります。気になる場合は、常にライトに固定してください。
- ブログの背景の設定(色・画像)は、ダークモードでは使われません。

| PC | タブレット | スマートフォン |
| ---- | ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="PC表示">[f:id:guitarrapc_tech:20261009192553p:plain]<figcaption>PC表示</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="タブレット表示">[f:id:guitarrapc_tech:20261009192634p:plain]<figcaption>タブレット表示</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="スマートフォン表示">[f:id:guitarrapc_tech:20261009192648p:plain]<figcaption>スマートフォン表示</figcaption></figure> |

<!-- screenshots/pc-article-top-dark.png | screenshots/tablet-article-top-dark.png | screenshots/smartphone-article-top-dark.png -->

## はてなブログパーツの調整

このテーマははてなブログパーツを調整しています。

### ヘッダー

はてなのヘッダーメニューとブログのヘッダーを、1つのヘッダーにまとめます。「読者になる」ボタンはヘッダーの右端に表示されます。

### カテゴリとパンくずリスト

パンくずリストの代わりに、カテゴリをタイトルの上に表示します。

表示は隠しますが、はてなの設定でパンくずリストを表示していれば、検索エンジン向けのパンくずリストの情報は残ります。パンくずリストを表示したいときは、デザインCSSで切り替えられます。

```css
:root { --swifty-entry-breadcrumb: show; }
```

### 記事の下

「この記事を共有」・関連記事・コメント・前後の記事のスタイルを調整しています。

- この記事を共有: X・Bluesky・Misskey・Mastodon・Tumblrは、ロゴと名前のリンクを調整しています。はてなブックマーク・Facebook・LINEは、各サービスのボタンのまま表示します。
- 前後の記事: 記事の末尾に「前の記事」「次の記事」とタイトルを表示します

<figure class="figure-image figure-image-fotolife" title="記事の下部分の表示">[f:id:guitarrapc_tech:20261009192820p:plain]<figcaption>記事の下部分の表示</figcaption></figure>

<!-- screenshots/tablet-entry-footer.png -->

### 記事の一覧とブログパーツ

トップページやカテゴリの記事の一覧は、画像のない記事では「はてなの仮の画像」を出しません。

| PC | スマートフォン |
| ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="PCの記事一覧">[f:id:guitarrapc_tech:20261009195320p:plain]<figcaption>PCの記事一覧</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="スマートフォンの記事一覧">[f:id:guitarrapc_tech:20261009195342p:plain]<figcaption>スマートフォンの記事一覧</figcaption></figure> |

<!-- screenshots/pc-archive.png | screenshots/smartphone-archive.png -->

ブログパーツは、項目のない注目記事のように中身のないブログパーツを表示しないようにしています。

<figure class="figure-image figure-image-fotolife" title="ブログパーツ">[f:id:guitarrapc_tech:20261009195432p:plain]<figcaption>ブログパーツ</figcaption></figure>

<!-- screenshots/pc-modules.png -->

## JavaScriptで追加できる機能

> [!TIP]
> どの機能も、テーマの導入後に「JavaScriptを追加する」(後述)の設定をすると使えます。

### コードブロックのボタン

コードブロックの帯の右端に、2つのボタンを置きます。

- **Copy**: コードをコピーします。言語名やボタンの文字は含みません。
- **Wrap**: 長い行の折り返しと横スクロールを切り替えます。

<figure class="figure-image figure-image-fotolife" title="コードブロックの言語名とボタン">[f:id:guitarrapc_tech:20261009195510p:plain]<figcaption>コードブロックの言語名とボタン</figcaption></figure>

<!-- screenshots/pc-codeblock.png -->

### 目次の開閉

目次の先頭に「目次」が付き、押すと開け閉めできます。長い目次で画面の高さに収まらない場合、いま読んでいる見出しが常に表示されるように目次をスクロールします。

本文の横の目次を閉じると細くなり、そのぶん本文が広がります。開閉の状態はブラウザに記憶しているので別の記事でも引き継がれます。

<figure class="figure-image figure-image-fotolife" title="本文の横の目次を閉じる">[f:id:guitarrapc_tech:20261009195548p:plain]<figcaption>本文の横の目次を閉じる</figcaption></figure>

<!-- screenshots/pc-toc-closed.png -->

### ダークモードの切り替え

ヘッダーの「読者になる」の左にダークモード切替ボタンが追加されます。読者がライト・ダーク・自動(OSの設定)を選べるようにします。選んだモードはブラウザに記憶し、デザインCSSの指定より優先します。

### アラート記法

GitHubと同じアラート記法を表示するため、GitHubと同じマークダウンを使えます。JavaScriptが動かない環境では通常の引用として表示されます。

```markdown
> [!NOTE]
> 流し読みでも把握しておいてほしい情報です。
```

| ライト | ダーク |
| ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="GitHubと同じアラート表示">[f:id:guitarrapc_tech:20261009195705p:plain]<figcaption>GitHubと同じアラート表示</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="GitHubと同じアラート表示(ダーク)">[f:id:guitarrapc_tech:20261009195729p:plain]<figcaption>GitHubと同じアラート表示(ダーク)</figcaption></figure> |

<!-- screenshots/pc-alert.png | screenshots/pc-alert-dark.png -->

| 記法 | 表示 | 使いどころ |
| ---- | ---- | ---- |
| `[!NOTE]` | Note(青) | 流し読みでも把握しておいてほしい情報 |
| `[!TIP]` | Tip(緑) | 知っておくと便利な補足情報 |
| `[!IMPORTANT]` | Important(紫) | 目的を達成するために必要な情報 |
| `[!WARNING]` | Warning(黄) | 問題を避けるために、すぐ注意してほしい情報 |
| `[!CAUTION]` | Caution(赤) | 行動によって起こりうる悪い結果についての情報 |


## テーマの導入方法

テーマストアからの導入をおすすめします。

### テーマストアから導入する

1. [テーマストア](https://blog.hatena.ne.jp/-/store/theme/14945776032088160769)を開きます。
2. 自分のブログにインストールします。

### GitHubから導入する

1. [最新のリリース](https://github.com/guitarrapc/hatenablog-theme-swifty/releases/latest)から `theme-バージョン.zip` をダウンロードします。
2. zipの中の `style.css` を、「デザイン」→「カスタマイズ」→「デザインCSS」に貼り付けて保存します。

GitHubから導入すると、テーマを更新するたびに貼り直す必要があります。カスタマイズのCSSは、テーマのCSSの後ろに書いてください。

## テーマ導入後の設定

### レスポンシブデザインを有効にする

スマートフォンでも同じテーマで表示するために、次の設定をします。

1. 「デザイン」→「スマートフォン」を開きます。
2. 「詳細設定」の「レスポンシブデザインを適用する」にチェックを入れます。
3. 保存します。

### JavaScriptを追加する

使いたい機能のファイルの内容をコピーし、表の場所に貼り付けて保存します。ファイルはリリースのzipにも入っています。

| 機能 | ファイル | 貼り付ける場所 |
| ---- | ---- | ---- |
| コードブロックのボタン | [customize-codeblock.html](https://github.com/guitarrapc/hatenablog-theme-swifty/blob/main/customize-codeblock.html) | 「デザイン」→「カスタマイズ」→「ヘッダ」→「ブログタイトル下」 |
| 目次の開閉 | [customize-toc-toggle.html](https://github.com/guitarrapc/hatenablog-theme-swifty/blob/main/customize-toc-toggle.html) | 「デザイン」→「カスタマイズ」→「ヘッダ」→「ブログタイトル下」 |
| アラート記法 | [customize-alert.html](https://github.com/guitarrapc/hatenablog-theme-swifty/blob/main/customize-alert.html) | 「デザイン」→「カスタマイズ」→「ヘッダ」→「ブログタイトル下」 |
| ダークモードの切り替え | [customize-dark-mode.html](https://github.com/guitarrapc/hatenablog-theme-swifty/blob/main/customize-dark-mode.html) | 「設定」→「詳細設定」→「headに要素を追加」 |

ダークモードの切り替えだけは `head` に追加します。ページが表示される前にモードを反映するので、画面がちらつきません。

## カスタマイズについて

デザインCSSでCSS変数を上書きすると、配色・ダークモード・色・見出しの文言・本文の幅・パンくずリストの表示を変えられます。書き方は「[Swiftyテーマのカスタマイズガイド](https://swifty.hatenablog.jp/entry/2026/10/09/200331)」で紹介しています。

## 開発者向け情報

ソースコードは[GitHub](https://github.com/guitarrapc/hatenablog-theme-swifty)で公開しています(MITライセンス)。SCSSは部品ごとに分けています。

- `_variable.scss`: レイアウト、配色(CSS変数)、共通のmixin
- `_core.scss`: ページ全体の配置、パンくずリスト、フッター
- `_header.scss` / `_color_mode.scss`: ヘッダーと、ダークモードの切り替えボタン
- `_entry.scss`: 記事(本文、記事の下、コメント、前後の記事)
- `_codeblock.scss` / `_alert.scss` / `_table_of_contents.scss`: コードブロック、アラート記法、目次
- `_archive.scss` / `_modules.scss`: 記事の一覧、ブログパーツ
- `_print.scss`: 印刷

開発サーバーを使うと、SCSSの変更をすぐにブログへ反映しながら開発できます。手順はリポジトリの[README](https://github.com/guitarrapc/hatenablog-theme-swifty#開発環境を構築する)を参照してください。

---

*Swiftyへのフィードバックや質問は、[GitHub Issues](https://github.com/guitarrapc/hatenablog-theme-swifty/issues)にお寄せください。*

[^1]: 大きめのノートPCを想定した1440×900
[^2]: iPad Pro 12.9インチを想定した1024×1366
[^3]: iPhone 14 Pro Maxを想定した430×932
