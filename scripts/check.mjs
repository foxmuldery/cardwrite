#!/usr/bin/env node
/**
 * 静态自检：无依赖，CI 与本地都能跑。
 * - index.html 重复 id / 图标引用 / 本地资源是否存在 / dialog 标签
 * - app.js 语法
 * - sw.js 预缓存文件是否存在、版本号是否与 app 一致
 * - manifest 图标是否存在
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const problems = [];
const notes = [];

const html = read('index.html');

// 1. duplicate ids
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
if (dupes.length) problems.push('index.html 重复 id: ' + dupes.join(', '));

// 2. symbols
const symbols = new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]));
const uses = [...new Set([...html.matchAll(/<use href="#([^"]+)"/g)].map(m => m[1]))];
const missingSymbols = uses.filter(u => !symbols.has(u));
if (missingSymbols.length) problems.push('缺少 SVG symbol: ' + missingSymbols.join(', '));

// 3. local assets
const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1])
  .filter(u => !/^(https?:|mailto:|#|data:)/.test(u));
const missingRefs = refs.filter(u => !exists(u.split('#')[0]));
if (missingRefs.length) problems.push('index.html 引用了不存在的文件: ' + [...new Set(missingRefs)].join(', '));

// 4. dialog labels
for (const m of html.matchAll(/<dialog[^>]*aria-labelledby="([^"]+)"/g)) {
  if (!ids.includes(m[1])) problems.push('dialog aria-labelledby 指向不存在的 id: ' + m[1]);
}

// 5. app.js syntax
const app = read('assets/app.js');
try { new Function(app); } catch (err) { problems.push('assets/app.js 语法错误: ' + err.message); }
const appVersion = (app.match(/const APP_VERSION = '([^']+)'/) || [])[1];

// 6. service worker
const sw = read('sw.js');
const swVersion = (sw.match(/const VERSION = '([^']+)'/) || [])[1];
if (appVersion && swVersion !== 'cardwrite-v' + appVersion) {
  problems.push(`sw.js 版本 ${swVersion} 与 app 版本 ${appVersion} 不一致`);
}
const swAssets = [...sw.matchAll(/'\.\/([^']*)'/g)].map(m => m[1]).filter(p => p && !p.includes('*'));
const missingSw = swAssets.filter(p => !exists(p));
if (missingSw.length) problems.push('sw.js 预缓存文件不存在: ' + missingSw.join(', '));

// 7. manifest icons
const manifest = JSON.parse(read('manifest.webmanifest'));
for (const icon of manifest.icons || []) {
  if (!exists(icon.src)) problems.push('manifest 图标不存在: ' + icon.src);
}

notes.push(`app ${appVersion || '?'} / sw ${swVersion || '?'}`);
notes.push(`${ids.length} ids, ${symbols.size} symbols, ${refs.length} local refs, ${swAssets.length} precache files`);

if (problems.length) {
  console.error('✘ 自检失败');
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
console.log('✔ 自检通过：' + notes.join('；'));
