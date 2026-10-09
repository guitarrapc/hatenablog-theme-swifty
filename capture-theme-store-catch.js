// @ts-check
/**
 * はてなブログのテーマストアに載せる画像(theme-store-catch.png)を、theme-store-catch.html から作る。
 *
 * `npm run theme-store` で実行する。テーマストアの画像は620×460ピクセル(JPEG・PNG・GIF)。
 * 画面の画像は articles/screenshots/ のもの(npm run screenshots で撮る)を使うので、テーマの見た目を変えたら先に撮り直す。
 * 文字はWebフォント(Google Fonts)を使うので、ネットにつながっている必要がある。
 */
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SIZE = { width: 620, height: 460 };

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: SIZE.width + 40, height: SIZE.height + 40 } });
  await page.goto(pathToFileURL(path.join(ROOT, 'theme-store-catch.html')).href, { waitUntil: 'networkidle' });
  // Webフォントと画像が描かれてから撮る
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.container').screenshot({ path: path.join(ROOT, 'theme-store-catch.png') });
  console.log('✓ theme-store-catch.png');
} finally {
  await browser.close();
}
