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

    if (!scene || !stage || !layers.length) {
      return;
    }

    const poses = {
      "-2": { x: "-42%", y: "20%", z: "-320px", rx: "-3deg", ry: "22deg", rz: "-10deg", scale: 0.82, opacity: 0.42, blur: "4px", saturate: 0.82, zIndex: 5 },
      "-1": { x: "-16%", y: "8%", z: "-120px", rx: "-1deg", ry: "12deg", rz: "-5deg", scale: 0.92, opacity: 0.68, blur: "2px", saturate: 0.9, zIndex: 15 },
      "0": { x: "8%", y: "-4%", z: "32px", rx: "0deg", ry: "0deg", rz: "0deg", scale: 1, opacity: 1, blur: "0px", saturate: 1, zIndex: 40 },
      "1": { x: "30%", y: "-17%", z: "180px", rx: "2deg", ry: "-12deg", rz: "6deg", scale: 1.05, opacity: 0.86, blur: "0px", saturate: 1.02, zIndex: 30 },
      "2": { x: "50%", y: "-29%", z: "320px", rx: "3deg", ry: "-20deg", rz: "10deg", scale: 1.1, opacity: 0.58, blur: "1px", saturate: 0.92, zIndex: 20 },
    };

    let activeIndex = 0;

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

    const setStageTilt = (x, y) => {
      stage.style.setProperty("--stage-ry", `${x * 9}deg`);
      stage.style.setProperty("--stage-rx", `${-4 - y * 7}deg`);
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
      });

      details.forEach((detail, index) => {
        detail.classList.toggle("is-active", index === activeIndex);
      });
    };

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => {
        setActive(index);
      });

      button.addEventListener("mouseenter", () => {
        setActive(index);
      });
    });

    layers.forEach((layer, index) => {
      layer.addEventListener("mouseenter", () => {
        setActive(index);
      });

      layer.addEventListener("focus", () => {
        setActive(index);
      });
    });

    scene.addEventListener("mousemove", (event) => {
      const rect = scene.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      setStageTilt(x, y);
    });

    scene.addEventListener("mouseleave", () => {
      setStageTilt(0.15, 0);
    });

    setActive(0);
    setStageTilt(0.15, 0);
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
  initHomePortal();
  initMotionSystem(lenis);
});
