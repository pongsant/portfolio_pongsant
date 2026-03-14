import { existsSync, readFileSync, writeFileSync } from "node:fs";

const manifestPath = new URL("../assets/site-import/manifest.tsv", import.meta.url);
const outputPath = new URL("../site-data.json", import.meta.url);
const projectCopyPath = new URL("../project-copy.json", import.meta.url);
const liveContentPath = new URL("../live-content.json", import.meta.url);

const routeMeta = {
  "/graphic-design/project-six-sz8wl-bb73t": {
    title: "David Carson Poster Design",
    discipline: "graphic-design",
  },
  "/graphic-design/project-six-6f87e-hep2b": {
    title: "Project Six",
    discipline: "graphic-design",
  },
  "/graphic-design/project-five-jkmzy-r6ser": {
    title: "Portrait Poster Design",
    discipline: "graphic-design",
  },
  "/graphic-design/project-four-yjynj-8m64e": {
    title: "Nature Poster Design",
    discipline: "graphic-design",
  },
  "/graphic-design/project-three-8zgh7-7kart": {
    title: "Name Poster",
    discipline: "graphic-design",
  },
  "/graphic-design/project-two-llrgk-499cz": {
    title: "Josh Lennon Poster",
    discipline: "graphic-design",
  },
  "/graphic-design/font-design-1": {
    title: "Font Design 1",
    discipline: "graphic-design",
  },
  "/graphic-design/font-design-2": {
    title: "Font Design 2",
    discipline: "graphic-design",
  },
  "/graphic-design/initial-logo-design": {
    title: "Initial Logo Design",
    discipline: "graphic-design",
  },
  "/graphic-design/typographic-systems-handbook": {
    title: "Typographic Systems Handbook",
    discipline: "graphic-design",
  },
  "/graphic-design/calendar-design": {
    title: "Calendar Design",
    discipline: "graphic-design",
  },
  "/graphic-design/branding-design": {
    title: "Branding Design",
    discipline: "graphic-design",
  },
  "/graphic-design/visual-hierachy-design": {
    title: "Visual Hierachy Design",
    discipline: "graphic-design",
  },
  "/graphic-design/year-poster-design": {
    title: "Year Poster Design 1",
    discipline: "graphic-design",
  },
  "/graphic-design/year-poster-design-2": {
    title: "Year Poster Design 2",
    discipline: "graphic-design",
  },
  "/graphic-design/magazine-design": {
    title: "Magazine Design",
    discipline: "graphic-design",
  },
  "/graphic-design/rebranding-coffeeblack": {
    title: "Rebranding Coffeeblack",
    discipline: "graphic-design",
  },
  "/graphic-design/kwickcook-meal-plan-kit": {
    title: "Kwickcook Meal Plan Kit",
    discipline: "graphic-design",
  },
  "/graphic-design/postcards-from-the-future": {
    title: "Postcards from the Future",
    discipline: "graphic-design",
  },
  "/graphic-design/project-one-ephnc-e6ck8": {
    title: "7 Sins Design",
    discipline: "graphic-design",
  },
  "/graphic-design/typography-car": {
    title: "Typography Car",
    discipline: "graphic-design",
  },
  "/graphic-design/project-one-f5w4d-br6yr": {
    title: "Project One",
    discipline: "graphic-design",
  },
  "/graphic-design/project-one-f5w4d-ebxzf": {
    title: "POTRAIT OF THE SELFLESS SELF",
    discipline: "graphic-design",
  },
  "/coding/project-three-8zgh7-xtbsr": {
    title: "Temperature Glow Lamp",
    discipline: "coding",
  },
  "/coding/project-two-llrgk-kx83j": {
    title: "Web Design and Coding",
    discipline: "coding",
  },
  "/coding/project-one-ephnc-ngeg5": {
    title: "Flower",
    discipline: "coding",
  },
  "/coding/the-last-hope": {
    title: "The Last Hope",
    discipline: "coding",
  },
  "/product/project-two-llrgk-3hjw3": {
    title: "Decorative Box",
    discipline: "product",
  },
  "/product/project-one-ephnc-3368k": {
    title: "Interactive Table",
    discipline: "product",
  },
};

