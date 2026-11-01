// Renders the favicons from static/icon.svg: favicon.ico (16, 32 and 48 px),
// apple-touch-icon.png (180 px, square, iOS rounds the corners itself) and the
// 192 and 512 px icons the web manifest lists. Run it after changing
// icon.svg; the files are committed, so the site build needs no browser.
//
//   node scripts/icons.mjs   (needs Playwright with Chromium)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const STATIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../static');
const svg = fs.readFileSync(path.join(STATIC, 'icon.svg'), 'utf8');
// The touch icon fills the square: iOS applies its own corner mask.
const square = svg.replace(/ rx="[^"]*"/, '');

const browser = await chromium.launch();
const page = await browser.newPage();
async function png(source, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${source}`);
  return page.screenshot({ omitBackground: true });
}

// An .ico file whose entries are PNG images (supported by every current browser).
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const icoImages = [];
for (const size of [16, 32, 48]) icoImages.push({ size, data: await png(svg, size) });
const outputs = {
  'favicon.ico': ico(icoImages),
  'apple-touch-icon.png': await png(square, 180),
  'icon-192.png': await png(svg, 192),
  'icon-512.png': await png(svg, 512),
};
await browser.close();
for (const [name, data] of Object.entries(outputs)) {
  fs.writeFileSync(path.join(STATIC, name), data);
  console.log(`static/${name}`);
}
