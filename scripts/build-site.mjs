import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const dataPath = new URL("../site-data.json", import.meta.url);
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const filialVideoSrc = "/video/filial%20web%20test%201.mov";

function toAssetUrl(localPath) {
  return `/${localPath.split("/").map(encodeURIComponent).join("/")}`;
}

const homeAssets = {
  heroPoster: data.home.featuredStory.cover,
  featuredLogo: toAssetUrl("assets/site-import/images/0157_logo+2.png"),
  graphicPoster: toAssetUrl("assets/site-import/images/0123_pongsant+poster.jpg"),
  graphicTall: toAssetUrl("assets/site-import/images/0146_1.jpg"),
  graphicLandscape: toAssetUrl("assets/site-import/images/0075_1.jpg"),
  graphicSquare: toAssetUrl("assets/site-import/images/0130_Screenshot+2026-01-04+at+22.32.39.png"),
  graphicTower: toAssetUrl("assets/site-import/images/0134_Screenshot+2026-01-04+at+22.42.42.png"),
  photoPortrait: toAssetUrl("assets/site-import/images/0025_L1000282.jpeg"),
  photoWideOne: toAssetUrl("assets/site-import/images/0018_IMG_2138.JPG"),
  photoTall: toAssetUrl("assets/site-import/images/0088_IMG_2292.JPG"),
  photoWideTwo: toAssetUrl("assets/site-import/images/0099_IMG_2265.JPG"),
};

const socialLinks = (data.contact?.links ?? [])
  .filter((item) => item.label === "Instagram" || item.label === "YouTube")
  .map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.label.toLowerCase(),
  }));

