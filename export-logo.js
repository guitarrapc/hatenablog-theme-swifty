// @ts-check
/**
 * テーマのロゴ(assets/logo.svg)をPNGに書き出す。
 *
 * `npm run logo` で実行する。assets/logo.svg を直したら、書き出し直す。
 * - assets/logo.png: 256×256
 * - assets/logo_large.png: 1024×1024
 * - assets/logo_mark.png: 透明な余白を除いて高さ128pxにしたもの(READMEの見出し用)
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSETS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets');

// 余白を除くときの、透明とみなす不透明度の上限(0〜255)。ロゴの尾は透明に向かって薄れるので、ほぼ透明な画素は余白として扱う
const TRIM_ALPHA = 16;

// 余白を除いたロゴの高さ
const MARK_HEIGHT = 128;

const svg = fs.readFileSync(path.join(ASSETS_DIR, 'logo.svg'), 'utf8');

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent('<body></body>');
  // ブラウザのcanvasでSVGを描き、PNGのdata URLにして返す
  const images = await page.evaluate(async ({ svg, trimAlpha, markHeight }) => {
    const image = new Image();
    image.src = `data:image/svg+xml;base64,${btoa(String.fromCharCode(...new TextEncoder().encode(svg)))}`;
    await image.decode();

    /** @param {number} size */
    const draw = (size) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d')).drawImage(image, 0, 0, size, size);
      return canvas;
    };

    const large = draw(1024);
    const { data } = /** @type {CanvasRenderingContext2D} */ (large.getContext('2d')).getImageData(0, 0, large.width, large.height);
    let [left, top, right, bottom] = [large.width, large.height, 0, 0];
    for (let y = 0; y < large.height; y++) {
      for (let x = 0; x < large.width; x++) {
        if (data[(y * large.width + x) * 4 + 3] > trimAlpha) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }
    const width = right - left + 1;
    const height = bottom - top + 1;
    const mark = document.createElement('canvas');
    mark.height = markHeight;
    mark.width = Math.round(width * markHeight / height);
    const context = /** @type {CanvasRenderingContext2D} */ (mark.getContext('2d'));
    context.imageSmoothingQuality = 'high';
    context.drawImage(large, left, top, width, height, 0, 0, mark.width, mark.height);

    return {
      'logo.png': draw(256).toDataURL('image/png'),
      'logo_large.png': large.toDataURL('image/png'),
      'logo_mark.png': mark.toDataURL('image/png'),
    };
  }, { svg, trimAlpha: TRIM_ALPHA, markHeight: MARK_HEIGHT });

  for (const [name, dataUrl] of Object.entries(images)) {
    fs.writeFileSync(path.join(ASSETS_DIR, name), Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log(`✓ assets/${name}`);
  }
} finally {
  await browser.close();
}
