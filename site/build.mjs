// Builds the static site for arecformat.org into dist/.
//
// Pages (each written as a flat .html file, which the host serves at the
// extensionless path, so every URL matches its canonical link):
//   /           content/home.md
//   /spec       ../SPEC.md       (plain text at /spec.md)
//   /arec-file  content/arec-file.md
//   /implementations  content/implementations.md
//   /research   content/research.md
//   /changelog  ../CHANGELOG.md  (plain text at /changelog.md)
// Files served beside them come from ../scripts/public-files.mjs, the same
// function every other host uses: the schema, the reader and validator, the
// conformance fixtures and the worked example. static/** is copied as is
// (favicons and social images).
//
//
//   cd site && npm ci && npm run build
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

import { publicFiles } from '../scripts/public-files.mjs';

const SITE = 'https://arecformat.org';
const SITE_NAME = 'AREC';
const REPO = 'https://github.com/arecformat/arec';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'dist');

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const readContent = (name) => fs.readFileSync(path.join(HERE, 'content', name), 'utf8');

const md = new MarkdownIt({ html: false, linkify: false, typographer: false });

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Give every h2 and h3 an id and a self-link, collect h2s for the contents,
// and return the h1 text.
function render(markdown) {
  const tokens = md.parse(markdown, {});
  const toc = [];
  const used = new Set();
  let h1 = null;
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t.type !== 'heading_open') continue;
    const text = tokens[i + 1].content;
    if (t.tag === 'h1' && h1 === null) h1 = text;
    if (t.tag !== 'h2' && t.tag !== 'h3') continue;
    let id = slugify(text) || 'section';
    while (used.has(id)) id += '-x';
    used.add(id);
    t.attrSet('id', id);
    if (t.tag === 'h2') toc.push({ id, text });
  }
  let html = md.renderer.render(tokens, md.options, {});
  html = html.replace(/<(h[23]) id="([^"]+)">([\s\S]*?)<\/\1>/g,
    (_, tag, id, inner) => `<${tag} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${inner}</${tag}>`);
  // Tables scroll on their own instead of widening the page on a phone.
  html = html.replace(/<table>/g, '<div class="table"><table>').replace(/<\/table>/g, '</table></div>');
  // Links to other sites open normally but say where they go.
  html = html.replace(/<a href="(https?:\/\/(?!arecformat\.org)[^"]+)"/g, '<a href="$1" rel="noopener"');
  return { html, toc, h1 };
}

