// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, FIXTURE_URLS, SELECTORS, VIEWPORTS } from './constants.js';

test.describe('記事ページのテスト', () => {
  test('記事ページが正しくレンダリングされる', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });

    await page.screenshot({ path: 'screenshots/article-page.png', fullPage: true });

    // 基本的な記事要素が存在することを確認
    await expect(page.locator(SELECTORS.ENTRY_TITLE)).toBeVisible();
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();
    await expect(page.locator(SELECTORS.ENTRY_DATE)).toBeVisible();
  });

  test('本文中の箱の角丸は記事のカードと揃え、画像は小さくする', async ({ page }) => {
    // カードに角丸がある幅で測る(目次は本文中でも箱にしないので含めない)
    await page.setViewportSize(VIEWPORTS.BELOW_SIDE_TOC);
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();

    const radii = await page.evaluate(() => {
      const radius = (/** @type {string} */ selector, corner = 'borderTopRightRadius') => {
        const el = document.querySelector(selector);
        return el ? /** @type {any} */ (getComputedStyle(el))[corner] : null;
      };
      return {
        // 記事ページでは記事のカードの上にパンくず、下に前後の記事をつなげて角を丸めないので、同じカードのブログパーツで測る
        card: radius('#box2-inner'),
        boxes: {
          コードブロック: radius('.entry-content pre.code'),
          アラート: radius('.entry-content .markdown-alert'),
          // 引用は左に線があるので右の角だけ丸める
          引用: radius('.entry-content > blockquote:not(.markdown-alert)'),
          // 目次(js/toc-toggle.js が包む details.toc-panel)は箱にしないので除く
          折りたたみ: radius('.entry-content details:not(.toc-panel)'),
        },
        quoteLeft: radius('.entry-content > blockquote:not(.markdown-alert)', 'borderTopLeftRadius'),
        image: radius('.entry-content img.hatena-fotolife'),
      };
    });

    expect(radii.card, '前提: カードに角丸があること').not.toBe('0px');
    for (const [name, value] of Object.entries(radii.boxes)) {
      expect(value, `${name}が見つからない`).not.toBeNull();
      expect(value, `${name}の角丸`).toBe(radii.card);
    }
    expect(radii.quoteLeft).toBe('0px');
    // 画像は角丸を大きくすると画像の隅が欠けるので、カードより小さくする
    expect(parseFloat(radii.image ?? '0')).toBeLessThan(parseFloat(radii.card));
  });

  test('表のセルは単語の途中で縮めず、収まらない表は表の中で横にスクロールする', async ({ page }) => {
    // 列の多い表が収まらない、スマートフォンの幅で測る
    await page.setViewportSize(VIEWPORTS.MOBILE);
    await page.navigateTo(FIXTURE_URLS.TABLES_DETAILS, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();
    await page.addStyleTag({ content: '.entry-content > * { content-visibility: visible !important; }' });

    const result = await page.evaluate(() => {
      const tables = [...document.querySelectorAll('.entry-content > table')];
      /** 文字列が描かれた行の数 */
      const lines = (/** @type {Element} */ el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
      };
      const cells = tables.flatMap((table) => [...table.querySelectorAll('th, td')]);
      return {
        overflowing: tables.filter((t) => t.scrollWidth > t.clientWidth).length,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        // 区切りのない英単語・数字だけのセル(Chrome、105など)
        words: cells.filter((c) => /^[A-Za-z0-9.]+$/.test(c.textContent?.trim() ?? '')).map((c) => ({ text: c.textContent?.trim(), lines: lines(c) })),
        // 日本語を含むセル
        japanese: cells.filter((c) => /[぀-ヿ一-鿿]/.test(c.textContent ?? '')).map((c) => ({
          text: c.textContent?.trim().slice(0, 10),
          width: c.getBoundingClientRect().width,
          fontSize: parseFloat(getComputedStyle(c).fontSize),
        })),
      };
    });

    expect(result.overflowing, '前提: 画面に収まらない表があること').toBeGreaterThan(0);
    expect(result.pageOverflow).toBeLessThanOrEqual(0);
    expect(result.words.length, '前提: 英単語や数字だけのセルがあること').toBeGreaterThan(0);
    for (const w of result.words) {
      expect(w.lines, `「${w.text}」が1行に収まる`).toBe(1);
    }
    for (const j of result.japanese) {
      expect(j.width, `「${j.text}」の列の幅`).toBeGreaterThanOrEqual(j.fontSize * 5 - 1);
    }
  });

  test('記事ページでは、パンくずを記事のカードの上端に入れ、タイトルの上に置く', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();

    const layout = await page.evaluate(() => {
      const rect = (/** @type {string} */ selector) => /** @type {Element} */ (document.querySelector(selector)).getBoundingClientRect().toJSON();
      const visible = (/** @type {string} */ selector) => [...document.querySelectorAll(selector)].filter((el) => el.checkVisibility()).map((el) => el.textContent?.trim());
      const breadcrumb = /** @type {Element} */ (document.querySelector('.breadcrumb'));
      const entry = /** @type {Element} */ (document.querySelector('.entry'));
      return {
        breadcrumb: rect('.breadcrumb'),
        entry: rect('.entry'),
        title: rect('.entry-title'),
        date: rect('.entry-header .date'),
        categories: rect('.entry-categories'),
        // パンくずと記事が1枚のカードに見えること: 同じ背景で、間の枠と角丸がない
        background: [getComputedStyle(breadcrumb).backgroundColor, getComputedStyle(entry).backgroundColor],
        seam: [getComputedStyle(breadcrumb).borderBottomWidth, getComputedStyle(entry).borderTopWidth, getComputedStyle(entry).borderTopLeftRadius],
        items: [...visible('.breadcrumb a'), ...visible('.breadcrumb-child > span')],
      };
    });

    // パンくずは記事のカードと同じ幅で、すぐ上につながる(継ぎ目のにじみを隠すため1px重ねる)
    expect(layout.breadcrumb.left).toBeCloseTo(layout.entry.left, 0);
    expect(layout.breadcrumb.width).toBeCloseTo(layout.entry.width, 0);
    expect(Math.abs(layout.breadcrumb.bottom - layout.entry.top)).toBeLessThanOrEqual(1);
    expect(layout.background[0]).toBe(layout.background[1]);
    expect(layout.seam).toEqual(['0px', '0px', '0px']);
    // タイトルの上にパンくず、タイトルの下に日付とカテゴリを1行に並べる
    expect(layout.title.top).toBeGreaterThan(layout.breadcrumb.top);
    expect(layout.date.top).toBeGreaterThan(layout.title.bottom - 1);
    expect(Math.abs((layout.date.top + layout.date.bottom) / 2 - (layout.categories.top + layout.categories.bottom) / 2)).toBeLessThanOrEqual(2);
    expect(layout.categories.left).toBeGreaterThan(layout.date.right);
    // パンくずの最後(記事のタイトル)は、すぐ下にタイトルがあるので出さない
    expect(layout.items).toEqual(['トップ', 'test']);
  });

  test('アバウトページが正しくレンダリングされる', async ({ page }) => {
    await page.navigateTo(TEST_URLS.ABOUT, { waitFor: 'networkidle' });

    await page.screenshot({ path: 'screenshots/about-page.png', fullPage: true });

    await expect(page.locator('.page-about')).toBeVisible();
    await expect(page.locator(SELECTORS.ENTRY_CONTENT)).toBeVisible();
  });
});

