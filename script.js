const hero = document.querySelector(".hero");
const canvas = document.querySelector("#particle-canvas");
const audioReactiveToggle = document.querySelector("#audio-reactive-toggle");
const heroAudioTrack = document.querySelector("#hero-audio-track");
const audioReactiveStatus = document.querySelector("#audio-reactive-status");
const portraitCameraToggle = document.querySelector("#portrait-camera-toggle");
const portraitCameraPreview = document.querySelector("#portrait-camera-preview");
const body = document.body;
const header = document.querySelector(".site-header");
const workScene = document.querySelector(".work-hub__scene");
const workCanvas = document.querySelector("#my-work-canvas");
const workTrigger = document.querySelector("#my-work-trigger");
const workOptions = Array.from(document.querySelectorAll(".work-hub__option"));
const homeWorkNetwork = document.querySelector("[data-home-work-network]");
const homeWorkNetworkCanvas = homeWorkNetwork?.querySelector("[data-home-work-network-canvas]");
const homeWorkNetworkLinks = Array.from(homeWorkNetwork?.querySelectorAll("[data-home-work-network-link]") ?? []);

if (body && header) {
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function syncHeaderState() {
    const currentScrollY = window.scrollY;
    const isScrolled = currentScrollY > 28;

    body.classList.toggle("is-scrolled", isScrolled);
  }

  syncHeaderState();
  window.addEventListener("scroll", syncHeaderState, { passive: true });
  reducedMotionQuery.addEventListener("change", syncHeaderState);
}

if (workScene && workCanvas && workTrigger && workOptions.length > 0) {
  const context = workCanvas.getContext("2d");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const TWO_PI = Math.PI * 2;
  const WORK_HUB_RAINBOW_HUES = [214, 198, 176, 44, 22];
  const WORK_HUB_DOODLE_HUES = [216, 224, 204, 188, 172, 46, 34, 20, 242, 256];
  const WORK_HUB_CHILD_HUES = [212, 220, 228, 198, 186, 168, 48, 36, 24, 248, 258, 206, 176];
  const WORK_HUB_AMBIENT_LAYER_ALPHA = 0.28;
  const WORK_HUB_FRAME_LAYER_ALPHA = 0.18;
  const WORK_HUB_DOODLE_LAYER_ALPHA = 0.16;
  const WORK_HUB_OPEN_SMOOTHING = 0.072;
  const WORK_HUB_CLOSE_SMOOTHING = 0.112;
  const WORK_HUB_MAX_DPR = 1.5;
  const WORK_HUB_CONNECTIONS = [
    [0, 2],
    [2, 1],
    [1, 3],
    [3, 0],
    [0, 1],
    [2, 3]
  ];
  const WORK_HUB_SCRIBBLES = [
    { indices: [0, 2, 1, 3], width: 4.4, alpha: 0.74, sway: 28 },
    { indices: [1, 2, 0, 3], width: 2.3, alpha: 0.42, sway: 20 },
    { indices: [3, 0, 2, 1], width: 1.12, alpha: 0.24, sway: 14 }
  ];

  const state = {
    width: 0,
    height: 0,
    dpr: Math.min(window.devicePixelRatio || 1, WORK_HUB_MAX_DPR),
    open: false,
    targetProgress: 0,
    openProgress: 0,
    hoverIndex: -1,
    animationId: 0,
    visible: true,
    flareAt: 0,
    anchors: [],
    groups: [],
    connections: [],
    guideLines: [],
    ambientGlows: [],
    frameDoodles: [],
    paintPatches: [],
    frameStrokes: [],
    macroOrbits: [],
    crossSquares: [],
    latticePatches: [],
    dustClusters: [],
    blobs: []
  };

  function prefersReducedMotion() {
    return reducedMotionQuery.matches;
  }

  function clampWork(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function workHubDegreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  function lerpWork(start, end, amount) {
    return start + (end - start) * amount;
  }

  function easeOutWork(value) {
    return 1 - ((1 - value) ** 3);
  }

  function easeInOutWork(value) {
    return 0.5 - (Math.cos(value * Math.PI) / 2);
  }

  function getWorkCenter() {
    return {
      x: state.width / 2,
      y: state.height / 2
    };
  }

  function randomBetweenWork(min, max) {
    return min + Math.random() * (max - min);
  }

  function workHubColor(hue, alpha, saturation = 84, lightness = 56) {
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
  }

  function mixWorkHubHues(hueA, hueB) {
    const hueAX = Math.cos(workHubDegreesToRadians(hueA));
    const hueAY = Math.sin(workHubDegreesToRadians(hueA));
    const hueBX = Math.cos(workHubDegreesToRadians(hueB));
    const hueBY = Math.sin(workHubDegreesToRadians(hueB));
    const angle = Math.atan2((hueAY + hueBY) / 2, (hueAX + hueBX) / 2);

    return (angle * 180 / Math.PI + 360) % 360;
  }

  function getOptionOffset(option) {
    const mobile = window.innerWidth < 720;
    const x = mobile && option.dataset.offsetXMobile ? option.dataset.offsetXMobile : option.dataset.offsetX || "0";
    const y = mobile && option.dataset.offsetYMobile ? option.dataset.offsetYMobile : option.dataset.offsetY || "0";
    const rawX = Number(x);
    const rawY = Number(y);
    const spreadFactorX = mobile
      ? clampWork(window.innerWidth / 390, 0.74, 0.94)
      : clampWork(window.innerWidth / 1280, 0.8, 1.02);
    const spreadFactorY = mobile
      ? clampWork(window.innerHeight / 820, 0.76, 0.96)
      : clampWork(window.innerHeight / 900, 0.84, 1.02);
    const expandedX = rawX * spreadFactorX;
    const expandedY = rawY * spreadFactorY;
    const safeMarginX = mobile ? 88 : 168;
    const safeMarginY = mobile ? 154 : 174;
    const maxX = Math.max(0, (window.innerWidth / 2) - safeMarginX);
    const maxY = Math.max(0, (window.innerHeight / 2) - safeMarginY);

    return {
      x: clampWork(expandedX, -maxX, maxX),
      y: clampWork(expandedY, -maxY, maxY)
    };
  }

  function syncOptionOffsets() {
    const isMobile = window.innerWidth < 720;
    const ringTilts = [0.78, 0.72, 0.84, 0.76, 0.68];
    const ringRotations = [-18, 12, -9, 16, 2];
    const ringRotationsSecondary = [24, -21, 18, -30, 34];

    workOptions.forEach((option, index) => {
      const { x, y } = getOptionOffset(option);
      const label = option.dataset.label || option.textContent.trim();
      const hue = WORK_HUB_RAINBOW_HUES[index % WORK_HUB_RAINBOW_HUES.length];
      const ringSize = clampWork(
        (isMobile ? 102 : 132) + label.length * (isMobile ? 1.7 : 2.2) + index * 3,
        isMobile ? 104 : 136,
        isMobile ? 154 : 210
      );
      option.style.setProperty("--option-x", `${x}px`);
      option.style.setProperty("--option-y", `${y}px`);
      option.style.setProperty("--option-ring-size", `${ringSize}px`);
      option.style.setProperty("--option-ring-tilt", ringTilts[index % ringTilts.length]);
      option.style.setProperty("--option-ring-rotation", `${ringRotations[index % ringRotations.length]}deg`);
      option.style.setProperty(
        "--option-ring-rotation-secondary",
        `${ringRotationsSecondary[index % ringRotationsSecondary.length]}deg`
      );
      option.style.setProperty("--option-hue", String(hue));
      option.style.setProperty("--option-accent", workHubColor(hue, 0.56, 88, 48));
      option.style.setProperty("--option-accent-soft", workHubColor(hue, 0.34, 84, 64));
      option.style.setProperty("--option-accent-glow", workHubColor(hue, 0.18, 90, 58));
    });
  }

  function syncWorkLayoutVars() {
    const isMobile = window.innerWidth < 720;
    const headerHeight = header?.getBoundingClientRect().height || 0;
    const inlineSafePadding = isMobile ? 16 : 40;
    const centerWidth = Math.max(220, Math.min(window.innerWidth - inlineSafePadding * 2, isMobile ? 560 : 920));
    const preferredFontSize = Math.min(
      window.innerWidth * (isMobile ? 0.165 : 0.112),
      (window.innerHeight - headerHeight * 0.6) * (isMobile ? 0.12 : 0.145)
    );
    let triggerFontSize = clampWork(
      preferredFontSize,
      isMobile ? 34 : 56,
      isMobile ? 84 : 144
    );

    workScene.style.setProperty("--work-center-width", `${centerWidth}px`);
    workScene.style.setProperty("--work-trigger-font-size", `${triggerFontSize}px`);

    const availableTriggerWidth = Math.max(180, centerWidth - (isMobile ? 8 : 20));
    const measuredTriggerWidth = workTrigger.scrollWidth;

    if (measuredTriggerWidth > availableTriggerWidth) {
      const fittedSize = triggerFontSize * (availableTriggerWidth / measuredTriggerWidth);
      triggerFontSize = clampWork(fittedSize, isMobile ? 28 : 42, triggerFontSize);
      workScene.style.setProperty("--work-trigger-font-size", `${triggerFontSize}px`);
    }
  }

  function setHoveredIndex(index) {
    state.hoverIndex = index;
    workOptions.forEach((option, optionIndex) => {
      option.classList.toggle("is-hovered", optionIndex === index);
    });
    queueWorkHubAnimation();
  }

  function createDustPoints(radius, count) {
    return Array.from({ length: count }, () => {
      const angle = Math.random() * TWO_PI;
      const distance = (Math.random() ** 0.64) * radius;

      return {
        angle,
        distance,
        size: randomBetweenWork(0.48, 2.6),
        phase: Math.random() * TWO_PI
      };
    });
  }

  function buildStructures() {
    syncOptionOffsets();
    syncWorkLayoutVars();
    state.anchors = workOptions.map((option, index) => {
      const offset = getOptionOffset(option);
      const label = option.dataset.label || option.textContent.trim();
      const isMobile = window.innerWidth < 720;
      const ringBase = clampWork(
        (isMobile ? 56 : 76) + label.length * (isMobile ? 1.2 : 1.8),
        isMobile ? 60 : 82,
        isMobile ? 92 : 132
      );

      return {
        index,
        label,
        offset,
        hue: WORK_HUB_RAINBOW_HUES[index % WORK_HUB_RAINBOW_HUES.length],
        seed: Math.random() * TWO_PI,
        drift: randomBetweenWork(0.74, 1.36),
        ringBase,
        haloBase: ringBase * randomBetweenWork(1.26, 1.7),
        orbitBase: ringBase * randomBetweenWork(1.54, 2.18),
        blobScale: randomBetweenWork(0.88, 1.34)
      };
    });

    const isMobile = window.innerWidth < 720;
    const nodeCount = isMobile ? 8 : 12;
    const spread = isMobile ? 0.18 : 0.24;
    const coreRingRadius = Math.min(state.width, state.height) * (isMobile ? 0.16 : 0.19);
    const rayBand = Math.min(state.width, state.height) * (isMobile ? 0.042 : 0.06);

    state.groups = state.anchors.map((anchor) => {
      const labelRadius = Math.hypot(anchor.offset.x, anchor.offset.y);
      const baseAngle = Math.atan2(anchor.offset.y, anchor.offset.x);
      const ringBaseRadius = coreRingRadius + randomBetweenWork(-coreRingRadius * 0.018, coreRingRadius * 0.018);
      const rayBaseRadius = coreRingRadius + rayBand + randomBetweenWork(-rayBand * 0.12, rayBand * 0.18);
      const stemRadius = coreRingRadius + rayBand * (isMobile ? 1.5 : 1.65);

      return {
        anchorIndex: anchor.index,
        baseAngle,
        hue: anchor.hue,
        labelRadius,
        segmentSpread: spread,
        coreRingRadius,
        stemRadius,
        stemPhase: randomBetweenWork(0, TWO_PI),
        stemRadiusDrift: randomBetweenWork(isMobile ? 2 : 4, isMobile ? 7 : 12),
        stemAngleDrift: randomBetweenWork(0.01, 0.03),
        stemPulseSpeed: randomBetweenWork(0.00024, 0.00056),
        stemAngleSpeed: randomBetweenWork(0.00014, 0.00028),
        nodes: Array.from({ length: nodeCount }, (_, nodeIndex) => {
          const ratio = nodeCount === 1 ? 0.5 : nodeIndex / (nodeCount - 1);
          const normalized = ratio - 0.5;

          return {
            angle: baseAngle + normalized * spread + randomBetweenWork(-0.018, 0.018),
            ringRadius: ringBaseRadius + randomBetweenWork(-ringBaseRadius * 0.05, ringBaseRadius * 0.04),
            rayRadius: rayBaseRadius + randomBetweenWork(-rayBaseRadius * 0.04, rayBaseRadius * 0.1),
            ringDrift: randomBetweenWork(isMobile ? 2 : 3, isMobile ? 6 : 11),
            rayDrift: randomBetweenWork(isMobile ? 4 : 6, isMobile ? 14 : 22),
            angleDrift: randomBetweenWork(0.006, 0.022),
            phase: randomBetweenWork(0, TWO_PI),
            swaySpeed: randomBetweenWork(0.00018, 0.00042),
            pulseSpeed: randomBetweenWork(0.00038, 0.0009),
            raySpeed: randomBetweenWork(0.00042, 0.00102)
          };
        })
      };
    });

    const builtConnections = [];

    for (let groupIndex = 0; groupIndex < state.groups.length; groupIndex += 1) {
      const currentGroup = state.groups[groupIndex];
      const nextGroup = state.groups[(groupIndex + 1) % state.groups.length];
      const innerOffset = currentGroup.segmentSpread * 0.84;
      const outerOffset = nextGroup.segmentSpread * 0.84;
      let startAngle = currentGroup.baseAngle + innerOffset;
      let endAngle = nextGroup.baseAngle - outerOffset;

      if (endAngle <= startAngle) {
        endAngle += TWO_PI;
      }

      builtConnections.push({
        groupA: groupIndex,
        groupB: (groupIndex + 1) % state.groups.length,
        startAngle,
        endAngle,
        radius: coreRingRadius + randomBetweenWork(-coreRingRadius * 0.02, coreRingRadius * 0.02),
        radiusDrift: randomBetweenWork(isMobile ? 2 : 3, isMobile ? 5 : 9),
        lineWidth: randomBetweenWork(1.4, 2.5),
        pulseSpeed: randomBetweenWork(0.00028, 0.00062),
        alphaSpeed: randomBetweenWork(0.00024, 0.00056),
        phase: randomBetweenWork(0, TWO_PI),
        hue: mixWorkHubHues(currentGroup.hue, nextGroup.hue)
      });
    }

    state.connections = builtConnections;

    state.ambientGlows = Array.from({ length: isMobile ? 7 : 11 }, (_, glowIndex) => ({
      xRatio: randomBetweenWork(0.08, 0.92),
      yRatio: randomBetweenWork(0.08, 0.92),
      radius: randomBetweenWork(
        Math.min(state.width, state.height) * (isMobile ? 0.12 : 0.1),
        Math.min(state.width, state.height) * (isMobile ? 0.26 : 0.22)
      ),
      driftX: randomBetweenWork(isMobile ? 4 : 7, isMobile ? 14 : 24),
      driftY: randomBetweenWork(isMobile ? 4 : 7, isMobile ? 12 : 20),
      speedX: randomBetweenWork(0.00008, 0.00022),
      speedY: randomBetweenWork(0.00006, 0.00018),
      phase: randomBetweenWork(0, TWO_PI),
      alpha: randomBetweenWork(0.05, 0.13),
      hue: WORK_HUB_RAINBOW_HUES[glowIndex % WORK_HUB_RAINBOW_HUES.length]
    }));

    state.frameDoodles = Array.from({ length: isMobile ? 18 : 26 }, (_, doodleIndex) => {
      const edge = ["top", "right", "bottom", "left"][doodleIndex % 4];
      const band = randomBetweenWork(isMobile ? 0.11 : 0.09, isMobile ? 0.2 : 0.17);
      let xRatio = randomBetweenWork(0.12, 0.88);
      let yRatio = randomBetweenWork(0.12, 0.88);

      if (edge === "top") {
        yRatio = band;
      } else if (edge === "right") {
        xRatio = 1 - band;
      } else if (edge === "bottom") {
        yRatio = 1 - band;
      } else {
        xRatio = band;
      }

      return {
        shape: ["loop", "rainbow", "flower", "zigzag", "spiral", "sun"][doodleIndex % 6],
        xRatio,
        yRatio,
        size: randomBetweenWork(isMobile ? 14 : 18, isMobile ? 34 : 52),
        lineWidth: randomBetweenWork(1.2, 2.4),
        hue: WORK_HUB_DOODLE_HUES[doodleIndex % WORK_HUB_DOODLE_HUES.length],
        alpha: randomBetweenWork(0.2, 0.48),
        rotation: randomBetweenWork(-Math.PI, Math.PI),
        driftX: randomBetweenWork(isMobile ? 1 : 2, isMobile ? 5 : 8),
        driftY: randomBetweenWork(isMobile ? 1 : 2, isMobile ? 5 : 8),
        speedX: randomBetweenWork(0.00016, 0.00036),
        speedY: randomBetweenWork(0.00014, 0.00032),
        phase: randomBetweenWork(0, TWO_PI),
        pulse: randomBetweenWork(0.05, 0.18)
      };
    });

    const minDimension = Math.min(state.width, state.height);
    state.paintPatches = Array.from({ length: isMobile ? 18 : 30 }, (_, patchIndex) => {
      const edge = ["top", "right", "bottom", "left"][patchIndex % 4];
      const edgeBand = randomBetweenWork(isMobile ? 0.12 : 0.1, isMobile ? 0.24 : 0.2);
      let xRatio = randomBetweenWork(0.12, 0.88);
      let yRatio = randomBetweenWork(0.12, 0.88);

      if (edge === "top") {
        yRatio = edgeBand;
      } else if (edge === "right") {
        xRatio = 1 - edgeBand;
      } else if (edge === "bottom") {
        yRatio = 1 - edgeBand;
      } else {
        xRatio = edgeBand;
      }

      return {
        xRatio,
        yRatio,
        width: randomBetweenWork(minDimension * (isMobile ? 0.08 : 0.07), minDimension * (isMobile ? 0.2 : 0.17)),
        height: randomBetweenWork(minDimension * (isMobile ? 0.06 : 0.05), minDimension * (isMobile ? 0.15 : 0.12)),
        rotation: randomBetweenWork(-1.1, 1.1),
        innerOffsetX: randomBetweenWork(-0.1, 0.1),
        innerOffsetY: randomBetweenWork(-0.08, 0.08),
        innerRotation: randomBetweenWork(-0.5, 0.5),
        hue: WORK_HUB_CHILD_HUES[patchIndex % WORK_HUB_CHILD_HUES.length],
        alpha: randomBetweenWork(0.1, 0.24),
        driftX: randomBetweenWork(isMobile ? 1 : 2, isMobile ? 6 : 12),
        driftY: randomBetweenWork(isMobile ? 1 : 2, isMobile ? 6 : 10),
        speedX: randomBetweenWork(0.00012, 0.00028),
        speedY: randomBetweenWork(0.0001, 0.00024),
        phase: randomBetweenWork(0, TWO_PI)
      };
    });

    state.frameStrokes = Array.from({ length: isMobile ? 5 : 7 }, (_, strokeIndex) => ({
      inset: randomBetweenWork(isMobile ? 16 : 18, isMobile ? 36 : 52),
      hue: WORK_HUB_CHILD_HUES[(strokeIndex * 2) % WORK_HUB_CHILD_HUES.length],
      alpha: randomBetweenWork(0.26, 0.48),
      lineWidth: randomBetweenWork(1.6, 3.4),
      amplitude: randomBetweenWork(1.4, 5.2),
      frequency: randomBetweenWork(1.2, 3.2),
      speed: randomBetweenWork(0.00028, 0.00054),
      phase: randomBetweenWork(0, TWO_PI)
    }));

    state.guideLines = Array.from({ length: 18 }, () => ({
      ax: randomBetweenWork(-0.08, 1.08),
      ay: randomBetweenWork(-0.1, 1.1),
      bx: randomBetweenWork(-0.08, 1.08),
      by: randomBetweenWork(-0.1, 1.1),
      width: randomBetweenWork(0.45, 1.4),
      alpha: randomBetweenWork(0.08, 0.18),
      drift: randomBetweenWork(10, 32),
      seed: Math.random() * TWO_PI
    }));

    state.macroOrbits = [
      {
        anchorIndices: [0, 2, 4],
        biasX: -state.width * 0.04,
        biasY: -state.height * 0.08,
        radiusX: state.width * 0.18,
        radiusY: state.height * 0.16,
        rotation: -0.42,
        width: 3.4,
        alpha: 0.68
      },
      {
        anchorIndices: [1, 2, 4],
        biasX: state.width * 0.06,
        biasY: -state.height * 0.02,
        radiusX: state.width * 0.16,
        radiusY: state.height * 0.14,
        rotation: 0.36,
        width: 2.8,
        alpha: 0.58
      },
      {
        anchorIndices: [0, 3, 4],
        biasX: -state.width * 0.02,
        biasY: state.height * 0.08,
        radiusX: state.width * 0.14,
        radiusY: state.height * 0.19,
        rotation: -0.88,
        width: 1.6,
        alpha: 0.26
      },
      {
        anchorIndices: [0, 1, 3, 4],
        biasX: 0,
        biasY: state.height * 0.02,
        radiusX: state.width * 0.21,
        radiusY: state.height * 0.22,
        rotation: 0.12,
        width: 1.1,
        alpha: 0.18
      }
    ];

    state.crossSquares = [];
    state.latticePatches = [];
    state.dustClusters = [];
    state.blobs = [];

    state.anchors.forEach((anchor, index) => {
      const dustClusterCount = index === 4 ? 3 : 2;
      const latticeCount = index % 2 === 0 ? 2 : 1;
      const squareCount = index === 4 ? 3 : 2;

      for (let clusterIndex = 0; clusterIndex < dustClusterCount; clusterIndex += 1) {
        const radius = anchor.ringBase * randomBetweenWork(0.44, 0.92);
        const count = Math.round(randomBetweenWork(18, index === 4 ? 34 : 28));

        state.dustClusters.push({
          anchorIndex: index,
          dx: randomBetweenWork(-anchor.haloBase * 0.9, anchor.haloBase * 0.9),
          dy: randomBetweenWork(-anchor.haloBase * 0.9, anchor.haloBase * 0.9),
          alpha: randomBetweenWork(0.18, 0.52),
          spin: randomBetweenWork(-0.55, 0.55),
          sway: randomBetweenWork(2, 9),
          seed: Math.random() * TWO_PI,
          points: createDustPoints(radius, count)
        });
      }

      for (let latticeIndex = 0; latticeIndex < latticeCount; latticeIndex += 1) {
        state.latticePatches.push({
          anchorIndex: index,
          dx: randomBetweenWork(-anchor.haloBase * 0.7, anchor.haloBase * 0.7),
          dy: randomBetweenWork(-anchor.haloBase * 0.7, anchor.haloBase * 0.7),
          size: anchor.ringBase * randomBetweenWork(0.92, 1.46),
          cols: Math.round(randomBetweenWork(6, 10)),
          rows: Math.round(randomBetweenWork(5, 9)),
          rotation: randomBetweenWork(-1.1, 1.1),
          alpha: randomBetweenWork(0.18, 0.34),
          seed: Math.random() * TWO_PI
        });
      }

      for (let squareIndex = 0; squareIndex < squareCount; squareIndex += 1) {
        state.crossSquares.push({
          anchorIndex: index,
          dx: randomBetweenWork(-anchor.orbitBase, anchor.orbitBase),
          dy: randomBetweenWork(-anchor.orbitBase, anchor.orbitBase),
          size: anchor.ringBase * randomBetweenWork(0.48, 0.96),
          rotation: randomBetweenWork(-0.9, 0.9),
          alpha: randomBetweenWork(0.22, 0.48),
          seed: Math.random() * TWO_PI
        });
      }

      if (index !== 3) {
        state.blobs.push({
          anchorIndex: index,
          dx: randomBetweenWork(-anchor.haloBase * 0.5, anchor.haloBase * 0.5),
          dy: randomBetweenWork(-anchor.haloBase * 0.65, anchor.haloBase * 0.65),
          size: anchor.ringBase * randomBetweenWork(0.32, 0.68) * anchor.blobScale,
          stretchX: randomBetweenWork(0.72, 1.1),
          stretchY: randomBetweenWork(0.92, 1.48),
          rotation: randomBetweenWork(-1.2, 1.2),
          alpha: randomBetweenWork(0.58, 0.92),
          roughness: randomBetweenWork(0.1, 0.22),
          seed: Math.random() * TWO_PI,
          lobes: Math.round(randomBetweenWork(3, 5))
        });
      }
    });

    state.blobs.push({
      anchorIndex: 4,
      dx: 0,
      dy: 0,
      size: clampWork(Math.min(state.width, state.height) * 0.045, 28, 56),
      stretchX: 0.72,
      stretchY: 1.36,
      rotation: -0.12,
      alpha: 0.92,
      roughness: 0.16,
      seed: Math.random() * TWO_PI,
      lobes: 3
    });
  }

  function resizeWorkCanvas() {
    const rect = workScene.getBoundingClientRect();

    state.width = Math.round(rect.width);
    state.height = Math.round(Math.max(rect.height, window.innerHeight));
    state.dpr = Math.min(window.devicePixelRatio || 1, WORK_HUB_MAX_DPR);
    workCanvas.width = Math.round(state.width * state.dpr);
    workCanvas.height = Math.round(state.height * state.dpr);
    workCanvas.style.width = `${state.width}px`;
    workCanvas.style.height = `${state.height}px`;
    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    buildStructures();
  }

  function getOpeningBurst(time) {
    if (!state.open) {
      return 0;
    }

    const elapsed = time - state.flareAt;

    if (elapsed <= 0 || elapsed >= 1600) {
      return 0;
    }

    const progress = elapsed / 1600;
    return Math.sin(progress * Math.PI) * (1 - progress * 0.22);
  }

  function getAnimatedAnchors(time) {
    const center = getWorkCenter();
    const progress = easeOutWork(state.openProgress);

    return state.anchors.map((anchor) => {
      const driftScale = prefersReducedMotion() ? 0 : progress;
      const driftX = Math.sin(time * 0.00056 * anchor.drift + anchor.seed) * anchor.ringBase * 0.09 * driftScale;
      const driftY = Math.cos(time * 0.00048 * anchor.drift + anchor.seed * 0.8) * anchor.ringBase * 0.07 * driftScale;
      const pulse = prefersReducedMotion() ? 1 : 1 + Math.sin(time * 0.0018 + anchor.seed) * 0.045 * progress;

      return {
        ...anchor,
        x: center.x + anchor.offset.x * progress + driftX,
        y: center.y + anchor.offset.y * progress + driftY,
        ringRadius: anchor.ringBase * (0.42 + progress * 0.72) * pulse,
        orbitRadius: anchor.orbitBase * (0.16 + progress * 0.84),
        haloRadius: anchor.haloBase * (0.2 + progress * 0.8),
        progress,
        highlight: state.hoverIndex === anchor.index
      };
    });
  }

  function getWorkNetworkIdleBoost() {
    return state.hoverIndex === -1 ? 1.72 : 0.92;
  }

  function getAnimatedWorkNetworkNode(group, node, time, progress) {
    const center = getWorkCenter();

    if (prefersReducedMotion()) {
      return {
        x: center.x + Math.cos(node.angle) * node.ringRadius * progress,
        y: center.y + Math.sin(node.angle) * node.ringRadius * progress,
        rayX: center.x + Math.cos(node.angle) * node.rayRadius * progress,
        rayY: center.y + Math.sin(node.angle) * node.rayRadius * progress
      };
    }

    const motionBoost = getWorkNetworkIdleBoost();
    const animatedAngle = node.angle +
      Math.sin(time * node.swaySpeed * motionBoost + node.phase) * node.angleDrift * progress * motionBoost;
    const animatedRingRadius = node.ringRadius * progress +
      Math.sin(time * node.pulseSpeed * motionBoost + node.phase) * node.ringDrift * progress * motionBoost;
    const animatedRayRadius = node.rayRadius * progress +
      Math.sin(time * node.raySpeed * motionBoost + node.phase + 0.8) * node.rayDrift * progress * motionBoost;

    return {
      x: center.x + Math.cos(animatedAngle) * animatedRingRadius,
      y: center.y + Math.sin(animatedAngle) * animatedRingRadius,
      rayX: center.x + Math.cos(animatedAngle) * animatedRayRadius,
      rayY: center.y + Math.sin(animatedAngle) * animatedRayRadius
    };
  }

  function getAnimatedWorkStem(group, time, progress) {
    const center = getWorkCenter();

    if (prefersReducedMotion()) {
      return {
        x: center.x + Math.cos(group.baseAngle) * group.stemRadius * progress,
        y: center.y + Math.sin(group.baseAngle) * group.stemRadius * progress
      };
    }

    const motionBoost = getWorkNetworkIdleBoost();
    const angle = group.baseAngle +
      Math.sin(time * group.stemAngleSpeed * motionBoost + group.stemPhase) *
        group.stemAngleDrift * progress * motionBoost;
    const radius = group.stemRadius * progress +
      Math.sin(time * group.stemPulseSpeed * motionBoost + group.stemPhase) *
        group.stemRadiusDrift * progress * motionBoost;

    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    };
  }

  function drawWorkHubNetwork(anchors, progress, time) {
    if (!state.groups.length || progress <= 0.001) {
      return;
    }

    const center = getWorkCenter();

    context.save();
    context.globalCompositeOperation = "multiply";

    const maxRadius = Math.max(...anchors.map((anchor) => Math.hypot(anchor.x - center.x, anchor.y - center.y)));
    const coreRadius = state.groups[0]?.coreRingRadius ?? maxRadius * 0.36;
    const halo = context.createRadialGradient(
      center.x,
      center.y,
      coreRadius * 0.42,
      center.x,
      center.y,
      maxRadius * 0.98
    );
    halo.addColorStop(0, workHubColor(WORK_HUB_RAINBOW_HUES[0], 0.08 * progress, 84, 74));
    halo.addColorStop(0.2, workHubColor(WORK_HUB_RAINBOW_HUES[1], 0.06 * progress, 88, 72));
    halo.addColorStop(0.42, workHubColor(WORK_HUB_RAINBOW_HUES[2], 0.05 * progress, 84, 68));
    halo.addColorStop(0.66, workHubColor(WORK_HUB_RAINBOW_HUES[3], 0.04 * progress, 84, 70));
    halo.addColorStop(0.84, workHubColor(WORK_HUB_RAINBOW_HUES[4], 0.035 * progress, 86, 70));
    halo.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = halo;
    context.beginPath();
    context.arc(center.x, center.y, maxRadius * 0.9, 0, TWO_PI);
    context.fill();

    context.lineCap = "round";
    context.lineJoin = "round";

    state.connections.forEach((connection) => {
      const highlighted =
        state.hoverIndex !== -1 &&
        (connection.groupA === state.hoverIndex || connection.groupB === state.hoverIndex);
      const isDimmed = state.hoverIndex !== -1 && !highlighted;
      const alpha = highlighted
        ? 0.56 * progress
        : isDimmed
          ? 0.07 * progress
          : (0.28 + (prefersReducedMotion() ? 0 : (Math.sin(time * connection.alphaSpeed + connection.phase) + 1) * 0.06)) * progress;
      const radius = connection.radius +
        (prefersReducedMotion() ? 0 : Math.sin(time * connection.pulseSpeed + connection.phase) * connection.radiusDrift * progress);

      if (Number.isNaN(connection.startAngle) || Number.isNaN(connection.endAngle)) {
        return;
      }

      if (highlighted) {
        context.strokeStyle = workHubColor(connection.hue, 0.18 * progress, 96, 64);
        context.lineWidth = connection.lineWidth * 2.6;
        context.beginPath();
        context.arc(center.x, center.y, radius, connection.startAngle, connection.endAngle);
        context.stroke();
      }

      context.strokeStyle = workHubColor(connection.hue, alpha, isDimmed ? 50 : 86, highlighted ? 50 : 56);
      context.lineWidth = connection.lineWidth * (highlighted ? 1.5 : isDimmed ? 0.62 : 1);
      context.beginPath();
      context.arc(center.x, center.y, radius, connection.startAngle, connection.endAngle);
      context.stroke();
    });

    state.groups.forEach((group, index) => {
      const anchor = anchors[group.anchorIndex];

      if (!anchor) {
        return;
      }

      const isFocused = state.hoverIndex === index;
      const isMuted = state.hoverIndex !== -1 && !isFocused;
      const isIdle = state.hoverIndex === -1;
      const stem = getAnimatedWorkStem(group, time, progress);

      group.nodes.forEach((node) => {
        const animatedNode = getAnimatedWorkNetworkNode(group, node, time, progress);

        if (isFocused) {
          context.strokeStyle = workHubColor(group.hue, 0.18 * progress, 96, 66);
          context.lineWidth = 3.2;
          context.beginPath();
          context.moveTo(animatedNode.x, animatedNode.y);
          context.lineTo(animatedNode.rayX, animatedNode.rayY);
          context.stroke();
        }

        context.strokeStyle = workHubColor(
          group.hue,
          (isFocused ? 0.52 : isMuted ? 0.045 : isIdle ? 0.24 : 0.15) * progress,
          isMuted ? 42 : 84,
          isFocused ? 48 : 56
        );
        context.lineWidth = isFocused ? 1.72 : isMuted ? 0.68 : isIdle ? 1.22 : 0.84;
        context.beginPath();
        context.moveTo(animatedNode.x, animatedNode.y);
        context.lineTo(animatedNode.rayX, animatedNode.rayY);
        context.stroke();
      });

      if (isFocused) {
        context.strokeStyle = workHubColor(group.hue, 0.22 * progress, 96, 64);
        context.lineWidth = 4.2;
        context.beginPath();
        context.moveTo(stem.x, stem.y);
        context.lineTo(anchor.x, anchor.y);
        context.stroke();
      }

      context.strokeStyle = workHubColor(
        group.hue,
        (isFocused ? 0.7 : isMuted ? 0.08 : isIdle ? 0.34 : 0.22) * progress,
        isMuted ? 46 : 88,
        isFocused ? 46 : 56
      );
      context.lineWidth = isFocused ? 2.6 : isIdle ? 1.6 : 1.06;
      context.beginPath();
      context.moveTo(stem.x, stem.y);
      context.lineTo(anchor.x, anchor.y);
      context.stroke();
    });

    context.restore();
  }

  function drawSketchSquare(x, y, size, rotation, alpha) {
    if (size <= 1 || alpha <= 0.001) {
      return;
    }

    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.strokeStyle = `rgba(36, 52, 107, ${alpha})`;
    context.lineWidth = Math.max(0.8, size * 0.028);
    context.beginPath();
    context.rect(-size / 2, -size / 2, size, size);
    context.stroke();
    context.beginPath();
    context.moveTo(-size / 2, -size / 2);
    context.lineTo(size / 2, size / 2);
    context.moveTo(size / 2, -size / 2);
    context.lineTo(-size / 2, size / 2);
    context.stroke();
    context.restore();
  }

  function drawGuideLines(progress, time) {
    context.save();
    context.lineCap = "round";

    state.guideLines.forEach((line) => {
      const driftX = prefersReducedMotion() ? 0 : Math.sin(time * 0.00022 + line.seed) * line.drift;
      const driftY = prefersReducedMotion() ? 0 : Math.cos(time * 0.00026 + line.seed * 1.2) * line.drift;
      const lineAlpha = line.alpha * (0.32 + progress * 0.9);

      context.beginPath();
      context.moveTo(
        line.ax * state.width + driftX * (0.25 + progress * 0.75),
        line.ay * state.height + driftY * (0.25 + progress * 0.75)
      );
      context.lineTo(
        line.bx * state.width - driftX * (0.16 + progress * 0.38),
        line.by * state.height - driftY * (0.16 + progress * 0.38)
      );
      context.lineWidth = line.width;
      context.strokeStyle = `rgba(128, 149, 196, ${lineAlpha})`;
      context.stroke();
    });

    context.restore();
  }

  function drawClosedStateCore(progress, time) {
    const closedAmount = 1 - progress;

    if (closedAmount <= 0.001) {
      return;
    }

    const center = getWorkCenter();
    const pulse = prefersReducedMotion() ? 1 : 1 + Math.sin(time * 0.0014) * 0.06;
    const radiusX = (state.width * 0.05 + 36) * closedAmount * pulse;
    const radiusY = (state.height * 0.034 + 22) * closedAmount * pulse;

    context.save();
    context.strokeStyle = `rgba(5, 5, 5, ${0.18 * closedAmount})`;
    context.lineWidth = 1.2;
    context.beginPath();
    context.ellipse(center.x, center.y, radiusX, radiusY, -0.16, 0, TWO_PI);
    context.stroke();

    context.strokeStyle = workHubColor(WORK_HUB_RAINBOW_HUES[0], 0.14 * closedAmount, 86, 62);
    context.beginPath();
    context.ellipse(center.x, center.y, radiusX * 1.42, radiusY * 1.36, 0.36, 0, TWO_PI);
    context.stroke();
    context.restore();
  }

  function drawWorkAmbientBackground(progress, time) {
    const center = getWorkCenter();
    const burst = getOpeningBurst(time);
    const fieldStrength = 0.62 + progress * 0.58;
    const baseRadius = Math.max(state.width, state.height) * (0.34 + progress * 0.08);

    context.save();
    context.globalCompositeOperation = "multiply";
    context.globalAlpha = WORK_HUB_AMBIENT_LAYER_ALPHA;

    const centerGlow = context.createRadialGradient(
      center.x,
      center.y,
      0,
      center.x,
      center.y,
      baseRadius * (1 + burst * 0.04)
    );
    centerGlow.addColorStop(0, "rgba(255, 255, 255, 0)");
    centerGlow.addColorStop(0.3, workHubColor(WORK_HUB_RAINBOW_HUES[2], 0.08 * fieldStrength, 88, 72));
    centerGlow.addColorStop(0.62, workHubColor(WORK_HUB_RAINBOW_HUES[3], 0.062 * fieldStrength, 84, 74));
    centerGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = centerGlow;
    context.fillRect(0, 0, state.width, state.height);

    context.restore();
  }

  function drawWobblyFrameLine(x1, y1, x2, y2, amplitude, frequency, phase, time, speed) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.hypot(dx, dy) || 1;
    const normalX = -dy / distance;
    const normalY = dx / distance;
    const steps = Math.max(10, Math.round(distance / 32));

    context.beginPath();

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const wave = Math.sin((t * frequency * TWO_PI) + phase + (time * speed)) * amplitude;
      const drift = Math.cos((t * frequency * 0.6 * TWO_PI) + phase * 0.8 + (time * speed * 0.58)) * amplitude * 0.34;
      const x = x1 + dx * t + normalX * (wave + drift);
      const y = y1 + dy * t + normalY * (wave + drift);

      if (step === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.stroke();
  }

  function drawWorkKindergartenFrame(progress, time) {
    if (!state.paintPatches.length && !state.frameStrokes.length) {
      return;
    }

    const reducedMotion = prefersReducedMotion();

    context.save();
    context.globalCompositeOperation = "multiply";
    context.globalAlpha = WORK_HUB_FRAME_LAYER_ALPHA;

    state.paintPatches.forEach((patch, patchIndex) => {
      const driftX = reducedMotion ? 0 : Math.sin(time * patch.speedX + patch.phase) * patch.driftX;
      const driftY = reducedMotion ? 0 : Math.cos(time * patch.speedY + patch.phase * 1.18) * patch.driftY;
      const marginX = patch.width * 0.36 + 10;
      const marginY = patch.height * 0.36 + 10;
      const x = clampWork(state.width * patch.xRatio + driftX, marginX, state.width - marginX);
      const y = clampWork(state.height * patch.yRatio + driftY, marginY, state.height - marginY);
      const alpha = patch.alpha * (0.48 + progress * 0.82);

      context.save();
      context.translate(x, y);
      context.rotate(patch.rotation + (reducedMotion ? 0 : Math.sin(time * 0.00022 + patch.phase) * 0.06));
      context.fillStyle = workHubColor(patch.hue, alpha, 70, 58);
      context.beginPath();
      context.ellipse(0, 0, patch.width * 0.58, patch.height * 0.52, 0, 0, TWO_PI);
      context.fill();

      context.fillStyle = workHubColor(
        WORK_HUB_CHILD_HUES[(patchIndex + 4) % WORK_HUB_CHILD_HUES.length],
        alpha * 0.46,
        64,
        62
      );
      context.beginPath();
      context.ellipse(
        patch.width * patch.innerOffsetX,
        patch.height * patch.innerOffsetY,
        patch.width * 0.38,
        patch.height * 0.32,
        patch.innerRotation,
        0,
        TWO_PI
      );
      context.fill();
      context.restore();
    });

    state.frameStrokes.forEach((stroke, strokeIndex) => {
      const inset = stroke.inset;
      const left = inset;
      const top = inset;
      const right = state.width - inset;
      const bottom = state.height - inset;
      const alpha = stroke.alpha * (0.52 + progress * 0.78);
      const phase = stroke.phase + strokeIndex * 0.7;

      context.strokeStyle = workHubColor(stroke.hue, alpha, 68, 34);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = stroke.lineWidth;

      drawWobblyFrameLine(left, top, right, top, stroke.amplitude, stroke.frequency, phase, time, stroke.speed);
      drawWobblyFrameLine(right, top, right, bottom, stroke.amplitude, stroke.frequency, phase + 1.2, time, stroke.speed);
      drawWobblyFrameLine(right, bottom, left, bottom, stroke.amplitude, stroke.frequency, phase + 2.4, time, stroke.speed);
      drawWobblyFrameLine(left, bottom, left, top, stroke.amplitude, stroke.frequency, phase + 3.6, time, stroke.speed);

      context.lineWidth = Math.max(1, stroke.lineWidth * 0.42);
      context.strokeStyle = workHubColor(
        WORK_HUB_CHILD_HUES[(strokeIndex + 1) % WORK_HUB_CHILD_HUES.length],
        alpha * 0.56,
        72,
        44
      );

      drawWobblyFrameLine(
        left + 2,
        top + 1,
        right - 2,
        top + 1,
        stroke.amplitude * 0.64,
        stroke.frequency * 1.22,
        phase + 0.4,
        time,
        stroke.speed * 1.08
      );
    });

    context.restore();
  }

  function drawWorkDoodleFrame(progress, time) {
    if (!state.frameDoodles.length) {
      return;
    }

    const reducedMotion = prefersReducedMotion();

    context.save();
    context.globalCompositeOperation = "multiply";
    context.globalAlpha = WORK_HUB_DOODLE_LAYER_ALPHA;
    context.lineCap = "round";
    context.lineJoin = "round";

    state.frameDoodles.forEach((doodle, doodleIndex) => {
      const driftX = reducedMotion ? 0 : Math.sin(time * doodle.speedX + doodle.phase) * doodle.driftX;
      const driftY = reducedMotion ? 0 : Math.cos(time * doodle.speedY + doodle.phase * 1.2) * doodle.driftY;
      const pulse = reducedMotion ? 1 : 1 + Math.sin(time * 0.0007 + doodle.phase) * doodle.pulse;
      const size = doodle.size * pulse;
      const edgeMargin = size * 0.62 + 10;
      const x = clampWork(doodle.xRatio * state.width + driftX, edgeMargin, state.width - edgeMargin);
      const y = clampWork(doodle.yRatio * state.height + driftY, edgeMargin, state.height - edgeMargin);
      const alpha = (0.42 + progress * 0.82) * doodle.alpha;

      context.save();
      context.translate(x, y);
      context.rotate(doodle.rotation + (reducedMotion ? 0 : Math.sin(time * 0.00022 + doodleIndex) * 0.12));

      context.strokeStyle = workHubColor(doodle.hue, alpha, 72, 40);
      context.lineWidth = doodle.lineWidth * 1.18;

      if (doodle.shape === "loop") {
        context.beginPath();
        context.ellipse(0, 0, size * 0.52, size * 0.34, 0.22, 0, TWO_PI);
        context.stroke();
        context.beginPath();
        context.ellipse(size * 0.12, -size * 0.06, size * 0.34, size * 0.2, -0.3, 0, TWO_PI);
        context.stroke();
      } else if (doodle.shape === "rainbow") {
        for (let arcIndex = 0; arcIndex < 3; arcIndex += 1) {
          const arcHue = WORK_HUB_DOODLE_HUES[(doodleIndex + arcIndex * 2) % WORK_HUB_DOODLE_HUES.length];
          context.strokeStyle = workHubColor(arcHue, alpha * (0.84 - arcIndex * 0.14), 74, 44);
          context.beginPath();
          context.arc(0, size * 0.08, size * (0.32 + arcIndex * 0.14), Math.PI * 1.06, Math.PI * 1.94);
          context.stroke();
        }
      } else if (doodle.shape === "flower") {
        for (let petalIndex = 0; petalIndex < 6; petalIndex += 1) {
          const angle = (petalIndex / 6) * TWO_PI;
          const px = Math.cos(angle) * size * 0.34;
          const py = Math.sin(angle) * size * 0.34;
          context.beginPath();
          context.ellipse(px, py, size * 0.15, size * 0.1, angle, 0, TWO_PI);
          context.stroke();
        }

        context.beginPath();
        context.arc(0, 0, size * 0.14, 0, TWO_PI);
        context.stroke();
      } else if (doodle.shape === "zigzag") {
        const segmentCount = 5;
        context.beginPath();
        context.moveTo(-size * 0.46, 0);

        for (let segmentIndex = 1; segmentIndex <= segmentCount; segmentIndex += 1) {
          const t = segmentIndex / segmentCount;
          const px = lerpWork(-size * 0.46, size * 0.46, t);
          const py = (segmentIndex % 2 === 0 ? -1 : 1) * size * 0.2;
          context.lineTo(px, py);
        }

        context.stroke();
      } else if (doodle.shape === "spiral") {
        context.beginPath();

        for (let step = 0; step <= 26; step += 1) {
          const t = step / 26;
          const angle = t * Math.PI * 4.4;
          const radius = size * 0.06 + t * size * 0.44;
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius;

          if (step === 0) {
            context.moveTo(px, py);
          } else {
            context.lineTo(px, py);
          }
        }

        context.stroke();
      } else {
        context.beginPath();
        context.arc(0, 0, size * 0.26, 0, TWO_PI);
        context.stroke();

        for (let rayIndex = 0; rayIndex < 8; rayIndex += 1) {
          const angle = (rayIndex / 8) * TWO_PI;
          const inner = size * 0.34;
          const outer = size * 0.56;
          context.beginPath();
          context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
          context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
          context.stroke();
        }
      }

      context.restore();
    });

    context.restore();
  }

  function drawMacroOrbits(anchors, progress, time) {
    const center = getWorkCenter();
    const burst = getOpeningBurst(time);

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";

    state.macroOrbits.forEach((orbit, orbitIndex) => {
      const relatedAnchors = orbit.anchorIndices.map((anchorIndex) => anchors[anchorIndex]);
      const averageX = relatedAnchors.reduce((total, anchor) => total + anchor.x, 0) / relatedAnchors.length;
      const averageY = relatedAnchors.reduce((total, anchor) => total + anchor.y, 0) / relatedAnchors.length;
      const swing = prefersReducedMotion() ? 0 : Math.sin(time * 0.00048 + orbitIndex) * 0.06 * progress;
      const ellipseX = lerpWork(center.x, averageX + orbit.biasX, progress);
      const ellipseY = lerpWork(center.y, averageY + orbit.biasY, progress);
      const radiusX = orbit.radiusX * (0.12 + progress * 0.88) * (1 + burst * 0.05);
      const radiusY = orbit.radiusY * (0.12 + progress * 0.88) * (1 + burst * 0.04);

      context.beginPath();
      context.ellipse(
        ellipseX,
        ellipseY,
        radiusX,
        radiusY,
        orbit.rotation + swing,
        0,
        TWO_PI
      );
      context.lineWidth = orbit.width * (0.4 + progress * 0.6);
      context.strokeStyle = `rgba(28, 39, 95, ${orbit.alpha * (0.2 + progress * 0.8)})`;
      context.stroke();
    });

    context.restore();
  }

  function drawConnectionRibbons(anchors, progress, time) {
    const center = getWorkCenter();

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";

    WORK_HUB_CONNECTIONS.forEach(([startIndex, endIndex], connectionIndex) => {
      const start = anchors[startIndex];
      const end = anchors[endIndex];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.hypot(dx, dy) || 1;
      const normalX = -dy / distance;
      const normalY = dx / distance;
      const bendDirection = connectionIndex % 2 === 0 ? 1 : -1;
      const bendAmount = (20 + distance * 0.12) * (0.18 + progress * 0.82);
      const liveSway = prefersReducedMotion() ? 0 : Math.sin(time * 0.00072 + connectionIndex) * 12 * progress;
      const controlX = (start.x + end.x) / 2 + normalX * bendAmount * bendDirection + liveSway;
      const controlY = (start.y + end.y) / 2 + normalY * bendAmount * bendDirection + liveSway * 0.42;
      const highlighted = state.hoverIndex === -1 || state.hoverIndex === startIndex || state.hoverIndex === endIndex;
      const alpha = highlighted ? 0.44 : 0.14;
      const width = highlighted ? 2.2 : 1.1;

      context.beginPath();
      context.moveTo(lerpWork(center.x, start.x, 0.18 + progress * 0.82), lerpWork(center.y, start.y, 0.18 + progress * 0.82));
      context.quadraticCurveTo(controlX, controlY, end.x, end.y);
      context.lineWidth = width * (0.32 + progress * 0.68);
      context.strokeStyle = `rgba(31, 43, 100, ${alpha * progress})`;
      context.stroke();
    });

    context.restore();
  }

  function drawScribblePaths(anchors, progress, time) {
    const burst = getOpeningBurst(time);

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";

    WORK_HUB_SCRIBBLES.forEach((scribble, scribbleIndex) => {
      const points = scribble.indices.map((anchorIndex, pointIndex) => {
        const anchor = anchors[anchorIndex];
        const driftX = prefersReducedMotion()
          ? 0
          : Math.sin(time * 0.00082 + anchor.seed + pointIndex) * scribble.sway * progress;
        const driftY = prefersReducedMotion()
          ? 0
          : Math.cos(time * 0.00068 + anchor.seed * 0.7 + pointIndex) * scribble.sway * 0.6 * progress;

        return {
          x: anchor.x + driftX,
          y: anchor.y + driftY
        };
      });

      const highlighted = state.hoverIndex === -1 || scribble.indices.includes(state.hoverIndex);
      const alpha = highlighted ? scribble.alpha : scribble.alpha * 0.34;

      context.beginPath();
      context.moveTo(points[0].x, points[0].y);

      for (let index = 1; index < points.length; index += 1) {
        const previousPoint = points[index - 1];
        const currentPoint = points[index];
        const midpointX = (previousPoint.x + currentPoint.x) / 2;
        const midpointY = (previousPoint.y + currentPoint.y) / 2;

        context.quadraticCurveTo(previousPoint.x, previousPoint.y, midpointX, midpointY);
      }

      const lastPoint = points[points.length - 1];
      context.lineTo(lastPoint.x, lastPoint.y);
      context.lineWidth = (scribble.width + burst * 1.4) * (0.16 + progress * 0.84);
      context.strokeStyle = `rgba(23, 34, 89, ${alpha * progress})`;
      context.stroke();

      if (scribbleIndex === 0) {
        context.lineWidth = Math.max(0.8, context.lineWidth * 0.3);
        context.strokeStyle = `rgba(104, 128, 189, ${0.2 * progress})`;
        context.stroke();
      }
    });

    context.restore();
  }

  function drawLatticePatches(anchors, progress, time) {
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";

    state.latticePatches.forEach((patch, patchIndex) => {
      const anchor = anchors[patch.anchorIndex];
      const patchX = anchor.x + patch.dx * progress;
      const patchY = anchor.y + patch.dy * progress;
      const size = patch.size * (0.18 + progress * 0.82);
      const cellWidth = size / patch.cols;
      const cellHeight = size / patch.rows;
      const rotation = patch.rotation + (prefersReducedMotion() ? 0 : Math.sin(time * 0.00044 + patch.seed) * 0.08 * progress);

      context.save();
      context.translate(patchX, patchY);
      context.rotate(rotation);
      context.strokeStyle = `rgba(58, 79, 142, ${patch.alpha * progress})`;
      context.lineWidth = 0.6;

      for (let column = 0; column <= patch.cols; column += 1) {
        const x = -size / 2 + cellWidth * column;
        context.beginPath();
        context.moveTo(x, -size / 2);
        context.lineTo(x, size / 2);
        context.stroke();
      }

      for (let row = 0; row <= patch.rows; row += 1) {
        const y = -size / 2 + cellHeight * row;
        context.beginPath();
        context.moveTo(-size / 2, y);
        context.lineTo(size / 2, y);
        context.stroke();
      }

      if (patchIndex % 2 === 0) {
        context.strokeStyle = `rgba(100, 125, 188, ${patch.alpha * progress * 0.56})`;
        context.beginPath();
        context.moveTo(-size / 2, -size / 2);
        context.lineTo(size / 2, size / 2);
        context.moveTo(size / 2, -size / 2);
        context.lineTo(-size / 2, size / 2);
        context.stroke();
      }

      context.restore();
    });

    context.restore();
  }

  function drawDustClusters(anchors, progress, time) {
    context.save();

    state.dustClusters.forEach((cluster) => {
      const anchor = anchors[cluster.anchorIndex];
      const baseX = anchor.x + cluster.dx * progress;
      const baseY = anchor.y + cluster.dy * progress;

      cluster.points.forEach((point, pointIndex) => {
        const angle = point.angle + (prefersReducedMotion() ? 0 : time * 0.00018 * cluster.spin);
        const wobble = prefersReducedMotion()
          ? 0
          : Math.sin(time * 0.0012 + cluster.seed + point.phase + pointIndex * 0.07) * cluster.sway * 0.22 * progress;
        const drawX = baseX + Math.cos(angle) * point.distance + wobble;
        const drawY = baseY + Math.sin(angle) * point.distance + wobble * 0.8;
        const size = point.size * (0.26 + progress * 0.74);

        context.beginPath();
        context.arc(drawX, drawY, size, 0, TWO_PI);
        context.fillStyle = `rgba(24, 34, 90, ${cluster.alpha * progress})`;
        context.fill();
      });
    });

    context.restore();
  }

  function drawBlobs(anchors, progress, time) {
    const burst = getOpeningBurst(time);

    context.save();

    state.blobs.forEach((blob) => {
      const anchor = anchors[blob.anchorIndex];
      const blobX = anchor.x + blob.dx * progress;
      const blobY = anchor.y + blob.dy * progress;
      const size = blob.size * (0.18 + progress * 0.82) * (1 + burst * 0.08);
      const rotation = blob.rotation + (prefersReducedMotion() ? 0 : Math.sin(time * 0.00052 + blob.seed) * 0.08 * progress);
      const steps = 14;

      context.save();
      context.translate(blobX, blobY);
      context.rotate(rotation);
      context.beginPath();

      for (let step = 0; step <= steps; step += 1) {
        const angle = (step / steps) * TWO_PI;
        const modulation = 1
          + Math.sin(angle * blob.lobes + blob.seed) * blob.roughness
          + Math.cos(angle * 2 + blob.seed * 0.7) * 0.08;
        const pointX = Math.cos(angle) * size * blob.stretchX * modulation;
        const pointY = Math.sin(angle) * size * blob.stretchY * modulation;

        if (step === 0) {
          context.moveTo(pointX, pointY);
        } else {
          context.lineTo(pointX, pointY);
        }
      }

      context.closePath();
      context.fillStyle = `rgba(19, 26, 70, ${blob.alpha * progress})`;
      context.fill();
      context.restore();
    });

    context.restore();
  }

  function drawCrossSquares(anchors, progress, time) {
    state.crossSquares.forEach((square) => {
      const anchor = anchors[square.anchorIndex];
      const squareX = anchor.x + square.dx * progress;
      const squareY = anchor.y + square.dy * progress;
      const size = square.size * (0.18 + progress * 0.82);
      const rotation = square.rotation + (prefersReducedMotion() ? 0 : Math.sin(time * 0.00038 + square.seed) * 0.08 * progress);
      drawSketchSquare(squareX, squareY, size, rotation, square.alpha * progress);
    });
  }

  function drawAnchorRings(anchors, progress, time) {
    const burst = getOpeningBurst(time);

    context.save();

    anchors.forEach((anchor, index) => {
      const focusLevel = state.hoverIndex === -1 ? 1 : anchor.highlight ? 1.3 : 0.34;
      const ringAlpha = (0.2 + progress * 0.48) * focusLevel;
      const outerAlpha = (0.12 + progress * 0.24) * focusLevel;
      const rotation = (index % 2 === 0 ? -0.32 : 0.28) + (prefersReducedMotion() ? 0 : Math.sin(time * 0.00064 + anchor.seed) * 0.06);
      const baseRadiusX = anchor.ringRadius * (1 + burst * 0.05);
      const baseRadiusY = anchor.ringRadius * (0.74 + (index % 3) * 0.05) * (1 + burst * 0.05);

      context.beginPath();
      context.ellipse(anchor.x, anchor.y, baseRadiusX, baseRadiusY, rotation, 0, TWO_PI);
      context.lineWidth = (anchor.highlight ? 1.8 : 1.35);
      context.strokeStyle = workHubColor(anchor.hue, ringAlpha, 88, 50);
      context.stroke();

      context.beginPath();
      context.ellipse(anchor.x + 3, anchor.y - 2, anchor.haloRadius * 0.74, anchor.haloRadius * 0.58, rotation + 0.42, 0, TWO_PI);
      context.lineWidth = 0.95;
      context.strokeStyle = workHubColor(anchor.hue, outerAlpha, 82, 68);
      context.stroke();

      context.beginPath();
      context.arc(anchor.x, anchor.y, 2.2 + progress * 1.4, 0, TWO_PI);
      context.fillStyle = workHubColor(anchor.hue, 0.46 * focusLevel * progress, 88, 46);
      context.fill();
    });

    context.restore();
  }

  function setWorkMenuState(open) {
    state.open = open;
    state.targetProgress = open ? 1 : 0;
    if (prefersReducedMotion()) {
      state.openProgress = state.targetProgress;
    }
    body.classList.toggle("is-work-menu-open", open);
    workTrigger.setAttribute("aria-expanded", String(open));

    if (open) {
      state.flareAt = performance.now();
    } else {
      setHoveredIndex(-1);
    }

    queueWorkHubAnimation();
  }

  function isWorkHubTransitioning() {
    return Math.abs(state.targetProgress - state.openProgress) >= 0.0015;
  }

  function shouldAnimateWorkHub(time = performance.now()) {
    if (!state.visible || prefersReducedMotion()) {
      return false;
    }

    const openingBurstActive = state.open && (time - state.flareAt) < 1600;
    return isWorkHubTransitioning() || openingBurstActive || state.hoverIndex !== -1;
  }

  function queueWorkHubAnimation() {
    if (!state.visible || state.animationId) {
      return;
    }

    state.animationId = window.requestAnimationFrame(renderWorkHub);
  }

  function renderWorkHub(time) {
    state.animationId = 0;
    context.clearRect(0, 0, state.width, state.height);
    if (prefersReducedMotion()) {
      state.openProgress = state.targetProgress;
    } else {
      const smoothing = state.targetProgress > state.openProgress
        ? WORK_HUB_OPEN_SMOOTHING
        : WORK_HUB_CLOSE_SMOOTHING;
      state.openProgress += (state.targetProgress - state.openProgress) * smoothing;
    }

    if (Math.abs(state.targetProgress - state.openProgress) < 0.0015) {
      state.openProgress = state.targetProgress;
    }

    const progress = easeInOutWork(state.openProgress);
    const anchors = getAnimatedAnchors(time);

    if (progress > 0.01) {
      drawWorkAmbientBackground(progress, time);
    }

    drawClosedStateCore(progress, time);
    drawWorkHubNetwork(anchors, progress, time);
    drawAnchorRings(anchors, progress, time);

    if (shouldAnimateWorkHub(time)) {
      state.animationId = window.requestAnimationFrame(renderWorkHub);
    }
  }

  function handleWorkTriggerClick(event) {
    event.stopPropagation();
    setWorkMenuState(!state.open);
  }

  function handleWorkSceneClick(event) {
    if (event.target.closest(".work-hub__option") || event.target.closest(".work-hub__trigger")) {
      return;
    }

    setWorkMenuState(!state.open);
  }

  function handleKeydown(event) {
    if (event.key === "Escape" && state.open) {
      setWorkMenuState(false);
    }
  }

  function initWorkHub() {
    resizeWorkCanvas();
    queueWorkHubAnimation();

    workTrigger.addEventListener("click", handleWorkTriggerClick);
    workScene.addEventListener("click", handleWorkSceneClick);
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("resize", () => {
      resizeWorkCanvas();
      queueWorkHubAnimation();
    });
    reducedMotionQuery.addEventListener("change", () => {
      resizeWorkCanvas();
      queueWorkHubAnimation();
    });
    document.addEventListener("visibilitychange", () => {
      state.visible = !document.hidden;

      if (state.visible) {
        queueWorkHubAnimation();
      } else if (state.animationId) {
        window.cancelAnimationFrame(state.animationId);
        state.animationId = 0;
      }
    });

    workOptions.forEach((option, index) => {
      option.addEventListener("pointerenter", () => setHoveredIndex(index));
      option.addEventListener("pointerleave", () => setHoveredIndex(-1));
      option.addEventListener("focus", () => setHoveredIndex(index));
      option.addEventListener("blur", () => setHoveredIndex(-1));
    });
  }

  initWorkHub();
}

if (hero && canvas) {
  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  const hasMediaDeviceSupport = Boolean(navigator.mediaDevices?.getUserMedia);
  const isMediaSecureContext = (
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
  const canUseHeroAudio = Boolean(AudioContextConstructor && heroAudioTrack);
  const canUseCamera = hasMediaDeviceSupport && isMediaSecureContext;
  const FaceDetectorConstructor = window.FaceDetector;
  const MEDIAPIPE_VISION_BUNDLE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs";
  const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
  const MEDIAPIPE_FACE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

  const state = {
    width: 0,
    height: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    points: [],
    stars: [],
    starNebula: [],
    pointCount: window.innerWidth < 720 ? 1450 : 2600,
    currentShape: 0,
    shapes: [
      "sphere",
      "cube",
      "torus",
      "wave",
      "helix",
      "cone",
      "crystal",
      "ribbon",
      "bloom",
      "hourglass",
      "portrait",
      "fish",
      "bird",
      "cat",
      "butterfly",
      "guitar"
    ],
    animationId: 0,
    pointerBoost: 0,
    dispersion: 0,
    flash: 0,
    lastAutoMorphAt: 0,
    autoMorphInterval: 4200,
    customPortraitTemplate: null,
    camera: {
      active: false,
      starting: false,
      stream: null,
      audioLinked: false,
      trackedProfile: null,
      abstractShapeKind: null,
      detector: FaceDetectorConstructor ? new FaceDetectorConstructor({ fastMode: true, maxDetectedFaces: 1 }) : null,
      lastCaptureAt: 0,
      detecting: false,
      mode: "idle",
      mediapipeLoading: false,
      mediapipeReady: false,
      mediapipeFailed: false,
      faceLandmarker: null
    },
    audio: {
      enabled: false,
      isStarting: false,
      context: null,
      analyser: null,
      source: null,
      stream: null,
      frequencyData: null,
      previousFrequencyData: null,
      timeDomainData: null,
      level: 0,
      waveform: 0,
      bass: 0,
      lowMid: 0,
      mid: 0,
      treble: 0,
      presence: 0,
      air: 0,
      flux: 0,
      transient: 0,
      centroid: 0,
      note: 0,
      noteDrift: 0,
      brightness: 0,
      kick: 0,
      snare: 0,
      hat: 0,
      melody: 0,
      beatPulse: 0,
      beatInterval: 620,
      tempo: 96,
      lastBeatAt: 0,
      guitar: 0,
      percussion: 0,
      surge: 0,
      visualBlend: 0,
      beatCooldown: 0,
      lastMorphAt: 0
    }
  };

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function shuffle(array) {
    for (let index = array.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
    }

    return array;
  }

  function scheduleNextMorph(time = performance.now()) {
    state.lastAutoMorphAt = time;
    state.autoMorphInterval = randomBetween(3200, 5600);
  }

  const REAL_WORLD_MORPH_SHAPES = new Set(["fish", "bird", "cat", "butterfly", "guitar"]);

  function getRandomMorphIndex(excludeIndex = null, options = {}) {
    const { preferRealWorld = false, allowPortrait = false } = options;
    let availableIndexes = state.shapes
      .map((shape, index) => index)
      .filter((index) => index !== excludeIndex)
      .filter((index) => allowPortrait || state.shapes[index] !== "portrait");

    if (preferRealWorld) {
      const realWorldIndexes = availableIndexes.filter((index) => REAL_WORLD_MORPH_SHAPES.has(state.shapes[index]));
      if (realWorldIndexes.length) {
        availableIndexes = realWorldIndexes;
      }
    }

    if (!availableIndexes.length) {
      return 0;
    }

    return availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
  }

  function getPortraitShapeIndex() {
    return state.shapes.indexOf("portrait");
  }

  function getHeroPointCount() {
    if (window.innerWidth < 720) {
      return state.audio.enabled ? 1250 : 980;
    }

    return state.audio.enabled ? 2400 : 1800;
  }

  function sampleSphereSurface(radiusX, radiusY, radiusZ, centerX = 0, centerY = 0, centerZ = 0) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(randomBetween(-1, 1));
    const sinPhi = Math.sin(phi);

    return {
      x: centerX + radiusX * sinPhi * Math.cos(theta),
      y: centerY + radiusY * Math.cos(phi),
      z: centerZ + radiusZ * sinPhi * Math.sin(theta)
    };
  }

  function sampleCylinder(radius, height, centerY = 0) {
    const theta = Math.random() * Math.PI * 2;
    const y = centerY + randomBetween(-height / 2, height / 2);

    return {
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius
    };
  }

  function getPixelLuminance(data, width, x, y) {
    const safeX = Math.max(0, Math.min(width - 1, x));
    const safeY = Math.max(0, Math.min((data.length / 4 / width) - 1, y));
    const offset = (safeY * width + safeX) * 4;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];

    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
  }

  function classifyImagePortraitRegion(normalizedX, normalizedY, darkness) {
    if (normalizedY < 0.2 && darkness > 0.2) {
      return "halo";
    }

    if (normalizedY > 0.68) {
      return "torso";
    }

    if (normalizedY > 0.56 && normalizedY < 0.7 && Math.abs(normalizedX - 0.5) < 0.14) {
      if (normalizedY < 0.61) {
        return "mouth-upper";
      }

      if (normalizedY < 0.665) {
        return "mouth-core";
      }

      return "mouth-lower";
    }

    if (normalizedY > 0.58) {
      return "neck";
    }

    return "head";
  }

  function classifyTrackedRegion(normalizedX, normalizedY, score) {
    if (normalizedY < 0.22) {
      return "halo";
    }

    if (normalizedY > 0.74) {
      return "lower";
    }

    if (Math.abs(normalizedX - 0.5) < 0.18 && Math.abs(normalizedY - 0.5) < 0.2) {
      return score > 0.46 ? "focus" : "core";
    }

    return "body";
  }

  function buildPortraitTemplateFromSource(source, crop = null) {
    const offscreen = document.createElement("canvas");
    const offscreenContext = offscreen.getContext("2d", { willReadFrequently: true });
    const width = 220;
    const height = 280;
    const sourceWidth = crop?.sw || source.videoWidth || source.naturalWidth || source.width;
    const sourceHeight = crop?.sh || source.videoHeight || source.naturalHeight || source.height;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;
    const sampleStep = window.innerWidth < 720 ? 3 : 2;
    const points = [];

    offscreen.width = width;
    offscreen.height = height;
    offscreenContext.fillStyle = "#ffffff";
    offscreenContext.fillRect(0, 0, width, height);

    if (crop) {
      offscreenContext.drawImage(
        source,
        crop.sx,
        crop.sy,
        crop.sw,
        crop.sh,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
      );
    } else {
      offscreenContext.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
    }

    const { data } = offscreenContext.getImageData(0, 0, width, height);

    for (let y = 0; y < height; y += sampleStep) {
      for (let x = 0; x < width; x += sampleStep) {
        const luminance = getPixelLuminance(data, width, x, y);
        const neighborX = getPixelLuminance(data, width, x + sampleStep, y);
        const neighborY = getPixelLuminance(data, width, x, y + sampleStep);
        const contrast = (Math.abs(luminance - neighborX) + Math.abs(luminance - neighborY)) / 510;
        const darkness = 1 - (luminance / 255);
        const normalizedX = x / (width - 1);
        const normalizedY = y / (height - 1);
        const ellipse =
          ((normalizedX - 0.5) * (normalizedX - 0.5)) / 0.23 +
          ((normalizedY - 0.49) * (normalizedY - 0.49)) / 0.34;
        const faceWeight = Math.max(0, 1.22 - ellipse);
        const keepStrength = darkness * 1.32 + contrast * 1.18 + faceWeight * 0.26;

        if (faceWeight <= 0 || keepStrength < 0.22 || Math.random() > Math.min(0.96, keepStrength)) {
          continue;
        }

        points.push({
          x: (normalizedX - 0.5) * 1.34,
          y: (normalizedY - 0.53) * 1.72,
          z: (darkness - 0.34) * 0.52 + contrast * 0.28 + randomBetween(-0.03, 0.03),
          region: classifyImagePortraitRegion(normalizedX, normalizedY, darkness)
        });
      }
    }

    return points;
  }

  function detectSubjectCropFromSource(source) {
    const sampleCanvas = document.createElement("canvas");
    const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
    const sourceWidth = source.videoWidth || source.naturalWidth || source.width;
    const sourceHeight = source.videoHeight || source.naturalHeight || source.height;
    const sampleWidth = 96;
    const sampleHeight = Math.round(sampleWidth * (sourceHeight / sourceWidth));
    let minX = sampleWidth;
    let minY = sampleHeight;
    let maxX = 0;
    let maxY = 0;
    let hits = 0;
    let totalScore = 0;

    sampleCanvas.width = sampleWidth;
    sampleCanvas.height = sampleHeight;
    sampleContext.drawImage(source, 0, 0, sampleWidth, sampleHeight);

    const { data } = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight);

    for (let y = 1; y < sampleHeight - 1; y += 1) {
      for (let x = 1; x < sampleWidth - 1; x += 1) {
        const luminance = getPixelLuminance(data, sampleWidth, x, y);
        const neighborX = getPixelLuminance(data, sampleWidth, x + 1, y);
        const neighborY = getPixelLuminance(data, sampleWidth, x, y + 1);
        const darkness = 1 - (luminance / 255);
        const contrast = (Math.abs(luminance - neighborX) + Math.abs(luminance - neighborY)) / 255;
        const centerBias = 1 - Math.min(1, Math.hypot((x / sampleWidth) - 0.5, (y / sampleHeight) - 0.5) * 1.5);
        const score = darkness * 0.82 + contrast * 0.96 + centerBias * 0.24;

        if (score < 0.34) {
          continue;
        }

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        hits += 1;
        totalScore += score;
      }
    }

    if (hits < 80) {
      return getFallbackFaceCrop(sourceWidth, sourceHeight);
    }

    const averageScore = totalScore / hits;
    const paddingX = Math.max(6, (maxX - minX) * (0.22 + averageScore * 0.16));
    const paddingY = Math.max(8, (maxY - minY) * (0.26 + averageScore * 0.18));

    return clampCropToVideo(
      {
        sx: ((minX - paddingX) / sampleWidth) * sourceWidth,
        sy: ((minY - paddingY) / sampleHeight) * sourceHeight,
        sw: ((maxX - minX + paddingX * 2) / sampleWidth) * sourceWidth,
        sh: ((maxY - minY + paddingY * 2) / sampleHeight) * sourceHeight
      },
      sourceWidth,
      sourceHeight
    );
  }

  function getLandmarkBounds(landmarks) {
    let minX = 1;
    let minY = 1;
    let maxX = 0;
    let maxY = 0;

    for (const landmark of landmarks) {
      minX = Math.min(minX, landmark.x);
      minY = Math.min(minY, landmark.y);
      maxX = Math.max(maxX, landmark.x);
      maxY = Math.max(maxY, landmark.y);
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(0.001, maxX - minX),
      height: Math.max(0.001, maxY - minY),
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }

  function getCropFromLandmarks(landmarks, width, height) {
    const bounds = getLandmarkBounds(landmarks);
    const paddingX = bounds.width * 0.38;
    const paddingTop = bounds.height * 0.34;
    const paddingBottom = bounds.height * 0.46;

    return clampCropToVideo(
      {
        sx: (bounds.minX - paddingX) * width,
        sy: (bounds.minY - paddingTop) * height,
        sw: (bounds.width + paddingX * 2) * width,
        sh: (bounds.height + paddingTop + paddingBottom) * height
      },
      width,
      height
    );
  }

  function analyzeTrackedShapeFromSource(source, crop = null) {
    const sampleCanvas = document.createElement("canvas");
    const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
    const width = 120;
    const height = 160;
    const sourceWidth = crop?.sw || source.videoWidth || source.naturalWidth || source.width;
    const sourceHeight = crop?.sh || source.videoHeight || source.naturalHeight || source.height;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let hits = 0;
    let sumX = 0;
    let sumY = 0;
    let totalContrast = 0;
    let totalDarkness = 0;

    sampleCanvas.width = width;
    sampleCanvas.height = height;
    sampleContext.fillStyle = "#ffffff";
    sampleContext.fillRect(0, 0, width, height);

    if (crop) {
      sampleContext.drawImage(
        source,
        crop.sx,
        crop.sy,
        crop.sw,
        crop.sh,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
      );
    } else {
      sampleContext.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
    }

    const { data } = sampleContext.getImageData(0, 0, width, height);

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const luminance = getPixelLuminance(data, width, x, y);
        const neighborX = getPixelLuminance(data, width, x + 1, y);
        const neighborY = getPixelLuminance(data, width, x, y + 1);
        const darkness = 1 - (luminance / 255);
        const contrast = (Math.abs(luminance - neighborX) + Math.abs(luminance - neighborY)) / 255;
        const centerBias = 1 - Math.min(1, Math.hypot((x / width) - 0.5, (y / height) - 0.5) * 1.45);
        const score = darkness * 0.82 + contrast * 1.04 + centerBias * 0.24;

        if (score < 0.34) {
          continue;
        }

        hits += 1;
        sumX += x;
        sumY += y;
        totalContrast += contrast;
        totalDarkness += darkness;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (hits < 48) {
      return {
        centerX: 0.5,
        centerY: 0.5,
        width: 0.52,
        height: 0.72,
        aspect: 0.72,
        fill: 0.46,
        contrast: 0.16,
        darkness: 0.32
      };
    }

    const boxWidth = Math.max(6, maxX - minX + 1);
    const boxHeight = Math.max(6, maxY - minY + 1);
    const boxArea = boxWidth * boxHeight;

    return {
      centerX: (sumX / hits) / width,
      centerY: (sumY / hits) / height,
      width: boxWidth / width,
      height: boxHeight / height,
      aspect: boxWidth / boxHeight,
      fill: hits / boxArea,
      contrast: totalContrast / hits,
      darkness: totalDarkness / hits
    };
  }

  function smoothTrackedProfile(profile) {
    if (!state.camera.trackedProfile) {
      state.camera.trackedProfile = { ...profile };
      return state.camera.trackedProfile;
    }

    const previous = state.camera.trackedProfile;
    const easing = 0.22;
    state.camera.trackedProfile = {
      centerX: previous.centerX + (profile.centerX - previous.centerX) * easing,
      centerY: previous.centerY + (profile.centerY - previous.centerY) * easing,
      width: previous.width + (profile.width - previous.width) * easing,
      height: previous.height + (profile.height - previous.height) * easing,
      aspect: previous.aspect + (profile.aspect - previous.aspect) * easing,
      fill: previous.fill + (profile.fill - previous.fill) * easing,
      contrast: previous.contrast + (profile.contrast - previous.contrast) * easing,
      darkness: previous.darkness + (profile.darkness - previous.darkness) * easing
    };

    return state.camera.trackedProfile;
  }

  function getAbstractTrackedShapeKind(profile, preferredKind = "object") {
    if (preferredKind === "face") {
      if (profile.aspect < 0.78) {
        return profile.fill > 0.5 ? "capsule-vertical" : "orb";
      }

      if (profile.fill < 0.4 && profile.contrast > 0.16) {
        return "diamond";
      }

      return profile.darkness > 0.38 ? "blob" : "orb";
    }

    if (profile.aspect > 1.34) {
      return "capsule-horizontal";
    }

    if (profile.aspect < 0.72) {
      return "capsule-vertical";
    }

    if (profile.contrast > 0.18 && profile.fill > 0.54) {
      return "square";
    }

    if (profile.contrast > 0.16 && profile.fill < 0.42) {
      return "diamond";
    }

    if (profile.darkness > 0.42) {
      return "blob";
    }

    return "orb";
  }

  function getStableAbstractTrackedShapeKind(profile, preferredKind = "object") {
    const nextKind = getAbstractTrackedShapeKind(profile, preferredKind);

    if (!state.camera.abstractShapeKind) {
      state.camera.abstractShapeKind = nextKind;
      return nextKind;
    }

    if (state.camera.abstractShapeKind === nextKind) {
      return nextKind;
    }

    const current = state.camera.abstractShapeKind;
    const strongHorizontal = profile.aspect > 1.42;
    const strongVertical = profile.aspect < 0.68;
    const strongContrast = profile.contrast > 0.2;
    const strongFill = profile.fill > 0.58 || profile.fill < 0.38;

    if (
      (nextKind === "capsule-horizontal" && strongHorizontal) ||
      (nextKind === "capsule-vertical" && strongVertical) ||
      ((nextKind === "square" || nextKind === "diamond") && strongContrast) ||
      (nextKind === "blob" && (profile.darkness > 0.44 || strongFill))
    ) {
      state.camera.abstractShapeKind = nextKind;
    }

    return state.camera.abstractShapeKind || current;
  }

  function buildAbstractTrackedTemplateFromSource(source, crop = null, preferredKind = "object") {
    const rawProfile = analyzeTrackedShapeFromSource(source, crop);
    const profile = smoothTrackedProfile(rawProfile);
    const shapeKind = getStableAbstractTrackedShapeKind(profile, preferredKind);
    const pointBudget = window.innerWidth < 720 ? 720 : 1080;
    const points = [];
    const centerOffsetX = (profile.centerX - 0.5) * 0.42;
    const centerOffsetY = (profile.centerY - 0.5) * 0.54;
    const shapeScaleX = Math.max(0.56, Math.min(1.18, profile.width * 1.28));
    const shapeScaleY = Math.max(0.62, Math.min(1.26, profile.height * 1.16));

    for (let index = 0; index < pointBudget; index += 1) {
      const radialSeed = Math.sqrt((index + 0.5) / pointBudget);
      const theta = index * 2.399963229728653;
      let shapeX = Math.cos(theta) * radialSeed;
      let shapeY = Math.sin(theta) * radialSeed;

      if (shapeKind === "square") {
        const maxAbs = Math.max(Math.abs(shapeX), Math.abs(shapeY)) || 1;
        const squareFactor = radialSeed / maxAbs;
        shapeX *= squareFactor;
        shapeY *= squareFactor;
      } else if (shapeKind === "diamond") {
        const manhattan = Math.abs(shapeX) + Math.abs(shapeY) || 1;
        const diamondFactor = radialSeed / manhattan;
        shapeX *= diamondFactor * 1.14;
        shapeY *= diamondFactor * 1.14;
      } else if (shapeKind === "capsule-vertical") {
        shapeX *= 0.68;
        shapeY *= 1.12;
      } else if (shapeKind === "capsule-horizontal") {
        shapeX *= 1.12;
        shapeY *= 0.68;
      } else if (shapeKind === "blob") {
        const blobRadius =
          1 +
          Math.sin(theta * 3 + profile.contrast * 8) * 0.14 +
          Math.cos(theta * 5 - profile.darkness * 7) * 0.08;
        shapeX *= blobRadius;
        shapeY *= blobRadius;
      } else {
        shapeX *= 0.88;
        shapeY *= 1.02;
      }

      const normalizedX = 0.5 + centerOffsetX + shapeX * 0.42 * shapeScaleX;
      const normalizedY = 0.52 + centerOffsetY + shapeY * 0.56 * shapeScaleY;
      const edgeSoftness = 1 - Math.min(1, radialSeed);

      points.push({
        x: (normalizedX - 0.5) * 2.18,
        y: (normalizedY - 0.52) * 2.76,
        z: edgeSoftness * (0.22 + profile.darkness * 0.18) + Math.sin(theta * 2.2) * 0.03,
        region: classifyTrackedRegion(normalizedX, normalizedY, edgeSoftness)
      });
    }

    const haloCount = Math.min(180, Math.max(80, Math.round(pointBudget * 0.1)));

    for (let index = 0; index < haloCount; index += 1) {
      const theta = Math.random() * Math.PI * 2;
      const haloRadius = 1.08 + Math.random() * 0.34;
      points.push({
        x: Math.cos(theta) * 0.78 * shapeScaleX * haloRadius,
        y: Math.sin(theta) * 0.92 * shapeScaleY * haloRadius,
        z: randomBetween(-0.08, 0.12),
        region: "halo"
      });
    }

    return shuffle(points);
  }

  function buildTrackedTemplateFromLandmarks(landmarks, contourTemplate = []) {
    const bounds = getLandmarkBounds(landmarks);
    const scale = Math.max(bounds.width, bounds.height);
    const points = [];

    for (let index = 0; index < landmarks.length; index += 1) {
      const landmark = landmarks[index];
      const localX = (landmark.x - bounds.centerX) / scale;
      const localY = (landmark.y - bounds.centerY) / scale;
      const normalizedX = (landmark.x - bounds.minX) / bounds.width;
      const normalizedY = (landmark.y - bounds.minY) / bounds.height;
      const region = classifyTrackedRegion(normalizedX, normalizedY, 0.5);
      const density = region === "focus" ? 3 : region === "core" ? 2 : 1;

      for (let copyIndex = 0; copyIndex < density; copyIndex += 1) {
        points.push({
          x: localX * 2.26 + randomBetween(-0.01, 0.01),
          y: localY * 2.78 + randomBetween(-0.01, 0.01),
          z: (landmark.z || 0) * 1.55 + randomBetween(-0.02, 0.02),
          region
        });
      }
    }

    if (contourTemplate.length) {
      const contourPoints = shuffle([...contourTemplate]).slice(0, Math.min(contourTemplate.length, 1100));

      for (const point of contourPoints) {
        points.push({
          x: point.x,
          y: point.y,
          z: point.z,
          region: point.region || "body"
        });
      }
    }

    return shuffle(points);
  }

  function buildTrackedTemplateFromSource(source, crop = null) {
    const offscreen = document.createElement("canvas");
    const offscreenContext = offscreen.getContext("2d", { willReadFrequently: true });
    const width = 220;
    const height = 280;
    const sourceWidth = crop?.sw || source.videoWidth || source.naturalWidth || source.width;
    const sourceHeight = crop?.sh || source.videoHeight || source.naturalHeight || source.height;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;
    const sampleStep = window.innerWidth < 720 ? 3 : 2;
    const points = [];

    offscreen.width = width;
    offscreen.height = height;
    offscreenContext.fillStyle = "#ffffff";
    offscreenContext.fillRect(0, 0, width, height);

    if (crop) {
      offscreenContext.drawImage(
        source,
        crop.sx,
        crop.sy,
        crop.sw,
        crop.sh,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
      );
    } else {
      offscreenContext.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
    }

    const { data } = offscreenContext.getImageData(0, 0, width, height);

    for (let y = 1; y < height - 1; y += sampleStep) {
      for (let x = 1; x < width - 1; x += sampleStep) {
        const luminance = getPixelLuminance(data, width, x, y);
        const neighborX = getPixelLuminance(data, width, x + sampleStep, y);
        const neighborY = getPixelLuminance(data, width, x, y + sampleStep);
        const contrast = (Math.abs(luminance - neighborX) + Math.abs(luminance - neighborY)) / 510;
        const darkness = 1 - (luminance / 255);
        const normalizedX = x / (width - 1);
        const normalizedY = y / (height - 1);
        const centerBias = 1 - Math.min(1, Math.hypot(normalizedX - 0.5, normalizedY - 0.5) * 1.35);
        const score = darkness * 0.96 + contrast * 1.18 + centerBias * 0.2;

        if (score < 0.24 || Math.random() > Math.min(0.98, score + 0.12)) {
          continue;
        }

        points.push({
          x: (normalizedX - 0.5) * 2.08,
          y: (normalizedY - 0.52) * 2.72,
          z: (darkness - 0.28) * 0.54 + contrast * 0.44 + randomBetween(-0.04, 0.04),
          region: classifyTrackedRegion(normalizedX, normalizedY, score)
        });
      }
    }

    return points;
  }

  function updatePortraitUi(isActive) {
    if (portraitCameraToggle) {
      portraitCameraToggle.textContent = isActive ? "Camera On" : "Live Face";
      portraitCameraToggle.classList.toggle("is-active", Boolean(isActive));
      portraitCameraToggle.disabled = !canUseCamera || state.camera.starting;
    }
    if (portraitCameraPreview) {
      portraitCameraPreview.classList.toggle("is-active", Boolean(isActive));
    }
  }

  function getCameraStatusMessage() {
    const trackingMessage = state.camera.mode === "face"
      ? "Tracking your face as an abstract live shape."
      : state.camera.mode === "object"
        ? "Tracking the main object or silhouette as an abstract live shape."
        : "Initializing face tracking...";

    if (state.audio.enabled) {
      return `Camera live. ${trackingMessage} Music track is shaping the tracked particles in real time.`;
    }

    return `Camera live. ${trackingMessage} Click to start the music track for sound-reactive motion.`;
  }

  function setCameraMode(mode) {
    if (state.camera.mode === mode) {
      return;
    }

    state.camera.mode = mode;

    if (state.camera.active) {
      updateAudioUi(getCameraStatusMessage());
    }
  }

  async function ensureFaceLandmarker() {
    if (state.camera.faceLandmarker || state.camera.mediapipeLoading || state.camera.mediapipeFailed) {
      return state.camera.faceLandmarker;
    }

    state.camera.mediapipeLoading = true;

    try {
      const vision = await import(MEDIAPIPE_VISION_BUNDLE_URL);
      const filesetResolver = await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);

      state.camera.faceLandmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: MEDIAPIPE_FACE_MODEL_URL
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false
      });
      state.camera.mediapipeReady = true;
    } catch (error) {
      state.camera.mediapipeFailed = true;
    } finally {
      state.camera.mediapipeLoading = false;
    }

    return state.camera.faceLandmarker;
  }

  function getFallbackFaceCrop(width, height) {
    const cropWidth = width * 0.56;
    const cropHeight = height * 0.74;

    return {
      sx: (width - cropWidth) / 2,
      sy: Math.max(0, height * 0.1),
      sw: cropWidth,
      sh: Math.min(height * 0.8, cropHeight)
    };
  }

  function clampCropToVideo(crop, width, height) {
    const sw = Math.min(width, Math.max(32, crop.sw));
    const sh = Math.min(height, Math.max(32, crop.sh));
    const sx = Math.max(0, Math.min(width - sw, crop.sx));
    const sy = Math.max(0, Math.min(height - sh, crop.sy));

    return { sx, sy, sw, sh };
  }

  function expandDetectedFaceCrop(box, width, height) {
    const paddingX = box.width * 0.42;
    const paddingTop = box.height * 0.34;
    const paddingBottom = box.height * 0.46;

    return clampCropToVideo(
      {
        sx: box.x - paddingX,
        sy: box.y - paddingTop,
        sw: box.width + paddingX * 2,
        sh: box.height + paddingTop + paddingBottom
      },
      width,
      height
    );
  }

  async function refreshPortraitFromCameraFrame() {
    if (!state.camera.active || !portraitCameraPreview || portraitCameraPreview.readyState < 2 || state.camera.detecting) {
      return;
    }

    state.camera.detecting = true;

    try {
      const width = portraitCameraPreview.videoWidth;
      const height = portraitCameraPreview.videoHeight;
      let template = null;

      if (!state.camera.faceLandmarker && !state.camera.mediapipeFailed) {
        await ensureFaceLandmarker();
      }

      if (state.camera.faceLandmarker) {
        try {
          const results = state.camera.faceLandmarker.detectForVideo(portraitCameraPreview, performance.now());
          const landmarks = results?.faceLandmarks?.[0];

          if (landmarks?.length) {
            const crop = getCropFromLandmarks(landmarks, width, height);
            template = buildAbstractTrackedTemplateFromSource(portraitCameraPreview, crop, "face");
            setCameraMode("face");
          }
        } catch (error) {
          state.camera.mediapipeFailed = true;
          state.camera.faceLandmarker = null;
        }
      }

      if (!template && state.camera.detector) {
        try {
          const faces = await state.camera.detector.detect(portraitCameraPreview);

          if (faces.length > 0) {
            const face = faces
              .slice()
              .sort((first, second) => (second.boundingBox.width * second.boundingBox.height) - (first.boundingBox.width * first.boundingBox.height))[0];

            template = buildAbstractTrackedTemplateFromSource(
              portraitCameraPreview,
              expandDetectedFaceCrop(face.boundingBox, width, height),
              "face"
            );
            setCameraMode("face");
          }
        } catch (error) {
          state.camera.detector = null;
        }
      }

      if (!template) {
        template = buildAbstractTrackedTemplateFromSource(
          portraitCameraPreview,
          detectSubjectCropFromSource(portraitCameraPreview),
          "object"
        );
        setCameraMode("object");
      }

      if (template.length) {
        state.customPortraitTemplate = template;
        applyShapeTargets(state.shapes.indexOf("camera"), false);
      }
    } finally {
      state.camera.detecting = false;
    }
  }

  async function startPortraitCamera() {
    if (!canUseCamera || state.camera.starting || state.camera.active || !portraitCameraPreview) {
      updateAudioUi(
        canUseCamera
          ? "Camera is still starting."
          : "Live camera needs HTTPS or localhost in a supported browser.",
        !canUseCamera
      );
      return;
    }

    state.camera.starting = true;
    updateAudioUi("Requesting front camera access...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 960 },
          height: { ideal: 1280 }
        },
        audio: false
      });

      portraitCameraPreview.srcObject = stream;
      await portraitCameraPreview.play();

      state.camera.stream = stream;
      state.camera.active = true;
      state.camera.lastCaptureAt = 0;
      state.camera.mode = "idle";
      state.camera.audioLinked = false;
      state.camera.trackedProfile = null;
      state.camera.abstractShapeKind = null;
      state.pointerBoost = 0;
      state.dispersion = 0;
      state.flash = 0;
      updatePortraitUi(true);
      updateAudioUi("Camera live. Initializing face tracking...");
      await ensureFaceLandmarker();
      await refreshPortraitFromCameraFrame();

      if (!state.audio.enabled && canUseHeroAudio) {
        await startAudioReactiveMode({ fromCamera: true, silentError: true });
      } else {
        updateAudioUi(getCameraStatusMessage());
      }
    } catch (error) {
      const errorName = error?.name || "";
      let message = "Camera could not be enabled.";

      if (errorName === "NotAllowedError" || errorName === "SecurityError") {
        message = "Camera permission was blocked. Allow access to turn your face into particles.";
      } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
        message = "No camera was found on this device.";
      }

      updatePortraitUi(false);
      updateAudioUi(message, true);
    } finally {
      state.camera.starting = false;
      updatePortraitUi(state.camera.active);
    }
  }

  async function stopPortraitCamera() {
    const shouldStopLinkedAudio = state.camera.audioLinked && state.audio.enabled;

    if (state.camera.stream) {
      state.camera.stream.getTracks().forEach((track) => track.stop());
      state.camera.stream = null;
    }

    if (portraitCameraPreview) {
      portraitCameraPreview.pause();
      portraitCameraPreview.srcObject = null;
    }

    state.camera.active = false;
    state.camera.lastCaptureAt = 0;
    state.camera.detecting = false;
    state.camera.mode = "idle";
    state.customPortraitTemplate = null;
    state.camera.audioLinked = false;
    state.camera.trackedProfile = null;
    state.camera.abstractShapeKind = null;
    updatePortraitUi(false);

    if (shouldStopLinkedAudio) {
      await stopAudioReactiveMode();
    } else if (state.audio.enabled) {
      updateAudioUi("Audio-reactive mode is on. The morph now follows the same track as Interactive Work.");
    } else {
      updateAudioUi("Live camera stopped. Enable it again to track your face or an object.");
    }

    if (state.shapes[state.currentShape] === "camera" && !state.audio.enabled) {
      morphTo(0);
    }
  }

  function cleanupHeroMedia() {
    void stopPortraitCamera();
    if (!state.camera.audioLinked) {
      void stopAudioReactiveMode({ closeContext: true });
    }
  }

  function createProceduralPortrait(count) {
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const chance = Math.random();
      let point;

      if (chance < 0.46) {
        point = sampleSphereSurface(0.4, 0.54, 0.34, 0.02, -0.34, 0.02);
        point.x += point.y * 0.08;
        point.region = "head";
      } else if (chance < 0.62) {
        point = sampleCylinder(0.11, 0.32, 0.16);
        point.region = "neck";
      } else if (chance < 0.82) {
        point = sampleSphereSurface(0.8, 0.32, 0.42, 0, 0.62, 0);
        point.y = Math.max(point.y, 0.34 + Math.random() * 0.48);
        point.x += Math.sin(point.y * 5.5) * 0.04;
        point.region = "torso";
      } else if (chance < 0.9) {
        const theta = Math.random() * Math.PI * 2;
        const radiusX = randomBetween(0.05, 0.12);
        const radiusY = randomBetween(0.014, 0.034);
        const centerY = -0.045 + randomBetween(-0.012, 0.012);
        const isUpper = Math.sin(theta) < 0;

        point = {
          x: 0.03 + Math.cos(theta) * radiusX,
          y: centerY + Math.sin(theta) * radiusY,
          z: 0.28 + Math.cos(theta) * 0.022
        };
        point.region = isUpper ? "mouth-upper" : "mouth-lower";
      } else if (chance < 0.95) {
        point = {
          x: 0.03 + randomBetween(-0.065, 0.065),
          y: -0.045 + randomBetween(-0.022, 0.024),
          z: 0.24 + randomBetween(-0.028, 0.02)
        };
        point.region = "mouth-core";
      } else {
        point = sampleSphereSurface(0.54, 0.68, 0.5, 0.04, -0.18, 0.03);
        point.x += randomBetween(-0.08, 0.08);
        point.y += randomBetween(-0.06, 0.06);
        point.region = "halo";
      }

      point.x += randomBetween(-0.03, 0.03);
      point.y += randomBetween(-0.03, 0.03);
      point.z += randomBetween(-0.03, 0.03);
      points.push(point);
    }

    return shuffle(points);
  }

  function createPortraitFromTemplate(count) {
    if (!state.customPortraitTemplate?.length) {
      return createProceduralPortrait(count);
    }

    const template = shuffle([...state.customPortraitTemplate]);
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const source = template[index % template.length];

      points.push({
        x: source.x + randomBetween(-0.018, 0.018),
        y: source.y + randomBetween(-0.018, 0.018),
        z: source.z + randomBetween(-0.03, 0.03),
        region: source.region
      });
    }

    return shuffle(points);
  }

  function createPortrait(count) {
    return createPortraitFromTemplate(count);
  }

  function createCameraTrackedShape(count) {
    if (!state.customPortraitTemplate?.length) {
      return createProceduralPortrait(count);
    }

    const template = state.customPortraitTemplate;
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const source = template[index % template.length];
      const phase = index * 0.61803398875;

      points.push({
        x: source.x + Math.sin(phase * 3.1) * 0.004,
        y: source.y + Math.cos(phase * 2.7) * 0.004,
        z: source.z + Math.sin(phase * 1.9) * 0.012,
        region: source.region || "body"
      });
    }

    return shuffle(points);
  }

  function createSphere(count) {
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const point = sampleSphereSurface(0.82, 0.82, 0.82);
      point.x += randomBetween(-0.02, 0.02);
      point.y += randomBetween(-0.02, 0.02);
      point.z += randomBetween(-0.02, 0.02);
      points.push(point);
    }

    return points;
  }

  function createCube(count) {
    const points = [];
    const half = 0.68;

    for (let index = 0; index < count; index += 1) {
      const face = Math.floor(Math.random() * 6);
      const a = randomBetween(-half, half);
      const b = randomBetween(-half, half);
      const point = { x: 0, y: 0, z: 0 };

      if (face === 0) {
        point.x = -half;
        point.y = a;
        point.z = b;
      } else if (face === 1) {
        point.x = half;
        point.y = a;
        point.z = b;
      } else if (face === 2) {
        point.y = -half;
        point.x = a;
        point.z = b;
      } else if (face === 3) {
        point.y = half;
        point.x = a;
        point.z = b;
      } else if (face === 4) {
        point.z = -half;
        point.x = a;
        point.y = b;
      } else {
        point.z = half;
        point.x = a;
        point.y = b;
      }

      point.x += randomBetween(-0.025, 0.025);
      point.y += randomBetween(-0.025, 0.025);
      point.z += randomBetween(-0.025, 0.025);
      points.push(point);
    }

    return points;
  }

  function createTorus(count) {
    const points = [];
    const majorRadius = 0.56;
    const minorRadius = 0.22;

    for (let index = 0; index < count; index += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;
      const ring = majorRadius + Math.cos(phi) * minorRadius;

      points.push({
        x: Math.cos(theta) * ring,
        y: Math.sin(phi) * minorRadius,
        z: Math.sin(theta) * ring
      });
    }

    return points;
  }

  function createWave(count) {
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const x = randomBetween(-1, 1);
      const z = randomBetween(-1, 1);
      const y = Math.sin(x * 4.4) * 0.2 + Math.cos(z * 3.6) * 0.16;

      points.push({
        x: x * 0.94,
        y,
        z: z * 0.94
      });
    }

    return points;
  }

  function createHelix(count) {
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const turns = randomBetween(-Math.PI * 2.3, Math.PI * 2.3);
      const radius = 0.18 + Math.abs(Math.sin(turns * 1.5)) * 0.24 + randomBetween(-0.04, 0.04);

      points.push({
        x: Math.cos(turns) * radius,
        y: (turns / (Math.PI * 2.3)) * 0.95,
        z: Math.sin(turns) * radius
      });
    }

    return points;
  }

  function createCone(count) {
    const points = [];
    const height = 1.48;
    const baseRadius = 0.78;

    for (let index = 0; index < count; index += 1) {
      const theta = Math.random() * Math.PI * 2;
      const chance = Math.random();

      if (chance < 0.84) {
        const h = Math.random();
        const radius = baseRadius * (1 - h);

        points.push({
          x: Math.cos(theta) * radius,
          y: 0.72 - h * height,
          z: Math.sin(theta) * radius
        });
      } else {
        const radius = Math.sqrt(Math.random()) * baseRadius;

        points.push({
          x: Math.cos(theta) * radius,
          y: 0.72,
          z: Math.sin(theta) * radius
        });
      }
    }

    return points;
  }

  function createCrystal(count) {
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const x = randomBetween(-1, 1);
      const y = randomBetween(-1, 1);
      const z = randomBetween(-1, 1);
      const scale = 0.9 / (Math.abs(x) + Math.abs(y) + Math.abs(z) + 0.0001);

      points.push({
        x: x * scale + randomBetween(-0.025, 0.025),
        y: y * scale + randomBetween(-0.025, 0.025),
        z: z * scale + randomBetween(-0.025, 0.025)
      });
    }

    return points;
  }

  function createRibbon(count) {
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const t = randomBetween(-1, 1);
      const width = randomBetween(-0.18, 0.18);
      const centerX = t * 0.96;
      const centerY = Math.sin(t * 5.8) * 0.2;
      const centerZ = Math.cos(t * 4.2) * 0.28;

      points.push({
        x: centerX,
        y: centerY + width * 0.72,
        z: centerZ + Math.sin(t * 7.2) * width
      });
    }

    return points;
  }

  function createBloom(count) {
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const theta = Math.random() * Math.PI * 2;
      const petalRadius = 0.22 + Math.abs(Math.sin(theta * 3)) * 0.34;
      const radius = petalRadius * Math.sqrt(Math.random());

      points.push({
        x: Math.cos(theta) * radius,
        y: Math.sin(theta * 3) * 0.2 + randomBetween(-0.08, 0.08),
        z: Math.sin(theta) * radius
      });
    }

    return points;
  }

  function createHourglass(count) {
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const theta = Math.random() * Math.PI * 2;
      const y = randomBetween(-0.82, 0.82);
      const radius = 0.08 + Math.abs(y) * 0.64 + randomBetween(-0.025, 0.025);

      points.push({
        x: Math.cos(theta) * radius,
        y,
        z: Math.sin(theta) * radius
      });
    }

    return points;
  }

  function createFish(count) {
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const chance = Math.random();
      let point;

      if (chance < 0.62) {
        point = sampleSphereSurface(0.82, 0.34, 0.22, 0.04, 0, 0);
      } else if (chance < 0.8) {
        const tailProgress = Math.random();
        const spread = (1 - tailProgress) * 0.34 + 0.06;
        point = {
          x: -0.7 - tailProgress * 0.24,
          y: randomBetween(-spread, spread),
          z: randomBetween(-spread * 0.74, spread * 0.74)
        };
      } else if (chance < 0.9) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const finArc = Math.random();
        point = {
          x: randomBetween(-0.22, 0.3),
          y: side * (0.12 + Math.sin(finArc * Math.PI) * 0.2),
          z: randomBetween(-0.1, 0.1)
        };
      } else if (chance < 0.96) {
        point = {
          x: randomBetween(0.56, 0.82),
          y: randomBetween(-0.05, 0.05),
          z: randomBetween(-0.09, 0.09)
        };
      } else {
        point = {
          x: randomBetween(0.24, 0.42),
          y: randomBetween(-0.06, 0.06),
          z: Math.random() > 0.5 ? 0.11 : -0.11
        };
      }

      point.x += randomBetween(-0.02, 0.02);
      point.y += randomBetween(-0.02, 0.02);
      point.z += randomBetween(-0.02, 0.02);
      points.push(point);
    }

    return points;
  }

  function createBird(count) {
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const chance = Math.random();
      let point;

      if (chance < 0.42) {
        point = sampleSphereSurface(0.56, 0.34, 0.28, -0.1, 0.08, 0);
      } else if (chance < 0.78) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const wingSpan = Math.random();
        const arch = Math.sin(wingSpan * Math.PI);
        point = {
          x: -0.14 + wingSpan * 0.7,
          y: -0.08 - arch * randomBetween(0.2, 0.46),
          z: side * (0.12 + (1 - wingSpan) * 0.34)
        };
      } else if (chance < 0.88) {
        point = {
          x: randomBetween(-0.84, -0.56),
          y: randomBetween(-0.02, 0.22),
          z: randomBetween(-0.16, 0.16)
        };
      } else if (chance < 0.96) {
        point = {
          x: randomBetween(0.44, 0.72),
          y: randomBetween(-0.02, 0.08),
          z: randomBetween(-0.08, 0.08)
        };
      } else {
        point = {
          x: randomBetween(0.64, 0.88),
          y: randomBetween(0, 0.06),
          z: randomBetween(-0.04, 0.04)
        };
      }

      point.x += randomBetween(-0.018, 0.018);
      point.y += randomBetween(-0.018, 0.018);
      point.z += randomBetween(-0.018, 0.018);
      points.push(point);
    }

    return points;
  }

  function createCat(count) {
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const chance = Math.random();
      let point;

      if (chance < 0.36) {
        point = sampleSphereSurface(0.42, 0.42, 0.36, 0.02, -0.16, 0);
      } else if (chance < 0.64) {
        point = sampleSphereSurface(0.56, 0.34, 0.32, -0.02, 0.4, 0);
      } else if (chance < 0.74) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const earRise = Math.random();
        point = {
          x: side * (0.16 + earRise * 0.12),
          y: -0.38 - earRise * 0.24,
          z: randomBetween(-0.12, 0.12)
        };
      } else if (chance < 0.86) {
        const legSide = Math.random() > 0.5 ? 1 : -1;
        point = {
          x: legSide * randomBetween(0.08, 0.28),
          y: randomBetween(0.58, 0.88),
          z: randomBetween(-0.12, 0.12)
        };
      } else if (chance < 0.96) {
        const tailT = Math.random();
        point = {
          x: 0.32 + tailT * 0.56,
          y: 0.48 - Math.sin(tailT * Math.PI) * 0.42,
          z: Math.cos(tailT * Math.PI * 1.4) * 0.18
        };
      } else {
        point = {
          x: randomBetween(0.2, 0.56),
          y: randomBetween(-0.2, -0.06),
          z: randomBetween(-0.03, 0.03)
        };
      }

      point.x += randomBetween(-0.02, 0.02);
      point.y += randomBetween(-0.02, 0.02);
      point.z += randomBetween(-0.02, 0.02);
      points.push(point);
    }

    return points;
  }

  function createButterfly(count) {
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const chance = Math.random();
      let point;

      if (chance < 0.42) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const wingR = Math.sqrt(Math.random());
        const wingAngle = randomBetween(0.08, 0.92) * Math.PI;
        point = {
          x: side * (0.16 + Math.cos(wingAngle) * wingR * 0.64),
          y: -0.04 - Math.sin(wingAngle) * wingR * 0.64,
          z: side * 0.08 + randomBetween(-0.12, 0.12)
        };
      } else if (chance < 0.74) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const wingR = Math.sqrt(Math.random());
        const wingAngle = randomBetween(0.05, 0.95) * Math.PI;
        point = {
          x: side * (0.1 + Math.cos(wingAngle) * wingR * 0.54),
          y: 0.14 + Math.sin(wingAngle) * wingR * 0.5,
          z: side * 0.06 + randomBetween(-0.1, 0.1)
        };
      } else if (chance < 0.92) {
        point = {
          x: randomBetween(-0.05, 0.05),
          y: randomBetween(-0.42, 0.52),
          z: randomBetween(-0.06, 0.06)
        };
      } else {
        const side = Math.random() > 0.5 ? 1 : -1;
        const t = Math.random();
        point = {
          x: side * (0.04 + t * 0.22),
          y: -0.4 - t * 0.3 + Math.sin(t * Math.PI) * 0.08,
          z: side * 0.03 + randomBetween(-0.02, 0.02)
        };
      }

      point.x += randomBetween(-0.016, 0.016);
      point.y += randomBetween(-0.016, 0.016);
      point.z += randomBetween(-0.016, 0.016);
      points.push(point);
    }

    return points;
  }

  function createGuitar(count) {
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const chance = Math.random();
      let point;

      if (chance < 0.42) {
        point = sampleSphereSurface(0.46, 0.52, 0.22, 0, 0.34, 0);
      } else if (chance < 0.72) {
        point = sampleSphereSurface(0.34, 0.34, 0.18, 0, -0.14, 0);
      } else if (chance < 0.9) {
        point = {
          x: randomBetween(-0.08, 0.08),
          y: randomBetween(-0.86, -0.16),
          z: randomBetween(-0.08, 0.08)
        };
      } else if (chance < 0.97) {
        point = {
          x: randomBetween(-0.14, 0.14),
          y: randomBetween(-1.02, -0.86),
          z: randomBetween(-0.1, 0.1)
        };
      } else {
        point = {
          x: randomBetween(-0.03, 0.03),
          y: randomBetween(-0.84, 0.58),
          z: randomBetween(-0.02, 0.02)
        };
      }

      point.x += randomBetween(-0.015, 0.015);
      point.y += randomBetween(-0.015, 0.015);
      point.z += randomBetween(-0.015, 0.015);
      points.push(point);
    }

    return points;
  }

  function createShape(name, count) {
    if (name === "portrait") {
      return createPortrait(count);
    }

    if (name === "sphere") {
      return createSphere(count);
    }

    if (name === "cube") {
      return createCube(count);
    }

    if (name === "torus") {
      return createTorus(count);
    }

    if (name === "helix") {
      return createHelix(count);
    }

    if (name === "cone") {
      return createCone(count);
    }

    if (name === "crystal") {
      return createCrystal(count);
    }

    if (name === "ribbon") {
      return createRibbon(count);
    }

    if (name === "bloom") {
      return createBloom(count);
    }

    if (name === "hourglass") {
      return createHourglass(count);
    }

    if (name === "fish") {
      return createFish(count);
    }

    if (name === "bird") {
      return createBird(count);
    }

    if (name === "cat") {
      return createCat(count);
    }

    if (name === "butterfly") {
      return createButterfly(count);
    }

    if (name === "guitar") {
      return createGuitar(count);
    }

    if (name === "camera") {
      return createCameraTrackedShape(count);
    }

    return createWave(count);
  }

  function updateAudioUi(message, isError = false) {
    if (audioReactiveToggle) {
      audioReactiveToggle.classList.toggle("is-active", state.audio.enabled);
      audioReactiveToggle.classList.toggle("is-error", isError);
      audioReactiveToggle.textContent = state.audio.enabled ? "PAUSE" : "CLICK";
      audioReactiveToggle.setAttribute("aria-pressed", String(state.audio.enabled));
      audioReactiveToggle.setAttribute("aria-label", state.audio.enabled ? "Pause audio-reactive track" : "Play audio-reactive track");
      audioReactiveToggle.disabled = !canUseHeroAudio || state.audio.isStarting;
    }

    if (audioReactiveStatus) {
      audioReactiveStatus.textContent = message;
    }
  }

  function resetAudioMetrics() {
    state.audio.level = 0;
    state.audio.waveform = 0;
    state.audio.bass = 0;
    state.audio.lowMid = 0;
    state.audio.mid = 0;
    state.audio.treble = 0;
    state.audio.presence = 0;
    state.audio.air = 0;
    state.audio.flux = 0;
    state.audio.transient = 0;
    state.audio.centroid = 0;
    state.audio.note = 0;
    state.audio.noteDrift = 0;
    state.audio.brightness = 0;
    state.audio.kick = 0;
    state.audio.snare = 0;
    state.audio.hat = 0;
    state.audio.melody = 0;
    state.audio.beatPulse = 0;
    state.audio.beatInterval = 620;
    state.audio.tempo = 96;
    state.audio.lastBeatAt = 0;
    state.audio.guitar = 0;
    state.audio.percussion = 0;
    state.audio.surge = 0;
    state.audio.beatCooldown = 0;
  }

  async function stopAudioReactiveMode(options = {}) {
    const {
      preserveCameraMessage = false,
      closeContext = false
    } = options;

    if (heroAudioTrack) {
      heroAudioTrack.pause();
    }

    if (closeContext) {
      if (state.audio.source) {
        state.audio.source.disconnect();
        state.audio.source = null;
      }

      if (state.audio.analyser) {
        state.audio.analyser.disconnect();
        state.audio.analyser = null;
      }

      if (state.audio.context && state.audio.context.state !== "closed") {
        try {
          await state.audio.context.close();
        } catch (error) {
          // Closing can fail if the context is already tearing down.
        }
      }

      state.audio.context = null;
      state.audio.frequencyData = null;
      state.audio.previousFrequencyData = null;
      state.audio.timeDomainData = null;
    }

    state.audio.enabled = false;
    state.camera.audioLinked = false;
    resetAudioMetrics();
    resizeCanvas();
    syncHeroPointCloud();

    if (preserveCameraMessage && state.camera.active) {
      updateAudioUi(getCameraStatusMessage());
    } else {
      updateAudioUi("Track paused. Click to resume audio-reactive morph.");
    }
  }

  async function startAudioReactiveMode(options = {}) {
    const {
      fromCamera = false,
      silentError = false
    } = options;

    if (state.audio.enabled) {
      if (fromCamera) {
        state.camera.audioLinked = true;
      }

      if (state.camera.active) {
        updateAudioUi(getCameraStatusMessage());
      }

      return true;
    }

    if (!canUseHeroAudio || state.audio.isStarting) {
      updateAudioUi(
        canUseHeroAudio
          ? "Audio track is still loading."
          : "Audio track is unavailable on this page.",
        !canUseHeroAudio
      );
      return false;
    }

    state.audio.isStarting = true;
    updateAudioUi("Loading audio-reactive track...");

    try {
      const audioContext = state.audio.context || new AudioContextConstructor();

      if (!state.audio.source || !state.audio.analyser) {
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(heroAudioTrack);

        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.84;
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        state.audio.source = source;
        state.audio.analyser = analyser;
        state.audio.frequencyData = new Uint8Array(analyser.frequencyBinCount);
        state.audio.previousFrequencyData = new Uint8Array(analyser.frequencyBinCount);
        state.audio.timeDomainData = new Uint8Array(analyser.fftSize);
      }

      state.audio.context = audioContext;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      if (heroAudioTrack) {
        heroAudioTrack.loop = true;
        const playPromise = heroAudioTrack.play();
        if (playPromise && typeof playPromise.then === "function") {
          await playPromise;
        }
      }

      state.audio.enabled = true;
      state.audio.lastMorphAt = performance.now();
      state.audio.lastBeatAt = 0;
      state.audio.visualBlend = Math.max(state.audio.visualBlend, 0.2);
      state.dispersion = Math.max(state.dispersion, 0.5);
      state.flash = Math.max(state.flash, 0.18);
      state.camera.audioLinked = fromCamera;
      resizeCanvas();
      syncHeroPointCloud();

      if (!state.camera.active) {
        const portraitIndex = getPortraitShapeIndex();
        if (portraitIndex >= 0) {
          morphTo(portraitIndex);
        } else {
          morphRandom({ preferRealWorld: true });
        }
        state.audio.lastMorphAt = performance.now();
      }

      if (state.camera.active) {
        updateAudioUi(getCameraStatusMessage());
      } else {
        updateAudioUi("Audio-reactive portrait mode is on. The face morph now follows the music.");
      }

      return true;
    } catch (error) {
      const errorName = error?.name || "";
      let message = "Audio track could not be played.";

      if (errorName === "NotAllowedError" || errorName === "SecurityError") {
        message = "Audio playback was blocked. Click again to allow sound.";
      } else if (errorName === "NotSupportedError" || errorName === "AbortError") {
        message = "This browser could not decode the selected audio file.";
      }

      state.camera.audioLinked = false;

      if (silentError && state.camera.active) {
        await stopAudioReactiveMode({ preserveCameraMessage: true });
        updateAudioUi(`${getCameraStatusMessage()} Audio track was not enabled.`, true);
      } else {
        updateAudioUi(message, true);
        await stopAudioReactiveMode();
        updateAudioUi(message, true);
      }

      return false;
    } finally {
      state.audio.isStarting = false;

      if (audioReactiveToggle) {
        audioReactiveToggle.disabled = !canUseHeroAudio;
      }
    }
  }

  function getBandAverage(data, startRatio, endRatio) {
    const start = Math.max(0, Math.floor(data.length * startRatio));
    const end = Math.min(data.length, Math.max(start + 1, Math.floor(data.length * endRatio)));
    let total = 0;

    for (let index = start; index < end; index += 1) {
      total += data[index];
    }

    return total / ((end - start) * 255);
  }

  function getSpectralFlux(currentData, previousData) {
    if (!currentData || !previousData || currentData.length !== previousData.length) {
      return 0;
    }

    let total = 0;

    for (let index = 1; index < currentData.length; index += 2) {
      const delta = currentData[index] - previousData[index];

      if (delta > 0) {
        total += delta;
      }
    }

    return total / (((currentData.length + 1) / 2) * 255);
  }

  function getWaveformEnergy(data) {
    if (!data || !data.length) {
      return 0;
    }

    let total = 0;

    for (let index = 0; index < data.length; index += 1) {
      const normalized = (data[index] - 128) / 128;
      total += normalized * normalized;
    }

    return Math.min(1, Math.sqrt(total / data.length) * 2.8);
  }

  function getSpectralCentroid(data) {
    if (!data || !data.length) {
      return 0;
    }

    let weighted = 0;
    let total = 0;

    for (let index = 2; index < data.length; index += 1) {
      const value = data[index] / 255;
      weighted += value * index;
      total += value;
    }

    if (total <= 0.0001) {
      return 0;
    }

    return weighted / (total * data.length);
  }

  function getDominantBand(data, startRatio, endRatio) {
    if (!data || !data.length) {
      return { value: 0, position: 0 };
    }

    const start = Math.max(0, Math.floor(data.length * startRatio));
    const end = Math.min(data.length, Math.max(start + 1, Math.floor(data.length * endRatio)));
    let highestValue = 0;
    let highestIndex = start;

    for (let index = start; index < end; index += 1) {
      const value = data[index] / 255;

      if (value > highestValue) {
        highestValue = value;
        highestIndex = index;
      }
    }

    return {
      value: highestValue,
      position: (highestIndex - start) / Math.max(1, end - start - 1)
    };
  }

  function updateAudioReactiveState(time) {
    if (!state.audio.enabled || !state.audio.analyser || !state.audio.frequencyData) {
      state.audio.level += (0 - state.audio.level) * 0.08;
      state.audio.waveform += (0 - state.audio.waveform) * 0.08;
      state.audio.bass += (0 - state.audio.bass) * 0.08;
      state.audio.lowMid += (0 - state.audio.lowMid) * 0.08;
      state.audio.mid += (0 - state.audio.mid) * 0.08;
      state.audio.treble += (0 - state.audio.treble) * 0.08;
      state.audio.presence += (0 - state.audio.presence) * 0.08;
      state.audio.air += (0 - state.audio.air) * 0.08;
      state.audio.flux += (0 - state.audio.flux) * 0.08;
      state.audio.transient += (0 - state.audio.transient) * 0.08;
      state.audio.centroid += (0 - state.audio.centroid) * 0.08;
      state.audio.note += (0 - state.audio.note) * 0.08;
      state.audio.noteDrift += (0 - state.audio.noteDrift) * 0.08;
      state.audio.brightness += (0 - state.audio.brightness) * 0.08;
      state.audio.kick += (0 - state.audio.kick) * 0.08;
      state.audio.snare += (0 - state.audio.snare) * 0.08;
      state.audio.hat += (0 - state.audio.hat) * 0.08;
      state.audio.melody += (0 - state.audio.melody) * 0.08;
      state.audio.beatPulse += (0 - state.audio.beatPulse) * 0.1;
      state.audio.guitar += (0 - state.audio.guitar) * 0.08;
      state.audio.percussion += (0 - state.audio.percussion) * 0.08;
      state.audio.surge += (0 - state.audio.surge) * 0.08;
      state.audio.visualBlend += (0 - state.audio.visualBlend) * 0.08;
      return;
    }

    state.audio.visualBlend += (1 - state.audio.visualBlend) * 0.08;

    state.audio.analyser.getByteFrequencyData(state.audio.frequencyData);
    if (state.audio.timeDomainData) {
      state.audio.analyser.getByteTimeDomainData(state.audio.timeDomainData);
    }

    const bass = getBandAverage(state.audio.frequencyData, 0.01, 0.08);
    const lowMid = getBandAverage(state.audio.frequencyData, 0.08, 0.18);
    const mid = getBandAverage(state.audio.frequencyData, 0.18, 0.36);
    const presence = getBandAverage(state.audio.frequencyData, 0.36, 0.62);
    const air = getBandAverage(state.audio.frequencyData, 0.62, 0.92);
    const treble = (presence * 0.72) + (air * 0.28);
    const waveform = getWaveformEnergy(state.audio.timeDomainData);
    const centroid = getSpectralCentroid(state.audio.frequencyData);
    const dominantBand = getDominantBand(state.audio.frequencyData, 0.05, 0.56);
    const flux = getSpectralFlux(state.audio.frequencyData, state.audio.previousFrequencyData);
    const note = Math.min(1, dominantBand.position * 0.82 + centroid * 0.55);
    const noteDrift = Math.min(1, Math.abs(note - state.audio.note) * 3.2);
    const transient = Math.min(1.35, flux * 2.9 + waveform * 0.58 + noteDrift * 0.82);
    const brightness = Math.min(1.05, centroid * 1.32 + air * 0.42 + presence * 0.28);
    const kick = Math.min(1.45, bass * 1.48 + transient * 0.72 + lowMid * 0.26);
    const snare = Math.min(1.35, lowMid * 0.92 + presence * 0.5 + transient * 1.04 + flux * 0.42);
    const hat = Math.min(1.28, air * 1.16 + treble * 0.74 + transient * 0.58 + brightness * 0.32);
    const melody = Math.min(1.3, mid * 0.98 + note * 0.78 + brightness * 0.46 + dominantBand.value * 0.3);
    const guitar = Math.min(1.38, presence * 1.02 + air * 0.5 + dominantBand.value * 0.54 + noteDrift * 0.9 + flux * 1.32);
    const percussion = Math.min(1.4, bass * 1.06 + lowMid * 0.74 + transient * 1.02 + flux * 1.38 + snare * 0.18);
    const level = Math.min(1.26, bass * 1.02 + lowMid * 0.7 + mid * 0.84 + presence * 0.66 + air * 0.26 + waveform * 0.76);
    const surge = Math.min(1.9, bass * 0.92 + percussion * 0.74 + transient * 0.86 + level * 0.34 + noteDrift * 0.26 + snare * 0.14);

    state.audio.level += (level - state.audio.level) * 0.16;
    state.audio.waveform += (waveform - state.audio.waveform) * 0.18;
    state.audio.bass += (bass - state.audio.bass) * 0.17;
    state.audio.lowMid += (lowMid - state.audio.lowMid) * 0.16;
    state.audio.mid += (mid - state.audio.mid) * 0.16;
    state.audio.treble += (treble - state.audio.treble) * 0.15;
    state.audio.presence += (presence - state.audio.presence) * 0.16;
    state.audio.air += (air - state.audio.air) * 0.15;
    state.audio.flux += (flux - state.audio.flux) * 0.24;
    state.audio.transient += (transient - state.audio.transient) * 0.24;
    state.audio.centroid += (centroid - state.audio.centroid) * 0.15;
    state.audio.note += (note - state.audio.note) * 0.18;
    state.audio.noteDrift += (noteDrift - state.audio.noteDrift) * 0.24;
    state.audio.brightness += (brightness - state.audio.brightness) * 0.16;
    state.audio.kick += (kick - state.audio.kick) * 0.21;
    state.audio.snare += (snare - state.audio.snare) * 0.2;
    state.audio.hat += (hat - state.audio.hat) * 0.2;
    state.audio.melody += (melody - state.audio.melody) * 0.19;
    state.audio.guitar += (guitar - state.audio.guitar) * 0.21;
    state.audio.percussion += (percussion - state.audio.percussion) * 0.2;
    state.audio.surge += (surge - state.audio.surge) * 0.18;

    if (state.audio.previousFrequencyData) {
      state.audio.previousFrequencyData.set(state.audio.frequencyData);
    }

    if (state.audio.beatCooldown > 0) {
      state.audio.beatCooldown -= 1;
    }

    if (state.audio.lastBeatAt > 0) {
      const beatAge = time - state.audio.lastBeatAt;
      const beatPhase = beatAge / Math.max(220, state.audio.beatInterval * 0.9);
      const beatPulse = Math.max(0, Math.exp(-beatPhase * 4.6) - 0.015);
      state.audio.beatPulse += (beatPulse - state.audio.beatPulse) * 0.16;
    } else {
      state.audio.beatPulse += (0 - state.audio.beatPulse) * 0.12;
    }

    const beatEnergy =
      state.audio.kick * 0.98 +
      state.audio.snare * 0.78 +
      state.audio.percussion * 0.74 +
      state.audio.transient * 0.66 +
      state.audio.flux * 0.54 +
      state.audio.waveform * 0.22;
    const beatThreshold = 0.42 + state.audio.level * 0.12 + state.audio.air * 0.04;
    const beatDetected =
      !reducedMotion &&
      state.audio.beatCooldown <= 0 &&
      state.audio.level > 0.06 &&
      beatEnergy > beatThreshold &&
      (state.audio.bass > 0.09 || state.audio.snare > 0.16 || state.audio.transient > 0.18);

    if (beatDetected) {
      if (state.audio.lastBeatAt > 0) {
        const interval = time - state.audio.lastBeatAt;

        if (interval >= 180 && interval <= 980) {
          state.audio.beatInterval += (interval - state.audio.beatInterval) * 0.22;
          state.audio.tempo = Math.min(196, Math.max(72, 60000 / state.audio.beatInterval));
        }
      }

      state.audio.lastBeatAt = time;
      state.audio.beatPulse = Math.max(state.audio.beatPulse, 0.92);
      state.pointerBoost = Math.max(state.pointerBoost, 0.84 + state.audio.level * 1.1 + state.audio.transient * 0.42 + state.audio.snare * 0.16);
      state.dispersion = Math.max(state.dispersion, 0.62 + state.audio.transient * 0.1 + state.audio.flux * 0.08);
      state.flash = Math.max(state.flash, 0.44);
      state.audio.surge = Math.max(state.audio.surge, 0.78 + state.audio.percussion * 0.22 + state.audio.noteDrift * 0.12 + state.audio.snare * 0.08);
      state.audio.beatCooldown = state.audio.snare > state.audio.bass ? 5 : 6;

      if (!state.camera.active && time - state.audio.lastMorphAt > 900 && state.audio.bass > 0.12) {
        const portraitIndex = getPortraitShapeIndex();
        if (portraitIndex >= 0 && state.currentShape !== portraitIndex) {
          morphTo(portraitIndex);
        }
        state.audio.lastMorphAt = time;
      }
    }

    if (
      !reducedMotion &&
      !state.camera.active &&
      state.audio.enabled &&
      time - state.audio.lastMorphAt > Math.max(520, 1400 - state.audio.surge * 450 - state.audio.bass * 300) &&
      (state.audio.beatPulse > 0.18 || state.audio.level > 0.22 || state.audio.transient > 0.24)
    ) {
      const portraitIndex = getPortraitShapeIndex();
      if (portraitIndex >= 0 && state.currentShape !== portraitIndex) {
        morphTo(portraitIndex);
      }
      state.audio.lastMorphAt = time;
    }
  }

  function getAudioFieldTarget(point, time) {
    const tempoFactor = Math.min(1.2, Math.max(0.5, state.audio.tempo / 120));
    const bassPulse = Math.min(1.45, state.audio.bass * 1.02 + state.audio.kick * 0.88 + state.audio.surge * 0.5 + state.audio.transient * 0.2);
    const melodyLift = Math.min(1.45, state.audio.melody * 1.08 + state.audio.presence * 0.48 + state.audio.noteDrift * 0.36 + state.audio.note * 0.22 + state.audio.guitar * 0.28);
    const shimmer = Math.min(1.35, state.audio.air * 0.8 + state.audio.treble * 0.46 + state.audio.brightness * 0.4 + state.audio.flux * 0.2);
    const waveformPulse = Math.min(1.25, state.audio.waveform * 0.92 + state.audio.level * 0.4);
    const impact = Math.min(1.8, state.audio.beatPulse * 1.18 + state.audio.transient * 0.92 + state.audio.flux * 0.72 + state.audio.snare * 0.52 + state.audio.waveform * 0.36);
    const layerCount = state.width < 720 ? 2 : 3;
    const layerIndex = point.audioGroup % layerCount;
    const layerDepth = layerCount <= 1 ? 0 : (layerIndex / (layerCount - 1)) * 2 - 1;
    const laneSpacing = 0.14 + waveformPulse * 0.024 + state.audio.snare * 0.016 + impact * 0.014;
    const baseY = layerDepth * laneSpacing;
    const progress = point.audioBias * 2 - 1;
    const sweepTime = time * (0.000035 + tempoFactor * 0.000022 + state.audio.noteDrift * 0.000008 + impact * 0.000006);
    const ribbonTime = time * (0.00008 + tempoFactor * 0.00005 + state.audio.melody * 0.000028 + state.audio.guitar * 0.000024 + impact * 0.00001);
    const sweepX =
      Math.sin(sweepTime + point.audioSpiral * 0.28) * (0.22 + melodyLift * 0.08 + state.audio.beatPulse * 0.08 + impact * 0.06) +
      Math.sin(sweepTime * 0.34 + layerIndex * 0.52) * (0.04 + state.audio.noteDrift * 0.02 + impact * 0.016);
    const ribbonWidth = 0.98 + bassPulse * 0.08 + waveformPulse * 0.06 + state.audio.melody * 0.04 + impact * 0.04;
    const xSpread = progress * ribbonWidth;
    const lineCurve = Math.sin(
      progress * Math.PI * (1.05 + point.motionMode * 0.14) +
      ribbonTime * (1.22 + state.audio.note * 0.32) +
      point.motionPhase
    ) * (0.026 + melodyLift * 0.018 + state.audio.guitar * 0.01 + impact * 0.014);
    const lineDrift = Math.cos(
      ribbonTime * 0.82 +
      progress * (2.8 + point.motionBias * 1.8) +
      layerIndex * 0.68
    ) * (0.012 + shimmer * 0.008 + state.audio.noteDrift * 0.006 + impact * 0.006);
    const verticalWave = Math.sin(
      ribbonTime * (1.06 + state.audio.note * 0.24) +
      progress * (4.6 + state.audio.melody * 1.2) +
      point.seed
    ) * (0.026 + melodyLift * 0.02 + state.audio.waveform * 0.01 + impact * 0.016);
    const secondaryWave = Math.cos(
      ribbonTime * 0.64 +
      progress * 2.6 +
      point.motionPhase * 0.7
    ) * (0.008 + state.audio.presence * 0.008 + state.audio.snare * 0.006 + impact * 0.004);
    const depthFlow = Math.sin(
      ribbonTime * 0.74 +
      progress * 3.4 +
      point.audioDepthBias * 2.6
    ) * (0.034 + shimmer * 0.012 + melodyLift * 0.01 + impact * 0.014);
    const depthPulse =
      Math.cos(sweepTime * 0.84 + point.audioBias * 3.2) * (0.01 + bassPulse * 0.008 + state.audio.kick * 0.006 + impact * 0.006) +
      point.audioDepthBias * (0.016 + state.audio.noteDrift * 0.006 + impact * 0.004);

    const x = xSpread + sweepX + lineCurve + lineDrift;
    const y = baseY + verticalWave + secondaryWave;
    const z = depthFlow + depthPulse;

    return { x, y, z };
  }

  function getGeometricEnergyTarget(point, time, targetX, targetY, targetZ, shapeName, audioLevel, audioFlux, audioGuitar, audioNote, audioNoteDrift, audioBrightness) {
    const isPortraitShape = shapeName === "portrait";
    const radialDistance = Math.hypot(targetX, targetY, targetZ) || 0.0001;
    const azimuth = Math.atan2(targetZ, targetX);
    const elevation = Math.atan2(targetY, Math.hypot(targetX, targetZ));
    const azimuthSteps = (isPortraitShape ? 18 : 14) + Math.round(audioBrightness * 6);
    const elevationSteps = (isPortraitShape ? 10 : 8) + point.motionMode;
    const radiusStep = isPortraitShape ? 0.07 : 0.09;
    const snappedAzimuth = Math.round(azimuth / ((Math.PI * 2) / azimuthSteps)) * ((Math.PI * 2) / azimuthSteps);
    const snappedElevation = Math.round(elevation / (Math.PI / elevationSteps)) * (Math.PI / elevationSteps);
    const snappedRadius = Math.max(radiusStep, Math.round(radialDistance / radiusStep) * radiusStep);
    const snappedX = Math.cos(snappedAzimuth) * Math.cos(snappedElevation) * snappedRadius;
    const snappedY = Math.sin(snappedElevation) * snappedRadius;
    const snappedZ = Math.sin(snappedAzimuth) * Math.cos(snappedElevation) * snappedRadius;
    const geometryMix = isPortraitShape
      ? 0.18 + audioLevel * 0.06 + audioBrightness * 0.04
      : 0.32 + audioBrightness * 0.08 + audioNoteDrift * 0.08;
    const meridianBand = Math.exp(-Math.abs(Math.sin(snappedAzimuth * 2)) * 3.4) * (0.01 + audioFlux * 0.012 + audioGuitar * 0.008);
    const latitudeBand = Math.exp(-Math.abs(Math.sin(snappedElevation * 3)) * 3) * (0.008 + audioBrightness * 0.01);
    const axisPulse = Math.sin(time * (0.00032 + audioNote * 0.00008) + point.motionPhase) * (0.01 + audioFlux * 0.008);

    return {
      x: targetX * (1 - geometryMix) + snappedX * geometryMix + Math.cos(snappedAzimuth + point.motionPhase) * meridianBand + axisPulse * 0.5,
      y: targetY * (1 - geometryMix) + snappedY * geometryMix + Math.sin(snappedElevation + point.motionPhase * 0.8) * latitudeBand,
      z: targetZ * (1 - geometryMix) + snappedZ * geometryMix + Math.sin(snappedAzimuth * 1.4 + point.motionPhase) * meridianBand * 0.82 - axisPulse * 0.32
    };
  }

  function buildHeroStarfield() {
    const starCount = state.width < 720 ? 220 : 420;
    const nebulaCount = state.width < 720 ? 7 : 10;

    state.stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      depth: randomBetween(0.3, 1),
      size: randomBetween(0.5, 2.3),
      speed: randomBetween(0.16, 1.1),
      twinkle: randomBetween(0, Math.PI * 2),
      drift: randomBetween(0.44, 1.48),
      sparkle: Math.random() > 0.84
    }));

    state.starNebula = Array.from({ length: nebulaCount }, () => ({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      radius: randomBetween(
        Math.min(state.width, state.height) * 0.12,
        Math.min(state.width, state.height) * 0.24
      ),
      alpha: randomBetween(0.04, 0.1),
      phase: randomBetween(0, Math.PI * 2),
      drift: randomBetween(0.12, 0.48)
    }));
  }

  function drawAudioCosmicBackdrop(time, audioLevel, audioBass, audioTreble, audioBeatPulse, audioImpact) {
    const t = time * 0.001;
    const fadeAlpha = reducedMotion
      ? 0.62
      : Math.max(0.24, 0.46 - audioLevel * 0.14 - audioImpact * 0.09);

    context.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    context.fillRect(0, 0, state.width, state.height);

    const glowRadius = Math.max(state.width, state.height) * (0.52 + audioImpact * 0.09 + audioBeatPulse * 0.05);
    const glow = context.createRadialGradient(
      state.width * (0.52 + Math.sin(t * 0.24) * 0.02),
      state.height * (0.48 + Math.cos(t * 0.2) * 0.02),
      0,
      state.width * 0.52,
      state.height * 0.48,
      glowRadius
    );
    glow.addColorStop(0, `rgba(255, 255, 255, ${0.2 + audioImpact * 0.18})`);
    glow.addColorStop(0.42, `rgba(190, 190, 190, ${0.12 + audioLevel * 0.08})`);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, state.width, state.height);

    state.starNebula.forEach((cloud, index) => {
      const wobbleX = Math.sin(t * cloud.drift + cloud.phase + index) * (8 + audioImpact * 18);
      const wobbleY = Math.cos(t * cloud.drift * 0.86 + cloud.phase) * (6 + audioImpact * 12);
      const cx = cloud.x + wobbleX;
      const cy = cloud.y + wobbleY;
      const radius = cloud.radius * (1 + audioBeatPulse * 0.18 + audioLevel * 0.08);
      const cloudGradient = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
      cloudGradient.addColorStop(0, `rgba(255, 255, 255, ${cloud.alpha + audioImpact * 0.07})`);
      cloudGradient.addColorStop(0.58, `rgba(194, 194, 194, ${cloud.alpha * 0.46})`);
      cloudGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = cloudGradient;
      context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    });

    state.stars.forEach((star, index) => {
      const velocity = (0.12 + star.speed * 0.22) * (1 + audioBass * 1.8 + audioImpact * 1.2) * star.depth;
      const driftX = Math.sin(t * (0.7 + star.drift) + star.twinkle) * (0.06 + audioTreble * 0.2);
      const driftY = Math.cos(t * (0.54 + star.drift * 0.7) + star.twinkle) * (0.04 + audioTreble * 0.14);

      star.x -= velocity + driftX;
      star.y += driftY;

      if (star.x < -8) {
        star.x = state.width + 8;
        star.y = Math.random() * state.height;
      }

      if (star.y < -8) {
        star.y = state.height + 8;
      } else if (star.y > state.height + 8) {
        star.y = -8;
      }

      const twinkle = (Math.sin(t * (3.2 + star.drift * 2) + star.twinkle) + 1) * 0.5;
      const alpha = Math.min(1, 0.24 + twinkle * 0.62 * star.depth + audioImpact * 0.2 * star.depth);
      const size = Math.max(0.4, star.size * (0.68 + twinkle * 0.86 + audioBeatPulse * 0.34));

      context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      context.fillRect(star.x, star.y, size, size);

      if (star.sparkle && (index % 2 === 0)) {
        context.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.42})`;
        context.lineWidth = Math.max(0.5, size * 0.32);
        context.beginPath();
        context.moveTo(star.x - size * 0.9, star.y + size * 0.5);
        context.lineTo(star.x + size * 1.9, star.y + size * 0.5);
        context.stroke();
      }
    });
  }

  function drawAudioPortraitOrbitField(time, audioLevel, audioBass, audioTreble, audioBeatPulse, audioImpact) {
    const t = time * 0.001;
    const centerX = state.width * 0.5 + Math.sin(t * 0.32) * state.width * 0.012;
    const centerY = state.height * (state.width < 720 ? 0.57 : 0.58) + Math.cos(t * 0.28) * state.height * 0.012;
    const orbitCount = state.width < 720 ? 28 : 48;
    const baseRadius = Math.min(state.width, state.height) * (0.22 + audioBass * 0.06 + audioImpact * 0.04);
    const radiusSpread = Math.min(state.width, state.height) * (0.38 + audioImpact * 0.08);

    for (let orbitIndex = 0; orbitIndex < orbitCount; orbitIndex += 1) {
      const ratio = orbitIndex / Math.max(1, orbitCount - 1);
      const direction = orbitIndex % 2 === 0 ? 1 : -1;
      const orbitPhase = t * (0.22 + audioBass * 0.4 + audioTreble * 0.18) * direction + ratio * Math.PI * 2;
      const radiusX = baseRadius + ratio * radiusSpread;
      const radiusY = radiusX * (0.18 + ratio * 0.22);
      const startAngle = orbitPhase;
      const endAngle = startAngle + Math.PI * (0.9 + audioLevel * 0.8 + audioBeatPulse * 0.26);
      const ringAlpha = Math.max(
        0.08,
        (1 - ratio * 0.58) * (0.24 + audioBeatPulse * 0.2 + audioImpact * 0.14)
      );

      context.save();
      context.translate(centerX, centerY);
      context.rotate(Math.sin(t * 0.13 + ratio * 3.6) * (0.18 + audioImpact * 0.14));
      context.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`;
      context.lineWidth = 0.52 + (1 - ratio) * 0.86 + audioTreble * 0.42;
      context.beginPath();
      context.ellipse(0, 0, radiusX, Math.max(8, radiusY), 0, startAngle, endAngle);
      context.stroke();
      context.restore();
    }

    const coreGlow = context.createRadialGradient(
      centerX,
      centerY - baseRadius * 0.34,
      0,
      centerX,
      centerY - baseRadius * 0.34,
      baseRadius * (0.82 + audioImpact * 0.26)
    );
    coreGlow.addColorStop(0, `rgba(255, 255, 255, ${0.26 + audioImpact * 0.28})`);
    coreGlow.addColorStop(0.42, `rgba(255, 255, 255, ${0.12 + audioLevel * 0.12})`);
    coreGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = coreGlow;
    context.fillRect(
      centerX - baseRadius,
      centerY - baseRadius * 1.4,
      baseRadius * 2,
      baseRadius * 2.2
    );
  }

  function resizeCanvas() {
    const rect = hero.getBoundingClientRect();

    state.width = rect.width;
    state.height = rect.height;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    buildHeroStarfield();
  }

  function createPointInstance() {
    return {
      x: randomBetween(-0.2, 0.2),
      y: randomBetween(-0.2, 0.2),
      z: randomBetween(-0.2, 0.2),
      tx: 0,
      ty: 0,
      tz: 0,
      region: "default",
      size: randomBetween(0.96, 1.9),
      seed: Math.random() * Math.PI * 2,
      orbitSeed: Math.random() * Math.PI * 2,
      driftRadius: randomBetween(0.01, 0.08),
      scatterScale: randomBetween(0.75, 1.25),
      audioGroup: Math.floor(Math.random() * 10),
      audioBias: Math.random(),
      audioSpiral: Math.random() > 0.5 ? 1 : -1,
      audioLane: randomBetween(-1, 1),
      audioDepthBias: randomBetween(-1, 1),
      motionMode: Math.floor(Math.random() * 4),
      motionBias: Math.random(),
      motionPhase: Math.random() * Math.PI * 2
    };
  }

  function syncHeroPointCloud(force = false) {
    const nextPointCount = getHeroPointCount();

    if (!force && nextPointCount === state.pointCount && state.points.length === nextPointCount) {
      return;
    }

    state.pointCount = nextPointCount;

    if (state.points.length < state.pointCount) {
      const missing = state.pointCount - state.points.length;
      state.points.push(...Array.from({ length: missing }, () => createPointInstance()));
    } else if (state.points.length > state.pointCount) {
      state.points.length = state.pointCount;
    }

    if (state.shapes[state.currentShape]) {
      applyShapeTargets(state.currentShape, false);
    }
  }

  function createPoints() {
    state.points = Array.from({ length: state.pointCount }, () => createPointInstance());
  }

  function handleHeroResize() {
    resizeCanvas();
    syncHeroPointCloud();
  }

  function applyShapeTargets(shapeIndex, shouldSchedule = true) {
    state.currentShape = shapeIndex;
    const nextPoints = createShape(state.shapes[shapeIndex], state.pointCount);
    shuffle(nextPoints);

    state.points.forEach((point, index) => {
      const target = nextPoints[index];
      point.tx = target.x;
      point.ty = target.y;
      point.tz = target.z;
      point.region = target.region || "default";
    });

    state.pointerBoost = 1;

    if (shouldSchedule) {
      scheduleNextMorph();
    }
  }

  function morphTo(shapeIndex) {
    applyShapeTargets(shapeIndex, true);
  }

  function morphRandom(options = {}) {
    morphTo(getRandomMorphIndex(state.currentShape, options));
  }

  function drawPointMesh(
    projectedPoints,
    audioLevel,
    audioTreble,
    guitar,
    flash,
    shapeName,
    isAudioMode = false,
    isAudioPortraitMode = false
  ) {
    if (projectedPoints.length < 3) {
      return;
    }

    const isCameraShape = shapeName === "camera";

    const sorted = projectedPoints
      .slice()
      .sort((first, second) => first.x - second.x);
    const maxDistance = Math.min(state.width, state.height) * (isAudioMode ? 0.102 : isAudioPortraitMode ? 0.12 : shapeName === "portrait" ? 0.074 : isCameraShape ? 0.092 : 0.088);
    const lookahead = isAudioMode ? 5 : isAudioPortraitMode ? 6 : isCameraShape ? 5 : shapeName === "portrait" ? 5 : 4;

    context.lineWidth = isAudioMode
      ? 0.12 + audioTreble * 0.08 + guitar * 0.07 + flash * 0.03
      : isAudioPortraitMode
      ? 0.46 + audioTreble * 0.42 + guitar * 0.44 + flash * 0.2
      : isCameraShape
      ? 0.28 + audioTreble * 0.22 + guitar * 0.24 + flash * 0.1
      : 0.16 + audioTreble * 0.08 + guitar * 0.08 + flash * 0.04;

    for (let index = 0; index < sorted.length; index += 1) {
      const point = sorted[index];
      const limit = Math.min(sorted.length, index + lookahead);

      for (let nextIndex = index + 1; nextIndex < limit; nextIndex += 1) {
        const candidate = sorted[nextIndex];
        const dx = candidate.x - point.x;

        if (dx > maxDistance) {
          break;
        }

        const dy = candidate.y - point.y;
        const distance = Math.hypot(dx, dy);

        if (distance > maxDistance) {
          continue;
        }

        const alpha = (1 - distance / maxDistance) * (
          isAudioMode
            ? (0.012 + audioLevel * 0.018 + guitar * 0.014 + flash * 0.008)
            : isAudioPortraitMode
            ? (0.12 + audioLevel * 0.16 + guitar * 0.14 + flash * 0.08)
            : isCameraShape
            ? (0.03 + audioLevel * 0.04 + guitar * 0.05 + flash * 0.03)
            : (0.016 + audioLevel * 0.016 + guitar * 0.014 + flash * 0.01)
        );

        if (alpha < (isAudioMode ? 0.008 : isAudioPortraitMode ? 0.018 : 0.01)) {
          continue;
        }

        context.strokeStyle = isAudioPortraitMode
          ? `rgba(232, 244, 255, ${alpha})`
          : `rgba(12, 12, 12, ${alpha})`;
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(candidate.x, candidate.y);
        context.stroke();
      }
    }
  }

  function render(time) {
    updateAudioReactiveState(time);

    if (state.camera.active && time - state.camera.lastCaptureAt > 120) {
      state.camera.lastCaptureAt = time;
      refreshPortraitFromCameraFrame();
    }

    if (!state.camera.active && !state.audio.enabled && time - state.lastAutoMorphAt > state.autoMorphInterval) {
      morphRandom();
    }

    const portraitIndex = getPortraitShapeIndex();
    if (state.audio.enabled && !state.camera.active && portraitIndex >= 0 && state.currentShape !== portraitIndex) {
      applyShapeTargets(portraitIndex, false);
    }

    const audioLevel = state.audio.level;
    const audioWaveform = state.audio.waveform;
    const audioBass = state.audio.bass;
    const audioLowMid = state.audio.lowMid;
    const audioMid = state.audio.mid;
    const audioTreble = state.audio.treble;
    const audioPresence = state.audio.presence;
    const audioAir = state.audio.air;
    const audioFlux = state.audio.flux;
    const audioTransient = state.audio.transient;
    const audioCentroid = state.audio.centroid;
    const audioNote = state.audio.note;
    const audioNoteDrift = state.audio.noteDrift;
    const audioBrightness = state.audio.brightness;
    const audioKick = state.audio.kick;
    const audioSnare = state.audio.snare;
    const audioHat = state.audio.hat;
    const audioMelody = state.audio.melody;
    const audioBeatPulse = state.audio.beatPulse;
    const audioTempo = state.audio.tempo;
    const audioGuitar = state.audio.guitar;
    const audioPercussion = state.audio.percussion;
    const audioSurge = state.audio.surge;
    const audioImpact = Math.min(1.9, audioBeatPulse * 1.16 + audioTransient * 0.98 + audioFlux * 0.74 + audioSnare * 0.58 + audioKick * 0.4 + audioWaveform * 0.34);
    const shapeName = state.shapes[state.currentShape];
    const isRealWorldShape = REAL_WORLD_MORPH_SHAPES.has(shapeName);
    const isPortraitShape = shapeName === "portrait";
    const isAudioPortraitMode = state.audio.enabled && !state.camera.active && isPortraitShape;
    const isAudioMode = state.audio.visualBlend > 0.025 && !state.camera.active && !isRealWorldShape && !isPortraitShape;
    const isCameraShape = shapeName === "camera" && !isAudioMode;
    const baseScaleBoost = isAudioMode
      ? 1.06
      : isCameraShape
      ? 1
      : isAudioPortraitMode
      ? 1.04
      : isPortraitShape
      ? 0.93
      : isRealWorldShape
      ? 0.98
      : 0.9;
    const sceneScale = Math.min(state.width, state.height) *
      (
        state.width < 720
          ? (isAudioMode ? 0.33 : isCameraShape ? 0.34 : isAudioPortraitMode ? 0.29 : 0.235)
          : (isAudioMode ? 0.4 : isCameraShape ? 0.39 : isAudioPortraitMode ? 0.335 : 0.275)
      ) * baseScaleBoost *
      (1 + (
        isAudioMode
          ? audioBass * 0.08 + audioLevel * 0.05 + audioTransient * 0.04 + audioImpact * 0.035
          : isAudioPortraitMode
            ? audioBass * 0.14 + audioLevel * 0.08 + audioTransient * 0.06 + audioBeatPulse * 0.06 + audioImpact * 0.06
          : isCameraShape
            ? audioBass * 0.12 + audioLevel * 0.06 + audioImpact * 0.05
            : audioBass * 0.21 + audioLevel * 0.12 + audioPercussion * 0.05 + audioImpact * 0.06
      ));
    const perspective = sceneScale * 1.9;
    const idleDispersion = reducedMotion
      ? 0.02
      : isAudioMode
        ? 0.024 + Math.sin(time * 0.00012) * 0.003
        : isAudioPortraitMode
        ? 0.016 + Math.sin(time * 0.0003) * 0.004
        : isCameraShape
        ? 0.004 + Math.sin(time * 0.00024) * 0.002
        : 0.02 + Math.sin(time * 0.00042) * 0.006;
    const reactiveDispersion = isAudioMode
      ? audioLevel * 0.022 + audioBass * 0.024 + audioTreble * 0.008 + audioFlux * 0.01 + audioPercussion * 0.012 + audioGuitar * 0.01 + audioSurge * 0.01 + audioTransient * 0.014 + audioNoteDrift * 0.008 + audioBeatPulse * 0.018 + audioKick * 0.014 + audioSnare * 0.014
      : isAudioPortraitMode
      ? audioLevel * 0.04 + audioBass * 0.055 + audioTreble * 0.02 + audioFlux * 0.03 + audioPercussion * 0.04 + audioSurge * 0.03 + audioBeatPulse * 0.05 + audioTransient * 0.05
      : isCameraShape
      ? audioLevel * 0.03 + audioBass * 0.04 + audioFlux * 0.022 + audioBeatPulse * 0.024 + audioTransient * 0.026
      : audioLevel * 0.12 + audioBass * 0.16 + audioTreble * 0.045 + audioFlux * 0.12 + audioPercussion * 0.08 + audioSurge * 0.08 + audioBeatPulse * 0.06 + audioTransient * 0.07;
    const globalDriftX = reducedMotion ? 0 : (
      isAudioMode
        ? Math.sin(time * (0.00003 + audioTempo * 0.0000002 + audioNote * 0.0000024)) * (0.018 + audioMelody * 0.014 + audioBeatPulse * 0.014 + audioImpact * 0.018)
        : isAudioPortraitMode
          ? Math.sin(time * (0.00026 + audioTempo * 0.00000016)) * (0.016 + audioMelody * 0.014 + audioImpact * 0.02)
        : isCameraShape
          ? Math.sin(time * 0.00022) * (0.014 + audioImpact * 0.014 + audioPresence * 0.008)
          : Math.sin(time * 0.00034) * (0.034 + audioSurge * 0.018 + audioImpact * 0.02)
    );
    const globalDriftY = reducedMotion ? 0 : (
      isAudioMode
        ? Math.cos(time * (0.000028 + audioBrightness * 0.000004 + audioTempo * 0.00000022)) * (0.012 + audioSnare * 0.01 + audioWaveform * 0.008 + audioBeatPulse * 0.012 + audioImpact * 0.014)
        : isAudioPortraitMode
          ? Math.cos(time * (0.00022 + audioBass * 0.0001)) * (0.012 + audioWaveform * 0.01 + audioImpact * 0.016)
        : isCameraShape
          ? Math.cos(time * 0.0002) * (0.012 + audioImpact * 0.012 + audioBass * 0.008)
          : Math.cos(time * 0.00028) * (0.028 + audioSurge * 0.016 + audioImpact * 0.016)
    );
    const globalBreathe = reducedMotion ? 0 : (
      isAudioMode
        ? Math.sin(time * (0.000072 + audioBass * 0.00001 + audioWaveform * 0.000012 + audioTempo * 0.00000014)) * (0.004 + audioLevel * 0.003 + audioKick * 0.004 + audioBeatPulse * 0.005)
        : isAudioPortraitMode
          ? Math.sin(time * (0.00036 + audioBass * 0.00012)) * (0.01 + audioLevel * 0.012 + audioBeatPulse * 0.014 + audioImpact * 0.014)
        : isCameraShape
          ? Math.sin(time * 0.0003) * (0.006 + audioLevel * 0.008 + audioImpact * 0.008)
          : Math.sin(time * (0.00042 + audioBass * 0.00014)) * (0.018 + audioLevel * 0.02 + audioImpact * 0.016)
    );
    const globalSway = reducedMotion ? 0 : (
      isAudioMode
        ? Math.sin(time * (0.000034 + audioMid * 0.000006 + audioMelody * 0.000008)) * (0.028 + audioPresence * 0.014 + audioMelody * 0.018 + audioBeatPulse * 0.016 + audioImpact * 0.014)
        : isAudioPortraitMode
          ? Math.sin(time * (0.00028 + audioMid * 0.00009 + audioGuitar * 0.00012)) * (0.028 + audioPresence * 0.02 + audioGuitar * 0.016 + audioImpact * 0.02)
        : isCameraShape
          ? Math.sin(time * 0.00022) * (0.018 + audioPresence * 0.018 + audioImpact * 0.018)
          : Math.sin(time * (0.00034 + audioMid * 0.0001 + audioGuitar * 0.00012)) * (0.034 + audioPresence * 0.028 + audioGuitar * 0.036 + audioSurge * 0.016 + audioImpact * 0.016)
    );
    const audioSweepX = reducedMotion
      ? 0
      : Math.sin(time * (0.0009 + audioTempo * 0.0000014)) * (
        isAudioMode
          ? 0.03 + audioImpact * 0.055 + audioBass * 0.03
          : isCameraShape
            ? 0.014 + audioImpact * 0.024 + audioBass * 0.016
            : 0.012 + audioImpact * 0.018 + audioBass * 0.012
      );
    const audioSweepY = reducedMotion
      ? 0
      : Math.cos(time * (0.00076 + audioBass * 0.00012 + audioTempo * 0.0000007)) * (
        isAudioMode
          ? 0.016 + audioImpact * 0.03 + audioWaveform * 0.016
          : isCameraShape
            ? 0.008 + audioImpact * 0.014 + audioWaveform * 0.008
            : 0.006 + audioImpact * 0.012 + audioWaveform * 0.006
      );
    const audioSweepZ = reducedMotion
      ? 0
      : Math.sin(time * (0.00062 + audioNote * 0.00008)) * (
        isAudioMode
          ? 0.01 + audioImpact * 0.018
          : isCameraShape
            ? 0.006 + audioImpact * 0.01
            : 0.004 + audioImpact * 0.008
      );
    const clearAlpha = reducedMotion
      ? 1
      : isAudioMode
        ? Math.max(0.11, 0.18 - audioLevel * 0.02 - state.flash * 0.012)
        : isAudioPortraitMode
          ? Math.max(0.2, 0.36 - audioLevel * 0.06 - audioImpact * 0.06)
        : isCameraShape
          ? 1
          : Math.max(0.16, 0.34 - audioLevel * 0.12 - state.flash * 0.08);
    const projectedPoints = [];
    const audioRenderModulo = state.width < 720 ? 4 : 5;
    const audioVisibleGroups = state.width < 720 ? 3 : 4;

    if (isAudioPortraitMode) {
      drawAudioCosmicBackdrop(time, audioLevel, audioBass, audioTreble, audioBeatPulse, audioImpact);
      drawAudioPortraitOrbitField(time, audioLevel, audioBass, audioTreble, audioBeatPulse, audioImpact);
    } else {
      context.fillStyle = `rgba(255, 255, 255, ${clearAlpha})`;
      context.fillRect(0, 0, state.width, state.height);
    }

    state.pointerBoost *= isAudioMode ? 0.94 : isAudioPortraitMode ? 0.92 : 0.95;
    state.dispersion += ((idleDispersion + reactiveDispersion) - state.dispersion) * (isAudioMode ? 0.024 : isAudioPortraitMode ? 0.032 : isCameraShape ? 0.048 : 0.04);
    state.flash *= isAudioMode ? 0.84 : isAudioPortraitMode ? 0.82 : isCameraShape ? 0.88 : 0.89;

    for (const point of state.points) {
      let targetX = point.tx;
      let targetY = point.ty;
      let targetZ = point.tz;

      if (isAudioMode) {
        const audioFieldTarget = getAudioFieldTarget(point, time);
        targetX = audioFieldTarget.x;
        targetY = audioFieldTarget.y;
        targetZ = audioFieldTarget.z;
      }

      const distance = Math.hypot(targetX, targetY, targetZ) || 1;
      const normalizedX = targetX / distance;
      const normalizedY = targetY / distance;
      const normalizedZ = targetZ / distance;
      const orbitRadius = point.driftRadius * (
        isAudioMode
          ? (0.12 + state.dispersion * 0.08 + audioImpact * 0.016)
          : isCameraShape
            ? (0.28 + state.dispersion * 0.62 + audioImpact * 0.08)
            : (0.3 + state.dispersion * 0.7 + audioImpact * 0.1)
      ) * point.scatterScale;
      const orbitX = reducedMotion ? 0 : Math.sin(time * (isAudioMode ? 0.00026 : isCameraShape ? 0.00024 : 0.0009) + point.orbitSeed) * orbitRadius;
      const orbitY = reducedMotion ? 0 : Math.cos(time * (isAudioMode ? 0.00022 : isCameraShape ? 0.00022 : 0.00082) + point.orbitSeed * 1.1) * orbitRadius;
      const orbitZ = reducedMotion ? 0 : Math.sin(time * (isAudioMode ? 0.0002 : isCameraShape ? 0.0002 : 0.00074) + point.orbitSeed * 0.8) * orbitRadius * (isCameraShape ? 0.28 : isAudioMode ? 0.26 : 0.85);
      const spreadAmount = state.dispersion * point.scatterScale;
      const spreadMultiplier = isAudioMode ? 0.012 : isCameraShape ? 0.014 : isRealWorldShape ? 0.038 : shapeName === "portrait" ? 0.056 : 0.082;
      const spreadX = normalizedX * spreadAmount * spreadMultiplier + orbitX;
      const spreadY = normalizedY * spreadAmount * spreadMultiplier + orbitY;
      const spreadZ = normalizedZ * spreadAmount * spreadMultiplier + orbitZ;
      const ornamentStrength = isAudioMode
        ? 0.003 + point.motionBias * 0.0015 + audioGuitar * 0.002 + audioNoteDrift * 0.001 + audioBrightness * 0.001 + audioImpact * 0.0015
        : isCameraShape
          ? 0
          : isRealWorldShape
            ? 0.004 + point.motionBias * 0.003 + audioBass * 0.004 + audioLevel * 0.003 + audioImpact * 0.003
          : 0.008 + point.motionBias * 0.007 + (isPortraitShape ? audioLevel * 0.006 + audioImpact * 0.005 : audioGuitar * 0.01 + audioTreble * 0.004 + audioImpact * 0.006);
      const ornamentPhase = time * (isAudioMode ? 0.00034 : 0.00046 + point.motionMode * 0.00004) + point.motionPhase;
      let ornamentX = 0;
      let ornamentY = 0;
      let ornamentZ = 0;

      if (!isCameraShape) {
        if (point.motionMode === 0) {
          ornamentX = Math.sin(ornamentPhase + point.seed) * ornamentStrength;
          ornamentY = Math.cos(ornamentPhase * 1.08 + point.orbitSeed) * ornamentStrength * 0.84;
          ornamentZ = Math.sin(ornamentPhase * 0.82 + point.seed * 0.7) * ornamentStrength * 0.62;
        } else if (point.motionMode === 1) {
          const petalTheta = Math.atan2(point.ty || point.y, point.tx || point.x);
          const petalWarp = Math.sin(petalTheta * (3 + point.motionMode) + ornamentPhase) * ornamentStrength;
          ornamentX = Math.cos(petalTheta) * petalWarp;
          ornamentY = Math.sin(petalTheta * 1.2) * petalWarp * 0.9;
          ornamentZ = Math.cos(ornamentPhase + point.motionBias * 3) * ornamentStrength * 0.44;
        } else if (point.motionMode === 2) {
          ornamentX = Math.sin(ornamentPhase) * Math.cos(ornamentPhase * 1.4) * ornamentStrength * 1.08;
          ornamentY = Math.sin(ornamentPhase * 0.9 + point.seed) * ornamentStrength * 0.8;
          ornamentZ = Math.cos(ornamentPhase * 1.12 + point.orbitSeed) * ornamentStrength * 0.76;
        } else {
          ornamentX = Math.cos(ornamentPhase + point.seed * 0.6) * ornamentStrength * 0.9;
          ornamentY = Math.sin(ornamentPhase * 1.56 + point.orbitSeed) * ornamentStrength * 1.06;
          ornamentZ = Math.sin(ornamentPhase * 0.72 + point.motionBias * 5) * ornamentStrength * 0.56;
        }
      }

      if (isAudioMode) {
        targetX += audioSweepX * (0.84 + point.audioBias * 0.2);
        targetY += audioSweepY * (0.76 + point.motionBias * 0.16);
        targetZ += audioSweepZ * (0.7 + point.motionBias * 0.12);
        targetX += spreadX * (0.13 + audioGuitar * 0.012 + audioMelody * 0.014 + audioImpact * 0.016);
        targetY += spreadY * (0.1 + audioPercussion * 0.012 + audioWaveform * 0.01 + audioImpact * 0.012);
        targetZ += spreadZ * (0.08 + audioSurge * 0.012 + audioBrightness * 0.01 + audioImpact * 0.01);
      } else if (shapeName === "portrait") {
        targetX += audioSweepX * 0.34;
        targetY += audioSweepY * 0.22;
        targetZ += audioSweepZ * 0.16;
        const mouthOpen = Math.min(1.08, audioMid * 1.18 + audioLowMid * 0.34 + audioLevel * 0.6 + audioPresence * 0.2 + audioImpact * 0.18);
        const mouthPulse = reducedMotion
          ? 0
          : Math.sin(time * (0.0026 + audioPresence * 0.0014 + audioGuitar * 0.0012) + point.seed) * (0.005 + audioImpact * 0.003);
        const stringRipple = reducedMotion
          ? 0
          : Math.sin(point.y * 10 + time * (0.0011 + audioGuitar * 0.0012) + point.seed) * (audioGuitar * 0.008 + audioImpact * 0.004);

        if (point.region === "mouth-upper") {
          targetY -= mouthOpen * 0.028;
          targetZ += mouthOpen * 0.026;
          targetX += mouthPulse * 0.9;
        } else if (point.region === "mouth-lower") {
          targetY += mouthOpen * 0.11;
          targetZ -= mouthOpen * 0.02;
          targetX += mouthPulse * 1.2;
        } else if (point.region === "mouth-core") {
          targetY += mouthOpen * 0.18;
          targetZ -= mouthOpen * 0.03;
          targetX += mouthPulse * 1.45;
        } else if (point.region === "neck") {
          targetY += audioBass * 0.026 + audioImpact * 0.008;
        } else if (point.region === "torso") {
          targetY += audioBass * 0.042 + audioLowMid * 0.014 + audioBeatPulse * 0.01;
          targetX += Math.sin(time * 0.00082 + point.seed * 0.3) * (audioLevel * 0.008 + audioImpact * 0.006) + stringRipple;
        } else if (point.region === "head") {
          targetX += Math.sin(time * 0.00092 + point.seed * 0.2) * (audioLevel * 0.006 + audioImpact * 0.004) + stringRipple * 0.4;
          targetY -= audioBass * 0.01 + audioBeatPulse * 0.004;
        } else if (point.region === "halo") {
          targetX += Math.sin(time * 0.00074 + point.seed * 0.16) * (0.008 + audioTreble * 0.01 + audioGuitar * 0.012 + audioImpact * 0.006);
          targetY += Math.cos(time * 0.00068 + point.seed * 0.18) * (0.006 + audioTreble * 0.008 + audioAir * 0.01 + audioImpact * 0.006);
        }
      } else if (isCameraShape) {
        targetX += audioSweepX * 0.42;
        targetY += audioSweepY * 0.3;
        targetZ += audioSweepZ * 0.22;
        const trackedPulse = audioLevel * 0.02 + audioBass * 0.026 + audioMelody * 0.014 + audioBeatPulse * 0.03 + audioImpact * 0.022;
        const trackedRipple = reducedMotion
          ? 0
          : Math.sin(time * (0.00094 + audioGuitar * 0.0003 + audioNote * 0.0001) + point.seed * 0.24) * (0.008 + audioFlux * 0.014 + audioWaveform * 0.008 + audioImpact * 0.006);

        if (point.region === "focus") {
          targetX += trackedRipple * 1.08;
          targetY += Math.cos(time * 0.001 + point.seed * 0.2) * (audioPresence * 0.016 + audioGuitar * 0.012 + trackedPulse * 0.14);
          targetZ += audioMid * 0.024 + trackedPulse * 0.03 + audioBeatPulse * 0.01;
        } else if (point.region === "core") {
          targetX += trackedRipple * 0.94;
          targetY += Math.sin(time * 0.00092 + point.seed * 0.18) * (audioMid * 0.014 + audioPercussion * 0.01 + trackedPulse * 0.12);
          targetZ += trackedPulse * 0.02;
        } else if (point.region === "body") {
          targetX += trackedRipple * 1.12;
          targetY += audioBass * 0.032 + audioLowMid * 0.016 + trackedPulse * 0.12;
        } else if (point.region === "lower") {
          targetY += audioBass * 0.05 + audioPercussion * 0.022 + trackedPulse * 0.1;
        } else if (point.region === "halo") {
          targetX += Math.sin(time * 0.00072 + point.seed * 0.16) * (0.01 + audioAir * 0.012 + audioGuitar * 0.01 + trackedPulse * 0.08);
          targetY += Math.cos(time * 0.00066 + point.seed * 0.18) * (0.008 + audioTreble * 0.012 + trackedPulse * 0.06);
        }
      }

      if (shapeName === "portrait" && point.region === "halo") {
        targetX += spreadX * 1.2;
        targetY += spreadY * 1.2;
        targetZ += spreadZ * 1.05;
      } else if (shapeName === "portrait" && point.region === "torso") {
        targetX += spreadX * 0.56;
        targetY += spreadY * 0.46;
        targetZ += spreadZ * 0.44;
      } else if (shapeName === "portrait" && point.region && point.region.startsWith("mouth")) {
        targetX += spreadX * 0.22;
        targetY += spreadY * 0.12;
        targetZ += spreadZ * 0.12;
      } else if (isCameraShape && point.region === "halo") {
        targetX += spreadX * 0.9;
        targetY += spreadY * 0.9;
        targetZ += spreadZ * 0.74;
      } else if (isCameraShape && point.region === "focus") {
        targetX += spreadX * 0.16;
        targetY += spreadY * 0.12;
        targetZ += spreadZ * 0.1;
      } else if (isRealWorldShape) {
        targetX += spreadX * 0.34;
        targetY += spreadY * 0.3;
        targetZ += spreadZ * 0.26;
      } else {
        targetX += spreadX * (isAudioMode ? 0.46 : 0.7);
        targetY += spreadY * (isAudioMode ? 0.46 : 0.7);
        targetZ += spreadZ * (isAudioMode ? 0.4 : 0.66);
      }

      if (!isCameraShape && !isAudioMode && !isRealWorldShape && !isPortraitShape) {
        const geometricTarget = getGeometricEnergyTarget(
          point,
          time,
          targetX,
          targetY,
          targetZ,
          shapeName,
          audioLevel,
          audioFlux,
          audioGuitar,
          audioNote,
          audioNoteDrift,
          audioBrightness
        );
        targetX = geometricTarget.x;
        targetY = geometricTarget.y;
        targetZ = geometricTarget.z;
      }

      if (!isCameraShape) {
        if (isAudioMode) {
          const ribbonPhase = time * (0.00008 + audioNote * 0.000016 + audioFlux * 0.000004);
          ornamentX = Math.sin(ribbonPhase + point.audioBias * 3.2) * ornamentStrength;
          ornamentY = Math.cos(ribbonPhase * 0.72 + point.motionBias * 2.6) * ornamentStrength * 0.24;
          ornamentZ = Math.sin(ribbonPhase * 0.86 + point.audioSpiral * 2.1) * ornamentStrength * 0.3;
        }

        targetX += ornamentX;
        targetY += ornamentY;
        targetZ += ornamentZ;
      }

      const cameraLerp = isAudioMode ? 0.034 + audioImpact * 0.005 : isCameraShape ? 0.062 + audioImpact * 0.012 : isRealWorldShape ? 0.048 + audioImpact * 0.01 : 0.04 + audioImpact * 0.008;
      point.x += (targetX - point.x) * cameraLerp;
      point.y += (targetY - point.y) * cameraLerp;
      point.z += (targetZ - point.z) * cameraLerp;

      if (isAudioMode && point.audioGroup % audioRenderModulo >= audioVisibleGroups) {
        continue;
      }

      const reactiveBoost = state.pointerBoost + audioLevel * 0.92 + audioBass * 0.68 + audioImpact * 0.74;
      const wobble = reducedMotion
        ? 0
        : Math.sin(time * (isAudioMode ? 0.001 + audioTreble * 0.00018 : isCameraShape ? 0.00022 : 0.00086 + audioTreble * 0.00012) + point.seed * 0.22) *
          (isAudioMode ? 0.00004 + reactiveBoost * 0.00002 + audioFlux * 0.00002 + audioHat * 0.00002 : isCameraShape ? 0.00055 + audioFlux * 0.00042 + audioImpact * 0.00034 : 0.0014 + reactiveBoost * 0.0012 + audioFlux * 0.001 + audioSurge * 0.0006);
      const audioLift = reducedMotion
        ? 0
        : Math.cos(time * (isAudioMode ? 0.00082 + audioMid * 0.00016 : isCameraShape ? 0.0002 : 0.00072 + audioMid * 0.00012) + point.seed * 0.26) *
          (isAudioMode ? audioKick * 0.002 + audioSnare * 0.001 + audioWaveform * 0.001 + audioBeatPulse * 0.002 : isCameraShape ? audioBass * 0.005 + audioBeatPulse * 0.003 + audioImpact * 0.004 : audioBass * 0.018 + audioPercussion * 0.007 + audioImpact * 0.008);
      const flowX = reducedMotion
        ? 0
        : Math.sin(time * (isAudioMode ? 0.00018 : isCameraShape ? 0.00016 : 0.00034) + point.audioGroup * 0.18 + point.orbitSeed * 0.22) *
          (isAudioMode ? 0.01 + audioPresence * 0.006 + audioMelody * 0.008 + audioBeatPulse * 0.01 : isCameraShape ? 0.0015 + audioPresence * 0.002 + audioImpact * 0.003 : 0.005 + audioPresence * 0.008 + audioGuitar * 0.012 + audioImpact * 0.01);
      const flowY = reducedMotion
        ? 0
        : Math.cos(time * (isAudioMode ? 0.00016 : isCameraShape ? 0.00014 : 0.00028) + point.seed * 0.12) *
          (isAudioMode ? 0.002 + audioMid * 0.0016 + audioSnare * 0.002 + audioBeatPulse * 0.002 : isCameraShape ? 0.0012 + audioMid * 0.002 + audioImpact * 0.0026 : 0.004 + audioMid * 0.007 + audioPercussion * 0.006 + audioImpact * 0.008);
      const flowZ = reducedMotion
        ? 0
        : Math.sin(time * (isAudioMode ? 0.00014 : isCameraShape ? 0.00012 : 0.00022) + point.seed * 0.1) *
          (isAudioMode ? 0.0016 + audioKick * 0.001 + audioHat * 0.001 + audioFlux * 0.001 : isCameraShape ? 0.002 + audioBass * 0.0034 + audioImpact * 0.003 : 0.01 + audioBass * 0.018 + audioFlux * 0.016 + state.dispersion * 0.008 + audioImpact * 0.012);
      const deformedX = point.x + wobble + flowX + globalDriftX + point.y * globalSway * (isAudioMode ? 0.05 : isAudioPortraitMode ? 0.08 : isRealWorldShape ? 0.09 : 0.14);
      const deformedY = point.y * (1 + globalBreathe * (isAudioMode ? 0.07 : isAudioPortraitMode ? 0.1 : 0.18)) + wobble * 0.3 + audioLift + flowY + globalDriftY;
      const deformedZ = point.z + audioLift * 0.65 + flowZ;
      const depth = perspective / (perspective - deformedZ * sceneScale * 0.6);
      let x = deformedX * sceneScale * depth + state.width / 2;
      let y = deformedY * sceneScale * depth + state.height / 2;

      const size = point.size * depth * (
        isAudioMode
          ? (1.26 + audioLevel * 0.1 + audioBeatPulse * 0.06 + audioImpact * 0.06)
          : isCameraShape
          ? (1.22 + audioLevel * 0.3 + audioBass * 0.16 + audioImpact * 0.12)
          : isRealWorldShape
            ? (1.34 + audioLevel * 0.22 + audioBass * 0.12 + audioImpact * 0.1)
          : isPortraitShape
            ? (1.3 + audioLevel * 0.2 + audioBass * 0.1 + audioImpact * 0.08)
            : (1.28 + audioLevel * 0.18 + audioBass * 0.08 + audioImpact * 0.08)
      );
      const alpha = Math.max(
        0.14,
        Math.min(
          0.92,
          isAudioMode
            ? 0.18 + depth * 0.26 + audioLevel * 0.1 + audioTreble * 0.05 + state.flash * 0.026 + audioBrightness * 0.034 + audioImpact * 0.03
            : isAudioPortraitMode
            ? 0.26 + depth * 0.5 + audioLevel * 0.22 + audioTreble * 0.12 + state.flash * 0.08 + audioImpact * 0.12
            : isCameraShape
            ? 0.24 + depth * 0.44 + audioLevel * 0.22 + audioBass * 0.16 + state.flash * 0.09 + audioImpact * 0.08
            : 0.25 + depth * 0.42 + audioLevel * 0.18 + audioBass * 0.12 + state.flash * 0.06 + audioImpact * 0.05
        )
      );

      if (isAudioPortraitMode) {
        const stippleNoise = (Math.sin(point.seed * 83.17 + x * 0.12 + y * 0.09 + time * 0.0032) + 1) * 0.5;
        const stippleGate = 0.16 + (1 - Math.min(1, alpha)) * 0.24;
        if (stippleNoise < stippleGate) {
          continue;
        }
      }

      if (x < -12 || x > state.width + 12 || y < -12 || y > state.height + 12) {
        continue;
      }

      const drawSize = isAudioMode
        ? Math.max(1.9, size * 1.72)
        : isAudioPortraitMode
          ? Math.max(2.2, size * 1.86)
        : isCameraShape
          ? Math.max(1.34, size * 1.22)
          : Math.max(isPortraitShape ? 1.44 : 1.28, size * (isPortraitShape ? 1.12 : 1.02));

      const ghostShiftX = isCameraShape
        ? 0
        : (Math.sin(time * 0.00018 + point.seed * 0.16 + audioNote * 0.4) * ((isAudioMode ? 0.3 : isAudioPortraitMode ? 0.78 : 0.44) + audioTreble * (isAudioMode ? 0.3 : 0.5) + audioGuitar * (isAudioMode ? 0.34 : 0.7)) + globalDriftX * sceneScale * (isAudioMode ? 0.05 : 0.08));
      const ghostShiftY = isCameraShape
        ? 0
        : (Math.cos(time * 0.00016 + point.seed * 0.18 + audioCentroid * 0.8) * ((isAudioMode ? 0.24 : 0.38) + audioMid * (isAudioMode ? 0.26 : 0.52) + audioPercussion * (isAudioMode ? 0.24 : 0.56)) + globalDriftY * sceneScale * (isAudioMode ? 0.04 : 0.06));

      if (isAudioPortraitMode) {
        const leftRatio = Math.max(0, 0.62 - (x / state.width));
        const dissolve = leftRatio * (0.48 + audioImpact * 0.9 + audioBass * 0.35);
        x -= dissolve * (18 + audioImpact * 34 + audioBass * 24);
        y += Math.sin(time * 0.0016 + point.seed * 4.6) * dissolve * (7 + audioTreble * 12);
      }

      if (!isCameraShape) {
        if (isAudioPortraitMode) {
          context.fillStyle = `rgba(220, 220, 220, ${Math.min(0.56, alpha * 0.44)})`;
          context.beginPath();
          context.arc(
            x - ghostShiftX * 1.1,
            y - ghostShiftY * 1.06,
            Math.max(0.75, drawSize * 0.44),
            0,
            Math.PI * 2
          );
          context.fill();
        } else {
          context.fillStyle = `rgba(17, 17, 17, ${alpha * (isAudioMode ? 0.12 : 0.1)})`;
          context.fillRect(x - ghostShiftX, y - ghostShiftY, Math.max(isAudioMode ? 0.82 : 0.56, drawSize * (isAudioMode ? 0.82 : 0.56)), Math.max(isAudioMode ? 0.82 : 0.56, drawSize * (isAudioMode ? 0.82 : 0.56)));
        }
      }

      if (isAudioPortraitMode) {
        context.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha + 0.16)})`;
        context.beginPath();
        context.arc(x, y, Math.max(0.85, drawSize * 0.5), 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillStyle = `rgba(17, 17, 17, ${alpha})`;
        context.fillRect(x, y, drawSize, drawSize);
      }

      if (!isCameraShape && drawSize > 1.05) {
        if (isAudioPortraitMode) {
          context.fillStyle = `rgba(255, 255, 255, ${Math.min(0.72, alpha * 0.42)})`;
          context.beginPath();
          context.arc(
            x - drawSize * 0.22,
            y - drawSize * 0.2,
            Math.max(0.55, drawSize * 0.2),
            0,
            Math.PI * 2
          );
          context.fill();
        } else {
          context.fillStyle = `rgba(17, 17, 17, ${Math.min(isAudioMode ? 0.18 : 0.18, alpha * (isAudioMode ? 0.16 : 0.14))})`;
          context.fillRect(x - drawSize * 0.24, y - drawSize * 0.24, drawSize * (isAudioMode ? 0.22 : 0.18), drawSize * (isAudioMode ? 0.22 : 0.18));
        }
      }

      const meshStep = isAudioMode
        ? (state.width < 720 ? 18 : 22)
        : isCameraShape
          ? (state.width < 720 ? 12 : 15)
          : (state.width < 720 ? 16 : 20);

      if (projectedPoints.length < (isAudioMode ? 72 : isAudioPortraitMode ? 260 : isCameraShape ? 180 : 120) && Math.floor(point.seed * 1000) % meshStep === 0) {
        projectedPoints.push({
          x,
          y
        });
      }
    }

    drawPointMesh(projectedPoints, audioLevel, audioTreble, audioGuitar, state.flash, shapeName, isAudioMode, isAudioPortraitMode);

    state.animationId = window.requestAnimationFrame(render);
  }

  function handleHeroClick(event) {
    if (event.target.closest("a")) {
      return;
    }

    if (state.camera.active || state.audio.enabled) {
      return;
    }

    morphRandom();
  }

  async function handleAudioReactiveToggle(event) {
    event.stopPropagation();

    if (state.audio.enabled) {
      await stopAudioReactiveMode({ preserveCameraMessage: state.camera.active });
      return;
    }

    await startAudioReactiveMode({ fromCamera: false, silentError: state.camera.active });
  }

  async function handlePortraitCameraToggle(event) {
    event.stopPropagation();

    if (state.camera.active) {
      await stopPortraitCamera();
      return;
    }

    await startPortraitCamera();
  }

  function init() {
    resizeCanvas();
    createPoints();
    applyShapeTargets(getRandomMorphIndex(), false);
    scheduleNextMorph(0);
    render(0);
    updatePortraitUi(false);

    window.addEventListener("resize", handleHeroResize);
    hero.addEventListener("click", handleHeroClick);
    window.addEventListener("beforeunload", cleanupHeroMedia);

    if (audioReactiveToggle) {
      if (!canUseHeroAudio) {
        updateAudioUi("Audio track is unavailable on this page.", true);
      } else {
        updateAudioUi("Click to play the same track as Interactive Work and drive particle morph.");
        audioReactiveToggle.addEventListener("click", handleAudioReactiveToggle);
      }
    }

    if (portraitCameraToggle) {
      if (!canUseCamera) {
        updateAudioUi("Live camera needs HTTPS or localhost in a supported browser.", true);
      } else {
        portraitCameraToggle.addEventListener("click", handlePortraitCameraToggle);
      }
    }
  }

  init();
}

const photoGallery = document.querySelector("[data-photo-gallery]");
const photoLightbox = document.querySelector("[data-photo-lightbox]");

if (photoGallery && photoLightbox) {
  const photoLightboxSurface = photoLightbox.querySelector(".photo-lightbox__surface");
  const photoLightboxImage = photoLightbox.querySelector("[data-photo-lightbox-image]");
  const photoLightboxCaption = photoLightbox.querySelector("[data-photo-lightbox-caption]");
  const photoLightboxClose = photoLightbox.querySelector("[data-photo-lightbox-close]");
  let photoLightboxPrev = photoLightbox.querySelector("[data-photo-lightbox-prev]");
  let photoLightboxNext = photoLightbox.querySelector("[data-photo-lightbox-next]");
  let photoLightboxThumbStrip = photoLightbox.querySelector("[data-photo-lightbox-thumbs]");
  let photoLightboxThumbButtons = [];
  let activePhotoGroup = "";
  const isResearchGallery = photoGallery.classList.contains("photo-gallery--research");
  const isGraphicProjectPage = body.classList.contains("page-graphic-project");
  const isGraphicProjectGallery = isGraphicProjectPage
    && photoGallery.classList.contains("graphic-spreadbook__grid");
  const disableSpotlight = photoGallery.hasAttribute("data-photo-no-spotlight");
  const shouldUseSpotlight = isGraphicProjectGallery && !disableSpotlight;
  const spotlightState = {
    enabled: false,
    expanded: false
  };
  let spotlightMainSlot = null;
  let spotlightThumbSlot = null;
  let spotlightStatement = null;
  let lastPhotoTrigger = null;
  let activePhotoIndex = -1;

  if (photoLightboxSurface) {
    if (!photoLightboxPrev) {
      photoLightboxPrev = document.createElement("button");
      photoLightboxPrev.type = "button";
      photoLightboxPrev.className = "photo-lightbox__nav photo-lightbox__nav--prev";
      photoLightboxPrev.setAttribute("data-photo-lightbox-prev", "");
      photoLightboxPrev.setAttribute("aria-label", "View previous image");
      photoLightboxPrev.textContent = "<";
      photoLightboxSurface.appendChild(photoLightboxPrev);
    }

    if (!photoLightboxNext) {
      photoLightboxNext = document.createElement("button");
      photoLightboxNext.type = "button";
      photoLightboxNext.className = "photo-lightbox__nav photo-lightbox__nav--next";
      photoLightboxNext.setAttribute("data-photo-lightbox-next", "");
      photoLightboxNext.setAttribute("aria-label", "View next image");
      photoLightboxNext.textContent = ">";
      photoLightboxSurface.appendChild(photoLightboxNext);
    }

    if (isGraphicProjectPage && !photoLightboxThumbStrip) {
      photoLightboxThumbStrip = document.createElement("div");
      photoLightboxThumbStrip.className = "photo-lightbox__thumb-strip";
      photoLightboxThumbStrip.setAttribute("data-photo-lightbox-thumbs", "");
      photoLightboxSurface.appendChild(photoLightboxThumbStrip);
    }
  }

  function normalizePhotoGroup(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getTriggerPhotoGroup(trigger) {
    return normalizePhotoGroup(trigger?.dataset.photoGroup);
  }

  function getPhotoTriggers(groupOverride = activePhotoGroup) {
    const triggers = Array.from(photoGallery.querySelectorAll("[data-photo-trigger]"));
    const targetGroup = normalizePhotoGroup(groupOverride);

    if (!targetGroup) {
      return triggers;
    }

    const filtered = triggers.filter((trigger) => getTriggerPhotoGroup(trigger) === targetGroup);

    return filtered.length > 0 ? filtered : triggers;
  }

  function setSpotlightExpanded(expanded) {
    if (!spotlightState.enabled) {
      return;
    }

    spotlightState.expanded = expanded;
    photoGallery.classList.toggle("is-expanded", expanded);
    if (spotlightStatement) {
      spotlightStatement.classList.toggle("is-spotlight-hint", !expanded);
    }
  }

  function updateSpotlightThumbDelays() {
    if (!spotlightThumbSlot) {
      return;
    }

    const thumbnails = Array.from(spotlightThumbSlot.querySelectorAll("[data-photo-trigger]"));
    thumbnails.forEach((thumbnail, thumbIndex) => {
      thumbnail.style.setProperty("--spotlight-delay", `${thumbIndex * 46}ms`);
    });
  }

  function applySpotlightLayoutMetrics(totalTriggers) {
    if (!spotlightState.enabled) {
      return;
    }

    const thumbnailCount = Math.max(1, totalTriggers - 1);
    const columnGuess = Math.ceil(Math.sqrt(thumbnailCount * 1.6));
    const columns = Math.max(2, Math.min(6, columnGuess));
    const rows = Math.max(1, Math.ceil(thumbnailCount / columns));

    photoGallery.style.setProperty("--spotlight-cols", String(columns));
    photoGallery.style.setProperty("--spotlight-rows", String(rows));
  }

  function setSpotlightMain(trigger) {
    if (!spotlightState.enabled || !spotlightMainSlot || !spotlightThumbSlot || !trigger) {
      return;
    }

    const currentMain = spotlightMainSlot.querySelector("[data-photo-trigger]");

    if (currentMain && currentMain !== trigger) {
      currentMain.classList.remove("is-spotlight-main");
      spotlightThumbSlot.appendChild(currentMain);
    }

    if (trigger.parentElement !== spotlightMainSlot) {
      spotlightMainSlot.appendChild(trigger);
    }

    trigger.classList.add("is-spotlight-main");
    updateSpotlightThumbDelays();
  }

  function initGraphicProjectSpotlightGallery() {
    if (!shouldUseSpotlight) {
      return;
    }

    const triggers = getPhotoTriggers();

    if (triggers.length === 0) {
      return;
    }

    photoGallery.classList.add("graphic-spreadbook__grid--spotlight");
    spotlightStatement = photoGallery.querySelector(".graphic-spreadbook__statement");
    spotlightMainSlot = document.createElement("div");
    spotlightMainSlot.className = "graphic-spreadbook__spotlight-main";
    spotlightThumbSlot = document.createElement("div");
    spotlightThumbSlot.className = "graphic-spreadbook__spotlight-thumbs";

    if (spotlightStatement) {
      photoGallery.insertBefore(spotlightMainSlot, spotlightStatement);
      photoGallery.insertBefore(spotlightThumbSlot, spotlightStatement);
    } else {
      photoGallery.append(spotlightMainSlot, spotlightThumbSlot);
    }

    triggers.forEach((trigger) => {
      trigger.classList.remove("is-spotlight-main");
      spotlightThumbSlot.appendChild(trigger);
    });

    spotlightState.enabled = true;
    setSpotlightMain(triggers[0]);
    applySpotlightLayoutMetrics(triggers.length);
    photoGallery.classList.toggle("is-single", triggers.length <= 1);
    setSpotlightExpanded(triggers.length <= 1);

    if (triggers.length > 1) {
      window.requestAnimationFrame(() => {
        setSpotlightExpanded(true);
      });
    }
  }

  function syncPhotoLightboxNav() {
    const hasMultiplePhotos = getPhotoTriggers(activePhotoGroup).length > 1;

    [photoLightboxPrev, photoLightboxNext].forEach((button) => {
      if (!button) {
        return;
      }

      button.hidden = !hasMultiplePhotos;
      button.disabled = !hasMultiplePhotos;
    });
  }

  function getPhotoTriggerSource(trigger) {
    const image = trigger.querySelector("img");
    const fullSrc = trigger.dataset.photoFull || image?.currentSrc || image?.src || "";
    const previewSrc = trigger.dataset.photoThumb || image?.currentSrc || image?.src || fullSrc;
    const title = trigger.dataset.photoTitle || image?.alt || "Graphic frame";

    return {
      image,
      fullSrc,
      previewSrc,
      title
    };
  }

  function syncPhotoLightboxThumbs() {
    if (!photoLightboxThumbStrip) {
      return;
    }

    const hasMultiplePhotos = photoLightboxThumbButtons.length > 1;
    photoLightboxThumbStrip.hidden = !hasMultiplePhotos;

    photoLightboxThumbButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === activePhotoIndex;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-current", isActive ? "true" : "false");
    });

    if (!hasMultiplePhotos || activePhotoIndex < 0 || activePhotoIndex >= photoLightboxThumbButtons.length) {
      return;
    }

    const activeButton = photoLightboxThumbButtons[activePhotoIndex];

    if (!activeButton) {
      return;
    }

    activeButton.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center"
    });
  }

  function buildPhotoLightboxThumbs(groupOverride = activePhotoGroup) {
    if (!photoLightboxThumbStrip) {
      return;
    }

    const triggers = getPhotoTriggers(groupOverride);
    const fragment = document.createDocumentFragment();

    photoLightboxThumbStrip.textContent = "";
    photoLightboxThumbButtons = [];

    triggers.forEach((trigger, triggerIndex) => {
      const source = getPhotoTriggerSource(trigger);

      if (!source.previewSrc) {
        return;
      }

      const thumbButton = document.createElement("button");
      thumbButton.type = "button";
      thumbButton.className = "photo-lightbox__thumb";
      thumbButton.setAttribute("data-photo-lightbox-index", String(triggerIndex));
      thumbButton.setAttribute("aria-label", `View ${source.title}`);

      const thumbImage = document.createElement("img");
      thumbImage.className = "photo-lightbox__thumb-image";
      thumbImage.src = source.previewSrc;
      thumbImage.alt = source.title;
      thumbImage.loading = "lazy";
      thumbButton.appendChild(thumbImage);

      photoLightboxThumbButtons.push(thumbButton);
      fragment.appendChild(thumbButton);
    });

    photoLightboxThumbStrip.appendChild(fragment);
    syncPhotoLightboxThumbs();
  }

  function setPhotoLightboxContent(trigger) {
    if (!trigger) {
      return false;
    }

    const source = getPhotoTriggerSource(trigger);
    const fullSrc = source.fullSrc;

    if (!fullSrc) {
      return false;
    }

    if (photoLightboxImage) {
      photoLightboxImage.src = fullSrc;
      photoLightboxImage.alt = source.image?.alt || source.title || "Expanded photo";
    }

    if (photoLightboxCaption) {
      photoLightboxCaption.textContent = source.title;
    }

    return true;
  }

  function showPhotoByIndex(index, groupOverride = activePhotoGroup) {
    const triggers = getPhotoTriggers(groupOverride);

    if (triggers.length === 0) {
      return;
    }

    const normalizedIndex = ((index % triggers.length) + triggers.length) % triggers.length;
    const trigger = triggers[normalizedIndex];

    if (!setPhotoLightboxContent(trigger)) {
      return;
    }

    activePhotoIndex = normalizedIndex;
    lastPhotoTrigger = trigger;
    activePhotoGroup = getTriggerPhotoGroup(trigger);
    syncPhotoLightboxNav();
    syncPhotoLightboxThumbs();
  }

  function stepPhotoLightbox(direction) {
    if (!photoLightbox.open) {
      return;
    }

    showPhotoByIndex(activePhotoIndex + direction);
  }

  function resetPhotoLightbox() {
    if (photoLightboxImage) {
      photoLightboxImage.removeAttribute("src");
      photoLightboxImage.alt = "";
    }

    if (photoLightboxCaption) {
      photoLightboxCaption.textContent = "";
    }

    activePhotoIndex = -1;
    syncPhotoLightboxThumbs();
  }

  function closePhotoLightbox() {
    if (photoLightbox.open) {
      photoLightbox.close();
    } else {
      body.classList.remove("is-lightbox-open");
      resetPhotoLightbox();
    }
  }

  function loadImageDimensions(source) {
    return new Promise((resolve) => {
      if (!source) {
        resolve({ width: 0, height: 0 });
        return;
      }

      const probe = new Image();

      probe.addEventListener("load", () => {
        resolve({
          width: probe.naturalWidth,
          height: probe.naturalHeight
        });
      }, { once: true });

      probe.addEventListener("error", () => {
        resolve({ width: 0, height: 0 });
      }, { once: true });

      probe.src = source;
    });
  }

  function getPhotoOrientation(width, height) {
    if (!width || !height) {
      return "portrait";
    }

    const ratio = width / height;

    if (ratio > 1.08) {
      return "landscape";
    }

    if (ratio > 0.92) {
      return "square";
    }

    return "portrait";
  }

  async function organizeResearchGallery() {
    if (!isResearchGallery) {
      return;
    }

    const items = Array.from(photoGallery.querySelectorAll(".photo-gallery__item"));

    if (items.length === 0) {
      return;
    }

    const activeChipText = document.querySelector(".photo-archive__chip--active")?.textContent?.trim() || "Photo";
    const labelRoot = activeChipText.replace(/Photos?/i, "Photo").trim() || "Photo";
    const orientationRank = {
      landscape: 0,
      portrait: 1,
      square: 1
    };

    const entries = await Promise.all(items.map(async (item, index) => {
      const image = item.querySelector("img");
      const source = item.dataset.photoFull || image?.currentSrc || image?.src || "";
      const { width, height } = await loadImageDimensions(source);
      const orientation = getPhotoOrientation(width, height);

      return {
        item,
        image,
        index,
        orientation
      };
    }));

    entries.sort((entryA, entryB) => {
      const orientationDifference = orientationRank[entryA.orientation] - orientationRank[entryB.orientation];

      if (orientationDifference !== 0) {
        return orientationDifference;
      }

      return entryA.index - entryB.index;
    });

    const fragment = document.createDocumentFragment();

    entries.forEach((entry, orderedIndex) => {
      const title = `${labelRoot} ${String(orderedIndex + 1).padStart(2, "0")}`;

      entry.item.dataset.photoOrientation = entry.orientation;
      entry.item.dataset.photoTitle = title;

      if (entry.image) {
        entry.image.alt = title;
      }

      fragment.appendChild(entry.item);
    });

    photoGallery.appendChild(fragment);
    photoGallery.dataset.photoOrderReady = "true";
  }

  function createSpherePoints(count) {
    const increment = Math.PI * (3 - Math.sqrt(5));
    const offset = 2 / count;

    return Array.from({ length: count }, (_, index) => {
      const y = index * offset - 1 + offset / 2;
      const radius = Math.sqrt(1 - y * y);
      const angle = index * increment;

      return {
        x: Math.cos(angle) * radius,
        y,
        z: Math.sin(angle) * radius
      };
    });
  }

  // Position thumbnails on a rotating 3D-like ellipsoid for the home page feature.
  function initPhotoSphere() {
    if (!photoGallery.hasAttribute("data-photo-sphere")) {
      return;
    }

    const items = Array.from(photoGallery.querySelectorAll(".photography-feature__item"));
    const sphereCanvas = photoGallery.querySelector("[data-photo-sphere-canvas]");
    const sphereContext = sphereCanvas?.getContext("2d");

    if (items.length === 0) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const points = createSpherePoints(items.length);
    const sizePattern = ["lg", "sm", "md", "xs", "md", "lg", "sm", "xs"];
    const state = {
      width: 0,
      height: 0,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      centerX: 0,
      centerY: 0,
      radiusX: 0,
      radiusY: 0,
      radiusZ: 0,
      rotationY: 0,
      rotationWaveTime: 0,
      pointerX: 0,
      pointerY: 0,
      targetPointerX: 0,
      targetPointerY: 0,
      isItemHovered: false,
      isRightSideHold: false,
      visible: true,
      frame: 0,
      lastTime: 0
    };

    items.forEach((item, index) => {
      if (!item.dataset.sphereLevel) {
        item.dataset.sphereLevel = sizePattern[index % sizePattern.length];
      }
    });

    function updateSphereBounds() {
      const width = photoGallery.clientWidth;
      const height = photoGallery.clientHeight;

      state.width = width;
      state.height = height;
      state.centerX = width * 0.5;
      state.centerY = height * 0.5;

      state.radiusX = width * 0.47;
      state.radiusY = height * 0.26;
      state.radiusZ = width * 0.18;

      if (sphereCanvas && sphereContext) {
        state.dpr = Math.min(window.devicePixelRatio || 1, 2);
        sphereCanvas.width = Math.max(1, Math.round(width * state.dpr));
        sphereCanvas.height = Math.max(1, Math.round(height * state.dpr));
        sphereCanvas.style.width = `${width}px`;
        sphereCanvas.style.height = `${height}px`;
      }
    }

    function drawSphereNetwork(nodes, time) {
      if (!sphereCanvas || !sphereContext) {
        return;
      }

      sphereContext.setTransform(1, 0, 0, 1, 0, 0);
      sphereContext.clearRect(0, 0, sphereCanvas.width, sphereCanvas.height);
      sphereContext.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      sphereContext.clearRect(0, 0, state.width, state.height);

      if (nodes.length === 0) {
        return;
      }

      const pulse = 0.5 + Math.sin(time * 0.0016) * 0.5;
      const centerX = state.centerX + state.pointerX * state.width * 0.016;
      const centerY = state.centerY + state.pointerY * state.height * 0.016;
      const coreRadius = Math.max(8, Math.min(state.width, state.height) * 0.016);

      const coreGlow = sphereContext.createRadialGradient(
        centerX,
        centerY,
        coreRadius * 0.1,
        centerX,
        centerY,
        coreRadius * 6.2
      );
      coreGlow.addColorStop(0, `rgba(0, 0, 0, ${0.18 + pulse * 0.12})`);
      coreGlow.addColorStop(0.36, `rgba(0, 0, 0, ${0.08 + pulse * 0.06})`);
      coreGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      sphereContext.fillStyle = coreGlow;
      sphereContext.beginPath();
      sphereContext.arc(centerX, centerY, coreRadius * 6.2, 0, Math.PI * 2);
      sphereContext.fill();

      nodes.forEach((node, index) => {
        const lineAlpha = 0.08 + node.depth * 0.28;
        const lineWidth = 0.4 + node.depth * 0.94;
        const wave = Math.sin(time * 0.0012 + index * 0.42);
        const controlX = centerX + (node.x - centerX) * 0.52 + wave * state.width * 0.008;
        const controlY = centerY + (node.y - centerY) * 0.48;

        sphereContext.strokeStyle = `rgba(0, 0, 0, ${lineAlpha})`;
        sphereContext.lineWidth = lineWidth;
        sphereContext.beginPath();
        sphereContext.moveTo(centerX, centerY);
        sphereContext.quadraticCurveTo(controlX, controlY, node.x, node.y);
        sphereContext.stroke();

        sphereContext.fillStyle = `rgba(0, 0, 0, ${0.18 + node.depth * 0.42})`;
        sphereContext.beginPath();
        sphereContext.arc(node.x, node.y, 0.5 + node.depth * 1.4, 0, Math.PI * 2);
        sphereContext.fill();
      });

      const ringCount = 3;
      for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
        const ringPulse = Math.sin(time * 0.0014 + ringIndex * 0.7);
        const ringRadius = coreRadius * (1.8 + ringIndex * 0.95) + ringPulse * 0.9;
        sphereContext.strokeStyle = `rgba(0, 0, 0, ${0.24 - ringIndex * 0.05})`;
        sphereContext.lineWidth = 1.2 - ringIndex * 0.2;
        sphereContext.beginPath();
        sphereContext.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        sphereContext.stroke();
      }

      sphereContext.save();
      sphereContext.translate(centerX, centerY);
      sphereContext.rotate(time * 0.00042);
      sphereContext.strokeStyle = `rgba(0, 0, 0, ${0.36 + pulse * 0.2})`;
      sphereContext.lineWidth = 1.04;
      const squareSize = coreRadius * 3.2;
      sphereContext.strokeRect(-squareSize * 0.5, -squareSize * 0.5, squareSize, squareSize);
      sphereContext.rotate(Math.PI / 4);
      sphereContext.strokeRect(-squareSize * 0.42, -squareSize * 0.42, squareSize * 0.84, squareSize * 0.84);
      sphereContext.restore();

      sphereContext.strokeStyle = `rgba(0, 0, 0, ${0.22 + pulse * 0.14})`;
      sphereContext.lineWidth = 0.9;
      sphereContext.beginPath();
      sphereContext.moveTo(centerX - coreRadius * 3.4, centerY);
      sphereContext.lineTo(centerX + coreRadius * 3.4, centerY);
      sphereContext.moveTo(centerX, centerY - coreRadius * 3.4);
      sphereContext.lineTo(centerX, centerY + coreRadius * 3.4);
      sphereContext.stroke();

      sphereContext.fillStyle = `rgba(0, 0, 0, ${0.74 + pulse * 0.16})`;
      sphereContext.beginPath();
      sphereContext.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      sphereContext.fill();

      sphereContext.strokeStyle = `rgba(0, 0, 0, ${0.36 + pulse * 0.22})`;
      sphereContext.lineWidth = 1.8;
      sphereContext.beginPath();
      sphereContext.arc(centerX, centerY, coreRadius * (1.52 + pulse * 0.26), 0, Math.PI * 2);
      sphereContext.stroke();
    }

    function setPointerTargets(event) {
      const rect = photoGallery.getBoundingClientRect();
      const relativeX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const relativeY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

      state.targetPointerX = Math.max(-1, Math.min(1, relativeX));
      state.targetPointerY = Math.max(-1, Math.min(1, relativeY));
      state.isRightSideHold = relativeX > 0.35;
    }

    function setItemHoverState(event) {
      const target = event.target instanceof Element ? event.target : null;
      state.isItemHovered = Boolean(target?.closest("[data-photo-trigger]"));
    }

    function clearItemHoverState(event) {
      const nextTarget = event.relatedTarget instanceof Element ? event.relatedTarget : null;
      state.isItemHovered = Boolean(nextTarget?.closest("[data-photo-trigger]"));
    }

    function resetPointerTargets() {
      state.targetPointerX = 0;
      state.targetPointerY = 0;
      state.isItemHovered = false;
      state.isRightSideHold = false;
    }

    function renderSphere(time) {
      if (!state.visible) {
        state.frame = 0;
        return;
      }

      if (!state.lastTime) {
        state.lastTime = time;
      }

      const delta = Math.min(time - state.lastTime, 48);
      state.lastTime = time;

      if (!state.isItemHovered) {
        const pointerLerp = 1 - Math.exp(-delta * 0.015);
        state.pointerX += (state.targetPointerX - state.pointerX) * pointerLerp;
        state.pointerY += (state.targetPointerY - state.pointerY) * pointerLerp;
      }

      if (!prefersReducedMotion && !body.classList.contains("is-lightbox-open") && !state.isItemHovered) {
        const speedBoost = state.isRightSideHold ? 2.8 : 1;
        state.rotationY += delta * 0.00013 * speedBoost;
        state.rotationWaveTime += delta * speedBoost;
      }

      const rotationX = Math.sin(state.rotationWaveTime * 0.00022) * 0.16 + state.pointerY * -0.18;
      const rotationY = state.rotationY + state.pointerX * 0.34;
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      const projectedNodes = [];

      points.forEach((point, index) => {
        const item = items[index];
        const rotatedX = point.x * cosY - point.z * sinY;
        const rotatedZ = point.x * sinY + point.z * cosY;
        const rotatedY = point.y * cosX - rotatedZ * sinX;
        const finalZ = point.y * sinX + rotatedZ * cosX;
        const depth = (finalZ + 1) / 2;
        const x = rotatedX * state.radiusX;
        const y = rotatedY * state.radiusY;
        const z = finalZ * state.radiusZ;
        const scale = 0.62 + depth * 0.78;
        const opacity = 0.28 + depth * 0.72;
        const blur = Math.max(0, (0.48 - depth) * 2.2);
        const tiltY = rotatedX * -28;
        const tiltX = rotatedY * 18;

        item.style.setProperty("--sphere-x", String(x));
        item.style.setProperty("--sphere-y", String(y));
        item.style.setProperty("--sphere-z", String(z));
        item.style.setProperty("--sphere-scale", String(scale));
        item.style.setProperty("--sphere-opacity", String(opacity));
        item.style.setProperty("--sphere-blur", String(blur));
        item.style.setProperty("--sphere-rotate-y", String(tiltY));
        item.style.setProperty("--sphere-rotate-x", String(tiltX));
        item.style.zIndex = String(10 + Math.round(depth * 100));

        projectedNodes.push({
          x: state.centerX + x,
          y: state.centerY + y,
          depth
        });
      });

      drawSphereNetwork(projectedNodes, time);
      state.frame = window.requestAnimationFrame(renderSphere);
    }

    function queueSphereFrame() {
      if (state.frame || !state.visible) {
        return;
      }

      state.frame = window.requestAnimationFrame(renderSphere);
    }

    function stopSphereFrame() {
      if (!state.frame) {
        return;
      }

      window.cancelAnimationFrame(state.frame);
      state.frame = 0;
    }

    updateSphereBounds();
    photoGallery.addEventListener("pointermove", setPointerTargets);
    photoGallery.addEventListener("pointerover", setItemHoverState);
    photoGallery.addEventListener("pointerout", clearItemHoverState);
    photoGallery.addEventListener("pointerleave", resetPointerTargets);
    window.addEventListener("resize", () => {
      updateSphereBounds();

      if (!state.visible) {
        return;
      }

      drawSphereNetwork([], performance.now());
      queueSphereFrame();
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        state.visible = Boolean(entry?.isIntersecting);

        if (!state.visible) {
          stopSphereFrame();
          return;
        }

        state.lastTime = 0;
        queueSphereFrame();
      }, {
        threshold: 0.08
      });

      observer.observe(photoGallery);
    }

    queueSphereFrame();
  }

  organizeResearchGallery();
  initPhotoSphere();
  initGraphicProjectSpotlightGallery();
    buildPhotoLightboxThumbs();

  photoGallery.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-photo-trigger]");

    if (!trigger) {
      return;
    }

    event.preventDefault();

    if (spotlightState.enabled) {
      if (!spotlightState.expanded && getPhotoTriggers().length > 1) {
        setSpotlightMain(trigger);
        setSpotlightExpanded(true);
      }

      if (!trigger.classList.contains("is-spotlight-main")) {
        setSpotlightMain(trigger);
        return;
      }
    }

    if (typeof photoLightbox.showModal !== "function") {
      const image = trigger.querySelector("img");
      const fullSrc = trigger.dataset.photoFull || image?.currentSrc || image?.src;

      if (!fullSrc) {
        return;
      }

      window.open(fullSrc, "_blank", "noopener");
      return;
    }

    const triggerGroup = getTriggerPhotoGroup(trigger);
    activePhotoGroup = triggerGroup;
    const triggers = getPhotoTriggers(triggerGroup);
    const triggerIndex = triggers.indexOf(trigger);

    if (triggerIndex === -1) {
      return;
    }

    buildPhotoLightboxThumbs(triggerGroup);
    showPhotoByIndex(triggerIndex, triggerGroup);

    photoLightbox.showModal();
    body.classList.add("is-lightbox-open");
  });

  if (photoLightboxClose) {
    photoLightboxClose.addEventListener("click", closePhotoLightbox);
  }

  if (photoLightboxPrev) {
    photoLightboxPrev.addEventListener("click", () => {
      stepPhotoLightbox(-1);
    });
  }

  if (photoLightboxNext) {
    photoLightboxNext.addEventListener("click", () => {
      stepPhotoLightbox(1);
    });
  }

  if (photoLightboxThumbStrip) {
    photoLightboxThumbStrip.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-photo-lightbox-index]");

      if (!trigger) {
        return;
      }

      const targetIndex = Number(trigger.getAttribute("data-photo-lightbox-index"));

      if (!Number.isInteger(targetIndex)) {
        return;
      }

      showPhotoByIndex(targetIndex, activePhotoGroup);
    });
  }

  photoLightbox.addEventListener("click", (event) => {
    if (event.target === photoLightbox) {
      closePhotoLightbox();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (!photoLightbox.open) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepPhotoLightbox(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      stepPhotoLightbox(1);
    }
  });

  photoLightbox.addEventListener("close", () => {
    body.classList.remove("is-lightbox-open");
    resetPhotoLightbox();
    activePhotoGroup = "";
    buildPhotoLightboxThumbs();
    syncPhotoLightboxNav();
    syncPhotoLightboxThumbs();

    if (lastPhotoTrigger) {
      lastPhotoTrigger.focus();
    }
  });

  syncPhotoLightboxNav();
  syncPhotoLightboxThumbs();
}

const horizontalRails = Array.from(document.querySelectorAll("[data-horizontal-rail]"));

horizontalRails.forEach((rail) => {
  function canRailScroll() {
    return rail.scrollWidth > rail.clientWidth + 4;
  }

  rail.addEventListener("wheel", (event) => {
    if (body.classList.contains("is-lightbox-open") || !canRailScroll()) {
      return;
    }

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    rail.scrollLeft += event.deltaY;
    event.preventDefault();
  }, { passive: false });

  rail.addEventListener("keydown", (event) => {
    if (!canRailScroll()) {
      return;
    }

    const step = Math.max(rail.clientWidth * 0.55, 180);

    if (event.key === "ArrowRight") {
      event.preventDefault();
      rail.scrollBy({ left: step, behavior: "smooth" });
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      rail.scrollBy({ left: -step, behavior: "smooth" });
    }
  });
});

if (homeWorkNetwork && homeWorkNetworkCanvas && homeWorkNetworkLinks.length > 0) {
  const context = homeWorkNetworkCanvas.getContext("2d");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const NETWORK_RAINBOW_HUES = [4, 46, 124, 208, 286];

  if (context) {
    const state = {
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0,
      ringRadius: 0,
      ringAxisX: 1,
      ringAxisY: 1,
      labelRadius: 0,
      labelAxisX: 1,
      labelAxisY: 1,
      connectionAxisX: 1,
      connectionAxisY: 1,
      hoveredIndex: -1,
      animationId: 0,
      visible: true,
      isMobile: window.innerWidth < 720,
      groups: [],
      connections: []
    };

    function networkRandomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function networkDegreesToRadians(degrees) {
      return degrees * (Math.PI / 180);
    }

    function networkColor(hue, alpha, saturation = 84, lightness = 56) {
      return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    }

    function mixNetworkHues(hueA, hueB) {
      const hueAX = Math.cos(networkDegreesToRadians(hueA));
      const hueAY = Math.sin(networkDegreesToRadians(hueA));
      const hueBX = Math.cos(networkDegreesToRadians(hueB));
      const hueBY = Math.sin(networkDegreesToRadians(hueB));
      const angle = Math.atan2((hueAY + hueBY) / 2, (hueAX + hueBX) / 2);

      return (angle * 180 / Math.PI + 360) % 360;
    }

    function getIdleMotionBoost() {
      return state.hoveredIndex === -1 ? 2.1 : 0.82;
    }

    function getAnimatedNode(node, time) {
      if (reducedMotionQuery.matches) {
        return {
          x: node.x,
          y: node.y,
          rayX: node.rayX,
          rayY: node.rayY
        };
      }

      const motionBoost = getIdleMotionBoost();
      const angle = node.angle +
        Math.sin(time * node.swaySpeed * motionBoost + node.phase) * node.angleDrift * motionBoost;
      const ringRadius = node.ringRadius +
        Math.sin(time * node.pulseSpeed * motionBoost + node.phase) * node.ringDrift * motionBoost;
      const rayRadius = node.rayRadius +
        Math.sin(time * node.raySpeed * motionBoost + node.phase + 0.8) * node.rayDrift * motionBoost;

      return {
        x: state.centerX + Math.cos(angle) * ringRadius * state.ringAxisX,
        y: state.centerY + Math.sin(angle) * ringRadius * state.ringAxisY,
        rayX: state.centerX + Math.cos(angle) * rayRadius * state.ringAxisX,
        rayY: state.centerY + Math.sin(angle) * rayRadius * state.ringAxisY
      };
    }

    function getAnimatedStem(group, time) {
      if (reducedMotionQuery.matches) {
        return {
          x: group.stemX,
          y: group.stemY
        };
      }

      const motionBoost = getIdleMotionBoost();
      const angle = group.baseAngle +
        Math.sin(time * group.stemAngleSpeed * motionBoost + group.stemPhase) * group.stemAngleDrift * motionBoost;
      const radius = group.stemRadius +
        Math.sin(time * group.stemPulseSpeed * motionBoost + group.stemPhase) * group.stemRadiusDrift * motionBoost;

      return {
        x: state.centerX + Math.cos(angle) * radius * state.labelAxisX,
        y: state.centerY + Math.sin(angle) * radius * state.labelAxisY
      };
    }

    function syncNetworkLinkStates() {
      homeWorkNetworkLinks.forEach((link, index) => {
        link.classList.toggle("is-active", state.hoveredIndex === index);
      });
    }

    function drawNetwork(time = 0) {
      if (!state.groups.length) {
        return;
      }

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, homeWorkNetworkCanvas.width, homeWorkNetworkCanvas.height);
      context.save();
      context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      context.globalCompositeOperation = "multiply";

      const halo = context.createRadialGradient(
        state.centerX,
        state.centerY,
        state.ringRadius * 0.06,
        state.centerX,
        state.centerY,
        Math.max(state.ringRadius * state.ringAxisX, state.ringRadius * state.ringAxisY) * 0.94
      );
      halo.addColorStop(0, "hsla(330, 80%, 72%, 0.08)");
      halo.addColorStop(0.18, "hsla(18, 88%, 70%, 0.06)");
      halo.addColorStop(0.38, "hsla(62, 82%, 68%, 0.05)");
      halo.addColorStop(0.58, "hsla(148, 70%, 62%, 0.04)");
      halo.addColorStop(0.78, "hsla(218, 82%, 66%, 0.035)");
      halo.addColorStop(1, "rgba(255, 255, 255, 0)");

      context.fillStyle = halo;
      context.beginPath();
      context.ellipse(
        state.centerX,
        state.centerY,
        state.ringRadius * state.ringAxisX * 0.86,
        state.ringRadius * state.ringAxisY * 0.86,
        0,
        0,
        Math.PI * 2
      );
      context.fill();

      if (state.hoveredIndex !== -1) {
        const focusedGroup = state.groups[state.hoveredIndex];

        if (focusedGroup) {
          const focusedGlow = context.createRadialGradient(
            focusedGroup.labelX,
            focusedGroup.labelY,
            0,
            focusedGroup.labelX,
            focusedGroup.labelY,
            state.ringRadius * 0.26
          );
          focusedGlow.addColorStop(0, networkColor(focusedGroup.hue, 0.18, 88, 60));
          focusedGlow.addColorStop(0.46, networkColor(focusedGroup.hue, 0.07, 84, 62));
          focusedGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
          context.fillStyle = focusedGlow;
          context.beginPath();
          context.arc(focusedGroup.labelX, focusedGroup.labelY, state.ringRadius * 0.24, 0, Math.PI * 2);
          context.fill();
        }
      }

      context.lineCap = "round";
      context.lineJoin = "round";

      state.connections.forEach((connection) => {
        const isHighlighted =
          state.hoveredIndex !== -1 &&
          (connection.groupA === state.hoveredIndex || connection.groupB === state.hoveredIndex);
        const isDimmed = state.hoveredIndex !== -1 && !isHighlighted;
        const idleBoost = state.hoveredIndex === -1 ? 1.9 : 1;
        const hoveredHue = state.hoveredIndex !== -1 ? state.groups[state.hoveredIndex]?.hue : null;
        const connectionHue = isHighlighted && hoveredHue !== null ? hoveredHue : connection.hue;
        const start = getAnimatedNode(connection.start, time);
        const end = getAnimatedNode(connection.end, time);
        const animatedAngle = connection.controlAngle +
          (reducedMotionQuery.matches
            ? 0
            : time * connection.spinSpeed * idleBoost +
              Math.sin(time * connection.swingSpeed * idleBoost + connection.phase) * connection.angleDrift * idleBoost);
        const animatedRadius = connection.controlRadius +
          (reducedMotionQuery.matches
            ? 0
            : Math.sin(time * connection.pulseSpeed * idleBoost + connection.phase) * connection.amplitude * idleBoost);
        const controlX = state.centerX + Math.cos(animatedAngle) * animatedRadius * state.connectionAxisX;
        const controlY = state.centerY + Math.sin(animatedAngle) * animatedRadius * state.connectionAxisY;
        const alpha = isHighlighted
          ? 0.52
          : isDimmed
            ? 0.012
            : 0.12 + (reducedMotionQuery.matches ? 0 : (Math.sin(time * connection.alphaSpeed * idleBoost + connection.phase) + 1) * 0.05);

        if (isHighlighted) {
          context.strokeStyle = networkColor(connectionHue, 0.18, 96, 64);
          context.lineWidth = connection.lineWidth * 3.8;
          context.beginPath();
          context.moveTo(start.x, start.y);
          context.quadraticCurveTo(controlX, controlY, end.x, end.y);
          context.stroke();
        }

        context.strokeStyle = networkColor(connectionHue, alpha, isDimmed ? 50 : 86, isHighlighted ? 50 : 56);
        context.lineWidth = connection.lineWidth * (isHighlighted ? 2.15 : isDimmed ? 0.52 : idleBoost * 0.84);
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.quadraticCurveTo(controlX, controlY, end.x, end.y);
        context.stroke();
      });

      state.groups.forEach((group, index) => {
        const isFocused = state.hoveredIndex === index;
        const isMuted = state.hoveredIndex !== -1 && !isFocused;
        const isIdle = state.hoveredIndex === -1;
        const stem = getAnimatedStem(group, time);

        group.nodes.forEach((node) => {
          const animatedNode = getAnimatedNode(node, time);

          if (isFocused) {
            context.strokeStyle = networkColor(group.hue, 0.18, 96, 66);
            context.lineWidth = 3.2;
            context.beginPath();
            context.moveTo(animatedNode.x, animatedNode.y);
            context.lineTo(animatedNode.rayX, animatedNode.rayY);
            context.stroke();
          }

          context.strokeStyle = networkColor(group.hue, isFocused ? 0.52 : isMuted ? 0.045 : isIdle ? 0.24 : 0.15, isMuted ? 42 : 84, isFocused ? 48 : 56);
          context.lineWidth = isFocused ? 1.72 : isMuted ? 0.68 : isIdle ? 1.22 : 0.84;
          context.beginPath();
          context.moveTo(animatedNode.x, animatedNode.y);
          context.lineTo(animatedNode.rayX, animatedNode.rayY);
          context.stroke();
        });

        if (isFocused) {
          context.strokeStyle = networkColor(group.hue, 0.22, 96, 64);
          context.lineWidth = 4.2;
          context.beginPath();
          context.moveTo(stem.x, stem.y);
          context.lineTo(group.labelX, group.labelY);
          context.stroke();
        }

        context.strokeStyle = networkColor(group.hue, isFocused ? 0.7 : isMuted ? 0.08 : isIdle ? 0.34 : 0.22, isMuted ? 46 : 88, isFocused ? 46 : 56);
        context.lineWidth = isFocused ? 2.6 : isIdle ? 1.6 : 1.06;
        context.beginPath();
        context.moveTo(stem.x, stem.y);
        context.lineTo(group.labelX, group.labelY);
        context.stroke();
      });

      context.restore();
    }

    function positionNetworkLinks() {
      homeWorkNetworkLinks.forEach((link, index) => {
        const group = state.groups[index];

        if (!group) {
          return;
        }

        let rotation = 0;

        if (!state.isMobile) {
          rotation = group.baseAngleDegrees + 90;

          if (rotation > 90 && rotation < 270) {
            rotation += 180;
          }
        }

        link.style.setProperty("--network-link-x", `${group.labelX.toFixed(2)}px`);
        link.style.setProperty("--network-link-y", `${group.labelY.toFixed(2)}px`);
        link.style.setProperty("--network-link-rotate", `${rotation.toFixed(2)}deg`);
        link.style.setProperty("--network-hue", String(group.hue));
      });
    }

    function buildNetwork() {
      const rect = homeWorkNetwork.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);

      state.width = rect.width;
      state.height = rect.height;
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.centerX = state.width / 2;
      state.centerY = state.height / 2;
      state.isMobile = window.innerWidth < 720;
      state.ringRadius = size * (state.isMobile ? 0.312 : 0.34);
      state.ringAxisX = state.isMobile ? 1.34 : 1.58;
      state.ringAxisY = state.isMobile ? 0.84 : 0.68;
      state.labelRadius = state.ringRadius + size * (state.isMobile ? 0.12 : 0.14);
      state.labelAxisX = state.ringAxisX * (state.isMobile ? 1.06 : 1.1);
      state.labelAxisY = state.ringAxisY * (state.isMobile ? 0.96 : 0.94);
      state.connectionAxisX = (state.ringAxisX + state.labelAxisX) / 2;
      state.connectionAxisY = (state.ringAxisY + state.labelAxisY) / 2;

      homeWorkNetworkCanvas.width = Math.max(1, Math.round(state.width * state.dpr));
      homeWorkNetworkCanvas.height = Math.max(1, Math.round(state.height * state.dpr));

      const spread = networkDegreesToRadians(state.isMobile ? 24 : 30);
      const nodeCount = state.isMobile ? 16 : size > 920 ? 28 : 24;

      state.groups = homeWorkNetworkLinks.map((link, groupIndex) => {
        const baseAngleDegrees = Number(link.dataset.networkAngle || 0);
        const baseAngle = networkDegreesToRadians(baseAngleDegrees);
        const hue = NETWORK_RAINBOW_HUES[groupIndex % NETWORK_RAINBOW_HUES.length];
        const nodes = Array.from({ length: nodeCount }, (_, nodeIndex) => {
          const ratio = nodeCount === 1 ? 0.5 : nodeIndex / (nodeCount - 1);
          const normalized = ratio - 0.5;
          const angle = baseAngle + normalized * spread + networkRandomBetween(-0.014, 0.014);
          const ringRadius = state.ringRadius + networkRandomBetween(-state.ringRadius * 0.03, state.ringRadius * 0.02);
          const rayRadius = state.ringRadius + networkRandomBetween(
            size * (state.isMobile ? 0.05 : 0.038),
            size * (state.isMobile ? 0.14 : 0.09)
          );

          return {
            angle,
            ringRadius,
            rayRadius,
            x: state.centerX + Math.cos(angle) * ringRadius * state.ringAxisX,
            y: state.centerY + Math.sin(angle) * ringRadius * state.ringAxisY,
            rayX: state.centerX + Math.cos(angle) * rayRadius * state.ringAxisX,
            rayY: state.centerY + Math.sin(angle) * rayRadius * state.ringAxisY,
            ringDrift: networkRandomBetween(state.isMobile ? 2 : 3, state.isMobile ? 6 : 12),
            rayDrift: networkRandomBetween(state.isMobile ? 5 : 8, state.isMobile ? 15 : 28),
            angleDrift: networkRandomBetween(0.006, 0.022),
            phase: networkRandomBetween(0, Math.PI * 2),
            swaySpeed: networkRandomBetween(0.00018, 0.00042),
            pulseSpeed: networkRandomBetween(0.0004, 0.0009),
            raySpeed: networkRandomBetween(0.00048, 0.0011)
          };
        });

        const labelX = state.centerX + Math.cos(baseAngle) * state.labelRadius * state.labelAxisX;
        const labelY = state.centerY + Math.sin(baseAngle) * state.labelRadius * state.labelAxisY;
        const stemRadius = state.labelRadius - size * (state.isMobile ? 0.05 : 0.055);

        return {
          baseAngle,
          baseAngleDegrees,
          hue,
          labelX,
          labelY,
          stemRadius,
          stemX: state.centerX + Math.cos(baseAngle) * stemRadius * state.labelAxisX,
          stemY: state.centerY + Math.sin(baseAngle) * stemRadius * state.labelAxisY,
          stemPhase: networkRandomBetween(0, Math.PI * 2),
          stemRadiusDrift: networkRandomBetween(state.isMobile ? 2 : 4, state.isMobile ? 6 : 12),
          stemAngleDrift: networkRandomBetween(0.01, 0.032),
          stemPulseSpeed: networkRandomBetween(0.00026, 0.00052),
          stemAngleSpeed: networkRandomBetween(0.00014, 0.00028),
          nodes
        };
      });

      const connections = [];

      for (let sourceIndex = 0; sourceIndex < state.groups.length; sourceIndex += 1) {
        for (let targetIndex = sourceIndex + 1; targetIndex < state.groups.length; targetIndex += 1) {
          const sourceGroup = state.groups[sourceIndex];
          const targetGroup = state.groups[targetIndex];
          const connectionCount = state.isMobile ? 22 : 34;

          for (let connectionIndex = 0; connectionIndex < connectionCount; connectionIndex += 1) {
            const start = sourceGroup.nodes[Math.floor(Math.random() * sourceGroup.nodes.length)];
            const end = targetGroup.nodes[Math.floor(Math.random() * targetGroup.nodes.length)];

            connections.push({
              groupA: sourceIndex,
              groupB: targetIndex,
              start,
              end,
              controlAngle: networkRandomBetween(0, Math.PI * 2),
              controlRadius: networkRandomBetween(state.ringRadius * 0.05, state.ringRadius * 0.22),
              amplitude: networkRandomBetween(
                size * (state.isMobile ? 0.01 : 0.008),
                size * (state.isMobile ? 0.03 : 0.02)
              ),
              hue: mixNetworkHues(sourceGroup.hue, targetGroup.hue),
              phase: networkRandomBetween(0, Math.PI * 2),
              lineWidth: networkRandomBetween(0.54, 1.28),
              swingSpeed: networkRandomBetween(0.00018, 0.00042),
              pulseSpeed: networkRandomBetween(0.00036, 0.00076),
              alphaSpeed: networkRandomBetween(0.00032, 0.00086),
              spinSpeed: networkRandomBetween(-0.00005, 0.00005),
              angleDrift: networkRandomBetween(0.08, 0.28)
            });
          }
        }
      }

      state.connections = connections;
      positionNetworkLinks();
    }

    function stopNetworkAnimation() {
      if (!state.animationId) {
        return;
      }

      window.cancelAnimationFrame(state.animationId);
      state.animationId = 0;
    }

    function queueNetworkAnimation() {
      if (state.animationId || reducedMotionQuery.matches || !state.visible) {
        return;
      }

      state.animationId = window.requestAnimationFrame(renderNetwork);
    }

    function renderNetwork(time) {
      state.animationId = 0;
      drawNetwork(time);

      if (!reducedMotionQuery.matches && state.visible) {
        queueNetworkAnimation();
      }
    }

    function refreshNetworkLayout() {
      buildNetwork();
      drawNetwork(performance.now());
      queueNetworkAnimation();
    }

    function setHoveredNetworkIndex(index) {
      if (state.hoveredIndex === index) {
        return;
      }

      state.hoveredIndex = index;
      syncNetworkLinkStates();
      drawNetwork(performance.now());
      queueNetworkAnimation();
    }

    function resetHoveredNetworkIndex() {
      if (state.hoveredIndex === -1) {
        return;
      }

      state.hoveredIndex = -1;
      syncNetworkLinkStates();
      drawNetwork(performance.now());
    }

    homeWorkNetworkLinks.forEach((link, index) => {
      link.addEventListener("pointerenter", () => {
        setHoveredNetworkIndex(index);
      });

      link.addEventListener("focus", () => {
        setHoveredNetworkIndex(index);
      });

      link.addEventListener("pointerleave", resetHoveredNetworkIndex);
      link.addEventListener("blur", resetHoveredNetworkIndex);
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        const entry = entries[0];

        state.visible = Boolean(entry?.isIntersecting);

        if (state.visible) {
          drawNetwork(performance.now());
          queueNetworkAnimation();
          return;
        }

        stopNetworkAnimation();
      }, {
        threshold: 0.08
      });

      observer.observe(homeWorkNetwork);
    }

    reducedMotionQuery.addEventListener("change", () => {
      if (reducedMotionQuery.matches) {
        stopNetworkAnimation();
      }

      drawNetwork(performance.now());
      queueNetworkAnimation();
    });

    window.addEventListener("resize", refreshNetworkLayout);
    refreshNetworkLayout();
  }
}

const homeWorkShowcaseTopics = document.querySelector("[data-home-work-showcase]");

if (homeWorkShowcaseTopics) {
  const showcaseSection = homeWorkShowcaseTopics.closest(".home-work-showcase");
  const showcaseCanvas = showcaseSection?.querySelector("[data-home-work-showcase-canvas]");
  const showcaseContext = showcaseCanvas?.getContext("2d");
  const showcaseTitleLink = showcaseSection?.querySelector(".home-work-showcase__title-link");
  const isLightShowcase = Boolean(showcaseSection?.classList.contains("home-work-showcase--light"));
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const topicLinks = Array.from(homeWorkShowcaseTopics.querySelectorAll("[data-home-work-topic]"));
  const defaultTopicIndex = Math.max(0, topicLinks.findIndex((topic) => topic.classList.contains("is-active")));
  const initialShowcaseHue = Number(topicLinks[defaultTopicIndex]?.dataset.topicHue) || 214;
  const lineState = {
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    width: 0,
    height: 0,
    anchors: [],
    flowOrigin: { x: 0, y: 0 },
    wordAnchorCount: 0,
    hoveredWordIndex: -1,
    focusProgress: 0,
    focusTarget: 0,
    lines: [],
    fiberLines: [],
    meshClusters: [],
    targetHue: initialShowcaseHue,
    currentHue: initialShowcaseHue,
    frame: 0,
    visible: true,
    pointerX: 0,
    pointerY: 0,
    pointerDrawX: 0,
    pointerDrawY: 0,
    pointerInside: false,
    pointerLinkProgress: 0,
    titleHover: false,
    titleLinkProgress: 0
  };

  function showcaseRandomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function clampShowcaseCoordinate(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clampShowcasePoint(x, y, margin = 20) {
    const xSafe = clampShowcaseCoordinate(x, margin, lineState.width - margin);
    const ySafe = clampShowcaseCoordinate(y, margin, lineState.height - margin);

    return { x: xSafe, y: ySafe };
  }

  function showcaseHueColor(alpha, saturation = 88, lightness = 72, hueOffset = 0) {
    const safeAlpha = clampShowcaseCoordinate(alpha, 0, 1);
    const useTopicHue = !isLightShowcase || lineState.hoveredWordIndex >= 0 || lineState.focusTarget > 0;

    if (!useTopicHue) {
      return `rgba(5, 5, 5, ${safeAlpha})`;
    }

    const hue = (lineState.currentHue + hueOffset + 360) % 360;
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${safeAlpha})`;
  }

  function getShowcaseTopicAnchors(sectionRect) {
    const topicCount = Math.max(1, topicLinks.length);
    const edgeMarginX = clampShowcaseCoordinate(lineState.width * 0.022, 18, 34);
    const edgeMarginY = clampShowcaseCoordinate(lineState.height * 0.04, 18, 32);

    return topicLinks
      .map((topic, index) => {
        const label = topic.querySelector(".home-work-showcase__label");
        const measuredNode = label || topic;
        const topicRect = measuredNode.getBoundingClientRect();

        if (!topicRect.width || !topicRect.height) {
          return null;
        }

        const anchorX = clampShowcaseCoordinate(topicRect.right - sectionRect.left + 8, edgeMarginX, lineState.width - edgeMarginX);
        const anchorY = clampShowcaseCoordinate(topicRect.top - sectionRect.top + topicRect.height * 0.56, edgeMarginY, lineState.height - edgeMarginY);

        return {
          x: anchorX,
          y: anchorY,
          hueShift: (index * 360) / topicCount
        };
      })
      .filter((anchor) => anchor !== null);
  }

  function getShowcaseTopicFocusPoint(topicIndex, xRatio = 0.52) {
    if (!showcaseSection) {
      return null;
    }

    const topic = topicLinks[topicIndex];

    if (!topic) {
      return null;
    }

    const label = topic.querySelector(".home-work-showcase__label");
    const measuredNode = label || topic;
    const topicRect = measuredNode.getBoundingClientRect();
    const sectionRect = showcaseSection.getBoundingClientRect();

    if (!topicRect.width || !topicRect.height || !sectionRect.width || !sectionRect.height) {
      return null;
    }

    return clampShowcasePoint(
      topicRect.left - sectionRect.left + topicRect.width * xRatio,
      topicRect.top - sectionRect.top + topicRect.height * 0.56,
      2
    );
  }

  function getShowcaseTitleFocusPoint() {
    if (!showcaseSection || !showcaseTitleLink) {
      return null;
    }

    const titleRect = showcaseTitleLink.getBoundingClientRect();
    const sectionRect = showcaseSection.getBoundingClientRect();

    if (!titleRect.width || !titleRect.height || !sectionRect.width || !sectionRect.height) {
      return null;
    }

    return clampShowcasePoint(
      titleRect.left - sectionRect.left + titleRect.width * 0.56,
      titleRect.top - sectionRect.top + titleRect.height * 0.54,
      2
    );
  }

  function buildShowcaseLines() {
    if (!showcaseSection || !showcaseCanvas || !showcaseContext) {
      return;
    }

    const rect = showcaseSection.getBoundingClientRect();

    lineState.width = Math.max(1, Math.round(rect.width));
    lineState.height = Math.max(1, Math.round(rect.height));
    lineState.dpr = Math.min(window.devicePixelRatio || 1, 2);
    showcaseCanvas.width = Math.max(1, Math.round(lineState.width * lineState.dpr));
    showcaseCanvas.height = Math.max(1, Math.round(lineState.height * lineState.dpr));
    showcaseCanvas.style.width = `${lineState.width}px`;
    showcaseCanvas.style.height = `${lineState.height}px`;

    const isMobile = window.innerWidth < 720;
    const fallbackCenterX = lineState.width / 2;
    const fallbackCenterY = lineState.height / 2;
    const fallbackRadiusX = lineState.width * (isMobile ? 0.38 : 0.34);
    const fallbackRadiusY = lineState.height * (isMobile ? 0.24 : 0.2);
    const fallbackAnchors = [
      { x: fallbackCenterX - fallbackRadiusX, y: fallbackCenterY - fallbackRadiusY * 0.6, hueShift: 0 },
      { x: fallbackCenterX - fallbackRadiusX * 0.56, y: fallbackCenterY + fallbackRadiusY * 0.9, hueShift: 72 },
      { x: fallbackCenterX, y: fallbackCenterY - fallbackRadiusY * 0.1, hueShift: 144 },
      { x: fallbackCenterX + fallbackRadiusX * 0.56, y: fallbackCenterY + fallbackRadiusY * 0.9, hueShift: 216 },
      { x: fallbackCenterX + fallbackRadiusX, y: fallbackCenterY - fallbackRadiusY * 0.6, hueShift: 288 }
    ];
    const wordAnchors = getShowcaseTopicAnchors(rect);
    const baseWordAnchors = wordAnchors.length >= 3 ? wordAnchors : fallbackAnchors;
    const wordAnchorCount = baseWordAnchors.length;

    lineState.flowOrigin = clampShowcasePoint(
      lineState.width * (isMobile ? 0.58 : 0.52),
      lineState.height * (isMobile ? 0.54 : 0.52),
      isMobile ? 18 : 24
    );

    if (!lineState.pointerInside) {
      lineState.pointerX = lineState.flowOrigin.x;
      lineState.pointerY = lineState.flowOrigin.y;
      lineState.pointerDrawX = lineState.flowOrigin.x;
      lineState.pointerDrawY = lineState.flowOrigin.y;
    }

    const rightAnchorBaseX = lineState.width * (isMobile ? 0.82 : 0.86);
    const rightAnchorWaveX = lineState.width * (isMobile ? 0.09 : 0.12);
    const rightAnchorWaveY = lineState.height * (isMobile ? 0.22 : 0.26);
    const rightAnchors = baseWordAnchors.map((anchor, index) => {
      const progress = wordAnchorCount === 1 ? 0.5 : index / (wordAnchorCount - 1);
      const spread = progress - 0.5;
      const liftedX = rightAnchorBaseX + Math.cos(progress * Math.PI * 1.18) * rightAnchorWaveX;
      const minimumX = anchor.x + lineState.width * (isMobile ? 0.2 : 0.24);
      const safePoint = clampShowcasePoint(
        Math.max(minimumX, liftedX),
        lineState.flowOrigin.y + spread * rightAnchorWaveY + Math.sin(progress * Math.PI * 2) * lineState.height * 0.045,
        isMobile ? 10 : 12
      );

      return {
        x: safePoint.x,
        y: safePoint.y,
        hueShift: anchor.hueShift + 24
      };
    });

    const terminalAnchors = baseWordAnchors.map((anchor, index) => {
      const progress = wordAnchorCount === 1 ? 0.5 : index / (wordAnchorCount - 1);
      const spread = progress - 0.5;
      const safePoint = clampShowcasePoint(
        lineState.width - (isMobile ? 2 : 3),
        rightAnchors[index].y
          + spread * lineState.height * (isMobile ? 0.22 : 0.28)
          + Math.sin(index * 1.3) * lineState.height * 0.02,
        isMobile ? 2 : 3
      );

      return {
        x: safePoint.x,
        y: safePoint.y,
        hueShift: anchor.hueShift + 40
      };
    });

    const anchorDefinitions = [...baseWordAnchors, ...rightAnchors, ...terminalAnchors];
    lineState.anchors = anchorDefinitions;
    lineState.wordAnchorCount = wordAnchorCount;

    const builtLines = [];
    const skeletonPerWord = isMobile ? 5 : 7;
    const terminalStart = wordAnchorCount * 2;

    for (let wordIndex = 0; wordIndex < wordAnchorCount; wordIndex += 1) {
      const rightMatchIndex = wordIndex + wordAnchorCount;
      const terminalMatchIndex = terminalStart + wordIndex;
      const nextRightIndex = ((wordIndex + 1) % wordAnchorCount) + wordAnchorCount;
      const nextTerminalIndex = terminalStart + ((wordIndex + 1) % wordAnchorCount);
      const crossTerminalIndex = terminalStart + ((wordIndex + 2) % wordAnchorCount);
      const targetPool = [rightMatchIndex, terminalMatchIndex, nextRightIndex, nextTerminalIndex, crossTerminalIndex];

      for (let lineIndex = 0; lineIndex < skeletonPerWord; lineIndex += 1) {
        const targetIndex = targetPool[lineIndex % targetPool.length];

        builtLines.push({
          sourceIndex: wordIndex,
          targetIndex,
          sourceJitterX: showcaseRandomBetween(-lineState.width * 0.004, lineState.width * 0.004),
          sourceJitterY: showcaseRandomBetween(-lineState.height * 0.014, lineState.height * 0.014),
          targetJitterX: showcaseRandomBetween(-lineState.width * 0.016, lineState.width * 0.016),
          targetJitterY: showcaseRandomBetween(-lineState.height * 0.042, lineState.height * 0.042),
          pinchOffsetX: showcaseRandomBetween(-lineState.width * 0.05, lineState.width * 0.18),
          pinchOffsetY: showcaseRandomBetween(-lineState.height * 0.22, lineState.height * 0.22),
          width: showcaseRandomBetween(0.7, isMobile ? 1.2 : 1.44),
          alpha: showcaseRandomBetween(0.12, 0.26),
          glowAlpha: showcaseRandomBetween(0.04, 0.1),
          sway: showcaseRandomBetween(isMobile ? 6 : 9, isMobile ? 16 : 24),
          speed: showcaseRandomBetween(0.42, 1.2),
          phase: showcaseRandomBetween(0, Math.PI * 2),
          bend: showcaseRandomBetween(-1, 1),
          tension: showcaseRandomBetween(0.32, 0.58)
        });
      }
    }

    const builtFiberLines = [];
    const fibersPerWord = isMobile ? 34 : 78;

    for (let wordIndex = 0; wordIndex < wordAnchorCount; wordIndex += 1) {
      const rightMatchIndex = wordIndex + wordAnchorCount;
      const terminalMatchIndex = terminalStart + wordIndex;
      const nextTerminalIndex = terminalStart + ((wordIndex + 1) % wordAnchorCount);
      const crossTerminalIndex = terminalStart + ((wordIndex + 2) % wordAnchorCount);

      for (let fiberIndex = 0; fiberIndex < fibersPerWord; fiberIndex += 1) {
        const randomPicker = Math.random();
        let targetIndex = rightMatchIndex;

        if (randomPicker > 0.52 && randomPicker <= 0.84) {
          targetIndex = terminalMatchIndex;
        } else if (randomPicker > 0.84 && randomPicker <= 0.94) {
          targetIndex = nextTerminalIndex;
        } else if (randomPicker > 0.94) {
          targetIndex = crossTerminalIndex;
        }

        builtFiberLines.push({
          sourceIndex: wordIndex,
          targetIndex,
          sourceJitterX: showcaseRandomBetween(-lineState.width * 0.0048, lineState.width * 0.0048),
          sourceJitterY: showcaseRandomBetween(-lineState.height * 0.018, lineState.height * 0.018),
          targetJitterX: showcaseRandomBetween(-lineState.width * 0.021, lineState.width * 0.021),
          targetJitterY: showcaseRandomBetween(-lineState.height * 0.064, lineState.height * 0.064),
          flowShiftX: showcaseRandomBetween(-lineState.width * 0.04, lineState.width * 0.26),
          flowShiftY: showcaseRandomBetween(-lineState.height * 0.3, lineState.height * 0.3),
          width: showcaseRandomBetween(0.3, isMobile ? 0.96 : 1.12),
          alpha: showcaseRandomBetween(0.16, 0.48),
          glowAlpha: showcaseRandomBetween(0.06, 0.14),
          sway: showcaseRandomBetween(isMobile ? 8 : 10, isMobile ? 18 : 30),
          speed: showcaseRandomBetween(0.5, 1.65),
          phase: showcaseRandomBetween(0, Math.PI * 2),
          bend: showcaseRandomBetween(-1, 1),
          tension: showcaseRandomBetween(0.36, 0.64),
          retract: showcaseRandomBetween(0.34, 0.58)
        });
      }
    }

    const clusterSeeds = [
      {
        x: lineState.flowOrigin.x + lineState.width * (isMobile ? 0.08 : 0.12),
        y: lineState.flowOrigin.y - lineState.height * (isMobile ? 0.22 : 0.24),
        radiusX: lineState.width * (isMobile ? 0.11 : 0.13),
        radiusY: lineState.height * (isMobile ? 0.17 : 0.2),
        count: isMobile ? 11 : 17,
        linkDistance: lineState.width * (isMobile ? 0.085 : 0.1)
      },
      {
        x: lineState.flowOrigin.x + lineState.width * (isMobile ? 0.14 : 0.2),
        y: lineState.flowOrigin.y + lineState.height * (isMobile ? 0.08 : 0.12),
        radiusX: lineState.width * (isMobile ? 0.12 : 0.15),
        radiusY: lineState.height * (isMobile ? 0.18 : 0.22),
        count: isMobile ? 12 : 18,
        linkDistance: lineState.width * (isMobile ? 0.09 : 0.11)
      },
      {
        x: lineState.width * (isMobile ? 0.93 : 0.95),
        y: lineState.height * (isMobile ? 0.3 : 0.26),
        radiusX: lineState.width * (isMobile ? 0.06 : 0.08),
        radiusY: lineState.height * (isMobile ? 0.12 : 0.16),
        count: isMobile ? 10 : 16,
        linkDistance: lineState.width * (isMobile ? 0.072 : 0.09)
      },
      {
        x: lineState.width * (isMobile ? 0.93 : 0.95),
        y: lineState.height * (isMobile ? 0.72 : 0.76),
        radiusX: lineState.width * (isMobile ? 0.06 : 0.08),
        radiusY: lineState.height * (isMobile ? 0.12 : 0.16),
        count: isMobile ? 10 : 16,
        linkDistance: lineState.width * (isMobile ? 0.072 : 0.09)
      }
    ];

    const meshClusters = clusterSeeds.map((seed) => {
      const points = [];

      for (let pointIndex = 0; pointIndex < seed.count; pointIndex += 1) {
        const angle = showcaseRandomBetween(0, Math.PI * 2);
        const radialX = seed.radiusX * showcaseRandomBetween(0.22, 1);
        const radialY = seed.radiusY * showcaseRandomBetween(0.22, 1);
        const point = clampShowcasePoint(
          seed.x + Math.cos(angle) * radialX,
          seed.y + Math.sin(angle) * radialY,
          2
        );

        points.push({
          x: point.x,
          y: point.y,
          wobbleX: showcaseRandomBetween(0.8, isMobile ? 2.4 : 3.2),
          wobbleY: showcaseRandomBetween(0.8, isMobile ? 2.8 : 3.8),
          speed: showcaseRandomBetween(0.3, 1.12),
          phase: showcaseRandomBetween(0, Math.PI * 2)
        });
      }

      return {
        points,
        linkDistance: seed.linkDistance,
        lineAlpha: showcaseRandomBetween(0.13, 0.24),
        lineWidth: showcaseRandomBetween(0.58, 1.04),
        spokeStride: isMobile ? 4 : 3
      };
    });

    lineState.lines = builtLines;
    lineState.fiberLines = builtFiberLines;
    lineState.meshClusters = meshClusters;
  }

  function drawShowcaseLines(time = 0) {
    if (!showcaseContext || !showcaseCanvas || !showcaseSection) {
      return;
    }

    lineState.currentHue += (lineState.targetHue - lineState.currentHue) * 0.12;

    showcaseContext.setTransform(1, 0, 0, 1, 0, 0);
    showcaseContext.clearRect(0, 0, showcaseCanvas.width, showcaseCanvas.height);
    showcaseContext.setTransform(lineState.dpr, 0, 0, lineState.dpr, 0, 0);

    const isReducedMotion = reducedMotionQuery.matches;
    const drift = isReducedMotion ? 0 : time * 0.00052;
    const focusLerp = isReducedMotion ? 1 : 0.12;
    lineState.focusProgress += (lineState.focusTarget - lineState.focusProgress) * focusLerp;
    if (Math.abs(lineState.focusTarget - lineState.focusProgress) < 0.002) {
      lineState.focusProgress = lineState.focusTarget;
    }
    const pointerTarget = lineState.pointerInside && lineState.hoveredWordIndex >= 0 ? 1 : 0;
    lineState.pointerLinkProgress += (pointerTarget - lineState.pointerLinkProgress) * (isReducedMotion ? 1 : 0.16);
    if (Math.abs(pointerTarget - lineState.pointerLinkProgress) < 0.002) {
      lineState.pointerLinkProgress = pointerTarget;
    }
    const titlePointerTarget = lineState.titleHover ? 1 : 0;
    lineState.titleLinkProgress += (titlePointerTarget - lineState.titleLinkProgress) * (isReducedMotion ? 1 : 0.16);
    if (Math.abs(titlePointerTarget - lineState.titleLinkProgress) < 0.002) {
      lineState.titleLinkProgress = titlePointerTarget;
    }

    showcaseContext.globalCompositeOperation = "source-over";

    const flowOrigin = lineState.flowOrigin || {
      x: lineState.width * 0.52,
      y: lineState.height * 0.52
    };
    const pointerTargetX = lineState.pointerInside
      ? lineState.pointerX
      : flowOrigin.x + (lineState.pointerX - flowOrigin.x) * 0.55;
    const pointerTargetY = lineState.pointerInside
      ? lineState.pointerY
      : flowOrigin.y + (lineState.pointerY - flowOrigin.y) * 0.55;
    lineState.pointerDrawX += (pointerTargetX - lineState.pointerDrawX) * (isReducedMotion ? 1 : 0.24);
    lineState.pointerDrawY += (pointerTargetY - lineState.pointerDrawY) * (isReducedMotion ? 1 : 0.24);
    const terminalStart = lineState.wordAnchorCount * 2;

    showcaseContext.fillStyle = isLightShowcase ? "#ffffff" : "#020202";
    showcaseContext.fillRect(0, 0, lineState.width, lineState.height);

    const radialGlow = showcaseContext.createRadialGradient(
      flowOrigin.x,
      flowOrigin.y,
      0,
      flowOrigin.x,
      flowOrigin.y,
      Math.max(lineState.width, lineState.height) * 0.82
    );
    radialGlow.addColorStop(
      0,
      isLightShowcase
        ? "rgba(5, 5, 5, 0.14)"
        : showcaseHueColor(0.2, 92, 76, 6)
    );
    radialGlow.addColorStop(
      0.42,
      isLightShowcase
        ? "rgba(5, 5, 5, 0.06)"
        : showcaseHueColor(0.08, 90, 68, -8)
    );
    radialGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
    showcaseContext.fillStyle = radialGlow;
    showcaseContext.fillRect(0, 0, lineState.width, lineState.height);

    lineState.lines.forEach((line) => {
      const source = lineState.anchors[line.sourceIndex];
      const target = lineState.anchors[line.targetIndex];

      if (!source || !target) {
        return;
      }

      const flow = isReducedMotion ? 0 : Math.sin(drift * line.speed * 2.3 + line.phase);
      const wobble = isReducedMotion ? 0 : Math.cos(drift * line.speed * 1.7 + line.phase * 1.2);
      const sourceX = source.x + line.sourceJitterX + flow * line.sway * 0.22;
      const sourceY = source.y + line.sourceJitterY + wobble * line.sway * 0.18;
      const targetX = target.x + line.targetJitterX - flow * line.sway * 0.24;
      const targetY = target.y + line.targetJitterY - wobble * line.sway * 0.16;
      const pinchX = flowOrigin.x + line.pinchOffsetX + flow * line.sway * 0.9;
      const pinchY = flowOrigin.y + line.pinchOffsetY + wobble * line.sway * 0.76;
      const deltaX = targetX - sourceX;
      const deltaY = targetY - sourceY;
      const distance = Math.max(1, Math.hypot(deltaX, deltaY));
      const normalX = -deltaY / distance;
      const normalY = deltaX / distance;
      const bend = line.bend * line.sway * (isReducedMotion ? 0.24 : 0.66);
      const controlBlend = line.tension;
      const control1X = sourceX + (pinchX - sourceX) * controlBlend + normalX * bend;
      const control1Y = sourceY + (pinchY - sourceY) * controlBlend + normalY * bend;
      const control2X = targetX + (pinchX - targetX) * controlBlend - normalX * bend * 0.86;
      const control2Y = targetY + (pinchY - targetY) * controlBlend - normalY * bend * 0.86;
      const safeSource = clampShowcasePoint(sourceX, sourceY, 3);
      const safeTarget = clampShowcasePoint(targetX, targetY, 2);
      const safeControl1 = clampShowcasePoint(control1X, control1Y, 2);
      const safeControl2 = clampShowcasePoint(control2X, control2Y, 2);

      showcaseContext.strokeStyle = showcaseHueColor(line.glowAlpha * 0.86, 92, 78, 8);
      showcaseContext.lineWidth = line.width * 2.2;
      showcaseContext.beginPath();
      showcaseContext.moveTo(safeSource.x, safeSource.y);
      showcaseContext.bezierCurveTo(safeControl1.x, safeControl1.y, safeControl2.x, safeControl2.y, safeTarget.x, safeTarget.y);
      showcaseContext.stroke();

      showcaseContext.strokeStyle = showcaseHueColor(line.alpha, 84, 70, -4);
      showcaseContext.lineWidth = line.width;
      showcaseContext.beginPath();
      showcaseContext.moveTo(safeSource.x, safeSource.y);
      showcaseContext.bezierCurveTo(safeControl1.x, safeControl1.y, safeControl2.x, safeControl2.y, safeTarget.x, safeTarget.y);
      showcaseContext.stroke();
    });

    lineState.fiberLines.forEach((line, index) => {
      const source = lineState.anchors[line.sourceIndex];
      const target = lineState.anchors[line.targetIndex];

      if (!source || !target) {
        return;
      }

      const flow = isReducedMotion ? 0 : Math.sin(drift * line.speed * 3.3 + line.phase);
      const wobble = isReducedMotion ? 0 : Math.cos(drift * line.speed * 2.6 + line.phase * 1.26);
      const sourceX = source.x + line.sourceJitterX + flow * line.sway * 0.2;
      const sourceY = source.y + line.sourceJitterY + wobble * line.sway * 0.18;
      const targetX = target.x + line.targetJitterX - flow * line.sway * 0.26;
      const targetY = target.y + line.targetJitterY - wobble * line.sway * 0.22;
      const flowNodeX = flowOrigin.x + line.flowShiftX + flow * line.sway * 0.94;
      const flowNodeY = flowOrigin.y + line.flowShiftY + wobble * line.sway * 0.76;
      const deltaX = targetX - sourceX;
      const deltaY = targetY - sourceY;
      const distance = Math.max(1, Math.hypot(deltaX, deltaY));
      const normalX = -deltaY / distance;
      const normalY = deltaX / distance;
      const bend = line.bend * line.sway * (isReducedMotion ? 0.22 : 0.78);
      const control1X = sourceX + (flowNodeX - sourceX) * line.tension + normalX * bend;
      const control1Y = sourceY + (flowNodeY - sourceY) * line.tension + normalY * bend;
      const control2X = targetX + (flowNodeX - targetX) * line.retract - normalX * bend * 0.86;
      const control2Y = targetY + (flowNodeY - targetY) * line.retract - normalY * bend * 0.86;
      const safeSource = clampShowcasePoint(sourceX, sourceY, 2);
      const safeTarget = clampShowcasePoint(targetX, targetY, 2);
      const safeControl1 = clampShowcasePoint(control1X, control1Y, 2);
      const safeControl2 = clampShowcasePoint(control2X, control2Y, 2);

      showcaseContext.strokeStyle = showcaseHueColor(line.glowAlpha, 92, 76, 14);
      showcaseContext.lineWidth = line.width * 2.8;
      showcaseContext.beginPath();
      showcaseContext.moveTo(safeSource.x, safeSource.y);
      showcaseContext.bezierCurveTo(safeControl1.x, safeControl1.y, safeControl2.x, safeControl2.y, safeTarget.x, safeTarget.y);
      showcaseContext.stroke();

      showcaseContext.strokeStyle = showcaseHueColor(line.alpha, 86, 68, 2);
      showcaseContext.lineWidth = line.width;
      showcaseContext.beginPath();
      showcaseContext.moveTo(safeSource.x, safeSource.y);
      showcaseContext.bezierCurveTo(safeControl1.x, safeControl1.y, safeControl2.x, safeControl2.y, safeTarget.x, safeTarget.y);
      showcaseContext.stroke();

      if (index % 24 === 0) {
        showcaseContext.fillStyle = showcaseHueColor(0.24, 94, 82, 16);
        showcaseContext.beginPath();
        showcaseContext.arc(safeTarget.x, safeTarget.y, Math.max(0.7, line.width * 1.1), 0, Math.PI * 2);
        showcaseContext.fill();
      }
    });

    lineState.meshClusters.forEach((cluster, clusterIndex) => {
      const animatedPoints = cluster.points.map((point, pointIndex) => {
        const animatedX = point.x + Math.sin(drift * point.speed + point.phase) * point.wobbleX;
        const animatedY = point.y + Math.cos(drift * (point.speed * 1.22) + point.phase + pointIndex * 0.08) * point.wobbleY;

        return clampShowcasePoint(animatedX, animatedY, 2);
      });

      for (let startIndex = 0; startIndex < animatedPoints.length; startIndex += 1) {
        const startPoint = animatedPoints[startIndex];

        for (let endIndex = startIndex + 1; endIndex < animatedPoints.length; endIndex += 1) {
          const endPoint = animatedPoints[endIndex];
          const distance = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y);

          if (distance > cluster.linkDistance) {
            continue;
          }

          const fade = 1 - distance / cluster.linkDistance;
          const pulse = isReducedMotion ? 1 : 0.7 + Math.sin(drift * 2.5 + startIndex * 0.2 + endIndex * 0.12) * 0.3;
          const alpha = cluster.lineAlpha * fade * pulse;

          if (alpha <= 0.012) {
            continue;
          }

          showcaseContext.strokeStyle = showcaseHueColor(alpha, 90, 74, clusterIndex * 6 - 10);
          showcaseContext.lineWidth = cluster.lineWidth * (0.62 + fade * 0.96);
          showcaseContext.beginPath();
          showcaseContext.moveTo(startPoint.x, startPoint.y);
          showcaseContext.lineTo(endPoint.x, endPoint.y);
          showcaseContext.stroke();
        }

        if (startIndex % cluster.spokeStride === clusterIndex % cluster.spokeStride) {
          const controlPoint = clampShowcasePoint(
            flowOrigin.x + (startPoint.x - flowOrigin.x) * 0.42 + Math.sin(drift * 2.9 + startIndex) * lineState.width * 0.018,
            flowOrigin.y + (startPoint.y - flowOrigin.y) * 0.42 + Math.cos(drift * 2.6 + startIndex) * lineState.height * 0.016,
            2
          );
          showcaseContext.strokeStyle = showcaseHueColor(0.14, 88, 70, -14);
          showcaseContext.lineWidth = 0.82;
          showcaseContext.beginPath();
          showcaseContext.moveTo(flowOrigin.x, flowOrigin.y);
          showcaseContext.quadraticCurveTo(controlPoint.x, controlPoint.y, startPoint.x, startPoint.y);
          showcaseContext.stroke();
        }
      }
    });

    if (lineState.hoveredWordIndex >= 0 && lineState.hoveredWordIndex < lineState.wordAnchorCount && lineState.focusProgress > 0.01) {
      const sourceAnchor = lineState.anchors[lineState.hoveredWordIndex];
      const sourceLabelPoint = getShowcaseTopicFocusPoint(lineState.hoveredWordIndex, 0.56);
      const sourcePoint = sourceLabelPoint || (sourceAnchor ? clampShowcasePoint(sourceAnchor.x, sourceAnchor.y, 2) : null);

      if (sourceAnchor && sourcePoint) {
        const revealProgress = clampShowcaseCoordinate(lineState.focusProgress, 0.04, 1);

        for (let targetWordIndex = 0; targetWordIndex < lineState.wordAnchorCount; targetWordIndex += 1) {
          if (targetWordIndex === lineState.hoveredWordIndex) {
            continue;
          }

          const targetAnchor = lineState.anchors[terminalStart + targetWordIndex] || lineState.anchors[targetWordIndex];

          if (!targetAnchor) {
            continue;
          }

          const targetPoint = clampShowcasePoint(targetAnchor.x, targetAnchor.y, 2);
          const spreadFactor = lineState.wordAnchorCount === 1
            ? 0
            : (targetWordIndex - lineState.hoveredWordIndex) / (lineState.wordAnchorCount - 1);
          const focusControl = clampShowcasePoint(
            sourcePoint.x + (targetPoint.x - sourcePoint.x) * 0.56 + lineState.width * 0.12,
            flowOrigin.y
              + spreadFactor * lineState.height * 0.24
              + Math.sin(drift * 2.6 + targetWordIndex * 0.84) * lineState.height * 0.028,
            2
          );
          const approximateLength = Math.max(90, Math.hypot(targetPoint.x - sourcePoint.x, targetPoint.y - sourcePoint.y) * 1.48);

          showcaseContext.setLineDash([approximateLength, approximateLength + 32]);
          showcaseContext.lineDashOffset = approximateLength * (1 - revealProgress);

          showcaseContext.strokeStyle = showcaseHueColor(0.26 + revealProgress * 0.28, 94, 78, 10);
          showcaseContext.lineWidth = 2.2;
          showcaseContext.beginPath();
          showcaseContext.moveTo(sourcePoint.x, sourcePoint.y);
          showcaseContext.quadraticCurveTo(focusControl.x, focusControl.y, targetPoint.x, targetPoint.y);
          showcaseContext.stroke();

          showcaseContext.strokeStyle = showcaseHueColor(0.45 + revealProgress * 0.3, 92, 70, 4);
          showcaseContext.lineWidth = 1.04;
          showcaseContext.beginPath();
          showcaseContext.moveTo(sourcePoint.x, sourcePoint.y);
          showcaseContext.quadraticCurveTo(focusControl.x, focusControl.y, targetPoint.x, targetPoint.y);
          showcaseContext.stroke();

          if (revealProgress > 0.92) {
            showcaseContext.fillStyle = showcaseHueColor(0.48 + revealProgress * 0.34, 96, 84, 14);
            showcaseContext.beginPath();
            showcaseContext.arc(targetPoint.x, targetPoint.y, 2.4, 0, Math.PI * 2);
            showcaseContext.fill();
          }
        }

        showcaseContext.setLineDash([]);
        showcaseContext.lineDashOffset = 0;
      }
    }

    if (lineState.pointerLinkProgress > 0.01 && lineState.hoveredWordIndex >= 0) {
      const hoverFocusPoint = getShowcaseTopicFocusPoint(lineState.hoveredWordIndex, 0.52);

      if (hoverFocusPoint) {
        const pointerPoint = clampShowcasePoint(lineState.pointerDrawX, lineState.pointerDrawY, 2);
        const tetherControl = clampShowcasePoint(
          pointerPoint.x + (hoverFocusPoint.x - pointerPoint.x) * 0.5 + Math.sin(drift * 3.4) * lineState.width * 0.01,
          pointerPoint.y + (hoverFocusPoint.y - pointerPoint.y) * 0.46 + Math.cos(drift * 3.9) * lineState.height * 0.016,
          2
        );

        showcaseContext.strokeStyle = showcaseHueColor(0.16 + lineState.pointerLinkProgress * 0.32, 94, 80, 10);
        showcaseContext.lineWidth = 2.9;
        showcaseContext.beginPath();
        showcaseContext.moveTo(pointerPoint.x, pointerPoint.y);
        showcaseContext.quadraticCurveTo(tetherControl.x, tetherControl.y, hoverFocusPoint.x, hoverFocusPoint.y);
        showcaseContext.stroke();

        showcaseContext.strokeStyle = showcaseHueColor(0.34 + lineState.pointerLinkProgress * 0.42, 92, 72, 4);
        showcaseContext.lineWidth = 1.2;
        showcaseContext.beginPath();
        showcaseContext.moveTo(pointerPoint.x, pointerPoint.y);
        showcaseContext.quadraticCurveTo(tetherControl.x, tetherControl.y, hoverFocusPoint.x, hoverFocusPoint.y);
        showcaseContext.stroke();

        showcaseContext.fillStyle = showcaseHueColor(0.56 + lineState.pointerLinkProgress * 0.34, 96, 84, 12);
        showcaseContext.beginPath();
        showcaseContext.arc(hoverFocusPoint.x, hoverFocusPoint.y, 2.3, 0, Math.PI * 2);
        showcaseContext.fill();
      }
    }

    if (lineState.titleLinkProgress > 0.01) {
      const titleFocusPoint = getShowcaseTitleFocusPoint();

      if (titleFocusPoint) {
        const pointerPoint = clampShowcasePoint(lineState.pointerDrawX, lineState.pointerDrawY, 2);
        const trailCount = 4;

        for (let trailIndex = 0; trailIndex < trailCount; trailIndex += 1) {
          const trailProgress = trailCount === 1 ? 0 : trailIndex / (trailCount - 1);
          const swing = Math.sin(drift * (3.4 + trailIndex * 0.7) + trailIndex * 0.84);
          const lift = Math.cos(drift * (3 + trailIndex * 0.6) + trailIndex * 1.18);
          const controlPoint = clampShowcasePoint(
            pointerPoint.x + (titleFocusPoint.x - pointerPoint.x) * (0.48 + trailProgress * 0.14) + swing * lineState.width * 0.012,
            pointerPoint.y + (titleFocusPoint.y - pointerPoint.y) * (0.34 + trailProgress * 0.2) + lift * lineState.height * 0.024,
            2
          );
          const alphaBoost = lineState.titleLinkProgress * (1 - trailProgress * 0.18);

          showcaseContext.strokeStyle = showcaseHueColor(0.18 + alphaBoost * 0.3, 92, 80, 10 + trailIndex * 3);
          showcaseContext.lineWidth = 1.8 - trailProgress * 0.6;
          showcaseContext.beginPath();
          showcaseContext.moveTo(pointerPoint.x, pointerPoint.y);
          showcaseContext.quadraticCurveTo(controlPoint.x, controlPoint.y, titleFocusPoint.x, titleFocusPoint.y);
          showcaseContext.stroke();
        }

        showcaseContext.fillStyle = showcaseHueColor(0.56 + lineState.titleLinkProgress * 0.3, 96, 86, 16);
        showcaseContext.beginPath();
        showcaseContext.arc(titleFocusPoint.x, titleFocusPoint.y, 2.4, 0, Math.PI * 2);
        showcaseContext.fill();
      }
    }

    for (let anchorIndex = 0; anchorIndex < lineState.wordAnchorCount; anchorIndex += 1) {
      const anchor = lineState.anchors[anchorIndex];

      if (!anchor) {
        continue;
      }

      const safeAnchor = clampShowcasePoint(anchor.x, anchor.y, 2);
      showcaseContext.fillStyle = showcaseHueColor(0.78, 94, 86, 16);
      showcaseContext.beginPath();
      showcaseContext.arc(safeAnchor.x, safeAnchor.y, 2, 0, Math.PI * 2);
      showcaseContext.fill();
    }

    if (reducedMotionQuery.matches || !lineState.visible) {
      lineState.frame = 0;
      return;
    }

    lineState.frame = window.requestAnimationFrame(drawShowcaseLines);
  }

  function stopShowcaseLines() {
    if (!lineState.frame) {
      return;
    }

    window.cancelAnimationFrame(lineState.frame);
    lineState.frame = 0;
  }

  function queueShowcaseLines() {
    if (!showcaseContext || !showcaseCanvas || lineState.frame || reducedMotionQuery.matches || !lineState.visible) {
      return;
    }

    lineState.frame = window.requestAnimationFrame(drawShowcaseLines);
  }

  function setHoveredShowcaseTopic(index) {
    const nextIndex = Number.isFinite(index) ? index : -1;

    if (lineState.hoveredWordIndex === nextIndex && lineState.focusTarget === (nextIndex >= 0 ? 1 : 0)) {
      return;
    }

    lineState.hoveredWordIndex = nextIndex;
    lineState.focusTarget = nextIndex >= 0 ? 1 : 0;

    if (reducedMotionQuery.matches) {
      lineState.focusProgress = lineState.focusTarget;
      drawShowcaseLines(performance.now());
      return;
    }

    queueShowcaseLines();
  }

  function updateShowcasePointer(event) {
    if (!showcaseSection) {
      return;
    }

    const rect = showcaseSection.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    const safePoint = clampShowcasePoint(
      event.clientX - rect.left,
      event.clientY - rect.top,
      2
    );

    lineState.pointerX = safePoint.x;
    lineState.pointerY = safePoint.y;

    if (!lineState.pointerInside) {
      lineState.pointerDrawX = safePoint.x;
      lineState.pointerDrawY = safePoint.y;
    }

    lineState.pointerInside = true;

    if (reducedMotionQuery.matches) {
      drawShowcaseLines(performance.now());
      return;
    }

    queueShowcaseLines();
  }

  function resetShowcasePointer() {
    lineState.pointerInside = false;

    if (reducedMotionQuery.matches) {
      drawShowcaseLines(performance.now());
      return;
    }

    queueShowcaseLines();
  }

  function clearHoveredShowcaseTopic() {
    setHoveredShowcaseTopic(-1);
  }

  function setShowcaseTitleHoverState(isHovered) {
    const nextState = Boolean(isHovered);

    if (lineState.titleHover === nextState) {
      return;
    }

    lineState.titleHover = nextState;

    if (reducedMotionQuery.matches) {
      lineState.titleLinkProgress = nextState ? 1 : 0;
      drawShowcaseLines(performance.now());
      return;
    }

    queueShowcaseLines();
  }

  function setActiveShowcaseTopic(index) {
    const topic = topicLinks[index];

    if (!topic || !showcaseSection) {
      return;
    }

    topicLinks.forEach((item, itemIndex) => {
      item.classList.toggle("is-active", itemIndex === index);
    });

    const hue = topic.dataset.topicHue || String(initialShowcaseHue);
    showcaseSection.style.setProperty("--showcase-hue", hue);
    lineState.targetHue = Number(hue) || initialShowcaseHue;

    if (!reducedMotionQuery.matches) {
      return;
    }

    lineState.currentHue = lineState.targetHue;
    drawShowcaseLines(performance.now());
  }

  topicLinks.forEach((topic, index) => {
    const hue = topic.dataset.topicHue || String(initialShowcaseHue);
    topic.style.setProperty("--topic-hue", hue);

    topic.addEventListener("pointerenter", (event) => {
      updateShowcasePointer(event);
      setHoveredShowcaseTopic(index);
      setActiveShowcaseTopic(index);
    });

    topic.addEventListener("pointermove", updateShowcasePointer);

    topic.addEventListener("focus", () => {
      setHoveredShowcaseTopic(index);
      setActiveShowcaseTopic(index);
    });
  });

  homeWorkShowcaseTopics.addEventListener("pointermove", updateShowcasePointer);

  homeWorkShowcaseTopics.addEventListener("pointerleave", (event) => {
    if (event.relatedTarget instanceof Node && showcaseSection?.contains(event.relatedTarget)) {
      clearHoveredShowcaseTopic();
      return;
    }

    resetShowcasePointer();
    clearHoveredShowcaseTopic();
    setActiveShowcaseTopic(defaultTopicIndex);
  });

  homeWorkShowcaseTopics.addEventListener("focusout", (event) => {
    if (event.relatedTarget instanceof Element && homeWorkShowcaseTopics.contains(event.relatedTarget)) {
      return;
    }

    clearHoveredShowcaseTopic();
    setActiveShowcaseTopic(defaultTopicIndex);
  });

  if (showcaseTitleLink) {
    showcaseTitleLink.addEventListener("pointerenter", (event) => {
      updateShowcasePointer(event);
      setShowcaseTitleHoverState(true);
    });

    showcaseTitleLink.addEventListener("pointermove", updateShowcasePointer);

    showcaseTitleLink.addEventListener("pointerleave", () => {
      setShowcaseTitleHoverState(false);
    });

    showcaseTitleLink.addEventListener("focus", () => {
      setShowcaseTitleHoverState(true);
    });

    showcaseTitleLink.addEventListener("blur", () => {
      setShowcaseTitleHoverState(false);
    });
  }

  showcaseSection?.addEventListener("pointerleave", () => {
    setShowcaseTitleHoverState(false);
  });

  function refreshShowcaseLines() {
    if (!showcaseContext || !showcaseCanvas) {
      return;
    }

    buildShowcaseLines();

    if (lineState.hoveredWordIndex >= lineState.wordAnchorCount) {
      lineState.hoveredWordIndex = -1;
      lineState.focusTarget = 0;
      lineState.focusProgress = 0;
    }

    stopShowcaseLines();
    drawShowcaseLines(performance.now());
    queueShowcaseLines();
  }

  if (showcaseContext && showcaseCanvas) {
    if ("IntersectionObserver" in window && showcaseSection) {
      const observer = new IntersectionObserver((entries) => {
        const entry = entries[0];

        lineState.visible = Boolean(entry?.isIntersecting);

        if (lineState.visible) {
          drawShowcaseLines(performance.now());
          queueShowcaseLines();
          return;
        }

        stopShowcaseLines();
      }, {
        threshold: 0.08
      });

      observer.observe(showcaseSection);
    }

    reducedMotionQuery.addEventListener("change", () => {
      if (reducedMotionQuery.matches) {
        stopShowcaseLines();
        lineState.focusProgress = lineState.focusTarget;
      }

      drawShowcaseLines(performance.now());
      queueShowcaseLines();
    });

    window.addEventListener("resize", refreshShowcaseLines);
    refreshShowcaseLines();
  }

  setActiveShowcaseTopic(defaultTopicIndex);
}

const homeGraphicSliderSection = document.querySelector("[data-home-graphic-slider]");

if (homeGraphicSliderSection) {
  const sliderCanvas = homeGraphicSliderSection.querySelector("[data-home-graphic-canvas]");
  const sliderContext = sliderCanvas?.getContext("2d");
  const sliderItems = Array.from(homeGraphicSliderSection.querySelectorAll("[data-home-graphic-item]"));
  const sliderPrevButton = homeGraphicSliderSection.querySelector("[data-home-graphic-prev]");
  const sliderNextButton = homeGraphicSliderSection.querySelector("[data-home-graphic-next]");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const initialHue = Number(sliderItems[0]?.dataset.graphicHue) || 214;
  const sliderState = {
    currentIndex: 0,
    width: 0,
    height: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    frame: 0,
    visible: true,
    particles: [],
    pointerInside: false,
    pointerX: 0,
    pointerY: 0,
    pointerDrawX: 0,
    pointerDrawY: 0,
    flowX: 0,
    flowY: 0,
    targetHue: initialHue,
    currentHue: initialHue
  };

  function clampHomeGraphic(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeSliderIndex(value) {
    if (!sliderItems.length) {
      return 0;
    }

    return (value % sliderItems.length + sliderItems.length) % sliderItems.length;
  }

  function getSignedSliderDistance(index, current, total) {
    let delta = index - current;
    const half = total / 2;

    if (delta > half) {
      delta -= total;
    } else if (delta < -half) {
      delta += total;
    }

    return delta;
  }

  function sliderHue(alpha, saturation = 90, lightness = 70, hueOffset = 0) {
    const safeAlpha = clampHomeGraphic(alpha, 0, 1);
    return `rgba(255, 255, 255, ${safeAlpha})`;
  }

  function getSectionRect() {
    const rect = homeGraphicSliderSection.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      return rect;
    }

    return {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  function getItemAnchor(item) {
    const media = item.querySelector(".home-graphic-slider__media") || item;
    const itemRect = media.getBoundingClientRect();
    const sectionRect = getSectionRect();

    if (!itemRect.width || !itemRect.height || !sectionRect.width || !sectionRect.height) {
      return null;
    }

    return {
      x: clampHomeGraphic(itemRect.left - sectionRect.left + itemRect.width * 0.5, 2, sliderState.width - 2),
      y: clampHomeGraphic(itemRect.top - sectionRect.top + itemRect.height * 0.52, 2, sliderState.height - 2)
    };
  }

  function buildSliderParticles() {
    const area = sliderState.width * sliderState.height;
    const count = clampHomeGraphic(Math.round(area / 13500), 96, 172);
    const left = sliderState.width * 0.24;
    const right = sliderState.width + 26;

    sliderState.particles = Array.from({ length: count }, () => ({
      x: left + Math.random() * (right - left),
      y: Math.random() * sliderState.height,
      vx: (Math.random() - 0.5) * 0.58,
      vy: (Math.random() - 0.5) * 0.58,
      seed: Math.random() * Math.PI * 2,
      drift: 0.24 + Math.random() * 1.1,
      size: 0.74 + Math.random() * 2.6,
      minX: left,
      maxX: right,
      minY: -14,
      maxY: sliderState.height + 14
    }));
  }

  function resizeHomeGraphicSlider() {
    if (!sliderCanvas || !sliderContext) {
      return;
    }

    const rect = getSectionRect();
    sliderState.width = Math.max(1, Math.round(rect.width || window.innerWidth));
    sliderState.height = Math.max(1, Math.round(rect.height || window.innerHeight));
    sliderState.dpr = Math.min(window.devicePixelRatio || 1, 2);
    sliderCanvas.width = Math.max(1, Math.round(sliderState.width * sliderState.dpr));
    sliderCanvas.height = Math.max(1, Math.round(sliderState.height * sliderState.dpr));
    sliderCanvas.style.width = `${sliderState.width}px`;
    sliderCanvas.style.height = `${sliderState.height}px`;
    sliderContext.setTransform(sliderState.dpr, 0, 0, sliderState.dpr, 0, 0);
    sliderState.flowX = sliderState.width * (window.innerWidth < 720 ? 0.62 : 0.56);
    sliderState.flowY = sliderState.height * 0.5;
    sliderState.pointerX = sliderState.flowX;
    sliderState.pointerY = sliderState.flowY;
    sliderState.pointerDrawX = sliderState.flowX;
    sliderState.pointerDrawY = sliderState.flowY;
    buildSliderParticles();
  }

  function updateSliderPointer(event) {
    const rect = getSectionRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    sliderState.pointerX = clampHomeGraphic(localX, 2, sliderState.width - 2);
    sliderState.pointerY = clampHomeGraphic(localY, 2, sliderState.height - 2);

    if (!sliderState.pointerInside) {
      sliderState.pointerDrawX = sliderState.pointerX;
      sliderState.pointerDrawY = sliderState.pointerY;
    }

    sliderState.pointerInside = true;
    queueHomeGraphicBackdrop();
  }

  function clearSliderPointer() {
    sliderState.pointerInside = false;
    queueHomeGraphicBackdrop();
  }

  function stepSliderParticles(time, frozen = false) {
    const pointerTargetX = sliderState.pointerInside ? sliderState.pointerX : sliderState.flowX;
    const pointerTargetY = sliderState.pointerInside ? sliderState.pointerY : sliderState.flowY;
    sliderState.pointerDrawX += (pointerTargetX - sliderState.pointerDrawX) * (frozen ? 1 : 0.2);
    sliderState.pointerDrawY += (pointerTargetY - sliderState.pointerDrawY) * (frozen ? 1 : 0.2);

    if (frozen) {
      return;
    }

    const t = time * 0.001;
    sliderState.particles.forEach((particle) => {
      const wobbleX = Math.cos(t * (0.5 + particle.drift) + particle.seed) * 0.08;
      const wobbleY = Math.sin(t * (0.44 + particle.drift * 1.08) + particle.seed * 0.84) * 0.08;
      const pullX = (sliderState.flowX - particle.x) * 0.0004;
      const pullY = (sliderState.flowY - particle.y) * 0.00032;

      particle.vx = clampHomeGraphic((particle.vx + wobbleX + pullX) * 0.992, -0.74, 0.74);
      particle.vy = clampHomeGraphic((particle.vy + wobbleY + pullY) * 0.992, -0.74, 0.74);

      if (sliderState.pointerInside) {
        const dx = sliderState.pointerDrawX - particle.x;
        const dy = sliderState.pointerDrawY - particle.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 0.001 && distance < 220) {
          const strength = (1 - (distance / 220)) * 0.038;
          particle.vx += (dx / distance) * strength;
          particle.vy += (dy / distance) * strength;
        }
      }

      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < particle.minX) {
        particle.x = particle.maxX;
      } else if (particle.x > particle.maxX) {
        particle.x = particle.minX;
      }

      if (particle.y < particle.minY) {
        particle.y = particle.maxY;
      } else if (particle.y > particle.maxY) {
        particle.y = particle.minY;
      }
    });
  }

  function drawHomeGraphicBackdrop(time = 0, frozen = false) {
    if (!sliderContext || !sliderCanvas) {
      return;
    }

    const isFrozen = frozen || reducedMotionQuery.matches;
    sliderState.currentHue += (sliderState.targetHue - sliderState.currentHue) * (isFrozen ? 1 : 0.12);
    stepSliderParticles(time, isFrozen);

    sliderContext.setTransform(1, 0, 0, 1, 0, 0);
    sliderContext.clearRect(0, 0, sliderCanvas.width, sliderCanvas.height);
    sliderContext.setTransform(sliderState.dpr, 0, 0, sliderState.dpr, 0, 0);
    sliderContext.clearRect(0, 0, sliderState.width, sliderState.height);

    sliderContext.fillStyle = "#000000";
    sliderContext.fillRect(0, 0, sliderState.width, sliderState.height);

    const glow = sliderContext.createRadialGradient(
      sliderState.flowX,
      sliderState.flowY,
      0,
      sliderState.flowX,
      sliderState.flowY,
      Math.max(sliderState.width, sliderState.height) * 0.8
    );
    glow.addColorStop(0, sliderHue(0.24, 94, 72, 8));
    glow.addColorStop(0.42, sliderHue(0.1, 90, 66, -6));
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    sliderContext.fillStyle = glow;
    sliderContext.fillRect(0, 0, sliderState.width, sliderState.height);

    const linkDistance = window.innerWidth < 720 ? 126 : 168;
    for (let index = 0; index < sliderState.particles.length; index += 1) {
      const pointA = sliderState.particles[index];

      for (let nextIndex = index + 1; nextIndex < sliderState.particles.length; nextIndex += 1) {
        const pointB = sliderState.particles[nextIndex];
        const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);

        if (!distance || distance > linkDistance) {
          continue;
        }

        const alpha = (1 - (distance / linkDistance)) ** 2 * 0.4;
        sliderContext.strokeStyle = sliderHue(alpha, 90, 70, 4);
        sliderContext.lineWidth = 0.5 + alpha * 2.4;
        sliderContext.beginPath();
        sliderContext.moveTo(pointA.x, pointA.y);
        sliderContext.lineTo(pointB.x, pointB.y);
        sliderContext.stroke();
      }
    }

    const extendedDistance = window.innerWidth < 720 ? 188 : 248;
    for (let index = 0; index < sliderState.particles.length; index += 2) {
      const pointA = sliderState.particles[index];
      const maxNext = Math.min(sliderState.particles.length, index + 24);

      for (let nextIndex = index + 2; nextIndex < maxNext; nextIndex += 4) {
        const pointB = sliderState.particles[nextIndex];
        const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);

        if (!distance || distance > extendedDistance) {
          continue;
        }

        const alpha = (1 - (distance / extendedDistance)) ** 1.8 * 0.16;
        sliderContext.strokeStyle = sliderHue(alpha, 92, 76, 8);
        sliderContext.lineWidth = 0.36 + alpha * 1.1;
        sliderContext.beginPath();
        sliderContext.moveTo(pointA.x, pointA.y);
        sliderContext.lineTo(pointB.x, pointB.y);
        sliderContext.stroke();
      }
    }

    const liveT = time * 0.001;
    const ringCount = window.innerWidth < 720 ? 2 : 3;
    for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
      const radiusX = sliderState.width * (0.1 + ringIndex * 0.08) + Math.sin(liveT * (0.7 + ringIndex * 0.2)) * 16;
      const radiusY = sliderState.height * (0.08 + ringIndex * 0.06) + Math.cos(liveT * (0.62 + ringIndex * 0.18)) * 10;
      const rotate = liveT * (0.22 + ringIndex * 0.09);

      sliderContext.strokeStyle = sliderHue(0.12 + ringIndex * 0.06, 94, 80, 12);
      sliderContext.lineWidth = 1.2 + ringIndex * 0.7;
      sliderContext.beginPath();
      sliderContext.ellipse(
        sliderState.flowX,
        sliderState.flowY,
        Math.max(24, radiusX),
        Math.max(20, radiusY),
        rotate,
        0,
        Math.PI * 2
      );
      sliderContext.stroke();
    }

    const orbitCount = window.innerWidth < 720 ? 11 : 17;
    const orbitRadiusX = sliderState.width * (window.innerWidth < 720 ? 0.24 : 0.3);
    const orbitRadiusY = sliderState.height * (window.innerWidth < 720 ? 0.2 : 0.26);
    let previousOrbitPoint = null;
    for (let orbitIndex = 0; orbitIndex < orbitCount; orbitIndex += 1) {
      const ratio = orbitCount === 1 ? 0 : orbitIndex / orbitCount;
      const angle = ratio * Math.PI * 2 + liveT * 0.36;
      const orbitX = sliderState.flowX + Math.cos(angle) * orbitRadiusX;
      const orbitY = sliderState.flowY + Math.sin(angle * 1.12) * orbitRadiusY;
      const wobbleX = Math.sin(liveT * 1.8 + orbitIndex) * sliderState.width * 0.006;
      const wobbleY = Math.cos(liveT * 1.5 + orbitIndex) * sliderState.height * 0.01;
      const pointX = orbitX + wobbleX;
      const pointY = orbitY + wobbleY;

      if (previousOrbitPoint) {
        sliderContext.strokeStyle = sliderHue(0.16, 92, 76, 6);
        sliderContext.lineWidth = 0.74;
        sliderContext.beginPath();
        sliderContext.moveTo(previousOrbitPoint.x, previousOrbitPoint.y);
        sliderContext.lineTo(pointX, pointY);
        sliderContext.stroke();
      }

      if (orbitIndex % 2 === 0) {
        sliderContext.strokeStyle = sliderHue(0.12, 90, 74, 2);
        sliderContext.lineWidth = 0.86;
        sliderContext.beginPath();
        sliderContext.moveTo(pointX, pointY);
        sliderContext.lineTo(sliderState.flowX, sliderState.flowY);
        sliderContext.stroke();
      }

      sliderContext.fillStyle = sliderHue(0.46, 98, 86, 12);
      sliderContext.beginPath();
      sliderContext.arc(pointX, pointY, 1.26, 0, Math.PI * 2);
      sliderContext.fill();

      previousOrbitPoint = { x: pointX, y: pointY };
    }

    const streamCount = window.innerWidth < 720 ? 8 : 13;
    for (let streamIndex = 0; streamIndex < streamCount; streamIndex += 1) {
      const streamRatio = streamCount === 1 ? 0.5 : streamIndex / (streamCount - 1);
      const fromX = sliderState.width + 2;
      const fromY = sliderState.height * (0.06 + streamRatio * 0.88);
      const sway = Math.sin(liveT * 1.3 + streamIndex * 0.72);
      const controlX = sliderState.flowX + sliderState.width * 0.28 + sway * sliderState.width * 0.06;
      const controlY = sliderState.flowY + (fromY - sliderState.flowY) * 0.44 + Math.cos(liveT * 1.08 + streamIndex) * sliderState.height * 0.04;

      sliderContext.strokeStyle = sliderHue(0.08, 90, 72, 10);
      sliderContext.lineWidth = 0.7;
      sliderContext.beginPath();
      sliderContext.moveTo(fromX, fromY);
      sliderContext.quadraticCurveTo(controlX, controlY, sliderState.flowX, sliderState.flowY);
      sliderContext.stroke();
    }

    sliderState.particles.forEach((particle) => {
      const pulse = (Math.sin(time * 0.0013 + particle.seed) + 1) * 0.5;
      sliderContext.fillStyle = sliderHue(0.18 + pulse * 0.3, 96, 82, 10);
      sliderContext.beginPath();
      sliderContext.arc(particle.x, particle.y, particle.size * (0.72 + pulse * 0.84), 0, Math.PI * 2);
      sliderContext.fill();
    });

    const featuredAnchors = sliderItems
      .filter((item) => item.classList.contains("is-current") || item.classList.contains("is-prev"))
      .map((item) => getItemAnchor(item))
      .filter((anchor) => anchor !== null);

    featuredAnchors.forEach((anchor, index) => {
      const wave = Math.sin(time * 0.0017 + index * 0.88);
      const controlPoint = {
        x: sliderState.flowX + (anchor.x - sliderState.flowX) * 0.48 + wave * sliderState.width * 0.028,
        y: sliderState.flowY + (anchor.y - sliderState.flowY) * 0.42 + Math.cos(time * 0.0012 + index) * sliderState.height * 0.04
      };

      sliderContext.strokeStyle = sliderHue(0.24, 94, 78, 12);
      sliderContext.lineWidth = index === 0 ? 3.2 : 2;
      sliderContext.beginPath();
      sliderContext.moveTo(anchor.x, anchor.y);
      sliderContext.quadraticCurveTo(controlPoint.x, controlPoint.y, sliderState.flowX, sliderState.flowY);
      sliderContext.stroke();

      sliderContext.strokeStyle = sliderHue(0.4, 92, 70, 2);
      sliderContext.lineWidth = index === 0 ? 1.2 : 0.9;
      sliderContext.beginPath();
      sliderContext.moveTo(anchor.x, anchor.y);
      sliderContext.quadraticCurveTo(controlPoint.x, controlPoint.y, sliderState.flowX, sliderState.flowY);
      sliderContext.stroke();
    });

    if (sliderState.pointerInside) {
      for (let trailIndex = 0; trailIndex < 3; trailIndex += 1) {
        const spread = trailIndex - 1;
        sliderContext.strokeStyle = sliderHue(0.2 + trailIndex * 0.1, 96, 76, 12 + trailIndex * 4);
        sliderContext.lineWidth = 1.8 - trailIndex * 0.36;
        sliderContext.beginPath();
        sliderContext.moveTo(sliderState.pointerDrawX, sliderState.pointerDrawY);
        sliderContext.quadraticCurveTo(
          sliderState.pointerDrawX + (sliderState.flowX - sliderState.pointerDrawX) * (0.42 + trailIndex * 0.08),
          sliderState.pointerDrawY + (sliderState.flowY - sliderState.pointerDrawY) * (0.34 + trailIndex * 0.1) + spread * sliderState.height * 0.05,
          sliderState.flowX,
          sliderState.flowY
        );
        sliderContext.stroke();
      }
    }

    sliderContext.fillStyle = sliderHue(0.72, 98, 86, 16);
    sliderContext.beginPath();
    sliderContext.arc(sliderState.flowX, sliderState.flowY, 3.8, 0, Math.PI * 2);
    sliderContext.fill();

    if (isFrozen || !sliderState.visible) {
      sliderState.frame = 0;
      return;
    }

    sliderState.frame = window.requestAnimationFrame(drawHomeGraphicBackdrop);
  }

  function stopHomeGraphicBackdrop() {
    if (!sliderState.frame) {
      return;
    }

    window.cancelAnimationFrame(sliderState.frame);
    sliderState.frame = 0;
  }

  function queueHomeGraphicBackdrop() {
    if (sliderState.frame || reducedMotionQuery.matches || !sliderState.visible) {
      return;
    }

    sliderState.frame = window.requestAnimationFrame(drawHomeGraphicBackdrop);
  }

  function applySliderClasses() {
    if (!sliderItems.length) {
      return;
    }

    sliderItems.forEach((item, index) => {
      const delta = getSignedSliderDistance(index, sliderState.currentIndex, sliderItems.length);
      item.classList.remove("is-current", "is-prev", "is-next", "is-far-left", "is-far-right");

      if (delta === 0) {
        item.classList.add("is-current");
        item.setAttribute("aria-hidden", "false");
        item.tabIndex = 0;
      } else if (delta === -1) {
        item.classList.add("is-prev");
        item.setAttribute("aria-hidden", "false");
        item.tabIndex = -1;
      } else if (delta === 1) {
        item.classList.add("is-next");
        item.setAttribute("aria-hidden", "true");
        item.tabIndex = -1;
      } else if (delta < 0) {
        item.classList.add("is-far-left");
        item.setAttribute("aria-hidden", "true");
        item.tabIndex = -1;
      } else {
        item.classList.add("is-far-right");
        item.setAttribute("aria-hidden", "true");
        item.tabIndex = -1;
      }
    });

    const currentItem = sliderItems[sliderState.currentIndex];
    const hue = Number(currentItem?.dataset.graphicHue) || initialHue;
    sliderState.targetHue = hue;
    homeGraphicSliderSection.style.setProperty("--showcase-hue", String(hue));

    if (reducedMotionQuery.matches) {
      sliderState.currentHue = sliderState.targetHue;
      drawHomeGraphicBackdrop(performance.now(), true);
      return;
    }

    queueHomeGraphicBackdrop();
  }

  function moveHomeGraphicSlider(step) {
    sliderState.currentIndex = normalizeSliderIndex(sliderState.currentIndex + step);
    applySliderClasses();
  }

  sliderPrevButton?.addEventListener("click", () => {
    moveHomeGraphicSlider(-1);
  });

  sliderNextButton?.addEventListener("click", () => {
    moveHomeGraphicSlider(1);
  });

  homeGraphicSliderSection.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveHomeGraphicSlider(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveHomeGraphicSlider(1);
    }
  });

  homeGraphicSliderSection.addEventListener("pointermove", updateSliderPointer, { passive: true });
  homeGraphicSliderSection.addEventListener("pointerleave", clearSliderPointer);

  function refreshHomeGraphicSlider() {
    resizeHomeGraphicSlider();
    stopHomeGraphicBackdrop();
    drawHomeGraphicBackdrop(performance.now(), reducedMotionQuery.matches);
    queueHomeGraphicBackdrop();
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      sliderState.visible = Boolean(entry?.isIntersecting);

      if (sliderState.visible) {
        drawHomeGraphicBackdrop(performance.now(), reducedMotionQuery.matches);
        queueHomeGraphicBackdrop();
        return;
      }

      stopHomeGraphicBackdrop();
    }, {
      threshold: 0.08
    });

    observer.observe(homeGraphicSliderSection);
  }

  reducedMotionQuery.addEventListener("change", () => {
    if (reducedMotionQuery.matches) {
      stopHomeGraphicBackdrop();
      drawHomeGraphicBackdrop(performance.now(), true);
      return;
    }

    queueHomeGraphicBackdrop();
  });

  window.addEventListener("resize", refreshHomeGraphicSlider);
  applySliderClasses();
  refreshHomeGraphicSlider();
}

async function syncGraphicDesignArchiveLetterFrames() {
  if (!body || !body.classList.contains("page-graphic-design-archive")) {
    return;
  }

  const cards = Array.from(document.querySelectorAll(".photo-poster--graphic .photo-poster__item"));

  if (cards.length === 0) {
    return;
  }

  function getPosterOrientation(width, height) {
    if (!width || !height) {
      return "portrait";
    }

    return (width / height) > 1.06 ? "landscape" : "portrait";
  }

  function loadPosterDimensions(image) {
    const readyWidth = image.naturalWidth || image.width;
    const readyHeight = image.naturalHeight || image.height;

    if (readyWidth && readyHeight) {
      return Promise.resolve({
        width: readyWidth,
        height: readyHeight
      });
    }

    const source = image.currentSrc || image.src;

    if (!source) {
      return Promise.resolve({
        width: 0,
        height: 0
      });
    }

    return new Promise((resolve) => {
      const probe = new Image();

      probe.addEventListener("load", () => {
        resolve({
          width: probe.naturalWidth,
          height: probe.naturalHeight
        });
      }, { once: true });

      probe.addEventListener("error", () => {
        resolve({
          width: 0,
          height: 0
        });
      }, { once: true });

      probe.src = source;
    });
  }

  await Promise.all(cards.map(async (card) => {
    const image = card.querySelector(".photo-poster__item-media img");

    if (!image) {
      card.dataset.posterOrientation = "portrait";
      return;
    }

    const { width, height } = await loadPosterDimensions(image);
    card.dataset.posterOrientation = getPosterOrientation(width, height);

    image.addEventListener("load", () => {
      const liveWidth = image.naturalWidth || image.width;
      const liveHeight = image.naturalHeight || image.height;
      card.dataset.posterOrientation = getPosterOrientation(liveWidth, liveHeight);
    });
  }));
}

function initGraphicDesignArchiveScrollReveal() {
  if (!body || !body.classList.contains("page-graphic-design-archive")) {
    return;
  }

  const cards = Array.from(document.querySelectorAll(".photo-poster--graphic .photo-poster__item"));

  if (cards.length === 0) {
    return;
  }

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  cards.forEach((card, index) => {
    card.classList.add("is-scroll-reveal");
    card.style.setProperty("--reveal-delay", `${(index % 4) * 60}ms`);
  });

  function revealAllCards() {
    cards.forEach((card) => {
      card.classList.add("is-visible");
    });
  }

  if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
    revealAllCards();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.16,
    rootMargin: "0px 0px -10% 0px"
  });

  cards.forEach((card) => {
    observer.observe(card);
  });
}

function initGraphicDesignArchivePopup() {
  if (!body || !body.classList.contains("page-graphic-design-archive")) {
    return;
  }

  const popup = document.querySelector("[data-graphic-archive-popup]");
  const openButtons = Array.from(document.querySelectorAll("[data-graphic-archive-open]"));

  if (!popup || openButtons.length === 0 || typeof popup.showModal !== "function") {
    return;
  }

  const closeButton = popup.querySelector("[data-graphic-archive-close]");
  const popupPanel = popup.querySelector(".graphic-archive-popup__panel");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ARCHIVE_HASH = "#all-graphic-design-works";
  let popupFloatFrame = 0;
  let popupFloatTimer = 0;
  let popupFloatStart = 0;

  function hasArchiveHash() {
    return String(window.location.hash || "").toLowerCase() === ARCHIVE_HASH;
  }

  function syncArchiveHash(shouldShow) {
    if (!window.history || typeof window.history.replaceState !== "function") {
      return;
    }

    const url = new URL(window.location.href);
    const currentHash = String(url.hash || "").toLowerCase();

    if (shouldShow) {
      if (currentHash === ARCHIVE_HASH) {
        return;
      }

      url.hash = ARCHIVE_HASH;
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      return;
    }

    if (currentHash !== ARCHIVE_HASH) {
      return;
    }

    url.hash = "";
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  function stopPopupFloat() {
    if (popupFloatTimer) {
      window.clearTimeout(popupFloatTimer);
      popupFloatTimer = 0;
    }

    if (popupFloatFrame) {
      window.cancelAnimationFrame(popupFloatFrame);
      popupFloatFrame = 0;
    }

    if (popupPanel) {
      popupPanel.style.transform = "";
      popupPanel.style.willChange = "";
    }
  }

  function animatePopupFloat(time) {
    if (!popup.open || !popupPanel) {
      stopPopupFloat();
      return;
    }

    const elapsed = (time - popupFloatStart) * 0.001;
    const driftX = Math.sin(elapsed * 0.9) * 4;
    const driftY = Math.cos(elapsed * 1.12) * 3;
    popupPanel.style.transform = `translate3d(${driftX}px, ${driftY}px, 0)`;
    popupFloatFrame = window.requestAnimationFrame(animatePopupFloat);
  }

  function startPopupFloat() {
    stopPopupFloat();

    if (!popupPanel || reducedMotionQuery.matches) {
      return;
    }

    popupPanel.style.willChange = "transform";
    popupFloatStart = performance.now();
    popupFloatTimer = window.setTimeout(() => {
      popupFloatTimer = 0;
      popupFloatFrame = window.requestAnimationFrame(animatePopupFloat);
    }, 360);
  }

  function openPopup() {
    if (popup.open) {
      return;
    }

    popup.showModal();
    syncArchiveHash(true);
    body.classList.add("is-graphic-archive-popup-open");
    startPopupFloat();

    window.requestAnimationFrame(() => {
      const firstProject = popup.querySelector(".graphic-archive-popup__item");
      firstProject?.focus({ preventScroll: true });
    });
  }

  function closePopup() {
    if (!popup.open) {
      return;
    }

    popup.close();
  }

  openButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openPopup();
    });
  });

  closeButton?.addEventListener("click", closePopup);

  popup.addEventListener("click", (event) => {
    if (popupPanel && popupPanel.contains(event.target)) {
      return;
    }

    closePopup();
  });

  popup.addEventListener("close", () => {
    stopPopupFloat();
    syncArchiveHash(false);
    body.classList.remove("is-graphic-archive-popup-open");
  });

  popup.addEventListener("cancel", () => {
    stopPopupFloat();
    syncArchiveHash(false);
    body.classList.remove("is-graphic-archive-popup-open");
  });

  if (hasArchiveHash()) {
    openPopup();
  }
}

function initGraphicDesignParticleBackdrop() {
  if (!body || !body.classList.contains("page-graphic-design-archive")) {
    return;
  }

  const host = document.querySelector(".page-main--photo-poster");
  const frame = host?.querySelector(".graphic-archive-board");
  const existingCanvas = host?.querySelector(".graphic-archive-particle-canvas");

  if (!host) {
    return;
  }

  const canvas = existingCanvas || document.createElement("canvas");

  if (!existingCanvas) {
    canvas.className = "graphic-archive-particle-canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.prepend(canvas);
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const MAX_DPR = 1.6;
  const LINK_DISTANCE = 168;
  const LINK_DISTANCE_VARIANCE = 26;
  const POINTER_PULL_RADIUS = 240;
  const SWIRL_STRENGTH = 0.064;
  const FLOW_DRIFT_STRENGTH = 0.22;
  const FLOW_DAMPING = 0.992;
  const MAX_VELOCITY = 1.34;
  const EDGE_WRAP_MARGIN = 34;
  const TENDRIL_COUNT_MIN = 14;
  const TENDRIL_COUNT_MAX = 34;
  const TENDRIL_BASE_ALPHA = 0.56;
  const STAR_COUNT_MIN = 90;
  const STAR_COUNT_MAX = 260;
  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    frameId: 0,
    particles: [],
    tendrils: [],
    stars: [],
    frameBox: null,
    frameMeasureAt: 0,
    pointerX: 0,
    pointerY: 0,
    pointerActive: false,
    offsetX: 0,
    offsetY: 0
  };

  function clampBackdrop(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function randomBackdrop(min, max) {
    return min + Math.random() * (max - min);
  }

  function buildParticles() {
    const area = state.width * state.height;
    const count = clampBackdrop(Math.round(area / 10800), 90, 240);

    state.particles = Array.from({ length: count }, () => ({
      x: randomBackdrop(0, state.width),
      y: randomBackdrop(0, state.height),
      vx: randomBackdrop(-0.4, 0.4),
      vy: randomBackdrop(-0.4, 0.4),
      seed: randomBackdrop(0, Math.PI * 2),
      wave: randomBackdrop(0.45, 1.6),
      pulse: randomBackdrop(0.22, 1.1),
      size: randomBackdrop(0.8, 1.65),
      spin: randomBackdrop(0.58, 1.42),
      tension: randomBackdrop(0.75, 1.3),
      orbitDir: Math.random() > 0.5 ? 1 : -1
    }));
  }

  function buildTendrils() {
    const count = clampBackdrop(
      Math.round((state.width + state.height) / 88),
      TENDRIL_COUNT_MIN,
      TENDRIL_COUNT_MAX
    );

    state.tendrils = Array.from({ length: count }, (_, index) => ({
      side: index % 4,
      seed: randomBackdrop(0, Math.PI * 2),
      speed: randomBackdrop(0.22, 0.86),
      thickness: randomBackdrop(0.8, 2.1),
      alpha: randomBackdrop(0.32, 0.84),
      swing: randomBackdrop(14, 52),
      wave: randomBackdrop(0.4, 1.26),
      targetBias: randomBackdrop(0.08, 0.92),
      branchBias: randomBackdrop(0.18, 0.82)
    }));
  }

  function buildStars() {
    const area = state.width * state.height;
    const count = clampBackdrop(
      Math.round(area / 9400),
      STAR_COUNT_MIN,
      STAR_COUNT_MAX
    );

    state.stars = Array.from({ length: count }, () => ({
      x: randomBackdrop(0, state.width),
      y: randomBackdrop(0, state.height),
      size: randomBackdrop(0.35, 1.82),
      alpha: randomBackdrop(0.28, 0.9),
      twinkleSeed: randomBackdrop(0, Math.PI * 2),
      twinkleSpeed: randomBackdrop(0.54, 2.2),
      driftX: randomBackdrop(-0.026, 0.026),
      driftY: randomBackdrop(0.006, 0.048),
      flareBias: randomBackdrop(0.18, 0.92)
    }));
  }

  function updateFrameBox() {
    if (!frame) {
      state.frameBox = null;
      return;
    }

    const hostRect = host.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const x = frameRect.left - hostRect.left;
    const y = frameRect.top - hostRect.top;
    const width = frameRect.width;
    const height = frameRect.height;

    if (!Number.isFinite(x) || !Number.isFinite(y) || width <= 0 || height <= 0) {
      state.frameBox = null;
      return;
    }

    state.frameBox = {
      x,
      y,
      width,
      height,
      centerX: x + width * 0.5,
      centerY: y + height * 0.5
    };
  }

  function resizeBackdrop() {
    const hostRect = host.getBoundingClientRect();
    const targetWidth = Math.max(1, Math.floor(hostRect.width));
    const targetHeight = Math.max(
      1,
      Math.floor(Math.max(host.scrollHeight, host.clientHeight, hostRect.height))
    );

    state.width = targetWidth;
    state.height = targetHeight;
    state.offsetX = 0;
    state.offsetY = 0;
    state.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.left = `${state.offsetX}px`;
    canvas.style.top = `${state.offsetY}px`;
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.pointerX = state.width * 0.5;
    state.pointerY = state.height * 0.5;
    updateFrameBox();
    buildParticles();
    buildTendrils();
    buildStars();
    drawBackdrop(performance.now(), true);
  }

  function wrapParticle(particle) {
    if (particle.x < -EDGE_WRAP_MARGIN) {
      particle.x = state.width + EDGE_WRAP_MARGIN;
    } else if (particle.x > state.width + EDGE_WRAP_MARGIN) {
      particle.x = -EDGE_WRAP_MARGIN;
    }

    if (particle.y < -EDGE_WRAP_MARGIN) {
      particle.y = state.height + EDGE_WRAP_MARGIN;
    } else if (particle.y > state.height + EDGE_WRAP_MARGIN) {
      particle.y = -EDGE_WRAP_MARGIN;
    }
  }

  function getTendrilOrigin(tendril, t) {
    const overshoot = 20 + tendril.swing * 0.28;
    const swingA = Math.sin(t * 0.58 * tendril.wave + tendril.seed);
    const swingB = Math.cos(t * 0.72 * tendril.wave + tendril.seed * 1.2);

    if (tendril.side === 0) {
      return {
        x: state.width * tendril.targetBias + swingA * state.width * 0.24,
        y: -overshoot + swingB * tendril.swing * 0.22
      };
    }

    if (tendril.side === 1) {
      return {
        x: state.width + overshoot + swingB * tendril.swing * 0.22,
        y: state.height * tendril.targetBias + swingA * state.height * 0.24
      };
    }

    if (tendril.side === 2) {
      return {
        x: state.width * tendril.targetBias + swingA * state.width * 0.24,
        y: state.height + overshoot + swingB * tendril.swing * 0.22
      };
    }

    return {
      x: -overshoot + swingB * tendril.swing * 0.22,
      y: state.height * tendril.targetBias + swingA * state.height * 0.24
    };
  }

  function getTendrilTarget(tendril, t, biasOffset = 0) {
    if (!state.frameBox) {
      return {
        x: state.width * 0.5,
        y: state.height * 0.5
      };
    }

    const frameBox = state.frameBox;
    const variance = Math.sin(t * 0.62 * tendril.wave + tendril.seed * 1.4) * 0.1;
    const targetRatio = clampBackdrop(
      tendril.targetBias + variance + biasOffset,
      0.04,
      0.96
    );

    if (tendril.side === 0) {
      return {
        x: frameBox.x + frameBox.width * targetRatio,
        y: frameBox.y
      };
    }

    if (tendril.side === 1) {
      return {
        x: frameBox.x + frameBox.width,
        y: frameBox.y + frameBox.height * targetRatio
      };
    }

    if (tendril.side === 2) {
      return {
        x: frameBox.x + frameBox.width * targetRatio,
        y: frameBox.y + frameBox.height
      };
    }

    return {
      x: frameBox.x,
      y: frameBox.y + frameBox.height * targetRatio
    };
  }

  function drawBackdropTendrils(t) {
    if (!state.frameBox || state.tendrils.length === 0) {
      return;
    }

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";

    state.tendrils.forEach((tendril) => {
      const origin = getTendrilOrigin(tendril, t);
      const target = getTendrilTarget(tendril, t);
      const dx = target.x - origin.x;
      const dy = target.y - origin.y;
      const distance = Math.hypot(dx, dy) || 1;
      const normalX = -dy / distance;
      const normalY = dx / distance;
      const wobble = Math.sin(t * 1.1 * tendril.wave + tendril.seed) * tendril.swing;
      const frameBox = state.frameBox;
      const pullX = frameBox.centerX + Math.cos(t * 0.48 + tendril.seed) * frameBox.width * 0.34;
      const pullY = frameBox.centerY + Math.sin(t * 0.52 + tendril.seed * 1.1) * frameBox.height * 0.34;
      const control1X = origin.x + (pullX - origin.x) * 0.36 + normalX * wobble * 0.34;
      const control1Y = origin.y + (pullY - origin.y) * 0.36 + normalY * wobble * 0.34;
      const control2X = target.x + (pullX - target.x) * 0.52 - normalX * wobble * 0.42;
      const control2Y = target.y + (pullY - target.y) * 0.52 - normalY * wobble * 0.42;
      const alpha = tendril.alpha * TENDRIL_BASE_ALPHA;
      const branchTarget = getTendrilTarget(
        tendril,
        t + 0.4,
        (tendril.branchBias - 0.5) * 0.34
      );

      context.strokeStyle = `rgba(124, 166, 255, ${0.08 * alpha})`;
      context.lineWidth = tendril.thickness * 3.7;
      context.beginPath();
      context.moveTo(origin.x, origin.y);
      context.bezierCurveTo(control1X, control1Y, control2X, control2Y, target.x, target.y);
      context.stroke();

      context.strokeStyle = `rgba(186, 216, 255, ${0.24 * alpha})`;
      context.lineWidth = tendril.thickness * 1.42;
      context.beginPath();
      context.moveTo(origin.x, origin.y);
      context.bezierCurveTo(control1X, control1Y, control2X, control2Y, target.x, target.y);
      context.stroke();

      context.strokeStyle = `rgba(255, 255, 255, ${0.38 * alpha})`;
      context.lineWidth = tendril.thickness * 0.64;
      context.beginPath();
      context.moveTo(origin.x, origin.y);
      context.bezierCurveTo(control1X, control1Y, control2X, control2Y, target.x, target.y);
      context.stroke();

      context.strokeStyle = `rgba(198, 226, 255, ${0.16 * alpha})`;
      context.lineWidth = tendril.thickness * 0.72;
      context.beginPath();
      context.moveTo(
        origin.x + normalX * tendril.thickness * 0.55,
        origin.y + normalY * tendril.thickness * 0.55
      );
      context.quadraticCurveTo(
        control2X + normalX * wobble * 0.24,
        control2Y + normalY * wobble * 0.24,
        branchTarget.x,
        branchTarget.y
      );
      context.stroke();

      context.fillStyle = `rgba(236, 246, 255, ${0.28 * alpha})`;
      context.beginPath();
      context.arc(target.x, target.y, 1 + tendril.thickness * 0.62, 0, Math.PI * 2);
      context.fill();
    });

    context.restore();
  }

  function drawBackdropStars(t) {
    if (state.stars.length === 0) {
      return;
    }

    context.save();
    context.lineCap = "round";

    state.stars.forEach((star) => {
      const pulse = (Math.sin(t * star.twinkleSpeed + star.twinkleSeed) + 1) * 0.5;
      const twinkle = 0.24 + pulse * 0.92;
      const alpha = star.alpha * twinkle;
      const coreRadius = star.size * (0.26 + twinkle * 0.82);
      const haloRadius = star.size * (1.6 + twinkle * 3.1);

      context.fillStyle = `rgba(188, 224, 255, ${alpha * 0.18})`;
      context.beginPath();
      context.arc(star.x, star.y, haloRadius, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = `rgba(255, 255, 255, ${alpha * 0.88})`;
      context.beginPath();
      context.arc(star.x, star.y, coreRadius, 0, Math.PI * 2);
      context.fill();

      if (twinkle > 0.64) {
        const flare = star.size * (2.4 + twinkle * 4.4) * star.flareBias;
        const crossAlpha = (alpha - 0.15) * 0.34;

        if (crossAlpha > 0.02) {
          context.strokeStyle = `rgba(236, 246, 255, ${crossAlpha})`;
          context.lineWidth = 0.42 + star.size * 0.28;
          context.beginPath();
          context.moveTo(star.x - flare, star.y);
          context.lineTo(star.x + flare, star.y);
          context.moveTo(star.x, star.y - flare);
          context.lineTo(star.x, star.y + flare);
          context.stroke();
        }
      }
    });

    context.restore();
  }

  function stepParticles(time, frozen = false) {
    const t = time * 0.001;
    const centerX = state.width * 0.5;
    const centerY = state.height * 0.5;
    const flowBreath = 0.86 + Math.sin(t * 0.28) * 0.24;
    const dynamicLinkDistance = LINK_DISTANCE + Math.sin(t * 0.42) * LINK_DISTANCE_VARIANCE;

    if (time - state.frameMeasureAt > 280) {
      updateFrameBox();
      state.frameMeasureAt = time;
    }

    state.particles.forEach((particle) => {
      const ambientDriftX = Math.sin(t * particle.spin + particle.seed * 0.6) * FLOW_DRIFT_STRENGTH;
      const ambientDriftY = Math.cos(t * (particle.spin * 1.08) + particle.seed * 0.9) * FLOW_DRIFT_STRENGTH;

      if (!frozen) {
        const toCenterX = particle.x - centerX;
        const toCenterY = particle.y - centerY;
        const distance = Math.hypot(toCenterX, toCenterY) + 1;
        const inverseDistance = 1 / distance;
        const swirlForce = (particle.orbitDir * SWIRL_STRENGTH * flowBreath) / (1 + distance * 0.0032);
        const swirlX = -toCenterY * inverseDistance * swirlForce;
        const swirlY = toCenterX * inverseDistance * swirlForce;
        const flowX = Math.cos(t * 0.75 * particle.wave + particle.seed) * 0.022 * particle.tension;
        const flowY = Math.sin(t * 0.68 * (particle.wave + 0.32) + particle.seed * 1.14) * 0.022 * particle.tension;

        particle.vx += swirlX + flowX + ambientDriftX * 0.026;
        particle.vy += swirlY + flowY + ambientDriftY * 0.026;

        if (state.pointerActive) {
          const toPointerX = state.pointerX - particle.x;
          const toPointerY = state.pointerY - particle.y;
          const pointerDistance = Math.hypot(toPointerX, toPointerY);

          if (pointerDistance && pointerDistance < POINTER_PULL_RADIUS) {
            const pointerStrength = (1 - (pointerDistance / POINTER_PULL_RADIUS)) * 0.048;
            particle.vx += (toPointerX / pointerDistance) * pointerStrength;
            particle.vy += (toPointerY / pointerDistance) * pointerStrength;
          }
        }

        particle.vx = clampBackdrop(particle.vx * FLOW_DAMPING, -MAX_VELOCITY, MAX_VELOCITY);
        particle.vy = clampBackdrop(particle.vy * FLOW_DAMPING, -MAX_VELOCITY, MAX_VELOCITY);
        particle.x += particle.vx + ambientDriftX;
        particle.y += particle.vy + ambientDriftY;
        wrapParticle(particle);
      }
    });

    if (!frozen) {
      state.stars.forEach((star) => {
        star.x += star.driftX;
        star.y += star.driftY;

        if (star.x < -12) {
          star.x = state.width + 12;
        } else if (star.x > state.width + 12) {
          star.x = -12;
        }

        if (star.y < -12) {
          star.y = state.height + 12;
        } else if (star.y > state.height + 12) {
          star.y = -12;
        }
      });
    }

    context.clearRect(0, 0, state.width, state.height);
    drawBackdropStars(t);
    drawBackdropTendrils(t);

    for (let index = 0; index < state.particles.length; index += 1) {
      const particleA = state.particles[index];

      for (let nextIndex = index + 1; nextIndex < state.particles.length; nextIndex += 1) {
        const particleB = state.particles[nextIndex];
        const dx = particleB.x - particleA.x;
        const dy = particleB.y - particleA.y;
        const distance = Math.hypot(dx, dy);

        if (!distance || distance > dynamicLinkDistance) {
          continue;
        }

        const ratio = 1 - (distance / dynamicLinkDistance);
        const alpha = ratio * ratio * 0.48;
        context.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        context.lineWidth = 0.34 + ratio * 1.18;
        context.beginPath();
        context.moveTo(particleA.x, particleA.y);
        context.lineTo(particleB.x, particleB.y);
        context.stroke();
      }
    }

    state.particles.forEach((particle) => {
      const glow = 0.52 + ((Math.sin(t * 1.9 + particle.seed) + 1) * 0.5);
      const coreRadius = particle.size * (0.44 + particle.pulse * 0.3);
      const haloRadius = particle.size * (2.1 + particle.pulse * 1.6);

      context.fillStyle = `rgba(255, 255, 255, ${0.2 + glow * 0.22})`;
      context.beginPath();
      context.arc(particle.x, particle.y, coreRadius, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = `rgba(255, 255, 255, ${0.08 + glow * 0.12})`;
      context.beginPath();
      context.arc(particle.x, particle.y, haloRadius, 0, Math.PI * 2);
      context.fill();
    });
  }

  function drawBackdrop(time, frozen = false) {
    stepParticles(time, frozen);
  }

  function animateBackdrop(time) {
    if (reducedMotionQuery.matches) {
      state.frameId = 0;
      drawBackdrop(time, true);
      return;
    }

    drawBackdrop(time, false);
    state.frameId = window.requestAnimationFrame(animateBackdrop);
  }

  function startBackdrop() {
    if (state.frameId) {
      return;
    }

    state.frameId = window.requestAnimationFrame(animateBackdrop);
  }

  function stopBackdrop() {
    if (!state.frameId) {
      return;
    }

    window.cancelAnimationFrame(state.frameId);
    state.frameId = 0;
  }

  function onPointerMove(event) {
    const hostRect = host.getBoundingClientRect();
    const localX = event.clientX - hostRect.left - state.offsetX;
    const localY = event.clientY - hostRect.top - state.offsetY;
    const insideX = localX >= 0 && localX <= state.width;
    const insideY = localY >= 0 && localY <= state.height;

    if (!insideX || !insideY) {
      state.pointerActive = false;
      return;
    }

    state.pointerActive = true;
    state.pointerX = localX;
    state.pointerY = localY;
  }

  function onPointerLeave() {
    state.pointerActive = false;
  }

  host.addEventListener("pointermove", onPointerMove, { passive: true });
  host.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("resize", resizeBackdrop);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stopBackdrop();
      return;
    }

    startBackdrop();
  });

  reducedMotionQuery.addEventListener("change", () => {
    if (reducedMotionQuery.matches) {
      stopBackdrop();
      drawBackdrop(performance.now(), true);
      return;
    }

    startBackdrop();
  });

  resizeBackdrop();
  startBackdrop();
}

syncGraphicDesignArchiveLetterFrames();
initGraphicDesignArchiveScrollReveal();
initGraphicDesignArchivePopup();
initGraphicDesignParticleBackdrop();
initInteractiveWorkLiveSync();

function initInteractiveWorkLiveSync() {
  const interactiveSection = document.querySelector(".photo-poster--interactive");
  const gateLayer = interactiveSection?.querySelector("[data-interactive-work-gate]");
  const cameraToggle = interactiveSection?.querySelector("[data-interactive-camera-toggle]");
  const cameraPreview = interactiveSection?.querySelector("[data-interactive-camera-preview]");
  const liveVideo = interactiveSection?.querySelector("[data-interactive-live-video]");
  const liveCanvas = interactiveSection?.querySelector("[data-interactive-live-bg]");
  const projectStrip = interactiveSection?.querySelector("#projects");
  const projectCards = Array.from(projectStrip?.querySelectorAll(".photo-poster__item[data-interactive-hue]") ?? []);

  if (!interactiveSection || !liveCanvas || !projectStrip || projectCards.length === 0) {
    return;
  }

  const context = liveCanvas.getContext("2d");

  if (!context) {
    return;
  }

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const bodyElement = document.body;
  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    frameId: 0,
    visible: true,
    particles: [],
    shards: [],
    weaveLines: [],
    activeIndex: 0,
    defaultIndex: 0,
    targetHue: Number(projectCards[0].dataset.interactiveHue) || 214,
    currentHue: Number(projectCards[0].dataset.interactiveHue) || 214,
    flowX: 0,
    flowY: 0,
    pointerInside: false,
    pointerX: 0,
    pointerY: 0,
    pointerDrawX: 0,
    pointerDrawY: 0,
    currentPreviewPath: "",
    previewToken: "",
    isOpen: false,
    cameraStream: null,
    cameraActive: false,
    cameraStarting: false,
    cameraDetector: ("FaceDetector" in window) ? new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 }) : null,
    cameraTemplate: [],
    cameraMotion: 0,
    cameraConfidence: 0,
    cameraLastCenterX: 0,
    cameraLastCenterY: 0,
    cameraLastTrackAt: 0,
    cameraWorking: false,
    audioLevel: 0,
    audioBass: 0,
    audioMid: 0,
    audioTreble: 0,
    audioEnergy: 0,
    audioEnergyAverage: 0,
    beatPulse: 0,
    lastBeatAt: 0,
    beatCount: 0,
    introPattern: 0
  };

  state.isOpen = Boolean(bodyElement?.classList.contains("is-interactive-work-open"));

  function clampInteractive(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function randomInteractive(min, max) {
    return min + Math.random() * (max - min);
  }

  function hueInteractive(alpha, saturation = 88, lightness = 64, hueShift = 0) {
    const safeAlpha = clampInteractive(alpha, 0, 1);
    return `rgba(0, 0, 0, ${safeAlpha})`;
  }

  function syncInteractiveCameraButton() {
    if (!cameraToggle) {
      return;
    }

    const hasCameraSupport = Boolean(
      cameraPreview &&
      navigator.mediaDevices?.getUserMedia &&
      (
        window.isSecureContext ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      )
    );

    if (!hasCameraSupport) {
      cameraToggle.textContent = "NO CAM";
      cameraToggle.classList.remove("is-active", "is-playing");
      cameraToggle.setAttribute("aria-pressed", "false");
      cameraToggle.setAttribute("aria-label", "Camera is unavailable in this browser context");
      cameraToggle.disabled = true;
      cameraPreview?.classList.remove("is-active");
      return;
    }

    if (state.cameraStarting) {
      cameraToggle.textContent = "OPENING";
      cameraToggle.classList.add("is-active");
      cameraToggle.setAttribute("aria-pressed", "true");
      cameraToggle.setAttribute("aria-label", "Opening camera for face tracking");
      cameraToggle.disabled = true;
      cameraPreview?.classList.add("is-active");
      return;
    }

    cameraToggle.disabled = false;
    cameraToggle.classList.toggle("is-active", state.cameraActive);
    cameraToggle.classList.toggle("is-playing", state.cameraActive);
    cameraToggle.textContent = state.cameraActive ? "CAM ON" : "CAMERA";
    cameraToggle.setAttribute("aria-pressed", state.cameraActive ? "true" : "false");
    cameraToggle.setAttribute("aria-label", state.cameraActive ? "Close camera face tracking" : "Open camera for face tracking");
    cameraPreview?.classList.toggle("is-active", state.cameraActive);
  }

  function clampCameraCrop(crop, width, height) {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    const sx = clampInteractive(crop.sx, 0, safeWidth - 1);
    const sy = clampInteractive(crop.sy, 0, safeHeight - 1);
    const maxWidth = Math.max(1, safeWidth - sx);
    const maxHeight = Math.max(1, safeHeight - sy);
    const sw = clampInteractive(crop.sw, 1, maxWidth);
    const sh = clampInteractive(crop.sh, 1, maxHeight);
    return { sx, sy, sw, sh };
  }

  function getFallbackCameraCrop(width, height) {
    return {
      sx: width * 0.22,
      sy: height * 0.14,
      sw: width * 0.56,
      sh: height * 0.72
    };
  }

  function detectSubjectCropFromCamera(source, sourceWidth, sourceHeight) {
    const sampleCanvas = document.createElement("canvas");
    const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });

    if (!sampleContext || sourceWidth < 2 || sourceHeight < 2) {
      return getFallbackCameraCrop(sourceWidth, sourceHeight);
    }

    const sampleWidth = 96;
    const sampleHeight = Math.max(48, Math.round(sampleWidth * (sourceHeight / sourceWidth)));
    sampleCanvas.width = sampleWidth;
    sampleCanvas.height = sampleHeight;
    sampleContext.drawImage(source, 0, 0, sampleWidth, sampleHeight);
    const { data } = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight);

    let minX = sampleWidth;
    let minY = sampleHeight;
    let maxX = 0;
    let maxY = 0;
    let hits = 0;

    for (let y = 1; y < sampleHeight - 1; y += 1) {
      for (let x = 1; x < sampleWidth - 1; x += 1) {
        const offset = (y * sampleWidth + x) * 4;
        const luminance = data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
        const rightOffset = (y * sampleWidth + (x + 1)) * 4;
        const downOffset = ((y + 1) * sampleWidth + x) * 4;
        const rightLum = data[rightOffset] * 0.2126 + data[rightOffset + 1] * 0.7152 + data[rightOffset + 2] * 0.0722;
        const downLum = data[downOffset] * 0.2126 + data[downOffset + 1] * 0.7152 + data[downOffset + 2] * 0.0722;
        const darkness = 1 - (luminance / 255);
        const contrast = (Math.abs(luminance - rightLum) + Math.abs(luminance - downLum)) / 255;
        const centerBias = 1 - Math.min(1, Math.hypot((x / sampleWidth) - 0.5, (y / sampleHeight) - 0.5) * 1.5);
        const score = darkness * 0.8 + contrast * 1.04 + centerBias * 0.25;

        if (score < 0.36) {
          continue;
        }

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        hits += 1;
      }
    }

    if (hits < 70) {
      return getFallbackCameraCrop(sourceWidth, sourceHeight);
    }

    const paddingX = Math.max(6, (maxX - minX) * 0.24);
    const paddingY = Math.max(8, (maxY - minY) * 0.3);

    return clampCameraCrop({
      sx: ((minX - paddingX) / sampleWidth) * sourceWidth,
      sy: ((minY - paddingY) / sampleHeight) * sourceHeight,
      sw: ((maxX - minX + paddingX * 2) / sampleWidth) * sourceWidth,
      sh: ((maxY - minY + paddingY * 2) / sampleHeight) * sourceHeight
    }, sourceWidth, sourceHeight);
  }

  function buildCameraFaceTemplate(source, crop) {
    const sampleCanvas = document.createElement("canvas");
    const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });

    if (!sampleContext) {
      return null;
    }

    const width = 180;
    const height = 240;
    sampleCanvas.width = width;
    sampleCanvas.height = height;
    sampleContext.fillStyle = "#ffffff";
    sampleContext.fillRect(0, 0, width, height);
    sampleContext.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);

    const { data } = sampleContext.getImageData(0, 0, width, height);
    const step = window.innerWidth < 720 ? 3 : 2;
    const points = [];
    let totalDarkness = 0;
    let totalContrast = 0;
    let totalEdge = 0;

    const minKeep = window.innerWidth < 720 ? 0.14 : 0.12;

    for (let y = 1; y < height - 1; y += step) {
      for (let x = 1; x < width - 1; x += step) {
        const offset = (y * width + x) * 4;
        const luminance = data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
        const rightOffset = (y * width + (x + 1)) * 4;
        const downOffset = ((y + 1) * width + x) * 4;
        const rightLum = data[rightOffset] * 0.2126 + data[rightOffset + 1] * 0.7152 + data[rightOffset + 2] * 0.0722;
        const downLum = data[downOffset] * 0.2126 + data[downOffset + 1] * 0.7152 + data[downOffset + 2] * 0.0722;
        const darkness = 1 - (luminance / 255);
        const contrast = (Math.abs(luminance - rightLum) + Math.abs(luminance - downLum)) / 510;
        const nx = x / (width - 1);
        const ny = y / (height - 1);
        const ellipse = (((nx - 0.5) ** 2) / 0.2) + (((ny - 0.5) ** 2) / 0.34);
        const faceWeight = Math.max(0, 1.2 - ellipse);
        const keep = darkness * 1.1 + contrast * 1.42 + faceWeight * 0.42;

        if (faceWeight <= 0 || keep < minKeep) {
          continue;
        }

        // Keep dense detail only where contrast is stronger to avoid noisy blobs.
        if (keep < 0.28 && ((x + y) % (step * 2)) !== 0) {
          continue;
        }

        points.push({
          x: (nx - 0.5) * 1.26,
          y: (ny - 0.52) * 1.68,
          z: (darkness - 0.28) * 0.72 + contrast * 0.56 + randomInteractive(-0.02, 0.02)
        });
        totalDarkness += darkness;
        totalContrast += contrast;
        totalEdge += Math.min(1, contrast * 1.55);
      }
    }

    const count = points.length;
    if (count < 12) {
      return null;
    }

    return {
      points,
      darkness: totalDarkness / count,
      contrast: totalContrast / count,
      edge: totalEdge / count,
      fill: clampInteractive(count / 520, 0, 1),
      centerX: (crop.sx + (crop.sw * 0.5)) / (source.videoWidth || 1),
      centerY: (crop.sy + (crop.sh * 0.5)) / (source.videoHeight || 1)
    };
  }

  function buildFallbackCameraFaceTemplate(source, crop) {
    const points = [];
    const rings = [1, 0.84, 0.68, 0.52];

    rings.forEach((ring, ringIndex) => {
      const count = Math.max(16, Math.round(34 * ring));
      for (let index = 0; index < count; index += 1) {
        const ratio = index / count;
        const angle = ratio * Math.PI * 2;
        points.push({
          x: Math.cos(angle) * 0.5 * ring,
          y: Math.sin(angle) * 0.72 * ring - 0.04,
          z: 0.04 + ringIndex * 0.04
        });
      }
    });

    const eyeY = -0.18;
    const eyeRadius = 0.08;
    [-1, 1].forEach((side) => {
      const eyeX = side * 0.21;
      for (let index = 0; index < 18; index += 1) {
        const angle = (index / 18) * Math.PI * 2;
        points.push({
          x: eyeX + Math.cos(angle) * eyeRadius,
          y: eyeY + Math.sin(angle) * eyeRadius * 0.55,
          z: 0.16
        });
      }
    });

    for (let index = 0; index <= 22; index += 1) {
      const ratio = index / 22;
      const angle = Math.PI * (1 - ratio);
      points.push({
        x: Math.cos(angle) * 0.22,
        y: 0.25 + Math.sin(angle) * 0.08,
        z: 0.18
      });
    }

    return {
      points,
      darkness: 0.44,
      contrast: 0.42,
      edge: 0.38,
      fill: clampInteractive(points.length / 420, 0, 1),
      centerX: (crop.sx + (crop.sw * 0.5)) / (source.videoWidth || 1),
      centerY: (crop.sy + (crop.sh * 0.5)) / (source.videoHeight || 1)
    };
  }

  async function refreshInteractiveCameraTemplate(time = performance.now()) {
    if (
      !cameraPreview ||
      !state.cameraActive ||
      state.cameraStarting ||
      state.cameraWorking ||
      cameraPreview.readyState < 2 ||
      (time - state.cameraLastTrackAt) < 96
    ) {
      return;
    }

    state.cameraWorking = true;
    state.cameraLastTrackAt = time;

    try {
      const sourceWidth = cameraPreview.videoWidth || 0;
      const sourceHeight = cameraPreview.videoHeight || 0;

      if (sourceWidth < 2 || sourceHeight < 2) {
        return;
      }

      let crop = null;

      if (state.cameraDetector) {
        try {
          const faces = await state.cameraDetector.detect(cameraPreview);
          const face = faces?.[0];

          if (face?.boundingBox) {
            const box = face.boundingBox;
            crop = clampCameraCrop({
              sx: box.x - box.width * 0.22,
              sy: box.y - box.height * 0.26,
              sw: box.width * 1.44,
              sh: box.height * 1.6
            }, sourceWidth, sourceHeight);
          }
        } catch (error) {
          state.cameraDetector = null;
        }
      }

      if (!crop) {
        const detectedCrop = detectSubjectCropFromCamera(cameraPreview, sourceWidth, sourceHeight);
        const centerCrop = clampCameraCrop({
          sx: sourceWidth * 0.26,
          sy: sourceHeight * 0.16,
          sw: sourceWidth * 0.48,
          sh: sourceHeight * 0.68
        }, sourceWidth, sourceHeight);

        // Blend detected crop with centered crop to stay stable on low-light webcams.
        crop = clampCameraCrop({
          sx: detectedCrop.sx * 0.36 + centerCrop.sx * 0.64,
          sy: detectedCrop.sy * 0.36 + centerCrop.sy * 0.64,
          sw: detectedCrop.sw * 0.4 + centerCrop.sw * 0.6,
          sh: detectedCrop.sh * 0.4 + centerCrop.sh * 0.6
        }, sourceWidth, sourceHeight);
      }

      let analysis = buildCameraFaceTemplate(cameraPreview, crop);

      if (!analysis) {
        const centerCrop = clampCameraCrop({
          sx: sourceWidth * 0.26,
          sy: sourceHeight * 0.16,
          sw: sourceWidth * 0.48,
          sh: sourceHeight * 0.68
        }, sourceWidth, sourceHeight);
        analysis = buildCameraFaceTemplate(cameraPreview, centerCrop);
      }

      if (!analysis) {
        analysis = buildFallbackCameraFaceTemplate(cameraPreview, crop);
      }

      const motionDelta = Math.hypot(
        analysis.centerX - state.cameraLastCenterX,
        analysis.centerY - state.cameraLastCenterY
      );
      const motion = clampInteractive(motionDelta * 8.5, 0, 1);

      state.cameraTemplate = analysis.points;
      state.cameraConfidence += ((analysis.points.length / 260) - state.cameraConfidence) * 0.2;
      state.cameraMotion += (motion - state.cameraMotion) * 0.24;
      state.cameraLastCenterX = analysis.centerX;
      state.cameraLastCenterY = analysis.centerY;

      const nextBass = clampInteractive(analysis.fill * 0.86 + state.cameraMotion * 0.92, 0, 1);
      const nextMid = clampInteractive(analysis.contrast * 1.42 + analysis.darkness * 0.2, 0, 1);
      const nextTreble = clampInteractive(analysis.edge * 1.5 + state.cameraMotion * 0.24, 0, 1);
      const nextEnergy = nextBass * 0.58 + nextMid * 0.28 + nextTreble * 0.14;
      const nextLevel = clampInteractive(nextEnergy * 1.16 + state.cameraConfidence * 0.22 + state.cameraMotion * 0.34, 0, 1);

      state.audioBass += (nextBass - state.audioBass) * 0.24;
      state.audioMid += (nextMid - state.audioMid) * 0.22;
      state.audioTreble += (nextTreble - state.audioTreble) * 0.2;
      state.audioEnergy += (nextEnergy - state.audioEnergy) * 0.2;
      state.audioEnergyAverage += (state.audioEnergy - state.audioEnergyAverage) * 0.075;
      state.audioLevel += (nextLevel - state.audioLevel) * 0.16;
    } finally {
      state.cameraWorking = false;
    }
  }

  function updateInteractiveCameraReactiveState(time = performance.now()) {
    if (!state.cameraActive) {
      state.cameraConfidence += (0 - state.cameraConfidence) * 0.1;
      state.cameraMotion += (0 - state.cameraMotion) * 0.12;
      state.audioBass += (0 - state.audioBass) * 0.12;
      state.audioMid += (0 - state.audioMid) * 0.12;
      state.audioTreble += (0 - state.audioTreble) * 0.12;
      state.audioEnergy += (0 - state.audioEnergy) * 0.12;
      state.audioEnergyAverage += (0 - state.audioEnergyAverage) * 0.08;
      state.audioLevel += (0 - state.audioLevel) * 0.12;
      state.beatPulse += (0 - state.beatPulse) * 0.14;
      return;
    }

    void refreshInteractiveCameraTemplate(time);

    const beatThreshold = state.audioEnergyAverage * 1.18 + 0.05;
    const beatGap = time - state.lastBeatAt;
    const hasBeat = (
      state.audioEnergy > beatThreshold &&
      beatGap > 170 &&
      (state.cameraMotion > 0.08 || state.audioTreble > 0.2 || state.audioBass > 0.22)
    );

    if (hasBeat) {
      state.lastBeatAt = time;
      state.beatPulse = 1;
      state.beatCount += 1;

      if (!state.isOpen) {
        const jump = state.cameraMotion > 0.22 ? 2 : 1;
        state.introPattern = (state.introPattern + jump) % 4;
      }
    } else {
      state.beatPulse += (0 - state.beatPulse) * 0.14;
      if (state.beatPulse < 0.001) {
        state.beatPulse = 0;
      }
    }
  }

  async function stopInteractiveCamera() {
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach((track) => track.stop());
      state.cameraStream = null;
    }

    if (cameraPreview) {
      cameraPreview.pause();
      cameraPreview.srcObject = null;
    }

    state.cameraActive = false;
    state.cameraStarting = false;
    state.cameraWorking = false;
    state.cameraTemplate = [];
    syncInteractiveCameraButton();
    queueLiveBackdrop();
  }

  async function startInteractiveCamera() {
    if (state.cameraActive || state.cameraStarting || !cameraPreview) {
      syncInteractiveCameraButton();
      return;
    }

    const hasCameraSupport = Boolean(navigator.mediaDevices?.getUserMedia);
    const isSecureContextForCamera = (
      window.isSecureContext ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );

    if (!hasCameraSupport || !isSecureContextForCamera) {
      syncInteractiveCameraButton();
      return;
    }

    state.cameraStarting = true;
    syncInteractiveCameraButton();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 960 },
          height: { ideal: 960 }
        },
        audio: false
      });

      cameraPreview.srcObject = stream;
      await cameraPreview.play();
      state.cameraStream = stream;
      state.cameraActive = true;
      state.cameraLastTrackAt = 0;
      state.lastBeatAt = 0;
      state.beatPulse = 0;
      state.introPattern = 0;
      queueLiveBackdrop();
    } catch (error) {
      state.cameraActive = false;
      state.cameraStream = null;
    } finally {
      state.cameraStarting = false;
      syncInteractiveCameraButton();
    }
  }

  async function toggleInteractiveCamera(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (state.cameraActive) {
      await stopInteractiveCamera();
      return;
    }

    await startInteractiveCamera();
  }

  function getLiveFrameRect() {
    const rect = liveCanvas?.getBoundingClientRect();

    if (rect && rect.width > 0 && rect.height > 0) {
      return rect;
    }

    return {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  function playLiveVideo() {
    if (!liveVideo || !state.isOpen) {
      return;
    }

    const playPromise = liveVideo.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }

  function setLivePreview(path, force = false) {
    if (!liveVideo || !path || !state.isOpen) {
      return;
    }

    const nextPath = String(path).trim();

    if (!nextPath) {
      return;
    }

    if (!force && state.currentPreviewPath === nextPath) {
      playLiveVideo();
      return;
    }

    state.currentPreviewPath = nextPath;
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    state.previewToken = token;
    liveVideo.classList.remove("is-ready");

    const onReady = () => {
      if (state.previewToken !== token) {
        return;
      }

      liveVideo.classList.add("is-ready");
      playLiveVideo();
    };

    liveVideo.onloadeddata = onReady;
    liveVideo.setAttribute("src", nextPath);
    liveVideo.load();
    playLiveVideo();
  }

  function getCardAnchor(card) {
    const targetNode = card.querySelector(".photo-poster__item-media") || card;
    const cardRect = targetNode.getBoundingClientRect();
    const frameRect = getLiveFrameRect();

    if (!cardRect.width || !cardRect.height || !frameRect.width || !frameRect.height) {
      return null;
    }

    return {
      x: clampInteractive(cardRect.right - frameRect.left, 2, state.width - 2),
      y: clampInteractive(cardRect.top - frameRect.top + cardRect.height * 0.56, 2, state.height - 2)
    };
  }

  function buildParticles() {
    const isMobile = window.innerWidth < 720;
    const area = state.width * state.height;
    const count = clampInteractive(Math.round(area / 12200), isMobile ? 62 : 82, isMobile ? 138 : 196);
    const minX = state.width * (isMobile ? 0.34 : 0.3);
    const maxX = state.width + 28;
    const minY = -18;
    const maxY = state.height + 18;

    state.particles = Array.from({ length: count }, () => ({
      x: randomInteractive(minX, maxX),
      y: randomInteractive(0, state.height),
      vx: randomInteractive(-0.34, 0.24),
      vy: randomInteractive(-0.3, 0.3),
      drift: randomInteractive(0.2, 1),
      seed: randomInteractive(0, Math.PI * 2),
      orbit: randomInteractive(0.2, 0.9),
      size: randomInteractive(0.66, 2.1),
      minX,
      maxX,
      minY,
      maxY
    }));

    const shardCount = clampInteractive(Math.round(area / 34000), isMobile ? 18 : 24, isMobile ? 54 : 74);
    state.shards = Array.from({ length: shardCount }, () => ({
      x: randomInteractive(0, state.width),
      y: randomInteractive(0, state.height),
      vx: randomInteractive(-0.46, 0.46),
      vy: randomInteractive(-0.42, 0.42),
      life: randomInteractive(0.44, 1),
      decay: randomInteractive(0.0026, 0.0088),
      seed: randomInteractive(0, Math.PI * 2),
      size: randomInteractive(6, isMobile ? 22 : 32),
      minX: -24,
      maxX: state.width + 24,
      minY: -24,
      maxY: state.height + 24
    }));

    const weaveCount = clampInteractive(Math.round((state.width + state.height) / 90), isMobile ? 10 : 14, isMobile ? 22 : 30);
    state.weaveLines = Array.from({ length: weaveCount }, (_, index) => ({
      side: index % 4,
      seed: randomInteractive(0, Math.PI * 2),
      speed: randomInteractive(0.24, 0.92),
      amplitude: randomInteractive(isMobile ? 24 : 34, isMobile ? 66 : 94),
      alpha: randomInteractive(0.06, 0.18),
      width: randomInteractive(0.9, 2.6),
      targetBias: randomInteractive(0.06, 0.94)
    }));
  }

  function resizeLiveCanvas() {
    const frameRect = getLiveFrameRect();
    state.width = Math.max(1, Math.round(frameRect.width || window.innerWidth));
    state.height = Math.max(1, Math.round(frameRect.height || window.innerHeight));
    state.dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    liveCanvas.width = Math.max(1, Math.round(state.width * state.dpr));
    liveCanvas.height = Math.max(1, Math.round(state.height * state.dpr));
    liveCanvas.style.width = `${state.width}px`;
    liveCanvas.style.height = `${state.height}px`;
    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.flowX = state.width * 0.5;
    state.flowY = state.height * 0.52;
    state.pointerX = state.flowX;
    state.pointerY = state.flowY;
    state.pointerDrawX = state.flowX;
    state.pointerDrawY = state.flowY;
    buildParticles();
    drawLiveBackdrop(performance.now(), true);
  }

  function setInteractivePointer(event) {
    const frameRect = getLiveFrameRect();
    const localX = event.clientX - frameRect.left;
    const localY = event.clientY - frameRect.top;

    state.pointerX = clampInteractive(localX, 2, state.width - 2);
    state.pointerY = clampInteractive(localY, 2, state.height - 2);

    if (!state.pointerInside) {
      state.pointerDrawX = state.pointerX;
      state.pointerDrawY = state.pointerY;
    }

    state.pointerInside = true;

    if (reducedMotionQuery.matches) {
      drawLiveBackdrop(performance.now(), true);
      return;
    }

    queueLiveBackdrop();
  }

  function clearInteractivePointer() {
    state.pointerInside = false;

    if (reducedMotionQuery.matches) {
      drawLiveBackdrop(performance.now(), true);
      return;
    }

    queueLiveBackdrop();
  }

  function setActiveInteractiveCard(index) {
    const safeIndex = clampInteractive(index, 0, projectCards.length - 1);
    state.activeIndex = safeIndex;
    state.targetHue = Number(projectCards[safeIndex].dataset.interactiveHue) || state.targetHue;

    if (state.isOpen) {
      setLivePreview(projectCards[safeIndex].dataset.interactivePreview || "");
    }

    projectCards.forEach((card, cardIndex) => {
      const hue = Number(card.dataset.interactiveHue) || 214;
      card.style.setProperty("--interactive-item-hue", String(hue));
      card.classList.toggle("is-live-active", cardIndex === safeIndex);
    });

    if (reducedMotionQuery.matches) {
      state.currentHue = state.targetHue;
      drawLiveBackdrop(performance.now(), true);
      return;
    }

    queueLiveBackdrop();
  }

  function openInteractiveWorks() {
    if (!bodyElement || state.isOpen) {
      return;
    }

    state.isOpen = true;
    bodyElement.classList.add("is-interactive-work-open");
    setLivePreview(projectCards[state.activeIndex]?.dataset.interactivePreview || "", true);
    playLiveVideo();

    queueLiveBackdrop();
  }

  function closeInteractiveWorks() {
    if (!bodyElement || !state.isOpen) {
      return;
    }

    state.isOpen = false;
    bodyElement.classList.remove("is-interactive-work-open");
    if (liveVideo && !liveVideo.paused) {
      liveVideo.pause();
    }
    setActiveInteractiveCard(state.defaultIndex);
    queueLiveBackdrop();
  }

  function stepParticles(time, frozen = false) {
    const t = time * 0.001;
    const pointerTargetX = state.pointerInside ? state.pointerX : state.flowX;
    const pointerTargetY = state.pointerInside ? state.pointerY : state.flowY;

    state.pointerDrawX += (pointerTargetX - state.pointerDrawX) * (frozen ? 1 : 0.2);
    state.pointerDrawY += (pointerTargetY - state.pointerDrawY) * (frozen ? 1 : 0.2);

    if (frozen) {
      return;
    }

    state.particles.forEach((particle) => {
      const wobbleX = Math.cos(t * particle.drift + particle.seed) * 0.06;
      const wobbleY = Math.sin(t * (particle.drift + 0.24) + particle.seed * 1.2) * 0.08;
      const centerX = particle.x - state.flowX;
      const centerY = particle.y - state.flowY;
      const radialDistance = Math.hypot(centerX, centerY) + 1;
      const swirl = (particle.orbit * 0.052) / (1 + radialDistance * 0.0032);
      const swirlX = (-centerY / radialDistance) * swirl;
      const swirlY = (centerX / radialDistance) * swirl;
      const pullX = (state.flowX - particle.x) * 0.00032;
      const pullY = (state.flowY - particle.y) * 0.00026;

      particle.vx = clampInteractive((particle.vx + pullX + wobbleX + swirlX) * 0.992, -0.94, 0.94);
      particle.vy = clampInteractive((particle.vy + pullY + wobbleY + swirlY) * 0.992, -0.94, 0.94);

      if (state.pointerInside) {
        const dx = state.pointerDrawX - particle.x;
        const dy = state.pointerDrawY - particle.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 0.001 && distance < 210) {
          const strength = (1 - (distance / 210)) * 0.04;
          particle.vx += (dx / distance) * strength;
          particle.vy += (dy / distance) * strength;
        }
      }

      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < particle.minX) {
        particle.x = particle.maxX;
      } else if (particle.x > particle.maxX) {
        particle.x = particle.minX;
      }

      if (particle.y < particle.minY) {
        particle.y = particle.maxY;
      } else if (particle.y > particle.maxY) {
        particle.y = particle.minY;
      }
    });

    state.shards.forEach((shard) => {
      if (frozen) {
        return;
      }

      const wobbleX = Math.cos(t * 0.9 + shard.seed) * 0.06;
      const wobbleY = Math.sin(t * 0.76 + shard.seed * 1.2) * 0.06;
      const pullX = (state.flowX - shard.x) * 0.00012;
      const pullY = (state.flowY - shard.y) * 0.00012;

      shard.vx = clampInteractive((shard.vx + pullX + wobbleX) * 0.994, -1.14, 1.14);
      shard.vy = clampInteractive((shard.vy + pullY + wobbleY) * 0.994, -1.14, 1.14);
      shard.x += shard.vx;
      shard.y += shard.vy;
      shard.life -= shard.decay;

      if (shard.life <= 0 || shard.x < shard.minX || shard.x > shard.maxX || shard.y < shard.minY || shard.y > shard.maxY) {
        shard.x = randomInteractive(0, state.width);
        shard.y = randomInteractive(0, state.height);
        shard.vx = randomInteractive(-0.5, 0.5);
        shard.vy = randomInteractive(-0.5, 0.5);
        shard.life = randomInteractive(0.48, 1);
      }
    });
  }

  function drawInteractiveCameraFace(time, reactiveBoost) {
    if (!state.cameraActive || !state.cameraTemplate.length) {
      return false;
    }

    const faceScale = Math.min(state.width, state.height) * (0.24 + reactiveBoost * 0.04 + state.cameraConfidence * 0.08);
    const sampleStep = Math.max(1, Math.floor(state.cameraTemplate.length / 240));
    const points = [];
    const splitPulse = (Math.sin(time * (0.0018 + state.cameraMotion * 0.0012)) + 1) * 0.5;
    const splitBase = clampInteractive(
      0.14 + reactiveBoost * 0.36 + state.cameraMotion * 0.28 + splitPulse * 0.46,
      0.08,
      1.24
    );

    for (let index = 0; index < state.cameraTemplate.length; index += sampleStep) {
      const point = state.cameraTemplate[index];
      const wave = Math.sin(time * 0.0012 + point.z * 6 + index * 0.07) * (2.2 + reactiveBoost * 5.2);
      const depthOffset = point.z * (8 + reactiveBoost * 12);
      const tx = state.flowX + point.x * faceScale + wave * 0.22;
      const ty = state.flowY + point.y * faceScale * 1.04 + depthOffset;

      // Split each face region into drifting clusters, then let it stitch back.
      const clusterX = point.x >= 0 ? 1 : -1;
      const clusterY = point.y >= 0 ? 1 : -1;
      const localSplit = splitBase * (0.72 + Math.sin(time * 0.0021 + index * 0.19) * 0.28);
      const angleSeed = ((index * 13.7) + point.z * 49.1) % (Math.PI * 2);
      const splitRadius = faceScale * (0.06 + localSplit * 0.17);
      const jitterRadius = faceScale * (0.02 + localSplit * 0.09);

      const splitX = clusterX * splitRadius + Math.cos(angleSeed + time * 0.0008) * jitterRadius;
      const splitY = clusterY * splitRadius * 0.9 + Math.sin(angleSeed + time * 0.00095) * jitterRadius * 0.82;
      const x = tx + splitX;
      const y = ty + splitY;

      points.push({ x, y, z: point.z, tx, ty, localSplit });
    }

    if (points.length < 8) {
      return false;
    }

    const meshDistance = Math.min(state.width, state.height) * (0.14 + reactiveBoost * 0.05 + splitBase * 0.02);
    context.lineWidth = 1.18 + reactiveBoost * 1.42 + state.cameraConfidence * 0.4;

    for (let index = 0; index < points.length; index += 1) {
      const pointA = points[index];
      const limit = Math.min(points.length, index + 9);

      for (let nextIndex = index + 1; nextIndex < limit; nextIndex += 1) {
        const pointB = points[nextIndex];
        const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);

        if (distance > meshDistance) {
          continue;
        }

        const alpha = (1 - (distance / meshDistance)) * (0.28 + reactiveBoost * 0.34 + state.cameraConfidence * 0.26);
        context.strokeStyle = hueInteractive(alpha, 98, 74, 0);
        context.beginPath();
        context.moveTo(pointA.x, pointA.y);
        context.lineTo(pointB.x, pointB.y);
        context.stroke();
      }
    }

    // Stitch lines show pieces reconnecting into a face structure.
    for (let index = 0; index < points.length; index += 3) {
      const point = points[index];
      const stitchAlpha = clampInteractive(
        0.08 + point.localSplit * 0.34 + reactiveBoost * 0.12 + state.cameraConfidence * 0.12,
        0,
        0.62
      );
      context.strokeStyle = hueInteractive(stitchAlpha, 96, 78, 0);
      context.lineWidth = 0.52 + point.localSplit * 1.08;
      context.beginPath();
      context.moveTo(point.x, point.y);
      context.lineTo(point.tx, point.ty);
      context.stroke();
    }

    points.forEach((point) => {
      const nodeSize = 1.1 + reactiveBoost * 1.7 + Math.max(0, point.z) * 1.3;
      context.fillStyle = hueInteractive(0.52 + reactiveBoost * 0.26 + state.cameraConfidence * 0.18, 98, 84, 0);
      context.fillRect(point.x - (nodeSize * 0.5), point.y - (nodeSize * 0.5), nodeSize, nodeSize);
    });

    return true;
  }

  function drawLiveBackdrop(time = 0, frozen = false) {
    if (!context) {
      return;
    }

    const isFrozen = frozen || reducedMotionQuery.matches;
    const isOpen = state.isOpen;
    state.currentHue += (state.targetHue - state.currentHue) * (isFrozen ? 1 : 0.12);
    stepParticles(time, isFrozen);
    updateInteractiveCameraReactiveState(time);
    const audioBoost = isOpen ? 0 : state.audioLevel;
    const beatBoost = isOpen ? 0 : state.beatPulse;
    const reactiveBoost = clampInteractive(audioBoost * 0.7 + beatBoost * 0.8, 0, 1.8);

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    context.clearRect(0, 0, state.width, state.height);

    if (!isOpen) {
      const introBackground = context.createRadialGradient(
        state.flowX,
        state.flowY,
        0,
        state.flowX,
        state.flowY,
        Math.max(state.width, state.height) * 0.74
      );
      introBackground.addColorStop(0, "rgba(248, 248, 248, 0.88)");
      introBackground.addColorStop(0.52, "rgba(244, 244, 244, 0.7)");
      introBackground.addColorStop(1, "rgba(255, 255, 255, 1)");
      context.fillStyle = introBackground;
      context.fillRect(0, 0, state.width, state.height);
    }

    const linkDistance = window.innerWidth < 720
      ? (isOpen ? 126 : 146 + reactiveBoost * 56)
      : (isOpen ? 168 : 212 + reactiveBoost * 72);
    for (let index = 0; index < state.particles.length; index += 1) {
      const particleA = state.particles[index];

      for (let nextIndex = index + 1; nextIndex < state.particles.length; nextIndex += 1) {
        const particleB = state.particles[nextIndex];
        const dx = particleB.x - particleA.x;
        const dy = particleB.y - particleA.y;
        const distance = Math.hypot(dx, dy);

        if (!distance || distance > linkDistance) {
          continue;
        }

        const alpha = (1 - (distance / linkDistance)) ** 2 * (isOpen ? 0.28 : 0.42 + reactiveBoost * 0.28);
        context.strokeStyle = hueInteractive(alpha, isOpen ? 86 : 92, isOpen ? 66 : 74, isOpen ? 2 : 8);
        context.lineWidth = isOpen ? 0.6 + alpha * 2.6 : 0.9 + alpha * 2.9 + reactiveBoost * 1.08;
        context.beginPath();
        context.moveTo(particleA.x, particleA.y);
        context.lineTo(particleB.x, particleB.y);
        context.stroke();
      }
    }

    const wideDistance = window.innerWidth < 720 ? 224 + reactiveBoost * 38 : 306 + reactiveBoost * 52;
    for (let index = 0; index < state.particles.length; index += 2) {
      const particleA = state.particles[index];
      const limit = Math.min(state.particles.length, index + 36);

      for (let nextIndex = index + 2; nextIndex < limit; nextIndex += 4) {
        const particleB = state.particles[nextIndex];
        const dx = particleB.x - particleA.x;
        const dy = particleB.y - particleA.y;
        const distance = Math.hypot(dx, dy);

        if (!distance || distance > wideDistance) {
          continue;
        }

        const alpha = (1 - (distance / wideDistance)) ** 1.7 * (isOpen ? 0.1 : 0.14 + reactiveBoost * 0.12);
        context.strokeStyle = hueInteractive(alpha, 96, 70, 0);
        context.lineWidth = 0.28 + alpha * 1.14 + reactiveBoost * 0.5;
        context.beginPath();
        context.moveTo(particleA.x, particleA.y);
        context.lineTo(particleB.x, particleB.y);
        context.stroke();
      }
    }

    state.particles.forEach((particle) => {
      const pulse = (Math.sin(time * 0.0015 + particle.seed) + 1) * 0.5;
      context.fillStyle = hueInteractive(
        isOpen ? 0.22 + pulse * 0.36 : 0.28 + pulse * 0.46,
        isOpen ? 94 : 98,
        isOpen ? 82 : 84,
        isOpen ? 10 : 14
      );

      if (isOpen) {
        context.beginPath();
        context.arc(
          particle.x,
          particle.y,
          particle.size * (0.76 + pulse * 0.84),
          0,
          Math.PI * 2
        );
        context.fill();
        return;
      }

      const introSize = particle.size * (1.16 + pulse * 1.18 + reactiveBoost * 0.92);
      const spin = time * (0.0012 + reactiveBoost * 0.0004) + particle.seed;
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(spin);
      context.fillRect(-introSize * 0.56, -introSize * 0.56, introSize * 1.12, introSize * 1.12);
      context.restore();
    });

    state.shards.forEach((shard, index) => {
      const spin = time * 0.0016 + shard.seed;
      const dx = Math.cos(spin) * shard.size;
      const dy = Math.sin(spin) * shard.size * 0.62;
      const alpha = (0.06 + shard.life * 0.16) * (isOpen ? 0.8 : 1 + reactiveBoost * 0.52);

      context.strokeStyle = hueInteractive(alpha, 96, 72, 0);
      context.lineWidth = 0.48 + shard.life * 1.2;
      context.beginPath();
      context.moveTo(shard.x - dx * 0.46, shard.y - dy * 0.46);
      context.lineTo(shard.x + dx * 0.46, shard.y + dy * 0.46);
      context.stroke();

      if (index % 3 === 0) {
        context.strokeStyle = hueInteractive(alpha * 0.52, 98, 70, 0);
        context.lineWidth = 0.34 + shard.life * 0.8;
        context.beginPath();
        context.moveTo(shard.x + dy * 0.24, shard.y - dx * 0.24);
        context.lineTo(shard.x - dy * 0.24, shard.y + dx * 0.24);
        context.stroke();
      }
    });

    if (isOpen) {
      const anchors = projectCards
        .map((card) => getCardAnchor(card))
        .filter((anchor) => anchor !== null);

      anchors.forEach((anchor, index) => {
        const isActive = index === state.activeIndex;
        const wave = Math.sin(time * 0.0017 + index * 0.74);
        const controlPoint = {
          x: state.flowX + wave * state.width * 0.014,
          y: state.flowY + (anchor.y - state.flowY) * 0.44 + Math.cos(time * 0.0015 + index) * state.height * 0.03
        };
        const strength = isActive ? 1 : 0.58;

        context.strokeStyle = hueInteractive(0.08 * strength, 88, 82, 18);
        context.lineWidth = isActive ? 4.6 : 2.4;
        context.beginPath();
        context.moveTo(anchor.x, anchor.y);
        context.quadraticCurveTo(controlPoint.x, controlPoint.y, state.flowX, state.flowY);
        context.stroke();

        context.strokeStyle = hueInteractive((isActive ? 0.42 : 0.2) * strength, 90, 64, 2);
        context.lineWidth = isActive ? 1.8 : 0.96;
        context.beginPath();
        context.moveTo(anchor.x, anchor.y);
        context.quadraticCurveTo(controlPoint.x, controlPoint.y, state.flowX, state.flowY);
        context.stroke();

        const branchAngle = Math.sin(time * 0.0018 + index) * 0.42;
        const branchX = anchor.x + (state.flowX - anchor.x) * 0.38 + Math.cos(branchAngle) * state.width * 0.03;
        const branchY = anchor.y + (state.flowY - anchor.y) * 0.38 + Math.sin(branchAngle) * state.height * 0.03;
        context.strokeStyle = hueInteractive(0.08 * strength, 90, 68, 0);
        context.lineWidth = 0.72;
        context.beginPath();
        context.moveTo(anchor.x, anchor.y);
        context.quadraticCurveTo(branchX, branchY, state.flowX, state.flowY);
        context.stroke();
      });

      const activeAnchor = anchors[state.activeIndex];
      if (activeAnchor) {
        const pointerPoint = {
          x: state.pointerDrawX,
          y: state.pointerDrawY
        };
        const controlA = {
          x: pointerPoint.x + (state.flowX - pointerPoint.x) * 0.48,
          y: pointerPoint.y + (state.flowY - pointerPoint.y) * 0.38
        };
        const controlB = {
          x: activeAnchor.x + (state.flowX - activeAnchor.x) * 0.44,
          y: activeAnchor.y + (state.flowY - activeAnchor.y) * 0.36
        };

        for (let trailIndex = 0; trailIndex < 3; trailIndex += 1) {
          const spread = trailIndex - 1;
          context.strokeStyle = hueInteractive(0.12 + trailIndex * 0.06, 94, 72, 0);
          context.lineWidth = 2.8 - trailIndex * 0.66;
          context.beginPath();
          context.moveTo(pointerPoint.x, pointerPoint.y);
          context.quadraticCurveTo(
            controlA.x + spread * state.width * 0.01,
            controlA.y + spread * state.height * 0.02,
            state.flowX,
            state.flowY
          );
          context.stroke();
        }

        context.strokeStyle = hueInteractive(0.34, 90, 68, 0);
        context.lineWidth = 1.18;
        context.beginPath();
        context.moveTo(activeAnchor.x, activeAnchor.y);
        context.quadraticCurveTo(controlB.x, controlB.y, state.flowX, state.flowY);
        context.stroke();
      }
    } else if (state.cameraActive && state.cameraTemplate.length > 8) {
      drawInteractiveCameraFace(time, reactiveBoost);
    } else {
      const introTime = time * 0.001;
      const patternMode = state.introPattern;
      const baseLayerCount = window.innerWidth < 720 ? 2 : 3;
      const modeLayerAdd = patternMode === 2 || patternMode === 3 ? 1 : 0;
      const layerCount = baseLayerCount + (reactiveBoost > 0.58 ? 1 : 0) + modeLayerAdd;
      const baseVertexCount = window.innerWidth < 720 ? 6 : 8;
      const vertexCount = patternMode === 1
        ? baseVertexCount + 2
        : patternMode === 3
          ? Math.max(5, baseVertexCount - 1)
          : baseVertexCount;
      const pointerOffsetX = state.pointerInside ? (state.pointerDrawX - state.flowX) * 0.1 : 0;
      const pointerOffsetY = state.pointerInside ? (state.pointerDrawY - state.flowY) * 0.1 : 0;
      const layerPoints = [];

      for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
        const radiusX = state.width * (0.1 + layerIndex * 0.07 + reactiveBoost * 0.028 + state.audioBass * 0.02);
        const radiusY = state.height * (0.08 + layerIndex * 0.058 + reactiveBoost * 0.022 + state.audioMid * 0.016);
        const spinSpeed = 0.3 + layerIndex * 0.12 + reactiveBoost * 0.24 + (patternMode === 2 ? 0.2 : 0) + (patternMode === 3 ? 0.14 : 0);
        const spin = introTime * spinSpeed + layerIndex * 0.6;
        const points = [];

        for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex += 1) {
          const ratio = vertexIndex / vertexCount;
          const angle = ratio * Math.PI * 2 + spin;
          const jitterBase = Math.sin(introTime * 1.6 + vertexIndex * 0.8 + layerIndex) * state.width * 0.012;
          const audioJitter = Math.cos(introTime * (8 + patternMode * 0.9) + vertexIndex * 1.3 + layerIndex) * state.width * 0.012 * reactiveBoost;
          const jitter = jitterBase + audioJitter;
          const modeSkewX = patternMode === 2
            ? Math.sin(introTime * 0.9 + layerIndex + vertexIndex * 0.34) * state.width * (0.01 + reactiveBoost * 0.008)
            : 0;
          const modeSkewY = patternMode === 3
            ? Math.cos(introTime * 1.1 + vertexIndex + layerIndex * 0.5) * state.height * (0.012 + reactiveBoost * 0.008)
            : 0;
          const x = state.flowX + Math.cos(angle) * (radiusX + jitter) + pointerOffsetX * (0.2 + layerIndex * 0.1) + modeSkewX;
          const y = state.flowY + Math.sin(angle) * (radiusY + jitter * 0.56) + pointerOffsetY * (0.2 + layerIndex * 0.1) + modeSkewY;
          points.push({ x, y });
        }

        layerPoints.push(points);

        for (let vertexIndex = 0; vertexIndex < points.length; vertexIndex += 1) {
          const nextIndex = (vertexIndex + 1) % points.length;
          const skipStep = patternMode === 1
            ? Math.max(2, Math.floor(points.length / 3))
            : patternMode === 2
              ? Math.max(2, Math.floor(points.length / 2))
              : patternMode === 3
                ? 3
                : 2;
          const skipIndex = (vertexIndex + skipStep) % points.length;

          context.strokeStyle = hueInteractive(
            0.22 - layerIndex * 0.04 + reactiveBoost * 0.12 + state.audioBass * 0.08,
            96,
            76,
            0
          );
          context.lineWidth = 1.2 - layerIndex * 0.22 + reactiveBoost * 0.62;
          context.beginPath();
          context.moveTo(points[vertexIndex].x, points[vertexIndex].y);
          context.lineTo(points[nextIndex].x, points[nextIndex].y);
          context.stroke();

          context.strokeStyle = hueInteractive(
            0.08 + layerIndex * 0.02 + reactiveBoost * 0.08 + state.audioTreble * 0.06,
            96,
            70,
            0
          );
          context.lineWidth = 0.6 + reactiveBoost * 0.46;
          context.beginPath();
          context.moveTo(points[vertexIndex].x, points[vertexIndex].y);
          context.lineTo(points[skipIndex].x, points[skipIndex].y);
          context.stroke();

          if (patternMode === 1 && vertexIndex % 2 === 0) {
            context.strokeStyle = hueInteractive(0.12 + reactiveBoost * 0.08, 96, 72, 0);
            context.lineWidth = 0.72 + reactiveBoost * 0.42;
            context.beginPath();
            context.moveTo(points[vertexIndex].x, points[vertexIndex].y);
            context.lineTo(state.flowX, state.flowY);
            context.stroke();
          }
        }
      }

      for (let layerIndex = 1; layerIndex < layerPoints.length; layerIndex += 1) {
        const prevLayer = layerPoints[layerIndex - 1];
        const currentLayer = layerPoints[layerIndex];
        const total = Math.min(prevLayer.length, currentLayer.length);

        for (let vertexIndex = 0; vertexIndex < total; vertexIndex += 1) {
          const offset = patternMode === 2 ? 2 : 1;
          const nextIndex = (vertexIndex + offset) % total;

          context.strokeStyle = hueInteractive(0.14 + layerIndex * 0.04 + reactiveBoost * 0.08, 96, 74, 0);
          context.lineWidth = 0.72 + layerIndex * 0.22 + reactiveBoost * 0.52;
          context.beginPath();
          context.moveTo(prevLayer[vertexIndex].x, prevLayer[vertexIndex].y);
          context.lineTo(currentLayer[vertexIndex].x, currentLayer[vertexIndex].y);
          context.stroke();

          context.strokeStyle = hueInteractive(0.08 + layerIndex * 0.02 + reactiveBoost * 0.06, 96, 70, 0);
          context.lineWidth = 0.52 + reactiveBoost * 0.34;
          context.beginPath();
          context.moveTo(prevLayer[vertexIndex].x, prevLayer[vertexIndex].y);
          context.lineTo(currentLayer[nextIndex].x, currentLayer[nextIndex].y);
          context.stroke();
        }
      }

      const centerLayer = layerPoints[0] || [];
      centerLayer.forEach((point, index) => {
        context.strokeStyle = hueInteractive(0.16 + (index % 3) * 0.03 + reactiveBoost * 0.1, 98, 74, 0);
        context.lineWidth = 0.94 + reactiveBoost * 0.44;
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(state.flowX, state.flowY);
        context.stroke();
      });

      if (patternMode === 2) {
        const gridCols = window.innerWidth < 720 ? 5 : 7;
        const gridRows = window.innerWidth < 720 ? 4 : 6;
        const gridW = state.width * (0.18 + reactiveBoost * 0.06);
        const gridH = state.height * (0.14 + reactiveBoost * 0.05);

        for (let colIndex = 0; colIndex <= gridCols; colIndex += 1) {
          const ratio = colIndex / gridCols;
          const x = state.flowX - gridW * 0.5 + gridW * ratio + Math.sin(introTime * 1.3 + colIndex) * gridW * 0.04;
          context.strokeStyle = hueInteractive(0.08 + reactiveBoost * 0.08, 98, 70, 0);
          context.lineWidth = 0.5 + reactiveBoost * 0.34;
          context.beginPath();
          context.moveTo(x, state.flowY - gridH * 0.5);
          context.lineTo(x, state.flowY + gridH * 0.5);
          context.stroke();
        }

        for (let rowIndex = 0; rowIndex <= gridRows; rowIndex += 1) {
          const ratio = rowIndex / gridRows;
          const y = state.flowY - gridH * 0.5 + gridH * ratio + Math.cos(introTime * 1.12 + rowIndex) * gridH * 0.04;
          context.strokeStyle = hueInteractive(0.08 + reactiveBoost * 0.08, 98, 70, 0);
          context.lineWidth = 0.5 + reactiveBoost * 0.34;
          context.beginPath();
          context.moveTo(state.flowX - gridW * 0.5, y);
          context.lineTo(state.flowX + gridW * 0.5, y);
          context.stroke();
        }
      }

      if (state.pointerInside) {
        for (let introTrail = 0; introTrail < 3; introTrail += 1) {
          const spread = introTrail - 1;
          const midX = state.pointerDrawX + (state.flowX - state.pointerDrawX) * (0.44 + introTrail * 0.08) + spread * state.width * 0.012;
          const midY = state.pointerDrawY + (state.flowY - state.pointerDrawY) * (0.34 + introTrail * 0.08) + spread * state.height * 0.018;
          context.strokeStyle = hueInteractive(0.24 + introTrail * 0.08 + reactiveBoost * 0.12, 98, 72, 0);
          context.lineWidth = 2.4 - introTrail * 0.62 + reactiveBoost * 0.84;
          context.beginPath();
          context.moveTo(state.pointerDrawX, state.pointerDrawY);
          context.lineTo(midX, midY);
          context.lineTo(state.flowX + spread * state.width * 0.008, state.flowY + spread * state.height * 0.01);
          context.stroke();
        }
      }

      if (reactiveBoost > 0.03) {
        const rayCount = patternMode === 3
          ? (window.innerWidth < 720 ? 14 : 22)
          : (window.innerWidth < 720 ? 10 : 16);
        const rayRadius = Math.min(state.width, state.height) * (0.06 + reactiveBoost * 0.08 + (patternMode === 3 ? 0.03 : 0));

        for (let rayIndex = 0; rayIndex < rayCount; rayIndex += 1) {
          const angle = (rayIndex / rayCount) * Math.PI * 2 + introTime * (0.8 + reactiveBoost * 1.8 + patternMode * 0.28);
          const rayX = state.flowX + Math.cos(angle) * rayRadius;
          const rayY = state.flowY + Math.sin(angle) * rayRadius;
          context.strokeStyle = hueInteractive(0.18 + reactiveBoost * 0.24, 98, 74, 0);
          context.lineWidth = 0.9 + reactiveBoost * 0.84;
          context.beginPath();
          context.moveTo(state.flowX, state.flowY);
          context.lineTo(rayX, rayY);
          context.stroke();
        }
      }
    }

    if (state.weaveLines.length) {
      const weaveT = time * 0.001;
      state.weaveLines.forEach((line) => {
        const sidePhase = Math.sin(weaveT * line.speed + line.seed);
        let startX = 0;
        let startY = 0;

        if (line.side === 0) {
          startX = state.width * line.targetBias;
          startY = -20;
        } else if (line.side === 1) {
          startX = state.width + 20;
          startY = state.height * line.targetBias;
        } else if (line.side === 2) {
          startX = state.width * line.targetBias;
          startY = state.height + 20;
        } else {
          startX = -20;
          startY = state.height * line.targetBias;
        }

        const ctrlX = state.flowX + Math.cos(weaveT * 0.8 + line.seed) * line.amplitude;
        const ctrlY = state.flowY + Math.sin(weaveT * 0.88 + line.seed * 1.2) * line.amplitude * 0.7;
        const weaveBoost = isOpen ? 0 : reactiveBoost;
        context.strokeStyle = hueInteractive(line.alpha * (isOpen ? 0.86 : 1 + weaveBoost * 0.62), 90, 70, 0);
        context.lineWidth = line.width + weaveBoost * 0.52;
        context.beginPath();
        context.moveTo(startX, startY);
        context.quadraticCurveTo(ctrlX, ctrlY, state.flowX + sidePhase * line.amplitude * 0.2, state.flowY);
        context.stroke();
      });
    }

    const liveT = time * 0.001;
    if (isOpen) {
      const ambientNodeCount = 24;
      const orbitRadiusX = state.width * 0.3;
      const orbitRadiusY = state.height * 0.24;
      for (let nodeIndex = 0; nodeIndex < ambientNodeCount; nodeIndex += 1) {
        const ratio = ambientNodeCount === 1 ? 0 : nodeIndex / (ambientNodeCount - 1);
        const baseAngle = ratio * Math.PI * 2 + liveT * 0.18;
        const targetX = state.flowX + Math.cos(baseAngle) * orbitRadiusX;
        const targetY = state.flowY + Math.sin(baseAngle) * orbitRadiusY;
        const controlPoint = {
          x: state.flowX + Math.cos(baseAngle * 1.24 + liveT * 0.44) * orbitRadiusX * 0.52,
          y: state.flowY + Math.sin(baseAngle * 1.14 + liveT * 0.5) * orbitRadiusY * 0.52
        };
        const alpha = 0.08 + (nodeIndex % 3) * 0.036;

        context.strokeStyle = hueInteractive(alpha, 84, 66, -6);
        context.lineWidth = 1 + (nodeIndex % 2) * 0.48;
        context.beginPath();
        context.moveTo(state.flowX, state.flowY);
        context.quadraticCurveTo(controlPoint.x, controlPoint.y, targetX, targetY);
        context.stroke();
      }
    }

    if (!isOpen) {
      const corePulse = (Math.sin(liveT * 2.2) + 1) * 0.5;
      const coreGlow = context.createRadialGradient(
        state.flowX,
        state.flowY,
        0,
        state.flowX,
        state.flowY,
        Math.max(state.width, state.height) * 0.24
      );
      coreGlow.addColorStop(0, hueInteractive(0.46 + corePulse * 0.24 + reactiveBoost * 0.36, 98, 86, 24));
      coreGlow.addColorStop(0.36, hueInteractive(0.24 + reactiveBoost * 0.2, 96, 80, 10));
      coreGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
      const glowSize = Math.max(state.width, state.height) * (0.48 + reactiveBoost * 0.22);
      context.fillStyle = coreGlow;
      context.fillRect(
        state.flowX - glowSize * 0.5,
        state.flowY - glowSize * 0.5,
        glowSize,
        glowSize
      );
    }

    if (isOpen) {
      context.fillStyle = hueInteractive(0.64, 96, 84, 18);
      context.beginPath();
      context.arc(state.flowX, state.flowY, 3.8, 0, Math.PI * 2);
      context.fill();
    } else {
      const diamondRadius = Math.max(8, Math.min(state.width, state.height) * (0.018 + reactiveBoost * 0.02));
      const spin = liveT * (0.64 + reactiveBoost * 1.5);
      context.save();
      context.translate(state.flowX, state.flowY);
      context.rotate(spin);
      context.fillStyle = hueInteractive(0.82 + reactiveBoost * 0.18, 98, 88, 0);
      context.beginPath();
      context.moveTo(0, -diamondRadius);
      context.lineTo(diamondRadius, 0);
      context.lineTo(0, diamondRadius);
      context.lineTo(-diamondRadius, 0);
      context.closePath();
      context.fill();
      context.strokeStyle = hueInteractive(0.42 + reactiveBoost * 0.2, 96, 80, 0);
      context.lineWidth = 1.24 + reactiveBoost * 1.26;
      context.stroke();
      context.restore();
    }

    if (isFrozen || !state.visible) {
      state.frameId = 0;
      return;
    }

    state.frameId = window.requestAnimationFrame(drawLiveBackdrop);
  }

  function queueLiveBackdrop() {
    if (state.frameId || reducedMotionQuery.matches || !state.visible) {
      return;
    }

    state.frameId = window.requestAnimationFrame(drawLiveBackdrop);
  }

  function stopLiveBackdrop() {
    if (!state.frameId) {
      return;
    }

    window.cancelAnimationFrame(state.frameId);
    state.frameId = 0;
  }

  function refreshLiveBackdrop() {
    resizeLiveCanvas();
    stopLiveBackdrop();
    drawLiveBackdrop(performance.now(), reducedMotionQuery.matches);
    queueLiveBackdrop();
  }

  projectCards.forEach((card, index) => {
    const hue = Number(card.dataset.interactiveHue) || 214;
    card.style.setProperty("--interactive-item-hue", String(hue));

    card.addEventListener("pointerenter", (event) => {
      setInteractivePointer(event);
      setActiveInteractiveCard(index);
    });

    card.addEventListener("pointermove", setInteractivePointer);

    card.addEventListener("focus", () => {
      setActiveInteractiveCard(index);
    });
  });

  interactiveSection.addEventListener("pointermove", setInteractivePointer, { passive: true });

  interactiveSection.addEventListener("pointerleave", () => {
    clearInteractivePointer();
    setActiveInteractiveCard(state.defaultIndex);
  });

  syncInteractiveCameraButton();

  cameraToggle?.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  cameraToggle?.addEventListener("click", toggleInteractiveCamera);

  cameraToggle?.addEventListener("keydown", (event) => {
    event.stopPropagation();
  });

  gateLayer?.addEventListener("pointerdown", (event) => {
    if (state.isOpen) {
      return;
    }

    if (event.target instanceof Element && event.target.closest("[data-interactive-camera-toggle]")) {
      return;
    }

    event.stopPropagation();
    openInteractiveWorks();
  });

  gateLayer?.addEventListener("keydown", (event) => {
    if (state.isOpen) {
      return;
    }

    if (event.target instanceof Element && event.target.closest("[data-interactive-camera-toggle]")) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openInteractiveWorks();
    }
  });

  interactiveSection.addEventListener("pointerdown", (event) => {
    if (!state.isOpen) {
      return;
    }

    if (!(event.target instanceof Element)) {
      closeInteractiveWorks();
      return;
    }

    const shouldIgnoreClose = Boolean(
      event.target.closest("[data-interactive-work-gate]") ||
      event.target.closest(".photo-poster__item") ||
      event.target.closest(".page-back") ||
      event.target.closest(".site-header") ||
      event.target.closest("[data-interactive-camera-toggle]") ||
      event.target.closest("[data-interactive-camera-preview]")
    );

    if (shouldIgnoreClose) {
      return;
    }

    closeInteractiveWorks();
  });

  window.addEventListener("keydown", (event) => {
    if (!state.isOpen) {
      return;
    }

    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    closeInteractiveWorks();
  });

  window.addEventListener("resize", refreshLiveBackdrop);
  window.addEventListener("beforeunload", () => {
    void stopInteractiveCamera();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      state.visible = Boolean(entry?.isIntersecting);

      if (!state.visible) {
        stopLiveBackdrop();
        if (liveVideo && !liveVideo.paused) {
          liveVideo.pause();
        }
        return;
      }

      if (state.isOpen) {
        playLiveVideo();
      }
      drawLiveBackdrop(performance.now(), reducedMotionQuery.matches);
      queueLiveBackdrop();
    }, {
      threshold: 0.1
    });

    observer.observe(interactiveSection);
  }

  reducedMotionQuery.addEventListener("change", () => {
    if (reducedMotionQuery.matches) {
      stopLiveBackdrop();
      drawLiveBackdrop(performance.now(), true);
      return;
    }

    queueLiveBackdrop();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void stopInteractiveCamera();
    }
  });

  setActiveInteractiveCard(state.defaultIndex);
  refreshLiveBackdrop();
}

function initTimedVideos() {
  const timedVideos = Array.from(document.querySelectorAll("video[data-max-seconds]"));

  if (!timedVideos.length) {
    return;
  }

  timedVideos.forEach((video) => {
    const maxSeconds = Number(video.dataset.maxSeconds);

    if (!Number.isFinite(maxSeconds) || maxSeconds <= 0) {
      return;
    }

    const mode = String(video.dataset.maxMode || (video.loop ? "loop" : "pause")).trim().toLowerCase();
    const epsilon = 0.08;

    const clampPlayback = () => {
      if (video.currentTime < maxSeconds - epsilon) {
        return;
      }

      if (mode === "loop") {
        video.currentTime = 0;
        if (video.paused && video.autoplay) {
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {});
          }
        }
        return;
      }

      video.currentTime = maxSeconds;
      if (!video.paused) {
        video.pause();
      }
    };

    video.addEventListener("loadedmetadata", () => {
      if (video.currentTime > maxSeconds) {
        video.currentTime = mode === "loop" ? 0 : maxSeconds;
      }
    });

    video.addEventListener("timeupdate", clampPlayback);
    video.addEventListener("seeking", () => {
      if (mode !== "loop" && video.currentTime > maxSeconds) {
        video.currentTime = maxSeconds;
      }
    });
  });
}

initTimedVideos();

function ensureGlobalSiteFootnote() {
  if (!document.body || document.querySelector("[data-site-footnote]")) {
    return;
  }

  const footer = document.createElement("footer");
  footer.className = "site-footnote";
  footer.setAttribute("data-site-footnote", "");
  footer.setAttribute("aria-label", "Site footnote");
  footer.innerHTML = `
    <div class="site-footnote__inner">
      <span class="site-footnote__brand">By PONGSANT CHINTANAPAKDEE</span>
      <nav class="site-footnote__nav" aria-label="Footer social links">
        <a
          class="site-footnote__link"
          href="https://www.instagram.com/prum20baht/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <svg class="site-footnote__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect x="3" y="3" width="18" height="18" rx="5" ry="5"></rect>
            <circle cx="12" cy="12" r="4.2"></circle>
            <circle cx="17.3" cy="6.7" r="1.15"></circle>
          </svg>
          <span class="sr-only">Instagram</span>
        </a>
        <a
          class="site-footnote__link"
          href="https://youtube.com/@prum20baht?si=_BRkFq7F7cHqmzJN"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
        >
          <svg class="site-footnote__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M21.6 8.3a3 3 0 0 0-2.1-2.1C17.6 5.7 12 5.7 12 5.7s-5.6 0-7.5.5a3 3 0 0 0-2.1 2.1c-.5 1.9-.5 3.7-.5 3.7s0 1.8.5 3.7a3 3 0 0 0 2.1 2.1c1.9.5 7.5.5 7.5.5s5.6 0 7.5-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-3.7.5-3.7s0-1.8-.5-3.7z"></path>
            <path d="M10 15.3l5.2-3.3L10 8.7z"></path>
          </svg>
          <span class="sr-only">YouTube</span>
        </a>
      </nav>
    </div>
  `;

  const main = document.querySelector("main");

  if (main && main.parentElement) {
    main.insertAdjacentElement("afterend", footer);
    return;
  }

  document.body.append(footer);
}

ensureGlobalSiteFootnote();
