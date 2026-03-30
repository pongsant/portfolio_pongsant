const INTRO_LINES = ["Pongsant", "chintanapakdee"];
const MOTION_DAMPING = 0.15;

const introStage = document.getElementById("intro-stage");
const introButton = document.getElementById("intro-enter");
const introLineTop = document.getElementById("intro-line-top");
const introLineBottom = document.getElementById("intro-line-bottom");
const introCanvas = document.getElementById("intro-bg-canvas");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function onMediaQueryChange(mediaQueryList, handler) {
  if (!mediaQueryList || typeof handler !== "function") {
    return;
  }

  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", handler);
    return;
  }

  if (typeof mediaQueryList.addListener === "function") {
    mediaQueryList.addListener(handler);
  }
}

if (introStage && introButton && introLineTop && introLineBottom) {
  const lineGroups = [
    { element: introLineTop, text: INTRO_LINES[0], spans: [] },
    { element: introLineBottom, text: INTRO_LINES[1], spans: [] }
  ];
  const allSpans = [];
  const mouse = { x: 0, y: 0 };
  const cursor = { x: 0, y: 0 };
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  let textRafId = 0;
  let isLeaving = false;

  const introContext = introCanvas?.getContext("2d");
  const backdropState = {
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    width: 0,
    height: 0,
    frame: 0,
    visible: true,
    points: [],
    pointerInside: false,
    pointerX: 0,
    pointerY: 0,
    pointerDrawX: 0,
    pointerDrawY: 0,
    flowX: 0,
    flowY: 0,
    gatherStrength: 0.66,
    burstProgress: 0,
    clickPulse: 0,
    loopOffset: Math.random() * Math.PI * 2
  };

  function distance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.hypot(dx, dy);
  }

  function pressureFromDistance(distanceValue, maxDistance) {
    const normalized = 1 - distanceValue / Math.max(1, maxDistance);
    return clamp(normalized, 0, 1);
  }

  function buildChars() {
    allSpans.length = 0;

    lineGroups.forEach((group) => {
      group.element.innerHTML = "";
      group.spans.length = 0;

      group.text.split("").forEach((char) => {
        const span = document.createElement("span");
        span.className = "intro-pressure__char";
        span.textContent = char;
        group.element.append(span);
        group.spans.push(span);
        allSpans.push(span);
      });
    });
  }

  function setInitialPointer() {
    const rect = introButton.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouse.x = centerX;
    mouse.y = centerY;
    cursor.x = centerX;
    cursor.y = centerY;
  }

  function updateFontSize() {
    const viewportWidth = Math.max(window.innerWidth, 320);
    const isMobileViewport = window.innerWidth <= 780;
    const horizontalBudget = Math.min(viewportWidth * (isMobileViewport ? 0.84 : 0.92), isMobileViewport ? 720 : 1320);
    const maxLineChars = Math.max(...INTRO_LINES.map((line) => line.length), 1);
    const scaleFactor = isMobileViewport ? 0.84 : 0.64;
    const nextSize = clamp(
      horizontalBudget / (maxLineChars * scaleFactor),
      isMobileViewport ? 18 : 24,
      isMobileViewport ? 42 : 116
    );

    lineGroups.forEach((group) => {
      group.element.style.fontSize = `${nextSize}px`;
    });
  }

  function animateTextPressure() {
    mouse.x += (cursor.x - mouse.x) * MOTION_DAMPING;
    mouse.y += (cursor.y - mouse.y) * MOTION_DAMPING;

    const headingRect = introButton.getBoundingClientRect();
    const maxDistance = Math.max(headingRect.width * 0.52, 160);

    allSpans.forEach((span) => {
      const rect = span.getBoundingClientRect();
      const charCenter = {
        x: rect.left + rect.width * 0.5,
        y: rect.top + rect.height * 0.5
      };

      const pressure = pressureFromDistance(distance(mouse, charCenter), maxDistance);
      const weight = Math.round(320 + pressure * 520);
      const alpha = 0.56 + pressure * 0.44;
      const lift = -pressure * 5.8;
      const scaleX = 0.9 + pressure * 0.28;
      const scaleY = 1 + pressure * 0.13;
      const shadowAlpha = clamp(0.04 + pressure * 0.16, 0, 0.28);

      span.style.fontWeight = String(weight);
      span.style.opacity = alpha.toFixed(3);
      span.style.transform = `translate3d(0, ${lift.toFixed(3)}px, 0) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;
      span.style.textShadow = `0 ${(2 + pressure * 5).toFixed(3)}px ${(8 + pressure * 18).toFixed(3)}px rgba(0, 0, 0, ${shadowAlpha.toFixed(3)})`;
    });

    textRafId = window.requestAnimationFrame(animateTextPressure);
  }

  function stopTextPressure() {
    if (!textRafId) {
      return;
    }

    window.cancelAnimationFrame(textRafId);
    textRafId = 0;
  }

  function backdropColor(alpha) {
    return `rgba(0, 0, 0, ${clamp(alpha, 0, 1)})`;
  }

  function buildBackdropParticles() {
    if (!introCanvas || !introContext) {
      return;
    }

    const rect = introStage.getBoundingClientRect();
    backdropState.width = Math.max(1, Math.round(rect.width || window.innerWidth));
    backdropState.height = Math.max(1, Math.round(rect.height || window.innerHeight));
    backdropState.dpr = Math.min(window.devicePixelRatio || 1, 2);

    introCanvas.width = Math.max(1, Math.round(backdropState.width * backdropState.dpr));
    introCanvas.height = Math.max(1, Math.round(backdropState.height * backdropState.dpr));
    introCanvas.style.width = `${backdropState.width}px`;
    introCanvas.style.height = `${backdropState.height}px`;
    introContext.setTransform(backdropState.dpr, 0, 0, backdropState.dpr, 0, 0);

    backdropState.flowX = backdropState.width * (window.innerWidth < 720 ? 0.58 : 0.62);
    backdropState.flowY = backdropState.height * 0.52;

    if (!backdropState.pointerInside) {
      backdropState.pointerX = backdropState.flowX;
      backdropState.pointerY = backdropState.flowY;
      backdropState.pointerDrawX = backdropState.flowX;
      backdropState.pointerDrawY = backdropState.flowY;
    }

    const area = backdropState.width * backdropState.height;
    const count = window.innerWidth < 720
      ? clamp(Math.round(area / 12800), 90, 160)
      : clamp(Math.round(area / 9800), 130, 220);

    backdropState.points = Array.from({ length: count }, () => ({
      x: backdropState.width * (0.08 + Math.random() * 0.84),
      y: backdropState.height * (0.08 + Math.random() * 0.84),
      homeX: backdropState.width * (0.08 + Math.random() * 0.84),
      homeY: backdropState.height * (0.08 + Math.random() * 0.84),
      vx: (Math.random() - 0.5) * 0.44,
      vy: (Math.random() - 0.5) * 0.44,
      seed: Math.random() * Math.PI * 2,
      drift: 0.24 + Math.random() * 1.26,
      size: 0.6 + Math.random() * 2.3,
      clusterBias: 0.42 + Math.random() * 0.62,
      burstVX: 0,
      burstVY: 0
    }));
  }

  function stopBackdrop() {
    if (!backdropState.frame) {
      return;
    }

    window.cancelAnimationFrame(backdropState.frame);
    backdropState.frame = 0;
  }

  function queueBackdrop() {
    if (!introContext || !introCanvas || backdropState.frame || reducedMotionQuery.matches || !backdropState.visible) {
      return;
    }

    backdropState.frame = window.requestAnimationFrame(drawBackdrop);
  }

  function triggerBackdropBurst() {
    if (reducedMotionQuery.matches || !backdropState.points.length) {
      return;
    }

    const centerX = backdropState.pointerInside ? backdropState.pointerDrawX : backdropState.flowX;
    const centerY = backdropState.pointerInside ? backdropState.pointerDrawY : backdropState.flowY;
    backdropState.burstProgress = 1;
    backdropState.clickPulse = 1;
    backdropState.loopOffset += Math.PI * 0.18;

    backdropState.points.forEach((point) => {
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      const pointDistance = Math.max(8, Math.hypot(dx, dy));
      const radialX = dx / pointDistance;
      const radialY = dy / pointDistance;
      const tangentialX = -radialY;
      const tangentialY = radialX;
      const impulse = 3.8 + Math.random() * 5.4;
      const swirl = (Math.random() - 0.5) * 2.8;

      point.burstVX = radialX * impulse + tangentialX * swirl;
      point.burstVY = radialY * impulse + tangentialY * swirl;
    });

    queueBackdrop();
  }

  function stepBackdrop(time, frozen = false) {
    const pointerTargetX = backdropState.pointerInside ? backdropState.pointerX : backdropState.flowX;
    const pointerTargetY = backdropState.pointerInside ? backdropState.pointerY : backdropState.flowY;

    backdropState.pointerDrawX += (pointerTargetX - backdropState.pointerDrawX) * (frozen ? 1 : 0.18);
    backdropState.pointerDrawY += (pointerTargetY - backdropState.pointerDrawY) * (frozen ? 1 : 0.18);

    if (frozen) {
      return;
    }

    const t = time * 0.001;
    const gatherWave = 0.5 + Math.sin(t * 0.8 + backdropState.loopOffset) * 0.5;
    backdropState.gatherStrength += ((0.44 + gatherWave * 0.5) - backdropState.gatherStrength) * 0.07;
    backdropState.burstProgress = Math.max(0, backdropState.burstProgress - 0.022);
    backdropState.clickPulse = Math.max(0, backdropState.clickPulse - 0.03);

    backdropState.points.forEach((point) => {
      const wobbleX = Math.cos(t * (0.6 + point.drift) + point.seed) * 0.84;
      const wobbleY = Math.sin(t * (0.52 + point.drift * 1.06) + point.seed * 0.84) * 0.82;
      const gatherX = point.homeX + (backdropState.flowX - point.homeX) * backdropState.gatherStrength * point.clusterBias;
      const gatherY = point.homeY + (backdropState.flowY - point.homeY) * backdropState.gatherStrength * point.clusterBias;
      const pullX = (gatherX - point.x) * 0.006;
      const pullY = (gatherY - point.y) * 0.0058;

      point.vx = (point.vx + wobbleX * 0.02 + pullX) * 0.936;
      point.vy = (point.vy + wobbleY * 0.02 + pullY) * 0.936;

      if (backdropState.pointerInside) {
        const dx = backdropState.pointerDrawX - point.x;
        const dy = backdropState.pointerDrawY - point.y;
        const pointDistance = Math.hypot(dx, dy);

        if (pointDistance > 0.001 && pointDistance < 260) {
          const strength = (1 - pointDistance / 260) * 0.044;
          point.vx += (dx / pointDistance) * strength;
          point.vy += (dy / pointDistance) * strength;
        }
      }

      if (backdropState.burstProgress > 0) {
        point.vx += point.burstVX * backdropState.burstProgress * 0.23;
        point.vy += point.burstVY * backdropState.burstProgress * 0.23;
      }

      point.vx = clamp(point.vx, -7.8, 7.8);
      point.vy = clamp(point.vy, -7.8, 7.8);
      point.x += point.vx;
      point.y += point.vy;

      if (point.x < -18) {
        point.x = backdropState.width + 18;
      } else if (point.x > backdropState.width + 18) {
        point.x = -18;
      }

      if (point.y < -18) {
        point.y = backdropState.height + 18;
      } else if (point.y > backdropState.height + 18) {
        point.y = -18;
      }
    });
  }

  function drawBackdrop(time = 0, frozen = false) {
    if (!introContext || !introCanvas) {
      return;
    }

    const isFrozen = frozen || reducedMotionQuery.matches;
    stepBackdrop(time, isFrozen);

    introContext.setTransform(1, 0, 0, 1, 0, 0);
    introContext.clearRect(0, 0, introCanvas.width, introCanvas.height);
    introContext.setTransform(backdropState.dpr, 0, 0, backdropState.dpr, 0, 0);
    introContext.fillStyle = "#ffffff";
    introContext.fillRect(0, 0, backdropState.width, backdropState.height);

    const glow = introContext.createRadialGradient(
      backdropState.flowX,
      backdropState.flowY,
      0,
      backdropState.flowX,
      backdropState.flowY,
      Math.max(backdropState.width, backdropState.height) * 0.72
    );
    glow.addColorStop(0, backdropColor(0.13));
    glow.addColorStop(0.45, backdropColor(0.05));
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    introContext.fillStyle = glow;
    introContext.fillRect(0, 0, backdropState.width, backdropState.height);

    const linkDistance = window.innerWidth < 720 ? 130 : 176;
    for (let index = 0; index < backdropState.points.length; index += 1) {
      const pointA = backdropState.points[index];
      for (let nextIndex = index + 1; nextIndex < backdropState.points.length; nextIndex += 1) {
        const pointB = backdropState.points[nextIndex];
        const pointDistance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
        if (!pointDistance || pointDistance > linkDistance) {
          continue;
        }

        const alpha = ((1 - pointDistance / linkDistance) ** 2) * 0.3;
        introContext.strokeStyle = backdropColor(alpha);
        introContext.lineWidth = 0.32 + alpha * 1.5;
        introContext.beginPath();
        introContext.moveTo(pointA.x, pointA.y);
        introContext.lineTo(pointB.x, pointB.y);
        introContext.stroke();
      }
    }

    backdropState.points.forEach((point) => {
      const pulse = (Math.sin(time * 0.0014 + point.seed) + 1) * 0.5;
      introContext.fillStyle = backdropColor(0.12 + pulse * 0.23);
      introContext.beginPath();
      introContext.arc(point.x, point.y, point.size * (0.7 + pulse * 0.62), 0, Math.PI * 2);
      introContext.fill();
    });

    if (backdropState.clickPulse > 0.001) {
      const pulseRadius = 20 + (1 - backdropState.clickPulse) * Math.min(backdropState.width, backdropState.height) * 0.18;
      introContext.strokeStyle = backdropColor(0.25 * backdropState.clickPulse);
      introContext.lineWidth = 2.4 * backdropState.clickPulse;
      introContext.beginPath();
      introContext.arc(backdropState.flowX, backdropState.flowY, pulseRadius, 0, Math.PI * 2);
      introContext.stroke();
    }

    introContext.fillStyle = backdropColor(0.76);
    introContext.beginPath();
    introContext.arc(backdropState.flowX, backdropState.flowY, 3.2, 0, Math.PI * 2);
    introContext.fill();

    if (isFrozen || !backdropState.visible) {
      backdropState.frame = 0;
      return;
    }

    backdropState.frame = window.requestAnimationFrame(drawBackdrop);
  }

  function updateBackdropPointer(event) {
    const rect = introStage.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    backdropState.pointerX = clamp(event.clientX - rect.left, 2, backdropState.width - 2);
    backdropState.pointerY = clamp(event.clientY - rect.top, 2, backdropState.height - 2);

    if (!backdropState.pointerInside) {
      backdropState.pointerDrawX = backdropState.pointerX;
      backdropState.pointerDrawY = backdropState.pointerY;
    }

    backdropState.pointerInside = true;
    if (reducedMotionQuery.matches) {
      drawBackdrop(performance.now(), true);
      return;
    }

    queueBackdrop();
  }

  function resetBackdropPointer() {
    backdropState.pointerInside = false;

    if (reducedMotionQuery.matches) {
      drawBackdrop(performance.now(), true);
      return;
    }

    queueBackdrop();
  }

  function refreshBackdrop() {
    if (!introContext || !introCanvas) {
      return;
    }

    buildBackdropParticles();
    stopBackdrop();
    drawBackdrop(performance.now(), reducedMotionQuery.matches);
    queueBackdrop();
  }

  function navigateToHome() {
    if (isLeaving) {
      return;
    }

    isLeaving = true;
    document.body.classList.add("is-leaving");
    stopTextPressure();
    stopBackdrop();

    window.setTimeout(() => {
      window.location.href = "../index.html?fromIntro=1";
    }, 700);
  }

  function handlePointerMove(event) {
    cursor.x = event.clientX;
    cursor.y = event.clientY;
    updateBackdropPointer(event);
  }

  function handleTouchMove(event) {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    cursor.x = touch.clientX;
    cursor.y = touch.clientY;
    updateBackdropPointer(touch);
  }

  function handleVisibilityChange() {
    backdropState.visible = !document.hidden;

    if (!backdropState.visible) {
      stopBackdrop();
      return;
    }

    drawBackdrop(performance.now(), reducedMotionQuery.matches);
    queueBackdrop();
  }

  buildChars();
  updateFontSize();
  setInitialPointer();
  animateTextPressure();

  if (introContext && introCanvas) {
    refreshBackdrop();
  }

  window.addEventListener("mousemove", handlePointerMove);
  window.addEventListener("touchmove", handleTouchMove, { passive: true });
  window.addEventListener("resize", () => {
    updateFontSize();
    refreshBackdrop();
  });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  onMediaQueryChange(reducedMotionQuery, () => {
    if (reducedMotionQuery.matches) {
      stopBackdrop();
    }

    drawBackdrop(performance.now(), reducedMotionQuery.matches);
    queueBackdrop();
  });

  introStage.addEventListener("pointerleave", resetBackdropPointer);
  introStage.addEventListener("pointerdown", (event) => {
    updateBackdropPointer(event);
    triggerBackdropBurst();
  });

  introButton.addEventListener("click", navigateToHome);
  introButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToHome();
    }
  });

  window.addEventListener("beforeunload", () => {
    stopTextPressure();
    stopBackdrop();
  });
}
