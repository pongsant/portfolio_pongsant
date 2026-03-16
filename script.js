const hero = document.querySelector(".hero");
const canvas = document.querySelector("#particle-canvas");
const audioReactiveToggle = document.querySelector("#audio-reactive-toggle");
const audioReactiveStatus = document.querySelector("#audio-reactive-status");
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

  const state = {
    width: 0,
    height: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    pointCount: window.innerWidth < 720 ? 1800 : 3000,
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
      measureContext.font = `${weight} ${fontSize}px "Helvetica 255", Helvetica, Arial, sans-serif`;

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
      Math.min(state.width * 0.16, state.height * 0.14, 210)
    );
    const sampleStep = mobile ? 4 : 3;
    const shadowOffsetX = mobile ? 4 : 8;
    const shadowOffsetY = mobile ? 5 : 9;
    const targets = [];

    offscreenContext.clearRect(0, 0, state.width, state.height);
    offscreenContext.fillStyle = "#050505";
    offscreenContext.textAlign = "center";
    offscreenContext.textBaseline = "middle";
    offscreenContext.font = `700 ${fontSize}px "Helvetica 255", Helvetica, Arial, sans-serif`;
    offscreenContext.fillText(text, center.x + shadowOffsetX, center.y + shadowOffsetY);

    const { data } = offscreenContext.getImageData(0, 0, state.width, state.height);

    for (let y = 0; y < state.height; y += sampleStep) {
      for (let x = 0; x < state.width; x += sampleStep) {
        const alpha = data[(y * state.width + x) * 4 + 3];

        if (alpha > 100 && Math.random() > 0.08) {
          targets.push({
            x,
            y,
            z: randomBetweenWork(-90, 90)
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
    const sampleStep = mobile ? 4 : 3;
    const shadowOffsetX = mobile ? 3 : 6;
    const shadowOffsetY = mobile ? 4 : 8;
    const targets = [];

    offscreenContext.clearRect(0, 0, state.width, state.height);
    offscreenContext.fillStyle = "#050505";
    offscreenContext.textAlign = "center";
    offscreenContext.textBaseline = "middle";

    workOptions.forEach((option) => {
      const offset = getOptionOffset(option);
      const label = option.dataset.label || option.textContent.trim();
      const maxWidth = mobile ? Math.min(state.width * 0.4, 230) : Math.min(state.width * 0.3, 420);
      const maxHeight = mobile ? 32 : 48;
      const fontSize = getFittedWorkFontSize(
        label,
        maxWidth,
        maxHeight,
        mobile ? 34 : 56,
        300,
        12
      );

      offscreenContext.font = `300 ${fontSize}px "Helvetica 255", Helvetica, Arial, sans-serif`;
      offscreenContext.fillText(
        label,
        center.x + offset.x + shadowOffsetX,
        center.y + offset.y + shadowOffsetY
      );
    });

    const { data } = offscreenContext.getImageData(0, 0, state.width, state.height);

    for (let y = 0; y < state.height; y += sampleStep) {
      for (let x = 0; x < state.width; x += sampleStep) {
        const alpha = data[(y * state.width + x) * 4 + 3];

        if (alpha > 90 && Math.random() > 0.09) {
          targets.push({
            x,
            y,
            z: randomBetweenWork(-120, 120)
          });
        }
      }
    }

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
      size: randomBetweenWork(0.75, 1.55),
      seed: Math.random() * Math.PI * 2,
      depthSeed: Math.random() * Math.PI * 2
    }));
  }

  function applyTargets(targets) {
    if (!targets.length) {
      return;
    }

    state.points.forEach((point, index) => {
      const target = targets[index % targets.length];
      const scatter = state.open ? 2.7 : 3.5;
      point.tx = target.x + randomBetweenWork(-scatter, scatter);
      point.ty = target.y + randomBetweenWork(-scatter, scatter);
      point.tz = (target.z ?? 0) + randomBetweenWork(-18, 18);
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
    state.pointCount = window.innerWidth < 720 ? 1800 : 3000;
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
    const angleY = reducedMotion ? 0.06 : Math.sin(time * 0.00034) * 0.28;
    const angleX = reducedMotion ? -0.04 : Math.cos(time * 0.00026) * 0.16;
    const perspective = Math.min(state.width, state.height) * 1.15;

    for (const point of state.points) {
      point.x += (point.tx - point.x) * 0.085;
      point.y += (point.ty - point.y) * 0.085;
      point.z += (point.tz - point.z) * 0.085;

      const wobbleX = reducedMotion ? 0 : Math.sin(time * 0.0012 + point.seed) * 0.3;
      const wobbleY = reducedMotion ? 0 : Math.cos(time * 0.00105 + point.seed) * 0.24;
      const localX = point.x - centerX;
      const localY = point.y - centerY;
      const localZ = point.z + (reducedMotion ? 0 : Math.sin(time * 0.0009 + point.depthSeed) * 16);

      const rotatedX = localX * Math.cos(angleY) - localZ * Math.sin(angleY);
      const rotatedZ = localX * Math.sin(angleY) + localZ * Math.cos(angleY);
      const rotatedY = localY * Math.cos(angleX) - rotatedZ * Math.sin(angleX);
      const finalZ = localY * Math.sin(angleX) + rotatedZ * Math.cos(angleX);
      const scale = perspective / (perspective - finalZ);
      const drawX = centerX + rotatedX * scale + wobbleX;
      const drawY = centerY + rotatedY * scale + wobbleY;
      const size = Math.max(0.8, point.size * scale * (state.open ? 0.96 : 0.88));
      const alpha = state.open
        ? Math.max(0.11, Math.min(0.42, 0.13 + scale * 0.12))
        : Math.max(0.1, Math.min(0.38, 0.12 + scale * 0.1));

      context.fillStyle = `rgba(5, 5, 5, ${alpha})`;
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
  const hasMicrophoneSupport = Boolean(navigator.mediaDevices?.getUserMedia && AudioContextConstructor);
  const canUseMicrophone = hasMicrophoneSupport && (
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );

  const state = {
    width: 0,
    height: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    points: [],
    pointCount: window.innerWidth < 720 ? 1600 : 3000,
    currentShape: 0,
    shapes: ["portrait", "sphere", "cube", "torus", "wave"],
    animationId: 0,
    pointerBoost: 0,
    dispersion: 0,
    flash: 0,
    lastAutoMorphAt: 0,
    autoMorphInterval: 4200,
    audio: {
      enabled: false,
      isStarting: false,
      context: null,
      analyser: null,
      source: null,
      stream: null,
      frequencyData: null,
      previousFrequencyData: null,
      level: 0,
      bass: 0,
      lowMid: 0,
      mid: 0,
      treble: 0,
      presence: 0,
      air: 0,
      flux: 0,
      guitar: 0,
      percussion: 0,
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

  function createPortrait(count) {
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
    state.audio.bass = 0;
    state.audio.lowMid = 0;
    state.audio.mid = 0;
    state.audio.treble = 0;
    state.audio.presence = 0;
    state.audio.air = 0;
    state.audio.flux = 0;
    state.audio.guitar = 0;
    state.audio.percussion = 0;
    state.audio.beatCooldown = 0;
  }

  async function stopAudioReactiveMode() {
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
    state.audio.enabled = false;
    resetAudioMetrics();
    updateAudioUi("Enable microphone input for sound-reactive motion.");
  }

  async function startAudioReactiveMode() {
    if (!canUseMicrophone || state.audio.isStarting) {
      updateAudioUi(
        canUseMicrophone
          ? "Microphone access is still starting."
          : "Microphone input needs HTTPS or localhost in a supported browser.",
        !canUseMicrophone
      );
      return;
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

      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.82;
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
      state.audio.enabled = true;
      state.audio.lastMorphAt = performance.now();

      if (state.shapes[state.currentShape] !== "portrait") {
        morphTo(0);
      }

      updateAudioUi("Listening to room audio. Speaker sound and live ambience can drive the particles.");
    } catch (error) {
      const errorName = error?.name || "";
      let message = "Microphone input could not be enabled.";

      if (errorName === "NotAllowedError" || errorName === "SecurityError") {
        message = "Microphone permission was blocked. Allow access to make the particles react.";
      } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
        message = "No microphone input was found on this device.";
      }

      updateAudioUi(message, true);
      await stopAudioReactiveMode();
      updateAudioUi(message, true);
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

  function updateAudioReactiveState(time) {
    if (!state.audio.enabled || !state.audio.analyser || !state.audio.frequencyData) {
      state.audio.level += (0 - state.audio.level) * 0.08;
      state.audio.bass += (0 - state.audio.bass) * 0.08;
      state.audio.lowMid += (0 - state.audio.lowMid) * 0.08;
      state.audio.mid += (0 - state.audio.mid) * 0.08;
      state.audio.treble += (0 - state.audio.treble) * 0.08;
      state.audio.presence += (0 - state.audio.presence) * 0.08;
      state.audio.air += (0 - state.audio.air) * 0.08;
      state.audio.flux += (0 - state.audio.flux) * 0.08;
      state.audio.guitar += (0 - state.audio.guitar) * 0.08;
      state.audio.percussion += (0 - state.audio.percussion) * 0.08;
      return;
    }

    state.audio.analyser.getByteFrequencyData(state.audio.frequencyData);

    const bass = getBandAverage(state.audio.frequencyData, 0.01, 0.08);
    const lowMid = getBandAverage(state.audio.frequencyData, 0.08, 0.18);
    const mid = getBandAverage(state.audio.frequencyData, 0.18, 0.36);
    const presence = getBandAverage(state.audio.frequencyData, 0.36, 0.62);
    const air = getBandAverage(state.audio.frequencyData, 0.62, 0.92);
    const treble = (presence * 0.72) + (air * 0.28);
    const flux = getSpectralFlux(state.audio.frequencyData, state.audio.previousFrequencyData);
    const guitar = Math.min(1, presence * 1.18 + air * 0.38 + flux * 1.5);
    const percussion = Math.min(1, bass * 1.08 + lowMid * 0.62 + flux * 1.95);
    const level = Math.min(1, bass * 1.12 + lowMid * 0.7 + mid * 0.82 + presence * 0.66 + air * 0.32);

    state.audio.level += (level - state.audio.level) * 0.14;
    state.audio.bass += (bass - state.audio.bass) * 0.16;
    state.audio.lowMid += (lowMid - state.audio.lowMid) * 0.15;
    state.audio.mid += (mid - state.audio.mid) * 0.14;
    state.audio.treble += (treble - state.audio.treble) * 0.12;
    state.audio.presence += (presence - state.audio.presence) * 0.14;
    state.audio.air += (air - state.audio.air) * 0.12;
    state.audio.flux += (flux - state.audio.flux) * 0.22;
    state.audio.guitar += (guitar - state.audio.guitar) * 0.18;
    state.audio.percussion += (percussion - state.audio.percussion) * 0.18;

    if (state.audio.previousFrequencyData) {
      state.audio.previousFrequencyData.set(state.audio.frequencyData);
    }

    if (state.audio.beatCooldown > 0) {
      state.audio.beatCooldown -= 1;
    }

    const beatDetected =
      !reducedMotion &&
      state.audio.beatCooldown <= 0 &&
      state.audio.level > 0.08 &&
      state.audio.percussion > 0.16 &&
      state.audio.bass > 0.1;

    if (beatDetected) {
      state.pointerBoost = Math.max(state.pointerBoost, 1.26 + state.audio.level * 1.95);
      state.dispersion = Math.max(state.dispersion, 1.34);
      state.flash = Math.max(state.flash, 1);
      state.audio.beatCooldown = 10;

      if (time - state.audio.lastMorphAt > 1400 && state.shapes[state.currentShape] !== "portrait" && state.audio.bass > 0.14) {
        morphTo(0);
        state.audio.lastMorphAt = time;
      }
    }
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
      size: randomBetween(0.7, 1.8),
      seed: Math.random() * Math.PI * 2,
      orbitSeed: Math.random() * Math.PI * 2,
      driftRadius: randomBetween(0.01, 0.08),
      scatterScale: randomBetween(0.75, 1.25)
    }));
  }

  function morphTo(shapeIndex) {
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
    scheduleNextMorph();
  }

  function morphRandom() {
    let nextIndex = state.currentShape;

    while (nextIndex === state.currentShape) {
      nextIndex = Math.floor(Math.random() * state.shapes.length);
    }

    morphTo(nextIndex);
  }

  function drawPointMesh(projectedPoints, audioLevel, audioTreble, guitar, flash, shapeName) {
    if (projectedPoints.length < 3) {
      return;
    }

    const sorted = projectedPoints
      .slice()
      .sort((first, second) => first.x - second.x);
    const maxDistance = Math.min(state.width, state.height) * (shapeName === "portrait" ? 0.085 : 0.11);
    const lookahead = shapeName === "portrait" ? 6 : 5;

    context.lineWidth = 0.35 + audioTreble * 0.4 + guitar * 0.45 + flash * 0.18;

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

        const alpha = (1 - distance / maxDistance) * (0.04 + audioLevel * 0.06 + guitar * 0.08 + flash * 0.06);

        if (alpha < 0.012) {
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

    if (time - state.lastAutoMorphAt > state.autoMorphInterval) {
      morphRandom();
    }

    const audioLevel = state.audio.level;
    const audioBass = state.audio.bass;
    const audioLowMid = state.audio.lowMid;
    const audioMid = state.audio.mid;
    const audioTreble = state.audio.treble;
    const audioPresence = state.audio.presence;
    const audioAir = state.audio.air;
    const audioFlux = state.audio.flux;
    const audioGuitar = state.audio.guitar;
    const audioPercussion = state.audio.percussion;
    const sceneScale = Math.min(state.width, state.height) *
      (state.width < 720 ? 0.26 : 0.31) *
      (1 + audioBass * 0.15 + audioLevel * 0.08 + audioPercussion * 0.03);
    const perspective = sceneScale * 1.9;
    const shapeName = state.shapes[state.currentShape];
    const idleDispersion = reducedMotion ? 0.02 : 0.05 + Math.sin(time * 0.00062) * 0.018;
    const reactiveDispersion = audioLevel * 0.2 + audioBass * 0.24 + audioTreble * 0.08 + audioFlux * 0.32 + audioPercussion * 0.14;
    const globalDriftX = reducedMotion ? 0 : Math.sin(time * 0.00042) * 0.05;
    const globalDriftY = reducedMotion ? 0 : Math.cos(time * 0.00036) * 0.04;
    const globalBreathe = reducedMotion ? 0 : Math.sin(time * (0.00052 + audioBass * 0.00018)) * (0.03 + audioLevel * 0.035);
    const globalSway = reducedMotion ? 0 : Math.sin(time * (0.00048 + audioMid * 0.00016 + audioGuitar * 0.00022)) * (0.05 + audioPresence * 0.05 + audioGuitar * 0.06);
    const clearAlpha = reducedMotion ? 1 : Math.max(0.16, 0.34 - audioLevel * 0.12 - state.flash * 0.08);
    const projectedPoints = [];

    context.fillStyle = `rgba(255, 255, 255, ${clearAlpha})`;
    context.fillRect(0, 0, state.width, state.height);

    state.pointerBoost *= 0.96;
    state.dispersion += ((idleDispersion + reactiveDispersion) - state.dispersion) * 0.06;
    state.flash *= 0.92;

    for (const point of state.points) {
      let targetX = point.tx;
      let targetY = point.ty;
      let targetZ = point.tz;
      const distance = Math.hypot(targetX, targetY, targetZ) || 1;
      const normalizedX = targetX / distance;
      const normalizedY = targetY / distance;
      const normalizedZ = targetZ / distance;
      const orbitRadius = point.driftRadius * (0.45 + state.dispersion * 0.9) * point.scatterScale;
      const orbitX = reducedMotion ? 0 : Math.sin(time * 0.0009 + point.orbitSeed) * orbitRadius;
      const orbitY = reducedMotion ? 0 : Math.cos(time * 0.00082 + point.orbitSeed * 1.1) * orbitRadius;
      const orbitZ = reducedMotion ? 0 : Math.sin(time * 0.00074 + point.orbitSeed * 0.8) * orbitRadius * 0.85;
      const spreadAmount = state.dispersion * point.scatterScale;
      const spreadMultiplier = shapeName === "portrait" ? 0.05 : 0.08;
      const spreadX = normalizedX * spreadAmount * spreadMultiplier + orbitX;
      const spreadY = normalizedY * spreadAmount * spreadMultiplier + orbitY;
      const spreadZ = normalizedZ * spreadAmount * spreadMultiplier + orbitZ;

      if (shapeName === "portrait") {
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
      } else {
        targetX += spreadX;
        targetY += spreadY;
        targetZ += spreadZ;
      }

      point.x += (targetX - point.x) * 0.055;
      point.y += (targetY - point.y) * 0.055;
      point.z += (targetZ - point.z) * 0.055;

      const reactiveBoost = state.pointerBoost + audioLevel * 1.35 + audioBass * 0.8;
      const wobble = reducedMotion
        ? 0
        : Math.sin(time * (0.0012 + audioTreble * 0.0003 + audioGuitar * 0.0005) + point.seed) * (0.004 + reactiveBoost * 0.0044 + audioFlux * 0.004);
      const audioLift = reducedMotion
        ? 0
        : Math.cos(time * (0.00105 + audioMid * 0.0002 + audioLowMid * 0.00016) + point.seed * 1.2) * (audioBass * 0.075 + audioPercussion * 0.018);
      const flowX = reducedMotion
        ? 0
        : Math.sin(time * 0.0009 + point.seed + point.orbitSeed) * (0.008 + audioPresence * 0.012 + audioGuitar * 0.026);
      const flowY = reducedMotion
        ? 0
        : Math.cos(time * 0.00082 + point.seed * 1.1) * (0.007 + audioMid * 0.016 + audioPercussion * 0.012);
      const flowZ = reducedMotion
        ? 0
        : Math.sin(time * 0.00076 + point.seed * 0.9) * (0.025 + audioBass * 0.04 + audioFlux * 0.05 + state.dispersion * 0.02);
      const deformedX = point.x + wobble + flowX + globalDriftX + point.y * globalSway * 0.14;
      const deformedY = point.y * (1 + globalBreathe * 0.18) + wobble * 0.6 + audioLift + flowY + globalDriftY;
      const deformedZ = point.z + audioLift * 0.65 + flowZ;
      const depth = perspective / (perspective - deformedZ * sceneScale * 0.6);
      const x = deformedX * sceneScale * depth + state.width / 2;
      const y = deformedY * sceneScale * depth + state.height / 2;
      const size = point.size * depth * (1 + audioLevel * 0.72 + audioBass * 0.34);
      const alpha = Math.max(0.16, Math.min(0.94, 0.22 + depth * 0.42 + audioLevel * 0.19 + audioBass * 0.14 + state.flash * 0.08));

      if (x < -12 || x > state.width + 12 || y < -12 || y > state.height + 12) {
        continue;
      }

      const ghostShiftX = (Math.sin(time * 0.0006 + point.seed) * (1.5 + audioTreble * 2 + audioGuitar * 3.6) + globalDriftX * sceneScale * 0.16);
      const ghostShiftY = (Math.cos(time * 0.00056 + point.seed * 1.2) * (1.2 + audioMid * 2.2 + audioPercussion * 2.4) + globalDriftY * sceneScale * 0.12);

      context.fillStyle = `rgba(17, 17, 17, ${alpha * 0.24})`;
      context.fillRect(x - ghostShiftX, y - ghostShiftY, Math.max(0.75, size * 0.82), Math.max(0.75, size * 0.82));

      context.fillStyle = `rgba(17, 17, 17, ${alpha})`;
      context.fillRect(x, y, size, size);

      if (size > 1.05) {
        context.fillStyle = `rgba(17, 17, 17, ${Math.min(0.42, alpha * 0.32)})`;
        context.fillRect(x - size * 0.38, y - size * 0.38, size * 0.36, size * 0.36);
      }

      const meshStep = state.width < 720 ? 14 : 18;

      if (projectedPoints.length < 240 && Math.floor(point.seed * 1000) % meshStep === 0) {
        projectedPoints.push({
          x,
          y
        });
      }
    }

    drawPointMesh(projectedPoints, audioLevel, audioTreble, audioGuitar, state.flash, shapeName);

    state.animationId = window.requestAnimationFrame(render);
  }

  function handleHeroClick(event) {
    if (event.target.closest("a")) {
      return;
    }

    morphRandom();
  }

  async function handleAudioReactiveToggle(event) {
    event.stopPropagation();

    if (state.audio.enabled) {
      await stopAudioReactiveMode();
      return;
    }

    await startAudioReactiveMode();
  }

  function init() {
    resizeCanvas();
    createPoints();
    scheduleNextMorph(0);
    morphTo(0);
    render(0);

    window.addEventListener("resize", resizeCanvas);
    hero.addEventListener("click", handleHeroClick);

    if (audioReactiveToggle) {
      if (!canUseMicrophone) {
        updateAudioUi("Microphone input needs HTTPS or localhost in a supported browser.", true);
      } else {
        updateAudioUi("Enable microphone input for sound-reactive motion.");
        audioReactiveToggle.addEventListener("click", handleAudioReactiveToggle);
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
