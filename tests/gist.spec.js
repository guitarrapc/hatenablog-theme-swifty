// @ts-check
import { test } from './helpers.js';
import { expect } from '@playwright/test';
import { TEST_URLS, VIEWPORTS, TIMEOUTS, SCHEMES, schemeCss } from './constants.js';

/**
 * GitHub Gistの埋め込みのテスト (theme-design-spec.md の「Gist埋め込み」を参照)
 *
 * サンプル記事に、MarkdownのファイルとコードのファイルのあるGistを埋め込んでいる。
 * Gistのスクリプトが書き出すHTMLと、GitHubのCSS(gist-embed-*.css。テーマより後に読み込まれる)はそのまま使う。
 * サンプルのGistにない要素(CSVのファイル、アラート、脚注、画像など)は、GitHubが書き出すのと同じ形のHTMLを足して確かめる。
 * 色は、テーマの変数(配色とダークで変わる)と同じになることを、本文のコードブロック・段落・見出しと比べて確かめる。
 */

const GIST = '.entry-content > .gist';
// コードのファイルは行番号とコードの表(.blob-code)を持つ。CSVのファイルも .blob-wrapper を持つが、.blob-code はない
const CODE_FILE = `${GIST} .gist-file:has(.blob-code)`;
const MARKDOWN_FILE = `${GIST} .gist-file:has(.readme)`;
const CSV_FILE = `${GIST} #gist-csv-fixture`;
// 記事の本文のコードブロック(はてなのコードブロック。開発用ブログでは js/codeblock.js が .code-block で包む)。
// Gistのコードのファイルはこれと揃える。Gistの中の pre には .code が付かない
const ARTICLE_CODE = '.entry-content:not(.markdown-body) pre.code:not(.lang-aa)';

const MODES = /** @type {const} */ (['light', 'dark']);

// :focus-visible の枠(_core.scss)が要素の外側に出る幅。枠2px + 間隔2px
const FOCUS_RING_REACH = 4;

/** GitHubがCSVのファイルを描くHTML(表の .csv-data。検索欄は GitHub のスクリプトがないと動かない) */
const CSV_FIXTURE = `
<div id="gist-csv-fixture" class="gist-file" translate="no" data-color-mode="light" data-light-theme="light">
  <div class="gist-data">
    <div class="js-gist-file-update-container js-task-list-container">
      <div id="file-scores-csv" class="file my-2">
        <div itemprop="text" class="Box-body p-0 blob-wrapper data type-csv" style="overflow: auto" tabindex="0" role="region" aria-label="scores.csv content">
          <div class="blob-interaction-bar">
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" class="octicon octicon-search"><path d="M2 2h12v12H2z"></path></svg>
            <input type="text" name="filter" class="form-control js-csv-filter-field blob-filter" placeholder="Search this file…" aria-label="Search this file…">
          </div>
          <div class="markdown-body js-check-hidden-unicode" data-line-alert="before">
            <table class="js-csv-data csv-data js-file-line-container">
              <thead>
                <tr id="file-scores-csv-LC1" class="js-file-line"><td id="file-scores-csv-L1" class="blob-num js-line-number" data-line-number="1"></td><th>name</th><th>score</th><th>team</th><th>rank</th><th>joined</th><th>status</th><th>email</th><th>comment</th></tr>
              </thead>
              <tbody>
                <tr id="file-scores-csv-LC2" class="js-file-line"><td id="file-scores-csv-L2" class="blob-num js-line-number" data-line-number="2"></td><td>Alice</td><td>85</td><td>red</td><td>2</td><td>2024-04-01</td><td>active</td><td>alice@example.com</td><td>Passed the exam with a comfortable margin on the second try</td></tr>
                <tr id="file-scores-csv-LC3" class="js-file-line"><td id="file-scores-csv-L3" class="blob-num js-line-number" data-line-number="3"></td><td>Bob</td><td>92</td><td>blue</td><td>1</td><td>2023-10-15</td><td>active</td><td>bob@example.com</td><td>Top score of the class</td></tr>
                <tr id="file-scores-csv-LC4" class="js-file-line"><td id="file-scores-csv-L4" class="blob-num js-line-number" data-line-number="4"></td><td>Charlie</td><td>78</td><td>green</td><td>3</td><td>2025-01-20</td><td>leave</td><td>charlie@example.com</td><td>Needs a retake of the practical part</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="gist-meta">
    <a href="https://gist.github.com/fixture/raw/scores.csv" style="float:right" class="Link--inTextBlock">view raw</a>
    <a href="https://gist.github.com/fixture#file-scores-csv" class="Link--inTextBlock">scores.csv</a>
    hosted with &#10084; by <a class="Link--inTextBlock" href="https://github.com">GitHub</a>
  </div>
</div>`;

/** GitHubのハイライトの種類ごとの語(サンプルのRustのファイルにない種類も含む)。コードのファイルの行として足す */
const HIGHLIGHT_FIXTURE = `
<tr id="gist-highlight-fixture">
  <td class="blob-num js-line-number" data-line-number="2"></td>
  <td class="blob-code blob-code-inner js-file-line"><span class="pl-k">if</span> <span class="pl-ent">div</span> <span class="pl-en">main</span> <span class="pl-e">Entity</span> <span class="pl-smi">String</span> <span class="pl-v">HashMap</span> <span class="pl-c1">42</span> <span class="pl-s">"text"</span> <span class="pl-sr">/re/</span> <span class="pl-cce">\\n</span> <span class="pl-pse">\${</span> <span class="pl-c">// comment</span> <span class="pl-mi1">+ added</span> <span class="pl-md">- removed</span> <span class="pl-s">"a <span class="pl-s1">name</span>"</span> <span class="pl-smw">self</span> <span class="pl-bu">)</span> <span class="pl-ii">?</span> <span class="pl-c2"></span> <span class="pl-ml">-</span> <span class="pl-mh"># head</span> <span class="pl-ms">term</span> <span class="pl-mi">em</span> <span class="pl-mb">strong</span> <span class="pl-mc">! changed</span> <span class="pl-mi2">ignored</span> <span class="pl-mdr">@@ -1 +1 @@</span> <span class="pl-ba">&lt;</span> <span class="pl-sg">gutter</span> <span class="pl-corl">[ref]</span> <span class="pl-s"><span class="pl-pds" data-key="pl-s pl-pds">"</span>a<span class="pl-v" data-key="pl-s pl-v">V</span><span class="pl-pse" data-key="pl-s pl-pse">\${</span><span class="pl-pse"><span class="pl-s1" data-key="pl-s pl-pse pl-s1">x</span></span></span> <span class="pl-sr">/<span class="pl-cce" data-key="pl-sr pl-cce">\\d</span><span class="pl-sre" data-key="pl-sr pl-sre">+</span><span class="pl-sra" data-key="pl-sr pl-sra">?=</span>/</span> <span class="pl-mh"><span class="pl-en" data-key="pl-mh pl-en">Head</span></span></td>
</tr>`;

/**
 * GitHubがMarkdownのファイルに描く、サンプルのGistにない要素(アラート、ゆるいリスト、小見出し、画像、言語名のないコードブロック、脚注)。
 * アラートは段落で終わるものと表で終わるもの、引用はゆるいリスト(項目が段落)で終える。どれも中の要素の余白が箱の端に漏れやすい形。
 * 見出しは入れ子にも置く(AsciiDoc の節の div の中、見出しで始まり見出しで終わる引用の中)
 */
const MARKDOWN_FIXTURE = `
<div id="gist-alert-fixture" class="markdown-alert markdown-alert-note" dir="auto"><p class="markdown-alert-title" dir="auto"><svg data-component="Octicon" class="octicon octicon-info mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Z"></path></svg>Note</p><p dir="auto">アラートの本文です。</p><markdown-accessiblity-table><table><thead><tr><th>項目</th></tr></thead><tbody><tr><td>値</td></tr></tbody></table></markdown-accessiblity-table></div>
<div id="gist-alert2-fixture" class="markdown-alert markdown-alert-tip" dir="auto"><p class="markdown-alert-title" dir="auto">Tip</p><p dir="auto">段落で終わるアラートです。</p></div>
<blockquote id="gist-quote-fixture"><ul dir="auto"><li><p dir="auto">ゆるいリストの項目</p></li><li><p dir="auto">最後の項目</p></li></ul></blockquote>
<div class="markdown-heading" dir="auto"><h6 id="gist-h6-fixture" class="heading-element" dir="auto">いちばん小さい見出し</h6></div>
<p dir="auto"><img id="gist-img-fixture" alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2000' height='400'%3E%3Crect width='2000' height='400' fill='%23888'/%3E%3C/svg%3E"></p>
<pre id="gist-pre-fixture"><code>curl "https://example.com/${'a'.repeat(160)}"
echo done</code></pre>
<div id="gist-section-fixture"><div class="markdown-heading" dir="auto"><h2 class="heading-element" dir="auto">節の見出し</h2></div><ul dir="auto"><li>節の中のリスト</li></ul></div>
<blockquote id="gist-quote3-fixture"><div class="markdown-heading" dir="auto"><h3 class="heading-element" dir="auto">引用の中の見出し</h3></div><p dir="auto">見出しの次の段落</p><markdown-accessiblity-table><table><thead><tr><th>表</th></tr></thead><tbody><tr><td>値</td></tr></tbody></table></markdown-accessiblity-table><p dir="auto">表の次の段落</p><div class="markdown-heading" dir="auto"><h4 class="heading-element" dir="auto">引用の最後の見出し</h4></div></blockquote>
<blockquote id="gist-quote2-fixture"><p dir="auto">引用の1つ目の段落</p><p dir="auto">引用の2つ目の段落</p></blockquote>
<section data-footnotes="" class="footnotes"><h2 id="gist-footnote-label" class="sr-only" dir="auto">Footnotes</h2><ol dir="auto"><li id="user-content-fn-gist-fixture"><p dir="auto">脚注の本文です。 <a href="#user-content-fnref-gist-fixture" data-footnote-backref="" class="data-footnote-backref" aria-label="Back to reference 1">↩</a></p></li></ol></section>`;

/**
 * サンプル記事を開き、Gistを画面に入れる。Gistは本文の要素として描画を後回しにしているので、スクロールして描かせてから測る
 * @param {any} page
 * @param {{ csv?: boolean, markdown?: boolean, highlight?: boolean }} [fixtures] サンプルのGistにない要素を足す
 */
