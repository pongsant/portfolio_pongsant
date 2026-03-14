import { existsSync, readFileSync, writeFileSync } from "node:fs";

const manifestPath = new URL("../assets/site-import/manifest.tsv", import.meta.url);
const outputPath = new URL("../site-data.json", import.meta.url);
const projectCopyPath = new URL("../project-copy.json", import.meta.url);

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

const summaryOverrides = {
  "POTRAIT OF THE SELFLESS SELF": "A high-image graphic design project carried over from the live archive and rebuilt as a clean standalone detail page.",
  "The Last Hope": "A coding project presented as a visual story sequence, now translated into a page structure that matches the original portfolio hierarchy.",
  "Interactive Table": "A product design project focused on form, interaction, and presentation through the original published image sequence.",
  "Postcards from the Future": "A graphic design project with a strong image rhythm that works well as a full project page in the rebuilt archive.",
};

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

function trimSummary(value, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function createSummary(route, title, discipline) {
  const copyBlock = (projectCopy[route]?.blocks ?? []).find((block) => block.type === "body");

  if (copyBlock?.text) {
    return trimSummary(copyBlock.text);
  }

  if (summaryOverrides[title]) {
    return summaryOverrides[title];
  }

  return `${disciplineLabels[discipline]} work imported from the current live portfolio and ready to swap later with original high-resolution files.`;
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

const projects = Object.entries(routeMeta).map(([route, meta]) => {
  const images = localImagesFor(route);
  return {
    route,
    slug: routeToSlug(route),
    title: meta.title,
    discipline: meta.discipline,
    disciplineLabel: disciplineLabels[meta.discipline],
    collectionRoute: disciplineToRoute[meta.discipline],
    summary: createSummary(route, meta.title, meta.discipline),
    detailTitle: projectCopy[route]?.detailTitle || meta.title,
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
    intro:
      "A multidisciplinary designer working across graphic design, photography, drawing, coding, and product design.",
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
      aboutLabel: "About",
      aboutText:
        "Filial Project is a clothing brand started with friends, focused on minimal design, strong identity, and thoughtful presentation across both fashion and digital platforms.",
      prototypeLabel: "Interactive Website Prototype",
      prototypeText:
        "Designed and coded independently using HTML, CSS, and JavaScript as a functional brand prototype for digital fashion presentation and interactive storytelling.",
      referenceUrl: "https://pongsant.github.io/filial-project-web-test/gate.html?next=index.html",
      referenceLabel: "Open Filial Project",
    },
    collectionOrder: collections.map((collection) => collection.route),
  },
  about: {
    route: "/about",
    title: "ABOUT",
    loopText: "ABOUT * ABOUT * ABOUT *",
    portrait: firstImageFor("/about"),
    summaryText:
      "Born and raised in Bangkok, Thailand, Pongsant Chintanapakdee has been deeply inspired by the world of art and music since childhood. His upbringing in a creative family-with a mother skilled in visual arts and a father who is both an Interior Architect and Graphic Designer instilled in him a passion for design and creativity. After moving to Los Angeles in 2021, he pursued his artistic journey in the United States, earning recognition and scholarships from prestigious art institutions.",
    educationLines: [
      "BACHELOR OF FINE ARTS (BFA) In Design and Technology",
      "- Parsons School of Design, New York City, Expected Graduation: 2027",
      "Graphic Design",
      "- Santa Monica College, Los Angeles (2023)",
    ],
    achievementLines: [
      "- Silas H. Rhodes Scholarship, School of Visual Arts (SVA) Awarded a 50% tuition scholarship, along with additional grants.",
      "- Scholarships and Grants, Pratt Institute and Parsons School of Design",
      "- Pratt Institute: 60% tuition scholarship.",
      "- Parsons School of Design: 40% tuition scholarship, accepted for Fall 2024.",
    ],
    skillsInterestLines: [
      "- Skill: Graphic Design (Photoshop, Illustrator, InDesign Xd, Premiere Pro), Visual Arts, Coding (CSS, html, js)",
      "- Interests: Music (guitar, piano), Fashion and content Creation",
    ],
    paragraphs: [
      "Born and raised in Bangkok, Thailand, Pongsant Chintanapakdee has been deeply inspired by the worlds of art and music since childhood.",
      "Growing up in a creative family, with a mother grounded in visual arts and a father working across interior architecture and graphic design, gave him an early connection to design as both craft and daily life.",
      "After moving to Los Angeles in 2021, he continued his artistic journey in the United States, earning recognition and scholarships from major art and design schools before continuing at Parsons in New York City.",
    ],
    education: [
      {
        title: "Bachelor of Fine Arts (BFA)",
        detail: "Design and Technology, Parsons School of Design, New York City. Expected graduation: 2027.",
      },
      {
        title: "Graphic Design",
        detail: "Santa Monica College, Los Angeles, 2023.",
      },
    ],
    achievements: [
      {
        title: "School of Visual Arts",
        detail: "Silas H. Rhodes Scholarship with 50% tuition support and additional grants.",
      },
      {
        title: "Pratt Institute",
        detail: "60% tuition scholarship.",
      },
      {
        title: "Parsons School of Design",
        detail: "40% tuition scholarship and acceptance for Fall 2024.",
      },
    ],
    skills: [
      "Photoshop",
      "Illustrator",
      "InDesign",
      "XD",
      "Premiere Pro",
      "HTML",
      "CSS",
      "JavaScript",
      "Visual Arts",
    ],
    interests: [
      "Music",
      "Guitar",
      "Piano",
      "Fashion",
      "Content Creation",
    ],
  },
  contact: {
    route: "/contact",
    title: "CONTACT",
    loopText: "CONTACT * CONTACT * CONTACT *",
    portrait: firstImageFor("/contact"),
    heading: "Contacts",
    intro: "Contact details currently match the live portfolio so the rebuild stays faithful to what is already public.",
    links: [
      {
        label: "Email",
        value: "1pongsant@gmail.com",
        href: "mailto:1pongsant@gmail.com",
      },
      {
        label: "Phone",
        value: "(424)599-3914",
        href: "tel:+14245993914",
      },
      {
        label: "Location",
        value: "New York, NY",
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
    intro: "Browse the portfolio the same way the original site is organized: by discipline first, then by project.",
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
