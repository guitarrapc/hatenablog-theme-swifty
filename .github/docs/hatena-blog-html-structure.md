# はてなブログのHTML構造

これははてなブログのHTMLの要素についての説明です。はてなブログのHTMLは、ページごとに以下のような構成になっています。

## 全体構造

* ページは大きく分けて、記事部分`<div id="wrapper">`、ブログフッター部分`<aside id="box">`の2つのブロックで構成されます。記事部分の下に、ブログフッター部分があります。
* 記事部分は、記事ページ、アーカイブページ、アバウトページで構造が異なります。それぞれは別セクションで説明します。

## ヘッダーメニューと「読者になる」

ページの先頭は、はてなのヘッダーメニュー、「読者になる」の帯、ブログ本体の順です。いずれも `body` の直下にあります。

```html
<body class="page-entry globalheader-ng-enabled">
  <div id="globalheader-container" data-brand="hatenablog">
    <iframe id="globalheader" ...></iframe>
  </div>
  <nav class="blog-controlls">
    <div class="blog-controlls-blog-icon"><a href="ブログURL"><img ...></a></div>
    <div class="blog-controlls-title"><a href="ブログURL">ブログ名</a></div>
    <a href="https://blog.hatena.ne.jp/{はてなID}/{ブログのドメイン}/subscribe?utm_source=blogs_topright_button&amp;utm_campaign=subscribe_blog&amp;utm_medium=button" class="blog-controlls-subscribe-btn">読者になる</a>
  </nav>
  <div id="container">
    <div id="container-inner">
      <header id="blog-title">...</header>
```

* ヘッダーメニュー(`#globalheader-container`)は別ドメインのiframeで、新しいヘッダーでは `body` に `globalheader-ng-enabled` が付きます(高さ56px。旧ヘッダーは37px)。
* 「読者になる」(`.blog-controlls`)はサーバーが出力します。ブラウザ以外のUser-Agent(curlなど)で取得したHTMLには入らないので、構造を確かめるときはブラウザのUser-Agentで取得します。
* はてなブログProの「ブログにヘッダを表示しない」では、次のようになります。
  * `body` に `globalheader-off` が付く
  * `#globalheader-container` は残り、`style="display: none"` で隠れる。iframeには `src` が付かない(公式ガイドの「要素が消える」とは違う)
  * `.blog-controlls` は出力されない。テーマがブログのヘッダーに置く「読者になる」はこれなので、ボタンがなくなる(theme-design-spec.md の「ヘッダー」で、同じHTMLをタイトル下に貼ってもらう)
* 「ブログタイトル下」のHTMLは、`#blog-title` の直後の `<div id="top-editarea">` にそのまま入ります(`body` に `enable-top-editarea` が付く)。
* はてなの「設定」→「詳細設定」→「読者になるボタン」のHTMLは `<iframe src="https://blog.hatena.ne.jp/{はてなID}/{ブログのドメイン}/subscribe/iframe" allowtransparency="true" frameborder="0" scrolling="no" width="150" height="28">` です。
  * 中はプロフィールのブログパーツと同じ「読者になる」(`.hatena-module > .hatena-follow-button-box`)で、`body` の背景は透明。ボタン(`.hatena-follow-button`)は文字10px、幅77px(アイコンと全角5文字)、高さ20pxで、上に7pxの余白(`.hatena-follow-button-box` の `margin: .7em 0`)がある。読者が1人以上いると右に読者数の箱が続く(`data-subscribers-count`)
  * 押すと購読ページ(`…/subscribe?from_url=…&utm_source=iframe_subscribe_button`)を新しいウィンドウで開く。中のスクリプトははてなの `bundle-globalheader.js` で、ハンドラは1つ。中の見た目はテーマから変えられないので、テーマでは使わない(theme-design-spec.md の「ヘッダー」)
