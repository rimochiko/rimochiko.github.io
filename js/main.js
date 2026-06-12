gsap.registerPlugin(ScrollTrigger);

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

const setupLoadingScreen = () => {
  const loading = document.querySelector(".site-loading");
  const loadingGirl = document.querySelector(".site-loading__girl");
  const loadingProgressBar = document.querySelector(".site-loading__progress-bar");
  const loadingSessionKey = "mochi-garden:loading-seen";
  const MAX_LOADING_MS = 5000;
  const MIN_LOADING_MS = 480;
  const TRANSITION_MS = 460;

  if (!loading || !loadingGirl || !loadingProgressBar) return;

  const removeLoading = () => {
    document.body.classList.remove("is-loading");
    loading.style.setProperty("--loading-progress", "100%");
    loading.remove();
  };

  let hasSeenLoading = false;

  try {
    hasSeenLoading = window.sessionStorage.getItem(loadingSessionKey) === "1";
  } catch (error) {
    hasSeenLoading = false;
  }

  if (hasSeenLoading) {
    removeLoading();
    return;
  }

  document.body.classList.add("is-loading");

  const spriteSrc = loading.dataset.spriteSrc;
  const frameCount = Number.parseInt(loading.dataset.frameCount || "1", 10);
  const startTime = Date.now();
  let frameTimer = null;
  let progressTimer = null;
  let forceHideTimer = null;
  let minimumDelayTimer = null;
  let hidden = false;
  let pageReady = document.readyState === "complete";
  let currentProgress = 0;
  let minimumDurationReached = false;

  const setProgress = (value) => {
    currentProgress = Math.max(currentProgress, Math.min(value, 100));
    loading.style.setProperty("--loading-progress", `${currentProgress}%`);
  };

  const canHideNow = () => pageReady && minimumDurationReached;

  if (spriteSrc) {
    loadingGirl.style.backgroundImage = `url("${spriteSrc}")`;
  }

  if (spriteSrc && frameCount > 1) {
    let frameIndex = 0;
    loadingGirl.style.backgroundSize = `${frameCount * 100}% 100%`;
    loadingGirl.style.backgroundPosition = "0 0";

    frameTimer = window.setInterval(() => {
      frameIndex = (frameIndex + 1) % frameCount;
      loadingGirl.style.backgroundPosition = `${(frameIndex / (frameCount - 1 || 1)) * 100}% 0`;
    }, 420);
  }

  setProgress(8);

  progressTimer = window.setInterval(() => {
    const elapsed = Date.now() - startTime;
    const ratio = Math.min(elapsed / MAX_LOADING_MS, 1);
    const easedProgress = pageReady
      ? 92 + ratio * 6
      : 8 + (1 - Math.exp(-ratio * 3.2)) * 84;
    setProgress(easedProgress);
  }, 120);

  const hideLoading = () => {
    if (hidden) return;
    hidden = true;

    if (frameTimer) {
      window.clearInterval(frameTimer);
      frameTimer = null;
    }
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

    setProgress(100);

    try {
      window.sessionStorage.setItem(loadingSessionKey, "1");
    } catch (error) {
      // Ignore sessionStorage failures and fall back to first-load behavior.
    }

    loading.classList.add("is-hidden");
    document.body.classList.remove("is-loading");

    window.setTimeout(() => {
      loading.remove();
    }, TRANSITION_MS);
  };

  const requestHide = () => {
    pageReady = true;
    setProgress(96);

    if (canHideNow()) {
      hideLoading();
    }
  };

  minimumDelayTimer = window.setTimeout(() => {
    minimumDurationReached = true;

    if (canHideNow()) {
      hideLoading();
    }
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
  const mochi = document.querySelector(".scroll-mochi");

  if (!road || !mochi) return;

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

  const buildWalkTween = () => {
    const roadWrapHeight = road.offsetHeight;
    const viewportHeight = window.innerHeight;
    // 女孩行走距离 = 滚动距离（road 从 50% 出现到底部）
    // 这样女孩移动速度与滚动速度 1:1，看起来始终在视口内行走
    const travelDistance = Math.max(roadWrapHeight - viewportHeight * 0.5, 0);

    gsap.set(mochi, { xPercent: -50, opacity: 1 });

    return gsap.fromTo(
      mochi,
      { xPercent: -50, y: 0, opacity: 1 },
      {
        xPercent: -50,
        y: travelDistance,
        ease: "none",
        scrollTrigger: {
          trigger: road,
          start: "top 50%",
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

  ScrollTrigger.create({
    trigger: road,
    start: "top 85%",
    end: "bottom top",
    onEnter: () => switchSiteLogo(true),
    onEnterBack: () => switchSiteLogo(true),
    onLeaveBack: () => switchSiteLogo(false),
    onLeave: () => switchSiteLogo(true),
  });

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

  ScrollTrigger.create({
    trigger: worksSection,
    start: "top 85%",
    end: "bottom top",
    onEnter: () => switchSiteLogo(true),
    onEnterBack: () => switchSiteLogo(true),
    onLeaveBack: () => switchSiteLogo(false),
  });
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

  const setActiveSlide = (nextIndex) => {
    slides[activeIndex].classList.remove("is-active");
    slides[nextIndex].classList.add("is-active");
    activeIndex = nextIndex;
  };

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
      window.setTimeout(() => {
        window.location.href = href;
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

  const candidateImages = Array.from(
    postBody.querySelectorAll("p img, li img, blockquote img"),
  ).filter((image) => !image.closest("figure") && !image.closest(".post-image-frame"));

  candidateImages.forEach((image) => {
    const frame = document.createElement("span");
    frame.className = "post-image-frame";
    image.parentNode?.insertBefore(frame, image);
    frame.appendChild(image);
  });
};

setupLoadingScreen();

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
  setupPostEntrance();
  setupCodeHighlight();
  setupPostImages();
});
