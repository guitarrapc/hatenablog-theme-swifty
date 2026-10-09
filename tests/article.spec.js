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
        // 記事ページではカードの上端にパンくずが入り、記事の上の角は丸めないので、下の角で測る
        card: radius('.entry', 'borderBottomRightRadius'),
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

  test('コメントがあれば見出しの下に並べ、「コメントを書く」はその後に置く', async ({ page }) => {
    await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
    const m = await measureComments(page);
    expect(m.lastCommentBottom, '前提: コメントがあること').not.toBeNull();
    expect(m.writeTop).toBeGreaterThanOrEqual(/** @type {number} */ (m.lastCommentBottom));
    expect(m.writeRight).toBeCloseTo(m.boxRight, 0);
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