const openGist = async (page, fixtures = {}) => {
  await page.navigateTo(TEST_URLS.SAMPLE_ARTICLE, { waitFor: 'networkidle' });
  await expect(page.locator(CODE_FILE).first(), '前提: サンプル記事に、コードのファイルのあるGistがあること').toBeAttached({ timeout: TIMEOUTS.VERY_LONG });
  await expect(page.locator(MARKDOWN_FILE).first(), '前提: サンプル記事に、MarkdownのファイルのあるGistがあること').toBeAttached();
  await expect(page.locator(ARTICLE_CODE).first(), '前提: サンプル記事に、比べるコードブロックがあること').toBeAttached();
  if (fixtures.highlight) {
    // 先頭と末尾の行は余白が違うので、2行目に足す
    await page.evaluate(({ code, html }) => {
      /** @type {Element} */ (document.querySelector(`${code} table.highlight tr`)).insertAdjacentHTML('afterend', html);
    }, { code: CODE_FILE, html: HIGHLIGHT_FIXTURE });
  }
  if (fixtures.markdown) {
    await page.evaluate(({ markdown, html }) => {
      /** @type {Element} */ (document.querySelector(`${markdown} .markdown-body`)).insertAdjacentHTML('beforeend', html);
    }, { markdown: MARKDOWN_FILE, html: MARKDOWN_FIXTURE });
  }
  if (fixtures.csv) {
    // 複数のファイルのGistと同じく、サンプルのGistの最後のファイルとして足す
    await page.evaluate(({ gist, html }) => {
      /** @type {Element} */ (document.querySelector(gist)).insertAdjacentHTML('beforeend', html);
    }, { gist: GIST, html: CSV_FIXTURE });
    await expect(page.locator(CSV_FILE)).toHaveCount(1);
  }
  await page.locator(GIST).first().scrollIntoViewIfNeeded();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  // ページの中で使う測り方を渡しておく(window.gistGlyphCenter)
  await page.evaluate(`window.gistGlyphCenter = ${glyphCenterScript.toString()}`);
};

/**
 * テーマの変数を、指定した要素の中で描いたときの色(rgb)にする。
 * ライトでもコードブロックを暗い地にする配色(ink、zenn、qiita)は、コードブロックの中だけ変数を置き換えるので、測る場所で値が変わる
 * @param {any} page
 * @param {string[]} names
 * @param {string} within
 */
const resolveColors = (page, names, within) => page.evaluate((/** @type {{ names: string[], within: string }} */ { names, within }) => {
  const host = document.querySelector(within);
  if (!host) throw new Error(`${within} がない`);
  const probe = document.createElement('span');
  host.appendChild(probe);
  const colors = Object.fromEntries(names.map((name) => {
    probe.style.color = `var(--${name})`;
    return [name, getComputedStyle(probe).color];
  }));
  probe.remove();
  return colors;
}, { names, within });

/**
 * 表のセルの、文字の行の上下の中心(画面の上からのpx)。セルの上端や余白ではなく、実際に描かれた文字で比べる。
 * 行番号は文字を持たず ::before に描くので、同じ行に文字を1つ足して測る
 * @param {Element} cell
 */
const glyphCenterScript = (cell) => {
  const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
  });
  let node = walker.nextNode();
  const added = node ? null : cell.appendChild(document.createTextNode('0'));
  node = node ?? added;
  const range = document.createRange();
  range.selectNodeContents(/** @type {Node} */ (node));
  const rect = range.getClientRects()[0];
  added?.remove();
  return rect ? rect.top + rect.height / 2 : null;
};

