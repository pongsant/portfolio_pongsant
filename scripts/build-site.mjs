import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const dataPath = new URL("../site-data.json", import.meta.url);
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const filialVideoSrc = "/video/filial%20web%20test%201.mov";
const githubPagesProjectPath = normalizeBasePath(
  process.env.GITHUB_PAGES_PROJECT_PATH ?? "/portfolio_pongsant"
);

const primaryNav = [
  { label: "PORTFOLIO", href: "/" },
  { label: "MY WORKS", href: "/my-works" },
  { label: "ABOUT", href: "/about" },
];

const contactPanelLinks = (data.contact?.links ?? []).filter(Boolean);
const utilityLinks = contactPanelLinks.filter((item) =>
  item.label === "Email" || item.label === "Instagram" || item.label === "YouTube"
);

function normalizeBasePath(value) {
  const normalized = String(value ?? "/").trim();

  if (!normalized || normalized === "/") {
    return "/";
  }

  const withLeadingSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;

  return withLeadingSlash.replace(/\/+$/, "");
}

function isExternalUrl(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value);
}

function escapeJs(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}

function renderRuntimeBaseScript() {
  const projectPath = githubPagesProjectPath === "/" ? "" : githubPagesProjectPath;

  return `<script>
      (() => {
        const projectPath = '${escapeJs(projectPath)}';
        const pathname = window.location.pathname || '/';
        const useProjectBase = Boolean(projectPath) && (pathname === projectPath || pathname.startsWith(projectPath + '/'));
        const baseHref = useProjectBase ? projectPath + '/' : '/';
        const baseTag = document.createElement('base');
        baseTag.href = baseHref;
        document.head.prepend(baseTag);
      })();
    </script>`;
}

function toPublicUrl(value) {
  const raw = String(value ?? "");

  if (!raw || isExternalUrl(raw) || !raw.startsWith("/")) {
    return raw;
  }

  if (raw === "/") {
    return "./";
  }

  return raw.slice(1);
}

function toHref(route) {
  const normalized = route === "/" ? "/" : `${route}/`;
  return toPublicUrl(normalized);
}

function outputPathFor(route) {
  if (route === "/") {
    return new URL("../index.html", import.meta.url);
  }

  return new URL(`..${route}/index.html`, import.meta.url);
}

