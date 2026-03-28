const INTRO_LINES = ["PONGSANT", "CHINTANAPAKDEE"];
const MOTION_DAMPING = 0.15;
const TWO_PI = Math.PI * 2;

const introStage = document.getElementById("intro-stage");
const introButton = document.getElementById("intro-enter");
const introLineTop = document.getElementById("intro-line-top");
const introLineBottom = document.getElementById("intro-line-bottom");
const introCanvas = document.getElementById("intro-bg-canvas");
const introStack = introButton?.querySelector(".intro-pressure__stack");

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
  const mouse = { x: 0, y: 0 };
  const cursor = { x: 0, y: 0 };
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  let textRafId = 0;
  let isLeaving = false;
  let previousCursorX = 0;
  let previousCursorY = 0;
  let pointerSpeed = 0;
  let textHoverBoost = 0;
  let isTextHovered = false;

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
    loopOffset: Math.random() * Math.PI * 2,
    flowTargetX: 0,
    flowTargetY: 0,
    pointerEnergy: 0
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
    lineGroups.forEach((group) => {
      group.element.innerHTML = "";
      group.spans.length = 0;

      group.text.split("").forEach((char) => {
        const span = document.createElement("span");
        span.className = "intro-pressure__char";
        span.textContent = char;
        group.element.append(span);
        group.spans.push(span);
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
    previousCursorX = centerX;
    previousCursorY = centerY;
  }

  function updateFontSize() {
    const viewportWidth = Math.max(window.innerWidth, 320);
    const horizontalBudget = Math.min(viewportWidth * 0.92, 1320);
    const maxLineChars = Math.max(...INTRO_LINES.map((line) => line.length), 1);
    const nextSize = clamp(horizontalBudget / (maxLineChars * 0.64), 24, 116);

    lineGroups.forEach((group) => {
      group.element.style.fontSize = `${nextSize}px`;
    });
  }

  function animateTextPressure() {
    const cursorDeltaX = cursor.x - previousCursorX;
    const cursorDeltaY = cursor.y - previousCursorY;
    previousCursorX = cursor.x;
    previousCursorY = cursor.y;
    pointerSpeed += (Math.hypot(cursorDeltaX, cursorDeltaY) - pointerSpeed) * 0.22;
    textHoverBoost += ((isTextHovered ? 1 : 0) - textHoverBoost) * 0.11;

    mouse.x += (cursor.x - mouse.x) * MOTION_DAMPING;
    mouse.y += (cursor.y - mouse.y) * MOTION_DAMPING;

    const headingRect = introButton.getBoundingClientRect();
    const headingCenterX = headingRect.left + headingRect.width * 0.5;
    const headingCenterY = headingRect.top + headingRect.height * 0.5;
    const normalizedX = clamp((mouse.x - headingCenterX) / Math.max(1, headingRect.width * 0.5), -1, 1);
    const normalizedY = clamp((mouse.y - headingCenterY) / Math.max(1, headingRect.height * 0.5), -1, 1);
    const speedBoost = clamp(pointerSpeed / 26, 0, 1);
    const maxDistance = Math.max(headingRect.width * 0.52, 160);
    const phase = performance.now() * 0.008;

    if (introStack) {
      const tiltX = (-normalizedY * (3 + textHoverBoost * 4)).toFixed(3);
      const tiltY = (normalizedX * (4 + textHoverBoost * 5)).toFixed(3);
      const driftX = (normalizedX * (4 + textHoverBoost * 7)).toFixed(3);
      const driftY = (normalizedY * (2 + textHoverBoost * 4)).toFixed(3);
      const depthScale = (1 + textHoverBoost * 0.02 + speedBoost * 0.01).toFixed(4);
      introStack.style.transform = `translate3d(${driftX}px, ${driftY}px, 0) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${depthScale})`;
    }

    lineGroups.forEach((group, lineIndex) => {
      const lineWave = Math.sin(phase + lineIndex * 1.3) * (0.7 + textHoverBoost * 1.8);
      const lineShiftX = normalizedX * (lineIndex === 0 ? -3.8 : 3.8) * (0.35 + textHoverBoost);
      group.element.style.letterSpacing = `${0.014 + textHoverBoost * 0.01}em`;
      group.element.style.transform = `translate3d(${lineShiftX.toFixed(3)}px, ${lineWave.toFixed(3)}px, 0)`;

      group.spans.forEach((span, charIndex) => {
        const rect = span.getBoundingClientRect();
        const charCenter = {
          x: rect.left + rect.width * 0.5,
          y: rect.top + rect.height * 0.5
        };

        const pressure = pressureFromDistance(distance(mouse, charCenter), maxDistance);
        const wave = Math.sin(phase + charIndex * 0.62 + lineIndex * 1.7) * (0.25 + textHoverBoost * 1.1);
        const weight = Math.round(300 + pressure * (500 + textHoverBoost * 180) + speedBoost * 80);
        const alpha = clamp(0.52 + pressure * 0.46 + textHoverBoost * 0.08, 0.2, 1);
        const lift = -pressure * (5.2 + textHoverBoost * 2.4) + wave * 0.8;
        const shiftX = normalizedX * pressure * 3.8 + wave * 0.6;
        const scaleX = 0.92 + pressure * (0.2 + textHoverBoost * 0.1);
        const scaleY = 1 + pressure * (0.12 + textHoverBoost * 0.08);
        const rotation = normalizedX * pressure * 4.8 + wave * 2.2;
        const shadowAlpha = clamp(0.04 + pressure * 0.16 + textHoverBoost * 0.1, 0, 0.36);
        const rainbowMix = clamp(textHoverBoost * (0.76 + pressure * 0.34) + speedBoost * 0.22, 0, 1);
        const rainbowHue = (phase * 52 + charIndex * 24 + lineIndex * 132 + pressure * 94) % 360;
        const rainbowLightness = 46 + pressure * 16 + speedBoost * 4;
        const baseColor = "rgb(5, 5, 5)";
        const rainbowColor = `hsl(${rainbowHue.toFixed(2)} 92% ${rainbowLightness.toFixed(2)}%)`;

        span.style.fontWeight = String(weight);
        span.style.opacity = alpha.toFixed(3);
        span.style.transform = `translate3d(${shiftX.toFixed(3)}px, ${lift.toFixed(3)}px, 0) rotate(${rotation.toFixed(3)}deg) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;
        span.style.textShadow = `0 ${(2 + pressure * 5).toFixed(3)}px ${(8 + pressure * 18).toFixed(3)}px rgba(0, 0, 0, ${shadowAlpha.toFixed(3)})`;
        span.style.color = rainbowMix > 0.06 ? rainbowColor : baseColor;
      });
    });

    introButton.style.setProperty("--hover-x", `${((normalizedX + 1) * 50).toFixed(2)}%`);
    introButton.style.setProperty("--hover-y", `${((normalizedY + 1) * 50).toFixed(2)}%`);
    introButton.style.setProperty("--hover-alpha", (0.06 + textHoverBoost * 0.28 + speedBoost * 0.08).toFixed(3));

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

    backdropState.flowX = backdropState.width * 0.5;
    backdropState.flowY = backdropState.height * 0.5;
    backdropState.flowTargetX = backdropState.flowX;
    backdropState.flowTargetY = backdropState.flowY;

    if (!backdropState.pointerInside) {
      backdropState.pointerX = backdropState.flowX;
      backdropState.pointerY = backdropState.flowY;
      backdropState.pointerDrawX = backdropState.flowX;
      backdropState.pointerDrawY = backdropState.flowY;
    }

    const area = backdropState.width * backdropState.height;
    const count = window.innerWidth < 720
      ? clamp(Math.round(area / 12800), 90, 160)
      : clamp(Math.round(area / 8400), 170, 300);

    const coreCount = Math.floor(count * 0.72);
    const centerX = backdropState.flowX;
    const centerY = backdropState.flowY;
    const maxCoreRadiusX = backdropState.width * (window.innerWidth < 720 ? 0.24 : 0.2);
    const maxCoreRadiusY = backdropState.height * (window.innerWidth < 720 ? 0.2 : 0.18);
    const maxAmbientRadiusX = backdropState.width * 0.46;
    const maxAmbientRadiusY = backdropState.height * 0.4;

    backdropState.points = Array.from({ length: count }, (_, index) => {
      const isCore = index < coreCount;
      const angle = Math.random() * TWO_PI;
      const radialPower = isCore ? 0.52 : 1.2;
      const radialUnit = Math.pow(Math.random(), radialPower);
      const baseRadiusX = (isCore ? maxCoreRadiusX : maxAmbientRadiusX) * radialUnit;
      const baseRadiusY = (isCore ? maxCoreRadiusY : maxAmbientRadiusY) * radialUnit;
      const homeX = centerX + Math.cos(angle) * baseRadiusX;
      const homeY = centerY + Math.sin(angle) * baseRadiusY;
      const depth = isCore ? 0.82 + Math.random() * 0.44 : 0.55 + Math.random() * 0.4;

      return {
        x: homeX + (Math.random() - 0.5) * (isCore ? 24 : 54),
        y: homeY + (Math.random() - 0.5) * (isCore ? 24 : 54),
        homeX,
        homeY,
        vx: (Math.random() - 0.5) * 0.38,
        vy: (Math.random() - 0.5) * 0.38,
        seed: Math.random() * TWO_PI,
        drift: 0.2 + Math.random() * 1.14,
        size: (isCore ? 0.8 : 0.55) + Math.random() * (isCore ? 2.5 : 1.7),
        clusterBias: (isCore ? 0.72 : 0.34) + Math.random() * 0.46,
        burstVX: 0,
        burstVY: 0,
        layer: isCore ? 0 : 1,
        depth,
        orbitPhase: Math.random() * TWO_PI,
        orbitSpeed: (isCore ? 0.36 : 0.24) + Math.random() * 0.36
      };
    });
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
    const centerX = backdropState.width * 0.5;
    const centerY = backdropState.height * 0.5;
    const pointerOffsetX = backdropState.pointerDrawX - centerX;
    const pointerOffsetY = backdropState.pointerDrawY - centerY;
    const pointerRangeX = Math.max(1, backdropState.width * 0.5);
    const pointerRangeY = Math.max(1, backdropState.height * 0.5);
    const normalizedPointerX = clamp(pointerOffsetX / pointerRangeX, -1, 1);
    const normalizedPointerY = clamp(pointerOffsetY / pointerRangeY, -1, 1);
    const centerTrackingStrength = backdropState.pointerInside ? 0.14 : 0;

    backdropState.flowTargetX = centerX + pointerOffsetX * centerTrackingStrength;
    backdropState.flowTargetY = centerY + pointerOffsetY * centerTrackingStrength;
    backdropState.flowX += (backdropState.flowTargetX - backdropState.flowX) * 0.08;
    backdropState.flowY += (backdropState.flowTargetY - backdropState.flowY) * 0.08;

    const pointerMotion = Math.hypot(pointerTargetX - backdropState.pointerDrawX, pointerTargetY - backdropState.pointerDrawY);
    backdropState.pointerEnergy += (pointerMotion - backdropState.pointerEnergy) * 0.12;
    const gatherWave = 0.5 + Math.sin(t * 0.8 + backdropState.loopOffset) * 0.5;
    backdropState.gatherStrength += ((0.44 + gatherWave * 0.5) - backdropState.gatherStrength) * 0.07;
    backdropState.burstProgress = Math.max(0, backdropState.burstProgress - 0.022);
    backdropState.clickPulse = Math.max(0, backdropState.clickPulse - 0.03);

    backdropState.points.forEach((point) => {
      const orbitTime = t * point.orbitSpeed + point.orbitPhase;
      const orbitRadius = point.layer === 0 ? 10 : 18;
      const orbitX = Math.cos(orbitTime) * orbitRadius;
      const orbitY = Math.sin(orbitTime * 1.06) * orbitRadius * 0.84;
      const centerPullX = (backdropState.flowX - centerX) * (point.layer === 0 ? 0.76 : 0.38);
      const centerPullY = (backdropState.flowY - centerY) * (point.layer === 0 ? 0.76 : 0.38);
      const gatherX = point.homeX + orbitX + centerPullX + normalizedPointerX * point.depth * (point.layer === 0 ? 11 : 22);
      const gatherY = point.homeY + orbitY + centerPullY + normalizedPointerY * point.depth * (point.layer === 0 ? 8 : 16);

      const pullStrength = point.layer === 0 ? 0.0074 : 0.0046;
      const pullX = (gatherX - point.x) * pullStrength * (0.7 + backdropState.gatherStrength * point.clusterBias);
      const pullY = (gatherY - point.y) * pullStrength * (0.7 + backdropState.gatherStrength * point.clusterBias);
      const wobbleX = Math.cos(t * (0.6 + point.drift) + point.seed) * (point.layer === 0 ? 0.72 : 1.02);
      const wobbleY = Math.sin(t * (0.52 + point.drift * 1.06) + point.seed * 0.84) * (point.layer === 0 ? 0.68 : 0.96);

      point.vx = (point.vx + wobbleX * 0.018 + pullX) * (point.layer === 0 ? 0.93 : 0.946);
      point.vy = (point.vy + wobbleY * 0.018 + pullY) * (point.layer === 0 ? 0.93 : 0.946);

      if (backdropState.pointerInside) {
        const dx = backdropState.pointerDrawX - point.x;
        const dy = backdropState.pointerDrawY - point.y;
        const pointDistance = Math.hypot(dx, dy);

        if (pointDistance > 0.001 && pointDistance < 280) {
          const strengthBase = point.layer === 0 ? 0.046 : 0.032;
          const strength = (1 - pointDistance / 280) * strengthBase * (1 + clamp(backdropState.pointerEnergy / 20, 0, 0.8));
          point.vx += (dx / pointDistance) * strength;
          point.vy += (dy / pointDistance) * strength;
        }
      }

      if (backdropState.burstProgress > 0) {
        point.vx += point.burstVX * backdropState.burstProgress * 0.23;
        point.vy += point.burstVY * backdropState.burstProgress * 0.23;
      }

      const speedCap = point.layer === 0 ? 7.8 : 6.2;
      point.vx = clamp(point.vx, -speedCap, speedCap);
      point.vy = clamp(point.vy, -speedCap, speedCap);
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

    const maxDimension = Math.max(backdropState.width, backdropState.height);
    const primaryGlow = introContext.createRadialGradient(
      backdropState.flowX,
      backdropState.flowY,
      0,
      backdropState.flowX,
      backdropState.flowY,
      maxDimension * 0.68
    );
    primaryGlow.addColorStop(0, backdropColor(0.15));
    primaryGlow.addColorStop(0.4, backdropColor(0.07));
    primaryGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    introContext.fillStyle = primaryGlow;
    introContext.fillRect(0, 0, backdropState.width, backdropState.height);

    const secondaryGlow = introContext.createRadialGradient(
      backdropState.flowX,
      backdropState.flowY,
      0,
      backdropState.flowX,
      backdropState.flowY,
      maxDimension * 0.34
    );
    secondaryGlow.addColorStop(0, backdropColor(0.18));
    secondaryGlow.addColorStop(0.6, backdropColor(0.03));
    secondaryGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    introContext.fillStyle = secondaryGlow;
    introContext.fillRect(0, 0, backdropState.width, backdropState.height);

    const linkDistance = window.innerWidth < 720 ? 132 : 186;
    for (let index = 0; index < backdropState.points.length; index += 1) {
      const pointA = backdropState.points[index];
      for (let nextIndex = index + 1; nextIndex < backdropState.points.length; nextIndex += 1) {
        const pointB = backdropState.points[nextIndex];
        const pointDistance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
        const pairDistanceLimit = pointA.layer === 0 && pointB.layer === 0
          ? linkDistance
          : linkDistance * 0.72;

        if (!pointDistance || pointDistance > pairDistanceLimit) {
          continue;
        }

        const pairBlend = pointA.layer === pointB.layer ? 1 : 0.72;
        const alpha = ((1 - pointDistance / pairDistanceLimit) ** 2) * 0.34 * pairBlend;
        introContext.strokeStyle = backdropColor(alpha);
        introContext.lineWidth = (pointA.layer === 0 && pointB.layer === 0 ? 0.44 : 0.28) + alpha * 1.36;
        introContext.beginPath();
        introContext.moveTo(pointA.x, pointA.y);
        introContext.lineTo(pointB.x, pointB.y);
        introContext.stroke();
      }
    }

    const ringBase = Math.min(backdropState.width, backdropState.height) * 0.14;
    for (let ringIndex = 0; ringIndex < 3; ringIndex += 1) {
      const ringWave = Math.sin(time * 0.001 + ringIndex * 1.36) * 8;
      const radius = ringBase + ringIndex * ringBase * 0.48 + ringWave;
      introContext.strokeStyle = backdropColor(0.05 - ringIndex * 0.012);
      introContext.lineWidth = 1.1 - ringIndex * 0.24;
      introContext.beginPath();
      introContext.arc(backdropState.flowX, backdropState.flowY, radius, 0, TWO_PI);
      introContext.stroke();
    }

    backdropState.points.forEach((point) => {
      const pulse = (Math.sin(time * 0.0014 + point.seed) + 1) * 0.5;
      const baseAlpha = point.layer === 0 ? 0.14 : 0.09;
      const alpha = baseAlpha + pulse * (point.layer === 0 ? 0.24 : 0.14);
      const radius = point.size * (point.layer === 0 ? 0.76 + pulse * 0.68 : 0.64 + pulse * 0.44) * point.depth;

      introContext.fillStyle = backdropColor(alpha);
      introContext.beginPath();
      introContext.arc(point.x, point.y, radius, 0, TWO_PI);
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

    const centerPulseRadius = 3.2 + Math.sin(time * 0.0022) * 0.9;
    introContext.fillStyle = backdropColor(0.82);
    introContext.beginPath();
    introContext.arc(backdropState.flowX, backdropState.flowY, centerPulseRadius, 0, TWO_PI);
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

  introButton.addEventListener("pointerenter", () => {
    isTextHovered = true;
    introButton.classList.add("is-hovered");
  });
  introButton.addEventListener("pointerleave", () => {
    isTextHovered = false;
    introButton.classList.remove("is-hovered");
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