test.describe('記事の日付とパンくず', () => {
  /** 日付とパンくずの書体・大きさ・字間 */
  const metaText = (/** @type {any} */ page, /** @type {string[]} */ selectors) => page.evaluate((/** @type {string[]} */ selectors) => selectors.map((selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const style = getComputedStyle(el);
    return { selector, family: style.fontFamily, size: style.fontSize, spacing: style.letterSpacing };
  }), selectors);

  test('日付とパンくずは、英数字を等幅にした同じ書体で、本文より小さく字間を空ける', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    const entry = await metaText(page, ['.entry-header .date', '.breadcrumb']);
    await page.navigateTo('/archive/category/test', { waitFor: 'networkidle' });
    const archive = await metaText(page, ['.archive-date', '.breadcrumb']);

    const all = [...entry, ...archive];
    for (const [i, m] of all.entries()) expect(m, `${i}番目の要素が見つからない`).not.toBeNull();
    const [first, ...rest] = /** @type {{ selector: string, family: string, size: string, spacing: string }[]} */ (all);
    // 英数字は等幅(Windowsでは Consolas)、日本語は本文と同じ書体(コードの BIZ UDGothic ではない)
    expect(first.family).toContain('Consolas');
    expect(first.family).toContain('Noto Sans JP');
    expect(first.family).not.toContain('BIZ UDGothic');
    expect(first.size).toBe('12px');
    expect(parseFloat(first.spacing)).toBeGreaterThan(0);
    for (const m of rest) {
      expect({ family: m.family, size: m.size, spacing: m.spacing }, m.selector).toEqual({ family: first.family, size: first.size, spacing: first.spacing });
    }
  });

  test('記事のヘッダーのカテゴリは、記事の一覧と同じ小さな文字にし、区切りは読み上げない', async ({ page }) => {
    const categoryStyle = (/** @type {string} */ selector) => page.locator(selector).first().evaluate((el) => {
      const s = getComputedStyle(el);
      const separator = getComputedStyle(el, '::after');
      return { family: s.fontFamily, size: s.fontSize, color: s.color, background: s.backgroundColor, radius: s.borderTopLeftRadius, separator: separator.content, separatorPosition: separator.position };
    });

    await page.navigateTo(FIXTURE_URLS.LONG_TITLE, { waitFor: 'networkidle' });
    const entry = await categoryStyle('.entry-categories a');
    const entryName = await page.locator('.entry-categories a').first().evaluate((el) => el.textContent?.trim());
    await expect(page.locator('.entry-categories a').first()).toHaveAccessibleName(/** @type {string} */ (entryName));
    await page.navigateTo('/archive/category/test', { waitFor: 'networkidle' });
    const list = await categoryStyle('.archive-entry .categories a');

    // 丸いラベルにしない
    expect(entry.background).toBe('rgba(0, 0, 0, 0)');
    expect(entry.radius).toBe('0px');
    // 一覧と同じ見た目
    expect(entry).toEqual(list);
    // 区切りは飾りなので読み上げず(content の代替テキストが空)、マウスを乗せたときの下線も付けない(絶対配置には下線が引き継がれない)
    expect(entry.separator).toBe('"/" / ""');
    expect(entry.separatorPosition).toBe('absolute');
  });

  test('記事のタイトルは太さを600にする(記事ページと一覧)', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    expect(await page.locator('.entry-header .entry-title').evaluate((el) => getComputedStyle(el).fontWeight)).toBe('600');
    await page.navigateTo('/archive/category/test', { waitFor: 'networkidle' });
    expect(await page.locator('.archive-entry .entry-title').first().evaluate((el) => getComputedStyle(el).fontWeight)).toBe('600');
  });

  test('スマホのカテゴリーページでは、パンくず・見出し・並べ替えをカードの文字の位置に揃える', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.MOBILE);
    await page.navigateTo('/archive/category/test', { waitFor: 'networkidle' });

    const lefts = await page.evaluate(() => {
      // 要素の箱ではなく、文字が始まる位置
      const textLeft = (/** @type {string} */ selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const range = document.createRange();
        range.selectNodeContents(el);
        return Math.min(...[...range.getClientRects()].filter((r) => r.width > 0).map((r) => r.left));
      };
      return {
        パンくず: textLeft('.breadcrumb'),
        見出し: textLeft('.archive-heading'),
        並べ替え: textLeft('.archive-entries-sort'),
        カードの日付: textLeft('.archive-entry .archive-date'),
      };
    });

    for (const [name, left] of Object.entries(lefts)) {
      expect(left, `${name}が見つからない`).not.toBeNull();
      expect(left, name).toBeCloseTo(/** @type {number} */ (lefts.カードの日付), 0);
    }
  });
});

