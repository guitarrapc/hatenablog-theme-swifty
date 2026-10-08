---
title: "Fixture: コードブロック"
---

<!-- https://guitarrapc-theme.hatenablog.com/entry/2026/10/08/224556 -->

コードブロックを、言語ごとのハイライト、長さや形、言語名の有無、ほかの要素の中に置いた場合に分けて並べた確認用の記事です。文中のインラインコードは「Fixture: 文字と段落」で確かめます。

[:contents]

## 言語ごとのハイライト

はてなのコードブロックのハイライトは、Vimの構文の分類をクラス(`synXxx`)にしたものです。言語ごとに、どの語にどのクラスが付くかを確かめます。

### diff

追加した行と削除した行に、どのクラスが付くかを確かめます。

```diff
diff --git a/scss/lib/_variable.scss b/scss/lib/_variable.scss
index 1c32d88..f7e86d0 100644
--- a/scss/lib/_variable.scss
+++ b/scss/lib/_variable.scss
@@ -9,7 +9,7 @@ $mq-lg: "(min-width: 1200px)"; // 広いPC。目次を本文の横に出す
 // レイアウト (theme-design-spec.md の「レイアウト」を参照)
 // :root にCSS変数として出力するので、デザインCSSから上書きできる
 $layout: (
-    "content-max": 820px, // 本文の最大幅(1行に約51文字)。目次の有無に関わらず揃える
+    "content-max": 824px, // 本文の最大幅(全角で1行に50文字)。目次の有無に関わらず揃える
     "toc-width": 220px, // 本文の横に置く目次の幅
     "toc-gap": 40px, // 本文と目次の間隔
     "toc-rail-width": 40px, // 本文の横の目次を閉じたときの帯の幅(js/toc-toggle.js)
```

### シェル(sh)

```sh
#!/usr/bin/env bash
set -euo pipefail

# TODO: 開発用ブログのドメインを引数で受け取る
BLOG_HOST="${BLOG_HOST:-guitarrapc-theme.hatenablog.com}"

for spec in tests/*.spec.js; do
  printf "run: %s on %s\n" "$spec" "$BLOG_HOST"
  npx playwright test "$spec" --reporter=line || exit 1
done
```

### PowerShell(ps1)

```ps1
# 開発サーバーが起動しているかを確かめる
$url = "http://localhost:5173/scss/style.scss"
try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
    Write-Host "OK: $($response.StatusCode)"
}
catch {
    Write-Error "開発サーバーに接続できません: $url"
    exit 1
}
```

### JavaScript

```javascript
// FIXME: 閉じた状態を記憶できない環境では毎回開く
const STORAGE_KEY = 'swifty-toc-collapsed';

export function restore(panel) {
  try {
    panel.open = localStorage.getItem(STORAGE_KEY) !== 'true';
  } catch {
    panel.open = true;
  }
  panel.addEventListener('toggle', () => {
    console.log(`toc: ${panel.open ? 'open' : 'closed'}\n`);
  });
}
```

### TypeScript

```typescript
type AlertType = 'note' | 'tip' | 'important' | 'warning' | 'caution';

interface Alert {
  readonly type: AlertType;
  title: string;
  body?: HTMLElement[];
}

const MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*$/i;

export function parseMarker(text: string): AlertType | null {
  const match = MARKER.exec(text);
  return match ? (match[1].toLowerCase() as AlertType) : null;
}
```

### JSON

```json
{
  "name": "hatenablog-theme-swifty",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "test": "playwright test"
  },
  "engines": {
    "node": ">=22.12"
  },
  "files": ["build/", "customize-*.html"],
  "description": null
}
```

### YAML

```yaml
name: Build
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      # ビルドしたCSSの先頭に Responsive: yes があることを確かめる
      - run: npm ci
      - run: npm run build
      - run: head -n 5 build/style.css | grep -q "Responsive: yes"
```

### HTML

`<` `>` `&` などHTMLで特別な意味を持つ文字が、そのまま表示されるかも確かめます。

```html
<!-- 「ブログタイトル下」に貼り付ける -->
<script type="module">
  document.documentElement.classList.add("has-js");
</script>
<div class="entry-content">
  <p>本文 &amp; <a href="https://example.com/?a=1&b=2">リンク</a></p>
  <pre class="code lang-sh" data-lang="sh" data-unlink>echo &quot;hello&quot;</pre>
</div>
```

### SQL

```sql
-- 月ごとの記事数
SELECT
    DATE_TRUNC('month', published_at) AS month,
    COUNT(*) AS entries
FROM entries
WHERE status = 'published'
  AND published_at >= '2025-01-01'
GROUP BY 1
ORDER BY month DESC
LIMIT 12;
```