// A leading `---` block of `key: value` lines, then the Markdown body.
function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const at = line.indexOf(':');
    if (at > 0) meta[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return { meta, body: text.slice(m[0].length) };
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
// "30 October 2026" -> "2026-10-30".
function isoDate(text) {
  const m = text.match(/(\d{1,2}) ([A-Za-z]+) (\d{4})/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase()) + 1;
  if (month === 0) return null;
  return `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

const STYLE = `
:root{--bg:#fdfcfa;--fg:#1d1b18;--muted:#625d55;--line:#e6e1d8;--code:#f3efe8;--accent:#b4440e;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--bg:#141311;--fg:#ece8e1;--muted:#a59f95;--line:#2e2b27;--code:#1f1d1a;--accent:#f0864d}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--accent)}
.skip{position:absolute;left:-999px}
.skip:focus{left:16px;top:8px;background:var(--bg);padding:4px 8px}
header.site,footer.site{max-width:1120px;margin:0 auto;padding:20px 16px;display:flex;flex-wrap:wrap;gap:8px 24px;align-items:baseline}
header.site{border-bottom:1px solid var(--line)}
.brand{font-weight:700;font-size:20px;letter-spacing:.02em;color:var(--fg);text-decoration:none}
nav.primary{display:flex;flex-wrap:wrap;gap:4px 18px;font-size:15px}
nav.primary a{color:var(--muted);text-decoration:none}
nav.primary a:hover,nav.primary a[aria-current]{color:var(--fg)}
.crumbs{font-size:14px;color:var(--muted);margin:20px 0 0}
.crumbs a{color:var(--muted)}
.layout{max-width:1120px;margin:0 auto;padding:0 16px;display:grid;grid-template-columns:minmax(0,1fr);gap:40px}
@media (min-width:960px){.layout{grid-template-columns:220px minmax(0,1fr)}}
aside{display:none;font-size:14px;padding-top:32px}
@media (min-width:960px){aside{display:block;position:sticky;top:0;align-self:start;max-height:100vh;overflow:auto}}
aside ol{list-style:none;margin:0;padding:0}
aside li{margin:6px 0}
aside a{color:var(--muted);text-decoration:none}
aside a:hover{color:var(--fg)}
main{min-width:0;max-width:760px;padding:16px 0 64px}
h1{font-size:34px;line-height:1.2;margin:24px 0 16px}
h2{font-size:24px;margin:48px 0 12px;padding-top:8px;border-top:1px solid var(--line)}
h3{font-size:19px;margin:32px 0 8px}
h2,h3{position:relative;scroll-margin-top:16px}
.anchor{position:absolute;left:-1em;width:1em;color:var(--muted);text-decoration:none;opacity:0}
h2:hover .anchor,h3:hover .anchor{opacity:1}
code{font:0.88em/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--code);padding:.1em .3em;border-radius:4px;overflow-wrap:anywhere}
pre{background:var(--code);padding:14px 16px;border-radius:8px;overflow:auto}
pre code{background:none;padding:0;overflow-wrap:normal}
.table{overflow-x:auto;margin:16px 0}
table{border-collapse:collapse;font-size:15px;min-width:100%}
th,td{border:1px solid var(--line);padding:6px 10px;text-align:left;vertical-align:top}
thead th:empty{display:none}
blockquote{margin:16px 0;padding:4px 16px;border-left:3px solid var(--line);color:var(--muted)}
footer.site{border-top:1px solid var(--line);color:var(--muted);font-size:14px}
`;

const NAV = [
  ['/', 'Overview'],
  ['/spec', 'Specification'],
  ['/arec-file', '.arec files'],
  ['/implementations', 'Implementations'],
  ['/research', 'Research'],
  ['/changelog', 'Changelog'],
  [REPO, 'GitHub'],
];

function page({ urlPath, title, description, markdownAlt, body, toc, image, imageAlt, ld, crumbs, noindex }) {
  const canonical = `${SITE}${urlPath}`;
  const nav = NAV.map(([href, label]) =>
    `<a href="${href}"${href === urlPath ? ' aria-current="page"' : ''}${href.startsWith('http') ? ' rel="noopener"' : ''}>${label}</a>`).join('');
  const contents = toc.length > 2
    ? `<aside><nav aria-label="Contents"><ol>${toc.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join('')}</ol></nav></aside>`
    : '<aside></aside>';
  const crumbsHtml = crumbs
    ? `<nav class="crumbs" aria-label="Breadcrumb">${crumbs.map((c, i) => (i === crumbs.length - 1 ? esc(c.name) : `<a href="${c.path}">${esc(c.name)}</a>`)).join(' / ')}</nav>`
    : '';
  const imageUrl = `${SITE}${image}`;
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonical}">`,
    markdownAlt ? `<link rel="alternate" type="text/markdown" href="${markdownAlt}">` : '',
    '<link rel="icon" href="/favicon.ico" sizes="32x32">',
    '<link rel="icon" href="/icon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    '<meta name="theme-color" content="#b4440e">',
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:type" content="${urlPath === '/' ? 'website' : 'article'}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    noindex ? '' : `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${imageUrl}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    `<meta property="og:image:alt" content="${esc(imageAlt)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${imageUrl}">`,
    ...ld.map((item) => `<script type="application/ld+json">${JSON.stringify(item).replace(/</g, '\\u003c')}</script>`),
    `<style>${STYLE}</style>`,
  ].filter(Boolean).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
${head}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site"><a class="brand" href="/">AREC</a><nav class="primary" aria-label="Site">${nav}</nav></header>
<div class="layout">${contents}<main id="main">${crumbsHtml}${body}</main></div>
<footer class="site"><span>AREC (Agent Recording): the open file format for agent-readable screen recordings.</span><span>Specification, schema and fixtures: CC0 1.0. Validator: MIT.</span><span><a href="${REPO}" rel="noopener">Source on GitHub</a></span></footer>
</body>
</html>
`;
}

function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function copyTree(from, toRel) {
  if (!fs.existsSync(from)) return;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(toRel, entry.name);
    if (entry.isDirectory()) copyTree(src, dst);
    else write(dst, fs.readFileSync(src));
  }
}

