import { readFileSync, writeFileSync } from "node:fs";

const sourcePath = new URL("../site-data.json", import.meta.url);
const outputPath = new URL("../project-copy.json", import.meta.url);
const baseUrl = "https://www.pongsantchin.com";

const data = JSON.parse(readFileSync(sourcePath, "utf8"));

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
    const text = blockHtmlToText(outerHtml);
    searchIndex = startIndex + outerHtml.length;

    if (isNoiseBlock(text, outerHtml)) {
      continue;
    }

    const type = /<h[1-6]\b/i.test(outerHtml) && text.length <= 160 ? "heading" : "body";
    blocks.push({ type, text });
  }

  return blocks;
}

async function fetchProjectCopy(route) {
  const response = await fetch(`${baseUrl}${route}`);

  if (!response.ok) {
    throw new Error(`Request failed for ${route}: ${response.status}`);
  }

  const html = await response.text();
  const blocks = extractBlocks(html);
  const [firstBlock, ...rest] = blocks;
  const detailTitle = firstBlock?.type === "heading" ? firstBlock.text : null;

  return {
    detailTitle,
    blocks: firstBlock?.type === "heading" ? rest : blocks,
  };
}

const output = {};

for (const project of data.projects) {
  output[project.route] = await fetchProjectCopy(project.route);
}

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
