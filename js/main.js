if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const switchSiteLogo = (useSmall) => {
  const siteLogo = document.querySelector(".site-logo");
  if (!siteLogo) return;

  const img = siteLogo.querySelector("img");
  if (!img) return;

  const targetSrc = useSmall ? siteLogo.dataset.smallLogo : siteLogo.dataset.defaultLogo;
  if (targetSrc && img.getAttribute("src") !== targetSrc) {
    img.setAttribute("src", targetSrc);
  }

  siteLogo.classList.toggle("is-small", useSmall);
};

const isWorksInLogoSwitchZone = (worksSection) => {
  if (!worksSection) return false;

  const rect = worksSection.getBoundingClientRect();
  const viewportCore = window.innerHeight * 0.5;
  return rect.top <= viewportCore;
};

const setupLazyMedia = () => {
  const lazyBackgrounds = Array.from(document.querySelectorAll("[data-lazy-bg]")).filter(
    (element) => !element.dataset.lazyBound,
  );
  const lazyImages = Array.from(document.querySelectorAll("img[data-lazy-src]")).filter(
    (image) => !image.dataset.lazyBound,
  );

  const loadBackground = (element) => {
    const src = element.dataset.lazyBg;
    if (!src) {
      element.classList.add("is-error");
      return;
    }

    element.classList.add("lazy-media", "lazy-media--bg");

    const image = new Image();

    image.onload = () => {
      element.style.backgroundImage = `url("${src}")`;
      element.classList.add("is-loaded");
      element.removeAttribute("data-lazy-bg");
    };

    image.onerror = () => {
      element.classList.add("is-error");
    };

    image.src = src;
  };

  const loadImage = (image) => {
    const loadingTarget = image.closest(".post-image-content, .post-hero__image-wrap") || image;
    const src = image.dataset.lazySrc;
    if (!src) {
      loadingTarget.classList.add("is-error");
      return;
    }

    loadingTarget.classList.add("lazy-media");

    const markLoaded = () => {
      loadingTarget.classList.add("is-loaded");
      image.removeAttribute("data-lazy-src");
    };

    const markError = () => {
      loadingTarget.classList.add("is-error");
    };

    image.addEventListener("load", markLoaded, { once: true });
    image.addEventListener("error", markError, { once: true });
    image.src = src;

    if (image.complete && image.naturalWidth > 0) {
      markLoaded();
    }
  };

  const lazyTargets = [
    ...lazyBackgrounds.map((element) => ({ element, load: () => loadBackground(element) })),
    ...lazyImages.map((image) => ({ element: image, load: () => loadImage(image) })),
  ];

  if (!("IntersectionObserver" in window)) {
    lazyTargets.forEach(({ element, load }) => {
      element.dataset.lazyBound = "true";
      load();
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = entry.target;
        const item = lazyTargets.find(({ element }) => element === target);
        if (!item) return;

        observer.unobserve(target);
        item.load();
      });
    },
    {
      rootMargin: "520px 0px",
      threshold: 0.01,
    },
  );

  lazyTargets.forEach(({ element, load }) => {
    element.dataset.lazyBound = "true";
    if (
      element instanceof HTMLImageElement &&
      (element.loading === "eager" || element.getAttribute("fetchpriority") === "high")
    ) {
      load();
      return;
    }

    observer.observe(element);
  });
};

