---
title: "Fixture: 表と折りたたみ"
---

<!-- https://guitarrapc-theme.hatenablog.com/entry/2026/10/08/224728 -->

表と、`<details>` による折りたたみを並べた確認用の記事です。

[:contents]

## 表

### 基本の表

| 名前 | 色 | 個数 |
| ---- | ---- | ---- |
| りんご | 赤 | 1 |
| みかん | だいだい | 2 |
| ぶどう | むらさき | 12 |

### 揃えを指定した表

| 左揃え | 中央揃え | 右揃え |
| :---- | :----: | ----: |
| 本文の最大幅 | content-max | 824px |
| 目次の幅 | toc-width | 220px |
| 目次との間隔 | toc-gap | 40px |

### 列の多い表

スマートフォンの狭い画面で、表が本文の幅を超えたときに、ページ全体ではなく表だけが横にスクロールするかを確かめます。

| 機能 | Chrome | Edge | Firefox | Safari | iOS Safari | Android Chrome | Samsung Internet | Opera | 備考 |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| `:has()` | 105 | 105 | 121 | 15.4 | 15.4 | 105 | 20 | 91 | 見出しの割り当て |
| `content-visibility` | 85 | 85 | 125 | 18 | 18 | 85 | 14 | 71 | 描画の後回し |
| `@layer` | 99 | 99 | 97 | 15.4 | 15.4 | 99 | 18 | 85 | 背景色の既定値 |

### 長い文章を含む表

| 項目 | 説明 |
| ---- | ---- |
| 本文の幅 | 本文の幅は824pxを上限にします。全角の文字で1行に50文字です。これより広げると、日本語では1行が長すぎて行の頭を追いにくくなります。 |
| 目次 | 1200px以上の画面では本文の横に常に表示し、それより狭い画面では書かれた位置にそのまま表示します。 |

### 装飾を含む表

| 種類 | 例 |
| ---- | ---- |
| インラインコード | `npm run build` |
| リンク | [Swifty](https://github.com/guitarrapc/hatenablog-theme-swifty) |
| 太字 | **太字** |
| 改行 | 1行目<br>2行目 |

### 空のセルを含む表

| 名前 | 値 | 備考 |
| ---- | ---- | ---- |
| 1行目 | | 値が空 |
| 2行目 | 2 | |
| | | |

### HTMLで書いた表

見出しのセル(`th`)が行の頭にもある表、セルの結合、表の題名(`caption`)、表の足(`tfoot`)を含む表です。

<table>
<caption>画面幅ごとの余白と目次の位置</caption>
<thead>
<tr><th scope="col">画面幅</th><th scope="col">カードの外側</th><th scope="col">カードの内側</th><th scope="col">目次</th></tr>
</thead>
<tbody>
<tr><th scope="row">767px以下</th><td>0</td><td>16px</td><td rowspan="2">本文中</td></tr>
<tr><th scope="row">768px以上</th><td>24px</td><td>40px</td></tr>
<tr><th scope="row">1200px以上</th><td>24px</td><td>40px</td><td>本文の横</td></tr>
</tbody>
<tfoot>
<tr><td colspan="4">値はCSS変数で、デザインCSSから変えられます。</td></tr>
</tfoot>
</table>

## 折りたたみ

### 閉じた折りたたみ

<details><summary>クリックすると開きます</summary>

折りたたみの中の1つ目の段落です。

折りたたみの中の2つ目の段落です。本文の幅で折り返したときの行の高さと、折りたたみの内側の余白を確かめるため、長めに書いています。

</details>

### 開いた折りたたみ

<details open><summary>最初から開いている折りたたみ</summary>

`open` 属性を付けた折りたたみです。

</details>

### リストと表を含む折りたたみ

<details><summary>リストと表を含む折りたたみ</summary>

- 1つ目の項目
- 2つ目の項目

| 名前 | 値 |
| ---- | ---- |
| 幅 | 824px |

</details>

### 入れ子の折りたたみ

<details><summary>外側の折りたたみ</summary>

外側の折りたたみの中身です。

<details><summary>内側の折りたたみ</summary>

内側の折りたたみの中身です。

</details>

</details>

### 長い見出しの折りたたみ

<details><summary>折りたたみの見出し(summary)が長く、本文の幅で折り返したときに、開閉の印と文字の頭が揃うかを確かめるための見出しです</summary>

中身です。

</details>

### 装飾を含む見出しの折りたたみ

<details><summary><code>npm run test</code> の<strong>結果</strong>を見る</summary>

中身です。

</details>

### 続けて置いた折りたたみ

<details><summary>1つ目</summary>

1つ目の中身です。

</details>

<details><summary>2つ目</summary>

2つ目の中身です。

</details>

<details><summary>3つ目</summary>

3つ目の中身です。

</details>
