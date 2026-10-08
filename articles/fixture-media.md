---
title: "Fixture: 画像と埋め込み"
---

<!-- https://guitarrapc-theme.hatenablog.com/entry/2026/10/08/224708 -->

はてなフォトライフの画像、ブログカードなどの埋め込み、数式を並べた確認用の記事です。

[:contents]

## 画像

### 横長の画像

本文の幅より大きい画像(1200×800)は、本文の幅に縮めて表示します。

[f:id:guitarrapc_tech:20250518211811p:plain:alt=流氷の上を歩く3羽のペンギン]

### リンク付きの画像

`:image` で貼ると、画像がフォトライフへのリンクになります。リンクの下線が画像の下に出ないかを確かめます。

[f:id:guitarrapc_tech:20250518221306p:image:alt=水中から見上げた、光の差し込む海面]

### キャプション付きの画像

<figure class="figure-image figure-image-fotolife" title="水中から見上げた海面">[f:id:guitarrapc_tech:20250518221306p:plain:alt=水中から見上げた、光の差し込む海面]<figcaption>水中から見上げた海面</figcaption></figure>

### 幅を指定した画像

`:w300` で幅を300pxにした画像です。

[f:id:guitarrapc_tech:20250518211811p:plain:w300:alt=流氷の上を歩く3羽のペンギン]

### 小さい画像

本文の幅より小さい画像(319×242)は、そのままの大きさで表示します。

[f:id:guitarrapc_tech:20260104185429p:plain:alt=はてなブログのデザイン設定で、スマートフォンのレスポンシブデザインを有効にする画面]

### 文中の小さい画像

段落の中に [f:id:guitarrapc_tech:20260212181947p:plain:alt=カテゴリのラベル] のような小さい画像(54×30)を置きます。行の高さが崩れないかを確かめます。

### 細長い画像

横に細長い画像(850×30)です。角丸で端が欠けすぎないかを確かめます。

[f:id:guitarrapc_tech:20260212181926p:plain:alt=記事タイトルの下に並んだカテゴリのラベル]

### 縦長の画像

縦に長い画像(430×932)です。

[f:id:guitarrapc_tech:20260212181309p:plain:alt=スマートフォンで表示した記事の一覧]

### 正方形の画像

[f:id:guitarrapc_tech:20260212181054p:plain:alt=いま読んでいる見出しを示した目次]

### 続けて置いた画像

1つの段落に2枚の画像を続けて置きます。

[f:id:guitarrapc_tech:20260104185429p:plain:alt=はてなブログのデザイン設定で、スマートフォンのレスポンシブデザインを有効にする画面][f:id:guitarrapc_tech:20260212180721p:plain:alt=サイドバーのタグクラウド]

段落を分けて2枚の画像を置きます。

[f:id:guitarrapc_tech:20250518211811p:plain:alt=流氷の上を歩く3羽のペンギン]

[f:id:guitarrapc_tech:20250518221306p:plain:alt=水中から見上げた、光の差し込む海面]

## 埋め込み

### ブログカード(同じブログの記事)

[https://guitarrapc-theme.hatenablog.com/entry/2025/05/10/204601:embed:cite]

### ブログカード(ほかのサイト)

[https://github.com/hatena/Hatena-Blog-Theme-Boilerplate:embed:cite]

### 出典を付けないブログカード

[https://github.com/guitarrapc/hatenablog-theme-codefocus:embed]

### ブログカードが続く

[https://guitarrapc-theme.hatenablog.com/entry/2025/05/12/131258:embed:cite]

[https://guitarrapc-theme.hatenablog.com/entry/2025/05/15/015031:embed:cite]

## 数式

### 文中の数式

オイラーの等式 [tex:e^{i\pi} + 1 = 0] を文中に置きます。

### 長い数式

スマートフォンの狭い画面で、本文の幅を超えないかを確かめます。

[tex:\displaystyle f(x) = a\_0 + \sum\_{n=1}^{\infty} \left( a\_n \cos \frac{n \pi x}{L} + b\_n \sin \frac{n \pi x}{L} \right) + \int\_{0}^{L} g(t) dt]