### Rust

```rust
use std::collections::HashMap;

/// 見出しの段ごとの数を数える
fn count_headings(html: &str) -> HashMap<u8, usize> {
    let mut counts = HashMap::new();
    for level in 1..=6u8 {
        let tag = format!("<h{}", level);
        counts.insert(level, html.matches(&tag).count());
    }
    counts
}

fn main() {
    let counts = count_headings("<h2>a</h2><h3>b</h3>");
    println!("{:?}\n", counts);
}
```

### Dockerfile

```dockerfile
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
```

### C

```c
#include <stdio.h>

/* TODO: 回数を引数で受け取る */
int main(void)
{
    const char *message = "hello, world";
    for (int i = 0; i < 3; i++) {
        printf("%d: %s\n", i, message);
    }
    return 0;
}
```

## 構文の誤りの印(synError)

Vimが構文の誤りとして扱う箇所に `synError` が付くかを確かめます。閉じかっこが多いCと、末尾にカンマが残ったJSONです。

```c
int total = (1 + 2));
```

```json
{
  "name": "hatenablog-theme-swifty",
  "version": "1.0.0",
}
```

## 長さと形

### 長い行

折り返さずに横スクロールし、上の帯(言語名とボタン)がスクロールしても左右に残るかを確かめます。

```javascript
const BLOG_HOST = 'guitarrapc-theme.hatenablog.com';
const url = `https://${BLOG_HOST}/entry/2025/05/10/204601?utm_source=fixture&utm_medium=codeblock&utm_campaign=horizontal-scroll&utm_content=long-line`; // 横スクロールを確かめるための長い行
console.log(url);
```

### 区切りのない長い文字列

折り返しのボタン(Wrap)を押したときに、区切りのない文字列も折り返されるかを確かめます。

```css
.icon {
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggZD0iTTggMWE3IDcgMCAxIDAgMCAxNEE3IDcgMCAwIDAgOCAxem0wIDEyLjVhNS41IDUuNSAwIDEgMSAwLTExIDUuNSA1LjUgMCAwIDEgMCAxMXpNNy4yNSA0aDEuNXY1aC0xLjV6bTAgNmgxLjV2MS41aC0xLjV6Ii8+PC9zdmc+");
}
```

### タブで字下げしたコード

タブの幅を確かめます。Makefileの字下げはタブです。

```make
.PHONY: build test

build:
	npm run build

test: build
	npm run test
```

### 全角の文字を含むコード

全角の文字と半角の文字が混ざったときに、等幅のフォントで桁が揃うかを確かめます。

```python
# +----------+----------+
# | 項目     | 値       |
# +----------+----------+
# | 本文の幅 | 824px    |
# +----------+----------+
rows = [("本文の幅", "824px"), ("目次の幅", "220px")]
for label, value in rows:
    print(f"{label}: {value}")
```

### 1行だけのコード

```sh
npm start
```

### 空行を含むコード

先頭と途中に空行を含むコードです。

```python

import sys


def main():
    print("blank lines")


if __name__ == "__main__":
    sys.exit(main())
```

## 言語名

### 言語名を書かないコードブロック

```
npm install
npm start
```

### はてなが対応していない言語名

はてなが知らない言語名(`bash`、`js`)を書くと、クラスが `lang-` の付かない `code bash` になり、ハイライトもされません。上の帯に言語名が出るかを確かめます。

```bash
echo "bash"
```

```js
console.log("js");
```

### アスキーアート(aa)

はてな記法の `>|aa|` と同じく、等幅でないフォントで表示されるかを確かめます。

```aa
(´・ω・｀)
　 ＿＿＿＿
　|　　　　|
　|　箱　　|
　￣￣￣￣
```

## 入れ子のコードブロック

コードブロックのボタン(Copy・Wrap)は、本文の直下だけでなく、リストや引用の中のコードブロックにも付けます。

### リストの中

1. 依存するモジュールを入れます。

    ```sh
    npm install
    ```

1. 開発サーバーを起動します。

    ```sh
    npm start
    ```

### 引用の中

> 引用の中のコードブロックです。
>
> ```sh
> npm run build
> ```

### アラートの中

> [!TIP]
> アラートの中のコードブロックです。
>
> ```sh
> npm run lighthouse -- --runs=3
> ```

### 閉じた折りたたみの中

<details><summary>閉じた折りたたみの中のコードブロック</summary>

```javascript
const panel = document.querySelector('.toc-panel');
panel.open = !panel.open;
```

</details>

### 開いた折りたたみの中

<details open><summary>開いた折りたたみの中のコードブロック</summary>

```javascript
const panel = document.querySelector('.toc-panel');
panel.open = !panel.open;
```

</details>