const setupLoadingScreen = () => {
  if (window.__mochiLoadingStarted) return;

  const loading = document.querySelector(".site-loading");
  const loadingProgressBar = document.querySelector(".site-loading__progress-bar");
  const loadingPercent = document.querySelector(".site-loading__percent");
  const MAX_LOADING_MS = 9000;
  const MIN_LOADING_MS = 450;
  const TRANSITION_MS = 540;

  if (!loading || !loadingProgressBar) return;

  document.body.classList.add("is-loading");

  const startTime = Date.now();
  let progressTimer = null;
  let forceHideTimer = null;
  let minimumDelayTimer = null;
  let finishTimer = null;
  let hidden = false;
  let pageReady = document.readyState === "complete";
  let currentProgress = 0;
  let minimumDurationReached = false;

  const setProgress = (value) => {
    currentProgress = Math.max(currentProgress, Math.min(value, 100));
    const progressValue = `${currentProgress}%`;
    loading.style.setProperty("--loading-progress", progressValue);
    loadingProgressBar.style.width = progressValue;
    if (loadingPercent) {
      loadingPercent.textContent = `${Math.floor(currentProgress)}%`;
    }
  };

  const canHideNow = () => pageReady && minimumDurationReached;

  setProgress(3);

  progressTimer = window.setInterval(() => {
    const elapsed = Date.now() - startTime;
    const warmupRatio = Math.min(elapsed / 3600, 1);

    if (pageReady) {
      setProgress(currentProgress + Math.max((99 - currentProgress) * 0.18, 1.1));
      return;
    }

    if (currentProgress < 90) {
      const targetProgress = 3 + (1 - Math.pow(1 - warmupRatio, 1.35)) * 87;
      setProgress(targetProgress);
      return;
    }

    setProgress(currentProgress + Math.max((94 - currentProgress) * 0.035, 0.04));
  }, 140);

  const hideLoading = () => {
    if (hidden) return;
    hidden = true;

    if (progressTimer) {
      window.clearInterval(progressTimer);
      progressTimer = null;
    }
    if (forceHideTimer) {
      window.clearTimeout(forceHideTimer);
      forceHideTimer = null;
    }
    if (minimumDelayTimer) {
      window.clearTimeout(minimumDelayTimer);
      minimumDelayTimer = null;
    }
    if (finishTimer) {
      window.clearTimeout(finishTimer);
      finishTimer = null;
    }

    setProgress(100);

    loading.classList.add("is-hidden");
    document.body.classList.remove("is-loading");

    window.setTimeout(() => {
      loading.remove();
    }, TRANSITION_MS);
  };

  const scheduleHide = () => {
    if (!canHideNow() || finishTimer || hidden) return;

    setProgress(Math.max(currentProgress, 96));
    finishTimer = window.setTimeout(hideLoading, 260);
  };

  const requestHide = () => {
    pageReady = true;
    scheduleHide();
  };

  minimumDelayTimer = window.setTimeout(() => {
    minimumDurationReached = true;
    scheduleHide();
  }, MIN_LOADING_MS);

  forceHideTimer = window.setTimeout(() => {
    pageReady = true;
    minimumDurationReached = true;
    hideLoading();
  }, MAX_LOADING_MS);

  if (document.readyState === "complete") {
    requestHide();
  } else {
    window.addEventListener("load", requestHide, { once: true });
  }
};

