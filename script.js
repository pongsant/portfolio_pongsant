const hero = document.querySelector(".hero");
const canvas = document.querySelector("#particle-canvas");
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
    pointCount: window.innerWidth < 720 ? 1500 : 2600,
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

  function getFittedWorkFontSize(text, maxWidth, maxHeight, startSize, weight = 700) {
    let fontSize = startSize;

    while (fontSize > 28) {
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
    const text = "MY WORK";
    const center = getWorkCenter();
    const maxWidth = state.width * (window.innerWidth < 720 ? 0.72 : 0.58);
    const maxHeight = state.height * (window.innerWidth < 720 ? 0.1 : 0.11);
    const fontSize = getFittedWorkFontSize(
      text,
      maxWidth,
      maxHeight,
      Math.min(state.width * 0.16, state.height * 0.14, 210)
    );
    const targets = [];

    const sampleStep = window.innerWidth < 720 ? 5 : 4;

    offscreenContext.clearRect(0, 0, state.width, state.height);
    offscreenContext.fillStyle = "#050505";
    offscreenContext.textAlign = "center";
    offscreenContext.textBaseline = "middle";
    offscreenContext.font = `700 ${fontSize}px "Helvetica 255", Helvetica, Arial, sans-serif`;
    offscreenContext.fillText(text, center.x, center.y);

    const { data } = offscreenContext.getImageData(0, 0, state.width, state.height);

    for (let y = 0; y < state.height; y += sampleStep) {
      for (let x = 0; x < state.width; x += sampleStep) {
        const alpha = data[(y * state.width + x) * 4 + 3];

        if (alpha > 140) {
          targets.push({
            x,
            y,
            z: randomBetweenWork(-90, 90)
          });
        }
      }
    }

    if (targets.length === 0) {
      return Array.from({ length: state.pointCount }, () => ({
        x: state.width / 2 + randomBetweenWork(-120, 120),
        y: state.height / 2 + randomBetweenWork(-60, 60),
        z: randomBetweenWork(-90, 90)
      }));
    }

    return shuffleWork(targets).slice(0, state.pointCount);
  }

  function syncWorkLayoutVars() {
    const isMobile = window.innerWidth < 720;
    const centerWidth = Math.min(window.innerWidth * 0.9, isMobile ? 520 : 820);
    const triggerFontSize = getFittedWorkFontSize(
      "MY WORK",
      centerWidth * (isMobile ? 0.94 : 0.88),
      window.innerHeight * (isMobile ? 0.1 : 0.12),
      isMobile ? Math.min(window.innerWidth * 0.14, 72) : Math.min(window.innerWidth * 0.09, 108)
    );

    workScene.style.setProperty("--work-center-width", `${centerWidth}px`);
    workScene.style.setProperty("--work-trigger-font-size", `${triggerFontSize}px`);
  }

  function createOptionTargets() {
    const center = getWorkCenter();
    const clusters = workOptions.map((option) => {
      const offset = getOptionOffset(option);

      return {
        x: center.x + offset.x,
        y: center.y + offset.y
      };
    });

    const targets = [];
    const countPerCluster = Math.ceil(state.pointCount / clusters.length);

    clusters.forEach((cluster) => {
      for (let index = 0; index < countPerCluster; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 18 + Math.pow(Math.random(), 0.7) * (window.innerWidth < 720 ? 64 : 92);

        targets.push({
          x: cluster.x + Math.cos(angle) * radius,
          y: cluster.y + Math.sin(angle) * radius,
          z: randomBetweenWork(-120, 120)
        });
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
      size: randomBetweenWork(0.9, 2.2),
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
      point.tx = target.x + randomBetweenWork(-2.5, 2.5);
      point.ty = target.y + randomBetweenWork(-2.5, 2.5);
      point.tz = (target.z ?? 0) + randomBetweenWork(-26, 26);
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
    state.pointCount = window.innerWidth < 720 ? 1500 : 2600;
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

      const wobbleX = reducedMotion ? 0 : Math.sin(time * 0.0012 + point.seed) * 0.9;
      const wobbleY = reducedMotion ? 0 : Math.cos(time * 0.00105 + point.seed) * 0.75;
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
      const size = point.size * scale;
      const alpha = state.open
        ? Math.max(0.2, Math.min(0.58, 0.3 + scale * 0.18))
        : Math.max(0.32, Math.min(0.92, 0.42 + scale * 0.28));

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

  const state = {
    width: 0,
    height: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    points: [],
    pointCount: window.innerWidth < 720 ? 1200 : 2200,
    currentShape: 0,
    shapes: ["portrait", "sphere", "cube", "torus", "wave"],
    animationId: 0,
    pointerBoost: 0
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

      if (chance < 0.52) {
        point = sampleSphereSurface(0.42, 0.52, 0.38, 0.02, -0.34, 0);
        point.x += point.y * 0.08;
      } else if (chance < 0.72) {
        point = sampleCylinder(0.12, 0.35, 0.16);
      } else {
        point = sampleSphereSurface(0.78, 0.32, 0.42, 0, 0.62, 0);
        point.y = Math.max(point.y, 0.32 + Math.random() * 0.46);
        point.x += Math.sin(point.y * 5.5) * 0.04;
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
      size: randomBetween(0.7, 1.8),
      seed: Math.random() * Math.PI * 2
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
    });

    state.pointerBoost = 1;
  }

  function morphRandom() {
    let nextIndex = state.currentShape;

    while (nextIndex === state.currentShape) {
      nextIndex = Math.floor(Math.random() * state.shapes.length);
    }

    morphTo(nextIndex);
  }

  function rotatePoint(point, angleX, angleY) {
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);

    const rotatedX = point.x * cosY - point.z * sinY;
    const rotatedZ = point.x * sinY + point.z * cosY;
    const rotatedY = point.y * cosX - rotatedZ * sinX;
    const finalZ = point.y * sinX + rotatedZ * cosX;

    return { x: rotatedX, y: rotatedY, z: finalZ };
  }

  function render(time) {
    context.clearRect(0, 0, state.width, state.height);

    const sceneScale = Math.min(state.width, state.height) * (state.width < 720 ? 0.26 : 0.31);
    const angleY = reducedMotion ? 0.25 : time * 0.00028;
    const angleX = reducedMotion ? -0.14 : Math.sin(time * 0.00021) * 0.28 - 0.16;
    const perspective = sceneScale * 1.9;

    state.pointerBoost *= 0.96;

    for (const point of state.points) {
      point.x += (point.tx - point.x) * 0.055;
      point.y += (point.ty - point.y) * 0.055;
      point.z += (point.tz - point.z) * 0.055;

      const wobble = reducedMotion ? 0 : Math.sin(time * 0.0012 + point.seed) * 0.005 * state.pointerBoost;
      const rotated = rotatePoint(
        {
          x: point.x + wobble,
          y: point.y + wobble * 0.6,
          z: point.z
        },
        angleX,
        angleY
      );

      const depth = perspective / (perspective - rotated.z * sceneScale * 0.6);
      const x = rotated.x * sceneScale * depth + state.width / 2;
      const y = rotated.y * sceneScale * depth + state.height / 2;
      const size = point.size * depth;
      const alpha = Math.max(0.16, Math.min(0.82, 0.22 + depth * 0.42));

      if (x < -12 || x > state.width + 12 || y < -12 || y > state.height + 12) {
        continue;
      }

      context.fillStyle = `rgba(17, 17, 17, ${alpha})`;
      context.fillRect(x, y, size, size);
    }

    state.animationId = window.requestAnimationFrame(render);
  }

  function handleHeroClick(event) {
    if (event.target.closest("a")) {
      return;
    }

    morphRandom();
  }

  function init() {
    resizeCanvas();
    createPoints();
    morphTo(0);
    render(0);

    window.addEventListener("resize", resizeCanvas);
    hero.addEventListener("click", handleHeroClick);
  }

  init();
}
