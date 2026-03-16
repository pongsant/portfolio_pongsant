const hero = document.querySelector(".hero");
const canvas = document.querySelector("#particle-canvas");
const audioReactiveToggle = document.querySelector("#audio-reactive-toggle");
const audioReactiveStatus = document.querySelector("#audio-reactive-status");
const portraitCameraToggle = document.querySelector("#portrait-camera-toggle");
const portraitCameraPreview = document.querySelector("#portrait-camera-preview");
const body = document.body;
const header = document.querySelector(".site-header");
const workScene = document.querySelector(".work-hub__scene");
const workCanvas = document.querySelector("#my-work-canvas");
const workTrigger = document.querySelector("#my-work-trigger");
const workOptions = Array.from(document.querySelectorAll(".work-hub__option"));

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
  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const WORK_HUB_PALETTE = [
    { hue: 352, css: "#ff4b6e" },
    { hue: 28, css: "#ff8f2f" },
    { hue: 142, css: "#1bbc7d" },
    { hue: 214, css: "#2d73ff" },
    { hue: 286, css: "#b44dff" }
  ];

  const state = {
    width: 0,
    height: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    pointCount: window.innerWidth < 720 ? 2600 : 4600,
    points: [],
    textTargets: [],
    optionTargets: [],
    open: false,
    animationId: 0
  };

  function getWorkCenter() {
    return {
      x: state.width / 2,
      y: state.height / 2
    };
  }

  function getFittedWorkFontSize(text, maxWidth, maxHeight, startSize, weight = 700, minSize = 28) {
    let fontSize = startSize;

    while (fontSize > minSize) {
      measureContext.font = `${weight} ${fontSize}px "Helvetica Neue 5", "Helvetica Neue", Helvetica, Arial, sans-serif`;

      const metrics = measureContext.measureText(text);
      const textWidth = metrics.width;
      const textHeight = (metrics.actualBoundingBoxAscent || fontSize * 0.72) +
        (metrics.actualBoundingBoxDescent || fontSize * 0.18);

      if (textWidth <= maxWidth && textHeight <= maxHeight) {
        break;
      }

      fontSize -= 2;
    }

    return fontSize;
  }

  function randomBetweenWork(min, max) {
    return min + Math.random() * (max - min);
  }

  function shuffleWork(array) {
    for (let index = array.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
    }

    return array;
  }

  function getOptionOffset(option) {
    const mobile = window.innerWidth < 720;
    const x = mobile && option.dataset.offsetXMobile ? option.dataset.offsetXMobile : option.dataset.offsetX || "0";
    const y = mobile && option.dataset.offsetYMobile ? option.dataset.offsetYMobile : option.dataset.offsetY || "0";

    return {
      x: Number(x),
      y: Number(y)
    };
  }

  function syncOptionOffsets() {
    workOptions.forEach((option) => {
      const { x, y } = getOptionOffset(option);
      option.style.setProperty("--option-x", `${x}px`);
      option.style.setProperty("--option-y", `${y}px`);
    });
  }

  function syncOptionPalette() {
    workOptions.forEach((option, index) => {
      const color = WORK_HUB_PALETTE[index % WORK_HUB_PALETTE.length];
      const contrastHue = (color.hue + 180) % 360;
      option.style.setProperty("--option-color", color.css);
      option.style.setProperty("--option-text-color", `hsl(${contrastHue} 82% 22%)`);
      option.style.setProperty("--option-text-halo", `hsla(${color.hue} 100% 55% / 0.24)`);
      option.style.setProperty("--option-text-outline", `hsla(${contrastHue} 88% 16% / 0.2)`);
    });
  }

  function createTextTargets() {
    const offscreen = document.createElement("canvas");
    offscreen.width = state.width;
    offscreen.height = state.height;

    const offscreenContext = offscreen.getContext("2d");
    const mobile = window.innerWidth < 720;
    const text = "MY WORK";
    const center = getWorkCenter();
    const maxWidth = state.width * (mobile ? 0.72 : 0.58);
    const maxHeight = state.height * (mobile ? 0.1 : 0.11);
    const fontSize = getFittedWorkFontSize(
      text,
      maxWidth,
      maxHeight,
      Math.min(state.width * 0.168, state.height * 0.15, 224),
      760
    );
    const sampleStep = mobile ? 2 : 2;
    const shadowOffsetX = mobile ? 2 : 3;
    const shadowOffsetY = mobile ? 2 : 3;
    const targets = [];

    offscreenContext.clearRect(0, 0, state.width, state.height);
    offscreenContext.fillStyle = "#050505";
    offscreenContext.textAlign = "center";
    offscreenContext.textBaseline = "middle";
    offscreenContext.font = `760 ${fontSize}px "Helvetica Neue 5", "Helvetica Neue", Helvetica, Arial, sans-serif`;
    offscreenContext.fillText(text, center.x, center.y);
    offscreenContext.fillText(text, center.x + shadowOffsetX, center.y + shadowOffsetY);

    const { data } = offscreenContext.getImageData(0, 0, state.width, state.height);

    for (let y = 0; y < state.height; y += sampleStep) {
      for (let x = 0; x < state.width; x += sampleStep) {
        const alpha = data[(y * state.width + x) * 4 + 3];

        if (alpha > 70) {
          targets.push({
            x,
            y,
            z: randomBetweenWork(-64, 64),
            hue: 0,
            tint: 0
          });
        }
      }
    }

    return shuffleWork(targets).slice(0, state.pointCount);
  }

  function syncWorkLayoutVars() {
    const isMobile = window.innerWidth < 720;
    const centerWidth = Math.min(window.innerWidth * 0.92, isMobile ? 560 : 920);
    const triggerFontSize = getFittedWorkFontSize(
      "MY WORK",
      centerWidth * (isMobile ? 0.96 : 0.92),
      window.innerHeight * (isMobile ? 0.11 : 0.14),
      isMobile ? Math.min(window.innerWidth * 0.16, 82) : Math.min(window.innerWidth * 0.108, 132)
    );

    workScene.style.setProperty("--work-center-width", `${centerWidth}px`);
    workScene.style.setProperty("--work-trigger-font-size", `${triggerFontSize}px`);
  }

  function createOptionTargets() {
    const offscreen = document.createElement("canvas");
    offscreen.width = state.width;
    offscreen.height = state.height;

    const offscreenContext = offscreen.getContext("2d");
    const center = getWorkCenter();
    const mobile = window.innerWidth < 720;
    const sampleStep = mobile ? 2 : 2;
    const shadowOffsetX = mobile ? 2 : 4;
    const shadowOffsetY = mobile ? 2 : 4;
    const targets = [];

    offscreenContext.textAlign = "center";
    offscreenContext.textBaseline = "middle";

    workOptions.forEach((option, index) => {
      const color = WORK_HUB_PALETTE[index % WORK_HUB_PALETTE.length];
      const offset = getOptionOffset(option);
      const label = option.dataset.label || option.textContent.trim();
      const maxWidth = mobile ? Math.min(state.width * 0.4, 230) : Math.min(state.width * 0.3, 420);
      const maxHeight = mobile ? 42 : 62;
      const fontSize = getFittedWorkFontSize(
        label,
        maxWidth,
        maxHeight,
        mobile ? 46 : 72,
        540,
        12
      );

      offscreenContext.clearRect(0, 0, state.width, state.height);
      offscreenContext.fillStyle = "#050505";
      offscreenContext.font = `540 ${fontSize}px "Helvetica Neue 5", "Helvetica Neue", Helvetica, Arial, sans-serif`;
      offscreenContext.fillText(label, center.x + offset.x, center.y + offset.y);
      offscreenContext.fillText(
        label,
        center.x + offset.x + shadowOffsetX,
        center.y + offset.y + shadowOffsetY
      );

      const { data } = offscreenContext.getImageData(0, 0, state.width, state.height);

      for (let y = 0; y < state.height; y += sampleStep) {
        for (let x = 0; x < state.width; x += sampleStep) {
          const alpha = data[(y * state.width + x) * 4 + 3];

          if (alpha > 54) {
            targets.push({
              x,
              y,
              z: randomBetweenWork(-88, 88),
              hue: color.hue,
              tint: 1
            });
          }
        }
      }
    });

    return shuffleWork(targets).slice(0, state.pointCount);
  }

  function createPoints() {
    const center = getWorkCenter();

    state.points = Array.from({ length: state.pointCount }, () => ({
      x: center.x + randomBetweenWork(-80, 80),
      y: center.y + randomBetweenWork(-80, 80),
      z: randomBetweenWork(-80, 80),
      tx: center.x,
      ty: center.y,
      tz: randomBetweenWork(-80, 80),
      size: randomBetweenWork(1.18, 2.5),
      seed: Math.random() * Math.PI * 2,
      depthSeed: Math.random() * Math.PI * 2,
      hue: 0,
      targetHue: 0,
      tint: 0,
      targetTint: 0
    }));
  }

  function applyTargets(targets) {
    if (!targets.length) {
      return;
    }

    state.points.forEach((point, index) => {
      const target = targets[index % targets.length];
      const scatter = state.open ? 1.1 : 1.8;
      point.tx = target.x + randomBetweenWork(-scatter, scatter);
      point.ty = target.y + randomBetweenWork(-scatter, scatter);
      point.tz = (target.z ?? 0) + randomBetweenWork(state.open ? -12 : -16, state.open ? 12 : 16);
      point.targetHue = target.hue ?? 0;
      point.targetTint = target.tint ?? 0;
    });
  }

  function rebuildTargets() {
    syncOptionOffsets();
    state.textTargets = createTextTargets();
    state.optionTargets = createOptionTargets();

    if (!state.points.length || state.points.length !== state.pointCount) {
      createPoints();
    }

    applyTargets(state.open ? state.optionTargets : state.textTargets);
  }

  function resizeWorkCanvas() {
    const rect = workScene.getBoundingClientRect();

    state.width = Math.round(rect.width);
    state.height = Math.round(Math.max(rect.height, window.innerHeight));
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.pointCount = window.innerWidth < 720 ? 2600 : 4600;
    workCanvas.width = Math.round(state.width * state.dpr);
    workCanvas.height = Math.round(state.height * state.dpr);
    workCanvas.style.width = `${state.width}px`;
    workCanvas.style.height = `${state.height}px`;
    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    syncWorkLayoutVars();

    createPoints();
    rebuildTargets();
  }

  function setWorkMenuState(open) {
    state.open = open;
    body.classList.toggle("is-work-menu-open", open);
    workTrigger.setAttribute("aria-expanded", String(open));
    applyTargets(open ? state.optionTargets : state.textTargets);
  }

  function renderWorkHub(time) {
    context.clearRect(0, 0, state.width, state.height);
    const center = getWorkCenter();
    const centerX = center.x;
    const centerY = center.y;
    const angleY = reducedMotion ? 0.015 : Math.sin(time * 0.00024) * (state.open ? 0.08 : 0.05);
    const angleX = reducedMotion ? -0.01 : Math.cos(time * 0.00018) * (state.open ? 0.05 : 0.03);
    const perspective = Math.min(state.width, state.height) * 1.15;

    for (const point of state.points) {
      let targetX = point.tx;
      let targetY = point.ty;
      let targetZ = point.tz;

      if (state.open && point.targetTint > 0.04) {
        const groupPhase = point.targetHue * 0.021 + point.depthSeed;
        const groupDriftX = reducedMotion ? 0 : Math.sin(time * 0.00046 + groupPhase) * 8.5;
        const groupDriftY = reducedMotion ? 0 : Math.cos(time * 0.00036 + groupPhase * 0.92) * 5.4;
        const localDriftX = reducedMotion ? 0 : Math.sin(time * 0.00118 + point.seed + groupPhase) * 1.7;
        const localDriftY = reducedMotion ? 0 : Math.cos(time * 0.00102 + point.depthSeed + groupPhase * 0.7) * 1.35;
        const localDriftZ = reducedMotion ? 0 : Math.sin(time * 0.00084 + point.seed * 0.7 + groupPhase) * 8;

        targetX += groupDriftX + localDriftX;
        targetY += groupDriftY + localDriftY;
        targetZ += localDriftZ;
      } else if (!state.open) {
        const titlePhase = point.depthSeed * 0.9 + point.seed * 0.4;
        const titleDriftX = reducedMotion ? 0 : Math.sin(time * 0.00034 + titlePhase) * 4.8;
        const titleDriftY = reducedMotion ? 0 : Math.cos(time * 0.00026 + titlePhase * 0.82) * 2.4;
        const titleDriftZ = reducedMotion ? 0 : Math.sin(time * 0.00022 + titlePhase * 0.66) * 4.2;

        targetX += titleDriftX;
        targetY += titleDriftY;
        targetZ += titleDriftZ;
      }

      point.x += (targetX - point.x) * 0.094;
      point.y += (targetY - point.y) * 0.094;
      point.z += (targetZ - point.z) * 0.094;
      point.tint += (point.targetTint - point.tint) * 0.082;
      point.hue += (point.targetHue - point.hue) * 0.082;

      const wobbleX = reducedMotion ? 0 : Math.sin(time * 0.00082 + point.seed) * (state.open ? 0.14 : 0.08);
      const wobbleY = reducedMotion ? 0 : Math.cos(time * 0.00074 + point.seed) * (state.open ? 0.12 : 0.06);
      const localX = point.x - centerX;
      const localY = point.y - centerY;
      const localZ = point.z + (reducedMotion ? 0 : Math.sin(time * 0.00054 + point.depthSeed) * (state.open ? 9 : 6));

      const rotatedX = localX * Math.cos(angleY) - localZ * Math.sin(angleY);
      const rotatedZ = localX * Math.sin(angleY) + localZ * Math.cos(angleY);
      const rotatedY = localY * Math.cos(angleX) - rotatedZ * Math.sin(angleX);
      const finalZ = localY * Math.sin(angleX) + rotatedZ * Math.cos(angleX);
      const scale = perspective / (perspective - finalZ);
      const drawX = centerX + rotatedX * scale + wobbleX;
      const drawY = centerY + rotatedY * scale + wobbleY;
      const size = Math.max(state.open ? 1.48 : 1.3, point.size * scale * (state.open ? 1.32 : 1.26));
      const alpha = state.open
        ? Math.max(0.28, Math.min(0.86, 0.3 + scale * 0.23))
        : Math.max(0.24, Math.min(0.84, 0.26 + scale * 0.24));
      const rainbowHue = (point.hue + time * 0.026 + point.depthSeed * 18) % 360;
      const glowAlpha = alpha * (state.open ? 0.16 : 0.08);

      if (state.open && point.tint > 0.04) {
        context.fillStyle = `hsla(${rainbowHue}, 96%, 56%, ${glowAlpha})`;
        context.fillRect(drawX - size * 0.28, drawY - size * 0.28, size * 1.34, size * 1.34);
        context.fillStyle = `hsla(${rainbowHue}, 92%, 44%, ${alpha})`;
      } else {
        context.fillStyle = `rgba(5, 5, 5, ${glowAlpha})`;
        context.fillRect(drawX - size * 0.16, drawY - size * 0.16, size * 1.16, size * 1.16);
        context.fillStyle = `rgba(5, 5, 5, ${alpha})`;
      }

      context.fillRect(drawX, drawY, size, size);
    }

    state.animationId = window.requestAnimationFrame(renderWorkHub);
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
    syncOptionPalette();
    resizeWorkCanvas();
    renderWorkHub(0);

    workTrigger.addEventListener("click", handleWorkTriggerClick);
    workScene.addEventListener("click", handleWorkSceneClick);
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("resize", resizeWorkCanvas);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        rebuildTargets();
      });
    }
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
  const hasMicrophoneSupport = Boolean(hasMediaDeviceSupport && AudioContextConstructor);
  const canUseMicrophone = hasMicrophoneSupport && isMediaSecureContext;
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
    pointCount: window.innerWidth < 720 ? 1450 : 2600,
    currentShape: 0,
    shapes: ["portrait", "sphere", "cube", "torus", "wave", "helix", "cone", "crystal", "ribbon", "bloom", "hourglass", "camera"],
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
      return `Camera live. ${trackingMessage} Microphone input is shaping the tracked particles in real time.`;
    }

    return `Camera live. ${trackingMessage} Enable microphone input for sound-reactive motion.`;
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

      if (!state.audio.enabled && canUseMicrophone) {
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
      updateAudioUi("Mic mode is on. The particles now switch into an abstract audio field.");
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
      void stopAudioReactiveMode();
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

    if (name === "camera") {
      return createCameraTrackedShape(count);
    }

    return createWave(count);
  }

  function updateAudioUi(message, isError = false) {
    if (audioReactiveToggle) {
      audioReactiveToggle.classList.toggle("is-active", state.audio.enabled);
      audioReactiveToggle.classList.toggle("is-error", isError);
      audioReactiveToggle.textContent = state.audio.enabled ? "Mic On" : "Mic React";
      audioReactiveToggle.setAttribute("aria-pressed", String(state.audio.enabled));
      audioReactiveToggle.disabled = !canUseMicrophone || state.audio.isStarting;
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
    const { preserveCameraMessage = false } = options;

    if (state.audio.source) {
      state.audio.source.disconnect();
      state.audio.source = null;
    }

    if (state.audio.analyser) {
      state.audio.analyser.disconnect();
      state.audio.analyser = null;
    }

    if (state.audio.stream) {
      state.audio.stream.getTracks().forEach((track) => track.stop());
      state.audio.stream = null;
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
    state.audio.enabled = false;
    state.camera.audioLinked = false;
    resetAudioMetrics();
    resizeCanvas();

    if (preserveCameraMessage && state.camera.active) {
      updateAudioUi(getCameraStatusMessage());
    } else {
      updateAudioUi("Enable microphone input for sound-reactive motion.");
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

    if (!canUseMicrophone || state.audio.isStarting) {
      updateAudioUi(
        canUseMicrophone
          ? "Microphone access is still starting."
          : "Microphone input needs HTTPS or localhost in a supported browser.",
        !canUseMicrophone
      );
      return false;
    }

    state.audio.isStarting = true;
    updateAudioUi("Requesting microphone access...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const audioContext = new AudioContextConstructor();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.94;
      source.connect(analyser);

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      state.audio.context = audioContext;
      state.audio.analyser = analyser;
      state.audio.source = source;
      state.audio.stream = stream;
      state.audio.frequencyData = new Uint8Array(analyser.frequencyBinCount);
      state.audio.previousFrequencyData = new Uint8Array(analyser.frequencyBinCount);
      state.audio.timeDomainData = new Uint8Array(analyser.fftSize);
      state.audio.enabled = true;
      state.audio.lastMorphAt = performance.now();
      state.audio.lastBeatAt = 0;
      state.audio.visualBlend = Math.max(state.audio.visualBlend, 0.2);
      state.dispersion = Math.max(state.dispersion, 0.5);
      state.flash = Math.max(state.flash, 0.18);
      state.camera.audioLinked = fromCamera;
      resizeCanvas();

      if (state.camera.active) {
        updateAudioUi(getCameraStatusMessage());
      } else {
        updateAudioUi("Mic mode is on. The particles now switch into an abstract audio field.");
      }

      return true;
    } catch (error) {
      const errorName = error?.name || "";
      let message = "Microphone input could not be enabled.";

      if (errorName === "NotAllowedError" || errorName === "SecurityError") {
        message = "Microphone permission was blocked. Allow access to make the particles react.";
      } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
        message = "No microphone input was found on this device.";
      }

      state.camera.audioLinked = false;

      if (silentError && state.camera.active) {
        await stopAudioReactiveMode({ preserveCameraMessage: true });
        updateAudioUi(`${getCameraStatusMessage()} Microphone input was not enabled.`, true);
      } else {
        updateAudioUi(message, true);
        await stopAudioReactiveMode();
        updateAudioUi(message, true);
      }

      return false;
    } finally {
      state.audio.isStarting = false;

      if (audioReactiveToggle) {
        audioReactiveToggle.disabled = !canUseMicrophone;
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
    const transient = Math.min(1.2, flux * 2.5 + waveform * 0.46 + noteDrift * 0.7);
    const brightness = Math.min(1, centroid * 1.25 + air * 0.4 + presence * 0.26);
    const kick = Math.min(1.35, bass * 1.34 + transient * 0.58 + lowMid * 0.22);
    const snare = Math.min(1.25, lowMid * 0.84 + presence * 0.44 + transient * 0.92 + flux * 0.3);
    const hat = Math.min(1.2, air * 1.08 + treble * 0.62 + transient * 0.48 + brightness * 0.26);
    const melody = Math.min(1.25, mid * 0.92 + note * 0.74 + brightness * 0.42 + dominantBand.value * 0.24);
    const guitar = Math.min(1.3, presence * 0.96 + air * 0.44 + dominantBand.value * 0.5 + noteDrift * 0.78 + flux * 1.18);
    const percussion = Math.min(1.3, bass * 1.02 + lowMid * 0.68 + transient * 0.92 + flux * 1.26);
    const level = Math.min(1.2, bass * 0.96 + lowMid * 0.64 + mid * 0.82 + presence * 0.62 + air * 0.24 + waveform * 0.66);
    const surge = Math.min(1.7, bass * 0.9 + percussion * 0.68 + transient * 0.74 + level * 0.3 + noteDrift * 0.2);

    state.audio.level += (level - state.audio.level) * 0.11;
    state.audio.waveform += (waveform - state.audio.waveform) * 0.12;
    state.audio.bass += (bass - state.audio.bass) * 0.12;
    state.audio.lowMid += (lowMid - state.audio.lowMid) * 0.11;
    state.audio.mid += (mid - state.audio.mid) * 0.11;
    state.audio.treble += (treble - state.audio.treble) * 0.1;
    state.audio.presence += (presence - state.audio.presence) * 0.11;
    state.audio.air += (air - state.audio.air) * 0.1;
    state.audio.flux += (flux - state.audio.flux) * 0.16;
    state.audio.transient += (transient - state.audio.transient) * 0.16;
    state.audio.centroid += (centroid - state.audio.centroid) * 0.11;
    state.audio.note += (note - state.audio.note) * 0.14;
    state.audio.noteDrift += (noteDrift - state.audio.noteDrift) * 0.16;
    state.audio.brightness += (brightness - state.audio.brightness) * 0.11;
    state.audio.kick += (kick - state.audio.kick) * 0.14;
    state.audio.snare += (snare - state.audio.snare) * 0.14;
    state.audio.hat += (hat - state.audio.hat) * 0.14;
    state.audio.melody += (melody - state.audio.melody) * 0.13;
    state.audio.guitar += (guitar - state.audio.guitar) * 0.14;
    state.audio.percussion += (percussion - state.audio.percussion) * 0.14;
    state.audio.surge += (surge - state.audio.surge) * 0.12;

    if (state.audio.previousFrequencyData) {
      state.audio.previousFrequencyData.set(state.audio.frequencyData);
    }

    if (state.audio.beatCooldown > 0) {
      state.audio.beatCooldown -= 1;
    }

    if (state.audio.lastBeatAt > 0) {
      const beatAge = time - state.audio.lastBeatAt;
      const beatPhase = beatAge / Math.max(280, state.audio.beatInterval);
      const beatPulse = Math.max(0, Math.exp(-beatPhase * 3.8) - 0.02);
      state.audio.beatPulse += (beatPulse - state.audio.beatPulse) * 0.16;
    } else {
      state.audio.beatPulse += (0 - state.audio.beatPulse) * 0.08;
    }

    const beatDetected =
      !reducedMotion &&
      state.audio.beatCooldown <= 0 &&
      state.audio.level > 0.08 &&
      state.audio.percussion > 0.16 &&
      (state.audio.bass > 0.1 || state.audio.transient > 0.2);

    if (beatDetected) {
      if (state.audio.lastBeatAt > 0) {
        const interval = time - state.audio.lastBeatAt;

        if (interval >= 260 && interval <= 1200) {
          state.audio.beatInterval += (interval - state.audio.beatInterval) * 0.18;
          state.audio.tempo = Math.min(180, Math.max(60, 60000 / state.audio.beatInterval));
        }
      }

      state.audio.lastBeatAt = time;
      state.audio.beatPulse = Math.max(state.audio.beatPulse, 1);
      state.pointerBoost = Math.max(state.pointerBoost, 1.3 + state.audio.level * 2 + state.audio.transient * 0.65);
      state.dispersion = Math.max(state.dispersion, 1.38 + state.audio.transient * 0.18);
      state.flash = Math.max(state.flash, 1);
      state.audio.surge = Math.max(state.audio.surge, 1.16 + state.audio.percussion * 0.4 + state.audio.noteDrift * 0.22);
      state.audio.beatCooldown = 8;

      if (!state.camera.active && time - state.audio.lastMorphAt > 1400 && state.shapes[state.currentShape] !== "portrait" && state.audio.bass > 0.14) {
        morphTo(0);
        state.audio.lastMorphAt = time;
      }
    }
  }

  function getAudioFieldTarget(point, time) {
    const tempoFactor = Math.min(1.2, Math.max(0.5, state.audio.tempo / 120));
    const bassPulse = Math.min(1.45, state.audio.bass * 1.02 + state.audio.kick * 0.88 + state.audio.surge * 0.5 + state.audio.transient * 0.2);
    const melodyLift = Math.min(1.45, state.audio.melody * 1.08 + state.audio.presence * 0.48 + state.audio.noteDrift * 0.36 + state.audio.note * 0.22 + state.audio.guitar * 0.28);
    const shimmer = Math.min(1.35, state.audio.air * 0.8 + state.audio.treble * 0.46 + state.audio.brightness * 0.4 + state.audio.flux * 0.2);
    const waveformPulse = Math.min(1.25, state.audio.waveform * 0.92 + state.audio.level * 0.4);
    const layerCount = state.width < 720 ? 2 : 3;
    const layerIndex = point.audioGroup % layerCount;
    const layerDepth = layerCount <= 1 ? 0 : (layerIndex / (layerCount - 1)) * 2 - 1;
    const laneSpacing = 0.17 + waveformPulse * 0.035 + state.audio.snare * 0.02;
    const baseY = layerDepth * laneSpacing;
    const progress = point.audioBias * 2 - 1;
    const sweepTime = time * (0.00005 + tempoFactor * 0.000032 + state.audio.noteDrift * 0.000015);
    const ribbonTime = time * (0.00012 + tempoFactor * 0.00008 + state.audio.melody * 0.00005 + state.audio.guitar * 0.00003);
    const sweepX =
      Math.sin(sweepTime + point.audioSpiral * 0.45) * (0.38 + melodyLift * 0.12 + state.audio.beatPulse * 0.08) +
      Math.sin(sweepTime * 0.46 + layerIndex * 0.7) * (0.08 + state.audio.noteDrift * 0.04);
    const ribbonWidth = 1.18 + bassPulse * 0.14 + waveformPulse * 0.1 + state.audio.melody * 0.08;
    const xSpread = progress * ribbonWidth;
    const lineCurve = Math.sin(
      progress * Math.PI * (1.05 + point.motionMode * 0.14) +
      ribbonTime * (1.22 + state.audio.note * 0.32) +
      point.motionPhase
    ) * (0.052 + melodyLift * 0.034 + state.audio.guitar * 0.018);
    const lineDrift = Math.cos(
      ribbonTime * 0.82 +
      progress * (2.8 + point.motionBias * 1.8) +
      layerIndex * 0.68
    ) * (0.024 + shimmer * 0.016 + state.audio.noteDrift * 0.012);
    const verticalWave = Math.sin(
      ribbonTime * (1.06 + state.audio.note * 0.24) +
      progress * (4.6 + state.audio.melody * 1.2) +
      point.seed
    ) * (0.05 + melodyLift * 0.038 + state.audio.waveform * 0.02);
    const secondaryWave = Math.cos(
      ribbonTime * 0.64 +
      progress * 2.6 +
      point.motionPhase * 0.7
    ) * (0.016 + state.audio.presence * 0.015 + state.audio.snare * 0.01);
    const depthFlow = Math.sin(
      ribbonTime * 0.74 +
      progress * 3.4 +
      point.audioDepthBias * 2.6
    ) * (0.072 + shimmer * 0.024 + melodyLift * 0.018);
    const depthPulse =
      Math.cos(sweepTime * 1.18 + point.audioBias * 5.4) * (0.018 + bassPulse * 0.014 + state.audio.kick * 0.01) +
      point.audioDepthBias * (0.03 + state.audio.noteDrift * 0.01);

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
  }

  function createPoints() {
    state.points = Array.from({ length: state.pointCount }, () => ({
      x: randomBetween(-0.2, 0.2),
      y: randomBetween(-0.2, 0.2),
      z: randomBetween(-0.2, 0.2),
      tx: 0,
      ty: 0,
      tz: 0,
      region: "default",
      size: randomBetween(0.72, 1.58),
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
    }));
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

  function morphRandom() {
    let nextIndex = state.currentShape;

    while (nextIndex === state.currentShape || state.shapes[nextIndex] === "camera") {
      nextIndex = Math.floor(Math.random() * state.shapes.length);
    }

    morphTo(nextIndex);
  }

  function drawPointMesh(projectedPoints, audioLevel, audioTreble, guitar, flash, shapeName, isAudioMode = false) {
    if (projectedPoints.length < 3) {
      return;
    }

    const isCameraShape = shapeName === "camera";

    const sorted = projectedPoints
      .slice()
      .sort((first, second) => first.x - second.x);
    const maxDistance = Math.min(state.width, state.height) * (isAudioMode ? 0.12 : shapeName === "portrait" ? 0.08 : 0.1);
    const lookahead = isAudioMode ? 6 : shapeName === "portrait" ? 6 : 5;

    context.lineWidth = isAudioMode
      ? 0.14 + audioTreble * 0.12 + guitar * 0.11 + flash * 0.04
      : isCameraShape
      ? 0.35 + audioTreble * 0.4 + guitar * 0.45 + flash * 0.18
      : 0.2 + audioTreble * 0.12 + guitar * 0.1 + flash * 0.06;

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
            ? (0.018 + audioLevel * 0.03 + guitar * 0.024 + flash * 0.012)
            : isCameraShape
            ? (0.04 + audioLevel * 0.06 + guitar * 0.08 + flash * 0.06)
            : (0.02 + audioLevel * 0.02 + guitar * 0.018 + flash * 0.014)
        );

        if (alpha < (isAudioMode ? 0.01 : 0.015)) {
          continue;
        }

        context.strokeStyle = `rgba(12, 12, 12, ${alpha})`;
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
    const shapeName = state.shapes[state.currentShape];
    const isAudioMode = state.audio.visualBlend > 0.025 && !state.camera.active;
    const isCameraShape = shapeName === "camera" && !isAudioMode;
    const isPortraitShape = shapeName === "portrait";
    const baseScaleBoost = isAudioMode ? 1.06 : isCameraShape ? 1 : isPortraitShape ? 0.93 : 0.9;
    const sceneScale = Math.min(state.width, state.height) *
      (
        state.width < 720
          ? (isAudioMode ? 0.33 : isCameraShape ? 0.34 : 0.235)
          : (isAudioMode ? 0.4 : isCameraShape ? 0.39 : 0.275)
      ) * baseScaleBoost *
      (1 + (
        isAudioMode
          ? audioBass * 0.05 + audioLevel * 0.03 + audioTransient * 0.02
          : isCameraShape
            ? audioBass * 0.08 + audioLevel * 0.04
            : audioBass * 0.15 + audioLevel * 0.08 + audioPercussion * 0.03
      ));
    const perspective = sceneScale * 1.9;
    const idleDispersion = reducedMotion
      ? 0.02
      : isAudioMode
        ? 0.05 + Math.sin(time * 0.00016) * 0.006
        : isCameraShape
        ? 0.006 + Math.sin(time * 0.00034) * 0.004
        : 0.034 + Math.sin(time * 0.00062) * 0.012;
    const reactiveDispersion = isAudioMode
      ? audioLevel * 0.04 + audioBass * 0.03 + audioTreble * 0.014 + audioFlux * 0.02 + audioPercussion * 0.018 + audioGuitar * 0.016 + audioSurge * 0.016 + audioTransient * 0.018 + audioNoteDrift * 0.012
      : isCameraShape
      ? audioLevel * 0.04 + audioBass * 0.06 + audioFlux * 0.04
      : audioLevel * 0.17 + audioBass * 0.24 + audioTreble * 0.08 + audioFlux * 0.28 + audioPercussion * 0.15 + audioSurge * 0.16;
    const globalDriftX = reducedMotion ? 0 : (
      isAudioMode
        ? Math.sin(time * (0.000042 + audioTempo * 0.00000035 + audioNote * 0.000004)) * (0.01 + audioMelody * 0.008 + audioBeatPulse * 0.005 + audioNoteDrift * 0.003)
        : isCameraShape
          ? Math.sin(time * 0.0002) * 0.008
          : Math.sin(time * 0.00042) * (0.06 + audioSurge * 0.02)
    );
    const globalDriftY = reducedMotion ? 0 : (
      isAudioMode
        ? Math.cos(time * (0.000038 + audioBrightness * 0.000006 + audioTempo * 0.00000028)) * (0.006 + audioSnare * 0.004 + audioWaveform * 0.003 + audioBeatPulse * 0.003)
        : isCameraShape
          ? Math.cos(time * 0.00018) * 0.007
          : Math.cos(time * 0.00036) * (0.048 + audioSurge * 0.016)
    );
    const globalBreathe = reducedMotion ? 0 : (
      isAudioMode
        ? Math.sin(time * (0.0001 + audioBass * 0.000014 + audioWaveform * 0.000018 + audioTempo * 0.00000022)) * (0.006 + audioLevel * 0.004 + audioKick * 0.004 + audioBeatPulse * 0.004)
        : isCameraShape
          ? Math.sin(time * 0.00036) * (0.006 + audioLevel * 0.01)
          : Math.sin(time * (0.00052 + audioBass * 0.00018)) * (0.03 + audioLevel * 0.035)
    );
    const globalSway = reducedMotion ? 0 : (
      isAudioMode
        ? Math.sin(time * (0.000052 + audioMid * 0.00001 + audioMelody * 0.000018 + audioFlux * 0.000008 + audioNoteDrift * 0.000008)) * (0.012 + audioPresence * 0.006 + audioMelody * 0.008 + audioBeatPulse * 0.004)
        : isCameraShape
          ? Math.sin(time * 0.00028) * (0.01 + audioPresence * 0.012)
          : Math.sin(time * (0.00048 + audioMid * 0.00016 + audioGuitar * 0.00022)) * (0.062 + audioPresence * 0.065 + audioGuitar * 0.08 + audioSurge * 0.03)
    );
    const clearAlpha = reducedMotion
      ? 1
      : isAudioMode
        ? Math.max(0.11, 0.18 - audioLevel * 0.02 - state.flash * 0.012)
        : isCameraShape
          ? 1
          : Math.max(0.16, 0.34 - audioLevel * 0.12 - state.flash * 0.08);
    const projectedPoints = [];
    const audioRenderModulo = state.width < 720 ? 4 : 5;
    const audioVisibleGroups = state.width < 720 ? 2 : 3;

    context.fillStyle = `rgba(255, 255, 255, ${clearAlpha})`;
    context.fillRect(0, 0, state.width, state.height);

    state.pointerBoost *= 0.96;
    state.dispersion += ((idleDispersion + reactiveDispersion) - state.dispersion) * (isAudioMode ? 0.028 : 0.06);
    state.flash *= isAudioMode ? 0.9 : 0.92;

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
      const orbitRadius = point.driftRadius * (isAudioMode ? (0.16 + state.dispersion * 0.12) : (0.45 + state.dispersion * 0.9)) * point.scatterScale;
      const orbitX = reducedMotion ? 0 : Math.sin(time * (isAudioMode ? 0.00026 : isCameraShape ? 0.00024 : 0.0009) + point.orbitSeed) * orbitRadius;
      const orbitY = reducedMotion ? 0 : Math.cos(time * (isAudioMode ? 0.00022 : isCameraShape ? 0.00022 : 0.00082) + point.orbitSeed * 1.1) * orbitRadius;
      const orbitZ = reducedMotion ? 0 : Math.sin(time * (isAudioMode ? 0.0002 : isCameraShape ? 0.0002 : 0.00074) + point.orbitSeed * 0.8) * orbitRadius * (isCameraShape ? 0.28 : isAudioMode ? 0.26 : 0.85);
      const spreadAmount = state.dispersion * point.scatterScale;
      const spreadMultiplier = isAudioMode ? 0.015 : isCameraShape ? 0.016 : shapeName === "portrait" ? 0.076 : 0.116;
      const spreadX = normalizedX * spreadAmount * spreadMultiplier + orbitX;
      const spreadY = normalizedY * spreadAmount * spreadMultiplier + orbitY;
      const spreadZ = normalizedZ * spreadAmount * spreadMultiplier + orbitZ;
      const ornamentStrength = isAudioMode
        ? 0.005 + point.motionBias * 0.002 + audioGuitar * 0.003 + audioNoteDrift * 0.002 + audioBrightness * 0.002
        : isCameraShape
          ? 0
          : 0.012 + point.motionBias * 0.012 + (isPortraitShape ? audioLevel * 0.01 : audioGuitar * 0.016 + audioTreble * 0.006);
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
        targetX += spreadX * (0.18 + audioGuitar * 0.02 + audioMelody * 0.018);
        targetY += spreadY * (0.14 + audioPercussion * 0.018 + audioWaveform * 0.014);
        targetZ += spreadZ * (0.12 + audioSurge * 0.02 + audioBrightness * 0.016);
      } else if (shapeName === "portrait") {
        const mouthOpen = Math.min(1, audioMid * 1.35 + audioLowMid * 0.42 + audioLevel * 0.88 + audioPresence * 0.28);
        const mouthPulse = reducedMotion ? 0 : Math.sin(time * (0.0042 + audioPresence * 0.0024 + audioGuitar * 0.0022) + point.seed) * 0.01;
        const stringRipple = reducedMotion
          ? 0
          : Math.sin(point.y * 14 + time * (0.002 + audioGuitar * 0.0026) + point.seed) * audioGuitar * 0.02;

        if (point.region === "mouth-upper") {
          targetY -= mouthOpen * 0.018;
          targetZ += mouthOpen * 0.018;
          targetX += mouthPulse * 0.7;
        } else if (point.region === "mouth-lower") {
          targetY += mouthOpen * 0.075;
          targetZ -= mouthOpen * 0.012;
          targetX += mouthPulse * 0.9;
        } else if (point.region === "mouth-core") {
          targetY += mouthOpen * 0.12;
          targetZ -= mouthOpen * 0.018;
          targetX += mouthPulse * 1.15;
        } else if (point.region === "neck") {
          targetY += audioBass * 0.03;
        } else if (point.region === "torso") {
          targetY += audioBass * 0.055 + audioLowMid * 0.018;
          targetX += Math.sin(time * 0.0013 + point.seed) * audioLevel * 0.012 + stringRipple;
        } else if (point.region === "head") {
          targetX += Math.sin(time * 0.0016 + point.seed) * audioLevel * 0.01 + stringRipple * 0.35;
          targetY -= audioBass * 0.012;
        } else if (point.region === "halo") {
          targetX += Math.sin(time * 0.0011 + point.seed) * (0.012 + audioTreble * 0.02 + audioGuitar * 0.03);
          targetY += Math.cos(time * 0.001 + point.seed * 1.2) * (0.01 + audioTreble * 0.018 + audioAir * 0.02);
        }
      } else if (isCameraShape) {
        const trackedPulse = audioLevel * 0.024 + audioBass * 0.03 + audioMelody * 0.018 + audioBeatPulse * 0.02;
        const trackedRipple = reducedMotion
          ? 0
          : Math.sin(time * (0.0016 + audioGuitar * 0.0009 + audioNote * 0.00032) + point.seed * 1.4) * (0.016 + audioFlux * 0.04 + audioWaveform * 0.02);

        if (point.region === "focus") {
          targetX += trackedRipple * 1.12;
          targetY += Math.cos(time * 0.002 + point.seed) * (audioPresence * 0.04 + audioGuitar * 0.024 + trackedPulse * 0.32);
          targetZ += audioMid * 0.05 + trackedPulse * 0.05;
        } else if (point.region === "core") {
          targetX += trackedRipple * 0.92;
          targetY += Math.sin(time * 0.0018 + point.seed) * (audioMid * 0.032 + audioPercussion * 0.022 + trackedPulse * 0.26);
          targetZ += trackedPulse * 0.035;
        } else if (point.region === "body") {
          targetX += trackedRipple * 1.28;
          targetY += audioBass * 0.05 + audioLowMid * 0.03 + trackedPulse * 0.2;
        } else if (point.region === "lower") {
          targetY += audioBass * 0.082 + audioPercussion * 0.04 + trackedPulse * 0.18;
        } else if (point.region === "halo") {
          targetX += Math.sin(time * 0.001 + point.seed) * (0.022 + audioAir * 0.036 + audioGuitar * 0.028 + trackedPulse * 0.18);
          targetY += Math.cos(time * 0.00092 + point.seed * 1.1) * (0.02 + audioTreble * 0.028 + trackedPulse * 0.14);
        }
      }

      if (shapeName === "portrait" && point.region === "halo") {
        targetX += spreadX * 2.2;
        targetY += spreadY * 2.2;
        targetZ += spreadZ * 1.9;
      } else if (shapeName === "portrait" && point.region === "torso") {
        targetX += spreadX * 0.9;
        targetY += spreadY * 0.7;
        targetZ += spreadZ * 0.7;
      } else if (shapeName === "portrait" && point.region && point.region.startsWith("mouth")) {
        targetX += spreadX * 0.38;
        targetY += spreadY * 0.22;
        targetZ += spreadZ * 0.22;
      } else if (isCameraShape && point.region === "halo") {
        targetX += spreadX * 1.8;
        targetY += spreadY * 1.8;
        targetZ += spreadZ * 1.4;
      } else if (isCameraShape && point.region === "focus") {
        targetX += spreadX * 0.28;
        targetY += spreadY * 0.2;
        targetZ += spreadZ * 0.16;
      } else {
        targetX += spreadX;
        targetY += spreadY;
        targetZ += spreadZ;
      }

      if (!isCameraShape && !isAudioMode) {
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
          const ribbonPhase = time * (0.00012 + audioNote * 0.00003 + audioFlux * 0.00001);
          ornamentX = Math.sin(ribbonPhase + point.audioBias * 3.2) * ornamentStrength;
          ornamentY = Math.cos(ribbonPhase * 0.72 + point.motionBias * 2.6) * ornamentStrength * 0.34;
          ornamentZ = Math.sin(ribbonPhase * 0.86 + point.audioSpiral * 2.1) * ornamentStrength * 0.42;
        }

        targetX += ornamentX;
        targetY += ornamentY;
        targetZ += ornamentZ;
      }

      const cameraLerp = isAudioMode ? 0.046 : isCameraShape ? 0.12 : 0.055;
      point.x += (targetX - point.x) * cameraLerp;
      point.y += (targetY - point.y) * cameraLerp;
      point.z += (targetZ - point.z) * cameraLerp;

      if (isAudioMode && point.audioGroup % audioRenderModulo >= audioVisibleGroups) {
        continue;
      }

      const reactiveBoost = state.pointerBoost + audioLevel * 1.35 + audioBass * 0.8;
      const wobble = reducedMotion
        ? 0
        : Math.sin(time * (isAudioMode ? 0.00158 + audioTreble * 0.0005 + audioGuitar * 0.00072 : isCameraShape ? 0.00026 : 0.0012 + audioTreble * 0.0003 + audioGuitar * 0.0005) + point.seed) *
          (isAudioMode ? 0.00012 + reactiveBoost * 0.00005 + audioFlux * 0.00008 + audioHat * 0.00006 + audioNoteDrift * 0.00005 : isCameraShape ? 0.0016 + audioFlux * 0.0012 : 0.0048 + reactiveBoost * 0.0056 + audioFlux * 0.005 + audioSurge * 0.0022);
      const audioLift = reducedMotion
        ? 0
        : Math.cos(time * (isAudioMode ? 0.00134 + audioMid * 0.00042 + audioLowMid * 0.00022 : isCameraShape ? 0.00024 : 0.00105 + audioMid * 0.0002 + audioLowMid * 0.00016) + point.seed * 1.2) *
          (isAudioMode ? audioKick * 0.007 + audioSnare * 0.003 + audioSurge * 0.002 + audioWaveform * 0.002 + audioBeatPulse * 0.003 : isCameraShape ? audioBass * 0.012 : audioBass * 0.075 + audioPercussion * 0.018);
      const flowX = reducedMotion
        ? 0
        : Math.sin(time * (isAudioMode ? 0.00042 : isCameraShape ? 0.00026 : 0.0009) + point.audioBias * 3.2 + point.audioGroup * 0.24 + point.orbitSeed) *
          (isAudioMode ? 0.022 + audioPresence * 0.012 + audioMelody * 0.014 + audioSurge * 0.008 + audioNote * 0.008 + audioBeatPulse * 0.01 : isCameraShape ? 0.002 + audioPresence * 0.004 : 0.01 + audioPresence * 0.016 + audioGuitar * 0.032 + audioSurge * 0.01);
      const flowY = reducedMotion
        ? 0
        : Math.cos(time * (isAudioMode ? 0.00034 : isCameraShape ? 0.00022 : 0.00082) + point.audioBias * 2.1 + point.seed * 0.2) *
          (isAudioMode ? 0.003 + audioMid * 0.003 + audioSnare * 0.002 + audioWaveform * 0.002 + audioBeatPulse * 0.002 : isCameraShape ? 0.002 + audioMid * 0.004 : 0.008 + audioMid * 0.02 + audioPercussion * 0.018 + audioSurge * 0.006);
      const flowZ = reducedMotion
        ? 0
        : Math.sin(time * (isAudioMode ? 0.00028 : isCameraShape ? 0.0002 : 0.00076) + point.audioBias * 1.8 + point.seed * 0.14) *
          (isAudioMode ? 0.003 + audioKick * 0.003 + audioHat * 0.002 + audioFlux * 0.002 + audioBrightness * 0.002 : isCameraShape ? 0.004 + audioBass * 0.008 : 0.03 + audioBass * 0.06 + audioFlux * 0.065 + state.dispersion * 0.028 + audioSurge * 0.012);
      const deformedX = point.x + wobble + flowX + globalDriftX + point.y * globalSway * (isAudioMode ? 0.05 : 0.14);
      const deformedY = point.y * (1 + globalBreathe * (isAudioMode ? 0.07 : 0.18)) + wobble * 0.3 + audioLift + flowY + globalDriftY;
      const deformedZ = point.z + audioLift * 0.65 + flowZ;
      const depth = perspective / (perspective - deformedZ * sceneScale * 0.6);
      const x = deformedX * sceneScale * depth + state.width / 2;
      const y = deformedY * sceneScale * depth + state.height / 2;

      const size = point.size * depth * (
        isAudioMode
          ? (1.02 + audioLevel * 0.12 + audioTreble * 0.04 + audioSurge * 0.03 + audioTransient * 0.022 + audioBeatPulse * 0.04 + audioKick * 0.03)
          : isCameraShape
          ? (1 + audioLevel * 0.72 + audioBass * 0.34)
          : isPortraitShape
            ? (1.14 + audioLevel * 0.42 + audioBass * 0.14 + audioSurge * 0.07)
            : (1.18 + audioLevel * 0.42 + audioBass * 0.14 + audioSurge * 0.07)
      );
      const alpha = Math.max(
        0.14,
        Math.min(
          0.92,
          isAudioMode
            ? 0.18 + depth * 0.26 + audioLevel * 0.08 + audioTreble * 0.04 + state.flash * 0.02 + audioBrightness * 0.03
            : isCameraShape
            ? 0.22 + depth * 0.42 + audioLevel * 0.19 + audioBass * 0.14 + state.flash * 0.08
            : 0.24 + depth * 0.42 + audioLevel * 0.16 + audioBass * 0.11 + state.flash * 0.05
        )
      );

      if (x < -12 || x > state.width + 12 || y < -12 || y > state.height + 12) {
        continue;
      }

      const drawSize = isAudioMode
        ? Math.max(1.35, size * 1.38)
        : isCameraShape
          ? Math.max(0.9, size * 0.9)
          : Math.max(isPortraitShape ? 0.92 : 0.82, size * (isPortraitShape ? 0.74 : 0.68));

      const ghostShiftX = isCameraShape
        ? 0
        : (Math.sin(time * 0.00042 + point.seed + audioNote * 1.4) * ((isAudioMode ? 0.9 : 1.5) + audioTreble * (isAudioMode ? 1.2 : 2) + audioGuitar * (isAudioMode ? 1.4 : 3.6)) + globalDriftX * sceneScale * (isAudioMode ? 0.08 : 0.16));
      const ghostShiftY = isCameraShape
        ? 0
        : (Math.cos(time * 0.0004 + point.seed * 1.2 + audioCentroid * 2.2) * ((isAudioMode ? 0.7 : 1.2) + audioMid * (isAudioMode ? 1.2 : 2.2) + audioPercussion * (isAudioMode ? 1.2 : 2.4)) + globalDriftY * sceneScale * (isAudioMode ? 0.06 : 0.12));

      if (!isCameraShape) {
        context.fillStyle = `rgba(17, 17, 17, ${alpha * (isAudioMode ? 0.12 : 0.1)})`;
        context.fillRect(x - ghostShiftX, y - ghostShiftY, Math.max(isAudioMode ? 0.82 : 0.56, drawSize * (isAudioMode ? 0.82 : 0.56)), Math.max(isAudioMode ? 0.82 : 0.56, drawSize * (isAudioMode ? 0.82 : 0.56)));
      }

      context.fillStyle = `rgba(17, 17, 17, ${alpha})`;
      context.fillRect(x, y, drawSize, drawSize);

      if (!isCameraShape && drawSize > 1.05) {
        context.fillStyle = `rgba(17, 17, 17, ${Math.min(isAudioMode ? 0.18 : 0.18, alpha * (isAudioMode ? 0.16 : 0.14))})`;
        context.fillRect(x - drawSize * 0.24, y - drawSize * 0.24, drawSize * (isAudioMode ? 0.22 : 0.18), drawSize * (isAudioMode ? 0.22 : 0.18));
      }

      const meshStep = isAudioMode
        ? (state.width < 720 ? 18 : 24)
        : isCameraShape
          ? (state.width < 720 ? 9 : 12)
          : (state.width < 720 ? 16 : 21);

      if (projectedPoints.length < (isAudioMode ? 64 : isCameraShape ? 240 : 150) && Math.floor(point.seed * 1000) % meshStep === 0) {
        projectedPoints.push({
          x,
          y
        });
      }
    }

    drawPointMesh(projectedPoints, audioLevel, audioTreble, audioGuitar, state.flash, shapeName, isAudioMode);

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
    scheduleNextMorph(0);
    morphTo(0);
    render(0);
    updatePortraitUi(false);

    window.addEventListener("resize", resizeCanvas);
    hero.addEventListener("click", handleHeroClick);
    window.addEventListener("beforeunload", cleanupHeroMedia);

    if (audioReactiveToggle) {
      if (!canUseMicrophone) {
        updateAudioUi("Microphone input needs HTTPS or localhost in a supported browser.", true);
      } else {
        updateAudioUi("Enable microphone input to switch the hero into an abstract audio-reactive field.");
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
  const photoLightboxImage = photoLightbox.querySelector("[data-photo-lightbox-image]");
  const photoLightboxCaption = photoLightbox.querySelector("[data-photo-lightbox-caption]");
  const photoLightboxClose = photoLightbox.querySelector("[data-photo-lightbox-close]");
  let lastPhotoTrigger = null;

  function resetPhotoLightbox() {
    if (photoLightboxImage) {
      photoLightboxImage.removeAttribute("src");
      photoLightboxImage.alt = "";
    }

    if (photoLightboxCaption) {
      photoLightboxCaption.textContent = "";
    }
  }

  function closePhotoLightbox() {
    if (photoLightbox.open) {
      photoLightbox.close();
    } else {
      body.classList.remove("is-lightbox-open");
      resetPhotoLightbox();
    }
  }

  photoGallery.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-photo-trigger]");

    if (!trigger) {
      return;
    }

    event.preventDefault();

    const image = trigger.querySelector("img");
    const fullSrc = trigger.dataset.photoFull || image?.currentSrc || image?.src;

    if (!fullSrc) {
      return;
    }

    if (typeof photoLightbox.showModal !== "function") {
      window.open(fullSrc, "_blank", "noopener");
      return;
    }

    lastPhotoTrigger = trigger;

    if (photoLightboxImage) {
      photoLightboxImage.src = fullSrc;
      photoLightboxImage.alt = image?.alt || trigger.dataset.photoTitle || "Expanded photo";
    }

    if (photoLightboxCaption) {
      photoLightboxCaption.textContent = trigger.dataset.photoTitle || image?.alt || "";
    }

    photoLightbox.showModal();
    body.classList.add("is-lightbox-open");
  });

  if (photoLightboxClose) {
    photoLightboxClose.addEventListener("click", closePhotoLightbox);
  }

  photoLightbox.addEventListener("click", (event) => {
    if (event.target === photoLightbox) {
      closePhotoLightbox();
    }
  });

  photoLightbox.addEventListener("close", () => {
    body.classList.remove("is-lightbox-open");
    resetPhotoLightbox();

    if (lastPhotoTrigger) {
      lastPhotoTrigger.focus();
    }
  });
}