const setupScrollScene = () => {
  const road = document.querySelector(".work-road-wrap");
  const roadBg = road?.querySelector(".road-bg");
  const mochi = document.querySelector(".scroll-mochi");

  if (!road || !roadBg || !mochi) return;

  const normalSrc = mochi.dataset.normalSrc;
  const spriteSrc = mochi.dataset.spriteSrc;
  const backNormalSrc = mochi.dataset.backNormalSrc || normalSrc;
  const backSpriteSrc = mochi.dataset.backSpriteSrc || spriteSrc;
  const frameCount = Number.parseInt(mochi.dataset.frameCount || "1", 10);
  let frameTimer = null;
  let frameIndex = 0;
  let walking = false;
  let walkingDirection = "forward";
  let stopDelayTimer = null;
  const STOP_DELAY_MS = 280;
  const MOTION_THRESHOLD = 8;
  const WALK_START_VIEWPORT_RATIO = 0.64;
  const isVisibleInViewport = () => {
    const rect = mochi.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };
  const setStillFrame = (direction = "forward") => {
    const stillSrc = direction === "backward" ? backNormalSrc : normalSrc;
    if (stillSrc) {
      mochi.style.backgroundImage = `url("${stillSrc}")`;
      mochi.style.backgroundSize = "100% 100%";
      mochi.style.backgroundPosition = "0 0";
    }
  };

  const renderFrame = (index, direction = "forward") => {
    const activeSpriteSrc = direction === "backward" ? backSpriteSrc : spriteSrc;
    if (!activeSpriteSrc || frameCount <= 1) return;
    mochi.style.backgroundImage = `url("${activeSpriteSrc}")`;
    mochi.style.backgroundSize = `${frameCount * 100}% 100%`;
    mochi.style.backgroundPosition = `${(index / (frameCount - 1 || 1)) * 100}% 0`;
  };

  const stopWalking = () => {
    if (stopDelayTimer) {
      window.clearTimeout(stopDelayTimer);
      stopDelayTimer = null;
    }
    if (frameTimer) {
      window.clearInterval(frameTimer);
      frameTimer = null;
    }
    walking = false;
    setStillFrame(walkingDirection);
  };

  const queueStopWalking = () => {
    if (stopDelayTimer) window.clearTimeout(stopDelayTimer);
    stopDelayTimer = window.setTimeout(() => {
      stopWalking();
    }, STOP_DELAY_MS);
  };

  const startWalking = (direction = "forward") => {
    const activeSpriteSrc = direction === "backward" ? backSpriteSrc : spriteSrc;
    if (!activeSpriteSrc || frameCount <= 1 || !isVisibleInViewport()) return;

    if (walking && walkingDirection === direction) return;

    if (frameTimer) {
      window.clearInterval(frameTimer);
      frameTimer = null;
    }

    walking = true;
    walkingDirection = direction;
    frameIndex = 0;
    renderFrame(frameIndex, direction);
    frameTimer = window.setInterval(() => {
      frameIndex = (frameIndex + 1) % frameCount;
      renderFrame(frameIndex, direction);
    }, 250);
  };

  const getWalkBounds = () => {
    const roadRect = road.getBoundingClientRect();
    const roadBgRect = roadBg.getBoundingClientRect();
    const mochiHeight = mochi.offsetHeight;
    const startY = roadBgRect.top - roadRect.top;
    const endY = roadBgRect.bottom - roadRect.top - mochiHeight;
    return {
      startY,
      endY: Math.max(endY, startY),
    };
  };

  const buildWalkTween = () => {
    gsap.set(mochi, { xPercent: -50, y: () => getWalkBounds().startY, opacity: 1 });

    return gsap.fromTo(
      mochi,
      { xPercent: -50, y: () => getWalkBounds().startY, opacity: 1 },
      {
        xPercent: -50,
        y: () => getWalkBounds().endY,
        ease: "none",
        scrollTrigger: {
          trigger: road,
          start: () => `top ${Math.round(window.innerHeight * WALK_START_VIEWPORT_RATIO)}px`,
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          onEnter: startWalking,
          onEnterBack: () => startWalking("backward"),
          onLeave: queueStopWalking,
          onLeaveBack: queueStopWalking,
          onUpdate: (self) => {
            const rawVelocity = self.getVelocity();
            const velocity = Math.abs(rawVelocity);
            const direction = rawVelocity < 0 ? "backward" : "forward";
            if (velocity > MOTION_THRESHOLD && isVisibleInViewport()) {
              startWalking(direction);
              if (stopDelayTimer) {
                window.clearTimeout(stopDelayTimer);
                stopDelayTimer = null;
              }
            } else {
              queueStopWalking();
            }
          },
        },
      },
    );
  };

  buildWalkTween();
  setStillFrame("forward");

  if ("ResizeObserver" in window) {
    let resizeRefreshTimer = null;
    const refreshWalkTween = () => {
      if (resizeRefreshTimer) window.clearTimeout(resizeRefreshTimer);
      resizeRefreshTimer = window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 120);
    };
    const resizeObserver = new ResizeObserver(refreshWalkTween);
    resizeObserver.observe(road);
    resizeObserver.observe(roadBg);
    resizeObserver.observe(mochi);
  }

  ScrollTrigger.addEventListener("scrollStart", () => {
    if (isVisibleInViewport()) startWalking(walkingDirection);
    if (stopDelayTimer) {
      window.clearTimeout(stopDelayTimer);
      stopDelayTimer = null;
    }
  });
  ScrollTrigger.addEventListener("scrollEnd", queueStopWalking);
};

