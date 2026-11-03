// Renders the 1200x630 social images into static/og/. Run it after changing a
// page title; the PNGs are committed, so the site build needs no browser.
//
//   node scripts/og-images.mjs   (needs Playwright with Chromium)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../static/og');
const CARDS = [
  ['home', 'The open file format for agent-readable screen recordings', 'Version 1.4 · stable · CC0'],
  ['spec', 'AREC 1.4 specification', 'Identity, sections, conformance, security and versioning'],
  ['arec-file', 'What is an .arec file?', 'Plain Markdown that lets AI agents read a screen recording'],
  ['implementations', 'AREC implementations', 'Recorders that write it, agents that read it, and what for'],
  ['research', 'What agents do with a recording', 'AREC vs raw video and transcripts, in a benchmark and a case study'],
  ['changelog', 'AREC changelog', 'Every version of the Agent Recording format'],
];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = (title, sub) => `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;width:1200px;height:630px;background:#fdfcfa;color:#1d1b18;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:flex}
.card{margin:72px;display:flex;flex-direction:column;justify-content:space-between;width:100%}
.mark{display:flex;align-items:center;gap:20px;font-size:40px;font-weight:700;letter-spacing:.02em}
.logo{width:72px;height:72px;border-radius:16px;background:#b4440e;color:#fff;display:flex;align-items:center;justify-content:center;font-size:44px}
h1{font-size:68px;line-height:1.1;margin:0;max-width:1000px}
p{font-size:30px;color:#625d55;margin:20px 0 0}
.foot{font-size:26px;color:#b4440e;font-weight:600}
</style></head><body><div class="card"><div class="mark"><div class="logo">A</div>AREC</div>
<div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div><div class="foot">arecformat.org</div></div></body></html>`;

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [name, title, sub] of CARDS) {
  await page.setContent(html(title, sub));
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(`static/og/${name}.png`);
}
await browser.close();
