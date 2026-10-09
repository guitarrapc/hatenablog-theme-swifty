Swiftyは、長い記事も読み通しやすいワンカラムのはてなブログテーマです。本文の幅、見出し、目次、コードブロックを、読みやすさを優先して整えています。配色は複数あり、デザインCSSに1行書くと切り替えられます。

[:contents]

## テーマの特徴

- **読みやすい本文の幅**: 本文は1行に全角50文字までにして、長い記事でも行を追いやすくしています。
- **形で見分けられる見出し**: 大見出し・中見出し・小見出しの形を変え、文字の大きさだけに頼らず階層が分かるようにしています。
- **本文の横に残る目次**: PCの広い画面では、目次を本文の横に常に表示します。JavaScriptは要りません。
- **読みやすいコードブロック**: ハイライトを種類ごとに色分けし、上の帯に言語名を表示します。
- **切り替えられる配色**: どの配色もダークモードに対応し、WCAG AAのコントラストを満たします。
- **揃った記事下とブログパーツ**: 共有ボタン・関連記事・コメント・ブログパーツを、同じ形の段で並べます。

次のような方に向いています。

- 長い記事や、見出しの多い記事を書く方
- コードブロックをよく使う方
- ブログに合わせて配色を選びたい方
- ダークモードで読む読者にも配慮したい方

PC[^1]、タブレット[^2]、スマートフォン[^3]では、次のように表示します。

| PC | タブレット | スマートフォン |
| ---- | ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="PC表示">[f:id:guitarrapc_tech:20261009190514p:plain]<figcaption>PC表示</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="タブレット表示">[f:id:guitarrapc_tech:20261009190817p:plain]<figcaption>タブレット表示</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="スマートフォン表示">[f:id:guitarrapc_tech:20261009190649p:plain]<figcaption>スマートフォン表示</figcaption></figure> |

<!-- screenshots/pc-article-top.png | screenshots/tablet-article-top.png | screenshots/smartphone-article-top.png -->

## 読みやすさ

### 本文の幅

本文の幅は最大824pxで、全角の文字で1行に50文字です。これより長いと、日本語では次の行の頭を探しにくくなります。

画面を広げても本文は広げず、広がったぶんは目次の列と余白に回します。タブレットやスマートフォンでは、画面の幅に合わせて本文を広げます。

### 見出し

見出しは、記事の中での役割で形を変えます。

| 役割 | 形 |
| ---- | ---- |
| 大見出し | 左の太い縦棒と、右へ薄れる淡い帯 |
| 中見出し | 全幅の破線の下線 |
| 小見出し | 文字の高さだけの細い縦棒 |

記事でいちばん上に使った段を大見出しにします。Markdownで `##` から書いた記事はh2が、はてな記法や見たままモードで書いた記事はh3が大見出しになり、書き方が違っても同じ形で表示します。

<figure class="figure-image figure-image-fotolife" title="大見出し・中見出し・小見出しと、その下の段の見出し">[f:id:guitarrapc_tech:20261009190916p:plain]<figcaption>大見出し・中見出し・小見出しと、その下の段の見出し</figcaption></figure>

<!-- screenshots/pc-headings.png -->

### 目次

`[:contents]` で入れた目次は、画面の幅で置き場所が変わります。

- **横幅1200px以上**: 本文の横に常に表示し、スクロールしても画面に残ります。目次が長いときは、目次の中でスクロールします。
- **横幅1200px未満**: 書いた位置にそのまま表示します。

Chrome・Edgeでは、いま読んでいる見出しを目次で示します。どれもJavaScriptなしで動きます。

目次のない記事も、目次の列を空けておきます。目次のある記事と行き来しても、タイトルと本文の位置は変わりません。

<figure class="figure-image figure-image-fotolife" title="本文の横の目次。いま読んでいる見出しを太字と線の色で示す">[f:id:guitarrapc_tech:20261009190958p:plain]<figcaption>本文の横の目次。いま読んでいる見出しを太字と線の色で示す</figcaption></figure>

<!-- screenshots/pc-toc.png -->

### コードブロック

はてなのコードハイライトをそのまま使い、キーワード・型・関数名・文字列・コメントなどを色で分けます。上の帯に言語名を表示し、長い行は折り返さずに横スクロールします。

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

`diff` では、追加した行を淡い緑、削除した行を淡い赤で塗ります。

```diff
 function fetchUser(id) {
-  return fetch(`/users/${id}`);
+  return fetch(`/api/users/${id}`, { cache: "no-store" });
 }
```

## 配色とダークモード

### 配色

配色は、デザインCSSに1行書くと切り替えられます。

```css
:root { --swifty-scheme: blue; }
```

既定の白と淡いミントのほかに、ほぼ白のグレーに青・ピンク・黄色・紫のアクセント、ベージュとくすんだ緑、くすみピンク、アプリコットピンク、ネイビー、濃いピンクと緑があります。

どの配色も、本文・リンク・補助の文字は背景に対して4.5:1以上のコントラスト(WCAG AA)を満たします。

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


