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
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    width: 0,
    height: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    pointCount: window.innerWidth < 720 ? 1050 : 1600,
    points: [],
    textTargets: [],
    optionTargets: [],
    open: false,
    animationId: 0
  };

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
    const fontSize = Math.max(68, Math.min(state.width * 0.18, state.height * 0.2, 230));
    const sampleStep = state.width < 720 ? 8 : 6;
    const targets = [];

    offscreenContext.clearRect(0, 0, state.width, state.height);
    offscreenContext.fillStyle = "#050505";
    offscreenContext.textAlign = "center";
    offscreenContext.textBaseline = "middle";
    offscreenContext.font = `700 ${fontSize}px "Syne", sans-serif`;
    offscreenContext.fillText("MY WORK", state.width / 2, state.height / 2);

    const { data } = offscreenContext.getImageData(0, 0, state.width, state.height);

    for (let y = 0; y < state.height; y += sampleStep) {
      for (let x = 0; x < state.width; x += sampleStep) {
        const alpha = data[(y * state.width + x) * 4 + 3];

        if (alpha > 140) {
          targets.push({ x, y });
        }
      }
    }

    if (targets.length === 0) {
      return Array.from({ length: state.pointCount }, () => ({
        x: state.width / 2 + randomBetweenWork(-120, 120),
        y: state.height / 2 + randomBetweenWork(-60, 60)
      }));
    }

    return shuffleWork(targets).slice(0, state.pointCount);
  }

  function createOptionTargets() {
    const centerX = state.width / 2;
    const centerY = state.height / 2;
    const clusters = workOptions.map((option) => {
      const offset = getOptionOffset(option);

      return {
        x: centerX + offset.x,
        y: centerY + offset.y
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
          y: cluster.y + Math.sin(angle) * radius
        });
      }
    });

    return shuffleWork(targets).slice(0, state.pointCount);
  }

  function createPoints() {
    state.points = Array.from({ length: state.pointCount }, () => ({
      x: state.width / 2 + randomBetweenWork(-80, 80),
      y: state.height / 2 + randomBetweenWork(-80, 80),
      tx: state.width / 2,
      ty: state.height / 2,
      size: randomBetweenWork(0.9, 2.2),
      seed: Math.random() * Math.PI * 2
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
    state.pointCount = window.innerWidth < 720 ? 1050 : 1600;
    workCanvas.width = Math.round(state.width * state.dpr);
    workCanvas.height = Math.round(state.height * state.dpr);
    workCanvas.style.width = `${state.width}px`;
    workCanvas.style.height = `${state.height}px`;
    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

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

    for (const point of state.points) {
      point.x += (point.tx - point.x) * 0.085;
      point.y += (point.ty - point.y) * 0.085;

      const wobbleX = reducedMotion ? 0 : Math.sin(time * 0.0013 + point.seed) * 0.8;
      const wobbleY = reducedMotion ? 0 : Math.cos(time * 0.0011 + point.seed) * 0.8;
      const alpha = state.open ? 0.44 : 0.62;

      context.fillStyle = `rgba(5, 5, 5, ${alpha})`;
      context.fillRect(point.x + wobbleX, point.y + wobbleY, point.size, point.size);
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

    if (state.open) {
      setWorkMenuState(false);
    }
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