const backArrowLinks = Array.from(document.querySelectorAll(".page-back, .project-detail__back"));

if (backArrowLinks.length > 0) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const backArrowInstances = [];

  function randomBetweenBackArrow(min, max) {
    return min + Math.random() * (max - min);
  }

  function sampleBackArrowTargets(width, height) {
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;

    const offscreenContext = offscreen.getContext("2d");
    const centerY = height / 2;
    const tailX = width * 0.78;
    const joinX = width * 0.42;
    const tipX = width * 0.18;
    const topY = height * 0.28;
    const bottomY = height * 0.72;
    const strokeWidth = Math.max(3, Math.min(width, height) * 0.075);
    const sampleStep = width < 72 ? 4 : 3;
    const targets = [];

    offscreenContext.clearRect(0, 0, width, height);
    offscreenContext.strokeStyle = "#050505";
    offscreenContext.lineWidth = strokeWidth;
    offscreenContext.lineCap = "round";
    offscreenContext.lineJoin = "round";
    offscreenContext.beginPath();
    offscreenContext.moveTo(tailX, centerY);
    offscreenContext.lineTo(joinX, centerY);
    offscreenContext.moveTo(joinX, topY);
    offscreenContext.lineTo(tipX, centerY);
    offscreenContext.lineTo(joinX, bottomY);
    offscreenContext.stroke();

    const { data } = offscreenContext.getImageData(0, 0, width, height);

    for (let y = 0; y < height; y += sampleStep) {
      for (let x = 0; x < width; x += sampleStep) {
        const alpha = data[(y * width + x) * 4 + 3];

        if (alpha > 50 && Math.random() > 0.22) {
          targets.push({
            x,
            y
          });
        }
      }
    }

    return targets;
  }

  function createBackArrowParticles(targets, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;

    return targets.map((target) => ({
      x: centerX + randomBetweenBackArrow(-width * 0.12, width * 0.12),
      y: centerY + randomBetweenBackArrow(-height * 0.12, height * 0.12),
      tx: target.x,
      ty: target.y,
      size: randomBetweenBackArrow(0.75, 1.45),
      seed: Math.random() * Math.PI * 2
    }));
  }

  function createBackArrowAura(width, height) {
    const count = width < 72 ? 4 : 6;

    return Array.from({ length: count }, () => ({
      angle: Math.random() * Math.PI * 2,
      radiusX: randomBetweenBackArrow(width * 0.18, width * 0.34),
      radiusY: randomBetweenBackArrow(height * 0.16, height * 0.3),
      speed: randomBetweenBackArrow(0.00014, 0.00028) * (Math.random() > 0.5 ? 1 : -1),
      size: randomBetweenBackArrow(0.7, 1.15),
      alpha: randomBetweenBackArrow(0.03, 0.09),
      seed: Math.random() * Math.PI * 2,
      lastX: width / 2,
      lastY: height / 2
    }));
  }

  function drawBackArrowMesh(context, points, activeBoost) {
    const maxDistance = 10 + activeBoost * 2;
    const maxDistanceSquared = maxDistance * maxDistance;

    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      let links = 0;

      for (let compareIndex = index + 1; compareIndex < points.length; compareIndex += 1) {
        const comparePoint = points[compareIndex];
        const dx = comparePoint.x - point.x;
        const dy = comparePoint.y - point.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared > maxDistanceSquared) {
          continue;
        }

        const distance = Math.sqrt(distanceSquared);
        const alpha = (1 - distance / maxDistance) * (0.16 + activeBoost * 0.05);

        context.strokeStyle = `rgba(5, 5, 5, ${alpha})`;
        context.lineWidth = 0.45;
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(comparePoint.x, comparePoint.y);
        context.stroke();

        links += 1;

        if (links >= 3) {
          break;
        }
      }
    }
  }

  function resizeBackArrowInstance(instance) {
    const rect = instance.link.getBoundingClientRect();
    const padding = 10;

    instance.width = Math.max(Math.round(rect.width + padding), 42);
    instance.height = Math.max(Math.round(rect.height + padding), 42);
    instance.dpr = Math.min(window.devicePixelRatio || 1, 2);
    instance.canvas.width = Math.round(instance.width * instance.dpr);
    instance.canvas.height = Math.round(instance.height * instance.dpr);
    instance.canvas.style.width = `${instance.width}px`;
    instance.canvas.style.height = `${instance.height}px`;
    instance.context.setTransform(instance.dpr, 0, 0, instance.dpr, 0, 0);
    instance.targets = sampleBackArrowTargets(instance.width, instance.height);
    instance.particles = createBackArrowParticles(instance.targets, instance.width, instance.height);
    instance.aura = createBackArrowAura(instance.width, instance.height);
  }

  function renderBackArrowInstance(instance, time) {
    const context = instance.context;
    const centerX = instance.width / 2;
    const centerY = instance.height / 2;
    const activeBoost = instance.active ? 1 : 0;
    const floatX = reducedMotion ? 0 : Math.sin(time * 0.0006 + instance.phase) * 1.1;
    const floatY = reducedMotion ? 0 : Math.cos(time * 0.0008 + instance.phase) * 1.6;
    const renderPoints = [];

    context.clearRect(0, 0, instance.width, instance.height);

    for (const auraParticle of instance.aura) {
      const drift = reducedMotion ? 0 : Math.sin(time * 0.0009 + auraParticle.seed) * 1.2;
      const angle = auraParticle.angle + time * auraParticle.speed;
      const x = centerX + floatX + Math.cos(angle) * (auraParticle.radiusX + drift * 0.25);
      const y = centerY + floatY + Math.sin(angle) * (auraParticle.radiusY + drift * 0.22);
      const size = auraParticle.size + activeBoost * 0.08;
      const alpha = Math.min(0.12, auraParticle.alpha + activeBoost * 0.02);

      context.strokeStyle = `rgba(5, 5, 5, ${alpha})`;
      context.lineWidth = 0.38;
      context.beginPath();
      context.moveTo(auraParticle.lastX, auraParticle.lastY);
      context.lineTo(x, y);
      context.stroke();

      context.fillStyle = `rgba(5, 5, 5, ${alpha})`;
      context.beginPath();
      context.arc(x, y, size * 0.48, 0, Math.PI * 2);
      context.fill();

      auraParticle.lastX = x;
      auraParticle.lastY = y;
    }

    for (const particle of instance.particles) {
      particle.x += (particle.tx - particle.x) * 0.11;
      particle.y += (particle.ty - particle.y) * 0.11;

      const wobbleX = reducedMotion ? 0 : Math.sin(time * 0.0017 + particle.seed) * (0.34 + activeBoost * 0.2);
      const wobbleY = reducedMotion ? 0 : Math.cos(time * 0.0015 + particle.seed) * (0.3 + activeBoost * 0.18);
      const size = particle.size + activeBoost * 0.08;
      const alpha = 0.58 + activeBoost * 0.1;
      const x = particle.x + floatX + wobbleX;
      const y = particle.y + floatY + wobbleY;

      renderPoints.push({ x, y, size, alpha });
    }

    drawBackArrowMesh(context, renderPoints, activeBoost);

    for (const point of renderPoints) {
      context.fillStyle = `rgba(5, 5, 5, ${point.alpha})`;
      context.beginPath();
      context.arc(point.x, point.y, point.size * 0.42, 0, Math.PI * 2);
      context.fill();
    }
  }

  function renderBackArrows(time) {
    for (const instance of backArrowInstances) {
      renderBackArrowInstance(instance, time);
    }

    window.requestAnimationFrame(renderBackArrows);
  }

  backArrowLinks.forEach((link) => {
    const canvas = document.createElement("canvas");
    canvas.className = "back-arrow__canvas";
    canvas.setAttribute("aria-hidden", "true");
    link.appendChild(canvas);

    const instance = {
      link,
      canvas,
      context: canvas.getContext("2d"),
      width: 0,
      height: 0,
      dpr: 1,
      targets: [],
      particles: [],
      aura: [],
      active: false,
      phase: Math.random() * Math.PI * 2
    };

    link.addEventListener("pointerenter", () => {
      instance.active = true;
    });

    link.addEventListener("pointerleave", () => {
      instance.active = false;
    });

    link.addEventListener("focus", () => {
      instance.active = true;
    });

    link.addEventListener("blur", () => {
      instance.active = false;
    });

    resizeBackArrowInstance(instance);
    backArrowInstances.push(instance);
  });

  window.addEventListener("resize", () => {
    backArrowInstances.forEach(resizeBackArrowInstance);
  });

  renderBackArrows(0);
}