/** WCAGのコントラスト比(rgb()の値どうし) */
const contrast = (/** @type {string} */ foreground, /** @type {string} */ background) => {
  const luminance = (/** @type {string} */ value) => {
    const [r, g, b] = (value.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = luminance(foreground) + 0.05;
  const b = luminance(background) + 0.05;
  return Number((Math.max(a, b) / Math.min(a, b)).toFixed(2));
};

/**
 * 前提: ページがそのモードの配色になっていること。モードが効いていないと、ダークの回もライトの色を測って通ってしまう
 * @param {any} page
 * @param {'light' | 'dark'} mode
 */
const expectMode = async (page, mode) => {
  const colors = await resolveColors(page, ['background', 'text-body'], '.entry-content:not(.markdown-body)');
  const dark = contrast(colors.background, 'rgb(0, 0, 0)') < contrast(colors['text-body'], 'rgb(0, 0, 0)');
  expect(dark, `前提: ${mode} の配色になっていること(背景 ${colors.background}、本文 ${colors['text-body']})`).toBe(mode === 'dark');
};

test.describe('Gist埋め込み', () => {
  test('コードのファイル(帯を含む)とMarkdownのコードブロックは、どの配色とモードでも本文のコードブロックと同じ地・枠・余白・ハイライトの色になる', async ({ page }) => {
    await openGist(page, { highlight: true });

    for (const mode of MODES) {
      await page.emulateMedia({ colorScheme: mode });
      await expectMode(page, mode);
      for (const scheme of SCHEMES) {
        // 開発用ブログのデザインCSSの配色に左右されないよう、既定の配色も明示する(後から足した指定が勝つ)
        await page.addStyleTag({ content: schemeCss(scheme) });
        const label = `${mode} / ${scheme}`;
        const styles = await page.evaluate(({ code, markdown, article }) => {
          const file = /** @type {Element} */ (document.querySelector(code));
          const pre = /** @type {Element} */ (document.querySelector(article));
          const style = (/** @type {Element | null} */ el, /** @type {string | undefined} */ pseudo = undefined) => {
            if (!el) throw new Error('測る要素がない');
            return getComputedStyle(el, pseudo);
          };
          // 帯の描かれる高さ。コードブロックの帯(::before)は content-box なので、枠と余白を足す
          const outerHeight = (/** @type {CSSStyleDeclaration} */ s) => s.boxSizing === 'border-box'
            ? parseFloat(s.height)
            : ['height', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((sum, p) => sum + parseFloat(/** @type {any} */ (s)[p]), 0);
          const band = /** @type {Element} */ (file.querySelector('.gist-meta'));
          const codeLine = style(file.querySelector('.blob-code-inner'));
          const preStyle = style(pre);
          const preBand = style(pre, '::before');
          const markdownPre = style(document.querySelector(`${markdown} .markdown-body pre`));
          // 要素の後ろに実際に塗られている色(透明な祖先を飛ばした、いちばん近い地)
          const painted = (/** @type {Element | null} */ el) => {
            for (let node = el; node; node = node.parentElement) {
              const color = getComputedStyle(node).backgroundColor;
              if (color !== 'rgba(0, 0, 0, 0)') return color;
            }
            return null;
          };
          return {
            // GitHubはコードの表と中身の領域も白で塗る。コードの後ろに塗られる色が、コードブロックと同じ地になること
            paintedBehindCode: painted(file.querySelector('.blob-code-inner')),
            // GitHubは言語名のあるコードブロックの囲み(.highlight)を白で塗る。pre の角丸の外に出るので、文書の地のままであること
            paintedBehindMarkdownPre: painted(document.querySelector(`${markdown} .markdown-body .highlight`)),
            markdownFile: style(document.querySelector(markdown)).backgroundColor,
            fileBackground: style(file).backgroundColor,
            preBackground: preStyle.backgroundColor,
            fileBorder: `${style(file).borderTopWidth} ${style(file).borderTopColor}`,
            preBorder: `${preStyle.borderTopWidth} ${preStyle.borderTopColor}`,
            fileRadius: style(file).borderTopLeftRadius,
            preRadius: preStyle.borderTopLeftRadius,
            bandBackground: style(band).backgroundColor,
            preBandBackground: preBand.backgroundColor,
            bandHeight: band.getBoundingClientRect().height,
            bandLine: `${style(band).borderBottomWidth} ${style(band).borderBottomColor}`,
            preBandLine: `${preBand.borderBottomWidth} ${preBand.borderBottomColor}`,
            preBandHeight: outerHeight(preBand),
            bandColor: style(band).color,
            preBandColor: preBand.color,
            bandType: { fontSize: style(band).fontSize, letterSpacing: style(band).letterSpacing, linkWeight: style(band.querySelector('a')).fontWeight },
            preBandType: { fontSize: preBand.fontSize, letterSpacing: preBand.letterSpacing, linkWeight: preBand.fontWeight },
            codeColor: codeLine.color,
            preColor: preStyle.color,
            codeFont: `${codeLine.fontSize} ${codeLine.fontFamily}`,
            preFont: `${preStyle.fontSize} ${preStyle.fontFamily}`,
            // 行の高さ・左右の余白・字間もコードブロックと同じ(左は行番号のセル、右はコードのセルの余白)
            codeMetrics: {
              lineHeight: style(file.querySelector('.blob-code')).lineHeight,
              paddingLeft: style(file.querySelector('.blob-num')).paddingLeft,
              paddingRight: style(file.querySelector('.blob-code')).paddingRight,
              letterSpacing: codeLine.letterSpacing,
              tabSize: codeLine.tabSize,
            },
            preMetrics: {
              lineHeight: preStyle.lineHeight,
              paddingLeft: preStyle.paddingLeft,
              paddingRight: preStyle.paddingRight,
              letterSpacing: preStyle.letterSpacing,
              tabSize: preStyle.tabSize,
            },
            // Markdownのコードブロックは言語名の帯を持たないので、上の余白は比べない
            markdownPre: [markdownPre.backgroundColor, markdownPre.color, markdownPre.borderTopWidth, markdownPre.borderTopColor, markdownPre.borderTopLeftRadius, markdownPre.lineHeight, markdownPre.paddingLeft, markdownPre.paddingRight, markdownPre.paddingBottom].join(' '),
            articlePre: [preStyle.backgroundColor, preStyle.color, preStyle.borderTopWidth, preStyle.borderTopColor, preStyle.borderTopLeftRadius, preStyle.lineHeight, preStyle.paddingLeft, preStyle.paddingRight, preStyle.paddingBottom].join(' '),
            markdownKeyword: (() => {
              const keyword = document.querySelector(`${markdown} .markdown-body .highlight .pl-k`);
              return keyword ? getComputedStyle(keyword).color : null;
            })(),
            // 入れ子の語は、どこに入れ子になっているか(data-key)で区別する
            highlight: Object.fromEntries([...file.querySelectorAll('#gist-highlight-fixture [class^="pl-"]')].map((el) => {
              const s = getComputedStyle(el);
              return [/** @type {HTMLElement} */ (el).dataset.key ?? el.className, [s.color, s.backgroundColor, s.fontWeight, s.textDecorationLine, s.textDecorationStyle].join(' ')];
            })),
          };
        }, { code: CODE_FILE, markdown: MARKDOWN_FILE, article: ARTICLE_CODE });

        expect.soft(styles.fileBackground, `${label}: コードの地`).toBe(styles.preBackground);
        expect.soft(styles.paintedBehindCode, `${label}: コードの後ろに塗られる色`).toBe(styles.preBackground);
        expect.soft(styles.paintedBehindMarkdownPre, `${label}: Markdownのコードブロックの囲みの地`).toBe(styles.markdownFile);
        expect.soft(styles.fileBorder, `${label}: 枠`).toBe(styles.preBorder);
        expect.soft(styles.fileRadius, `${label}: 角丸`).toBe(styles.preRadius);
        // ファイル名の帯は、コードブロックの言語名の帯と同じ形(帯の下の線を含めた高さ)
        expect.soft(styles.bandBackground, `${label}: 帯の地`).toBe(styles.preBandBackground);
        expect.soft(styles.bandHeight, `${label}: 帯の高さ`).toBeCloseTo(styles.preBandHeight, 1);
        expect.soft(styles.bandLine, `${label}: 帯の下の線`).toBe(styles.preBandLine);
        expect.soft(styles.bandColor, `${label}: 帯の文字`).toBe(styles.preBandColor);
        expect.soft(styles.bandType, `${label}: 帯の文字の大きさ・字間・リンクの太さ`).toEqual(styles.preBandType);
        expect.soft(styles.codeColor, `${label}: コードの文字`).toBe(styles.preColor);
        expect.soft(styles.codeFont, `${label}: コードの書体`).toBe(styles.preFont);
        expect.soft(styles.codeMetrics, `${label}: コードの行の高さ・余白・字間・タブの幅`).toEqual(styles.preMetrics);
        // Markdownの中のコードブロックも、ink・zenn・qiitaの暗い地を含めて本文のコードブロックと同じ色
        expect.soft(styles.markdownPre, `${label}: Markdownのコードブロック`).toBe(styles.articlePre);
        const inMarkdownPre = await resolveColors(page, ['code-keyword'], `${MARKDOWN_FILE} .markdown-body .highlight pre`);
        expect.soft(styles.markdownKeyword, `${label}: 前提: Markdownのコードブロックにハイライトがあること`).not.toBeNull();
        expect.soft(styles.markdownKeyword, `${label}: Markdownのコードブロックのキーワード`).toBe(inMarkdownPre['code-keyword']);

        // GitHubのハイライトの種類を、はてなのハイライトと同じ種類のテーマの色に付け直す(GitHubの固定のライトの色を使わない)。
        // 主な種類の対応は theme-design-spec.md の「Gist埋め込み」の表にある
        const c = await resolveColors(page, ['code-text', 'code-keyword', 'code-function', 'code-type', 'code-preproc', 'code-constant', 'code-special', 'code-comment',
          'code-diff-added', 'code-diff-added-bg', 'code-diff-removed', 'code-diff-removed-bg'], CODE_FILE);
        // 文字色・地・太さ・下線。構文の誤り(.pl-ii)は色だけに頼らず波線でも示す
        const look = (/** @type {string} */ color, { bg = 'rgba(0, 0, 0, 0)', weight = '400', line = 'none solid' } = {}) => [color, bg, weight, line].join(' ');
        const expected = {
          'pl-k': look(c['code-keyword']),
          'pl-ent': look(c['code-keyword']),
          'pl-en': look(c['code-function']),
          'pl-e': look(c['code-function']),
          'pl-smi': look(c['code-type']),
          'pl-v': look(c['code-type']),
          'pl-smw': look(c['code-type']),
          'pl-c1': look(c['code-constant']),
          'pl-s': look(c['code-constant']),
          'pl-sr': look(c['code-constant']),
          'pl-ml': look(c['code-constant']),
          'pl-mc': look(c['code-constant']),
          'pl-corl': look(c['code-constant'], { line: 'underline solid' }),
          // 文字列の中の式はコードの文字の色
          'pl-s1': look(c['code-text']),
          'pl-cce': look(c['code-special']),
          'pl-pse': look(c['code-special']),
          'pl-bu': look(c['code-special']),
          'pl-c2': look(c['code-special']),
          'pl-ii': look(c['code-special'], { line: 'underline wavy' }),
          'pl-c': look(c['code-comment']),
          'pl-ba': look(c['code-comment']),
          'pl-sg': look(c['code-comment']),
          'pl-mi2': look(c['code-comment']),
          'pl-mh': look(c['code-function'], { weight: '700' }),
          'pl-ms': look(c['code-function'], { weight: '700' }),
          'pl-mi': look(c['code-text']),
          'pl-mb': look(c['code-text'], { weight: '700' }),
          'pl-mdr': look(c['code-preproc'], { weight: '700' }),
          'pl-mi1': look(c['code-diff-added'], { bg: c['code-diff-added-bg'] }),
          'pl-md': look(c['code-diff-removed'], { bg: c['code-diff-removed-bg'] }),
          // GitHubがクラスを重ねて色を決める入れ子の語も、テーマの色にする
          'pl-s pl-pds': look(c['code-constant']),
          'pl-s pl-v': look(c['code-constant']),
          'pl-s pl-pse': look(c['code-special']),
          'pl-s pl-pse pl-s1': look(c['code-special']),
          'pl-sr pl-cce': look(c['code-special']),
          'pl-sr pl-sre': look(c['code-constant']),
          'pl-sr pl-sra': look(c['code-constant']),
          'pl-mh pl-en': look(c['code-function'], { weight: '700' }),
        };
        expect.soft(Object.keys(styles.highlight).sort(), `${label}: 前提: ハイライトの語がすべてあること`).toEqual(Object.keys(expected).sort());
        for (const [cls, color] of Object.entries(expected)) {
          expect.soft(styles.highlight[cls], `${label}: .${cls} の色と地`).toBe(color);
        }
      }
    }
  });

  test('行番号は小さめの補助テキストの色で、罫線を引かず、コピーで選ばれず、コードの行と同じ位置に並ぶ', async ({ page }) => {
    await openGist(page);

    for (const mode of MODES) {
      await page.emulateMedia({ colorScheme: mode });
      await expectMode(page, mode);
      const lines = await page.evaluate(({ code, article }) => {
        const file = /** @type {Element} */ (document.querySelector(code));
        const pre = /** @type {Element} */ (document.querySelector(article));
        const rows = [...file.querySelectorAll('.blob-wrapper tr')];
        const cell = (/** @type {Element} */ row, /** @type {string} */ cls) => /** @type {Element} */ (row.querySelector(cls));
        const glyphCenter = /** @type {any} */ (window).gistGlyphCenter;
        const first = rows[0];
        const last = rows[rows.length - 1];
        const style = (/** @type {Element} */ el) => getComputedStyle(el);
        return {
          rows: rows.length,
          number: (({ fontSize, lineHeight, color, userSelect, borderTopWidth, borderRightWidth, opacity, cursor, letterSpacing }) => ({ fontSize, lineHeight, color, userSelect, borderTopWidth, borderRightWidth, opacity, cursor, letterSpacing }))(style(cell(first, '.blob-num'))),
          code: (({ lineHeight, borderTopWidth, verticalAlign }) => ({ lineHeight, borderTopWidth, verticalAlign }))(style(cell(first, '.blob-code'))),
          codeFontSize: style(cell(first, '.blob-code-inner')).fontSize,
          // 同じ行のセルは上端と高さが必ず揃うので、セルではなく描かれた文字の位置で比べる。空の行(文字のないコード)は除く
          offsets: rows
            .filter((row) => cell(row, '.blob-code').textContent?.trim())
            .map((row) => Math.round((glyphCenter(cell(row, '.blob-num')) - glyphCenter(cell(row, '.blob-code'))) * 10) / 10),
          firstPadding: [style(cell(first, '.blob-num')).paddingTop, style(cell(first, '.blob-code')).paddingTop],
          lastPadding: [style(cell(last, '.blob-num')).paddingBottom, style(cell(last, '.blob-code')).paddingBottom],
          // コードブロックの帯の下の余白(帯の文字の1em)と、コードブロックの下の余白
          preTop: getComputedStyle(pre, '::before').marginBottom,
          preBottom: style(pre).paddingBottom,
        };
      }, { code: CODE_FILE, article: ARTICLE_CODE });
      const colors = await resolveColors(page, ['text-light'], CODE_FILE);

      expect(lines.rows, '前提: Gistのコードが2行以上あること').toBeGreaterThan(1);
      expect(lines.number.color, `${mode}: 行番号の色`).toBe(colors['text-light']);
      expect(parseFloat(lines.number.fontSize), `${mode}: 行番号はコードより小さい`).toBeLessThan(parseFloat(lines.codeFontSize));
      // 透明度で薄くしない(コントラストは contrast.spec.js で測る)
      expect(lines.number.opacity).toBe('1');
      // 本文の表の罫線が行番号とコードに混ざらない
      expect(lines.number.borderTopWidth).toBe('0px');
      expect(lines.number.borderRightWidth).toBe('0px');
      expect(lines.code.borderTopWidth).toBe('0px');
      // コピーで選ばれない(GitHubのCSSのまま)。押しても何も起きないので、指のカーソルにしない
      expect(lines.number.userSelect).toBe('none');
      expect(lines.number.cursor).toBe('default');
      // 本文の字間を引き継がない(桁が揃う)
      expect(lines.number.letterSpacing).toBe('normal');
      // 行番号はコードより小さい文字でも、行の高さが揃って、各行の文字の横に並ぶ
      expect(lines.number.lineHeight).toBe(lines.code.lineHeight);
      expect(lines.offsets.length, '前提: 文字のある行が2行以上あること').toBeGreaterThan(1);
      expect(lines.offsets.every((offset) => Math.abs(offset) <= 1), `${mode}: 行番号とコードの文字の上下の中心の差 ${lines.offsets.join(', ')}`).toBe(true);
      // 先頭の行の上と末尾の行の下は、コードブロックと同じだけ空ける(GitHubのCSSの !important に負けない)
      expect(lines.firstPadding).toEqual([lines.preTop, lines.preTop]);
      expect(lines.lastPadding).toEqual([lines.preBottom, lines.preBottom]);
    }
  });

  test('ファイル名の帯はファイルの上に置き、「view raw」は右端、リンクは24px以上の高さにする。高さは制限しない', async ({ page }) => {
    await openGist(page);

    const files = await page.evaluate((gist) => [...document.querySelectorAll(`${gist} .gist-file`)].map((file) => {
      const band = /** @type {Element} */ (file.querySelector('.gist-meta'));
      const data = /** @type {Element} */ (file.querySelector('.gist-data'));
      const body = /** @type {Element} */ (file.querySelector('.Box-body'));
      const raw = /** @type {Element} */ (band.querySelector('a[href*="/raw/"]'));
      const bandRect = band.getBoundingClientRect();
      return {
        bandAboveData: bandRect.bottom <= data.getBoundingClientRect().top + 1,
        bandAtTop: Math.abs(bandRect.top - file.getBoundingClientRect().top - parseFloat(getComputedStyle(file).borderTopWidth)) < 1,
        rawRightGap: Math.round(bandRect.right - raw.getBoundingClientRect().right),
        bandPaddingRight: Math.round(parseFloat(getComputedStyle(band).paddingRight)),
        // GitHubの表記(hosted with ❤ by GitHub)は出したまま
        text: band.textContent?.replace(/\s+/g, ' ').trim(),
        // 表記の文字(リンクの外)とファイル名の文字の上下の中心の差。帯の項目は上下中央に揃える
        textOffset: (() => {
          const center = (/** @type {Node} */ node) => {
            const range = document.createRange();
            range.selectNodeContents(node);
            const r = range.getBoundingClientRect();
            return r.top + r.height / 2;
          };
          const words = /** @type {Node} */ ([...band.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.includes('hosted')));
          const name = /** @type {Element} */ (band.querySelector('a:not([href*="/raw/"])'));
          return Math.round((center(words) - center(name)) * 10) / 10;
        })(),
        linkHeights: [...band.querySelectorAll('a')].map((a) => a.getBoundingClientRect().height),
        // 中身は全部表示する。縦にスクロールしない
        verticalScroll: body.scrollHeight - body.clientHeight,
        // 中身の下に線を引かない(GitHubは固定の明るい色で引く。区切りは帯の下の線だけ)
        dataLine: getComputedStyle(data).borderBottomStyle,
        // 前のファイルとの間隔
        gap: file.previousElementSibling ? Math.round(file.getBoundingClientRect().top - file.previousElementSibling.getBoundingClientRect().bottom) : null,
      };
    }), GIST);

    expect(files.length, '前提: Gistにファイルが2つ以上あること').toBeGreaterThan(1);
    for (const file of files) {
      expect(file.bandAboveData, `${file.text}: 帯が中身の上にある`).toBe(true);
      expect(file.bandAtTop, `${file.text}: 帯がファイルの枠の上端にある`).toBe(true);
      expect(file.rawRightGap, `${file.text}: view raw が帯の右端(余白の内側)にある`).toBe(file.bandPaddingRight);
      expect(file.text).toContain('hosted with ❤ by GitHub');
      for (const height of file.linkHeights) {
        expect(height, `${file.text}: 帯のリンクのタップ領域`).toBeGreaterThanOrEqual(24);
      }
      expect(file.verticalScroll, `${file.text}: 中身が縦にスクロールしない`).toBeLessThanOrEqual(1);
      expect(Math.abs(file.textOffset), `${file.text}: 帯の表記とファイル名の上下の中心の差`).toBeLessThanOrEqual(1);
      expect(file.dataLine, `${file.text}: 中身の下の線`).toBe('none');
    }
    // 同じGistのファイルどうしは、本文の段落の間より狭い16pxで続ける
    expect(files.slice(1).map((file) => file.gap)).toEqual(files.slice(1).map(() => 16));

    // 帯の地とスクロールバーは、ファイルの角丸で切る(切らないと、四角い帯の角が角丸の外に出る)
    const clip = await page.evaluate((gist) => [...document.querySelectorAll(`${gist} .gist-file`)].map((file) => getComputedStyle(file).overflow), GIST);
    expect(clip.every((overflow) => overflow === 'hidden'), `ファイルの overflow ${clip.join(', ')}`).toBe(true);

    // 帯のリンクに指を乗せると、リンク色と下線で示す
    await page.locator(`${CODE_FILE} .gist-meta a`).first().hover();
    const bandHover = await page.evaluate((code) => {
      const s = getComputedStyle(/** @type {Element} */ (document.querySelector(`${code} .gist-meta a:hover`)));
      return { color: s.color, line: s.textDecorationLine };
    }, CODE_FILE);
    expect(bandHover).toEqual({ color: (await resolveColors(page, ['link'], CODE_FILE)).link, line: 'underline' });

    // 行番号に指を乗せても、GitHubの濃い文字色にしない
    await page.locator(`${CODE_FILE} .blob-num`).first().hover();
    const hovered = await page.evaluate((code) => getComputedStyle(/** @type {Element} */ (document.querySelector(`${code} .blob-num:hover`))).color, CODE_FILE);
    expect(hovered).toBe((await resolveColors(page, ['text-light'], CODE_FILE))['text-light']);

    // デザインCSSでGistの高さを制限する書き方(テーマより後に読み込む)。はみ出たコードは、中でスクロールして読める
    await page.addStyleTag({ content: '.gist .gist-data { max-height: 120px; }' });
    const capped = await page.evaluate((code) => {
      const data = /** @type {Element} */ (document.querySelector(`${code} .gist-data`));
      return { height: data.clientHeight, hidden: data.scrollHeight - data.clientHeight, overflow: getComputedStyle(data).overflowY };
    }, CODE_FILE);
    expect(capped.height, '前提: 高さの制限が効いていること').toBeLessThanOrEqual(120);
    expect(capped.hidden, '前提: 制限した高さにコードが収まらないこと').toBeGreaterThan(0);
    expect(capped.overflow, '制限した高さを超えたコードは中でスクロールする').toBe('auto');
  });

  for (const [kind, name] of Object.entries({
    // 名前は1行に収まるが、帯の中のほかのリンク(view raw)が次の行に送られる
    帯の項目が折り返す長さのファイル名: 'appsettings.Development.json',
    // 「_」「.」では折り返せないので、スマホの幅では1語のまま帯の幅を超える
    帯の幅を超える長いファイル名: 'test_user_authentication_service_integration_with_mocks_v2.py',
  })) {
    test(`${kind}でも、ファイル名は帯の中に収まり、リンクのフォーカスの枠も切れない`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.MOBILE_STANDARD);
      await openGist(page);

      const band = await page.evaluate(({ code, reach, fileName }) => {
        const meta = /** @type {Element} */ (document.querySelector(`${code} .gist-meta`));
        const link = /** @type {Element} */ (meta.querySelector('a:not([href*="/raw/"])'));
        const singleLine = meta.getBoundingClientRect().height;
        link.textContent = fileName;
        const rect = meta.getBoundingClientRect();
        const borderBottom = parseFloat(getComputedStyle(meta).borderBottomWidth);
        return {
          singleLine,
          wrapped: rect.height,
          // フォーカスの枠は帯とファイルの overflow: hidden で切れるので、リンクの四方に枠の届く幅が要る。
          // リンクの箱が縮んでも文字が箱からはみ出すことがあるので、箱と描かれた文字の両方を含む範囲で測る
          room: [...meta.querySelectorAll('a')].map((a) => {
            const range = document.createRange();
            range.selectNodeContents(a);
            const box = a.getBoundingClientRect();
            const text = range.getBoundingClientRect();
            const r = {
              top: Math.min(box.top, text.top),
              bottom: Math.max(box.bottom, text.bottom),
              left: Math.min(box.left, text.left),
              right: Math.max(box.right, text.right),
            };
            return {
              text: a.textContent?.trim(),
              top: r.top - rect.top - reach,
              bottom: rect.bottom - borderBottom - r.bottom - reach,
              left: r.left - rect.left - reach,
              right: rect.right - r.right - reach,
            };
          }),
        };
      }, { code: CODE_FILE, reach: FOCUS_RING_REACH, fileName: name });

      expect(band.wrapped, '前提: 長いファイル名で帯が折り返すこと').toBeGreaterThan(band.singleLine);
      for (const link of band.room) {
        expect(link.top, `${link.text}: 上の空き`).toBeGreaterThanOrEqual(0);
        expect(link.bottom, `${link.text}: 下の空き`).toBeGreaterThanOrEqual(0);
        expect(link.left, `${link.text}: 左の空き`).toBeGreaterThanOrEqual(0);
        expect(link.right, `${link.text}: 右の空き`).toBeGreaterThanOrEqual(0);
      }
    });
  }

  test('GitHubが書き出す注意書き(大きいファイルの省略など)も、どの配色とモードでもファイルの地の上で読め、文書と同じ余白に置く', async ({ page }) => {
    await openGist(page);
    // GitHubは大きいファイルの中身を省略し、注意書きを出す。コードのファイルの省略(.render-notice)と、
    // 中身を出さないファイル(text-center。GitHubの埋め込み用のCSSに指定がない)の両方を足す。
    // 地図などの表示(.render-container)は、GitHubのスクリプトがないと読み込み中の読み上げ用の文字(.sr-only)のまま残る
    await page.evaluate(({ code, gist }) => {
      /** @type {Element} */ (document.querySelector(`${code} .Box-body`)).insertAdjacentHTML('afterbegin',
        '<div id="gist-notice-fixture" class="render-notice">This file has been truncated, but you can <a href="https://gist.github.com/">view the full file</a>.</div>');
      /** @type {Element} */ (document.querySelector(gist)).insertAdjacentHTML('beforeend', `
        <div id="gist-big-fixture" class="gist-file" translate="no" data-color-mode="light" data-light-theme="light">
          <div class="gist-data"><div class="js-gist-file-update-container js-task-list-container"><div class="file my-2">
            <div itemprop="text" class="Box-body p-0 blob-wrapper data type-text" style="overflow: auto" tabindex="0" role="region" aria-label="big.json content">
              <div class="text-center tmp-p-3"><a href="https://gist.github.com/fixture/raw/big.json">View raw</a><p>(Sorry about that, but we can’t show files that are this big right now.)</p></div>
            </div>
          </div></div></div>
          <div class="gist-meta"><a href="https://gist.github.com/fixture/raw/big.json" style="float:right">view raw</a><a href="https://gist.github.com/fixture#file-big-json">big.json</a> hosted with &#10084; by <a href="https://github.com">GitHub</a></div>
        </div>
        <div id="gist-image-fixture" class="gist-file" translate="no" data-color-mode="light" data-light-theme="light">
          <div class="gist-data"><div class="js-gist-file-update-container js-task-list-container"><div class="file my-2">
            <div itemprop="text" class="Box-body p-0 blob-wrapper data type-png" style="overflow: auto" tabindex="0" role="region" aria-label="image.png content">
              <div class="text-center"><span class="border-wrap"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='120'%3E%3Crect width='320' height='120' fill='%23888'/%3E%3C/svg%3E" alt="image.png"></span></div>
            </div>
          </div></div></div>
          <div class="gist-meta"><a href="https://gist.github.com/fixture/raw/image.png" style="float:right">view raw</a><a href="https://gist.github.com/fixture#file-image-png">image.png</a> hosted with &#10084; by <a href="https://github.com">GitHub</a></div>
        </div>
        <div id="gist-render-fixture" class="gist-file" translate="no" data-color-mode="light" data-light-theme="light">
          <div class="gist-data"><div class="js-gist-file-update-container js-task-list-container"><div class="file my-2">
            <div class="render-wrapper"><div class="render-container is-render-pending"><span><span class="sr-only">Loading</span></span></div></div>
          </div></div></div>
          <div class="gist-meta"><a href="https://gist.github.com/fixture/raw/map.topojson" style="float:right">view raw</a><a href="https://gist.github.com/fixture#file-map-topojson">map.topojson</a> hosted with &#10084; by <a href="https://github.com">GitHub</a></div>
        </div>`);
    }, { code: CODE_FILE, gist: GIST });

    for (const mode of MODES) {
      await page.emulateMedia({ colorScheme: mode });
      await expectMode(page, mode);
      for (const scheme of SCHEMES) {
        await page.addStyleTag({ content: schemeCss(scheme) });
        const notices = await page.evaluate(({ code }) => [
          { name: 'コードのファイルの省略', text: '#gist-notice-fixture', file: code },
          { name: '中身を出さないファイル', text: '#gist-big-fixture .text-center p', file: '#gist-big-fixture' },
        ].map(({ name, text, file }) => ({
          name,
          color: getComputedStyle(/** @type {Element} */ (document.querySelector(text))).color,
          background: getComputedStyle(/** @type {Element} */ (document.querySelector(file))).backgroundColor,
        })), { code: CODE_FILE });
        for (const notice of notices) {
          expect.soft(contrast(notice.color, notice.background), `${mode} / ${scheme}: ${notice.name} ${notice.color} on ${notice.background}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }

    const layout = await page.evaluate((markdown) => {
      const big = getComputedStyle(/** @type {Element} */ (document.querySelector('#gist-big-fixture .text-center')));
      const readme = getComputedStyle(/** @type {Element} */ (document.querySelector(`${markdown} .Box-body.readme`)));
      return {
        big: { padding: `${big.paddingTop} ${big.paddingLeft}`, align: big.textAlign },
        readme: `${readme.paddingTop} ${readme.paddingLeft}`,
        loading: /** @type {Element} */ (document.querySelector('#gist-render-fixture .sr-only')).getBoundingClientRect().height,
        // 注意書きは本文の書体(GitHubはファイル全体を等幅の書体にしている)
        fonts: ['#gist-notice-fixture', '#gist-big-fixture .text-center p'].map((s) => getComputedStyle(/** @type {Element} */ (document.querySelector(s))).fontFamily),
        bodyFont: getComputedStyle(/** @type {Element} */ (document.querySelector('.entry-content:not(.markdown-body) > p'))).fontFamily,
        // 画像のファイルも、Markdownの画像と同じ小さい角丸
        imageRadius: getComputedStyle(/** @type {Element} */ (document.querySelector('#gist-image-fixture img'))).borderTopLeftRadius,
        radiusSmall: getComputedStyle(document.documentElement).getPropertyValue('--radius-small').trim(),
      };
    }, MARKDOWN_FILE);
    // 中身を出さないファイルの注意書きは、文書と同じ余白で中央に置く(GitHub上と同じ並び)
    expect(layout.big).toEqual({ padding: layout.readme, align: 'center' });
    expect(layout.loading, '読み上げ用の文字は画面に出さない').toBeLessThanOrEqual(1);
    expect(layout.fonts, '注意書きの書体').toEqual(layout.fonts.map(() => layout.bodyFont));
    expect(layout.imageRadius, '画像のファイルの角丸').toBe(layout.radiusSmall);
  });

  test('reStructuredTextのファイルも、文書の先頭の見出しの上を空けない', async ({ page }) => {
    await openGist(page);
    // GitHubは reStructuredText の文書の先頭に、空のリンク先(<a name>)を置く。見出しが文書の最初の要素ではなくなる
    const gap = await page.evaluate((markdown) => {
      const body = /** @type {Element} */ (document.querySelector(`${markdown} .markdown-body`));
      body.insertAdjacentHTML('afterbegin', '<a name="user-content-gist-rst-fixture"></a>');
      const heading = /** @type {Element} */ (body.querySelector('.markdown-heading'));
      const s = getComputedStyle(body);
      return Math.round(heading.getBoundingClientRect().top - (body.getBoundingClientRect().top + parseFloat(s.paddingTop)));
    }, MARKDOWN_FILE);
    expect(gap).toBe(0);
  });

  test('定義リストで始まる文書も、最初の項目の上を空けない', async ({ page }) => {
    await openGist(page);
    // GitHubのCSSは定義リストの項目(dt)の上に余白を付ける。最初の項目の余白は、リストを抜けて文書の先頭に出る
    const gap = await page.evaluate((markdown) => {
      const body = /** @type {Element} */ (document.querySelector(`${markdown} .markdown-body`));
      body.insertAdjacentHTML('afterbegin', '<dl><dt>用語</dt><dd>用語の説明</dd></dl>');
      const s = getComputedStyle(body);
      return Math.round(/** @type {Element} */ (body.querySelector('dt')).getBoundingClientRect().top - (body.getBoundingClientRect().top + parseFloat(s.paddingTop)));
    }, MARKDOWN_FILE);
    expect(gap).toBe(0);
  });

  test('AsciiDocのファイルも、文書の最後の要素の下を空けない', async ({ page }) => {
    await openGist(page);
    // GitHubは AsciiDoc の節・段落・リストを div で包む。文書の最後の要素が、文書の直下ではなく包みの中にある
    const gap = await page.evaluate((markdown) => {
      const body = /** @type {Element} */ (document.querySelector(`${markdown} .markdown-body`));
      body.insertAdjacentHTML('beforeend', '<div><div class="markdown-heading"><h2 class="heading-element">最後の節</h2></div><div><div><p>節の段落</p></div><div><ul><li>節の最後のリスト</li></ul></div></div></div>');
      const readme = /** @type {Element} */ (body.closest('.Box-body'));
      const s = getComputedStyle(readme);
      const inner = readme.getBoundingClientRect().bottom - parseFloat(s.borderBottomWidth) - parseFloat(s.paddingBottom);
      return Math.round((inner - /** @type {Element} */ (body.querySelector(':scope > :last-child ul')).getBoundingClientRect().bottom) * 10) / 10;
    }, MARKDOWN_FILE);
    expect(gap).toBeLessThanOrEqual(0.5);
  });

  test('ファイルの中身の領域のフォーカスの枠は、内側に描く', async ({ page }) => {
    await openGist(page);

    // 中身の領域はファイルの枠の内側いっぱいにあり、ファイルは overflow: hidden なので、外側の枠は切れて見えない
    const rings = await page.evaluate((gist) => [...document.querySelectorAll(`${gist} .Box-body`)].map((element) => {
      const body = /** @type {HTMLElement} */ (element);
      body.focus();
      const style = getComputedStyle(body);
      return {
        file: body.getAttribute('aria-label'),
        focusVisible: body.matches(':focus-visible'),
        outline: style.outlineStyle,
        reach: parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth),
      };
    }), GIST);

    expect(rings.length, '前提: コードとMarkdownのファイルの中身の領域があること').toBeGreaterThan(1);
    for (const ring of rings) {
      expect(ring.focusVisible, `${ring.file}: 前提: キーボードのフォーカスの枠が出る状態であること`).toBe(true);
      expect(ring.outline, ring.file ?? '').not.toBe('none');
      expect(ring.reach, `${ring.file}: 枠が中身の領域の内側に収まる`).toBeLessThanOrEqual(0);
    }
  });

  test('Markdownのファイルは、どのモードでも本文と同じ書体・文字色・リンク色・枠・引用・表・コードの文書にする', async ({ page }) => {
    await openGist(page);

    for (const mode of MODES) {
      await page.emulateMedia({ colorScheme: mode });
      await expectMode(page, mode);
      const styles = await page.evaluate(({ markdown, articleCode }) => {
        const file = /** @type {Element} */ (document.querySelector(markdown));
        const body = /** @type {Element} */ (file.querySelector('.markdown-body'));
        const readme = /** @type {Element} */ (file.querySelector('.Box-body.readme'));
        const article = /** @type {Element} */ (document.querySelector('.entry-content:not(.markdown-body)'));
        const pick = (/** @type {Element | null} */ el, /** @type {string[]} */ props) => {
          if (!el) return null;
          const style = getComputedStyle(el);
          return Object.fromEntries(props.map((p) => [p, style.getPropertyValue(p)]));
        };
        const frameProps = ['border-top-width', 'border-top-color', 'border-top-left-radius'];
        const quoteProps = ['border-left-width', 'border-left-color', 'border-top-right-radius', 'background-color', 'color', 'padding-top', 'padding-left'];
        const headerProps = ['background-color', 'color', 'font-weight'];
        const codeProps = ['font-size', 'font-family', 'background-color', 'color', 'border-top-left-radius'];
        const inlineCodeProps = ['font-size', 'font-family', 'background-color', 'color', 'padding-top', 'padding-left', 'border-top-left-radius'];
        return {
          file: pick(file, ['background-color']),
          card: pick(article.closest('.entry'), ['background-color']),
          frame: pick(file, frameProps),
          articleFrame: pick(document.querySelector(articleCode), frameProps),
          // 文書の左端は、ファイル名の帯の文字の左端に揃える
          readmePadding: pick(readme, ['padding-top', 'padding-left']),
          bandPadding: pick(file.querySelector('.gist-meta'), ['padding-left']),
          body: pick(body.querySelector(':scope > p'), ['color', 'font-family', 'font-size', 'line-height', 'letter-spacing']),
          paragraph: pick(article.querySelector(':scope > p'), ['color', 'font-family', 'font-size', 'line-height', 'letter-spacing']),
          link: pick(body.querySelector('p a[href]'), ['color']),
          headings: [...body.querySelectorAll('h1, h2, h3')].map((h) => ({
            text: h.textContent,
            ...pick(h, ['color', 'font-size', 'background-image', 'border-bottom-style', 'padding-left']),
            before: getComputedStyle(h, '::before').content,
          })),
          // 記事の2番目の段の見出し(破線)。Gistの見出しはこれより小さい
          articleSecondHeading: (() => {
            const levels = ['h1', 'h2', 'h3', 'h4'].filter((h) => article.querySelector(`:scope > ${h}`));
            return pick(article.querySelector(`:scope > ${levels[1]}`), ['font-size']);
          })(),
          anchors: [...body.querySelectorAll('.anchor')].map((a) => getComputedStyle(a).display),
          header: pick(body.querySelector('th'), headerProps),
          articleHeader: pick(article.querySelector(':scope > table th'), headerProps),
          rule: pick(body.querySelector(':scope > hr'), ['height', 'background-color']),
          articleRule: pick(article.querySelector(':scope > hr'), ['height', 'background-color']),
          quote: pick(body.querySelector('blockquote'), quoteProps),
          articleQuote: pick(article.querySelector(':scope > blockquote:not(.markdown-alert)'), quoteProps),
          codeBlock: pick(body.querySelector('pre'), codeProps),
          articleCodeBlock: pick(document.querySelector(articleCode), codeProps),
          tableAligns: [...body.querySelectorAll('th')].map((th) => getComputedStyle(th).textAlign),
          rows: [...body.querySelectorAll('tbody tr')].map((tr) => getComputedStyle(tr).backgroundColor),
          cell: pick(body.querySelector('td'), ['border-top-color', 'padding-left']),
          articleCell: pick(article.querySelector(':scope > table td'), ['border-top-color', 'padding-left']),
          inlineCode: pick(body.querySelector('p code'), inlineCodeProps),
          articleInlineCode: pick(article.querySelector(':scope > p code'), inlineCodeProps),
          list: pick(body.querySelector(':scope > ul'), ['padding-left']),
          articleList: pick(article.querySelector(':scope > ul'), ['padding-left']),
          item: pick(body.querySelector(':scope > ul > li + li'), ['margin-top']),
          articleItem: pick(article.querySelector(':scope > ul > li + li'), ['margin-top']),
          // サンプルのGistの入れ子のリストは、最初の項目の中にある(項目の文字の後ろ)
          nestedLists: [...body.querySelectorAll(':scope > :is(ul, ol) > li > :is(ul, ol)')].map((l) => getComputedStyle(l).marginTop),
          articleNestedList: pick(article.querySelector(':scope > :is(ul, ol) > li > :is(ul, ol)'), ['margin-top']),
          // サンプルのGistにない段の見出しも、一時的に置いて大きさを測る
          allHeadingSizes: (() => {
            body.insertAdjacentHTML('beforeend', '<div id="gist-heading-sizes"><h1>1</h1><h2>2</h2><h3>3</h3><h4>4</h4><h5>5</h5><h6>6</h6></div>');
            const holder = /** @type {Element} */ (document.getElementById('gist-heading-sizes'));
            const sizes = [...holder.children].map((h) => parseFloat(getComputedStyle(h).fontSize));
            holder.remove();
            return sizes;
          })(),
          // Markdownの文書も本文と同じ .entry-content を持ち、直下の要素に描画の後回しの指定が当たる。Gistの中では描く
          deferred: [...body.children].filter((el) => getComputedStyle(el).contentVisibility === 'auto').length,
        };
      }, { markdown: MARKDOWN_FILE, articleCode: ARTICLE_CODE });
      const colors = await resolveColors(page, ['text-header', 'link'], MARKDOWN_FILE);

      // 枠の中は記事のカードと同じ地。枠と角丸は本文中の箱(コードブロック)と同じ
      expect(styles.file?.['background-color'], `${mode}: 文書の地`).toBe(styles.card?.['background-color']);
      expect(styles.frame, `${mode}: 文書の枠`).toEqual(styles.articleFrame);
      expect(parseFloat(styles.readmePadding?.['padding-top'] ?? '0'), '文書の上の余白').toBeGreaterThan(0);
      expect(styles.readmePadding?.['padding-left'], '文書の左の余白').toBe(styles.bandPadding?.['padding-left']);
      // 本文と同じ書体・文字色・行の高さ(ダークで暗い文字が残らない)
      expect(styles.body, `${mode}: 文書の文字`).toEqual(styles.paragraph);
      expect(styles.link, '前提: Gistの段落にリンクがあること').not.toBeNull();
      expect(styles.link?.color, `${mode}: リンク色`).toBe(colors.link);

      // 見出しは記事の見出しの印(帯・破線・縦棒)を使わず、記事の見出しより小さくする
      expect(styles.headings.length, '前提: Gistに見出しがあること').toBeGreaterThan(0);
      expect(styles.articleSecondHeading, '前提: 記事に2段以上の見出しがあること').not.toBeNull();
      for (const heading of styles.headings) {
        expect(heading.color, `${mode}: ${heading.text} の色`).toBe(colors['text-header']);
        expect(heading['background-image'], `${heading.text} に帯がない`).toBe('none');
        expect(heading['border-bottom-style'], `${heading.text} に下線がない`).toBe('none');
        expect(heading.before, `${heading.text} に縦棒がない`).toBe('none');
        expect(heading['padding-left'], `${heading.text} は縦棒のぶん字下げしない`).toBe('0px');
        expect(parseFloat(heading['font-size']), `${heading.text} は記事の2番目の段の見出しより小さい`).toBeLessThan(parseFloat(styles.articleSecondHeading?.['font-size'] ?? '0'));
      }
      // h1からh6まで段ごとに小さくし、どの段も記事の2番目の段の見出しより小さい
      const second = parseFloat(styles.articleSecondHeading?.['font-size'] ?? '0');
      expect(styles.allHeadingSizes.every((size, i) => size < second && (i === 0 || size < styles.allHeadingSizes[i - 1])),
        `見出しの大きさ ${styles.allHeadingSizes.join(' / ')}(記事の2番目の段 ${second})`).toBe(true);
      // GitHubのページの中へのパーマリンクは出さない(GitHubのCSSが隠している)
      expect(styles.anchors.length, '前提: Gistの見出しにパーマリンクがあること').toBeGreaterThan(0);
      expect(styles.anchors.every((display) => display === 'none')).toBe(true);

      expect(styles.articleQuote, '前提: 記事に引用があること').not.toBeNull();
      expect(styles.quote, `${mode}: 引用`).toEqual(styles.articleQuote);
      expect(styles.articleHeader, '前提: 記事の表に見出しのセルがあること').not.toBeNull();
      expect(styles.header, `${mode}: 表の見出しのセル`).toEqual(styles.articleHeader);
      expect(styles.rule, '前提: Gistに区切り線があること').not.toBeNull();
      expect(styles.articleRule, '前提: 記事に区切り線があること').not.toBeNull();
      expect(styles.rule, `${mode}: 区切り線`).toEqual(styles.articleRule);
      expect(styles.articleCodeBlock, '前提: 記事にコードブロックがあること').not.toBeNull();
      expect(styles.codeBlock, `${mode}: コードブロック`).toEqual(styles.articleCodeBlock);
      expect(styles.inlineCode, '前提: Gistの段落にインラインコードがあること').not.toBeNull();
      expect(styles.articleInlineCode, '前提: 記事の段落にインラインコードがあること').not.toBeNull();
      expect(styles.inlineCode, `${mode}: インラインコード`).toEqual(styles.articleInlineCode);
      // リストは本文のリストと同じ字下げと項目の間隔
      expect(styles.list, '前提: Gistにリストがあること').not.toBeNull();
      expect(styles.articleList, '前提: 記事にリストがあること').not.toBeNull();
      expect(styles.list).toEqual(styles.articleList);
      expect(styles.item, '前提: Gistのリストに2項目以上あること').not.toBeNull();
      expect(styles.item).toEqual(styles.articleItem);
      expect(styles.nestedLists.length, '前提: Gistに入れ子のリストがあること').toBeGreaterThan(0);
      expect(styles.articleNestedList, '前提: 記事に入れ子のリストがあること').not.toBeNull();
      expect(styles.nestedLists, `${mode}: 入れ子のリストの上`).toEqual(styles.nestedLists.map(() => styles.articleNestedList?.['margin-top']));

      // 表は本文の表と同じ罫線と余白。偶数の行を塗らない(GitHubは塗る)。列揃え(:--- / :---: / ---:)はMarkdownのまま
      expect(styles.articleCell, '前提: 記事に表があること').not.toBeNull();
      expect(styles.cell, `${mode}: 表のセル`).toEqual(styles.articleCell);
      expect(styles.rows.length, '前提: Gistの表に2行以上あること').toBeGreaterThan(1);
      expect(styles.rows.every((color) => color === 'rgba(0, 0, 0, 0)'), `${mode}: 表の行の地 ${styles.rows.join(', ')}`).toBe(true);
      expect(styles.tableAligns).toEqual([expect.stringMatching(/left$/), expect.stringMatching(/center$/), expect.stringMatching(/right$/)]);

      expect(styles.deferred).toBe(0);
    }
  });

  test('Markdownのアラート・小見出し・画像・言語名のないコードブロック・脚注も、本文と同じ形と読める色にする', async ({ page }) => {
    await openGist(page, { markdown: true });

    for (const mode of MODES) {
      await page.emulateMedia({ colorScheme: mode });
      await expectMode(page, mode);
      const styles = await page.evaluate(({ markdown, articleCode }) => {
        const file = /** @type {Element} */ (document.querySelector(markdown));
        const body = /** @type {Element} */ (file.querySelector('.markdown-body'));
        const alert = /** @type {Element} */ (document.getElementById('gist-alert-fixture'));
        const title = /** @type {Element} */ (alert.querySelector('.markdown-alert-title'));
        const img = /** @type {Element} */ (document.getElementById('gist-img-fixture'));
        const pre = /** @type {Element} */ (document.getElementById('gist-pre-fixture'));
        const articlePre = getComputedStyle(/** @type {Element} */ (document.querySelector(articleCode)));
        // 記事の本文のアラート(js/alert.js が変換した引用)。開発用ブログは js/alert.js を読み込んでいる
        const articleAlert = document.querySelector('.entry-content:not(.markdown-body) > .markdown-alert-note');
        const box = (/** @type {Element | null} */ el) => {
          if (!el) return null;
          const s = getComputedStyle(el);
          return { border: `${s.borderTopWidth} ${s.borderLeftWidth} ${s.borderTopColor}`, radius: s.borderTopLeftRadius, background: s.backgroundColor, color: s.color, padding: `${s.paddingTop} ${s.paddingLeft}` };
        };
        // 箱の余白の内側の下端と、最後の要素の下端の差。中の要素の余白が箱の端まで漏れると、余白の内側にさらに空きができる
        const bottomGap = (/** @type {Element} */ el) => {
          const s = getComputedStyle(el);
          const inner = el.getBoundingClientRect().bottom - parseFloat(s.borderBottomWidth) - parseFloat(s.paddingBottom);
          return Math.round((inner - /** @type {Element} */ (el.lastElementChild).getBoundingClientRect().bottom) * 10) / 10;
        };
        const icon = getComputedStyle(title, '::before');
        const footnoteProps = (/** @type {Element | null} */ el) => (el ? { fontSize: getComputedStyle(el).fontSize, color: getComputedStyle(el).color } : null);
        return {
          alertBox: box(alert),
          articleAlertBox: box(articleAlert),
          alert: {
            title: getComputedStyle(title).color,
            // アイコンはテーマのアラートと同じく ::before に描き、GitHubのアイコン(塗りの色がない)は出さない
            icon: { drawn: icon.content !== 'none' && icon.maskImage !== 'none' && parseFloat(icon.width) > 0, color: icon.backgroundColor },
            githubIcon: getComputedStyle(/** @type {Element} */ (title.querySelector('svg'))).display,
          },
          // アラートは表で、引用はゆるいリストで終わる(MARKDOWN_FIXTURE)。2つ目のアラートは段落で終わる
          alertGap: bottomGap(alert),
          alert2Gap: bottomGap(/** @type {Element} */ (document.getElementById('gist-alert2-fixture'))),
          quoteGap: bottomGap(/** @type {Element} */ (document.getElementById('gist-quote-fixture'))),
          quoteTopGap: (() => {
            const quote = /** @type {Element} */ (document.getElementById('gist-quote-fixture'));
            const qs = getComputedStyle(quote);
            const inner = quote.getBoundingClientRect().top + parseFloat(qs.borderTopWidth) + parseFloat(qs.paddingTop);
            const first = /** @type {Element} */ (quote.querySelector('li p'));
            return Math.round((first.getBoundingClientRect().top - inner) * 10) / 10;
          })(),
          // 引用の段落の間は、GitHubのCSSの余白(変数 --base-size-16)のまま
          quoteParagraphGap: (() => {
            const [a, b] = [...document.querySelectorAll('#gist-quote2-fixture > p')];
            return Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom);
          })(),
          tableWrapper: getComputedStyle(/** @type {Element} */ (body.querySelector('markdown-accessiblity-table'))).display,
          // 入れ子の見出し(AsciiDoc の節、引用の中)と表(引用の中)のまわりも空ける
          nestedGaps: (() => {
            const gap = (/** @type {Element} */ a, /** @type {Element} */ b) => Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom);
            const $ = (/** @type {string} */ selector) => /** @type {Element} */ (document.querySelector(selector));
            const section = $('#gist-section-fixture');
            return {
              sectionAbove: gap(/** @type {Element} */ (section.previousElementSibling), $('#gist-section-fixture .markdown-heading')),
              section: gap($('#gist-section-fixture .markdown-heading'), $('#gist-section-fixture ul')),
              quoteHeading: gap($('#gist-quote3-fixture .markdown-heading'), $('#gist-quote3-fixture .markdown-heading + p')),
              quoteTable: gap($('#gist-quote3-fixture markdown-accessiblity-table'), $('#gist-quote3-fixture markdown-accessiblity-table + p')),
            };
          })(),
          // 見出しで始まり見出しで終わる引用。見出しの余白が箱の端に漏れない
          quote3Edges: (() => {
            const quote = /** @type {Element} */ (document.getElementById('gist-quote3-fixture'));
            const qs = getComputedStyle(quote);
            const inner = quote.getBoundingClientRect().top + parseFloat(qs.borderTopWidth) + parseFloat(qs.paddingTop);
            return { top: Math.round((/** @type {Element} */ (quote.firstElementChild).getBoundingClientRect().top - inner) * 10) / 10, bottom: bottomGap(quote) };
          })(),
          ...(() => {
            const heading = /** @type {Element} */ (body.querySelector(':scope > .markdown-heading:not(:first-child)'));
            return {
              headingAbove: Math.round(heading.getBoundingClientRect().top - /** @type {Element} */ (heading.previousElementSibling).getBoundingClientRect().bottom),
              headingGap: Math.round(/** @type {Element} */ (heading.nextElementSibling).getBoundingClientRect().top - heading.getBoundingClientRect().bottom),
            };
          })(),
          // 言語名のないコードブロックの code は、インラインコードの形にしない(行を保ち、地を塗らない)
          preCode: (() => {
            const code = getComputedStyle(/** @type {Element} */ (pre.querySelector('code')));
            return { whiteSpace: code.whiteSpace, background: code.backgroundColor, fontSize: code.fontSize, padding: code.paddingLeft };
          })(),
          preFontSize: getComputedStyle(pre).fontSize,
          footnotes: footnoteProps(body.querySelector('.footnotes')),
          footnoteLine: getComputedStyle(/** @type {Element} */ (body.querySelector('.footnotes'))).borderTopColor,
          articleFootnotes: footnoteProps(document.querySelector('.entry-content:not(.markdown-body) > :is(.footnotes, .footnote)')),
          h6: getComputedStyle(/** @type {Element} */ (document.getElementById('gist-h6-fixture'))).color,
          img: {
            width: img.getBoundingClientRect().width,
            bodyWidth: body.getBoundingClientRect().width,
            radius: getComputedStyle(img).borderTopLeftRadius,
          },
          pre: `${getComputedStyle(pre).fontSize} ${getComputedStyle(pre).backgroundColor} ${getComputedStyle(pre).color}`,
          articlePre: `${articlePre.fontSize} ${articlePre.backgroundColor} ${articlePre.color}`,
          radiusSmall: getComputedStyle(document.documentElement).getPropertyValue('--radius-small').trim(),
        };
      }, { markdown: MARKDOWN_FILE, articleCode: ARTICLE_CODE });
      const colors = await resolveColors(page, ['alert-note', 'text-light', 'border'], MARKDOWN_FILE);

      // 枠・角丸・地・文字色・余白は、記事の本文のアラートと同じ
      expect(styles.articleAlertBox, '前提: 記事の本文にNoteのアラートがあること').not.toBeNull();
      expect(styles.alertBox, `${mode}: アラートの箱`).toEqual(styles.articleAlertBox);
      expect(styles.alert.title, `${mode}: アラートのタイトル`).toBe(colors['alert-note']);
      expect(styles.alert.icon, `${mode}: アラートのアイコン`).toEqual({ drawn: true, color: colors['alert-note'] });
      expect(styles.alert.githubIcon).toBe('none');
      // 表やゆるいリストで終わっても、箱の下に余白の内側の空きを残さない
      expect(styles.alertGap, 'アラートの下の空き').toBeLessThanOrEqual(0.5);
      expect(styles.alert2Gap, '段落で終わるアラートの下の空き').toBeLessThanOrEqual(0.5);
      expect(styles.quoteGap, '引用の下の空き').toBeLessThanOrEqual(0.5);
      expect(styles.quoteTopGap, '引用の上の空き').toBeLessThanOrEqual(0.5);
      expect(styles.quoteParagraphGap, '引用の段落の間').toBe(16);
      expect(styles.tableWrapper, '表の囲みはブロック(段落の間の余白を持つ)').toBe('block');
      // 見出しの上下は文書の直下と同じ。表の下はGitHubのCSSの余白(引用の段落の間と同じ)
      expect(styles.nestedGaps, '入れ子の見出しと表の上下の間隔').toEqual({
        sectionAbove: styles.headingAbove, section: styles.headingGap, quoteHeading: styles.headingGap, quoteTable: styles.quoteParagraphGap,
      });
      expect(styles.quote3Edges.top, '見出しで始まる引用の上の空き').toBeLessThanOrEqual(0.5);
      expect(styles.quote3Edges.bottom, '見出しで終わる引用の下の空き').toBeLessThanOrEqual(0.5);
      expect(styles.preCode, `${mode}: 言語名のないコードブロックの code`).toEqual({ whiteSpace: 'pre', background: 'rgba(0, 0, 0, 0)', fontSize: styles.preFontSize, padding: '0px' });
      expect(styles.articleFootnotes, '前提: 記事に脚注があること').not.toBeNull();
      expect(styles.footnotes, `${mode}: 脚注の文字`).toEqual(styles.articleFootnotes);
      // 脚注の区切りの線は、GitHubの固定の明るい色ではなくテーマの線の色
      expect(styles.footnoteLine, `${mode}: 脚注の区切りの線`).toBe(colors.border);
      expect(styles.h6, `${mode}: いちばん小さい見出し`).toBe(colors['text-light']);
      expect(styles.img.width, '画像は文書の幅に収める').toBeLessThanOrEqual(styles.img.bodyWidth);
      expect(styles.img.radius).toBe(styles.radiusSmall);
      // 言語名のないコードブロック(.highlight で囲まれない pre)も、はてなのCSSの文字の大きさの継承に負けない
      expect(styles.pre, `${mode}: 言語名のないコードブロック`).toBe(styles.articlePre);
    }

    // 脚注の参照を押すと、その脚注が :target になる。GitHubのCSSのライトの色(濃い文字、青い囲み)のままだと、ダークで読めない・見えにくい
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.evaluate(() => { location.hash = '#user-content-fn-gist-fixture'; });
    const footnote = await page.evaluate((markdown) => {
      const li = /** @type {Element} */ (document.getElementById('user-content-fn-gist-fixture'));
      const label = /** @type {Element} */ (document.getElementById('gist-footnote-label'));
      const ring = getComputedStyle(li, '::before');
      return {
        target: li.matches(':target'),
        color: getComputedStyle(li).color,
        ring: ring.borderTopStyle === 'none' ? null : ring.borderTopColor,
        background: getComputedStyle(/** @type {Element} */ (document.querySelector(markdown))).backgroundColor,
        // GitHubの埋め込み用のCSSは .sr-only を持たないので、読み上げ用の見出し(Footnotes)が見えてしまう
        labelHeight: label.getBoundingClientRect().height,
      };
    }, MARKDOWN_FILE);
    const link = (await resolveColors(page, ['link'], MARKDOWN_FILE)).link;
    expect(footnote.target, '前提: 脚注が :target になっていること').toBe(true);
    expect(contrast(footnote.color, footnote.background), `脚注 ${footnote.color} on ${footnote.background}`).toBeGreaterThanOrEqual(4.5);
    expect(footnote.ring, '前提: :target の脚注を囲む線があること').not.toBeNull();
    expect(footnote.ring, '囲む線はテーマのリンク色').toBe(link);
    expect(footnote.labelHeight, '読み上げ用の見出しは画面に出さない').toBeLessThanOrEqual(1);
  });

  test('CSVのファイルは、どの配色とモードでもカードの地の表にし、行番号を控えめにして行と揃える', async ({ page }) => {
    await openGist(page, { csv: true });

    for (const mode of MODES) {
      await page.emulateMedia({ colorScheme: mode });
      await expectMode(page, mode);
      for (const scheme of SCHEMES) {
        await page.addStyleTag({ content: schemeCss(scheme) });
        const label = `${mode} / ${scheme}`;
        const csv = await page.evaluate((selector) => {
          const file = /** @type {Element} */ (document.querySelector(selector));
          const style = (/** @type {string} */ s) => getComputedStyle(/** @type {Element} */ (file.querySelector(s)));
          return {
            file: getComputedStyle(file).backgroundColor,
            card: getComputedStyle(/** @type {Element} */ (file.closest('.entry'))).backgroundColor,
            cell: style('tbody td:not(.blob-num)').color,
            header: style('th').color,
            headerBackground: style('th').backgroundColor,
            number: style('tbody .blob-num').color,
            numberBackground: style('tbody .blob-num').backgroundColor,
            searchBar: style('.blob-interaction-bar').display,
          };
        }, CSV_FILE);

        // CSVはコードではないので、ink・zenn・qiitaでもコードの暗い地にしない
        expect.soft(csv.file, `${label}: CSVの地`).toBe(csv.card);
        expect.soft(contrast(csv.cell, csv.file), `${label}: セル ${csv.cell} on ${csv.file}`).toBeGreaterThanOrEqual(4.5);
        expect.soft(contrast(csv.header, csv.headerBackground), `${label}: 見出しのセル ${csv.header} on ${csv.headerBackground}`).toBeGreaterThanOrEqual(4.5);
        // 行番号の列をGitHubの白で塗らない
        expect.soft(csv.numberBackground, `${label}: 行番号の地`).toBe('rgba(0, 0, 0, 0)');
        expect.soft(contrast(csv.number, csv.file), `${label}: 行番号 ${csv.number} on ${csv.file}`).toBeGreaterThanOrEqual(4.5);
        // 行番号は補助テキストの色で控えめにする。CSVはカードの地なので、カードの地の補助テキストの色
        // (ink・zenn・qiitaでは、暗い地のコードの行番号とは色が違う)
        expect.soft(csv.number, `${label}: 行番号の色`).toBe((await resolveColors(page, ['text-light'], CSV_FILE))['text-light']);
        // 検索欄はGitHubのスクリプトがないと動かないので出さない
        expect.soft(csv.searchBar, `${label}: 検索欄`).toBe('none');
      }
    }

    const rows = await page.evaluate((selector) => [...document.querySelectorAll(`${selector} tr`)].map((row) => {
      const glyphCenter = /** @type {any} */ (window).gistGlyphCenter;
      const number = /** @type {Element} */ (row.querySelector('.blob-num'));
      const data = /** @type {Element} */ (row.querySelector(':not(.blob-num)'));
      return {
        height: Math.round(row.getBoundingClientRect().height),
        offset: Math.round((glyphCenter(number) - glyphCenter(data)) * 10) / 10,
        numberBorder: getComputedStyle(number).borderTopWidth,
      };
    }), CSV_FILE);
    expect(rows.length, '前提: CSVの表に見出しと3行があること').toBe(4);
    // コードの表の先頭と末尾の行の余白は、CSVの行には当てない(どの行も同じ高さ)
    expect(new Set(rows.map((row) => row.height)).size, `行の高さ ${rows.map((row) => row.height).join(', ')}`).toBe(1);
    for (const row of rows) {
      // 行番号はセルより小さい文字で行の高さも違うので、描かれた文字の上下の中心で比べる。1pxまでの差は揃っているとみなす
      expect(Math.abs(row.offset), '行番号とセルの文字の上下の中心の差').toBeLessThanOrEqual(1);
      expect(row.numberBorder, '行番号に罫線を引かない').toBe('0px');
    }

    // セルの文字はMarkdownの表と同じ大きさと行の高さ。折り返さないのはGitHubのまま(列の多いデータは表の中で横にスクロールする)
    const cells = await page.evaluate(({ csv, markdown, code }) => {
      const pick = (/** @type {string} */ selector) => {
        const s = getComputedStyle(/** @type {Element} */ (document.querySelector(selector)));
        return { fontSize: s.fontSize, lineHeight: s.lineHeight, border: `${s.borderTopWidth} ${s.borderTopColor}`, padding: `${s.paddingTop} ${s.paddingLeft}` };
      };
      const number = (/** @type {string} */ selector) => {
        const s = getComputedStyle(/** @type {Element} */ (document.querySelector(selector)));
        return { fontSize: s.fontSize, fontFamily: s.fontFamily };
      };
      return {
        csv: pick(`${csv} tbody td:not(.blob-num)`),
        header: pick(`${csv} th`),
        markdown: pick(`${markdown} .markdown-body td`),
        wrap: getComputedStyle(/** @type {Element} */ (document.querySelector(`${csv} tbody td:not(.blob-num)`))).whiteSpace,
        number: number(`${csv} tbody .blob-num`),
        codeNumber: number(`${code} .blob-num`),
        // 表のまわりの余白は、Markdownのファイルの文書と同じ
        padding: (() => {
          const a = getComputedStyle(/** @type {Element} */ (document.querySelector(`${csv} .blob-wrapper > .markdown-body`)));
          const b = getComputedStyle(/** @type {Element} */ (document.querySelector(`${markdown} .Box-body.readme`)));
          return [`${a.paddingTop} ${a.paddingLeft}`, `${b.paddingTop} ${b.paddingLeft}`];
        })(),
      };
    }, { csv: CSV_FILE, markdown: MARKDOWN_FILE, code: CODE_FILE });
    expect(cells.csv, 'CSVのセル').toEqual(cells.markdown);
    expect(cells.header, 'CSVの見出しのセル').toEqual(cells.markdown);
    expect(cells.wrap).toBe('nowrap');
    // 行番号の大きさと書体は、コードのファイルの行番号と同じ
    expect(cells.number, 'CSVの行番号').toEqual(cells.codeNumber);
    expect(cells.padding[0], 'CSVの表のまわりの余白').toBe(cells.padding[1]);
  });

  test('Gistのスクリプトの段落は余白を持たず、見出しとGistの間は見出しの下の余白だけ、出典はGistのすぐ下に置く', async ({ page }) => {
    await openGist(page);

    const spacing = await page.evaluate((gist) => {
      const el = /** @type {Element} */ (document.querySelector(gist));
      const script = el.previousElementSibling;
      const heading = script?.previousElementSibling;
      const cite = el.nextElementSibling;
      // 見えるのはファイルの枠なので、枠から測る。.gist は描画の後回しの指定で、中のファイルの余白を外に出さない
      const files = el.querySelectorAll(':scope > .gist-file');
      const firstFile = /** @type {Element} */ (files[0]);
      const lastFile = /** @type {Element} */ (files[files.length - 1]);
      return {
        scriptParagraph: script?.matches('p:has(> script[src^="https://gist.github.com/"])') ? getComputedStyle(script).display : null,
        headingTag: heading?.tagName,
        headingGap: heading ? Math.round(firstFile.getBoundingClientRect().top - heading.getBoundingClientRect().bottom) : null,
        headingMargin: heading ? Math.round(parseFloat(getComputedStyle(heading).marginBottom)) : null,
        cite: cite?.matches('.hatena-citation') ? Math.round(cite.getBoundingClientRect().top - lastFile.getBoundingClientRect().bottom) : null,
      };
    }, GIST);

    expect(spacing.scriptParagraph, '前提: はてながGistのスクリプトを段落で囲んでいること').not.toBeNull();
    expect(spacing.scriptParagraph).toBe('contents');
    expect(spacing.headingTag, '前提: Gistの前に見出しがあること').toMatch(/^H[1-6]$/);
    expect(spacing.headingGap).toBe(spacing.headingMargin);
    // サンプル記事は「:embed:cite」で埋め込んでいる。ブログカードの出典と同じ間隔
    expect(spacing.cite, '前提: Gistの下に出典(:embed:cite)があること').not.toBeNull();
    expect(spacing.cite).toBe(10);
  });

  test('Gistが読み込めないときは、スクリプトの段落を本文の段落のまま残し、下を本文の余白だけ空ける', async ({ page }) => {
    await openGist(page);
    // 消されたGistなど、スクリプトが何も書き出さないときの形。はてなが出典をスクリプトと同じ段落に書き、そのまま残る。
    // HTMLとして差し込んだスクリプトは動かないので、読み込めなかったときと同じになる
    await page.evaluate((gist) => {
      const anchor = /** @type {Element} */ (document.querySelector(gist)).nextElementSibling ?? /** @type {Element} */ (document.querySelector(gist));
      anchor.insertAdjacentHTML('afterend', '<p id="gist-dead-fixture"><script src="https://gist.github.com/fixture/dead.js"></script><cite class="hatena-citation"><a href="https://gist.github.com/fixture/dead">gist.github.com</a></cite></p><p id="gist-dead-next">次の段落</p>');
    }, GIST);
    // 本文の段落は画面の外では描画を後回しにする(仮の高さで置かれる)ので、画面に入れてから測る
    await page.locator('#gist-dead-fixture').scrollIntoViewIfNeeded();
    const dead = await page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const p = /** @type {Element} */ (document.getElementById('gist-dead-fixture'));
      const cite = /** @type {Element} */ (p.querySelector('cite'));
      const next = /** @type {Element} */ (document.getElementById('gist-dead-next'));
      return {
        display: getComputedStyle(p).display,
        gap: Math.round(next.getBoundingClientRect().top - cite.getBoundingClientRect().bottom),
        margin: Math.round(parseFloat(getComputedStyle(next).marginBottom)),
      };
    });
    expect(dead.display).toBe('block');
    // 段落の下の余白は、次の段落の下の余白と同じ本文の余白
    expect(dead.gap, '出典と次の段落の間').toBe(dead.margin);
  });

  test('スマホでも記事は横にはみ出さず、長いコードの行はファイルの中で横にスクロールする', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.MOBILE_STANDARD);
    await openGist(page);

    const overflow = await page.evaluate((code) => {
      const wrapper = /** @type {Element} */ (document.querySelector(`${code} .blob-wrapper`));
      const file = /** @type {Element} */ (document.querySelector(code));
      const content = /** @type {Element} */ (document.querySelector('.entry-content:not(.markdown-body)'));
      return {
        page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        fileRight: file.getBoundingClientRect().right - content.getBoundingClientRect().right,
        scrolls: wrapper.scrollWidth > wrapper.clientWidth,
      };
    }, CODE_FILE);

    expect(overflow.page).toBeLessThanOrEqual(0);
    expect(overflow.fileRight).toBeLessThanOrEqual(0.5);
    expect(overflow.scrolls, '前提: スマホの幅では、Gistのコードの長い行がファイルの幅に収まらないこと').toBe(true);
  });

  test('印刷ではコードを折り返してすべて刷り、ダークにも暗い地のコードにもしない', async ({ page }) => {
    // スマホの幅では、画面ではコードが横にスクロールする。印刷では折り返して収める
    await page.setViewportSize(VIEWPORTS.MOBILE_STANDARD);
    await openGist(page, { markdown: true, csv: true });
    // 言語名のあるコードブロック(.highlight の pre)に、空白のない長い語(URLなど)を足す。GitHubのCSSは折り返させない
    await page.evaluate((markdown) => {
      /** @type {Element} */ (document.querySelector(`${markdown} .markdown-body .highlight pre`))
        .insertAdjacentHTML('beforeend', `\n<span class="pl-s">"https://example.com/${'a'.repeat(160)}"</span>`);
    }, MARKDOWN_FILE);

    const measure = () => page.evaluate(({ code, markdown }) => {
      const file = /** @type {Element} */ (document.querySelector(code));
      const wrapper = /** @type {Element} */ (file.querySelector('.blob-wrapper'));
      const pre = /** @type {Element} */ (document.getElementById('gist-pre-fixture'));
      const highlight = /** @type {Element} */ (document.querySelector(`${markdown} .markdown-body .highlight pre`));
      return {
        overflow: wrapper.scrollWidth - wrapper.clientWidth,
        preOverflow: pre.scrollWidth - pre.clientWidth,
        highlightOverflow: highlight.scrollWidth - highlight.clientWidth,
        csvOverflow: (() => {
          const table = /** @type {Element} */ (document.querySelector('#gist-csv-fixture table'));
          return table.scrollWidth - table.clientWidth;
        })(),
        code: getComputedStyle(/** @type {Element} */ (file.querySelector('.blob-code-inner'))).whiteSpace,
        markdownCode: getComputedStyle(/** @type {Element} */ (document.querySelector(`${markdown} .markdown-body .highlight pre`))).whiteSpace,
        plainCode: getComputedStyle(/** @type {Element} */ (pre.querySelector('code'))).whiteSpace,
        codeBackground: getComputedStyle(file).backgroundColor,
        codeText: getComputedStyle(/** @type {Element} */ (file.querySelector('.blob-code-inner'))).color,
        text: getComputedStyle(/** @type {Element} */ (document.querySelector(`${markdown} .markdown-body`))).color,
      };
    }, { code: CODE_FILE, markdown: MARKDOWN_FILE });

    // 比べる色: ライトの既定の配色の画面
    await page.emulateMedia({ colorScheme: 'light', media: 'screen' });
    await page.addStyleTag({ content: schemeCss('mint') });
    const light = await measure();

    // 印刷はOSがダークでも、ライトの配色で刷る
    await page.emulateMedia({ colorScheme: 'dark', media: 'print' });
    const print = await measure();
    expect(print.overflow, '印刷でコードがファイルの幅からはみ出さない').toBeLessThanOrEqual(0);
    expect(print.preOverflow, '印刷で言語名のないコードブロックがはみ出さない').toBeLessThanOrEqual(0);
    expect(print.highlightOverflow, '印刷で言語名のあるコードブロックの長い語がはみ出さない').toBeLessThanOrEqual(0);
    // CSVのセルは画面では折り返さない(表の中で横にスクロールする)。紙では折り返して、すべての列を刷る
    expect(light.csvOverflow, '前提: 画面ではCSVの表がスマホの幅に収まらないこと').toBeGreaterThan(0);
    expect(print.csvOverflow, '印刷でCSVの列が切れない').toBeLessThanOrEqual(0);
    expect(print.code).toBe('pre-wrap');
    expect(print.markdownCode).toBe('pre-wrap');
    expect(print.plainCode).toBe('pre-wrap');
    expect({ background: print.codeBackground, code: print.codeText, text: print.text }, '印刷の色はライトの画面と同じ')
      .toEqual({ background: light.codeBackground, code: light.codeText, text: light.text });

    // ライトでもコードを暗い地にする配色(ink)も、印刷では暗い地にしない
    await page.addStyleTag({ content: schemeCss('ink') });
    await page.emulateMedia({ colorScheme: 'light', media: 'screen' });
    const inkScreen = await measure();
    await page.emulateMedia({ colorScheme: 'light', media: 'print' });
    const inkPrint = await measure();
    expect(inkScreen.codeBackground, '前提: inkの画面ではコードのファイルが暗い地になること').not.toBe(inkPrint.codeBackground);
    expect(contrast(inkPrint.codeBackground, 'rgb(255, 255, 255)'), `inkの印刷のコードの地 ${inkPrint.codeBackground}`).toBeLessThan(1.2);
  });
});