* `body` の末尾(はてなのスクリプトの前)には、`<div id="hidden-subscribe-button" style="display: none;">` に、プロフィールのブログパーツと同じ「読者になる」(`.hatena-follow-button-box`)があります。ヘッダーメニューの設定によらず出力されます。はてなの `hatenablog.js` が、ヘッダーメニューのiframeからの購読のメッセージを受けて開くために使うもので、`.hatena-follow-button-box` すべてへの初期化と合わせて同じボタンにクリックのハンドラが2つ付きます。表示して直接押すと購読ページが2つ開くので、テーマからは使いません。

## ブログフッター部分

* ブログフッター部分は、ブログパーツを配置する`<div id="box2-inner">`があり、flexboxでブログパーツを配置します。flexboxは、横に最大3つ配置されます。ブログパーツはユーザーがカスタマイズ可能です。
* ブログパーツは、それぞれ`<div class="hatena-module hatena-module-XXXXX">`で構成されます。ブログパーツごとにXXXXはユーザーがカスタマイズ可能です。ブログテーマとしてはXXXXに入る文字は予想できず静的に決め打つ必要があります。テーマカスタマイズのため、XXXXはユーザーに提示する必要があります。
* ブログパーツの中身は、モジュールタイトル`<div class="hatena-module-title">`、モジュールの中身`<div class="hatena-module-body">`で構成されます。

### 主なブログパーツ

* 検索: `<div class="hatena-module hatena-module-search-box">`
* カテゴリー: `<div class="hatena-module hatena-module-category">`
* リンク: `<div class="hatena-module hatena-module-links">`
* 最新記事: `<div class="hatena-module hatena-module-recent-entries">`
* 月別アーカイブ: `<div class="hatena-module hatena-module-archive">`
* 関連記事: `<div class="hatena-module hatena-module-related-entries">`
* プロフィール: `<div class="hatena-module hatena-module-profile">`
* 注目記事: `<div class="hatena-module hatena-module-entries-access-ranking">`
* 最近のコメント: `<div class="hatena-module hatena-module-recent-comments">`
* 最近の参加グループ: `<div class="hatena-module hatena-module-circles">`
* 最近の執筆者リスト: `<div class="hatena-module hatena-module-authors-list">`

## 記事ページ

### 記事全体構造

記事全体(記事全体コンテンツ)は以下のように構成されます:

```html
<div id="main">
  <div id="main-inner">
    <article class="entry ...">記事の数分</article>
    <div class="pager pager-permalink permalink"></div>
  </div>
</div>
```

### 記事コンテンツ

記事全体コンテンツは、各記事(記事コンテンツ)が以下で構成されます:
* トップページ: `<article>`要素は複数存在
* 記事ページ: `<article>`要素は1つだけ存在

```html
<article class="entry ...">
  <div class="entry-inner">
    <!-- 記事ごとの構成要素 -->
  </div>
</article>
```

### 記事の構成要素

記事ごとの構成要素は、以下の3つのブロックで構成されます:

1. **記事ヘッダー** `<header class="entry-header">`
   * 記事タイトル: `<h1 class="entry-title">` (トップページでは`<div class="entry-title">`)
   * 作成日付: `<time class="date entry-date first">`
   * 更新日付: `<span class="date-last-updated">` (トップページでは省略される)
   * カテゴリ: `<div class="entry-categories categories">` (0-複数ありえる)
   * ソーシャルボタン: `<div class="social-buttons">` (はてなの設定でソーシャルボタンを記事の上にも出すときだけ。記事フッターのものと同じHTMLが、ヘッダーの最後に入る)

2. **記事本文** `<div class="entry-content hatenablog-entry">`
   * 記事本文は、このブロックに直接配置されます

3. **記事フッター** `<footer class="entry-footer">`
   * 描画されていないタグラッパー: `<div class="entry-tags-wrapper">`
   * 著者と記事日付: `<div class="entry-footer-selection">`
   * ソーシャルボタン: `<div class="social-buttons">`
   * カスタマイズフッター: `<div class="customized-footer">`
     * はてなブックマークコメント: `<iframe class="hatena-bookmark-comment-iframe">` (はてなの設定で表示するときだけ。カスタマイズフッターの先頭に入る)
   * コメント: `<div class="comment-box js-comment-box">`

### カスタマイズフッターのはてなブックマークコメント

