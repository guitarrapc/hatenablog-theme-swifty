---
title: Swiftyテーマのカスタマイズガイド
---

[Swifty](https://blog.hatena.ne.jp/-/store/theme/14945776032088160769)は、デザインCSSでCSS変数を上書きすると見た目を変えられます。この記事では、変えられる項目と書き方を紹介します。テーマの導入と基本の設定は[こちら](https://swifty.hatenablog.jp/entry/2026/10/09/195900)を参照してください。

[:contents]

## カスタマイズの基本

「デザイン」→「カスタマイズ」→「デザインCSS」に書きます。以下は一行で調整できます。

| 項目 | CSS変数 | 書く場所 |
| ---- | ---- | ---- |
| 配色 | `--swifty-scheme` | `:root` |
| ダークモード | `--swifty-color-mode` | `:root` |
| 記事ページのパンくずリスト | `--swifty-entry-breadcrumb` | `:root` |
| 色 | `--link` など | `body` |
| 見出しの文言 | `--toc-label` など | `:root` |
| 本文の幅と角丸 | `--content-max` など | `:root` |

> [!NOTE]
> 配色・ダークモード・パンくずリストの切り替えは、スタイルクエリというCSSの機能を使います。Chrome・Edge 111以降、Safari 18以降、Firefox 151以降で有効です。それより前のブラウザでは、既定の配色(ライト)で表示し、記事ページのパンくずリストは表示しません。

## 配色を切り替える

`--swifty-scheme` に配色の名前を書きます。どの配色にもダークの配色があり、ダークモードでは自動で切り替わります。書かない場合や、知らない名前を書いた場合は、既定の `mint` で表示します。

表には、ページの背景・カード・文字・リンク・アクセントの色を載せています。ほかの色は、後述の「色のCSS変数」を参照してください。

### mint(ミント・既定)

淡いミントを帯びたグレーの地に、ミントのアクセントです。既定の配色なので、書かなくてもこの配色になります。

```css
:root { --swifty-scheme: mint; }
```

| ライト | ダーク |
| ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="mintのライト">[f:id:guitarrapc_tech:20261009191134p:plain]<figcaption>mintのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="mintのダーク">[f:id:guitarrapc_tech:20261009191151p:plain]<figcaption>mintのダーク</figcaption></figure> |

<!-- screenshots/scheme-mint.png | screenshots/scheme-mint-dark.png -->

| 色 | ライト | ダーク |
| ---- | ---- | ---- |
| ページの背景(`--background`) | <span style="background:#f2f6f5;border:1px solid #8886;border-radius:3px">　</span> `#f2f6f5` | <span style="background:#0e1614;border:1px solid #8886;border-radius:3px">　</span> `#0e1614` |
| カード(`--surface`) | <span style="background:#ffffff;border:1px solid #8886;border-radius:3px">　</span> `#ffffff` | <span style="background:#161e1c;border:1px solid #8886;border-radius:3px">　</span> `#161e1c` |
| タイトル・見出し(`--text-header`) | <span style="background:#172321;border:1px solid #8886;border-radius:3px">　</span> `#172321` | <span style="background:#edf3f2;border:1px solid #8886;border-radius:3px">　</span> `#edf3f2` |
| 本文(`--text-body`) | <span style="background:#2b3836;border:1px solid #8886;border-radius:3px">　</span> `#2b3836` | <span style="background:#d9e4e1;border:1px solid #8886;border-radius:3px">　</span> `#d9e4e1` |
| 補助の文字(`--text-light`) | <span style="background:#5b6b67;border:1px solid #8886;border-radius:3px">　</span> `#5b6b67` | <span style="background:#82908c;border:1px solid #8886;border-radius:3px">　</span> `#82908c` |
| リンク(`--link`) | <span style="background:#0b7268;border:1px solid #8886;border-radius:3px">　</span> `#0b7268` | <span style="background:#31bca9;border:1px solid #8886;border-radius:3px">　</span> `#31bca9` |
| アクセント(`--accent`) | <span style="background:#3cc4b0;border:1px solid #8886;border-radius:3px">　</span> `#3cc4b0` | <span style="background:#31bca9;border:1px solid #8886;border-radius:3px">　</span> `#31bca9` |

### blue(青)

わずかに青みのある、ほぼ白のグレーの地に、青のアクセントです。

```css
:root { --swifty-scheme: blue; }
```

| ライト | ダーク |
| ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="blueのライト">[f:id:guitarrapc_tech:20261009191215p:plain]<figcaption>blueのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="blueのダーク">[f:id:guitarrapc_tech:20261009191231p:plain]<figcaption>blueのダーク</figcaption></figure> |

<!-- screenshots/scheme-blue.png | screenshots/scheme-blue-dark.png -->

| 色 | ライト | ダーク |
| ---- | ---- | ---- |
| ページの背景(`--background`) | <span style="background:#f3f4f6;border:1px solid #8886;border-radius:3px">　</span> `#f3f4f6` | <span style="background:#111419;border:1px solid #8886;border-radius:3px">　</span> `#111419` |
| カード(`--surface`) | <span style="background:#ffffff;border:1px solid #8886;border-radius:3px">　</span> `#ffffff` | <span style="background:#191c22;border:1px solid #8886;border-radius:3px">　</span> `#191c22` |
| タイトル・見出し(`--text-header`) | <span style="background:#161a20;border:1px solid #8886;border-radius:3px">　</span> `#161a20` | <span style="background:#eff2f7;border:1px solid #8886;border-radius:3px">　</span> `#eff2f7` |
| 本文(`--text-body`) | <span style="background:#2a2f37;border:1px solid #8886;border-radius:3px">　</span> `#2a2f37` | <span style="background:#dde1ea;border:1px solid #8886;border-radius:3px">　</span> `#dde1ea` |
| 補助の文字(`--text-light`) | <span style="background:#5a6270;border:1px solid #8886;border-radius:3px">　</span> `#5a6270` | <span style="background:#868b95;border:1px solid #8886;border-radius:3px">　</span> `#868b95` |
| リンク(`--link`) | <span style="background:#1a5fc8;border:1px solid #8886;border-radius:3px">　</span> `#1a5fc8` | <span style="background:#6fa6f5;border:1px solid #8886;border-radius:3px">　</span> `#6fa6f5` |
| アクセント(`--accent`) | <span style="background:#4a8ff0;border:1px solid #8886;border-radius:3px">　</span> `#4a8ff0` | <span style="background:#6fa6f5;border:1px solid #8886;border-radius:3px">　</span> `#6fa6f5` |

### pink(ピンク)

わずかに赤みのある、ほぼ白のグレーの地に、ピンクのアクセントです。

```css
:root { --swifty-scheme: pink; }
```

| ライト | ダーク |
| ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="pinkのライト">[f:id:guitarrapc_tech:20261009191253p:plain]<figcaption>pinkのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="pinkのダーク">[f:id:guitarrapc_tech:20261009191308p:plain]<figcaption>pinkのダーク</figcaption></figure> |

<!-- screenshots/scheme-pink.png | screenshots/scheme-pink-dark.png -->

| 色 | ライト | ダーク |
| ---- | ---- | ---- |
| ページの背景(`--background`) | <span style="background:#f7f1f3;border:1px solid #8886;border-radius:3px">　</span> `#f7f1f3` | <span style="background:#181214;border:1px solid #8886;border-radius:3px">　</span> `#181214` |
| カード(`--surface`) | <span style="background:#ffffff;border:1px solid #8886;border-radius:3px">　</span> `#ffffff` | <span style="background:#21191c;border:1px solid #8886;border-radius:3px">　</span> `#21191c` |
| タイトル・見出し(`--text-header`) | <span style="background:#21181c;border:1px solid #8886;border-radius:3px">　</span> `#21181c` | <span style="background:#f6f0f2;border:1px solid #8886;border-radius:3px">　</span> `#f6f0f2` |
| 本文(`--text-body`) | <span style="background:#3a2e33;border:1px solid #8886;border-radius:3px">　</span> `#3a2e33` | <span style="background:#e8dee2;border:1px solid #8886;border-radius:3px">　</span> `#e8dee2` |
| 補助の文字(`--text-light`) | <span style="background:#6b5a61;border:1px solid #8886;border-radius:3px">　</span> `#6b5a61` | <span style="background:#94878b;border:1px solid #8886;border-radius:3px">　</span> `#94878b` |
| リンク(`--link`) | <span style="background:#b3245e;border:1px solid #8886;border-radius:3px">　</span> `#b3245e` | <span style="background:#e580a4;border:1px solid #8886;border-radius:3px">　</span> `#e580a4` |
| アクセント(`--accent`) | <span style="background:#f07fa8;border:1px solid #8886;border-radius:3px">　</span> `#f07fa8` | <span style="background:#e580a4;border:1px solid #8886;border-radius:3px">　</span> `#e580a4` |

### yellow(黄色)

わずかに黄みのある、ほぼ白のグレーの地に、黄色のアクセントです。黄色は白地で読みにくいので、リンクは琥珀〜茶色にしています。

```css
:root { --swifty-scheme: yellow; }
```

| ライト | ダーク |
| ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="yellowのライト">[f:id:guitarrapc_tech:20261009191330p:plain]<figcaption>yellowのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="yellowのダーク">[f:id:guitarrapc_tech:20261009191347p:plain]<figcaption>yellowのダーク</figcaption></figure> |

<!-- screenshots/scheme-yellow.png | screenshots/scheme-yellow-dark.png -->

| 色 | ライト | ダーク |
| ---- | ---- | ---- |
| ページの背景(`--background`) | <span style="background:#f7f4e9;border:1px solid #8886;border-radius:3px">　</span> `#f7f4e9` | <span style="background:#15140e;border:1px solid #8886;border-radius:3px">　</span> `#15140e` |
| カード(`--surface`) | <span style="background:#ffffff;border:1px solid #8886;border-radius:3px">　</span> `#ffffff` | <span style="background:#1d1c15;border:1px solid #8886;border-radius:3px">　</span> `#1d1c15` |
| タイトル・見出し(`--text-header`) | <span style="background:#1e1b16;border:1px solid #8886;border-radius:3px">　</span> `#1e1b16` | <span style="background:#f3f2ec;border:1px solid #8886;border-radius:3px">　</span> `#f3f2ec` |
| 本文(`--text-body`) | <span style="background:#37322a;border:1px solid #8886;border-radius:3px">　</span> `#37322a` | <span style="background:#e4e1d9;border:1px solid #8886;border-radius:3px">　</span> `#e4e1d9` |
| 補助の文字(`--text-light`) | <span style="background:#665e4b;border:1px solid #8886;border-radius:3px">　</span> `#665e4b` | <span style="background:#8e8b7f;border:1px solid #8886;border-radius:3px">　</span> `#8e8b7f` |
| リンク(`--link`) | <span style="background:#8a5a00;border:1px solid #8886;border-radius:3px">　</span> `#8a5a00` | <span style="background:#edc14d;border:1px solid #8886;border-radius:3px">　</span> `#edc14d` |
| アクセント(`--accent`) | <span style="background:#f2c230;border:1px solid #8886;border-radius:3px">　</span> `#f2c230` | <span style="background:#f6c330;border:1px solid #8886;border-radius:3px">　</span> `#f6c330` |

### purple(紫)

わずかに紫みのある、ほぼ白のグレーの地に、紫のアクセントです。

```css
:root { --swifty-scheme: purple; }
```

| ライト | ダーク |
| ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="purpleのライト">[f:id:guitarrapc_tech:20261009191415p:plain]<figcaption>purpleのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="purpleのダーク">[f:id:guitarrapc_tech:20261009191426p:plain]<figcaption>purpleのダーク</figcaption></figure> |

<!-- screenshots/scheme-purple.png | screenshots/scheme-purple-dark.png -->

| 色 | ライト | ダーク |
| ---- | ---- | ---- |
| ページの背景(`--background`) | <span style="background:#f4f2f8;border:1px solid #8886;border-radius:3px">　</span> `#f4f2f8` | <span style="background:#151318;border:1px solid #8886;border-radius:3px">　</span> `#151318` |
| カード(`--surface`) | <span style="background:#ffffff;border:1px solid #8886;border-radius:3px">　</span> `#ffffff` | <span style="background:#1d1b21;border:1px solid #8886;border-radius:3px">　</span> `#1d1b21` |
| タイトル・見出し(`--text-header`) | <span style="background:#1b1822;border:1px solid #8886;border-radius:3px">　</span> `#1b1822` | <span style="background:#f2f1f6;border:1px solid #8886;border-radius:3px">　</span> `#f2f1f6` |
| 本文(`--text-body`) | <span style="background:#322d3b;border:1px solid #8886;border-radius:3px">　</span> `#322d3b` | <span style="background:#e2e0e8;border:1px solid #8886;border-radius:3px">　</span> `#e2e0e8` |
| 補助の文字(`--text-light`) | <span style="background:#615a6e;border:1px solid #8886;border-radius:3px">　</span> `#615a6e` | <span style="background:#8e8a95;border:1px solid #8886;border-radius:3px">　</span> `#8e8a95` |
| リンク(`--link`) | <span style="background:#6a3fc4;border:1px solid #8886;border-radius:3px">　</span> `#6a3fc4` | <span style="background:#ac92ec;border:1px solid #8886;border-radius:3px">　</span> `#ac92ec` |
| アクセント(`--accent`) | <span style="background:#a586ec;border:1px solid #8886;border-radius:3px">　</span> `#a586ec` | <span style="background:#ac92ec;border:1px solid #8886;border-radius:3px">　</span> `#ac92ec` |

### beige(ベージュ)

ベージュの地と温かい白のカードに、くすんだ緑のアクセントです。やわらかい色合いです。

```css
:root { --swifty-scheme: beige; }
```

| ライト | ダーク |
| ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="beigeのライト">[f:id:guitarrapc_tech:20261009191448p:plain]<figcaption>beigeのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="beigeのダーク">[f:id:guitarrapc_tech:20261009191501p:plain]<figcaption>beigeのダーク</figcaption></figure> |

<!-- screenshots/scheme-beige.png | screenshots/scheme-beige-dark.png -->

| 色 | ライト | ダーク |
| ---- | ---- | ---- |
| ページの背景(`--background`) | <span style="background:#f4ebda;border:1px solid #8886;border-radius:3px">　</span> `#f4ebda` | <span style="background:#16130e;border:1px solid #8886;border-radius:3px">　</span> `#16130e` |
| カード(`--surface`) | <span style="background:#fffcf6;border:1px solid #8886;border-radius:3px">　</span> `#fffcf6` | <span style="background:#1e1b15;border:1px solid #8886;border-radius:3px">　</span> `#1e1b15` |
| タイトル・見出し(`--text-header`) | <span style="background:#1a1b19;border:1px solid #8886;border-radius:3px">　</span> `#1a1b19` | <span style="background:#f4f1ec;border:1px solid #8886;border-radius:3px">　</span> `#f4f1ec` |
| 本文(`--text-body`) | <span style="background:#262724;border:1px solid #8886;border-radius:3px">　</span> `#262724` | <span style="background:#e5e1d9;border:1px solid #8886;border-radius:3px">　</span> `#e5e1d9` |
| 補助の文字(`--text-light`) | <span style="background:#63645c;border:1px solid #8886;border-radius:3px">　</span> `#63645c` | <span style="background:#908a7f;border:1px solid #8886;border-radius:3px">　</span> `#908a7f` |
| リンク(`--link`) | <span style="background:#4f644e;border:1px solid #8886;border-radius:3px">　</span> `#4f644e` | <span style="background:#8faf8d;border:1px solid #8886;border-radius:3px">　</span> `#8faf8d` |
| アクセント(`--accent`) | <span style="background:#a6b5a5;border:1px solid #8886;border-radius:3px">　</span> `#a6b5a5` | <span style="background:#8faf8d;border:1px solid #8886;border-radius:3px">　</span> `#8faf8d` |

### dusty-pink(くすみピンク)

青みのあるくすんだグレーの地に、くすみピンクのアクセントです。落ち着いた色合いです。

```css
:root { --swifty-scheme: dusty-pink; }
```

| ライト | ダーク |
| ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="dusty-pinkのライト">[f:id:guitarrapc_tech:20261009191522p:plain]<figcaption>dusty-pinkのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="dusty-pinkのダーク">[f:id:guitarrapc_tech:20261009191538p:plain]<figcaption>dusty-pinkのダーク</figcaption></figure> |

<!-- screenshots/scheme-dusty-pink.png | screenshots/scheme-dusty-pink-dark.png -->

| 色 | ライト | ダーク |
| ---- | ---- | ---- |
| ページの背景(`--background`) | <span style="background:#e6e8f1;border:1px solid #8886;border-radius:3px">　</span> `#e6e8f1` | <span style="background:#121319;border:1px solid #8886;border-radius:3px">　</span> `#121319` |
| カード(`--surface`) | <span style="background:#ffffff;border:1px solid #8886;border-radius:3px">　</span> `#ffffff` | <span style="background:#1a1b21;border:1px solid #8886;border-radius:3px">　</span> `#1a1b21` |
| タイトル・見出し(`--text-header`) | <span style="background:#161b1d;border:1px solid #8886;border-radius:3px">　</span> `#161b1d` | <span style="background:#f0f1f7;border:1px solid #8886;border-radius:3px">　</span> `#f0f1f7` |
| 本文(`--text-body`) | <span style="background:#22292c;border:1px solid #8886;border-radius:3px">　</span> `#22292c` | <span style="background:#dfe1e9;border:1px solid #8886;border-radius:3px">　</span> `#dfe1e9` |
| 補助の文字(`--text-light`) | <span style="background:#575d63;border:1px solid #8886;border-radius:3px">　</span> `#575d63` | <span style="background:#888a95;border:1px solid #8886;border-radius:3px">　</span> `#888a95` |
| リンク(`--link`) | <span style="background:#85525b;border:1px solid #8886;border-radius:3px">　</span> `#85525b` | <span style="background:#c6959e;border:1px solid #8886;border-radius:3px">　</span> `#c6959e` |
| アクセント(`--accent`) | <span style="background:#ccb3b7;border:1px solid #8886;border-radius:3px">　</span> `#ccb3b7` | <span style="background:#c6959e;border:1px solid #8886;border-radius:3px">　</span> `#c6959e` |

### apricot(アプリコット)

ピーチベージュの地に、アプリコットピンクのアクセントです。文字は赤茶です。

```css
:root { --swifty-scheme: apricot; }
```

| ライト | ダーク |
| ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="apricotのライト">[f:id:guitarrapc_tech:20261009191610p:plain]<figcaption>apricotのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="apricotのダーク">[f:id:guitarrapc_tech:20261009191624p:plain]<figcaption>apricotのダーク</figcaption></figure> |

<!-- screenshots/scheme-apricot.png | screenshots/scheme-apricot-dark.png -->

| 色 | ライト | ダーク |
| ---- | ---- | ---- |
| ページの背景(`--background`) | <span style="background:#efddd5;border:1px solid #8886;border-radius:3px">　</span> `#efddd5` | <span style="background:#19120f;border:1px solid #8886;border-radius:3px">　</span> `#19120f` |
| カード(`--surface`) | <span style="background:#ffffff;border:1px solid #8886;border-radius:3px">　</span> `#ffffff` | <span style="background:#211a17;border:1px solid #8886;border-radius:3px">　</span> `#211a17` |
| タイトル・見出し(`--text-header`) | <span style="background:#331510;border:1px solid #8886;border-radius:3px">　</span> `#331510` | <span style="background:#f6f0ee;border:1px solid #8886;border-radius:3px">　</span> `#f6f0ee` |
| 本文(`--text-body`) | <span style="background:#482019;border:1px solid #8886;border-radius:3px">　</span> `#482019` | <span style="background:#e9dfdb;border:1px solid #8886;border-radius:3px">　</span> `#e9dfdb` |
| 補助の文字(`--text-light`) | <span style="background:#76524a;border:1px solid #8886;border-radius:3px">　</span> `#76524a` | <span style="background:#948882;border:1px solid #8886;border-radius:3px">　</span> `#948882` |
| リンク(`--link`) | <span style="background:#9a4134;border:1px solid #8886;border-radius:3px">　</span> `#9a4134` | <span style="background:#dd8c7e;border:1px solid #8886;border-radius:3px">　</span> `#dd8c7e` |
| アクセント(`--accent`) | <span style="background:#cf7f72;border:1px solid #8886;border-radius:3px">　</span> `#cf7f72` | <span style="background:#dd8c7e;border:1px solid #8886;border-radius:3px">　</span> `#dd8c7e` |

### navy(ネイビー)

わずかに青みのある、ほぼ白の地に、ネイビーのアクセントです。ダークでは、暗い背景で読めるよう明るい青にします。

```css
:root { --swifty-scheme: navy; }
```

| ライト | ダーク |
| ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="navyのライト">[f:id:guitarrapc_tech:20261009191645p:plain]<figcaption>navyのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="navyのダーク">[f:id:guitarrapc_tech:20261009191658p:plain]<figcaption>navyのダーク</figcaption></figure> |

<!-- screenshots/scheme-navy.png | screenshots/scheme-navy-dark.png -->

| 色 | ライト | ダーク |
| ---- | ---- | ---- |
| ページの背景(`--background`) | <span style="background:#fbfeff;border:1px solid #8886;border-radius:3px">　</span> `#fbfeff` | <span style="background:#0e1517;border:1px solid #8886;border-radius:3px">　</span> `#0e1517` |
| カード(`--surface`) | <span style="background:#ffffff;border:1px solid #8886;border-radius:3px">　</span> `#ffffff` | <span style="background:#161d20;border:1px solid #8886;border-radius:3px">　</span> `#161d20` |
| タイトル・見出し(`--text-header`) | <span style="background:#1c1f24;border:1px solid #8886;border-radius:3px">　</span> `#1c1f24` | <span style="background:#edf3f5;border:1px solid #8886;border-radius:3px">　</span> `#edf3f5` |
| 本文(`--text-body`) | <span style="background:#30343a;border:1px solid #8886;border-radius:3px">　</span> `#30343a` | <span style="background:#d9e3e7;border:1px solid #8886;border-radius:3px">　</span> `#d9e3e7` |
| 補助の文字(`--text-light`) | <span style="background:#5b616a;border:1px solid #8886;border-radius:3px">　</span> `#5b616a` | <span style="background:#808d92;border:1px solid #8886;border-radius:3px">　</span> `#808d92` |
| リンク(`--link`) | <span style="background:#135389;border:1px solid #8886;border-radius:3px">　</span> `#135389` | <span style="background:#6daae6;border:1px solid #8886;border-radius:3px">　</span> `#6daae6` |
| アクセント(`--accent`) | <span style="background:#135389;border:1px solid #8886;border-radius:3px">　</span> `#135389` | <span style="background:#6daae6;border:1px solid #8886;border-radius:3px">　</span> `#6daae6` |

### pink-green(ピンクと緑)

わずかに赤みのある、ほぼ白の地に、濃いピンクのアクセントです。文字はくすんだ緑です。

```css
:root { --swifty-scheme: pink-green; }
```

| ライト | ダーク |
| ---- | ---- |
| <figure class="figure-image figure-image-fotolife" title="pink-greenのライト">[f:id:guitarrapc_tech:20261009191718p:plain]<figcaption>pink-greenのライト</figcaption></figure> | <figure class="figure-image figure-image-fotolife" title="pink-greenのダーク">[f:id:guitarrapc_tech:20261009191733p:plain]<figcaption>pink-greenのダーク</figcaption></figure> |

<!-- screenshots/scheme-pink-green.png | screenshots/scheme-pink-green-dark.png -->

| 色 | ライト | ダーク |
| ---- | ---- | ---- |
| ページの背景(`--background`) | <span style="background:#fdf7f5;border:1px solid #8886;border-radius:3px">　</span> `#fdf7f5` | <span style="background:#11150d;border:1px solid #8886;border-radius:3px">　</span> `#11150d` |
| カード(`--surface`) | <span style="background:#ffffff;border:1px solid #8886;border-radius:3px">　</span> `#ffffff` | <span style="background:#191e15;border:1px solid #8886;border-radius:3px">　</span> `#191e15` |
| タイトル・見出し(`--text-header`) | <span style="background:#333c2b;border:1px solid #8886;border-radius:3px">　</span> `#333c2b` | <span style="background:#eff3ec;border:1px solid #8886;border-radius:3px">　</span> `#eff3ec` |
| 本文(`--text-body`) | <span style="background:#515d46;border:1px solid #8886;border-radius:3px">　</span> `#515d46` | <span style="background:#dde4d8;border:1px solid #8886;border-radius:3px">　</span> `#dde4d8` |
| 補助の文字(`--text-light`) | <span style="background:#626b58;border:1px solid #8886;border-radius:3px">　</span> `#626b58` | <span style="background:#878f80;border:1px solid #8886;border-radius:3px">　</span> `#878f80` |
| リンク(`--link`) | <span style="background:#b43f45;border:1px solid #8886;border-radius:3px">　</span> `#b43f45` | <span style="background:#eb8180;border:1px solid #8886;border-radius:3px">　</span> `#eb8180` |
| アクセント(`--accent`) | <span style="background:#cb5457;border:1px solid #8886;border-radius:3px">　</span> `#cb5457` | <span style="background:#eb8180;border:1px solid #8886;border-radius:3px">　</span> `#eb8180` |

## ダークモードを固定する

既定では、OSの設定に合わせてライトとダークが切り替わります。`--swifty-color-mode` で固定できます。

```css
:root { --swifty-color-mode: light; }
```

| 値 | 表示 |
| ---- | ---- |
| 書かない | OSの設定に合わせる |
| `light` | 常にライト |
| `dark` | 常にダーク |

ダークモードの切り替えボタン(`customize-dark-mode.html`)を入れているときは、読者が選んだモードがこの指定より優先します。読者が「自動」を選ぶと、この指定に戻ります。

記事中で文字に色を付けていたり、透明な背景に黒い線で描いた画像を使っていたりすると、ダークモードで見えにくくなることがあります。気になる場合は `light` に固定してください。

## 色を変える

### 色を上書きする

配色の色はCSS変数で持っています。`body` に書くと上書きできます。

```css
body {
  --link: #1a5fc8;
  --link-hover: #154c9e;
}
```

`:root` に書くと、配色を切り替えたときに配色の色が優先されて効きません。色は `body` に書いてください。

文字の色を変えるときは、カード(`--surface`)とページの背景(`--background`)の両方に対して、4.5:1以上のコントラストがある色を選んでください。

### ダークモードの色も変える

`body` に書いた色は、ダークモードでも使われます。暗い背景で読みにくい色を書いたときは、ダークモード用の色も書きます。次の条件で囲むと、テーマがダークで表示するときだけ効きます。

```css
/* ライトの色 */
body {
  --link: #1a5fc8;
  --link-hover: #154c9e;
}

/* ダークの色 */
@container style(--swifty-color-mode: dark) or (style(--swifty-os-color-mode: dark) and (not style(--swifty-color-mode: light))) {
  body {
    --link: #8ab4f8;
    --link-hover: #c4dafc;
  }
}
```

条件は「常にダーク」か「OSがダークで、常にライトではない」です。読者が切り替えボタンで選んだモードにも従います。常にライトに固定しているなら、ダークの色は要りません。

### 色のCSS変数

値は既定の配色(`mint`)のライトの色です。

```css
body {
  /* 背景 */
  --background: #f2f6f5;        /* ページの背景 */
  --surface: #ffffff;           /* 記事・記事の一覧・ブログパーツのカード */
  --surface-header: #ffffff;    /* ブログのヘッダー */
  --surface-muted: #f4f8f7;     /* コードブロック・表の見出し・引用の背景 */

  /* 文字 */
  --text-body: #2b3836;         /* 本文 */
  --text-header: #172321;       /* タイトル・見出し */
  --text-light: #5b6b67;        /* 日付などの補助の文字 */

  /* リンク */
  --link: #0b7268;
  --link-hover: #075a52;

  /* アクセント */
  --accent: #3cc4b0;            /* 見出しの縦棒などの飾り */
  --accent-strong: #1fa593;     /* 目次のいま読んでいる見出し・フォーカスの枠 */
  --accent-line: #92dccf;       /* 中見出しの破線 */
  --accent-soft: #e9f8f5;       /* 大見出しの帯・インラインコード・カテゴリのラベルの背景 */
  --accent-soft-hover: #d2f1eb; /* カテゴリのラベルのホバー */

  /* 線と影 */
  --border: #e1ebe8;            /* カードの枠・区切りの線 */
  --border-strong: #c9d8d4;     /* ボタンの枠・記事の下の操作の下線 */
  --border-quote: #7e8e8a;      /* 引用の左の線 */
  --shadow: rgba(23, 35, 33, 0.06); /* カードの影 */

  /* コードハイライト */
  --code-text: #24312f;         /* 識別子・演算子など */
  --code-keyword: #7b3fb3;      /* 制御構文・宣言のキーワード */
  --code-preproc: #4a4fbf;      /* import・デコレーター */
  --code-type: #0a7350;         /* 型・修飾子・CSSのプロパティ */
  --code-function: #0e6e95;     /* 関数名・クラス名・CSSのセレクタ */
  --code-constant: #9a5b00;     /* 文字列・数値 */
  --code-special: #b2316b;      /* エスケープ・文字列の埋め込み */
  --code-comment: #5f6e68;      /* コメント */
  --code-diff-added: #0a7350;   /* diffの追加の行 */
  --code-diff-added-bg: #e3f5ea;
  --code-diff-removed: #b42318; /* diffの削除の行 */
  --code-diff-removed-bg: #fcebeb;

  /* アラート記法 */
  --alert-note: #0969da;
  --alert-tip: #1a7f37;
  --alert-important: #8250df;
  --alert-warning: #9a6700;
  --alert-caution: #d1242f;
}
```

### ページの背景を変える

ページの背景は、はてなの「デザイン」→「カスタマイズ」→「背景」でも変えられます。この設定はダークモードでは使われないので、ダークで文字が読めなくなる心配がありません。

デザインCSSで変えるときは、ダークモードの色も書いてください。

```css
body {
  --background: #ffffff;
}

@container style(--swifty-color-mode: dark) or (style(--swifty-os-color-mode: dark) and (not style(--swifty-color-mode: light))) {
  body {
    --background: #0e1614; /* 既定の配色のダークの背景 */
  }
}
```

## 見出しの文言を変える

目次や記事の下の段の見出しは、CSS変数で変えられます。文言は `"` で囲みます。

```css
:root {
  --toc-label: "Contents";
  --share-label: "Share";
  --comment-label: "Comments";
  --pager-prev-label: "Previous";
  --pager-next-label: "Next";
}
```

| CSS変数 | 既定 | 場所 |
| ---- | ---- | ---- |
| `--toc-label` | 目次 | 目次の見出し |
| `--share-label` | この記事を共有 | 記事の下の共有ボタンの段 |
| `--comment-label` | コメント | コメント欄 |
| `--pager-prev-label` | 前の記事 | 前後の記事 |
| `--pager-next-label` | 次の記事 | 前後の記事 |

## 本文の幅と角丸を変える

| CSS変数 | 既定 | 内容 |
| ---- | ---- | ---- |
| `--content-max` | `824px` | 本文の最大幅(全角で1行に50文字) |
| `--toc-width` | `220px` | 本文の横の目次の幅 |
| `--toc-gap` | `40px` | 本文と目次の間隔 |
| `--radius` | `16px` | カードと、本文中の箱(コードブロック・アラート・引用・折りたたみ)の角丸 |
| `--radius-small` | `8px` | 画像とサムネイルの角丸 |

本文を狭くすると、1行が短くなります。720pxで1行に約44文字です。

```css
:root { --content-max: 720px; }
```

角丸を小さくすると、かっちりした印象になります。

```css
:root {
  --radius: 4px;
  --radius-small: 4px;
}
```

本文を824pxより広げると、1行が長くなって行を追いにくくなります。広げるときは、少しずつ試してください。

## 記事ページでパンくずリストを表示する

既定では、記事ページのパンくずリストを隠し、カテゴリをタイトルの上に表示します。次のように書くと、パンくずリストをタイトルの上に表示し、カテゴリは日付の横に戻します。

```css
:root { --swifty-entry-breadcrumb: show; }
```

はてなの設定でパンくずリストを表示していない場合は、この指定をしても表示されません。

はてなの設定でパンくずリストを表示していれば、テーマが表示を隠していても、検索エンジン向けのパンくずリストの情報は出力されます。検索結果にパンくずリストを出したいときは、はてなの設定は表示のままにしてください。

## フォントを変える

フォントはCSS変数にしていないので、要素に直接指定します。

```css
/* 本文・タイトル・見出し */
html, body {
  font-family: "BIZ UDPGothic", sans-serif;
}

/* コードブロックとインラインコード */
.entry-content pre.code,
.entry-content code {
  font-family: "BIZ UDGothic", monospace;
}
```

日付・カテゴリ・パンくずリストは、数字の桁が揃うよう、等幅の英数字を含むフォントを別に指定しています。

## うまく反映されないとき

- **色が変わらない**: 配色を切り替えているときは、色を `:root` ではなく `body` に書いてください。
- **ダークモードで文字が読めない**: `body` に書いた色はダークモードでも使われます。「ダークモードの色も変える」の条件で、ダークの色も書いてください。
- **配色やダークモードが切り替わらない**: スタイルクエリに対応していないブラウザでは、既定の配色(ライト)で表示します。対応しているブラウザ(「カスタマイズの基本」を参照)で確かめてください。

---

*Swiftyへのフィードバックや質問は、[GitHub Issues](https://github.com/guitarrapc/hatenablog-theme-swifty/issues)にお寄せください。*