const setupWorksLogoTrigger = () => {
  const worksSection = document.querySelector(".scene-work");
  if (!worksSection) return;

  const updateLogoState = () => {
    switchSiteLogo(isWorksInLogoSwitchZone(worksSection));
  };

  ScrollTrigger.create({
    trigger: worksSection,
    start: "top center",
    end: "bottom top",
    invalidateOnRefresh: true,
    onEnter: updateLogoState,
    onEnterBack: updateLogoState,
    onLeaveBack: updateLogoState,
    onRefresh: updateLogoState,
    onUpdate: updateLogoState,
  });

  updateLogoState();
  window.addEventListener("resize", updateLogoState);
};

const setupFloat = () => {
  const homeMochi = document.querySelector(".home-mochi");
  if (!homeMochi) return;

  gsap.to(homeMochi, {
    y: -10,
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
};

const setupHomeMaskCarousel = () => {
  const carousel = document.querySelector(".home-mask-wrap");
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll(".home-mask-slide"));
  if (slides.length <= 1) return;

  const duration = Number.parseInt(carousel.dataset.carouselDuration || "4200", 10);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    slides[0].classList.add("is-active");
    return;
  }

  let activeIndex = 0;
  const hydrateSlide = (slide) => {
    const src = slide.dataset.src;
    if (src && !slide.getAttribute("href")) {
      slide.setAttribute("href", src);
    }
  };

  const setActiveSlide = (nextIndex) => {
    hydrateSlide(slides[nextIndex]);
    slides[activeIndex].classList.remove("is-active");
    slides[nextIndex].classList.add("is-active");
    activeIndex = nextIndex;
  };

  window.setTimeout(() => {
    hydrateSlide(slides[1]);
  }, 900);

  window.setInterval(() => {
    const nextIndex = (activeIndex + 1) % slides.length;
    setActiveSlide(nextIndex);
  }, Math.max(duration, 1800));
};