配色ごとの色と書き方は、[Swiftyテーマのカスタマイズガイド](https://swifty.hatenablog.jp/entry/2026/10/09/200331)の`配色を切り替える`で紹介しています。

### ダークモード

どの配色も、OSのダークモードに合わせてダーク表示へ自動切換えします。ライト/ダークいずれかの配色に固定したい場合、デザインCSSで設定できます。

```css
:root { --swifty-color-mode: light; } /* 常にライト */
:root { --swifty-color-mode: dark; } /* 常にダーク */
```

後述のJavaScriptを追加すると、ヘッダーにボタンを追加して読者がライト・ダーク・自動を選べるようになります。

ダークモードには、次の注意点があります。

- はてなのヘッダーメニューやスターなど、はてなの部品は明るいまま表示されます。
- 記事中で文字に付けた色や、透明な背景に黒い線で描いた画像は、見えにくくなることがあります。気になる場合は、常にライトに固定してください。
- ブログの背景の設定(色・画像)は、ダークモードでは使われません。

| PC | タブレット | スマートフォン |
| ---- | ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="PC表示">[f:id:guitarrapc_tech:20261009192553p:plain]<figcaption>PC表示</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="タブレット表示">[f:id:guitarrapc_tech:20261009192634p:plain]<figcaption>タブレット表示</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="スマートフォン表示">[f:id:guitarrapc_tech:20261009192648p:plain]<figcaption>スマートフォン表示</figcaption></figure> |

<!-- screenshots/pc-article-top-dark.png | screenshots/tablet-article-top-dark.png | screenshots/smartphone-article-top-dark.png -->

## ページの作り

### ヘッダー

はてなのヘッダーメニューとブログのヘッダーを、1つのヘッダーにまとめます。「読者になる」はヘッダーの右端に置きます。スマートフォンでは、タイトルが窮屈にならないよう、タイトルの下の説明の行の右に置きます。

### カテゴリとパンくずリスト

記事ページでは、パンくずリストの代わりに、カテゴリをタイトルの上に表示します。記事ページのパンくずリストは「トップ / カテゴリ」で、カテゴリと内容が重なるためです。

表示は隠しますが、はてなの設定でパンくずリストを表示していれば、検索エンジン向けのパンくずリストの情報は残ります。パンくずリストを表示したいときは、デザインCSSで切り替えられます。

### 記事の下

記事の下には、「この記事を共有」・関連記事・コメント・前後の記事を、同じ形の段で並べます。どの段も上の線と見出しで区切り、共有のリンクや「コメントを書く」は右に置きます。

- **この記事を共有**: X・Bluesky・Misskey・Mastodon・Tumblrは、ロゴと名前のリンクに揃えます。はてなブックマーク・Facebook・LINEは、各サービスのボタンのまま表示します。
- **前後の記事**: 記事のカードの最後の段に、「前の記事」「次の記事」とタイトルを並べます。

<figure class="figure-image figure-image-fotolife" title="記事の下部分の表示">[f:id:guitarrapc_tech:20261009192820p:plain]<figcaption>記事の下部分の表示</figcaption></figure>

<!-- screenshots/tablet-entry-footer.png -->

### 記事の一覧とブログパーツ

トップページやカテゴリの記事の一覧は、1枚のカードの中に記事を並べます。画像のない記事では、はてなの仮の画像を出さず、そのぶん概要を広げます。

| PC | スマートフォン |
| ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="PCの記事一覧">[f:id:guitarrapc_tech:20261009195320p:plain]<figcaption>PCの記事一覧</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="スマートフォンの記事一覧">[f:id:guitarrapc_tech:20261009195342p:plain]<figcaption>スマートフォンの記事一覧</figcaption></figure> |

<!-- screenshots/pc-archive.png | screenshots/smartphone-archive.png -->

ブログパーツは本文の下に1枚のカードにまとめ、PCでは3列に並べます。項目のない注目記事のように、中身のないブログパーツは表示しません。

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

目次の先頭に「目次」の行が付き、押すと開け閉めできます。長い目次で画面の高さに収まらない場合、いま読んでいる見出しが常に表示されるように目次をスクロールします。

本文の横の目次を閉じると細い帯になり、そのぶん本文が広がります。開閉の状態はブラウザに記憶し、次のページでも引き継ぎます。

<figure class="figure-image figure-image-fotolife" title="本文の横の目次を閉じる">[f:id:guitarrapc_tech:20261009195548p:plain]<figcaption>本文の横の目次を閉じる</figcaption></figure>

<!-- screenshots/pc-toc-closed.png -->

### ダークモードの切り替え

ヘッダーの「読者になる」の左にボタンを置き、読者がライト・ダーク・自動(OSの設定)を選べるようにします。選んだモードはブラウザに記憶し、デザインCSSの指定より優先します。

### アラート記法

GitHubと同じアラート記法を、種類ごとの色・アイコン・タイトルを付けた囲みで表示します。引用の1行目に種類を書きます。

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

Markdownとしてはただの引用なので、同じ原稿がGitHubでもアラートになり、JavaScriptが動かない環境では通常の引用として表示されます。

## テーマの導入方法

テーマストアからの導入をおすすめします。

### テーマストアから導入する

1. [テーマストア](https://blog.hatena.ne.jp/-/store/theme/)で「Swifty」を開きます。
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