test.describe('この記事を共有', () => {
  test('記事下のソーシャルボタンを、見出しの付いた1つの段にする', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    const section = page.locator('.entry-footer .social-buttons');
    await expect(section, '前提: 開発用ブログで記事下のソーシャルボタンを出していること').toBeVisible();

    const style = await section.evaluate((el) => {
      const s = getComputedStyle(el);
      return { label: getComputedStyle(el, '::before').content, borders: [s.borderTopWidth, s.borderBottomWidth] };
    });
    expect(style.label).toBe('"この記事を共有"');
    // 上にだけ線を引く(記事下の段の線の引き方)
    expect(style.borders).toEqual(['1px', '0px']);
  });

  test('記事下の「書いた人・投稿してからの時間・読者になる」の行は出さない', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    const row = page.locator('.entry-footer .entry-footer-section');
    await expect(row, '前提: はてながその行を出力していること').toBeAttached();
    await expect(row).toBeHidden();
    // 日付は記事のヘッダーに、「読者になる」はブログのヘッダーに残る
    await expect(page.locator('.entry-header .date')).toBeVisible();
    await expect(page.locator('.blog-controlls-subscribe-btn')).toBeVisible();
  });

  test('記事下の段(共有・関連記事・コメント欄)は上にだけ線を引き、段が抜けても線を2本並べない', async ({ page }) => {
    // 記事下の段の上の線と、線から見出しの行までの間隔
    const measureSections = () => page.evaluate(() => {
      const sections = [
        ['共有', document.querySelector('.entry-footer .social-buttons'), (/** @type {Element} */ el) => el],
        ['関連記事', document.querySelector('.entry-footer .customized-footer .hatena-module'), (/** @type {Element} */ el) => el.querySelector('.hatena-module-title')],
        ['コメント欄', document.querySelector('.entry-footer .comment-box'), (/** @type {Element} */ el) => el],
      ];
      return sections.filter(([, el]) => el).map(([name, el, label]) => {
        const element = /** @type {Element} */ (el);
        const s = getComputedStyle(element);
        const top = element.getBoundingClientRect().top;
        const labelEl = /** @type {(el: Element) => Element} */ (label)(element);
        // 共有とコメント欄の見出しは ::before なので、要素の内側の上端(線と余白の下)で測る
        const labelTop = labelEl === element ? top + element.clientTop + parseFloat(s.paddingTop) : labelEl.getBoundingClientRect().top;
        return { name, top, bottom: element.getBoundingClientRect().bottom, lines: [s.borderTopWidth, s.borderBottomWidth], labelOffset: Math.round(labelTop - top) };
      });
    });

    for (const [path, expected] of /** @type {const} */ ([
      [TEST_URLS.SAMPLE_ARTICLE, ['共有', '関連記事', 'コメント欄']],
      [FIXTURE_URLS.HEADINGS_H2, ['共有', 'コメント欄']],
    ])) {
      await page.navigateTo(path, { waitFor: 'networkidle' });
      await expect(page.locator('.entry-footer .comment-box'), '前提: コメント欄があること').toBeAttached();
      const sections = await measureSections();
      expect(sections.map((s) => s.name), `前提: ${path} の記事下の段`).toEqual(expected);
      for (const [i, section] of sections.entries()) {
        // 上にだけ線を引き、線から同じ間隔で見出しを置く
        expect(section.lines, `${path} ${section.name}`).toEqual(['1px', '0px']);
        expect(section.labelOffset, `${path} ${section.name}の見出し`).toBe(17);
        // 次の段の線は、この段のすぐ下に続く(間に線や余白を挟まない)
        if (i > 0) expect(section.top, `${path} ${section.name}`).toBeCloseTo(sections[i - 1].bottom, 0);
      }
    }
  });

  // はてなが出力するボタンのHTML(2026年10月に開発用ブログで出力されたもの)。開発用ブログの設定で出していないボタンは、これを差し込んで確かめる
  const SHARE_MARKUP = {
    twitter: '<a class="entry-share-button entry-share-button-twitter test-share-button-twitter" href="https://x.com/intent/tweet?text=test&amp;url=https%3A%2F%2Fexample.com%2F" title="X（Twitter）で投稿する"></a>',
    mastodon: '<a class="entry-share-button entry-share-button-mastodon" target="_blank" rel="noopener noreferrer" href="https://blog.hatena.ne.jp/-/share/mastodon?text=test" title="Mastodon で共有する"></a>',
    bluesky: '<a class="entry-share-button entry-share-button-bluesky" target="_blank" rel="noopener noreferrer" href="https://bsky.app/intent/compose?text=test" title="Bluesky で共有する"></a>',
    misskey: '<a class="entry-share-button entry-share-button-misskey" target="_blank" rel="noopener noreferrer" href="https://blog.hatena.ne.jp/-/share/misskey?text=test" title="Misskey で共有する"></a>',
    tumblr: '<a href="http://www.tumblr.com/share" data-hatenablog-tumblr-share-button data-share-url="https://example.com/" data-share-title="test" title="Share on Tumblr" style="display:inline-block; text-indent:-9999px; overflow:hidden; width:81px; height:20px; background:url(\'https://platform.tumblr.com/v1/share_1.png\') top left no-repeat transparent; vertical-align: top;">Share on Tumblr</a>',
  };

  // [サービス, セレクタ, 見た目の名前, 読み上げ名]。Tumblr は中の文字(Share on Tumblr)を読み上げ名として残す
  for (const [service, selector, name, accessibleName] of /** @type {const} */ ([
    ['twitter', '.entry-share-button-twitter', 'X', 'X'],
    ['mastodon', '.entry-share-button-mastodon', 'Mastodon', 'Mastodon'],
    ['bluesky', '.entry-share-button-bluesky', 'Bluesky', 'Bluesky'],
    ['misskey', '.entry-share-button-misskey', 'Misskey', 'Misskey'],
    ['tumblr', '[data-hatenablog-tumblr-share-button]', 'Tumblr', 'Share on Tumblr'],
  ])) {
    test(`${name}のリンクは、はてなや各サービスのボタン画像ではなく、文字色のロゴと名前にする`, async ({ page }) => {
      await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
      await expect(page.locator('.entry-footer .social-buttons > .social-button-item').first(), '前提: 記事下のソーシャルボタンがあること').toBeAttached();
      await page.evaluate(({ selector, markup }) => {
        if (document.querySelector(`.entry-footer a${selector}`)) return;
        document.querySelector('.entry-footer .social-buttons')?.insertAdjacentHTML('beforeend', `<div class="social-button-item">${markup}</div>`);
      }, { selector, markup: SHARE_MARKUP[service] });
      const link = page.locator(`.entry-footer a${selector}`);
      await expect(link).toBeVisible();

      const style = await link.evaluate((el) => {
        const s = getComputedStyle(el);
        const icon = getComputedStyle(el, '::before');
        const label = getComputedStyle(el, '::after');
        return {
          background: s.backgroundImage,
          backgroundColor: s.backgroundColor,
          iconMask: icon.maskImage,
          iconColor: icon.backgroundColor,
          color: s.color,
          label: label.content,
          labelSize: label.fontSize,
          height: el.getBoundingClientRect().height,
          href: /** @type {HTMLAnchorElement} */ (el).href,
        };
      });
      // ボタン画像は消し、ロゴは文字色で描く
      expect(style.background).toBe('none');
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.iconMask).toContain('data:image/svg+xml');
      expect(style.iconColor).toBe(style.color);
      // どのボタンも同じ大きさの名前を出す
      expect(style.label).toContain(`"${name}"`);
      expect(style.labelSize).toBe('13px');
      expect(style.height).toBe(32);
      // 読み上げ名は名前(Tumblr は中の文字)。共有先のURLははてなのまま
      await expect(link).toHaveAccessibleName(accessibleName);
      expect(style.href).toMatch(/^https?:\/\//);
    });
  }
});