const setupDiaryInteraction = () => {
  const diaryStage = document.querySelector(".diary-stage__inner");
  const kettle = document.querySelector(".diary-kettle");
  const patches = Array.from(document.querySelectorAll(".diary-patch"));

  if (!diaryStage || !kettle || patches.length === 0) return;

  const spriteSrc = kettle.dataset.spriteSrc;
  const normalSrc = kettle.dataset.normalSrc;
  const frameCount = Number.parseInt(kettle.dataset.frameCount || "1", 10);
  let frameTimer = null;
  let hideTimer = null;
  let active = false;

  const moveKettle = (event) => {
    const rect = diaryStage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    kettle.style.left = `${x}px`;
    kettle.style.top = `${y}px`;
  };

  const setKettleStill = () => {
    if (normalSrc) {
      kettle.style.backgroundImage = `url("${normalSrc}")`;
      kettle.style.backgroundSize = "100% 100%";
      kettle.style.backgroundPosition = "0 0";
    }
  };

  const playWatering = () => {
    if (!spriteSrc || frameCount <= 1) return;
    if (frameTimer) window.clearInterval(frameTimer);
    let frameIndex = 0;
    kettle.style.backgroundImage = `url("${spriteSrc}")`;
    kettle.style.backgroundSize = `${frameCount * 100}% 100%`;
    kettle.style.backgroundPosition = "0 0";
    frameTimer = window.setInterval(() => {
      frameIndex += 1;
      kettle.style.backgroundPosition = `${(frameIndex / (frameCount - 1 || 1)) * 100}% 0`;
      if (frameIndex >= frameCount - 1) {
        window.clearInterval(frameTimer);
        frameTimer = null;
        setKettleStill();
      }
    }, 120);
  };

  diaryStage.addEventListener("mouseenter", () => {
    active = true;
    diaryStage.classList.add("is-kettle-active");
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
  });

  diaryStage.addEventListener("mouseleave", () => {
    active = false;
    diaryStage.classList.remove("is-kettle-active");
    if (frameTimer) {
      window.clearInterval(frameTimer);
      frameTimer = null;
    }
    hideTimer = window.setTimeout(() => {
      setKettleStill();
    }, 120);
  });

  diaryStage.addEventListener("mousemove", (event) => {
    if (!active) return;
    moveKettle(event);
  });

  patches.forEach((patch) => {
    patch.addEventListener("click", (event) => {
      playWatering();
      patch.classList.add("is-watered");

      const href = patch.getAttribute("href");
      const openInNewContext =
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;

      if (!href || openInNewContext) return;

      event.preventDefault();

      const isExternal = /^https?:\/\//.test(href) && !href.startsWith(window.location.origin);

      window.setTimeout(() => {
        if (isExternal) {
          window.open(href, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = href;
        }
      }, 220);
    });
  });

  setKettleStill();
};

const setupFishingGirl = () => {
  const girl = document.querySelector(".about-fishing-girl");
  if (!girl) return;

  const spriteSrc = girl.dataset.spriteSrc;
  const frameCount = Number.parseInt(girl.dataset.frameCount || "1", 10);
  if (!spriteSrc || frameCount <= 1) return;

  let frameIndex = 0;
  girl.style.backgroundImage = `url("${spriteSrc}")`;
  girl.style.backgroundSize = `${frameCount * 100}% 100%`;
  girl.style.backgroundPosition = "0 0";

  window.setInterval(() => {
    frameIndex = (frameIndex + 1) % frameCount;
    girl.style.backgroundPosition = `${(frameIndex / (frameCount - 1 || 1)) * 100}% 0`;
  }, 520);
};

const setupFishingItems = () => {
  const items = Array.from(document.querySelectorAll(".fishing-item"));
  const bubbleMap = new Map([
    ["fishing-item--wx", document.querySelector(".fishing-item__bubble--wx")],
    ["fishing-item--xhs", document.querySelector(".fishing-item__bubble--xhs")],
    ["fishing-item--bilibili", document.querySelector(".fishing-item__bubble--bilibili")],
    ["fishing-item--idcard", document.querySelector(".fishing-item__bubble--idcard")],
  ]);
  if (items.length === 0) return;

  const positionBubbles = () => {
    const lake = document.querySelector(".about-lake");
    if (!lake) return;

    const lakeRect = lake.getBoundingClientRect();

    items.forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      const centerX = itemRect.left - lakeRect.left + itemRect.width / 2;
      const topY = itemRect.top - lakeRect.top;

      bubbleMap.forEach((bubble, className) => {
        if (!bubble || !item.classList.contains(className)) return;
        bubble.style.left = `${centerX}px`;
        bubble.style.top = `${topY - 14}px`;
      });
    });
  };

  items.forEach((item, index) => {
    const floatOffset = index % 2 === 0 ? -10 : -14;
    const driftOffset = index % 2 === 0 ? 8 : -10;
    const bubbleEntry = Array.from(bubbleMap.entries()).find(([className]) => item.classList.contains(className));
    const bubble = bubbleEntry?.[1];

    const showBubble = () => {
      item.classList.add("is-active");
      bubble?.classList.add("is-visible");
    };

    const hideBubble = () => {
      item.classList.remove("is-active");
      bubble?.classList.remove("is-visible");
    };

    gsap.to(item, {
      y: floatOffset,
      duration: 2.4 + index * 0.25,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      onUpdate: positionBubbles,
    });

    gsap.to(item, {
      x: driftOffset,
      duration: 3.6 + index * 0.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      onUpdate: positionBubbles,
    });

    item.addEventListener("mouseenter", showBubble);
    item.addEventListener("mouseleave", hideBubble);
    item.addEventListener("focus", showBubble);
    item.addEventListener("blur", hideBubble);
  });

  positionBubbles();
  window.addEventListener("resize", positionBubbles);
};

const setupWechatModal = () => {
  const modal = document.querySelector(".wechat-modal");
  const triggers = Array.from(document.querySelectorAll("[data-wechat-modal-trigger]"));
  const closeButton = modal?.querySelector("[data-wechat-modal-close]");

  if (!modal || triggers.length === 0) return;

  const openModal = () => {
    if (typeof modal.showModal === "function") {
      modal.showModal();
      return;
    }

    modal.setAttribute("open", "");
  };

  const closeModal = () => {
    if (typeof modal.close === "function") {
      modal.close();
      return;
    }

    modal.removeAttribute("open");
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openModal();
    });
  });

  closeButton?.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
};