function ensureWrite(route, html) {
  const fileUrl = outputPathFor(route);
  mkdirSync(dirname(fileUrl.pathname), { recursive: true });
  writeFileSync(fileUrl, html, "utf8");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function splitParagraphs(text) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function renderParagraphs(text, className = "rich-copy__paragraph") {
  return splitParagraphs(text)
    .map((paragraph) => {
      const withBreaks = paragraph
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br>");

      return `<p class="${className}">${withBreaks}</p>`;
    })
    .join("");
}

function trimText(value, maxLength = 220) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function currentNav(route, href) {
  if (href === "/") {
    return route === "/" || route === "/homepage-2";
  }

  if (href === "/my-works") {
    return (
      route === "/my-works" ||
      data.collections.some(
        (collection) => route === collection.route || route.startsWith(`${collection.route}/`)
      )
    );
  }

  return route === href;
}

function getProjectByRoute(route) {
  return data.projects.find((project) => project.route === route) ?? null;
}

function getCollectionByRoute(route) {
  return data.collections.find((collection) => collection.route === route) ?? null;
}

function getProjectsForCollection(route) {
  return data.projects.filter((project) => project.collectionRoute === route);
}

function getProjectCopy(project) {
  const blocks = (project.copyBlocks ?? [])
    .map((block) => ({
      type: block.type,
      text: String(block.text ?? "").trim(),
    }))
    .filter((block) => block.text);

  return {
    title: project.detailTitle || project.title,
    blocks,
  };
}

function renderMetaChips(items, className = "meta-chips") {
  const filteredItems = items.filter(Boolean);

  if (!filteredItems.length) {
    return "";
  }

  return `
    <div class="${className}">
      ${filteredItems
        .map((item) => `<span>${escapeHtml(item)}</span>`)
        .join("")}
    </div>
  `;
}

function renderChrome(route) {
  return `
    <header class="site-chrome">
      <nav class="chrome-nav" aria-label="Primary">
        ${primaryNav
          .map(
            (item) => `
              <a class="chrome-button${currentNav(route, item.href) ? " is-active" : ""}" href="${toHref(item.href)}">
                <span>${escapeHtml(item.label)}</span>
              </a>
            `
          )
          .join("")}
        <button class="chrome-button${route === "/contact" ? " is-active" : ""}" type="button" data-contact-open>
          <span>CONTACT</span>
        </button>
      </nav>
    </header>
  `;
}

function renderUtilityBar() {
  return `
    <div class="site-utility">
      <div class="site-utility__note">
        <span>${escapeHtml(data.site.location)}</span>
        <span>${escapeHtml(data.site.footerText)}</span>
      </div>
      <nav class="site-utility__links" aria-label="Direct links">
        ${utilityLinks
          .map(
            (item) => `
              <a class="chrome-button chrome-button--ghost" href="${escapeHtml(toPublicUrl(item.href))}"${item.external ? ' target="_blank" rel="noreferrer"' : ""}>
                <span>${escapeHtml(item.value || item.label)}</span>
              </a>
            `
          )
          .join("")}
      </nav>
    </div>
  `;
}

function renderContactPanel() {
  return `
    <div class="contact-panel" data-contact-panel hidden>
      <button class="contact-panel__scrim" type="button" aria-label="Close contact panel" data-contact-close></button>
      <section class="contact-panel__sheet" role="dialog" aria-modal="true" aria-labelledby="contact-panel-title">
        <div class="contact-panel__head">
          <p class="eyebrow">CONTACT</p>
          <button class="chrome-button chrome-button--ghost" type="button" data-contact-close>
            <span>CLOSE</span>
          </button>
        </div>
        <h2 id="contact-panel-title" class="contact-panel__title">${escapeHtml(data.contact.heading)}</h2>
        ${data.contact.intro ? `<p class="contact-panel__intro">${escapeHtml(data.contact.intro)}</p>` : ""}
        <div class="contact-panel__grid">
          ${contactPanelLinks
            .map(
              (item) => `
                <a class="contact-panel__card" href="${escapeHtml(toPublicUrl(item.href))}"${item.external ? ' target="_blank" rel="noreferrer"' : ""}>
                  <span class="contact-panel__label">${escapeHtml(item.label)}</span>
                  <strong class="contact-panel__value">${escapeHtml(item.value)}</strong>
                </a>
              `
            )
            .join("")}
        </div>
      </section>
    </div>
  `;
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="site-footer__inner">
        <div class="site-footer__brand">
          <p class="eyebrow">PORTFOLIO</p>
          <h2 class="site-footer__title">${escapeHtml(data.site.owner)}</h2>
        </div>
        <nav class="site-footer__nav" aria-label="Footer navigation">
          <a href="${toHref("/")}">HOME</a>
          <a href="${toHref("/my-works")}">MY WORKS</a>
          <a href="${toHref("/about")}">ABOUT</a>
          <a href="${toHref("/contact")}">CONTACT</a>
        </nav>
        <div class="site-footer__social">
          ${utilityLinks
            .map(
              (item) => `
                <a href="${escapeHtml(toPublicUrl(item.href))}"${item.external ? ' target="_blank" rel="noreferrer"' : ""}>
                  ${escapeHtml(item.label === "Email" ? item.value : item.label)}
                </a>
              `
            )
            .join("")}
        </div>
      </div>
    </footer>
  `;
}

function renderTorusField({
  className = "",
  kind = "ambient",
  speed = 0.8,
  density = 1,
  scale = 1,
  depth = 1,
  interactive = false,
} = {}) {
  const classes = ["torus-field", className].filter(Boolean).join(" ");

  return `
    <div
      class="${escapeHtml(classes)}"
      aria-hidden="true"
      data-torus-field
      data-torus-kind="${escapeHtml(kind)}"
      data-torus-speed="${escapeHtml(speed)}"
      data-torus-density="${escapeHtml(density)}"
      data-torus-scale="${escapeHtml(scale)}"
      data-torus-depth="${escapeHtml(depth)}"
      data-torus-interactive="${interactive ? "true" : "false"}"
    >
      <canvas class="torus-field__canvas"></canvas>
      <span class="torus-field__glow torus-field__glow--one"></span>
      <span class="torus-field__glow torus-field__glow--two"></span>
    </div>
  `;
}

function renderLayout({ route, title, description, pageClass, content, showUtilityBar = true }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)} | ${escapeHtml(data.site.title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    ${renderRuntimeBaseScript()}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${escapeHtml(toPublicUrl("/styles.css"))}">
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/bundled/lenis.min.js" defer></script>
    <script src="${escapeHtml(toPublicUrl("/script.js"))}" defer></script>
  </head>
  <body class="page ${escapeHtml(pageClass)}">
    <div class="site-wash" aria-hidden="true">
      <div class="site-wash__layer site-wash__layer--base"></div>
      <div class="site-wash__layer site-wash__layer--grain"></div>
      <div class="site-wash__layer site-wash__layer--diagonal"></div>
      <div class="site-wash__orb site-wash__orb--one"></div>
      <div class="site-wash__orb site-wash__orb--two"></div>
      ${renderTorusField({
        className: "site-wash__torus torus-field--ambient",
        kind: "ambient",
        speed: 0.42,
        density: 0.82,
        scale: 1.18,
        depth: 0.72,
      })}
    </div>
    ${renderChrome(route)}
    ${showUtilityBar ? renderUtilityBar() : ""}
    ${renderContactPanel()}
    ${content}
    ${renderFooter()}
  </body>
</html>
`;
}

function getCollectionRepresentative(collection) {
  const previewItem = collection.preview?.[0] ?? null;
  const previewProject = previewItem ? getProjectByRoute(previewItem.href) : null;
  const previewImages = previewProject?.images?.slice(0, 3) ?? collection.images?.slice(0, 3) ?? [];

  return {
    label: collection.label,
    shortLabel: collection.shortLabel,
    route: previewProject?.route ?? collection.route,
    buttonLabel: previewProject ? "OPEN PROJECT" : "OPEN ARCHIVE",
    title:
      previewProject?.title ??
      (collection.type === "gallery" ? `${collection.shortLabel} Archive` : previewItem?.title ?? collection.shortLabel),
    summary: previewProject?.summary ?? collection.pageIntro ?? collection.description ?? "",
    media: previewProject?.cover ?? previewItem?.cover ?? collection.cover,
    previewImages,
    tags: [
      collection.shortLabel,
      collection.type === "projects" ? `${collection.itemCount} PROJECTS` : `${collection.imageCount} IMAGES`,
      "PORTFOLIO",
    ],
  };
}

function getProjectLead(project, maxLength = 260) {
  const { blocks } = getProjectCopy(project);
  const leadParagraph = blocks.find((block) => block.type !== "heading")?.text ?? project.summary;

  return leadParagraph;
}

function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function renderEditorialHero({ label, title, summary, media, pills = [], mediaAlt = title }) {
  return `
    <section class="editorial-hero" data-section>
      ${renderTorusField({
        className: "editorial-hero__torus torus-field--editorial",
        kind: "editorial",
        speed: 0.58,
        density: 0.78,
        scale: 0.96,
        depth: 0.82,
      })}
      <div class="editorial-hero__copy">
        <p class="eyebrow motion-reveal">${escapeHtml(label)}</p>
        <h1 class="editorial-hero__title motion-reveal">${escapeHtml(title)}</h1>
        ${summary ? `<p class="editorial-hero__summary motion-reveal">${escapeHtml(summary)}</p>` : ""}
        ${renderMetaChips(pills, "meta-chips motion-reveal")}
      </div>
      <figure class="editorial-hero__media motion-scale" data-parallax-wrap>
        <img src="${escapeHtml(toPublicUrl(media))}" alt="${escapeHtml(mediaAlt)}" data-parallax="8">
      </figure>
    </section>
  `;
}

function renderEditorialPreviewRail(images, label) {
  if (!images.length) {
    return "";
  }

  return `
    <div class="editorial-entry__preview motion-reveal">
      ${images
        .map(
          (image, index) => `
            <figure class="editorial-entry__preview-item">
              <img src="${escapeHtml(toPublicUrl(image))}" alt="${escapeHtml(label)} preview ${index + 1}">
            </figure>
          `
        )
        .join("")}
    </div>
  `;
}

function renderEditorialCollectionEntry(collection, index) {
  const representative = getCollectionRepresentative(collection);
  const additionalTitles = (collection.preview ?? [])
    .slice(0, 3)
    .map((item) => item.title)
    .filter(Boolean);

  return `
    <article class="editorial-entry${index % 2 === 1 ? " editorial-entry--reverse" : ""}" data-section>
      <a class="editorial-entry__media motion-scale" href="${toHref(collection.route)}" data-parallax-wrap aria-label="Open ${escapeHtml(collection.label)}">
        <img src="${escapeHtml(toPublicUrl(representative.media))}" alt="${escapeHtml(collection.label)}" data-parallax="${10 + index * 2}">
      </a>
      <div class="editorial-entry__copy">
        <p class="eyebrow motion-reveal">${String(index + 1).padStart(2, "0")} · ${escapeHtml(collection.shortLabel)}</p>
        <h2 class="editorial-entry__title motion-reveal"><a href="${toHref(collection.route)}">${escapeHtml(collection.label)}</a></h2>
        ${(collection.pageIntro || collection.description) ? `<p class="editorial-entry__summary motion-reveal">${escapeHtml(collection.pageIntro ?? collection.description)}</p>` : ""}
        ${
          additionalTitles.length
            ? `
              <ul class="editorial-entry__list motion-reveal">
                ${additionalTitles.map((title) => `<li>${escapeHtml(title)}</li>`).join("")}
              </ul>
            `
            : ""
        }
        ${renderEditorialPreviewRail((representative.previewImages ?? []).slice(0, 2), collection.shortLabel)}
        <div class="editorial-entry__actions motion-reveal">
          <a class="chrome-button chrome-button--solid" href="${toHref(collection.route)}">
            <span>OPEN ${escapeHtml(collection.shortLabel.toUpperCase())}</span>
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderEditorialProjectEntry(project, index) {
  const previewImages = project.images.slice(1, 3);

  return `
    <article class="editorial-entry editorial-entry--project${index % 2 === 1 ? " editorial-entry--reverse" : ""}" data-section>
      <a class="editorial-entry__media motion-scale" href="${toHref(project.route)}" data-parallax-wrap aria-label="Open ${escapeHtml(project.title)}">
        <img src="${escapeHtml(toPublicUrl(project.cover))}" alt="${escapeHtml(project.title)}" data-parallax="${10 + index * 2}">
      </a>
      <div class="editorial-entry__copy">
        <p class="eyebrow motion-reveal">${String(index + 1).padStart(2, "0")} · ${escapeHtml(project.disciplineLabel)}</p>
        <h2 class="editorial-entry__title motion-reveal"><a href="${toHref(project.route)}">${escapeHtml(project.title)}</a></h2>
        ${renderEditorialPreviewRail(previewImages, project.title)}
        <div class="editorial-entry__actions motion-reveal">
          <a class="chrome-button chrome-button--solid" href="${toHref(project.route)}">
            <span>VIEW PROJECT</span>
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderGallerySequence(collection) {
  const groups = chunkArray(collection.images ?? [], 3);

  return `
    <section class="gallery-sequence">
      ${groups
        .map((group, index) => {
          const title = index === 0 ? collection.label : `${collection.shortLabel} ${String(index + 1).padStart(2, "0")}`;
          const summary = index === 0 ? collection.pageIntro ?? collection.description : "";

          return `
            <article class="gallery-sequence__group${index % 2 === 1 ? " gallery-sequence__group--reverse" : ""}" data-section>
              <div class="gallery-sequence__copy">
                <p class="eyebrow motion-reveal">${String(index + 1).padStart(2, "0")} · ${escapeHtml(collection.shortLabel)}</p>
                <h2 class="gallery-sequence__title motion-reveal">${escapeHtml(title)}</h2>
                ${summary ? `<p class="gallery-sequence__summary motion-reveal">${escapeHtml(summary)}</p>` : ""}
              </div>
              <div class="gallery-sequence__media${group.length === 1 ? " gallery-sequence__media--single" : ""}">
                <figure class="gallery-sequence__primary motion-scale" data-parallax-wrap>
                  <img src="${escapeHtml(toPublicUrl(group[0]))}" alt="${escapeHtml(title)} image 1" data-parallax="${12 + index * 2}">
                </figure>
                ${
                  group.length > 1
                    ? `
                      <div class="gallery-sequence__secondary">
                        ${group
                          .slice(1)
                          .map(
                            (image, imageIndex) => `
                              <figure class="gallery-sequence__secondary-item motion-scale" data-parallax-wrap>
                                <img src="${escapeHtml(toPublicUrl(image))}" alt="${escapeHtml(title)} image ${imageIndex + 2}" data-parallax="${10 + index * 2}">
                              </figure>
                            `
                          )
                          .join("")}
                      </div>
                    `
                    : ""
                }
              </div>
            </article>
          `;
        })
        .join("")}
    </section>
  `;
}

function renderEditorialInfoBlock(title, body) {
  return `
    <section class="editorial-info-block">
      <p class="eyebrow motion-reveal">${escapeHtml(title)}</p>
      <div class="editorial-info-block__body motion-reveal">${body}</div>
    </section>
  `;
}

function getHomeSlides() {
  const slides = [
    {
      key: "filial-project",
      label: "FEATURED PROJECT",
      navLabel: "FILIAL PROJECT",
      title: data.home.featuredStory.title,
      summary: trimText(
        `${data.home.featuredStory.aboutText} ${data.home.featuredStory.prototypeText}`,
        220
      ),
      route: data.home.featuredStory.referenceUrl,
      buttonLabel: "GO TO WEB",
      external: true,
      mediaType: "video",
      media: filialVideoSrc,
      previewImages: data.home.featuredStory.images ?? [],
      tags: ["BRAND", "PROTOTYPE", "WEB"],
    },
  ];

  for (const route of data.home.collectionOrder ?? []) {
    const collection = getCollectionByRoute(route);

    if (!collection) {
      continue;
    }

    slides.push({
      key: collection.key,
      navLabel: collection.shortLabel.toUpperCase(),
      ...getCollectionRepresentative(collection),
      mediaType: "image",
    });
  }

  return slides;
}

function renderHomeStage() {
  const slides = getHomeSlides();

  return `
    <section class="home-stage" data-stage>
      <div class="home-stage__slides">
        ${slides
          .map(
            (slide, index) => `
              <article class="stage-slide${index === 0 ? " is-active" : ""}" data-stage-slide="${index}">
                <div class="stage-slide__media-shell">
                  <div class="stage-slide__media-frame">
                    ${
                      slide.mediaType === "video"
                        ? `<video class="stage-slide__media" src="${escapeHtml(toPublicUrl(slide.media))}" muted loop playsinline preload="metadata" data-stage-video></video>`
                        : `<img class="stage-slide__media" src="${escapeHtml(toPublicUrl(slide.media))}" alt="${escapeHtml(slide.title)}">`
                    }
                  </div>
                </div>
                <div class="stage-slide__copy">
                  <p class="eyebrow">${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")} · ${escapeHtml(slide.label)}</p>
                  <h1 class="stage-slide__title">${escapeHtml(slide.title)}</h1>
                  <p class="stage-slide__summary">${escapeHtml(slide.summary)}</p>
                  ${renderMetaChips(slide.tags, "meta-chips meta-chips--light")}
                  <div class="stage-slide__actions">
                    <a class="chrome-button chrome-button--solid" href="${escapeHtml(toPublicUrl(slide.route))}"${slide.external ? ' target="_blank" rel="noreferrer"' : ""}>
                      <span>${escapeHtml(slide.buttonLabel)}</span>
                    </a>
                    <a class="chrome-button chrome-button--ghost" href="${slide.external ? toHref("/my-works") : toHref("/")}"${slide.external ? "" : ""}>
                      <span>${slide.external ? "VIEW PORTFOLIO" : "BACK HOME"}</span>
                    </a>
                  </div>
                </div>
                <div class="stage-slide__stack">
                  ${(slide.previewImages ?? [])
                    .slice(0, 3)
                    .map(
                      (image, previewIndex) => `
                        <figure class="stage-slide__thumb stage-slide__thumb--${previewIndex + 1}">
                          <img src="${escapeHtml(toPublicUrl(image))}" alt="${escapeHtml(slide.title)} preview ${previewIndex + 1}">
                        </figure>
                      `
                    )
                    .join("")}
                </div>
              </article>
            `
          )
          .join("")}
      </div>
      <aside class="home-stage__rail">
        <div class="home-stage__rail-head">
          <p class="eyebrow">SELECTED WORKS</p>
          <p class="home-stage__counter"><span data-stage-current>01</span><span>/</span><span>${String(slides.length).padStart(2, "0")}</span></p>
        </div>
        <div class="home-stage__progress">
          <span data-stage-progress></span>
        </div>
        <div class="home-stage__nav">
          ${slides
            .map(
              (slide, index) => `
                <button class="home-stage__nav-button${index === 0 ? " is-active" : ""}" type="button" data-stage-index="${index}">
                  <small>${String(index + 1).padStart(2, "0")}</small>
                  <span>${escapeHtml(slide.navLabel)}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </aside>
    </section>
  `;
}

function renderHomePage(route = "/") {
  const initialPortalPoses = [
    { x: "8%", y: "-4%", z: "32px", rx: "0deg", ry: "0deg", rz: "0deg", scale: "1", opacity: "1", blur: "0px", saturate: "1", zIndex: "40" },
    { x: "30%", y: "-17%", z: "180px", rx: "2deg", ry: "-12deg", rz: "6deg", scale: "1.05", opacity: "0.86", blur: "0px", saturate: "1.02", zIndex: "30" },
    { x: "50%", y: "-29%", z: "320px", rx: "3deg", ry: "-20deg", rz: "10deg", scale: "1.1", opacity: "0.58", blur: "1px", saturate: "0.92", zIndex: "20" },
    { x: "-42%", y: "20%", z: "-320px", rx: "-3deg", ry: "22deg", rz: "-10deg", scale: "0.82", opacity: "0.42", blur: "4px", saturate: "0.82", zIndex: "5" },
    { x: "-16%", y: "8%", z: "-120px", rx: "-1deg", ry: "12deg", rz: "-5deg", scale: "0.92", opacity: "0.68", blur: "2px", saturate: "0.9", zIndex: "15" },
  ];
  const collectionEntries = (data.home.collectionOrder ?? [])
    .map((route, index) => {
      const collection = getCollectionByRoute(route);

      if (!collection) {
        return null;
      }

      const previewItem = collection.preview?.[0] ?? null;
      const previewProject = previewItem ? getProjectByRoute(previewItem.href) : null;

      return {
        index,
        collection,
        route: collection.route,
        workTitle:
          previewProject?.title ??
          (collection.type === "gallery" ? `${collection.shortLabel} Selection` : previewItem?.title ?? collection.shortLabel),
        summary: previewProject?.summary ?? collection.pageIntro ?? collection.description ?? "",
        media: previewProject?.cover ?? previewItem?.cover ?? collection.cover,
        countLabel: collection.type === "projects" ? `${collection.itemCount} projects` : `${collection.imageCount} images`,
      };
    })
    .filter(Boolean);

  const content = `
    <main class="page-main page-main--stack page-main--home-flow">
      <section class="home-section home-portal" data-section data-home-portal>
        <div class="home-portal__intro">
          <p class="eyebrow motion-reveal">PORTFOLIO CATEGORIES</p>
          <div class="home-portal__headline">
            <h1 class="home-portal__title motion-reveal">${(data.home.nameLines ?? [data.site.owner])
              .map((line) => `<span data-hero-line>${escapeHtml(line)}</span>`)
              .join("")}</h1>
            ${data.home.intro ? `<p class="home-portal__summary motion-reveal">${escapeHtml(data.home.intro)}</p>` : ""}
          </div>
          <div class="home-portal__controls">
            <div class="home-portal__nav motion-reveal" aria-label="Category preview navigation">
              ${collectionEntries
                .map(
                  (entry) => `
                    <button class="home-portal__nav-button${entry.index === 0 ? " is-active" : ""}" type="button" data-portal-index="${entry.index}">
                      <small>${String(entry.index + 1).padStart(2, "0")}</small>
                      <span>${escapeHtml(entry.collection.shortLabel.toUpperCase())}</span>
                    </button>
                  `
                )
                .join("")}
            </div>
            <div class="home-portal__progress motion-reveal" aria-hidden="true">
              <span data-portal-progress></span>
            </div>
          </div>
        </div>
        <div class="home-portal__scene motion-scale" data-portal-scene tabindex="0" aria-label="Portfolio category stage">
          <div class="home-portal__utility motion-reveal">
            <span>${escapeHtml(data.site.location)}</span>
            ${utilityLinks
              .map(
                (item) => `
                  <a href="${escapeHtml(toPublicUrl(item.href))}"${item.external ? ' target="_blank" rel="noreferrer"' : ""}>
                    ${escapeHtml(item.label === "Email" ? item.value : item.label)}
                  </a>
                `
              )
              .join("")}
          </div>
          <div class="home-portal__ambient home-portal__ambient--one" aria-hidden="true"></div>
          <div class="home-portal__ambient home-portal__ambient--two" aria-hidden="true"></div>
          <div class="home-portal__glow" aria-hidden="true"></div>
          ${renderTorusField({
            className: "home-portal__torus torus-field--hero",
            kind: "hero",
            speed: 0.86,
            density: 1.06,
            scale: 1.08,
            depth: 1.1,
            interactive: true,
          })}
          <div class="home-portal__stage" data-portal-stage>
            ${collectionEntries
              .map(
                (entry) => `
                  ${
                    (() => {
                      const pose = initialPortalPoses[entry.index] ?? initialPortalPoses[0];

                      return `
                  <a
                    class="home-portal__layer home-portal__layer--text${entry.index === 0 ? " is-active" : ""}"
                    href="${toHref(entry.route)}"
                    data-portal-layer="${entry.index}"
                    aria-label="Open ${escapeHtml(entry.collection.label)}"
                    style="
                      --layer-x: ${pose.x};
                      --layer-y: ${pose.y};
                      --layer-z: ${pose.z};
                      --layer-rx: ${pose.rx};
                      --layer-ry: ${pose.ry};
                      --layer-rz: ${pose.rz};
                      --layer-scale: ${pose.scale};
                      --layer-opacity: ${pose.opacity};
                      --layer-blur: ${pose.blur};
                      --layer-saturate: ${pose.saturate};
                      z-index: ${pose.zIndex};
                    "
                  >
                    <span class="home-portal__layer-sheen" aria-hidden="true"></span>
                    <span class="home-portal__layer-copy">
                      <strong>${escapeHtml(entry.collection.shortLabel)}</strong>
                      <em>${escapeHtml(entry.workTitle)}</em>
                    </span>
                  </a>
                `;
                    })()
                  }
                `
              )
              .join("")}
          </div>
        </div>
        <div class="home-portal__status">
          <div class="home-portal__details">
            ${collectionEntries
              .map(
                (entry) => `
                  <article class="home-portal__detail${entry.index === 0 ? " is-active" : ""}" data-portal-detail="${entry.index}">
                    <p class="eyebrow">${String(entry.index + 1).padStart(2, "0")} · ${escapeHtml(entry.collection.label)}</p>
                    <h2 class="home-portal__detail-title">${escapeHtml(entry.workTitle)}</h2>
                    ${entry.summary ? `<p class="home-portal__detail-summary">${escapeHtml(entry.summary)}</p>` : ""}
                    ${renderMetaChips(
                      [entry.countLabel.toUpperCase(), entry.collection.shortLabel.toUpperCase()],
                      "meta-chips meta-chips--portal"
                    )}
                    <div class="home-portal__actions">
                      <a class="chrome-button chrome-button--solid" href="${toHref(entry.route)}">
                        <span>ENTER ${escapeHtml(entry.collection.shortLabel.toUpperCase())}</span>
                      </a>
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>
          <a class="home-portal__cue motion-reveal" href="#filial-project">
            <span>SCROLL</span>
            <strong>FILIAL PROJECT</strong>
          </a>
        </div>
      </section>

      <section class="home-section home-featured-section" id="filial-project" data-section>
        ${renderTorusField({
          className: "home-featured-section__torus torus-field--bridge",
          kind: "bridge",
          speed: 0.68,
          density: 0.72,
          scale: 0.9,
          depth: 0.76,
        })}
        <div class="home-section__header">
          <div>
            <p class="eyebrow motion-reveal">FILIAL PROJECT</p>
            <h2 class="home-section__title motion-reveal">${escapeHtml(data.home.featuredStory.title)}</h2>
          </div>
          ${data.home.photoMeta ? `<div class="home-section__lede motion-reveal">${renderParagraphs(data.home.photoMeta, "home-section__lede-paragraph")}</div>` : ""}
        </div>
        <div class="featured-project">
          <figure class="featured-project__media motion-scale" data-parallax-wrap>
            <video class="featured-project__video" src="${escapeHtml(toPublicUrl(filialVideoSrc))}" muted loop playsinline preload="metadata" data-scroll-video data-parallax="8"></video>
          </figure>
          <div class="featured-project__content">
            <div class="featured-project__block motion-reveal">
              <p class="eyebrow">${escapeHtml(data.home.featuredStory.aboutLabel)}</p>
              <p>${escapeHtml(data.home.featuredStory.aboutText)}</p>
            </div>
            <div class="featured-project__block motion-reveal">
              <p class="eyebrow">${escapeHtml(data.home.featuredStory.prototypeLabel)}</p>
              <p>${escapeHtml(data.home.featuredStory.prototypeText)}</p>
            </div>
            <div class="featured-project__actions motion-reveal">
              <a class="chrome-button chrome-button--solid" href="${escapeHtml(toPublicUrl(data.home.featuredStory.referenceUrl))}" target="_blank" rel="noreferrer"><span>GO TO WEB</span></a>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;

  return renderLayout({
    route,
    title: data.site.owner,
    description: data.home.intro,
    pageClass: "page-home",
    content,
    showUtilityBar: false,
  });
}

function renderCollectionPanel(collection) {
  const representative = getCollectionRepresentative(collection);

  return `
    <article class="collection-panel collection-panel--${escapeHtml(collection.accent)}">
      <a class="collection-panel__media" href="${toHref(collection.route)}">
        <img src="${escapeHtml(toPublicUrl(collection.cover))}" alt="${escapeHtml(collection.label)}">
      </a>
      <div class="collection-panel__body">
        <p class="eyebrow">${escapeHtml(collection.shortLabel)}</p>
        <h2 class="collection-panel__title"><a href="${toHref(collection.route)}">${escapeHtml(collection.label)}</a></h2>
        <p class="collection-panel__summary">${escapeHtml(collection.description)}</p>
        ${renderMetaChips(
          [
            collection.type === "projects" ? `${collection.itemCount} PROJECTS` : `${collection.imageCount} IMAGES`,
            representative.title,
          ],
          "meta-chips"
        )}
        <div class="collection-panel__preview">
          ${(representative.previewImages ?? [])
            .slice(0, 3)
            .map(
              (image) => `
                <figure class="collection-panel__preview-item">
                  <img src="${escapeHtml(toPublicUrl(image))}" alt="${escapeHtml(collection.shortLabel)} preview">
                </figure>
              `
            )
            .join("")}
        </div>
        <a class="chrome-button chrome-button--solid" href="${toHref(collection.route)}">
          <span>OPEN ${escapeHtml(collection.shortLabel.toUpperCase())}</span>
        </a>
      </div>
    </article>
  `;
}

function renderWorksHub() {
  const heroMedia = data.collections[0]?.cover ?? data.about.portrait;
  const content = `
    <main class="page-main page-main--stack">
      ${renderEditorialHero({
        label: "PORTFOLIO INDEX",
        title: data.worksHub.title,
        summary: data.worksHub.intro,
        media: heroMedia,
        pills: [],
      })}
      <section class="editorial-directory">
        ${data.collections.map((collection, index) => renderEditorialCollectionEntry(collection, index)).join("")}
      </section>
    </main>
  `;

  return renderLayout({
    route: data.worksHub.route,
    title: data.worksHub.title,
    description: data.worksHub.intro,
    pageClass: "page-hub",
    content,
  });
}

function renderInfoBlock(title, body) {
  return `
    <section class="info-card">
      <p class="eyebrow">${escapeHtml(title)}</p>
      <div class="info-card__body">${body}</div>
    </section>
  `;
}

function renderAboutPage() {
  const content = `
    <main class="page-main page-main--stack">
      ${renderEditorialHero({
        label: "ABOUT",
        title: data.site.owner,
        summary: "",
        media: data.about.portrait,
        pills: [],
      })}
      <section class="editorial-bio" data-section>
        <div class="editorial-bio__lead"></div>
        <div class="editorial-info-stack">
          ${(data.about.sections ?? [])
            .map((section) =>
              renderEditorialInfoBlock(
                section.heading,
                renderParagraphs(section.body, "editorial-info-block__paragraph")
              )
            )
            .join("")}
        </div>
      </section>
    </main>
  `;

  return renderLayout({
    route: data.about.route,
    title: data.about.title,
    description: data.about.summaryText,
    pageClass: "page-about",
    content,
  });
}

function renderContactPage() {
  const content = `
    <main class="page-main page-main--stack">
      ${renderEditorialHero({
        label: "CONTACT",
        title: data.contact.heading,
        summary: "",
        media: data.contact.portrait,
        pills: [],
      })}
      <section class="contact-directory" data-section>
        ${contactPanelLinks
          .map(
            (item) => `
              <a class="contact-directory__item motion-reveal" href="${escapeHtml(toPublicUrl(item.href))}"${item.external ? ' target="_blank" rel="noreferrer"' : ""}>
                <span class="contact-directory__label">${escapeHtml(item.label)}</span>
                <strong class="contact-directory__value">${escapeHtml(item.value)}</strong>
                <span class="contact-directory__arrow">OPEN</span>
              </a>
            `
          )
          .join("")}
      </section>
    </main>
  `;

  return renderLayout({
    route: data.contact.route,
    title: data.contact.title,
    description: data.contact.intro,
    pageClass: "page-contact",
    content,
  });
}

function renderArchiveHero(title, label, summary, media, pills = []) {
  return `
    <section class="archive-hero">
      <div class="archive-hero__copy">
        <p class="eyebrow">${escapeHtml(label)}</p>
        <h1 class="archive-hero__title">${escapeHtml(title)}</h1>
        <p class="archive-hero__summary">${escapeHtml(summary)}</p>
        ${renderMetaChips(pills, "meta-chips")}
      </div>
      <figure class="archive-hero__media">
        <img src="${escapeHtml(toPublicUrl(media))}" alt="${escapeHtml(title)}">
      </figure>
    </section>
  `;
}

function renderProjectFeedCard(project) {
  return `
    <article class="project-feed-card">
      <a class="project-feed-card__media" href="${toHref(project.route)}">
        <img src="${escapeHtml(toPublicUrl(project.cover))}" alt="${escapeHtml(project.title)}">
      </a>
      <div class="project-feed-card__body">
        <p class="eyebrow">${escapeHtml(project.disciplineLabel)}</p>
        <h2 class="project-feed-card__title"><a href="${toHref(project.route)}">${escapeHtml(project.title)}</a></h2>
        <p class="project-feed-card__summary">${escapeHtml(trimText(project.summary, 210))}</p>
        ${renderMetaChips([`${project.imageCount} IMAGES`, project.disciplineLabel.toUpperCase()], "meta-chips")}
        <a class="chrome-button chrome-button--solid" href="${toHref(project.route)}">
          <span>VIEW PROJECT</span>
        </a>
      </div>
    </article>
  `;
}

function renderGalleryWall(images, title) {
  return `
    <section class="gallery-wall">
      ${images
        .map(
          (image, index) => `
            <figure class="gallery-wall__item gallery-wall__item--${(index % 5) + 1}">
              <img src="${escapeHtml(toPublicUrl(image))}" alt="${escapeHtml(title)} image ${index + 1}">
            </figure>
          `
        )
        .join("")}
    </section>
  `;
}

function renderCollectionPage(collection) {
  const representative = getCollectionRepresentative(collection);
  const projects = getProjectsForCollection(collection.route);
  const pills =
    collection.type === "projects"
      ? [`${collection.itemCount} PROJECTS`, `${collection.imageCount} IMAGES`, collection.shortLabel.toUpperCase()]
      : [`${collection.imageCount} IMAGES`, collection.shortLabel.toUpperCase(), "ARCHIVE"];

  const content = `
    <main class="page-main page-main--stack">
      ${renderEditorialHero({
        label: collection.shortLabel,
        title: collection.label,
        summary: collection.pageIntro || collection.description,
        media: collection.cover,
        pills: [],
      })}
      ${
        collection.type === "projects"
          ? `
            <section class="editorial-project-list">
              ${projects.map((project, index) => renderEditorialProjectEntry(project, index)).join("")}
            </section>
          `
          : renderGallerySequence(collection)
      }
    </main>
  `;

  return renderLayout({
    route: collection.route,
    title: collection.label,
    description: representative.summary,
    pageClass: "page-collection",
    content,
  });
}

function renderProjectNarrative(project) {
  const { title, blocks } = getProjectCopy(project);

  return `
    <section class="project-narrative">
      <p class="eyebrow">${escapeHtml(project.disciplineLabel)}</p>
      <h1 class="project-narrative__title">${escapeHtml(title)}</h1>
      <p class="project-narrative__summary">${escapeHtml(project.summary)}</p>
      ${renderMetaChips([`${project.imageCount} IMAGES`, "PORTFOLIO"], "meta-chips")}
      <div class="project-narrative__body">
        ${blocks
          .map((block) => {
            if (block.type === "heading") {
              return `<h2 class="project-narrative__heading">${escapeHtml(block.text)}</h2>`;
            }

            return renderParagraphs(block.text, "project-narrative__paragraph");
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderProjectMediaFlow(images, title) {
  return `
    <section class="project-media-flow">
      ${images
        .map((image, index) => {
          let variant = "project-media-flow__item--wide";

          if (index % 5 === 1) {
            variant = "project-media-flow__item--portrait";
          } else if (index % 5 === 2) {
            variant = "project-media-flow__item--square";
          } else if (index % 5 === 3) {
            variant = "project-media-flow__item--tall";
          } else if (index % 5 === 4) {
            variant = "project-media-flow__item--landscape";
          }

          return `
            <figure class="project-media-flow__item ${variant} motion-scale" data-parallax-wrap>
              <img src="${escapeHtml(toPublicUrl(image))}" alt="${escapeHtml(title)} image ${index + 1}" data-parallax="${8 + (index % 4) * 2}">
            </figure>
          `;
        })
        .join("")}
    </section>
  `;
}

function renderProjectPage(project) {
  const siblings = getProjectsForCollection(project.collectionRoute);
  const index = siblings.findIndex((item) => item.route === project.route);
  const previous = siblings[index - 1] ?? null;
  const next = siblings[index + 1] ?? null;
  const { title, blocks } = getProjectCopy(project);
  const [leadBlock, ...restBlocks] = blocks;

  const content = `
    <main class="page-main page-main--stack">
      <div class="project-breadcrumbs motion-reveal">
        <a class="chrome-button chrome-button--ghost" href="${toHref(project.collectionRoute)}">
          <span>BACK TO ${escapeHtml(project.disciplineLabel.toUpperCase())}</span>
        </a>
      </div>
      <section class="project-detail" data-section>
        ${renderTorusField({
          className: "project-detail__torus torus-field--detail",
          kind: "detail",
          speed: 0.52,
          density: 0.7,
          scale: 0.82,
          depth: 0.7,
        })}
        <header class="project-detail__intro">
          <p class="eyebrow motion-reveal">${escapeHtml(project.disciplineLabel)}</p>
          <h1 class="project-detail__title motion-reveal">${escapeHtml(title)}</h1>
          ${
            leadBlock
              ? `<div class="project-detail__lead motion-reveal">${renderParagraphs(
                  leadBlock.text,
                  "project-detail__paragraph"
                )}</div>`
              : ""
          }
        </header>
        ${renderProjectMediaFlow(project.images, project.title)}
        ${
          restBlocks.length
            ? `
        <section class="project-detail__copy motion-reveal">
          ${restBlocks
            .map((block) => {
              if (block.type === "heading") {
                return `<h2 class="project-detail__heading">${escapeHtml(block.text)}</h2>`;
              }

              return renderParagraphs(block.text, "project-detail__paragraph");
            })
            .join("")}
        </section>
          `
            : ""
        }
      </section>
      <nav class="project-pagination motion-reveal" aria-label="Project navigation">
        ${
          previous
            ? `<a class="chrome-button chrome-button--ghost" href="${toHref(previous.route)}"><span>PREVIOUS · ${escapeHtml(previous.title)}</span></a>`
            : `<span></span>`
        }
        ${
          next
            ? `<a class="chrome-button chrome-button--ghost" href="${toHref(next.route)}"><span>NEXT · ${escapeHtml(next.title)}</span></a>`
            : `<span></span>`
        }
      </nav>
    </main>
  `;

  return renderLayout({
    route: project.route,
    title: project.title,
    description: project.summary,
    pageClass: "page-project",
    content,
  });
}

ensureWrite("/", renderHomePage("/"));
ensureWrite("/homepage-2", renderHomePage("/homepage-2"));
ensureWrite(data.worksHub.route, renderWorksHub());
ensureWrite(data.about.route, renderAboutPage());
ensureWrite(data.contact.route, renderContactPage());

data.collections.forEach((collection) => {
  ensureWrite(collection.route, renderCollectionPage(collection));
});

data.projects.forEach((project) => {
  ensureWrite(project.route, renderProjectPage(project));
});