const collectionDefs = [
  {
    key: "graphic-design",
    label: "GRAPHIC DESIGN",
    shortLabel: "Graphic Design",
    route: "/graphic-design",
    type: "projects",
    accent: "acid",
    description: "Poster systems, branding studies, publication work, and typography experiments.",
    coverRoute: "/graphic-design/project-one-f5w4d-ebxzf",
  },
  {
    key: "photo",
    label: "PHOTO",
    shortLabel: "Photo",
    route: "/photo",
    type: "gallery",
    accent: "silver",
    description: "Photography by Pongsant Chintanapakdee, built around mood, everyday detail, light, and movement.",
    pageIntro:
      "Photography, for me, is more than capturing moments; it’s about revealing emotions, memories, and fragments of truth hidden in everyday life. Coming from a background in graphic design and expanding into creative technology, I approach photography with a mix of composition, concept, and curiosity. Each photo in this portfolio is a quiet reflection of how I see the world, through light, shadow, movement, and mood. Whether it’s a candid street scene or a surreal still life, my goal is to tell stories that make people feel, think, or simply pause.",
    coverRoute: "/photo",
  },
  {
    key: "drawing",
    label: "DRAWING",
    shortLabel: "Drawing",
    route: "/drawing",
    type: "gallery",
    accent: "ember",
    description: "Sketches, studies, and hand-drawn work that stay visible alongside digital projects.",
    coverRoute: "/drawing",
  },
  {
    key: "coding",
    label: "CODING",
    shortLabel: "Coding",
    route: "/coding",
    type: "projects",
    accent: "digital",
    description: "Interactive prototypes and creative technology built through HTML, CSS, JavaScript, and physical computing.",
    coverRoute: "/coding/the-last-hope",
  },
  {
    key: "product",
    label: "PRODUCT DESIGN",
    shortLabel: "Product Design",
    route: "/product",
    type: "projects",
    accent: "stone",
    description: "Objects and spatial interactions shaped by material thinking, display, and cultural references.",
    coverRoute: "/product/project-one-ephnc-3368k",
  },
];

const disciplineLabels = {
  "graphic-design": "Graphic Design",
  coding: "Coding",
  product: "Product Design",
};

const disciplineToRoute = {
  "graphic-design": "/graphic-design",
  coding: "/coding",
  product: "/product",
};

const navigation = [
  { label: "MY WORKS", href: "/my-works" },
  { label: "ABOUT", href: "/about" },
  { label: "CONTACT", href: "/contact" },
];

const manifestLines = readFileSync(manifestPath, "utf8")
  .trim()
  .split("\n")
  .filter(Boolean);

const projectCopy = existsSync(projectCopyPath)
  ? JSON.parse(readFileSync(projectCopyPath, "utf8"))
  : {};
const liveContent = existsSync(liveContentPath)
  ? JSON.parse(readFileSync(liveContentPath, "utf8"))
  : { pages: {}, projects: {} };

const refs = manifestLines.map((line) => {
  const [pageUrl, imageUrl, localPath] = line.split("\t");
  const route = new URL(pageUrl).pathname;
  return { pageUrl, route, imageUrl, localPath };
});

const groupedRefs = refs.reduce((accumulator, ref) => {
  accumulator[ref.route] ??= [];
  accumulator[ref.route].push(ref);
  return accumulator;
}, {});

function toAssetUrl(localPath) {
  return `/${localPath.split("/").map(encodeURIComponent).join("/")}`;
}

function localImagesFor(route) {
  return (groupedRefs[route] ?? []).map((ref) => toAssetUrl(ref.localPath));
}

function firstImageFor(route) {
  return localImagesFor(route)[0] ?? "";
}

function routeToSlug(route) {
  return route.split("/").filter(Boolean).at(-1);
}

function pageBlocks(route) {
  return liveContent.pages?.[route]?.blocks ?? [];
}

function projectBlocks(route) {
  return liveContent.projects?.[route]?.blocks ?? [];
}

function splitHeadingBlock(text) {
  const parts = String(text ?? "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    heading: parts[0] ?? "",
    body: parts.slice(1).join("\n\n").trim(),
  };
}

function createSummary(route) {
  return projectBlocks(route)[0] ?? (projectCopy[route]?.blocks ?? []).find((block) => block.type === "body")?.text ?? "";
}

const featuredStoryRefs = (groupedRefs["/homepage-2"] ?? []).filter((ref) => {
  return (
    ref.imageUrl.includes("Screenshot+2025-04-02+at+11.48.25") ||
    ref.imageUrl.includes("logo+2.png")
  );
});

const featuredStoryImages = featuredStoryRefs.length
  ? featuredStoryRefs.map((ref) => toAssetUrl(ref.localPath))
  : localImagesFor("/homepage-2").slice(0, 2);

const homeBlocks = pageBlocks("/homepage-2");
const aboutBlocks = pageBlocks("/about");
const contactBlocks = pageBlocks("/contact");
const photoBlocks = pageBlocks("/photo");
const myWorksBlocks = pageBlocks("/my-works");

const homeFilial = splitHeadingBlock(homeBlocks[2]);
const homePrototype = splitHeadingBlock(homeBlocks[3]);
const aboutSections = aboutBlocks.map((block) => splitHeadingBlock(block));
const aboutSummary = aboutSections.find((section) => section.heading.toUpperCase().startsWith("SUMMARY"))?.body ?? "";
const aboutEducation = aboutSections.find((section) => section.heading.toUpperCase().startsWith("EDUCATION"))?.body ?? "";
const aboutScholarships =
  aboutSections.find((section) => section.heading.toUpperCase().startsWith("SCHOLARSHIP"))?.body ?? "";
const aboutSkills = aboutSections.find((section) => section.heading.toUpperCase().startsWith("SKILLS"))?.body ?? "";
const contactBlock = contactBlocks[0] ?? "";
const [contactHeadingLine = "Contacts", ...contactDetailLines] = contactBlock.split("\n").map((line) => line.trim()).filter(Boolean);