const setupTechGirl = () => {
  const girl = document.querySelector(".tech-girl");
  if (!girl) return;

  const spriteSrc = girl.dataset.spriteSrc;
  const frameCount = Number.parseInt(girl.dataset.frameCount || "1", 10);
  if (!spriteSrc || frameCount <= 1) return;

  let frameIndex = 0;
  girl.style.backgroundImage = `url("${spriteSrc}")`;
  girl.style.backgroundSize = `${frameCount * 100}% 100%`;
  girl.style.backgroundPosition = "0 0";

  window.setInterval(() => {
    frameIndex = (frameIndex + 1) % frameCount;
    girl.style.backgroundPosition = `${(frameIndex / (frameCount - 1 || 1)) * 100}% 0`;
  }, 650);
};

const setupWorksGirl = () => {
  const girl = document.querySelector(".works-girl");
  if (!girl) return;

  const spriteSrc = girl.dataset.spriteSrc;
  const frameCount = Number.parseInt(girl.dataset.frameCount || "1", 10);
  if (!spriteSrc || frameCount <= 1) return;

  let frameIndex = 0;
  girl.style.backgroundImage = `url("${spriteSrc}")`;
  girl.style.backgroundSize = `${frameCount * 100}% 100%`;
  girl.style.backgroundPosition = "0 0";

  window.setInterval(() => {
    frameIndex = (frameIndex + 1) % frameCount;
    girl.style.backgroundPosition = `${(frameIndex / (frameCount - 1 || 1)) * 100}% 0`;
  }, 420);
};

const setupWorksBubble = () => {
  const bubble = document.querySelector(".works-girl-bubble");
  const excerpt = bubble?.querySelector(".works-girl-bubble__excerpt");
  const pots = Array.from(document.querySelectorAll(".works-pot"));

  if (!bubble || !excerpt || pots.length === 0) return;

  let defaultTexts = [];

  try {
    defaultTexts = JSON.parse(bubble.dataset.defaultTexts || "[]");
  } catch (error) {
    defaultTexts = [];
  }

  if (!Array.isArray(defaultTexts) || defaultTexts.length === 0) {
    const fallbackText = excerpt.textContent || "";
    defaultTexts = fallbackText ? [fallbackText] : [];
  }

  const rotationDuration = 4200;
  const visibleDuration = 2600;
  const hiddenDuration = 420;
  let rotationIndex = 0;
  let rotationTimer = null;
  let resumeTimer = null;
  let activePot = null;

  const setBubbleText = (text) => {
    excerpt.textContent = text;
    bubble.classList.add("is-visible");
  };

  const showDefaultText = () => {
    const nextText = defaultTexts[rotationIndex] || defaultTexts[0] || "";

    if (!nextText) {
      bubble.classList.remove("is-visible");
      return;
    }

    setBubbleText(nextText);
  };

  const stopRotation = () => {
    if (rotationTimer) {
      window.clearInterval(rotationTimer);
      rotationTimer = null;
    }
    if (resumeTimer) {
      window.clearTimeout(resumeTimer);
      resumeTimer = null;
    }
    bubble.classList.remove("is-rotating");
  };

  const startRotation = () => {
    if (rotationTimer || defaultTexts.length <= 1 || activePot) return;

    bubble.classList.add("is-rotating");
    rotationTimer = window.setInterval(() => {
      if (activePot) return;
      bubble.classList.remove("is-visible");

      if (resumeTimer) {
        window.clearTimeout(resumeTimer);
      }

      resumeTimer = window.setTimeout(() => {
        if (activePot) return;
        rotationIndex = (rotationIndex + 1) % defaultTexts.length;
        showDefaultText();
      }, hiddenDuration);
    }, rotationDuration);
  };

  const showBubble = (pot) => {
    const workDescription = pot.dataset.workDescription || "";

    if (!workDescription) return;

    activePot = pot;
    stopRotation();
    bubble.classList.remove("is-rotating");
    setBubbleText(workDescription);
  };

  const hideBubble = () => {
    activePot = null;
    showDefaultText();
    startRotation();
  };

  showDefaultText();

  if (defaultTexts.length > 1) {
    bubble.classList.add("is-rotating");
    resumeTimer = window.setTimeout(() => {
      startRotation();
    }, Math.max(visibleDuration, 1200));
  }

  pots.forEach((pot) => {
    pot.addEventListener("mouseenter", () => showBubble(pot));
    pot.addEventListener("focus", () => showBubble(pot));
    pot.addEventListener("mouseleave", hideBubble);
    pot.addEventListener("blur", hideBubble);
  });
};

