document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  const markReady = () => {
    requestAnimationFrame(() => {
      body.classList.add("is-ready");
    });
  };

  const initContactPanel = () => {
    const panel = document.querySelector("[data-contact-panel]");
    const openButtons = document.querySelectorAll("[data-contact-open]");
    const closeButtons = document.querySelectorAll("[data-contact-close]");

    if (!panel || !openButtons.length) {
      return;
    }

    let closeTimer = null;

    const openPanel = () => {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }

      panel.hidden = false;
      body.classList.add("contact-open");
    };

    const closePanel = () => {
      body.classList.remove("contact-open");
      closeTimer = window.setTimeout(() => {
        panel.hidden = true;
      }, 420);
    };

    openButtons.forEach((button) => {
      button.addEventListener("click", openPanel);
    });

    closeButtons.forEach((button) => {
      button.addEventListener("click", closePanel);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) {
        closePanel();
      }
    });
  };

  const initSmoothScroll = () => {
    if (typeof window.Lenis !== "function") {
      return null;
    }

    const lenis = new window.Lenis({
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: true,
    });

    const raf = (time) => {
      lenis.raf(time);
      window.requestAnimationFrame(raf);
    };

    window.requestAnimationFrame(raf);
    return lenis;
  };

  const initScrollVideos = () => {
    const videos = document.querySelectorAll("[data-scroll-video]");

    if (!videos.length) {
      return;
    }

    const playVideo = (video) => {
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      const playPromise = video.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
            playVideo(video);
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: [0.2, 0.45, 0.75],
      }
    );

    videos.forEach((video) => observer.observe(video));
  };

  const initTorusFields = () => {
    const fields = Array.from(document.querySelectorAll("[data-torus-field]"));

    if (!fields.length) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tau = Math.PI * 2;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const presets = {
      ambient: {
        layers: [1.22, 0.94],
        alpha: 0.12,
        lineWidth: 0.85,
        majorLoops: 14,
        minorLoops: 10,
        samples: 40,
        majorRadius: 0.38,
        minorRadius: 0.16,
        wobble: 0.08,
      },
      hero: {
        layers: [1.1, 0.92, 0.72],
        alpha: 0.22,
        lineWidth: 1.1,
        majorLoops: 18,
        minorLoops: 14,
        samples: 54,
        majorRadius: 0.34,
        minorRadius: 0.15,
        wobble: 0.11,
      },
      bridge: {
        layers: [1, 0.84],
        alpha: 0.14,
        lineWidth: 0.9,
        majorLoops: 12,
        minorLoops: 8,
        samples: 36,
        majorRadius: 0.33,
        minorRadius: 0.14,
        wobble: 0.07,
      },
      editorial: {
        layers: [1, 0.82],
        alpha: 0.16,
        lineWidth: 0.9,
        majorLoops: 14,
        minorLoops: 10,
        samples: 40,
        majorRadius: 0.34,
        minorRadius: 0.14,
        wobble: 0.08,
      },
      detail: {
        layers: [1, 0.78],
        alpha: 0.13,
        lineWidth: 0.82,
        majorLoops: 10,
        minorLoops: 8,
        samples: 34,
        majorRadius: 0.3,
        minorRadius: 0.12,
        wobble: 0.06,
      },
    };

    const rotatePoint = (point, rotationX, rotationY, rotationZ) => {
      let { x, y, z } = point;
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;
      y = y1;
      z = z1;

      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const x2 = x * cosY + z * sinY;
      const z2 = -x * sinY + z * cosY;
      x = x2;
      z = z2;

      const cosZ = Math.cos(rotationZ);
      const sinZ = Math.sin(rotationZ);
      const x3 = x * cosZ - y * sinZ;
      const y3 = x * sinZ + y * cosZ;

      return { x: x3, y: y3, z };
    };

    const projectPoint = (point, width, height, cameraDistance) => {
      const perspective = cameraDistance / (cameraDistance - point.z);

      return {
        x: width * 0.5 + point.x * perspective,
        y: height * 0.5 + point.y * perspective,
        z: point.z,
      };
    };

    const drawLoop = (ctx, points, strokeStyle, lineWidth) => {
      if (points.length < 2) {
        return;
      }

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let index = 1; index < points.length; index += 1) {
        ctx.lineTo(points[index].x, points[index].y);
      }

      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    const states = fields
      .map((field) => {
        const canvas = field.querySelector("canvas");
        const ctx = canvas?.getContext("2d");

        if (!canvas || !ctx) {
          return null;
        }

        const kind = field.dataset.torusKind || "ambient";
        const preset = presets[kind] ?? presets.ambient;
        const section = field.closest("[data-section]");
        const interactive = field.dataset.torusInteractive === "true";
        const pointerArea =
          interactive ? field.closest("[data-portal-scene], [data-section]") ?? field.parentElement ?? field : null;
        const state = {
          field,
          canvas,
          ctx,
          preset,
          section,
          kind,
          interactive,
          speed: Math.max(0.12, Number(field.dataset.torusSpeed || 0.8)),
          density: clamp(Number(field.dataset.torusDensity || 1), 0.55, 1.5),
          scale: clamp(Number(field.dataset.torusScale || 1), 0.5, 1.5),
          depth: clamp(Number(field.dataset.torusDepth || 1), 0.55, 1.5),
          width: 0,
          height: 0,
          dpr: Math.min(window.devicePixelRatio || 1, 2),
          pointer: { x: 0.08, y: -0.05 },
          pointerTarget: { x: 0.08, y: -0.05 },
          progress: 0,
          isVisible: true,
        };

        state.resize = () => {
          const rect = field.getBoundingClientRect();
          state.width = Math.max(1, Math.round(rect.width));
          state.height = Math.max(1, Math.round(rect.height));
          state.dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.max(1, Math.round(state.width * state.dpr));
          canvas.height = Math.max(1, Math.round(state.height * state.dpr));
          canvas.style.width = `${state.width}px`;
          canvas.style.height = `${state.height}px`;
          ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
        };

        state.updateProgress = () => {
          if (!section) {
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            state.progress = clamp(window.scrollY / maxScroll, 0, 1);
            return;
          }

          const rect = section.getBoundingClientRect();
          const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
          state.progress = clamp(progress, 0, 1);
        };

        state.resize();
        state.updateProgress();

        if (pointerArea) {
          pointerArea.addEventListener("pointermove", (event) => {
            const rect = pointerArea.getBoundingClientRect();
            state.pointerTarget.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
            state.pointerTarget.y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
          });

          pointerArea.addEventListener("pointerleave", () => {
            state.pointerTarget.x = 0.08;
            state.pointerTarget.y = -0.05;
          });
        }

        return state;
      })
      .filter(Boolean);

    if (!states.length) {
      return;
    }

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const targetState = states.find((state) => state.field === entry.target);

          if (targetState) {
            targetState.isVisible = entry.isIntersecting;
          }
        });
      },
      { threshold: 0.02 }
    );

    states.forEach((state) => {
      if (state.kind !== "ambient") {
        visibilityObserver.observe(state.field);
      }
    });

    const renderState = (state, time) => {
      if (!state.width || !state.height) {
        return;
      }

      const { ctx, width, height, preset } = state;
      const loops = [];
      const baseSize = Math.min(width, height) * state.scale;
      const cameraDistance = baseSize * (2.7 + state.depth * 0.45);
      const layerTime = time * state.speed;

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      preset.layers.forEach((layerScale, layerIndex) => {
        const loopCountMajor = Math.max(8, Math.round(preset.majorLoops * state.density));
        const loopCountMinor = Math.max(6, Math.round(preset.minorLoops * state.density));
        const sampleCount = Math.max(24, Math.round(preset.samples * state.density));
        const majorRadius =
          baseSize * preset.majorRadius * layerScale * (1 + 0.03 * Math.sin(layerTime * 0.8 + layerIndex));
        const minorRadius =
          baseSize * preset.minorRadius * layerScale * (1 + 0.08 * Math.cos(layerTime * 1.1 + layerIndex * 0.7));
        const rotationX = -0.72 + state.pointer.y * 0.22 + Math.sin(layerTime * 0.45 + layerIndex) * 0.05;
        const rotationY = layerTime * 0.42 + state.pointer.x * 0.36 + state.progress * 0.42 + layerIndex * 0.52;
        const rotationZ = 0.2 + Math.cos(layerTime * 0.28 + layerIndex) * 0.08;

        const buildLoop = (fixedAngle, mode) => {
          const points = [];
          let depthTotal = 0;

          for (let step = 0; step <= sampleCount; step += 1) {
            const sweep = (step / sampleCount) * tau;
            const u = mode === "major" ? fixedAngle : sweep;
            const v = mode === "major" ? sweep : fixedAngle;
            const wobble =
              1 +
              preset.wobble *
                Math.sin(u * 3 + layerTime * 0.9 + layerIndex * 0.5) *
                Math.cos(v * 2 - layerTime * 0.6);
            const radius = majorRadius + minorRadius * Math.cos(v) * wobble;
            const point = rotatePoint(
              {
                x: radius * Math.cos(u),
                y: minorRadius * Math.sin(v) * wobble,
                z: radius * Math.sin(u),
              },
              rotationX,
              rotationY,
              rotationZ
            );

            depthTotal += point.z;
            points.push(projectPoint(point, width, height, cameraDistance));
          }

          loops.push({
            points,
            depth: depthTotal / points.length,
            alpha:
              preset.alpha *
              (mode === "major" ? 1 : 0.82) *
              (1 - layerIndex * 0.18),
            lineWidth: preset.lineWidth * (mode === "major" ? 1.05 : 0.82),
          });
        };

        for (let loopIndex = 0; loopIndex < loopCountMajor; loopIndex += 1) {
          buildLoop((loopIndex / loopCountMajor) * tau, "major");
        }

        for (let loopIndex = 0; loopIndex < loopCountMinor; loopIndex += 1) {
          buildLoop((loopIndex / loopCountMinor) * tau, "minor");
        }
      });

      loops
        .sort((a, b) => a.depth - b.depth)
        .forEach((loop) => {
          const depthOpacity = clamp((loop.depth / (baseSize * 0.8) + 1) * 0.5, 0.22, 1);
          drawLoop(
            ctx,
            loop.points,
            `rgba(5, 5, 5, ${Number(loop.alpha * depthOpacity).toFixed(3)})`,
            loop.lineWidth
          );
        });
    };

    const resizeAll = () => {
      states.forEach((state) => {
        state.resize();
        state.updateProgress();
      });
    };

    window.addEventListener("resize", resizeAll, { passive: true });

    const frame = (timestamp) => {
      const time = timestamp * 0.001;

      states.forEach((state) => {
        if (!state.isVisible && state.kind !== "ambient") {
          return;
        }

        state.updateProgress();
        state.pointer.x += (state.pointerTarget.x - state.pointer.x) * 0.06;
        state.pointer.y += (state.pointerTarget.y - state.pointer.y) * 0.06;
        renderState(state, reduceMotion ? 0 : time);
      });

      if (!reduceMotion) {
        window.requestAnimationFrame(frame);
      }
    };

    window.requestAnimationFrame(frame);
  };

  const initHomePortal = () => {
    const portal = document.querySelector("[data-home-portal]");

    if (!portal) {
      return;
    }

    const scene = portal.querySelector("[data-portal-scene]");
    const stage = portal.querySelector("[data-portal-stage]");
    const layers = Array.from(portal.querySelectorAll("[data-portal-layer]"));
    const buttons = Array.from(portal.querySelectorAll("[data-portal-index]"));
    const details = Array.from(portal.querySelectorAll("[data-portal-detail]"));
    const progress = portal.querySelector("[data-portal-progress]");

    if (!scene || !stage || !layers.length) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const poses = {
      "-2": { x: "-42%", y: "20%", z: "-320px", rx: "-3deg", ry: "22deg", rz: "-10deg", scale: 0.82, opacity: 0.42, blur: "4px", saturate: 0.82, zIndex: 5 },
      "-1": { x: "-16%", y: "8%", z: "-120px", rx: "-1deg", ry: "12deg", rz: "-5deg", scale: 0.92, opacity: 0.68, blur: "2px", saturate: 0.9, zIndex: 15 },
      "0": { x: "8%", y: "-4%", z: "32px", rx: "0deg", ry: "0deg", rz: "0deg", scale: 1, opacity: 1, blur: "0px", saturate: 1, zIndex: 40 },
      "1": { x: "30%", y: "-17%", z: "180px", rx: "2deg", ry: "-12deg", rz: "6deg", scale: 1.05, opacity: 0.86, blur: "0px", saturate: 1.02, zIndex: 30 },
      "2": { x: "50%", y: "-29%", z: "320px", rx: "3deg", ry: "-20deg", rz: "10deg", scale: 1.1, opacity: 0.58, blur: "1px", saturate: 0.92, zIndex: 20 },
    };

    let activeIndex = 0;
    let pointerX = 0.12;
    let pointerY = 0;
    let targetX = 0.12;
    let targetY = 0;
    let autoAdvance = null;
    let allowAutoAdvance = true;
    let isVisible = true;

    const normalizeDiff = (index) => {
      const count = layers.length;
      let diff = index - activeIndex;
      const half = Math.floor(count / 2);

      if (diff > half) {
        diff -= count;
      }

      if (diff < -half) {
        diff += count;
      }

      return Math.max(-2, Math.min(2, diff));
    };

    const setStageTilt = (x, y, time = 0) => {
      const driftX = reduceMotion ? 0 : Math.sin(time * 0.00042) * 0.12;
      const driftY = reduceMotion ? 0 : Math.cos(time * 0.00035) * 0.1;
      stage.style.setProperty("--stage-ry", `${x * 9}deg`);
      stage.style.setProperty("--stage-rx", `${-4 - y * 7}deg`);
      stage.style.setProperty("--stage-shift-x", `${(x + driftX) * 8}px`);
      stage.style.setProperty("--stage-shift-y", `${(y + driftY) * -10}px`);
    };

    const syncProgress = () => {
      if (progress) {
        progress.style.transform = `scaleX(${(activeIndex + 1) / layers.length})`;
      }
    };

    const setActive = (nextIndex) => {
      activeIndex = nextIndex;

      layers.forEach((layer, index) => {
        const diff = normalizeDiff(index);
        const pose = poses[String(diff)] ?? poses["0"];

        layer.classList.toggle("is-active", index === activeIndex);
        layer.style.setProperty("--layer-x", pose.x);
        layer.style.setProperty("--layer-y", pose.y);
        layer.style.setProperty("--layer-z", pose.z);
        layer.style.setProperty("--layer-rx", pose.rx);
        layer.style.setProperty("--layer-ry", pose.ry);
        layer.style.setProperty("--layer-rz", pose.rz);
        layer.style.setProperty("--layer-scale", String(pose.scale));
        layer.style.setProperty("--layer-opacity", String(pose.opacity));
        layer.style.setProperty("--layer-blur", pose.blur);
        layer.style.setProperty("--layer-saturate", String(pose.saturate));
        layer.style.zIndex = String(pose.zIndex);
      });

      buttons.forEach((button, index) => {
        const isActive = index === activeIndex;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
        button.style.setProperty("--nav-progress", isActive ? "1" : "0");
      });

      details.forEach((detail, index) => {
        detail.classList.toggle("is-active", index === activeIndex);
      });

      syncProgress();
    };

    const stopAutoAdvance = () => {
      if (autoAdvance) {
        window.clearInterval(autoAdvance);
        autoAdvance = null;
      }
    };

    const startAutoAdvance = () => {
      stopAutoAdvance();

      if (reduceMotion) {
        return;
      }

      autoAdvance = window.setInterval(() => {
        if (!allowAutoAdvance || !isVisible || document.hidden) {
          return;
        }

        setActive((activeIndex + 1) % layers.length);
      }, 4200);
    };

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => {
        setActive(index);
        allowAutoAdvance = false;
      });

      button.addEventListener("mouseenter", () => {
        setActive(index);
        allowAutoAdvance = false;
      });
    });

    layers.forEach((layer, index) => {
      layer.addEventListener("mouseenter", () => {
        setActive(index);
        allowAutoAdvance = false;
      });

      layer.addEventListener("focus", () => {
        setActive(index);
        allowAutoAdvance = false;
      });
    });

    portal.addEventListener("mouseenter", () => {
      allowAutoAdvance = false;
    });

    portal.addEventListener("mouseleave", () => {
      allowAutoAdvance = true;
      targetX = 0.12;
      targetY = 0;
    });

    scene.addEventListener("mousemove", (event) => {
      const rect = scene.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      targetY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    });

    scene.addEventListener("mouseleave", () => {
      targetX = 0.12;
      targetY = 0;
    });

    scene.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        setActive((activeIndex + 1) % layers.length);
        allowAutoAdvance = false;
      }

      if (event.key === "ArrowLeft") {
        setActive((activeIndex - 1 + layers.length) % layers.length);
        allowAutoAdvance = false;
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(portal);

    if (!reduceMotion) {
      const animateStage = (time) => {
        pointerX += (targetX - pointerX) * 0.05;
        pointerY += (targetY - pointerY) * 0.05;
        setStageTilt(pointerX, pointerY, time);
        window.requestAnimationFrame(animateStage);
      };

      window.requestAnimationFrame(animateStage);
    }

    setActive(0);
    setStageTilt(0.12, 0);
    startAutoAdvance();
  };

  const revealFallback = () => {
    document.querySelectorAll(".motion-reveal, .motion-scale, [data-hero-line]").forEach((element) => {
      element.style.opacity = "1";
      element.style.transform = "none";
    });
  };

  const initMotionSystem = (lenis) => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    if (!gsap || !ScrollTrigger) {
      revealFallback();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    if (lenis && typeof lenis.on === "function") {
      lenis.on("scroll", ScrollTrigger.update);
    }

    if (document.querySelector("[data-hero-line]")) {
      gsap.set("[data-hero-line]", { y: 56, opacity: 0 });
      gsap.to("[data-hero-line]", {
        y: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.12,
      });
    }

    gsap.utils.toArray(".motion-reveal").forEach((element) => {
      gsap.to(element, {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          once: true,
        },
      });
    });

    gsap.utils.toArray(".motion-scale").forEach((element) => {
      gsap.to(element, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 86%",
          once: true,
        },
      });
    });

    gsap.utils.toArray("[data-section]").forEach((section) => {
      const media = section.querySelectorAll("img, video");

      if (media.length) {
        gsap.fromTo(
          media,
          { scale: 1.08 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      }
    });

    gsap.utils.toArray("[data-parallax]").forEach((element) => {
      const distance = Number(element.dataset.parallax || 12);
      const trigger = element.closest("[data-parallax-wrap]") || element;

      gsap.to(element, {
        yPercent: distance,
        ease: "none",
        scrollTrigger: {
          trigger,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    ScrollTrigger.refresh();
  };

  markReady();
  const lenis = initSmoothScroll();
  initContactPanel();
  initScrollVideos();
  initTorusFields();
  initHomePortal();
  initMotionSystem(lenis);
});
