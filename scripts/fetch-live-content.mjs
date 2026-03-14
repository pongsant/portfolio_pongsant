import { readFileSync, writeFileSync } from "node:fs";

const manifestPath = new URL("../assets/site-import/manifest.tsv", import.meta.url);
const outputPath = new URL("../live-content.json", import.meta.url);
const baseUrl = "https://www.pongsantchin.com";

const keyPages = ["/homepage-2", "/about", "/contact", "/photo", "/my-works"];

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractOuterDiv(html, startIndex) {
  const tagPattern = /<\/?div\b[^>]*>/gi;
  let depth = 0;
  let endIndex = startIndex;
  let match;

  tagPattern.lastIndex = startIndex;

  while ((match = tagPattern.exec(html))) {
    if (match.index < startIndex) {
      continue;
    }

    if (match[0].startsWith("</")) {
      depth -= 1;
    } else {
      depth += 1;
    }

    if (depth === 0) {
      endIndex = tagPattern.lastIndex;
      break;
    }
  }

  return html.slice(startIndex, endIndex);
}

function blockHtmlToText(html) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/pre>/gi, "\n\n")
      .replace(/<\/code>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
  ).trim();
}

function normalizeWhitespace(value) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isNoiseBlock(text, html) {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  const singleBlockNoise = new Set([
    "about",
    "my works",
    "contact",
    "portfolio",
    "back",
    "instagram",
    "youtube",
  ]);

  if (!normalized) {
    return true;
  }

  if (singleBlockNoise.has(normalized)) {
    return true;
  }

  if (html.includes('href="/about"') || html.includes('href="/my-works"') || html.includes('href="/contact"')) {
    return true;
  }

  return normalized === "about my works contact portfolio";
}

function extractBlocks(html) {
  const marker = '<div class="sqs-html-content" data-sqsp-text-block-content>';
  const blocks = [];
  let searchIndex = 0;

  while (searchIndex < html.length) {
    const startIndex = html.indexOf(marker, searchIndex);

    if (startIndex === -1) {
      break;
    }

    const outerHtml = extractOuterDiv(html, startIndex);
    const text = normalizeWhitespace(blockHtmlToText(outerHtml));
    searchIndex = startIndex + outerHtml.length;

    if (isNoiseBlock(text, outerHtml)) {
      continue;
    }

    blocks.push(text);
  }

  return blocks;
}

function extractTitle(html) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);

  if (!titleMatch) {
    return "";
  }

  return decodeHtml(titleMatch[1])
    .replace(/\s+[—-]\s+PORTFOLIO$/i, "")
    .replace(/\s+&mdash;\s+PORTFOLIO$/i, "")
    .trim();
}

function collectProjectRoutes() {
  const lines = readFileSync(manifestPath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean);

  const routes = new Set();

  for (const line of lines) {
    const [pageUrl] = line.split("\t");
    const route = new URL(pageUrl).pathname;

    if (
      /^\/graphic-design\/[^/]+$/.test(route) ||
      /^\/coding\/[^/]+$/.test(route) ||
      /^\/product\/[^/]+$/.test(route)
    ) {
      routes.add(route);
    }
  }

  return [...routes].sort();
}

async function fetchPage(route) {
  const response = await fetch(`${baseUrl}${route}`);

  if (!response.ok) {
    throw new Error(`Request failed for ${route}: ${response.status}`);
  }

  const html = await response.text();

  return {
    title: extractTitle(html),
    blocks: extractBlocks(html),
  };
}

const liveContent = {
  fetchedAt: new Date().toISOString(),
  pages: {},
  projects: {},
};

for (const route of keyPages) {
  liveContent.pages[route] = await fetchPage(route);
}

for (const route of collectProjectRoutes()) {
  liveContent.projects[route] = await fetchPage(route);
}

writeFileSync(outputPath, `${JSON.stringify(liveContent, null, 2)}\n`, "utf8");