function toHref(route) {
  return route === "/" ? "/" : `${route}/`;
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
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function currentNav(route, href) {
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

function renderSocialIcon(name) {
  if (name === "instagram") {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" ry="4.5" fill="none" stroke="currentColor" stroke-width="1.5"></rect>
        <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="1.5"></circle>
        <circle cx="17.4" cy="6.7" r="1.2" fill="currentColor"></circle>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.1" y="6.6" width="17.8" height="10.8" rx="3" ry="3" fill="none" stroke="currentColor" stroke-width="1.5"></rect>
      <path d="M10 9.3 15.7 12 10 14.7Z" fill="currentColor"></path>
    </svg>
  `;
}

function renderSocialLinks(className = "site-social") {
  return `
    <div class="${className}" aria-label="Social links">
      ${socialLinks
        .map(
          (item) => `
            <a href="${escapeHtml(item.href)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(item.label)}">
              ${renderSocialIcon(item.icon)}
            </a>
          `
        )
        .join("")}
    </div>
  `;
}

function renderHeader(route) {
  return `
    <header class="site-header">
      <nav class="site-nav" aria-label="Primary">
        ${data.navigation
          .map(
            (item) => `
              <a href="${toHref(item.href)}" class="${currentNav(route, item.href) ? "is-active" : ""}">
                ${escapeHtml(item.label)}
              </a>
            `
          )
          .join("")}
      </nav>
      <div class="site-title">
        <a href="/">PORTFOLIO</a>
      </div>
      ${renderSocialLinks()}
    </header>
  `;
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="site-footer__rule"></div>
      ${renderSocialLinks("site-footer__social")}
      <a class="site-footer__link site-footer__link--about" href="${toHref("/about")}">ABOUT</a>
      <a class="site-footer__link site-footer__link--works" href="${toHref("/my-works")}">MY WORKS</a>
      <a class="site-footer__link site-footer__link--contact" href="${toHref("/contact")}">CONTACT</a>
      <a class="site-footer__title" href="/">PORTFOLIO</a>
    </footer>
  `;
}

function renderLoop(text) {
  return `
    <div class="page-loop" aria-hidden="true">
      <div class="page-loop__track">
        <span>${escapeHtml(text)}</span>
        <span>${escapeHtml(text)}</span>
        <span>${escapeHtml(text)}</span>
        <span>${escapeHtml(text)}</span>
      </div>
    </div>
  `;
}

function renderMoodTrack(words) {
  const safeWords = Array.isArray(words) && words.length ? words : ["Portfolio Interface"];

  return `
    <section class="signal-band" aria-label="Design mood">
      <div class="signal-band__track">
        ${safeWords
          .concat(safeWords)
          .map((word) => `<span>${escapeHtml(word)}</span>`)
          .join("")}
      </div>
    </section>
  `;
}

function renderLayout({ route, title, description, pageClass, content }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)} | ${escapeHtml(data.site.title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700&family=Poppins:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body class="page ${escapeHtml(pageClass)}">
    <div class="site-backdrop" aria-hidden="true">
      <div class="site-backdrop__glow site-backdrop__glow--one"></div>
      <div class="site-backdrop__glow site-backdrop__glow--two"></div>
      <div class="site-backdrop__noise"></div>
    </div>
    <div class="site-shell">
      ${renderHeader(route)}
      ${content}
      ${renderFooter()}
    </div>
  </body>
</html>
`;
}

function renderStatsStrip(items) {
  return `
    <div class="stat-strip">
      ${items
        .map(
          (item) => `
            <div class="stat-strip__item">
              <strong>${escapeHtml(item.value)}</strong>
              <span>${escapeHtml(item.label)}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderCollectionCard(collection, options = {}) {
  const previewItems = (collection.preview ?? []).slice(0, options.compact ? 3 : 4);
  const metaLabel = collection.type === "projects"
    ? `${collection.itemCount} projects`
    : `${collection.imageCount} images`;

  return `
    <article class="collection-card collection-card--${escapeHtml(collection.accent)}${options.compact ? " collection-card--compact" : ""}">
      <a class="collection-card__media" href="${toHref(collection.route)}">
        <span class="collection-card__halo"></span>
        <img src="${collection.cover}" alt="${escapeHtml(collection.shortLabel)}">
      </a>
      <div class="collection-card__body">
        <p class="section-kicker">${escapeHtml(collection.shortLabel)}</p>
        <h3><a href="${toHref(collection.route)}">${escapeHtml(collection.label)}</a></h3>
        <p>${escapeHtml(collection.description)}</p>
        <div class="collection-card__preview">
          ${previewItems
            .map(
              (item) => `
                <a class="collection-card__preview-item" href="${toHref(item.href)}">
                  <img src="${item.cover}" alt="${escapeHtml(item.title)}">
                </a>
              `
            )
            .join("")}
        </div>
        <div class="collection-card__meta">
          <span>${escapeHtml(metaLabel)}</span>
          <a class="text-link" href="${toHref(collection.route)}">Open ${escapeHtml(collection.shortLabel)}</a>
        </div>
      </div>
    </article>
  `;
}

function renderProjectCard(project, index = 0) {
  return `
    <article class="project-card${index === 0 ? " project-card--lead" : ""}">
      <a class="project-card__media" href="${toHref(project.route)}">
        <img src="${project.cover}" alt="${escapeHtml(project.title)}">
      </a>
      <div class="project-card__body">
        <p class="section-kicker">${escapeHtml(project.disciplineLabel)}</p>
        <h3><a href="${toHref(project.route)}">${escapeHtml(project.title)}</a></h3>
        <p>${escapeHtml(project.summary)}</p>
        <div class="project-card__meta">
          <span>${escapeHtml(String(project.imageCount))} images</span>
          <a class="text-link" href="${toHref(project.route)}">View project</a>
        </div>
      </div>
    </article>
  `;
}

function renderGalleryMasonry(images) {
  return `
    <div class="gallery-wall">
      ${images
        .map(
          (image, index) => `
            <figure class="gallery-wall__item gallery-wall__item--${(index % 5) + 1}">
              <img src="${image}" alt="Gallery image ${index + 1}">
            </figure>
          `
        )
        .join("")}
    </div>
  `;
}

function renderProjectGallery(images, title) {
  return `
    <section class="project-gallery">
      ${images
        .map((image, index) => {
          let variant = "project-gallery__item--square";
          if (index === 0) {
            variant = "project-gallery__item--wide";
          } else if (index % 5 === 0) {
            variant = "project-gallery__item--tall";
          } else if (index % 3 === 0) {
            variant = "project-gallery__item--landscape";
          }

          return `
            <figure class="project-gallery__item ${variant}">
              <img src="${image}" alt="${escapeHtml(title)} image ${index + 1}">
            </figure>
          `;
        })
        .join("")}
    </section>
  `;
}

function renderHomePage(route = "/") {
  const content = `
    <main class="page-main">
      <section class="home-section home-grid home-hero">
        <h1 class="home-hero__line home-hero__line--primary">PONGSANT</h1>
        <h2 class="home-hero__line home-hero__line--secondary">CHINTANAPAKDEE</h2>
        <figure class="home-hero__poster">
          <img src="${homeAssets.heroPoster}" alt="${escapeHtml(data.site.owner)} poster">
        </figure>
        <div class="home-divider"></div>
      </section>

      <section class="home-section home-grid home-featured">
        <figure class="home-featured__logo">
          <img src="${homeAssets.featuredLogo}" alt="${escapeHtml(data.home.featuredStory.title)} logo">
        </figure>
        <div class="home-copy home-featured__about">
          <p><strong>${escapeHtml(data.home.featuredStory.aboutLabel)} ${escapeHtml(data.home.featuredStory.title)}</strong></p>
          <p>${escapeHtml(data.home.featuredStory.aboutText)}</p>
        </div>
        <figure class="home-featured__video">
          <video src="${filialVideoSrc}" poster="${data.home.featuredStory.cover}" preload="metadata" controls loop playsinline></video>
        </figure>
        <div class="home-copy home-featured__prototype">
          <p><strong>${escapeHtml(data.home.featuredStory.prototypeLabel)}</strong></p>
          <p>${escapeHtml(data.home.featuredStory.prototypeText)}</p>
        </div>
        <div class="home-featured__action">
          <a class="home-button" href="${escapeHtml(data.home.featuredStory.referenceUrl)}" target="_blank" rel="noreferrer">GO TO WEB</a>
        </div>
      </section>

      <section class="home-section home-grid home-graphic">
        <h2 class="home-section-title home-graphic__title">Graphic Design</h2>
        <figure class="home-graphic__poster">
          <img src="${homeAssets.graphicPoster}" alt="Graphic Design poster">
        </figure>
        <figure class="home-graphic__tall">
          <img src="${homeAssets.graphicTall}" alt="Graphic Design preview one">
        </figure>
        <figure class="home-graphic__landscape">
          <img src="${homeAssets.graphicLandscape}" alt="Graphic Design preview two">
        </figure>
        <figure class="home-graphic__square">
          <img src="${homeAssets.graphicSquare}" alt="Graphic Design preview three">
        </figure>
        <figure class="home-graphic__tower">
          <img src="${homeAssets.graphicTower}" alt="Graphic Design preview four">
        </figure>
        <div class="home-graphic__action">
          <a class="home-button" href="${toHref("/graphic-design")}">Learn more</a>
        </div>
        <div class="home-divider"></div>
      </section>

      <section class="home-section home-grid home-photo">
        <h2 class="home-section-title home-photo__title">PHOTOGRAPHY</h2>
        <div class="home-copy home-photo__meta">
          <p><strong>By</strong><br>${escapeHtml(data.site.owner)}</p>
          <p><strong>Year</strong><br>2024</p>
        </div>
        <figure class="home-photo__portrait">
          <img src="${homeAssets.photoPortrait}" alt="Photography preview one">
        </figure>
        <figure class="home-photo__wide-one">
          <img src="${homeAssets.photoWideOne}" alt="Photography preview two">
        </figure>
        <div class="home-photo__action">
          <a class="home-button" href="${toHref("/photo")}">Photo</a>
        </div>
        <figure class="home-photo__tall">
          <img src="${homeAssets.photoTall}" alt="Photography preview three">
        </figure>
        <figure class="home-photo__wide-two">
          <img src="${homeAssets.photoWideTwo}" alt="Photography preview four">
        </figure>
      </section>

      <section class="home-works">
        <div class="home-works__inner home-grid">
          <h2 class="home-works__title">MY WORKS</h2>
          <a class="home-works__link home-works__link--graphic" href="${toHref("/graphic-design")}">GRAPHIC DESIGN</a>
          <a class="home-works__link home-works__link--photo" href="${toHref("/photo")}">PHOTO</a>
          <a class="home-works__link home-works__link--drawing" href="${toHref("/drawing")}">DRAWING</a>
          <a class="home-works__link home-works__link--coding" href="${toHref("/coding")}">CODING</a>
          <a class="home-works__link home-works__link--product" href="${toHref("/product")}">PRODUCT DESIGN</a>
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
  });
}

function renderWorksHub() {
  const content = `
    <main class="page-main">
      ${renderLoop(data.worksHub.loopText)}
      <section class="page-intro page-intro--hub">
        <div>
          <p class="section-kicker">${escapeHtml(data.site.title)}</p>
          <h1>${escapeHtml(data.worksHub.title)}</h1>
          <p>${escapeHtml(data.worksHub.intro)}</p>
        </div>
        <div class="page-intro__stack">
          ${data.collections
            .slice(0, 3)
            .map(
              (collection) => `
                <div class="page-intro__stack-item">
                  <img src="${collection.cover}" alt="${escapeHtml(collection.shortLabel)}">
                  <span>${escapeHtml(collection.shortLabel)}</span>
                </div>
              `
            )
            .join("")}
        </div>
      </section>
      <section class="section-block">
        <div class="collection-grid">
          ${data.collections.map((collection) => renderCollectionCard(collection)).join("")}
        </div>
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

function renderAboutPage() {
  const content = `
    <main class="page-main">
      ${renderLoop(data.about.loopText)}
      <section class="page-intro page-intro--split">
        <div class="page-intro__copy">
          <p class="section-kicker">${escapeHtml(data.site.title)}</p>
          <h1>${escapeHtml(data.about.title)}</h1>
          ${data.about.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        </div>
        <div class="portrait-stage">
          <div class="portrait-stage__frame">
            <img src="${data.about.portrait}" alt="${escapeHtml(data.site.owner)}">
          </div>
          <blockquote class="quote-card">
            <p>Bangkok, Los Angeles, and New York all stay visible in the way the work moves between image, interface, and object.</p>
          </blockquote>
        </div>
      </section>
      <section class="info-grid">
        <article class="info-card">
          <p class="section-kicker">Education</p>
          ${data.about.education
            .map(
              (item) => `
                <div class="info-item">
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.detail)}</p>
                </div>
              `
            )
            .join("")}
        </article>
        <article class="info-card">
          <p class="section-kicker">Scholarships</p>
          ${data.about.achievements
            .map(
              (item) => `
                <div class="info-item">
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.detail)}</p>
                </div>
              `
            )
            .join("")}
        </article>
        <article class="info-card">
          <p class="section-kicker">Skills</p>
          <div class="tag-list">
            ${data.about.skills.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
        </article>
        <article class="info-card">
          <p class="section-kicker">Interests</p>
          <div class="tag-list">
            ${data.about.interests.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
        </article>
      </section>
    </main>
  `;

  return renderLayout({
    route: data.about.route,
    title: data.about.title,
    description: data.about.paragraphs[0],
    pageClass: "page-about",
    content,
  });
}

function renderContactPage() {
  const content = `
    <main class="page-main">
      ${renderLoop(data.contact.loopText)}
      <section class="page-intro page-intro--split">
        <div class="page-intro__copy">
          <p class="section-kicker">${escapeHtml(data.site.title)}</p>
          <h1>${escapeHtml(data.contact.title)}</h1>
          <p>${escapeHtml(data.contact.intro)}</p>
          <div class="contact-list">
            ${data.contact.links
              .map(
                (item) => `
                  <a href="${item.href}"${item.external ? ' target="_blank" rel="noreferrer"' : ""}>
                    <span>${escapeHtml(item.label)}</span>
                    <strong>${escapeHtml(item.value)}</strong>
                  </a>
                `
              )
              .join("")}
          </div>
        </div>
        <div class="portrait-stage portrait-stage--contact">
          <div class="portrait-stage__frame">
            <img src="${data.contact.portrait}" alt="${escapeHtml(data.site.owner)}">
          </div>
          <div class="contact-note">
            <p class="section-kicker">Available for</p>
            <p>Graphic design, interactive portfolio direction, visual storytelling, and creative web presentations.</p>
          </div>
        </div>
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

function renderCollectionHero(collection) {
  const stats = collection.type === "projects"
    ? [
        { value: collection.itemCount, label: "projects" },
        { value: collection.imageCount, label: "images" },
        { value: collection.shortLabel, label: "discipline" },
      ]
    : [
        { value: collection.imageCount, label: "images" },
        { value: collection.shortLabel, label: "discipline" },
        { value: "Archive", label: "mode" },
      ];

  return `
    <section class="collection-hero collection-hero--${escapeHtml(collection.accent)}">
      <div class="collection-hero__copy">
        <p class="section-kicker">${escapeHtml(collection.shortLabel)}</p>
        <h1>${escapeHtml(collection.label)}</h1>
        <p>${escapeHtml(collection.description)}</p>
        ${renderStatsStrip(stats)}
      </div>
      <div class="collection-hero__visual">
        <figure class="collection-hero__cover">
          <img src="${collection.cover}" alt="${escapeHtml(collection.shortLabel)}">
        </figure>
        <div class="collection-hero__stack">
          ${(collection.preview ?? [])
            .slice(0, 3)
            .map(
              (item) => `
                <a class="collection-hero__mini" href="${toHref(item.href)}">
                  <img src="${item.cover}" alt="${escapeHtml(item.title)}">
                </a>
              `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderCollectionPage(collection) {
  const content = collection.type === "projects"
    ? `
      <main class="page-main">
        ${renderLoop(`${collection.label} * ${collection.label} *`)}
        ${renderCollectionHero(collection)}
        <section class="section-block">
          <div class="project-grid">
            ${data.projects
              .filter((project) => project.collectionRoute === collection.route)
              .map((project, index) => renderProjectCard(project, index))
              .join("")}
          </div>
        </section>
      </main>
    `
    : `
      <main class="page-main">
        ${renderLoop(`${collection.label} * ${collection.label} *`)}
        ${renderCollectionHero(collection)}
        <section class="section-block">
          ${renderGalleryMasonry(collection.images)}
        </section>
      </main>
    `;

  return renderLayout({
    route: collection.route,
    title: collection.label,
    description: collection.description,
    pageClass: "page-collection",
    content,
  });
}

function renderProjectPage(project) {
  const siblings = data.projects.filter((item) => item.collectionRoute === project.collectionRoute);
  const index = siblings.findIndex((item) => item.route === project.route);
  const previous = siblings[index - 1] ?? null;
  const next = siblings[index + 1] ?? null;
  const galleryThumbs = project.images.slice(1, 4);

  const content = `
    <main class="page-main">
      <section class="project-stage">
        <div class="project-stage__copy">
          <a class="back-link" href="${toHref(project.collectionRoute)}">${escapeHtml(project.disciplineLabel)}</a>
          <p class="section-kicker">${escapeHtml(project.disciplineLabel)}</p>
          <h1>${escapeHtml(project.title)}</h1>
          <p>${escapeHtml(project.summary)}</p>
          ${renderStatsStrip([
            { value: project.imageCount, label: "images" },
            { value: project.disciplineLabel, label: "discipline" },
            { value: "Live Archive", label: "source" },
          ])}
        </div>
        <div class="project-stage__visual">
          <figure class="project-stage__hero-image">
            <img src="${project.cover}" alt="${escapeHtml(project.title)}">
          </figure>
          <div class="project-stage__thumbs">
            ${galleryThumbs
              .map(
                (image, thumbIndex) => `
                  <figure class="project-stage__thumb">
                    <img src="${image}" alt="${escapeHtml(project.title)} thumb ${thumbIndex + 1}">
                  </figure>
                `
              )
              .join("")}
          </div>
        </div>
      </section>

      <section class="project-panels">
        <article class="project-panel">
          <p class="section-kicker">Project Note</p>
          <p>This page keeps the original live archive images visible while shifting the presentation toward a more cinematic, case-study-like reading experience.</p>
        </article>
        <article class="project-panel">
          <p class="section-kicker">Navigate</p>
          <p>Use the sequence below to move through the project and then continue to the next work in the same discipline.</p>
        </article>
      </section>

      ${renderProjectGallery(project.images, project.title)}

      <section class="project-pagination">
        ${previous ? `<a href="${toHref(previous.route)}">Previous: ${escapeHtml(previous.title)}</a>` : `<span></span>`}
        <a href="${toHref(project.collectionRoute)}">Back to ${escapeHtml(project.disciplineLabel)}</a>
        ${next ? `<a href="${toHref(next.route)}">Next: ${escapeHtml(next.title)}</a>` : `<span></span>`}
      </section>
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