const projects = Object.entries(routeMeta).map(([route, meta]) => {
  const images = localImagesFor(route);
  const liveProjectTitle = liveContent.projects?.[route]?.title?.trim();

  return {
    route,
    slug: routeToSlug(route),
    title: liveProjectTitle || meta.title,
    discipline: meta.discipline,
    disciplineLabel: disciplineLabels[meta.discipline],
    collectionRoute: disciplineToRoute[meta.discipline],
    summary: createSummary(route),
    detailTitle: liveProjectTitle || projectCopy[route]?.detailTitle || meta.title,
    copyBlocks: projectCopy[route]?.blocks ?? [],
    images,
    cover: images[0],
    imageCount: images.length,
  };
});

const collections = collectionDefs.map((collection) => {
  if (collection.type === "projects") {
    const items = projects.filter((project) => project.collectionRoute === collection.route);
    return {
      ...collection,
      description: collection.route === "/photo" ? photoBlocks[0] ?? "" : "",
      cover: firstImageFor(collection.coverRoute) || items[0]?.cover || "",
      itemCount: items.length,
      imageCount: items.reduce((total, item) => total + item.imageCount, 0),
      preview: items.slice(0, 4).map((item) => ({
        title: item.title,
        cover: item.cover,
        href: item.route,
      })),
    };
  }

  const images = localImagesFor(collection.route);
  return {
    ...collection,
    description: collection.route === "/photo" ? photoBlocks[0] ?? "" : "",
    pageIntro: collection.route === "/photo" ? photoBlocks[0] ?? "" : "",
    cover: firstImageFor(collection.coverRoute),
    itemCount: images.length,
    imageCount: images.length,
    images,
    preview: images.slice(0, 4).map((image, index) => ({
      title: `${collection.shortLabel} ${index + 1}`,
      cover: image,
      href: collection.route,
    })),
  };
});

const data = {
  site: {
    title: "PORTFOLIO",
    owner: "Pongsant Chintanapakdee",
    location: "New York, NY",
    footerText: "Built from the currently published portfolio archive on March 14, 2026.",
  },
  navigation,
  home: {
    route: "/",
    aliases: ["/homepage-2"],
    title: "Pongsant Chintanapakdee",
    intro: aboutSummary,
    nameLines: homeBlocks.slice(0, 2),
    moodWords: [
      "Graphic Systems",
      "Interactive Stage",
      "Digital Artifact",
      "Editorial Motion",
      "Spatial Image",
      "Portfolio Interface",
    ],
    featuredStory: {
      title: "Filial Project",
      cover: featuredStoryImages[0],
      images: featuredStoryImages,
      aboutLabel: homeFilial.heading || "About Filial Project",
      aboutText: homeFilial.body,
      prototypeLabel: homePrototype.heading || "Interactive Website Prototype",
      prototypeText: homePrototype.body,
      referenceUrl: "https://pongsant.github.io/filial-project-web-test/gate.html?next=index.html",
      referenceLabel: "Open Filial Project",
    },
    photoMeta: homeBlocks[6] ?? "",
    collectionOrder: collections.map((collection) => collection.route),
  },
  about: {
    route: "/about",
    title: "ABOUT",
    loopText: "ABOUT * ABOUT * ABOUT *",
    portrait: firstImageFor("/about"),
    summaryText: aboutSummary,
    educationLines: aboutEducation.split("\n").map((line) => line.trim()).filter(Boolean),
    achievementLines: aboutScholarships.split("\n").map((line) => line.trim()).filter(Boolean),
    skillsInterestLines: aboutSkills.split("\n").map((line) => line.trim()).filter(Boolean),
    sections: aboutSections,
  },
  contact: {
    route: "/contact",
    title: "CONTACT",
    loopText: "CONTACT * CONTACT * CONTACT *",
    portrait: firstImageFor("/contact"),
    heading: contactHeadingLine,
    intro: "",
    textBlock: contactBlock,
    links: [
      {
        label: "Email",
        value: contactDetailLines[0] ?? "1pongsant@gmail.com",
        href: "mailto:1pongsant@gmail.com",
      },
      {
        label: "Phone",
        value: contactDetailLines[1] ?? "(424)599-3914",
        href: "tel:+14245993914",
      },
      {
        label: "Location",
        value: contactDetailLines[2] ?? "New York, NY",
        href: "/contact",
      },
      {
        label: "Instagram",
        value: "@prum20baht",
        href: "https://www.instagram.com/prum20baht/",
        external: true,
      },
      {
        label: "YouTube",
        value: "@prum20baht",
        href: "https://youtube.com/@prum20baht?si=k6HOOQvXn0Ae1lkB",
        external: true,
      },
    ],
  },
  worksHub: {
    route: "/my-works",
    title: "MY WORKS",
    loopText: "MY WORKS * MY WORKS * MY WORKS *",
    intro: "",
    categories: myWorksBlocks,
  },
  collections,
  projects,
  stats: {
    projectPages: projects.length,
    collectionPages: collections.length,
    importedImages: refs.length,
  },
};

writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