はてなの設定で記事にはてなブックマークのコメントを表示すると(「デザイン」→「カスタマイズ」→「記事」の「ソーシャルパーツ」の「はてなブックマークコメント」)、カスタマイズフッターの先頭に iframe が出力されます(記事ページだけ。2026年10月に確認):

```html
<div class="customized-footer">
  <iframe class="hatena-bookmark-comment-iframe" data-src="https://ブログのドメイン/iframe/hatena_bookmark_comment?canonical_uri=記事のURL" frameborder="0" scrolling="no" style="border: none; width: 100%;">
  </iframe>
  <div class="entry-footer-modules" id="entry-footer-secondary-modules"><!-- 関連記事など --></div>
</div>
```

* iframe は `src` を持たず、はてなのスクリプト(`hatenablog.js`)がページの準備ができたときに、中を `data-src` のURL(ブログと同じドメイン)へ移します。
* 中のページは、はてなブックマークのスクリプト(`https://b.hatena.ne.jp/js/bookmark_blogparts.js` の `HBBlogParts`)がAPI(JSONP)の応答からコメントを描き、はてなのCSS(`https://b.st-hatena.com/css/blogparts/basic.css`)を足します。`HBBlogParts.useUserCSS` が `true` なら、はてなのCSSは足されません。
* 中のページは1秒ごとに `body` の高さを測ってページに伝え、ページ側が iframe の高さ(`style` 属性)を「中身 + 30px」にします。

中のHTML(はてなブックマークのスクリプトが描く):

```html
<div class="hatena-bookmark-container" id="hatena-bookmark-container">
  <div class="hatena-bookmark-title">
    <div class="hatena-bookmark-entry-navigator">
      <div class="hatena-bookmark-comment-header">
        <a href="はてなブックマークのこの記事のページ">はてなブックマークでのコメント </a>
        <span class="hatena-bookmark-users">(公開の数 + 非公開の数)</span>
      </div>
    </div>
  </div>
  <ul id="hatena-bookmark-list-container">
    <li class="hatena-bookmark-item hatena-bookmark-addcomment-container">
      <div class="hatena-bookmark-addcomment"><a href="ブックマークの追加ページ">はてなブックマークでコメントする</a></div>
    </li>
    <li class="hatena-bookmark-item" style="display: block;">
      <span class="hatena-bookmark-user-info">
        <img class="hatena-bookmark-profile-image" width="16" height="16" src="…/profile_s.gif">
        <a class="hatena-bookmark-username" href="このブックマークのページ">はてなID</a>
      </span>
      <span class="hatena-bookmark-tags"><a class="hatena-bookmark-user-tag" href="…">タグ</a></span>
      <span class="hatena-bookmark-comment">コメント</span>
      <span class="hatena-bookmark-timestamp">2026/10/10</span>
      <span class="hatena-bookmark-star"><img src="スターの数の画像" style="height: 10px;"></span>
    </li>
  </ul>
  <div class="hatena-bookmark-footer">
    <div class="hatena-bookmark-showall-comment"><span class="hatena-bookmark-span-button">すべてのコメントを表示する</span></div>
    <div class="hatena-bookmark-entrypage-link"><a class="hatena-bookmark-comment-show" href="…" style="display: inline;">はてなブックマークで確認</a></div>
  </div>
</div>
```

* コメントのあるブックマークを3件まで表示し、残りは `style="display: none;"` と `hatena-bookmark-overlimit` を付けて出力します。表示していない項目は、表示するまで中身が空です。
* コメントのないブックマークには `nocomment` が付き、`hatena-bookmark-comment` は空です。
* 「すべてのコメントを表示する」は、項目が上限より多いときだけ表示されます(少なければ `hatena-bookmark-showall-comment` に `display: none`)。押すと文言が「元に戻す」になり、`span` に `hatena-bookmark-hide-overlimit` が付きます。
* ブックマークがないときは、見出しのリンクが「はてなブックマークでのコメント」だけになり、リストは操作と `<li class="hatena-bookmark-item">まだこの記事のブックマークはありません。</li>`、`hatena-bookmark-footer` は空です。