// The first sentence under a heading, as plain text, for meta descriptions.
function firstSentence(markdown, heading) {
  const m = markdown.match(new RegExp(`## ${heading}\\s+([^\\n]+)`));
  if (!m) return '';
  const text = m[1].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*]/g, '');
  return text.match(/^.+?\.(?=\s|$)/)?.[0] ?? text;
}

const ORGANIZATION = { '@type': 'Organization', name: SITE_NAME, url: `${SITE}/` };
const breadcrumbLd = (crumbs) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${SITE}${c.path}` })),
});

fs.rmSync(OUT, { recursive: true, force: true });

const spec = read('SPEC.md');
const specUpdated = isoDate(spec.match(/\*\*Updated\*\* \| ([^|]+)\|/)?.[1] ?? '') ?? new Date().toISOString().slice(0, 10);
const specVersion = spec.match(/\*\*Version\*\* \| ([0-9.]+)/)?.[1] ?? '1.4';
const pages = [];

// Overview.
{
  const { meta, body } = frontMatter(readContent('home.md'));
  const r = render(body);
  pages.push({ path: '/', file: 'index.html', updated: meta.updated });
  write('index.html', page({
    urlPath: '/',
    title: meta.title,
    description: meta.description,
    body: r.html,
    toc: r.toc,
    image: '/og/home.png',
    imageAlt: 'AREC: the open file format for agent-readable screen recordings',
    ld: [
      { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, alternateName: 'AREC (Agent Recording)', url: `${SITE}/`, description: meta.description, publisher: ORGANIZATION },
    ],
  }));
}

// Specification.
{
  const r = render(spec);
  const crumbs = [{ name: 'AREC', path: '/' }, { name: 'Specification', path: '/spec' }];
  pages.push({ path: '/spec', file: 'spec.html', updated: specUpdated });
  write('spec.html', page({
    urlPath: '/spec',
    title: `AREC ${specVersion} specification: Agent Recording file format`,
    description: firstSentence(spec, 'Abstract'),
    markdownAlt: '/spec.md',
    body: r.html,
    toc: r.toc,
    image: '/og/spec.png',
    imageAlt: `AREC ${specVersion} specification`,
    crumbs,
    ld: [
      {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: r.h1,
        description: firstSentence(spec, 'Abstract'),
        url: `${SITE}/spec`,
        version: specVersion,
        dateModified: specUpdated,
        inLanguage: 'en',
        license: 'https://creativecommons.org/publicdomain/zero/1.0/',
        publisher: ORGANIZATION,
        image: `${SITE}/og/spec.png`,
      },
      breadcrumbLd(crumbs),
    ],
  }));
  write('spec.md', spec);
}

// Article pages written in content/.
for (const { name, crumb, imageAlt } of [
  { name: 'arec-file', crumb: '.arec files', imageAlt: 'What is an .arec file?' },
  { name: 'implementations', crumb: 'Implementations', imageAlt: 'AREC implementations' },
  { name: 'research', crumb: 'Research', imageAlt: 'AREC research' },
]) {
  const { meta, body } = frontMatter(readContent(`${name}.md`));
  const r = render(body);
  const urlPath = `/${name}`;
  const crumbs = [{ name: 'AREC', path: '/' }, { name: crumb, path: urlPath }];
  pages.push({ path: urlPath, file: `${name}.html`, updated: meta.updated });
  write(`${name}.html`, page({
    urlPath,
    title: meta.title,
    description: meta.description,
    body: r.html,
    toc: r.toc,
    image: `/og/${name}.png`,
    imageAlt,
    crumbs,
    ld: [
      {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: r.h1,
        description: meta.description,
        url: `${SITE}${urlPath}`,
        dateModified: meta.updated,
        inLanguage: 'en',
        publisher: ORGANIZATION,
        image: `${SITE}/og/${name}.png`,
      },
      breadcrumbLd(crumbs),
    ],
  }));
}

// Changelog.
{
  const changelog = read('CHANGELOG.md');
  const r = render(changelog);
  const crumbs = [{ name: 'AREC', path: '/' }, { name: 'Changelog', path: '/changelog' }];
  pages.push({ path: '/changelog', file: 'changelog.html', updated: specUpdated });
  write('changelog.html', page({
    urlPath: '/changelog',
    title: 'AREC changelog: every version of the Agent Recording format',
    description: 'Every version of the AREC (Agent Recording) format and what changed in it, from 0.1 to the stable 1.4 release.',
    markdownAlt: '/changelog.md',
    body: r.html,
    toc: r.toc,
    image: '/og/changelog.png',
    imageAlt: 'AREC changelog',
    crumbs,
    ld: [breadcrumbLd(crumbs)],
  }));
  write('changelog.md', changelog);
}

// Schema, validator, fixtures, examples, favicons and social images, byte for byte.
for (const [rel, body] of publicFiles({ baseUrl: SITE })) write(rel, body);
copyTree(path.join(HERE, 'static'), '.');

// Not found page.
write('404.html', page({
  urlPath: '/404',
  title: 'Page not found: AREC',
  description: 'This page does not exist.',
  body: '<h1>Page not found</h1><p>Start from the <a href="/">AREC overview</a> or the <a href="/spec">specification</a>.</p>',
  toc: [],
  image: '/og/home.png',
  imageAlt: 'AREC',
  ld: [],
  noindex: true,
}));

// Icons are in static/ (rendered by scripts/icons.mjs); the manifest lists them.
write('site.webmanifest', `${JSON.stringify({
  name: 'AREC (Agent Recording)',
  short_name: SITE_NAME,
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
  theme_color: '#b4440e',
  background_color: '#fdfcfa',
  display: 'browser',
}, null, 2)}\n`);

write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE}${p.path}</loc>${p.updated ? `<lastmod>${p.updated}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`);

write('llms.txt', `# AREC (Agent Recording)

