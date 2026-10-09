/**
 * 配布用の customize-*.html が、js/ の同じ名前のスクリプトと同じ処理であることを確かめる。
 *
 * customize-<name>.html は、はてなブログに貼り付けてもらうために js/<name>.js を写したもの。片方だけ直すとずれる。
 * ファイルどうしを比べるだけでブラウザもブログも要らないので、E2Eテストではなくここで確かめる。
 *
 * 使い方:
 *   node check-customize.js
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

// インデントとコメント行を除いて比較する
const normalize = (code) => code
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("//") && !line.startsWith("/**") && !line.startsWith("*"));

const files = fs.readdirSync(ROOT).filter((name) => /^customize-.+\.html$/.test(name));
if (files.length === 0) {
  console.error("customize-*.html が見つからない");
  process.exit(1);
}

let failed = false;
for (const html of files) {
  const js = `js/${html.replace(/^customize-(.+)\.html$/, "$1")}.js`;
  const source = fs.readFileSync(path.join(ROOT, html), "utf-8");

  // 貼り付けるコードはscript要素1つだけにしている。開始と終了のタグが1つずつなら、その間がスクリプトになる
  const opens = [...source.matchAll(/<script\b[^>]*>/gi)];
  const closes = [...source.matchAll(/<\/script>/gi)];
  if (opens.length !== 1 || closes.length !== 1) {
    console.error(`NG ${html}: script要素が1つではない(開始 ${opens.length}、終了 ${closes.length})`);
    failed = true;
    continue;
  }
  if (!fs.existsSync(path.join(ROOT, js))) {
    console.error(`NG ${html}: 対応する ${js} がない`);
    failed = true;
    continue;
  }

  const script = normalize(source.slice(opens[0].index + opens[0][0].length, closes[0].index));
  const expected = normalize(fs.readFileSync(path.join(ROOT, js), "utf-8"));
  const diff = Array.from({ length: Math.max(script.length, expected.length) }, (_, i) => i)
    .find((i) => script[i] !== expected[i]);
  if (diff === undefined) {
    console.log(`OK ${html} = ${js}`);
  } else {
    console.error(`NG ${html} が ${js} と違う(コメントと空行を除いた${diff + 1}行目)`);
    console.error(`  ${html}: ${script[diff] ?? "(終わり)"}`);
    console.error(`  ${js}: ${expected[diff] ?? "(終わり)"}`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