const setupMenu = () => {
  const toggle = document.querySelector(".menu-toggle");
  const overlay = document.querySelector(".site-menu-overlay");
  const links = overlay ? Array.from(overlay.querySelectorAll("a")) : [];
  let closeTimer = null;

  if (!toggle || !overlay) return;

  const closeMenu = () => {
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "打开菜单");
    document.body.style.overflow = "";
    overlay.classList.add("is-closing");
    if (closeTimer) window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      overlay.hidden = true;
      overlay.classList.remove("is-closing");
    }, 240);
  };

  const openMenu = () => {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
    toggle.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "关闭菜单");
    overlay.hidden = false;
    overlay.classList.remove("is-closing");
    document.body.style.overflow = "hidden";
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.classList.contains("is-open");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeMenu();
  });

  links.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });
};

const setupPostEntrance = () => {
  const heroBand = document.querySelector(".post-hero-band");
  if (!heroBand) return;

  const heroVisual = document.querySelector(".post-hero__visual");
  const heroContent = document.querySelector(".post-hero__content");
  const heroTextBits = heroContent
    ? Array.from(heroContent.children).filter((element) => element instanceof HTMLElement)
    : [];
  const postMain = document.querySelector(".post-main");
  const navCards = Array.from(document.querySelectorAll(".post-nav a"));
  const aboutBand = document.querySelector(".post-about-band");

  const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });

  if (heroVisual) {
    timeline.fromTo(
      heroVisual,
      { autoAlpha: 0, y: 42, rotate: -6 },
      { autoAlpha: 1, y: 0, rotate: -3, duration: 0.9 },
    );
  }

  if (heroTextBits.length > 0) {
    timeline.from(
      heroTextBits,
      {
        autoAlpha: 0,
        y: 22,
        duration: 0.7,
        stagger: 0.12,
      },
      "-=0.45",
    );
  }

  if (postMain) {
    timeline.from(
      postMain,
      {
        autoAlpha: 0,
        y: 28,
        duration: 0.85,
      },
      "-=0.4",
    );
  }

  if (navCards.length > 0) {
    timeline.from(
      navCards,
      {
        autoAlpha: 0,
        y: 16,
        duration: 0.55,
        stagger: 0.1,
      },
      "-=0.35",
    );
  }

  if (aboutBand) {
    timeline.from(
      aboutBand,
      {
        autoAlpha: 0,
        y: 24,
        duration: 0.75,
      },
      "-=0.2",
    );
  }
};

