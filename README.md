# Pongsant Portfolio Rebuild

This rebuild uses the images published on the current live portfolio as the starting archive and generates a multi-page static site that mirrors the original portfolio structure.

## What is here

- `index.html`: generated homepage
- `about/`, `contact/`, `my-works/`: generated top-level pages
- `graphic-design/`, `photo/`, `drawing/`, `coding/`, `product/`: generated category pages
- nested project folders inside `graphic-design/`, `coding/`, and `product/`: generated detail pages
- `styles.css`: shared styling for all pages
- `site-data.json`: generated data used to build the site
- `scripts/generate-portfolio-data.mjs`: regenerates `site-data.json` from `assets/site-import/manifest.tsv`
- `scripts/build-site.mjs`: generates the HTML pages from `site-data.json`
- `assets/site-import/images/`: copied images from the live site
- `assets/site-import/manifest.tsv`: route-to-image mapping from the live site

## View locally

Run a local server from the project root:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173
```

## Rebuild the site

If you update `assets/site-import/manifest.tsv`, regenerate the data and pages with:

```bash
node scripts/generate-portfolio-data.mjs
node scripts/build-site.mjs
```

The generated HTML auto-detects your GitHub Pages project path (`/portfolio_pongsant/`) or local root (`/`), so the same build works for both local and deployed previews.

If you ever rename the GitHub repo/path, you can override the project path:

```bash
GITHUB_PAGES_PROJECT_PATH=/new-repo-name node scripts/build-site.mjs
```