> ${firstSentence(spec, 'Abstract')}

- [Overview](${SITE}/)
- [Specification (plain text)](${SITE}/spec.md)
- [What is an .arec file](${SITE}/arec-file)
- [AREC implementations](${SITE}/implementations)
- [Research: agents with AREC vs video and transcripts](${SITE}/research)
- [Changelog (plain text)](${SITE}/changelog.md)
- [JSON Schema 1.4](${SITE}/schema/arec-1.4.schema.json)
- [Reference reader and validator](${SITE}/arec/validate.mjs)
- [Conformance fixtures](${SITE}/arec/fixtures/index.json)
- [Source](${REPO})
`);

// Cloudflare Pages headers and redirects.
write('_headers', `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/*.arec
  Content-Type: text/markdown; charset=utf-8
  Access-Control-Allow-Origin: *

/*.md
  Content-Type: text/markdown; charset=utf-8
  Access-Control-Allow-Origin: *

/site.webmanifest
  Content-Type: application/manifest+json

/*.mjs
  Content-Type: text/javascript; charset=utf-8
  Access-Control-Allow-Origin: *

/schema/*
  Content-Type: application/schema+json
  Access-Control-Allow-Origin: *

/arec/fixtures/*.json
  Access-Control-Allow-Origin: *

/spec.md
  Link: <${SITE}/spec>; rel="canonical"

/changelog.md
  Link: <${SITE}/changelog>; rel="canonical"

/arec/examples/relay-design-review.arec
  Link: <${SITE}/arec/examples/relay-design-review.arec>; rel="canonical"
`);
write('_redirects', `/spec/ /spec 301
/spec/changelog /changelog 301
/spec/changelog/ /changelog 301
/changelog/ /changelog 301
/arec-file/ /arec-file 301
/implementations/ /implementations 301
/research/ /research 301
/index.html / 301
`);

console.log(`Built ${OUT}`);