const setupCodeHighlight = () => {
  const postBody = document.querySelector(".post-body");
  if (!postBody || typeof Prism === "undefined") return;

  const inferLanguageFromCode = (content) => {
    const normalized = content.trim();
    if (!normalized) return "none";

    if (/^(\s*[\w-]+:\s+.+|\s*-\s+.+)$/m.test(normalized) && /:\s/.test(normalized)) {
      return "yaml";
    }

    if (
      /^(const|let|var|function|class|import|export)\b/m.test(normalized) ||
      /=>/.test(normalized) ||
      /\bconsole\./.test(normalized) ||
      /[.{][\s\S]*[}]/.test(normalized)
    ) {
      return "javascript";
    }

    if (/^\s*[{[][\s\S]*[}\]]\s*$/m.test(normalized) && /"\s*:/.test(normalized)) {
      return "json";
    }

    if (/^\s*<\/?[a-z][\s\S]*>\s*$/im.test(normalized)) {
      return "markup";
    }

    if (/\b(interface|type|implements|enum)\b/.test(normalized)) {
      return "typescript";
    }

    if (/^\s*(curl|npm|pnpm|yarn|git|cd|ls|rm|mkdir)\b/m.test(normalized)) {
      return "bash";
    }

    return "none";
  };

  const highlightPlaintextFigure = (figure) => {
    const codeCell = figure.querySelector("td.code pre");
    if (!codeCell) return;

    const lines = Array.from(codeCell.querySelectorAll(".line"));
    const rawText = lines.length > 0
      ? lines.map((line) => line.textContent || "").join("\n")
      : (codeCell.textContent || "");
    const language = inferLanguageFromCode(rawText);
    if (language === "none" || !Prism.languages[language]) return;

    const highlightedLines = rawText.split("\n").map((line) => {
      const highlighted = Prism.highlight(line || " ", Prism.languages[language], language);
      return `<span class="line">${highlighted}</span>`;
    }).join("");

    codeCell.classList.add(`language-${language}`);
    codeCell.innerHTML = `<code class="language-${language}">${highlightedLines}</code>`;
  };

  const plaintextFigures = Array.from(
    postBody.querySelectorAll("figure.highlight.plaintext, figure.highlight.text, figure.highlight.txt"),
  );
  plaintextFigures.forEach(highlightPlaintextFigure);

  const plainBlocks = Array.from(postBody.querySelectorAll("pre > code")).filter(
    (codeElement) => !codeElement.closest("figure.highlight"),
  );

  plainBlocks.forEach((codeElement) => {
    const parentPre = codeElement.parentElement;
    if (!parentPre) return;

    const existingLanguageClass = Array.from(codeElement.classList).find((className) =>
      className.startsWith("language-"),
    );
    const language = existingLanguageClass
      ? existingLanguageClass.replace("language-", "")
      : inferLanguageFromCode(codeElement.textContent || "");

    codeElement.classList.add(`language-${language}`);
    parentPre.classList.add(`language-${language}`);
    if (language !== "none" && Prism.languages[language]) {
      Prism.highlightElement(codeElement);
    }
  });
};

const setupPostImages = () => {
  const postBody = document.querySelector(".post-body");
  if (!postBody) return;

  const prepareLazyImage = (image) => {
    if (!image.dataset.lazySrc) {
      const src = image.getAttribute("src");
      if (src) {
        image.dataset.lazySrc = src;
        image.removeAttribute("src");
      }
    }
  };

  const wrapImageContent = (image) => {
    if (image.closest(".post-image-content")) return;

    const content = document.createElement("span");
    content.className = "post-image-content lazy-media";
    image.parentNode?.insertBefore(content, image);
    content.appendChild(image);
  };

  const figureImages = Array.from(
    postBody.querySelectorAll("figure:not(.highlight) img"),
  );

  figureImages.forEach((image) => {
    wrapImageContent(image);
    prepareLazyImage(image);
  });

  const candidateImages = Array.from(
    postBody.querySelectorAll("p img, li img, blockquote img"),
  ).filter((image) => !image.closest("figure") && !image.closest(".post-image-frame"));

  candidateImages.forEach((image) => {
    const frame = document.createElement("span");
    frame.className = "post-image-frame";
    image.parentNode?.insertBefore(frame, image);
    frame.appendChild(image);
    wrapImageContent(image);
    prepareLazyImage(image);
  });

};

setupLoadingScreen();
setupPostImages();
setupLazyMedia();

window.addEventListener("load", () => {
  setupMenu();
  setupWorksLogoTrigger();
  setupScrollScene();
  // setupFloat();
  setupHomeMaskCarousel();
  setupDiaryInteraction();
  setupWorksGirl();
  setupWorksBubble();
  setupTechGirl();
  setupFishingGirl();
  setupFishingItems();
  setupWechatModal();
  setupPostEntrance();
  setupCodeHighlight();
});
