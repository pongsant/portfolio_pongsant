import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const dataPath = new URL("../site-data.json", import.meta.url);
const projectRoot = new URL("../", import.meta.url);
const data = JSON.parse(readFileSync(dataPath, "utf8"));

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
    return route === "/my-works" ||
      data.collections.some((collection) => route === collection.route || route.startsWith(`${collection.route}/`));
  }

  return route === href;
}

function renderHeader(route) {
  return `
    <header class="site-header">
      <a class="site-logo" href="/">PORTFOLIO</a>
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
    </header>
  `;
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <nav class="site-footer__nav" aria-label="Footer">
        <a href="${toHref("/about")}">ABOUT</a>
        <a href="${toHref("/my-works")}">MY WORKS</a>
        <a href="${toHref("/contact")}">CONTACT</a>
        <a href="/">PORTFOLIO</a>
      </nav>
      <p class="site-footer__copy">${escapeHtml(data.site.owner)} · ${escapeHtml(data.site.location)}</p>
      <p class="site-footer__copy">${escapeHtml(data.site.footerText)}</p>
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
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body class="page ${escapeHtml(pageClass)}">
    <div class="site-shell">
      ${renderHeader(route)}
      ${content}
      ${renderFooter()}
    </div>
  </body>
</html>
`;
}

function renderCollectionCard(collection, compact = false) {
  return `
    <article class="collection-card${compact ? " collection-card--compact" : ""}">
      <a class="collection-card__media" href="${toHref(collection.route)}">
        <img src="${collection.cover}" alt="${escapeHtml(collection.shortLabel)}">
      </a>
      <div class="collection-card__body">
        <p class="section-kicker">${escapeHtml(collection.shortLabel)}</p>
        <h3><a href="${toHref(collection.route)}">${escapeHtml(collection.label)}</a></h3>
        <p>${escapeHtml(collection.description)}</p>
        <span class="text-link">${collection.type === "projects" ? `${collection.itemCount} projects` : `${collection.imageCount} images`}</span>
      </div>
    </article>
  `;
}

function renderProjectCard(project) {
  return `
    <article class="project-card">
      <a class="project-card__media" href="${toHref(project.route)}">
        <img src="${project.cover}" alt="${escapeHtml(project.title)}">
      </a>
      <div class="project-card__body">
        <p class="section-kicker">${escapeHtml(project.disciplineLabel)}</p>
        <h3><a href="${toHref(project.route)}">${escapeHtml(project.title)}</a></h3>
      </div>
    </article>
  `;
}

function renderImageGallery(images) {
  return `
    <div class="gallery-wall">
      ${images
        .map(
          (image, index) => `
            <figure class="gallery-wall__item">
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
        .map(
          (image, index) => `
            <figure class="project-gallery__item${index === 0 ? " project-gallery__item--wide" : ""}">
              <img src="${image}" alt="${escapeHtml(title)} image ${index + 1}">
            </figure>
          `
        )
        .join("")}
    </section>
  `;
}

function renderHomePage(route = "/") {
  const collections = data.home.collectionOrder
    .map((collectionRoute) => data.collections.find((collection) => collection.route === collectionRoute))
    .filter(Boolean);

  const content = `
    <main>
      <section class="home-hero">
        <div class="home-hero__copy">
          <p class="section-kicker">${escapeHtml(data.site.title)}</p>
          <h1>${escapeHtml(data.site.owner.toUpperCase())}</h1>
          <p class="home-hero__text">${escapeHtml(data.home.intro)}</p>
          <div class="hero-links">
            <a class="button-link" href="${toHref("/my-works")}">MY WORKS</a>
            <a class="text-link" href="${toHref("/about")}">ABOUT</a>
          </div>
        </div>
        <div class="home-hero__image">
          <img src="${data.home.featuredStory.cover}" alt="${escapeHtml(data.home.featuredStory.title)}">
        </div>
      </section>

      <section class="home-feature section-block">
        <div class="home-feature__copy">
          <p class="section-kicker">${escapeHtml(data.home.featuredStory.aboutLabel)}</p>
          <h2>${escapeHtml(data.home.featuredStory.title)}</h2>
          <p>${escapeHtml(data.home.featuredStory.aboutText)}</p>
          <h3>${escapeHtml(data.home.featuredStory.prototypeLabel)}</h3>
          <p>${escapeHtml(data.home.featuredStory.prototypeText)}</p>
          <a class="text-link" href="${toHref("/my-works")}">GO TO WORKS</a>
        </div>
        <div class="home-feature__stack">
          ${data.home.featuredStory.images
            .map(
              (image, index) => `
                <div class="home-feature__image${index === 0 ? " home-feature__image--primary" : ""}">
                  <img src="${image}" alt="${escapeHtml(data.home.featuredStory.title)} image ${index + 1}">
                </div>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="section-block">
        <div class="section-head">
          <p class="section-kicker">MY WORKS</p>
          <h2>Explore the archive by discipline.</h2>
        </div>
        <div class="collection-grid">
          ${collections.map((collection) => renderCollectionCard(collection, true)).join("")}
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
    <main>
      ${renderLoop(data.worksHub.loopText)}
      <section class="page-intro">
        <p class="section-kicker">${escapeHtml(data.site.title)}</p>
        <h1>${escapeHtml(data.worksHub.title)}</h1>
        <p>${escapeHtml(data.worksHub.intro)}</p>
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
    <main>
      ${renderLoop(data.about.loopText)}
      <section class="page-intro page-intro--split">
        <div>
          <p class="section-kicker">${escapeHtml(data.site.title)}</p>
          <h1>${escapeHtml(data.about.title)}</h1>
          ${data.about.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        </div>
        <div class="portrait-frame">
          <img src="${data.about.portrait}" alt="${escapeHtml(data.site.owner)}">
        </div>
      </section>
      <section class="section-block info-grid">
        <article class="info-card">
          <h2>Education</h2>
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
          <h2>Scholarships and Achievements</h2>
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
          <h2>Skills</h2>
          <div class="tag-list">
            ${data.about.skills.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
        </article>
        <article class="info-card">
          <h2>Interests</h2>
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
    <main>
      ${renderLoop(data.contact.loopText)}
      <section class="page-intro page-intro--split">
        <div>
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
        <div class="portrait-frame">
          <img src="${data.contact.portrait}" alt="${escapeHtml(data.site.owner)}">
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

function renderCollectionPage(collection) {
  const content = collection.type === "projects"
    ? `
      <main>
        ${renderLoop(`${collection.label} * ${collection.label} *`)}
        <section class="page-intro">
          <p class="section-kicker">${escapeHtml(collection.shortLabel)}</p>
          <h1>${escapeHtml(collection.label)}</h1>
          <p>${escapeHtml(collection.description)}</p>
        </section>
        <section class="section-block project-grid">
          ${data.projects
            .filter((project) => project.collectionRoute === collection.route)
            .map((project) => renderProjectCard(project))
            .join("")}
        </section>
      </main>
    `
    : `
      <main>
        ${renderLoop(`${collection.label} * ${collection.label} *`)}
        <section class="page-intro">
          <p class="section-kicker">${escapeHtml(collection.shortLabel)}</p>
          <h1>${escapeHtml(collection.label)}</h1>
          <p>${escapeHtml(collection.description)}</p>
        </section>
        <section class="section-block">
          ${renderImageGallery(collection.images)}
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

  const content = `
    <main>
      <section class="project-hero">
        <a class="back-link" href="${toHref(project.collectionRoute)}">${escapeHtml(project.disciplineLabel)}</a>
        <p class="section-kicker">${escapeHtml(project.disciplineLabel)}</p>
        <h1>${escapeHtml(project.title)}</h1>
        <p>${escapeHtml(project.summary)}</p>
      </section>
      ${renderProjectGallery(project.images, project.title)}
      <section class="project-pagination">
        ${previous ? `<a href="${toHref(previous.route)}">Previous: ${escapeHtml(previous.title)}</a>` : `<span></span>`}
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
