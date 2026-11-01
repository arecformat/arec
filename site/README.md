# arecformat.org

The AREC format's website: an overview, the specification, a page about
`.arec` files, the changelog, and the files implementers download (JSON
Schema, reference reader and validator, conformance fixtures, worked example).
It is a static build of the files in this repository. Edit the sources, not
the output.

| Site path | Source |
| --- | --- |
| `/` | `site/content/home.md` |
| `/spec` and `/spec.md` | `SPEC.md` |
| `/arec-file` | `site/content/arec-file.md` |
| `/changelog` and `/changelog.md` | `CHANGELOG.md` |
| `/schema/`, `/arec/` (validator, fixtures, example) | `scripts/public-files.mjs`, from `schema/`, `validator/`, `bin/`, `fixtures/` and `examples/` |
| `/og/*.png` | `site/static/og/`, rendered by `site/scripts/og-images.mjs` |
| `/favicon.ico`, `/icon.svg`, `/apple-touch-icon.png`, `/icon-192.png`, `/icon-512.png` | `site/static/`; the PNG and ICO files are rendered from `icon.svg` by `site/scripts/icons.mjs` |

## Build and preview

The build needs Node 18 or newer; the `wrangler` preview needs Node 22 or
newer.

```sh
cd site
npm ci
npm run build                # writes site/dist/
npx wrangler pages dev dist  # preview at the address it prints
```

Each page is written as a flat `.html` file (`spec.html`) and served at its
extensionless path (`/spec`), so every URL matches its canonical link.
`dist/_headers` and `dist/_redirects` describe the media types, cross-origin
reads and redirects the host applies; `wrangler pages dev` reads them, so the
preview behaves like the live site. A plain static server such as
`python3 -m http.server` does not, and `/spec` returns 404 there.

The build rewrites links in the specification text from its first address
(clipy.online/spec) to this site. The schema keeps its `$id`, which is a fixed
identifier rather than the address it is served from.

## Checklist for every page

- A unique title of 60 characters or fewer and a description of 160 or fewer:
  front matter in `content/*.md`, or set in `build.mjs` for the spec and the
  changelog.
- One `h1`, a canonical link, Open Graph and Twitter tags with a 1200x630
  image, and JSON-LD (`WebSite`, `TechArticle`, `BreadcrumbList`).
- `updated:` in the front matter becomes the page's sitemap `lastmod`; the spec
  and changelog take the specification's Updated date.
- The social images are rendered from the card text in
  `scripts/og-images.mjs`. After changing it, install Playwright
  (`npm i --no-save playwright && npx playwright install chromium`), run
  `node scripts/og-images.mjs` and commit the new images.
- The favicons are rendered from `static/icon.svg`. After changing it, run
  `node scripts/icons.mjs` (same Playwright setup) and commit the new files.