test.describe('コメント欄', () => {
  /** コメント欄の見出し・「コメントを書く」・共有するリンクの形 */
  const measureComments = (/** @type {any} */ page) => page.evaluate(() => {
    const box = /** @type {Element} */ (document.querySelector('.entry-footer .comment-box'));
    const write = /** @type {Element} */ (box.querySelector('.leave-comment-title'));
    const share = document.querySelector('.entry-footer .entry-share-button-bluesky');
    const comments = [...box.querySelectorAll('.entry-comment')];
    const shape = (/** @type {Element | null} */ el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      return { fontSize: s.fontSize, borderBottom: s.borderBottomWidth, radius: s.borderTopLeftRadius, background: s.backgroundColor, iconMask: getComputedStyle(el, '::before').maskImage.startsWith('url(') };
    };
    const boxRect = box.getBoundingClientRect();
    const writeRect = write.getBoundingClientRect();
    return {
      label: getComputedStyle(box, '::before').content,
      // 見出しの行の上端(上の線と余白の下)
      rowTop: boxRect.top + box.clientTop + parseFloat(getComputedStyle(box).paddingTop),
      write: shape(write),
      share: shape(share),
      writeTop: writeRect.top,
      writeRight: writeRect.right,
      boxRight: boxRect.right,
      lastCommentBottom: comments.length ? comments[comments.length - 1].getBoundingClientRect().bottom : null,
    };
  });

  test('「コメントを書く」は、共有するリンクと同じ形(アイコンと名前、下線)で右に置く', async ({ page }) => {
    await page.navigateTo(FIXTURE_URLS.HEADINGS_H2, { waitFor: 'networkidle' });
    await expect(page.locator('.entry-footer .comment-box'), '前提: コメント欄があること').toBeAttached();
    const m = await measureComments(page);

    expect(m.label).toBe('"コメント"');
    expect(m.share, '前提: Blueskyの共有するリンクがあること').not.toBeNull();
    expect(m.write).toEqual(m.share);
    expect(m.write.radius).toBe('0px');
    expect(m.writeRight).toBeCloseTo(m.boxRight, 0);
    // コメントがなければ、見出しと同じ行に並ぶ
    expect(m.lastCommentBottom, '前提: コメントがないこと').toBeNull();
    expect(m.writeTop).toBeCloseTo(m.rowTop, 0);
  });

  test('コメントは、アイコンを左の列に置いて名前・本文・日時を揃え、線ではなく余白で区切る', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator('.entry-comment').first(), '前提: コメントがあること').toBeAttached();
    // アイコンのないコメント(ゲストなど)を足して、同じ位置に並ぶことも確かめる
    await page.evaluate(() => {
      const first = /** @type {Element} */ (document.querySelector('.entry-comment'));
      const guest = /** @type {Element} */ (first.cloneNode(true));
      guest.querySelector('.hatena-id-icon')?.remove();
      /** @type {Element} */ (guest.querySelector('.comment-user-name')).textContent = 'ゲストさん';
      first.after(guest);
    });

    const comments = await page.evaluate(() => [...document.querySelectorAll('.entry-comment')].map((comment) => {
      const left = (/** @type {string} */ selector) => /** @type {Element} */ (comment.querySelector(selector)).getBoundingClientRect().left;
      const icon = comment.querySelector('.hatena-id-icon');
      const iconBox = icon ? icon.getBoundingClientRect() : null;
      const placeholder = getComputedStyle(comment, '::before');
      return {
        commentLeft: comment.getBoundingClientRect().left,
        nameLeft: left('.comment-user-name'),
        contentLeft: left('.comment-content'),
        metadataLeft: left('.comment-metadata'),
        icon: iconBox ? { left: iconBox.left, width: iconBox.width } : null,
        placeholder: icon ? null : { width: placeholder.width, radius: placeholder.borderTopLeftRadius },
        border: [getComputedStyle(comment).borderTopWidth, getComputedStyle(comment).borderBottomWidth],
        metadataFont: getComputedStyle(/** @type {Element} */ (comment.querySelector('.comment-metadata'))).fontFamily,
      };
    }));
    const dateFont = await page.locator('.entry-header .date').evaluate((el) => getComputedStyle(el).fontFamily);

    expect(comments.length).toBeGreaterThanOrEqual(2);
    for (const [i, c] of comments.entries()) {
      // 名前・本文・日時は、アイコンの右の同じ位置から始まる
      expect(c.contentLeft, `${i}番目`).toBeCloseTo(c.nameLeft, 0);
      expect(c.metadataLeft, `${i}番目`).toBeCloseTo(c.nameLeft, 0);
      expect(c.nameLeft - c.commentLeft, `${i}番目`).toBe(44);
      // アイコン(ないときは丸)は左の列
      if (c.icon) {
        expect(c.icon).toEqual({ left: c.commentLeft, width: 32 });
      } else {
        expect(c.placeholder).toEqual({ width: '32px', radius: '50%' });
      }
      expect(c.border).toEqual(['0px', '0px']);
      // 日時は記事の日付と同じ書体
      expect(c.metadataFont).toBe(dateFont);
    }
  });

  test('コメントがあれば見出しの下に並べ、「コメントを書く」はその後に置く', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    const m = await measureComments(page);
    expect(m.lastCommentBottom, '前提: コメントがあること').not.toBeNull();
    expect(m.writeTop).toBeGreaterThanOrEqual(/** @type {number} */ (m.lastCommentBottom));
    expect(m.writeRight).toBeCloseTo(m.boxRight, 0);
  });
});