### カスタマイズフッターの関連記事

記事詳細では関連記事が表示されます(トップページでは描画されない):

```html
<div class="hatena-module hatena-module-related-entries">
  <div class="hatena-module-title">関連記事のタイトル</div>
  <div class="hatena-module-body">
    <ul class="related-entries hatena-urllist urllist-with-thumbnails">
      <!-- 関連記事のliが並ぶ -->
    </ul>
  </div>
</div>
```

各関連記事: `<li class="urllist-item related-entries-item">`
* サムネイル: `<a class="urllist-image-link related-entries-image-link"><img class="urllist-image related-entries-image"></a>`
* タイトル: `<a class="urllist-title-link related-entries-title-link urllist-title related-entries-title">`
* 日付: `<div class="urllist-date-link related-entries-date-link">`
* 記事冒頭部: `<div class="urllist-entry-body related-entries-entry-body">`

### コメント

```html
<div class="comment-box js-comment-box">
  <ul class="comment js-comment">
    <li class="entry-comment js-entry-comment">
      <!-- コメント内容 -->
    </li>
  </ul>
  <a class="leave-comment-title js-leave-comment-title">コメントボタン</a>
</div>
```

コメントがない場合も `<ul class="comment">` は出力され、中には「もっと読む」(`<li class="read-more-comments">`)だけが入ります。

各コメント(`<li class="entry-comment js-entry-comment">`)の構成:
* ユーザー名: `<p class="comment-user-name">`
* コメント本文: `<p class="comment-content">`
* 投稿日付: `<p class="comment-metadata">`
* コメント削除ボタン: `<a class="comment-delete-button js-comment-delete-button">` (管理者のみ)

### ページャー

記事コンテンツの下に配置されます:

```html
<div class="pager pager-permalink permalink">
  <span class="pager-prev"><a rel="prev"><span class="pager-arrow">« </span>前の記事のタイトル</a></span>
  <span class="pager-next"><a rel="next">次の記事のタイトル<span class="pager-arrow"> »</span></a></span>
</div>
```

* 前の記事がなければ`<span class="pager-prev">`は描画されません
* 次の記事がなければ`<span class="pager-next">`は描画されません

## アーカイブページ

### アーカイブ全体構造

```html
<div id="main">
  <div id="main-inner">
    <div class="archive-entries">
      <section class="archive-entry">...</section>
      <!-- アーカイブ記事分のsection要素 -->
    </div>
  </div>
</div>
```

### アーカイブ記事の構成要素

```html
<section class="archive-entry">
  <div class="archive-entry-header">
    <div class="date archive-date">作成日付</div>
    <h1 class="entry-title">記事タイトル</h1>
  </div>
  <div class="categories">
    <a class="archive-category-link">カテゴリー</a>
    <!-- 0-複数ありえる -->
  </div>
  <a class="entry-thumb-link">サムネイル</a>
  <div class="archive-entry-body">
    <p class="entry-description">記事冒頭部分</p>
    <div class="archive-entry-tags-wrapper">タグラッパー</div>
    <span class="social-buttons">ソーシャルボタン</span>
  </div>
</section>
```

## アバウトページ

### アバウト全体構造

```html
<div id="main">
  <div id="main-inner">
    <article class="entry">
      <div class="entry-inner">
        <div class="entry-content">
          <!-- ユーザーが自由に記述したHTML -->
          <dl>
            <dt>プロフィール</dt>
            <dd>
              <a href="プロフィールリンク">
                <img>サムネイル画像
                <span>ユーザー名</span>
              </a>
              <a href="プロリンク">
                <i class="badge-type-pro">はてなブログPro</i>
              </a>
            </dd>
            <dt>ブログ投稿数</dt>
            <dd>n 記事</dd>
            <dt>ブログ投稿日数</dt>
            <dd>n 日</dd>
          </dl>
        </div>
      </div>
    </article>
  </div>
</div>
```

Note: 記事本文は、ユーザーが自由に記述できるため、HTMLの構造は決まっていません。ユーザーが自由に記述したHTMLがそのまま表示されます。