test.describe('前後の記事', () => {
  /** 前後の記事と、記事のカード・記事下の段の線の位置 */
  const measurePager = (/** @type {any} */ page) => page.evaluate(() => {
    const pager = /** @type {Element} */ (document.querySelector('#main-inner > .pager-permalink'));
    const entry = /** @type {Element} */ (pager.previousElementSibling);
    const comments = /** @type {Element} */ (entry.querySelector('.comment-box'));
    const pagerBox = pager.getBoundingClientRect();
    const pagerStyle = getComputedStyle(pager);
    const entryStyle = getComputedStyle(entry);
    const linkName = (/** @type {string} */ selector) => {
      const a = pager.querySelector(selector);
      return a ? { label: getComputedStyle(a, '::before').content, right: a.getBoundingClientRect().right, left: a.getBoundingClientRect().left } : null;
    };
    return {
      entryClass: entry.className,
      entryBottom: [entryStyle.borderBottomWidth, entryStyle.borderBottomLeftRadius],
      pagerTop: [pagerStyle.borderTopWidth, pagerStyle.borderTopLeftRadius],
      seam: pagerBox.top - entry.getBoundingClientRect().bottom,
      background: [entryStyle.backgroundColor, pagerStyle.backgroundColor],
      // 前後の記事の線(内側の幅)と、コメント欄の線
      pagerLine: [pagerBox.left + pager.clientLeft + parseFloat(pagerStyle.paddingLeft), pagerBox.right - (pagerBox.width - pager.clientWidth - pager.clientLeft) - parseFloat(pagerStyle.paddingRight)],
      commentLine: [comments.getBoundingClientRect().left, comments.getBoundingClientRect().right],
      lineColor: getComputedStyle(pager, '::before').borderTopColor,
      commentLineColor: getComputedStyle(comments).borderTopColor,
      arrows: [...pager.querySelectorAll('.pager-arrow')].map((el) => getComputedStyle(el).display),
      prev: linkName('.pager-prev a'),
      next: linkName('.pager-next a'),
    };
  });

  for (const [name, path, viewport] of /** @type {const} */ ([
    ['目次を横に出す記事', FIXTURE_URLS.HEADINGS_H2, VIEWPORTS.DESKTOP],
    ['目次のない記事', TEST_URLS.ARTICLE_WITHOUT_TOC, VIEWPORTS.DESKTOP],
    ['スマホ', FIXTURE_URLS.HEADINGS_H2, VIEWPORTS.MOBILE],
  ])) {
    test(`記事のカードの最後の段としてつなげ、線を記事下の段と揃える(${name})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.navigateTo(path, { waitFor: 'networkidle' });
      await expect(page.locator('#main-inner > .entry + .pager-permalink'), '前提: 前後の記事があること').toBeAttached();
      const m = await measurePager(page);

      // 記事のカードの下の枠と角丸をなくし、前後の記事をすぐ下に1px潜り込ませてつなげる
      expect(m.entryBottom).toEqual(['0px', '0px']);
      expect(m.pagerTop).toEqual(['0px', '0px']);
      expect(m.seam).toBeCloseTo(-1, 0);
      expect(m.background[1]).toBe(m.background[0]);
      // 段の上の線は、コメント欄の線と同じ幅・同じ色
      expect(m.pagerLine[0]).toBeCloseTo(m.commentLine[0], 0);
      expect(m.pagerLine[1]).toBeCloseTo(m.commentLine[1], 0);
      expect(m.lineColor).toBe(m.commentLineColor);
      // はてなの「«」「»」は出さず、見出しを出す。前は左端、次は右端
      expect(m.arrows.every((d) => d === 'none')).toBe(true);
      expect(m.prev?.label).toContain('前の記事');
      expect(m.next?.label).toContain('次の記事');
      expect(m.prev?.left).toBeCloseTo(m.pagerLine[0], 0);
      expect(m.next?.right).toBeCloseTo(m.pagerLine[1], 0);
    });
  }

  test('目次を閉じて本文が広がると、前後の記事の線も広がる', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.DESKTOP);
    await page.navigateTo(FIXTURE_URLS.HEADINGS_H2, { waitFor: 'networkidle' });
    await expect(page.locator('.entry-content > .toc-panel'), '前提: 目次の開閉があること').toHaveCount(1);
    await page.locator('.toc-panel-summary').click();
    const m = await measurePager(page);
    expect(m.pagerLine[1]).toBeCloseTo(m.commentLine[1], 0);
  });

  test('読み上げでは、見出しの矢印を除いた「前の記事」「次の記事」と記事のタイトルをリンクの名前にする', async ({ page }) => {
    await page.navigateTo(FIXTURE_URLS.HEADINGS_H2, { waitFor: 'networkidle' });
    const prev = page.locator('.pager-permalink .pager-prev a');
    await expect(prev).toHaveAccessibleName(/^前の記事 ?Fixture/);
  });

  test('次の記事しかないときも、次の記事は右に置く', async ({ page }) => {
    await page.navigateTo(FIXTURE_URLS.HEADINGS_H2, { waitFor: 'networkidle' });
    await page.evaluate(() => document.querySelector('.pager-permalink .pager-prev')?.remove());
    const m = await measurePager(page);
    expect(m.prev).toBeNull();
    expect(m.next?.right).toBeCloseTo(m.pagerLine[1], 0);
  });
});

test.describe('ブログパーツ', () => {
  const openBlogParts = async (/** @type {any} */ page) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    await expect(page.locator('#box2 .hatena-module').first(), '前提: ブログパーツがあること').toBeAttached();
    await page.addStyleTag({ content: '#box2 { content-visibility: visible !important; }' });
  };

  test('ブログパーツは1枚のカードにまとめ、中は記事下の段と同じ形(上の線と見出し)にする', async ({ page }) => {
    await openBlogParts(page);
    const m = await page.evaluate(() => {
      const card = /** @type {Element} */ (document.querySelector('#box2-inner'));
      const share = document.querySelector('.entry-footer .social-buttons');
      const modules = [...document.querySelectorAll('#box2 .hatena-module')].filter((el) => getComputedStyle(el).display !== 'none');
      const label = (/** @type {Element} */ el, /** @type {string | undefined} */ pseudo) => {
        const s = getComputedStyle(el, pseudo);
        return { size: s.fontSize, weight: s.fontWeight, spacing: s.letterSpacing, color: s.color };
      };
      return {
        card: { radius: getComputedStyle(card).borderTopLeftRadius, background: getComputedStyle(card).backgroundColor, entryBackground: getComputedStyle(/** @type {Element} */ (document.querySelector('.entry'))).backgroundColor },
        modules: modules.map((el) => {
          const s = getComputedStyle(el);
          return { name: el.querySelector('.hatena-module-title')?.textContent?.trim(), lines: [s.borderTopWidth, s.borderBottomWidth], background: s.backgroundColor, shadow: s.boxShadow, title: label(/** @type {Element} */ (el.querySelector('.hatena-module-title'))), titleDot: getComputedStyle(/** @type {Element} */ (el.querySelector('.hatena-module-title')), '::before').content };
        }),
        shareLabel: share ? label(share, '::before') : null,
        itemLines: [...document.querySelectorAll('#box2 .hatena-urllist > li')].map((li) => getComputedStyle(li).borderTopWidth),
      };
    });

    // カードはブログ全体で1枚。記事のカードと同じ形
    expect(m.card.radius).not.toBe('0px');
    expect(m.card.background).toBe(m.card.entryBackground);
    expect(m.modules.length).toBeGreaterThan(3);
    for (const mod of m.modules) {
      // ブログパーツごとのカードにはせず、上にだけ線を引く
      expect(mod.lines, mod.name).toEqual(['1px', '0px']);
      expect(mod.background, mod.name).toBe('rgba(0, 0, 0, 0)');
      expect(mod.shadow, mod.name).toBe('none');
      // 見出しは記事下の段(この記事を共有)と同じ形。丸の印は付けない
      expect(mod.title, mod.name).toEqual(m.shareLabel);
      expect(mod.titleDot, mod.name).toBe('none');
    }
    // 項目の間は線ではなく余白で区切る
    expect(m.itemLines.every((w) => w === '0px')).toBe(true);
  });

  test('記事の一覧は、はてなの仮の画像を出さず、タイトルの下に日付とカテゴリを小さな文字で並べる', async ({ page }) => {
    await openBlogParts(page);
    const m = await page.evaluate(() => {
      const items = [...document.querySelectorAll('.urllist-with-thumbnails .urllist-item-inner')].filter((el) => el.getBoundingClientRect().height > 0);
      return items.map((item) => {
        const image = /** @type {HTMLImageElement | null} */ (item.querySelector('.urllist-image'));
        const title = /** @type {Element} */ (item.querySelector('.urllist-title-link'));
        const date = item.querySelector('.urllist-date-link');
        const category = item.querySelector('.urllist-category-link');
        return {
          placeholder: image ? image.src.includes('og-image-1500.png') : null,
          imageShown: image ? image.getBoundingClientRect().width : 0,
          titleWeight: getComputedStyle(title).fontWeight,
          titleBottom: title.getBoundingClientRect().bottom,
          dateTop: date ? date.getBoundingClientRect().top : null,
          dateRow: date ? Math.round(date.getBoundingClientRect().top + date.getBoundingClientRect().height / 2) : null,
          categoryRow: category ? Math.round(category.getBoundingClientRect().top + category.getBoundingClientRect().height / 2) : null,
          categoryBackground: category ? getComputedStyle(category).backgroundColor : null,
          categorySize: category ? getComputedStyle(category).fontSize : null,
        };
      });
    });

    expect(m.some((i) => i.placeholder === true), '前提: 仮の画像の記事があること').toBe(true);
    expect(m.some((i) => i.placeholder === false), '前提: 画像のある記事があること').toBe(true);
    for (const [i, item] of m.entries()) {
      // 仮の画像は出さず、本当の画像は小さく出す
      expect(item.imageShown, `${i}番目のサムネイル`).toBe(item.placeholder === false ? 56 : 0);
      // タイトルは太字にしない
      expect(item.titleWeight, `${i}番目のタイトル`).toBe('500');
      // 日付はタイトルの下、カテゴリは日付と同じ行の小さな文字(丸いラベルにしない)
      if (item.dateTop !== null) expect(item.dateTop, `${i}番目の日付`).toBeGreaterThanOrEqual(item.titleBottom - 1);
      if (item.categoryRow !== null) {
        expect(Math.abs(/** @type {number} */ (item.categoryRow) - /** @type {number} */ (item.dateRow)), `${i}番目のカテゴリ`).toBeLessThanOrEqual(2);
        expect(item.categoryBackground, `${i}番目のカテゴリ`).toBe('rgba(0, 0, 0, 0)');
        expect(item.categorySize, `${i}番目のカテゴリ`).toBe('12px');
      }
    }
  });

  test('最近のコメントは、1行目に記事のタイトル、2行目に書いた人と日時を並べる', async ({ page }) => {
    await openBlogParts(page);
    await expect(page.locator('#box2 .recent-comments > li').first(), '前提: 最近のコメントがあること').toBeAttached({ timeout: 10000 });
    const rows = await page.locator('#box2 .recent-comments > li').first().evaluate((li) => {
      const box = (/** @type {string} */ selector) => /** @type {Element} */ (li.querySelector(selector)).getBoundingClientRect();
      return { title: box(':scope > a'), user: box('.user-id'), time: box(':scope > .recent-comment-time'), icon: box('.hatena-id-icon').width };
    });
    expect(rows.user.top).toBeGreaterThanOrEqual(rows.title.bottom - 1);
    expect(Math.abs((rows.time.top + rows.time.height / 2) - (rows.user.top + rows.user.height / 2))).toBeLessThanOrEqual(2);
    expect(rows.time.left).toBeGreaterThan(rows.user.right);
    expect(rows.icon).toBe(16);
  });

  test('「もっと見る」「このブログについて」は、「コメントを書く」と同じ操作の形(アイコンなし)にする', async ({ page }) => {
    await openBlogParts(page);
    const shapes = await page.evaluate(() => ['#box2 .urllist-see-more a', '#box2 .profile-about a', '.leave-comment-title'].map((selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const s = getComputedStyle(el);
      return { selector, fontSize: s.fontSize, borderBottom: s.borderBottomWidth, minHeight: s.minHeight, icon: getComputedStyle(el, '::before').display };
    }));
    const [seeMore, about, write] = shapes;
    expect(seeMore, '前提: もっと見るがあること').not.toBeNull();
    expect(about, '前提: このブログについてがあること').not.toBeNull();
    for (const shape of [seeMore, about]) {
      expect({ fontSize: shape?.fontSize, borderBottom: shape?.borderBottom, minHeight: shape?.minHeight }).toEqual({ fontSize: write?.fontSize, borderBottom: write?.borderBottom, minHeight: write?.minHeight });
      expect(shape?.icon).toBe('none');
    }
  });

  test('中身のないブログパーツは出さず、スクリプトが後から項目を足すものは足した時点で出す', async ({ page }) => {
    await openBlogParts(page);
    const visible = await page.evaluate(() => {
      // 項目のないブログパーツ(注目記事・参加グループなどで項目がないとき、はてなは空のリストを出力する)
      const box = /** @type {Element} */ (document.querySelector('#box2-inner'));
      box.insertAdjacentHTML('beforeend', '<div class="hatena-module test-empty-module"><div class="hatena-module-title">空のブログパーツ</div><div class="hatena-module-body"><ul class="hatena-urllist"> </ul></div></div>');
      // リストのないブログパーツ(自分で書いたHTML)は、中身を判定せず出す
      box.insertAdjacentHTML('beforeend', '<div class="hatena-module test-html-module"><div class="hatena-module-title">HTML</div><div class="hatena-module-body">文字だけのHTML</div></div>');
      const shown = (/** @type {string} */ selector) => getComputedStyle(/** @type {Element} */ (document.querySelector(selector))).display !== 'none';
      const before = { empty: shown('.test-empty-module'), html: shown('.test-html-module') };
      // スクリプトが項目を足す
      document.querySelector('.test-empty-module ul')?.insertAdjacentHTML('beforeend', '<li><a href="#">足した項目</a></li>');
      return { ...before, afterAdding: shown('.test-empty-module') };
    });

    expect(visible).toEqual({ empty: false, html: true, afterAdding: true });
  });
});

test.describe('記事の一覧', () => {
  /** 一覧の記事ごとの位置 */
  const measureList = (/** @type {any} */ page) => page.evaluate(() => {
    const list = /** @type {Element} */ (document.querySelector('.archive-entries'));
    const listStyle = getComputedStyle(list);
    const box = (/** @type {Element | null} */ el) => (el ? el.getBoundingClientRect().toJSON() : null);
    return {
      list: { radius: listStyle.borderTopLeftRadius, background: listStyle.backgroundColor, left: list.getBoundingClientRect().left + list.clientLeft + parseFloat(listStyle.paddingLeft), right: list.getBoundingClientRect().right - parseFloat(listStyle.borderRightWidth) - parseFloat(listStyle.paddingRight) },
      entries: [...list.querySelectorAll(':scope > .archive-entry')].map((entry) => {
        const s = getComputedStyle(entry);
        const thumb = /** @type {HTMLElement | null} */ (entry.querySelector('.entry-thumb'));
        return {
          title: /** @type {Element} */ (entry.querySelector('.entry-title')).textContent?.trim(),
          background: s.backgroundColor,
          shadow: s.boxShadow,
          borderTop: s.borderTopWidth,
          date: box(entry.querySelector('.archive-date')),
          categories: box(entry.querySelector('.categories')),
          titleBox: box(entry.querySelector('.entry-title')),
          description: box(entry.querySelector('.entry-description')),
          social: box(entry.querySelector('.social-buttons')),
          placeholder: thumb ? thumb.style.backgroundImage.includes('og-image-1500.png') : null,
          thumb: box(entry.querySelector('.entry-thumb')),
        };
      }),
    };
  });

  test('一覧は1枚のカードにし、記事の間を線で区切る', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.DESKTOP);
    await page.navigateTo(TEST_URLS.HOME, { waitFor: 'networkidle' });
    const m = await measureList(page);
    const entryBackground = await page.evaluate(() => getComputedStyle(/** @type {Element} */ (document.querySelector('#box2-inner'))).backgroundColor);

    expect(m.entries.length, '前提: 記事が2件以上あること').toBeGreaterThan(1);
    expect(m.list.radius).not.toBe('0px');
    expect(m.list.background).toBe(entryBackground);
    for (const [i, entry] of m.entries.entries()) {
      expect(entry.background, entry.title).toBe('rgba(0, 0, 0, 0)');
      expect(entry.shadow, entry.title).toBe('none');
      // 先頭の記事の上には線を引かず、2件目からは上に線を引く
      expect(entry.borderTop, entry.title).toBe(i === 0 ? '0px' : '1px');
    }
  });

  test('広い画面では、左の列に日付とカテゴリ、右の列にタイトル・概要・スターを置く', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.DESKTOP);
    await page.navigateTo(TEST_URLS.HOME, { waitFor: 'networkidle' });
    const m = await measureList(page);
    // タイトルの1行は30px(20pxの文字と行の高さ1.5)
    const longTitle = m.entries.find((e) => (e.titleBox?.height ?? 0) > 45);
    expect(longTitle, '前提: タイトルが折り返す記事があること').toBeTruthy();

    for (const e of m.entries) {
      if (!e.date || !e.categories || !e.titleBox || !e.description) throw new Error(`${e.title} の要素が見つからない`);
      // 日付とカテゴリは左の列で、カテゴリは日付のすぐ下(タイトルが折り返しても離れない)
      expect(e.categories.left, e.title).toBeCloseTo(e.date.left, 0);
      expect(e.categories.top - e.date.bottom, e.title).toBeLessThanOrEqual(8);
      expect(e.categories.top, e.title).toBeGreaterThanOrEqual(e.date.bottom - 1);
      // タイトル・概要・スターは右の列の同じ左端
      expect(e.titleBox.left, e.title).toBeGreaterThan(e.date.right);
      expect(e.description.left, e.title).toBeCloseTo(e.titleBox.left, 0);
      expect(e.description.top, e.title).toBeGreaterThanOrEqual(e.titleBox.bottom);
      if (e.social) {
        expect(e.social.left, e.title).toBeCloseTo(e.titleBox.left, 0);
        expect(e.social.top, e.title).toBeGreaterThanOrEqual(e.description.bottom);
      }
    }
  });

  test('スマホでは、日付・カテゴリ・タイトルの順に縦に並べる', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.MOBILE);
    await page.navigateTo(TEST_URLS.HOME, { waitFor: 'networkidle' });
    const m = await measureList(page);
    for (const e of m.entries) {
      if (!e.date || !e.categories || !e.titleBox) throw new Error(`${e.title} の要素が見つからない`);
      expect(e.categories.left, e.title).toBeCloseTo(e.date.left, 0);
      expect(e.titleBox.left, e.title).toBeCloseTo(e.date.left, 0);
      expect(e.categories.top, e.title).toBeGreaterThanOrEqual(e.date.bottom - 1);
      expect(e.titleBox.top, e.title).toBeGreaterThanOrEqual(e.categories.bottom - 1);
    }
  });

  for (const [name, viewport, size] of /** @type {const} */ ([
    ['広い画面', VIEWPORTS.DESKTOP, { width: 160, height: 106 }],
    ['スマホ', VIEWPORTS.MOBILE, { width: 72, height: 72 }],
  ])) {
    test(`はてなの仮の画像は出さず、本当の画像だけを右に出す(${name})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.navigateTo(TEST_URLS.HOME, { waitFor: 'networkidle' });
      const m = await measureList(page);
      const placeholders = m.entries.filter((e) => e.placeholder === true);
      const images = m.entries.filter((e) => e.placeholder === false);
      expect(placeholders.length, '前提: 仮の画像の記事があること').toBeGreaterThan(0);
      expect(images.length, '前提: 画像のある記事があること').toBeGreaterThan(0);
      for (const e of placeholders) {
        // 仮の画像は出さず、サムネイルの列もなくして概要を広げる
        expect(e.thumb?.width ?? 0, e.title).toBe(0);
        expect(e.description?.right ?? 0, e.title).toBeCloseTo(m.list.right, 0);
      }
      for (const e of images) {
        expect({ width: e.thumb?.width, height: e.thumb?.height }, e.title).toEqual(size);
        expect(e.thumb?.right ?? 0, e.title).toBeCloseTo(m.list.right, 0);
      }
    });
  }

  test('カテゴリが多くても、折り返した行は左端から始め、区切りは行末に付ける', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.MOBILE);
    await page.navigateTo(TEST_URLS.HOME, { waitFor: 'networkidle' });
    const rows = await page.evaluate(() => {
      const categories = /** @type {Element} */ (document.querySelector('.archive-entry .categories'));
      for (const name of ['長いカテゴリー名だよ', 'C#', '.NET', 'Kubernetes', 'はてなブログ']) {
        categories.insertAdjacentHTML('beforeend', ` <a class="archive-category-link" href="#">${name}</a>`);
      }
      const left = categories.getBoundingClientRect().left;
      const links = [...categories.querySelectorAll('a')];
      // 行ごとに、先頭のカテゴリの左端と、前の行の最後のカテゴリの区切り
      const lines = new Map();
      for (const a of links) {
        const top = Math.round(a.getBoundingClientRect().top);
        if (!lines.has(top)) lines.set(top, []);
        lines.get(top).push(a);
      }
      return { left, lines: [...lines.values()].map((line) => ({ firstLeft: line[0].getBoundingClientRect().left, lastAfter: getComputedStyle(line[line.length - 1], '::after').content })), lastAfter: getComputedStyle(/** @type {Element} */ (links.at(-1)), '::after').content };
    });

    expect(rows.lines.length, '前提: カテゴリが折り返すこと').toBeGreaterThan(1);
    for (const line of rows.lines) expect(line.firstLeft).toBeCloseTo(rows.left, 0);
    // 折り返した行の最後のカテゴリにも区切りが付き、最後のカテゴリには付かない
    for (const line of rows.lines.slice(0, -1)) expect(line.lastAfter).toBe('"/" / ""');
    expect(rows.lastAfter).toBe('none');
  });

  test('ページャーは一覧のカードの下につなげて最後の段にする', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.DESKTOP);
    await page.navigateTo(TEST_URLS.HOME, { waitFor: 'networkidle' });
    await expect(page.locator('#main-inner > .archive-entries + .pager'), '前提: 次のページがあること').toBeAttached();
    const m = await page.evaluate(() => {
      const list = /** @type {Element} */ (document.querySelector('#main-inner > .archive-entries'));
      const pager = /** @type {Element} */ (list.nextElementSibling);
      const ls = getComputedStyle(list);
      const ps = getComputedStyle(pager);
      const next = pager.querySelector('.pager-next a');
      const pagerBox = pager.getBoundingClientRect();
      return {
        listBottom: [ls.borderBottomWidth, ls.borderBottomLeftRadius],
        pagerTop: [ps.borderTopWidth, ps.borderTopLeftRadius],
        seam: pagerBox.top - list.getBoundingClientRect().bottom,
        background: [ls.backgroundColor, ps.backgroundColor],
        line: getComputedStyle(pager, '::before').borderTopWidth,
        nextRight: next?.getBoundingClientRect().right,
        contentRight: pagerBox.right - parseFloat(ps.borderRightWidth) - parseFloat(ps.paddingRight),
        nextBorder: next ? getComputedStyle(next).borderBottomWidth : null,
        nextIcon: next ? getComputedStyle(next, '::before').maskImage.startsWith('url(') : null,
      };
    });
    expect(m.listBottom).toEqual(['0px', '0px']);
    expect(m.pagerTop).toEqual(['0px', '0px']);
    expect(m.seam).toBeCloseTo(-1, 0);
    expect(m.background[1]).toBe(m.background[0]);
    expect(m.line).toBe('1px');
    // 次のページは右端に、記事下の段の操作と同じ形(下線と矢印)で置く
    expect(m.nextRight).toBeCloseTo(m.contentRight, 0);
    expect(m.nextBorder).toBe('1px');
    expect(m.nextIcon).toBe(true);
  });
});

test.describe('アーカイブページのテスト', () => {
  test('アーカイブページが正しくレンダリングされる', async ({ page }) => {
    await page.navigateTo(TEST_URLS.ARCHIVE, { waitFor: 'networkidle' });

    await page.screenshot({ path: 'screenshots/archive-page.png', fullPage: true });

    await expect(page.locator(SELECTORS.PAGE_ARCHIVE)).toBeVisible();
    await expect(page.locator(SELECTORS.ARCHIVE_ENTRIES)).toBeVisible();
    expect(await page.locator(SELECTORS.ARCHIVE_ENTRY).count()).toBeGreaterThan(0);
  });
});
