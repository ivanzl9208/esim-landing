import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const ASSET_ROOT = `${import.meta.env.BASE_URL}assets`;
const CHIP_FRAME_COUNT = 150;
const MOBILE_BREAKPOINT = 700;

const getLayoutScale = () => {
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  const baseWidth = isMobile ? 360 : 1440;
  const baseHeight = isMobile ? 600 : 720;
  const rawScale = Math.min(
    window.innerWidth / baseWidth,
    window.innerHeight / baseHeight,
  );

  return Math.min(
    Math.max(rawScale, isMobile ? 0.88 : 0.72),
    isMobile ? 1.25 : 1.6,
  );
};

const syncLayoutScale = () => {
  document.documentElement.style.setProperty(
    "--layout-scale",
    getLayoutScale().toFixed(5),
  );
};

syncLayoutScale();
const ROULETTE_LINES = [
  "eSIM\u00A0—",
  "виртуальная",
  "сим-карта:",
  "звонки,",
  "интернет",
  "и\u00A0смс\u00A0—",
];

const CHIP_FEATURES = [
  {
    icon: "feature-timer.svg",
    title: "Моментальный выпуск\nонлайн",
    description:
      "Подключение за\u00A05\u00A0минут через Госуслуги, без\u00A0офиса " +
      "и\u00A0курьера. Перевыпуск\u00A0— прямо в\u00A0приложении",
  },
  {
    icon: "feature-dual-sim.svg",
    title: "Несколько номеров\nв\u00A0одном устройстве",
    description:
      "Используйте eSIM и\u00A0обычную сим-карту для\u00A0разных задач\u00A0— " +
      "и\u00A0легко переключайтесь между\u00A0ними",
  },
  {
    icon: "feature-chip.svg",
    title: "Всегда надёжна\nи\u00A0под рукой",
    description:
      "eSIM встроена в\u00A0смартфон\u00A0— не\u00A0потеряется, " +
      "не\u00A0сломается и\u00A0не\u00A0имеет срока годности",
  },
  {
    icon: "feature-location.svg",
    title: "Без ограничений\nи\u00A0бесплатно",
    description:
      "eSIM доступна на\u00A0любом тарифе и\u00A0в\u00A0любом регионе\u00A0— " +
      "без\u00A0доплат",
  },
  {
    icon: "feature-watch.svg",
    title: "Не\u00A0только для\u00A0смартфонов",
    description: "Совместима с\u00A0планшетами, смарт-часами и\u00A0трекерами",
  },
  {
    icon: "feature-lock.svg",
    title: "Усиленная безопасность",
    description:
      "Управлять eSIM можно только с\u00A0вашего устройства\u00A0— " +
      "при\u00A0этом её\u00A0легко перенести, если смените смартфон",
  },
];

const STORY_BENEFITS = [
  "...быстрое оформление и\u00A0установка\u00A0— онлайн за\u00A05\u00A0минут",
  "...второй номер в\u00A0одном телефоне\u00A0— для\u00A0разных задач",
  "...удобство использования\u00A0— легко установить и\u00A0перенести номер",
  "...безопасная связь\u00A0— доступ к\u00A0сим-карте только у\u00A0вас",
];

const SAFETY_COPY =
  "А\u00A0ещё eSIM безопасна\u00A0— её\u00A0нельзя потерять или \n" +
  "вытащить, как\u00A0обычную пластиковую сим-карту";

function SoftBlurText({ text }) {
  let unitIndex = 0;

  return text
    .split(/(\n|[ \t]+)/u)
    .filter(Boolean)
    .map((segment, segmentIndex) => {
      if (/^(?:\n|[ \t]+)$/u.test(segment)) {
        return Array.from(segment).map((character, characterIndex) => {
          if (character === "\n") {
            return (
              <br
                key={`break-${segmentIndex}-${characterIndex}`}
              />
            );
          }

          const index = unitIndex;
          unitIndex += 1;
          return (
            <span
              className="soft-blur-unit soft-blur-space"
              data-soft-index={index}
              key={`space-${segmentIndex}-${characterIndex}`}
            >
              {character}
            </span>
          );
        });
      }

      return (
        <span className="soft-blur-word" key={`word-${segmentIndex}`}>
          {Array.from(segment).map((character, characterIndex) => {
            const index = unitIndex;
            unitIndex += 1;
            return (
              <span
                className="soft-blur-unit"
                data-soft-index={index}
                key={`character-${segmentIndex}-${characterIndex}`}
              >
                {character}
              </span>
            );
          })}
        </span>
      );
    });
}

function SafetyCopy() {
  let characterIndex = 0;

  return (
    <p className="safety-copy" aria-label={SAFETY_COPY.replace("\n", "")}>
      {Array.from(SAFETY_COPY).map((character, index) => {
        if (character === "\n") {
          return <br className="safety-mobile-break" key={`break-${index}`} />;
        }

        const currentIndex = characterIndex;
        characterIndex += 1;
        return (
          <span
            className="safety-character"
            data-safety-index={currentIndex}
            key={`safety-${index}`}
          >
            {character}
          </span>
        );
      })}
    </p>
  );
}

function BrandLogo() {
  return (
    <img
      className="brand-logo"
      src={`${ASSET_ROOT}/sbermobile-logo.svg`}
      alt={"СберМобайл\u00A0— выгоднее с\u00A0Прайм"}
    />
  );
}

function BonusesBadge() {
  return (
    <div className="bonuses" aria-label="Бонусы СберСпасибо">
      <span>Бонусы</span>
      <img src={`${ASSET_ROOT}/bonus-icon.svg`} alt="" />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="site-header">
      <BrandLogo />

      <div className="location">
        <img src={`${ASSET_ROOT}/location-pin.svg`} alt="" />
        <span>Ханты-Мансийский...</span>
      </div>

      <nav className="desktop-nav" aria-label="Основная навигация">
        <span>Связь</span>
        <span>Услуги и&nbsp;сервисы</span>
        <span>Оплата</span>
        <span>Поддержка</span>
        <span>Компания</span>
        <span>Кабинет абонента</span>
      </nav>

      <div className="account-actions">
        <BonusesBadge />
        <span className="login">Войти</span>
        <div className="mobile-menu" aria-label="Меню">
          <img src={`${ASSET_ROOT}/menu-icon.svg`} alt="" />
        </div>
      </div>
    </header>
  );
}

function HeroContent() {
  return (
    <div className="hero-content">
      <div className="hero-copy">
        <h1>eSIM&nbsp;—&nbsp;виртуальная сим-карта</h1>
        <p>
          Безопасное подключение онлайн за&nbsp;5&nbsp;минут
        </p>
      </div>

      <a className="connect-button" id="connect" href="#connect">
        Подключить eSIM
      </a>
    </div>
  );
}

function HeroVideo() {
  const videoRef = useRef(null);
  const userAgent = window.navigator.userAgent;
  const isSafari =
    window.navigator.vendor.includes("Apple") &&
    !/(CriOS|FxiOS|EdgiOS|OPiOS)/i.test(userAgent);
  const videoSrc = isSafari
    ? `${ASSET_ROOT}/hero-alpha.mov`
    : `${ASSET_ROOT}/hero.webm`;
  const videoType = isSafari
    ? 'video/quicktime; codecs="hvc1"'
    : "video/webm";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;

    const isVideoVisible = () => {
      const rect = video.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    };

    const playVideo = () => {
      if (document.hidden || !isVideoVisible()) return;

      if (video.ended) {
        video.currentTime = 0;
      }

      const playback = video.play();
      if (playback) {
        playback.catch(() => {
          // Safari may temporarily reject playback while its browser UI
          // changes size. The next visibility/intersection event retries it.
        });
      }
    };

    const restartVideo = () => {
      video.currentTime = 0;
      playVideo();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) playVideo();
    };

    const handlePause = () => {
      if (isVideoVisible()) {
        window.requestAnimationFrame(playVideo);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) playVideo();
      },
      { threshold: 0.01 },
    );

    observer.observe(video);
    video.addEventListener("canplay", playVideo);
    video.addEventListener("ended", restartVideo);
    video.addEventListener("pause", handlePause);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", playVideo);
    window.addEventListener("pageshow", playVideo);

    playVideo();

    return () => {
      observer.disconnect();
      video.removeEventListener("canplay", playVideo);
      video.removeEventListener("ended", restartVideo);
      video.removeEventListener("pause", handlePause);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      window.removeEventListener("focus", playVideo);
      window.removeEventListener("pageshow", playVideo);
    };
  }, [videoSrc]);

  return (
    <video
      ref={videoRef}
      className="hero-video"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-label="Анимация eSIM"
    >
      <source src={videoSrc} type={videoType} />
    </video>
  );
}

function RouletteStage({ stageRef }) {
  return (
    <div
      className="roulette-stage"
      ref={stageRef}
      aria-label="Преимущества eSIM"
    >
      <div className="roulette-copy" aria-hidden="true">
        {ROULETTE_LINES.map((line, index) => (
          <span
            className="roulette-line"
            data-roulette-index={index}
            key={line}
          >
            {line}
          </span>
        ))}
      </div>

      <div className="roulette-finale" aria-hidden="true">
        всё&nbsp;как <br className="finale-desktop-break" />
        у&nbsp;обычной
        <br />
        сим-карты
      </div>
    </div>
  );
}

function ChipRevealStage({ marqueeRef, videoRef, frameRef }) {
  const userAgent = window.navigator.userAgent;
  const isSafari =
    /Safari/i.test(userAgent) &&
    !/(Chrome|Chromium|CriOS|FxiOS|Edg|EdgiOS|OPiOS|Android)/i.test(
      userAgent,
    );
  const videoSrc = isSafari
    ? `${ASSET_ROOT}/chip-scroll.mov`
    : `${ASSET_ROOT}/chip-scroll.webm`;

  return (
    <div
      className="chip-reveal-layer"
      aria-label="eSIM-чип СберМобайла"
    >
      <div className="chip-gradient" aria-hidden="true">
        <div className="chip-background-transition" />
        <div className="advantages-marquee" ref={marqueeRef}>
          Преимущества&nbsp;eSIM
        </div>
        <div className="esim-definition-marquee">
          eSIM&nbsp;— это...
        </div>
        <div className="story-benefits-copy" aria-live="off">
          {STORY_BENEFITS.map((text, index) => (
            <p
              className={`story-benefit story-benefit-${index + 1}`}
              key={text}
            >
              {text}
            </p>
          ))}
        </div>
        <SafetyCopy />
        <video
          className="chip-scroll-video"
          ref={videoRef}
          src={videoSrc}
          poster={`${ASSET_ROOT}/chip-frames/frame-001.webp`}
          data-video-format={isSafari ? "mov" : "webm"}
          muted
          playsInline
          preload="auto"
          loop
          aria-hidden="true"
        />
        <img
          className="chip-scroll-frame"
          ref={frameRef}
          src={`${ASSET_ROOT}/chip-frames/frame-001.webp`}
          alt=""
          aria-hidden="true"
        />
        <div className="chip-features">
          {CHIP_FEATURES.map((feature, index) => (
            <article
              className={`chip-feature chip-feature-${index}`}
              data-feature-index={index}
              key={index}
            >
              <div className="chip-feature-rule">
                <span className="chip-feature-icon" aria-hidden="true">
                  <img
                    className="chip-feature-icon-motion"
                    src={`${ASSET_ROOT}/icons/${feature.icon}`}
                    alt=""
                  />
                </span>
              </div>
              <div className="chip-feature-copy">
                <div className="chip-feature-title-clip">
                  <h2>
                    <SoftBlurText text={feature.title} />
                  </h2>
                </div>
                <div className="chip-feature-paragraph-clip">
                  <p>
                    <SoftBlurText text={feature.description} />
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const sceneRef = useRef(null);
  const rouletteRef = useRef(null);
  const marqueeRef = useRef(null);
  const chipVideoRef = useRef(null);
  const chipFrameRef = useRef(null);

  useEffect(() => {
    const handleResize = () => syncLayoutScale();

    syncLayoutScale();
    window.addEventListener("resize", handleResize, { passive: true });

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

    if (reducedMotion || !hasFinePointer) return undefined;

    let currentScroll = window.scrollY;
    let targetScroll = window.scrollY;
    let scrollVelocity = 0;
    let previousFrameTime = 0;
    let rafId = 0;
    const springFrequency = 9.2;

    const getMaxScroll = () =>
      Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

    const renderSmoothScroll = (frameTime) => {
      const maxScroll = getMaxScroll();
      const deltaTime = previousFrameTime
        ? Math.min((frameTime - previousFrameTime) / 1000, 0.04)
        : 1 / 60;
      previousFrameTime = frameTime;

      targetScroll = Math.min(Math.max(targetScroll, 0), maxScroll);

      const distance = targetScroll - currentScroll;
      const acceleration =
        springFrequency * springFrequency * distance -
        2 * springFrequency * scrollVelocity;

      scrollVelocity += acceleration * deltaTime;
      currentScroll += scrollVelocity * deltaTime;
      currentScroll = Math.min(Math.max(currentScroll, 0), maxScroll);

      if (
        Math.abs(targetScroll - currentScroll) < 0.1 &&
        Math.abs(scrollVelocity) < 1
      ) {
        currentScroll = targetScroll;
        scrollVelocity = 0;
      }

      window.scrollTo(0, currentScroll);

      if (currentScroll !== targetScroll || scrollVelocity !== 0) {
        rafId = window.requestAnimationFrame(renderSmoothScroll);
      } else {
        rafId = 0;
        previousFrameTime = 0;
      }
    };

    const startSmoothScroll = () => {
      if (!rafId) {
        previousFrameTime = 0;
        rafId = window.requestAnimationFrame(renderSmoothScroll);
      }
    };

    const handleWheel = (event) => {
      if (event.ctrlKey) return;

      event.preventDefault();

      const deltaMultiplier =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? window.innerHeight
            : 1;

      targetScroll += event.deltaY * deltaMultiplier;
      targetScroll = Math.min(Math.max(targetScroll, 0), getMaxScroll());
      startSmoothScroll();
    };

    const syncNativeScroll = () => {
      if (!rafId) {
        currentScroll = window.scrollY;
        targetScroll = window.scrollY;
        scrollVelocity = 0;
      }
    };

    const handleResize = () => {
      targetScroll = Math.min(targetScroll, getMaxScroll());
      currentScroll = Math.min(currentScroll, getMaxScroll());
      scrollVelocity = 0;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", syncNativeScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", syncNativeScroll);
      window.removeEventListener("resize", handleResize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const roulette = rouletteRef.current;
    if (!scene || !roulette) return undefined;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const rouletteLines = Array.from(
      roulette.querySelectorAll(".roulette-line"),
    );
    const rouletteFinale = roulette.querySelector(".roulette-finale");
    const rouletteButton = scene.querySelector(".roulette-button");
    const rouletteBottomFade = scene.querySelector(
      ".roulette-bottom-fade",
    );
    if (!rouletteFinale || !rouletteButton || !rouletteBottomFade) {
      return undefined;
    }

    const clamp = (value, min = 0, max = 1) =>
      Math.min(Math.max(value, min), max);
    const smoothstep = (edge0, edge1, value) => {
      const progress = clamp((value - edge0) / (edge1 - edge0));
      return progress * progress * (3 - 2 * progress);
    };
    const mix = (from, to, progress) => from + (to - from) * progress;
    const sampleKeyframes = (frames, value) => {
      if (value <= frames[0].at) return frames[0];
      if (value >= frames[frames.length - 1].at) {
        return frames[frames.length - 1];
      }

      const nextIndex = frames.findIndex((frame) => frame.at >= value);
      const from = frames[nextIndex - 1];
      const to = frames[nextIndex];
      const progress = (value - from.at) / (to.at - from.at);

      return {
        top: mix(from.top, to.top, progress),
        fontSize: mix(from.fontSize, to.fontSize, progress),
        lineHeight: mix(from.lineHeight, to.lineHeight, progress),
        opacity: mix(from.opacity, to.opacity, progress),
      };
    };

    let targetCurtain = 0;
    let currentCurtain = 0;
    let targetTimeline = 0;
    let currentTimeline = 0;
    let targetReveal = 0;
    let currentReveal = 0;
    let targetButtonReveal = 0;
    let currentButtonReveal = 0;
    let buttonDelayId = 0;
    let buttonIsTriggered = false;
    let rafId = 0;

    const measure = () => {
      const rect = scene.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollOffset = clamp(
        -rect.top,
        0,
        Math.max(scene.offsetHeight - viewportHeight, 1),
      );
      const sceneScrollEnd = Math.max(
        scene.offsetHeight - viewportHeight,
        1,
      );
      const rouletteStart = viewportHeight * 1.28;
      const rouletteEnd = Math.max(
        Math.min(
          sceneScrollEnd - viewportHeight * 0.35,
          viewportHeight * 4.35,
        ),
        rouletteStart + 1,
      );
      const rouletteRange = Math.max(
        rouletteEnd - rouletteStart,
        1,
      );

      targetCurtain = clamp(scrollOffset / viewportHeight);
      targetReveal = smoothstep(
        viewportHeight * 0.8,
        viewportHeight,
        scrollOffset,
      );

      const isMobileViewport = window.matchMedia(
        "(max-width: 700px)",
      ).matches;
      const curtainIsFull = scrollOffset >= viewportHeight;

      if (isMobileViewport) {
        if (buttonDelayId) {
          window.clearTimeout(buttonDelayId);
          buttonDelayId = 0;
        }
        buttonIsTriggered = false;
        targetButtonReveal = 0;
      } else if (curtainIsFull) {
        if (!buttonIsTriggered && !buttonDelayId) {
          buttonDelayId = window.setTimeout(() => {
            buttonDelayId = 0;
            buttonIsTriggered = true;
            targetButtonReveal = 1;

            if (reducedMotion) {
              currentButtonReveal = 1;
              renderScene();
            } else if (!rafId) {
              rafId = window.requestAnimationFrame(render);
            }
          }, 1000);
        }
      } else {
        if (buttonDelayId) {
          window.clearTimeout(buttonDelayId);
          buttonDelayId = 0;
        }
        buttonIsTriggered = false;
        targetButtonReveal = 0;
      }

      targetTimeline =
        clamp((scrollOffset - rouletteStart) / rouletteRange) * 10;

      if (reducedMotion) {
        currentCurtain = targetCurtain;
        currentTimeline = targetTimeline;
        currentReveal = targetReveal;
        currentButtonReveal = targetButtonReveal;
        renderScene();
        return;
      }

      if (!rafId) rafId = window.requestAnimationFrame(render);
    };

    const renderScene = () => {
      const curtainOffset = (1 - currentCurtain) * 100;
      const isMobile = window.matchMedia("(max-width: 700px)").matches;
      const layoutScale = getLayoutScale();
      const viewportHeight = window.innerHeight;
      const lineStep = (isMobile ? 160 : 280) * layoutScale;
      const centerTop = isMobile
        ? viewportHeight / 2 - 89 * layoutScale
        : viewportHeight / 2 - 48 * layoutScale;
      const linePosition = currentTimeline - 1;

      scene.style.setProperty("--curtain-y", `${curtainOffset}%`);
      roulette.style.setProperty("--curtain-clip", `${curtainOffset}%`);
      roulette.style.setProperty("--roulette-reveal", currentReveal);

      const buttonProgress = isMobile ? 1 : currentButtonReveal;
      const buttonOffset = isMobile
        ? 0
        : -96 * layoutScale * (1 - buttonProgress);
      const chipTransitionIsActive =
        scene.dataset.chipTransitionActive === "true";
      rouletteButton.style.transform =
        `translate3d(${isMobile ? "-50%" : "0"}, ${buttonOffset.toFixed(2)}px, 0)`;
      rouletteButton.style.pointerEvents =
        buttonProgress > 0.98 ? "auto" : "none";

      if (isMobile && !chipTransitionIsActive) {
        const curtainTop = (1 - currentCurtain) * viewportHeight;
        const buttonHeight = 50 * layoutScale;
        const buttonTop =
          viewportHeight - 24 * layoutScale - buttonHeight;
        const buttonSplit = clamp(
          (curtainTop - buttonTop) / buttonHeight,
        );

        rouletteButton.style.setProperty(
          "--button-curtain-split",
          `${(buttonSplit * 100).toFixed(3)}%`,
        );
        rouletteButton.style.backgroundColor = "transparent";
        rouletteButton.style.color = "transparent";
        rouletteBottomFade.style.opacity = currentCurtain.toFixed(4);
      } else if (!chipTransitionIsActive) {
        rouletteButton.style.backgroundColor = "#fa5f05";
        rouletteButton.style.color = "#fff";
        rouletteBottomFade.style.opacity = "0";
      } else {
        rouletteBottomFade.style.opacity =
          isMobile &&
          scene.dataset.chipButtonInverted !== "true"
            ? "1"
            : "0";
      }

      rouletteLines.forEach((line, index) => {
        const slot = index - linePosition;
        const centerDistance = Math.abs(slot);
        const y = centerTop + slot * lineStep;
        const fadeStrength = slot >= 0 ? 1.609 : 2.996;
        const depthOpacity = Math.exp(
          -fadeStrength * centerDistance * centerDistance,
        );
        let opacity = depthOpacity;

        if (currentTimeline <= 1) {
          const introProgress = smoothstep(0, 1, currentTimeline);

          if (index === 0) {
            opacity = mix(0.05, 1, introProgress);
          } else if (index === 1) {
            opacity = mix(0, 0.05, introProgress);
          } else if (isMobile && index === 2) {
            opacity = mix(0, 0.05, introProgress);
          } else {
            opacity = 0;
          }
        } else if (currentTimeline < 2) {
          const normalProgress = smoothstep(1, 2, currentTimeline);
          const introOpacity =
            index === 0
              ? 1
              : index === 1 || (isMobile && index === 2)
                ? 0.05
                : 0;
          opacity = mix(introOpacity, depthOpacity, normalProgress);
        }

        const scale = 1 - Math.min(centerDistance, 1.5) * 0.018;
        line.style.opacity = opacity.toFixed(4);
        line.style.transform = `translate3d(-50%, ${y}px, 0) scale(${scale.toFixed(4)})`;
      });

      const finaleFrames = isMobile
        ? [
            {
              at: 5,
              top: viewportHeight / 2 + 231 * layoutScale,
              fontSize: 48 * layoutScale,
              lineHeight: 48 * layoutScale,
              opacity: 0,
            },
            {
              at: 6,
              top: viewportHeight / 2 + 71 * layoutScale,
              fontSize: 52 * layoutScale,
              lineHeight: 52 * layoutScale,
              opacity: 0.2,
            },
            {
              at: 7,
              top: viewportHeight / 2 - 89 * layoutScale,
              fontSize: 56 * layoutScale,
              lineHeight: 56 * layoutScale,
              opacity: 0.35,
            },
            {
              at: 8,
              top: viewportHeight / 2 - 249 * layoutScale,
              fontSize: 64 * layoutScale,
              lineHeight: 64 * layoutScale,
              opacity: 0.5,
            },
            {
              at: 9,
              top: viewportHeight / 2 - 409 * layoutScale,
              fontSize: 64 * layoutScale,
              lineHeight: 64 * layoutScale,
              opacity: 1,
            },
            {
              at: 9.8,
              top: -105 * layoutScale,
              fontSize: 64 * layoutScale,
              lineHeight: 64 * layoutScale,
              opacity: 0.08,
            },
            {
              at: 10,
              top: -120 * layoutScale,
              fontSize: 64 * layoutScale,
              lineHeight: 64 * layoutScale,
              opacity: 0,
            },
          ]
        : [
            {
              at: 5,
              top: viewportHeight / 2 + 512 * layoutScale,
              fontSize: 90 * layoutScale,
              lineHeight: 72 * layoutScale,
              opacity: 0,
            },
            {
              at: 6,
              top: viewportHeight / 2 + 232 * layoutScale,
              fontSize: 120 * layoutScale,
              lineHeight: 96 * layoutScale,
              opacity: 0.2,
            },
            {
              at: 7,
              top: viewportHeight / 2 - 48 * layoutScale,
              fontSize: 150 * layoutScale,
              lineHeight: 120 * layoutScale,
              opacity: 0.35,
            },
            {
              at: 8,
              top: viewportHeight / 2 - 164 * layoutScale,
              fontSize: 180 * layoutScale,
              lineHeight: 140 * layoutScale,
              opacity: 0.5,
            },
            {
              at: 9,
              top: viewportHeight / 2 - 270 * layoutScale,
              fontSize: 220 * layoutScale,
              lineHeight: 180 * layoutScale,
              opacity: 1,
            },
            {
              at: 9.8,
              top: -410 * layoutScale,
              fontSize: 220 * layoutScale,
              lineHeight: 180 * layoutScale,
              opacity: 0.08,
            },
            {
              at: 10,
              top: -470 * layoutScale,
              fontSize: 220 * layoutScale,
              lineHeight: 180 * layoutScale,
              opacity: 0,
            },
          ];
      const finaleFrame = sampleKeyframes(
        finaleFrames,
        currentTimeline,
      );
      const finaleBaseFontSize =
        (isMobile ? 64 : 220) * layoutScale;
      const finaleScale =
        finaleFrame.fontSize / finaleBaseFontSize;

      rouletteFinale.style.top = `${finaleFrame.top}px`;
      rouletteFinale.style.opacity = finaleFrame.opacity.toFixed(4);
      rouletteFinale.style.transform =
        `translate3d(-50%, 0, 0) scale(${finaleScale.toFixed(5)})`;
    };

    const render = () => {
      currentCurtain += (targetCurtain - currentCurtain) * 0.16;
      currentTimeline += (targetTimeline - currentTimeline) * 0.11;
      currentReveal += (targetReveal - currentReveal) * 0.16;
      currentButtonReveal +=
        (targetButtonReveal - currentButtonReveal) * 0.16;

      if (Math.abs(targetCurtain - currentCurtain) < 0.0005) {
        currentCurtain = targetCurtain;
      }
      if (Math.abs(targetTimeline - currentTimeline) < 0.0005) {
        currentTimeline = targetTimeline;
      }
      if (Math.abs(targetReveal - currentReveal) < 0.0005) {
        currentReveal = targetReveal;
      }
      if (
        Math.abs(targetButtonReveal - currentButtonReveal) < 0.0005
      ) {
        currentButtonReveal = targetButtonReveal;
      }

      renderScene();

      if (
        currentCurtain !== targetCurtain ||
        currentTimeline !== targetTimeline ||
        currentReveal !== targetReveal ||
        currentButtonReveal !== targetButtonReveal
      ) {
        rafId = window.requestAnimationFrame(render);
      } else {
        rafId = 0;
      }
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      if (buttonDelayId) window.clearTimeout(buttonDelayId);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const marquee = marqueeRef.current;
    const video = chipVideoRef.current;
    const frame = chipFrameRef.current;
    if (!scene || !marquee || !video || !frame) {
      return undefined;
    }

    const layer = scene.querySelector(".chip-reveal-layer");
    const gradient = scene.querySelector(".chip-gradient");
    const backgroundTransition = scene.querySelector(
      ".chip-background-transition",
    );
    const definitionMarquee = scene.querySelector(
      ".esim-definition-marquee",
    );
    const button = scene.querySelector(".roulette-button");
    const buttonLabel = scene.querySelector(".roulette-button-label");
    const bottomFade = scene.querySelector(".roulette-bottom-fade");
    const featureElements = Array.from(
      scene.querySelectorAll(".chip-feature"),
    );
    const storyElements = Array.from(
      scene.querySelectorAll(".story-benefit"),
    );
    const safetyCopy = scene.querySelector(".safety-copy");
    const safetyCharacters = Array.from(
      scene.querySelectorAll(".safety-character"),
    );
    if (
      !layer ||
      !gradient ||
      !backgroundTransition ||
      !definitionMarquee ||
      !button ||
      !buttonLabel ||
      !bottomFade ||
      !safetyCopy ||
      safetyCharacters.length === 0 ||
      featureElements.length !== CHIP_FEATURES.length ||
      storyElements.length !== STORY_BENEFITS.length
    ) {
      return undefined;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const clamp = (value, min = 0, max = 1) =>
      Math.min(Math.max(value, min), max);
    const smoothstep = (edge0, edge1, value) => {
      const progress = clamp((value - edge0) / (edge1 - edge0));
      return progress * progress * (3 - 2 * progress);
    };
    const cubicBezierValue = (progress, x1, y1, x2, y2) => {
      const targetX = clamp(progress);
      let parameter = targetX;

      for (let iteration = 0; iteration < 5; iteration += 1) {
        const inverse = 1 - parameter;
        const currentX =
          3 * inverse * inverse * parameter * x1 +
          3 * inverse * parameter * parameter * x2 +
          parameter * parameter * parameter;
        const derivative =
          3 * inverse * inverse * x1 +
          6 * inverse * parameter * (x2 - x1) +
          3 * parameter * parameter * (1 - x2);

        if (Math.abs(derivative) < 0.00001) break;
        parameter = clamp(
          parameter - (currentX - targetX) / derivative,
        );
      }

      const inverse = 1 - parameter;
      return (
        3 * inverse * inverse * parameter * y1 +
        3 * inverse * parameter * parameter * y2 +
        parameter * parameter * parameter
      );
    };
    const mix = (from, to, progress) => from + (to - from) * progress;
    const mixRgb = (from, to, progress) =>
      `rgb(${from.map((channel, index) =>
        Math.round(mix(channel, to[index], progress))).join(", ")})`;
    let targetReveal = 0;
    let currentReveal = 0;
    let targetChip = 0;
    let currentChip = 0;
    let targetMarquee = 0;
    let currentMarquee = 0;
    let marqueeVelocity = 0;
    let targetVideo = 0;
    let currentVideo = 0;
    let videoVelocity = 0;
    let targetPlayback = 0;
    let currentPlayback = 0;
    let playbackVelocity = 0;
    let targetDefinition = 0;
    let currentDefinition = 0;
    let definitionVelocity = 0;
    let targetDefinitionVisibility = 0;
    let currentDefinitionVisibility = 0;
    let targetBackground = 0;
    let currentBackground = 0;
    let targetStory = 0;
    let currentStory = 0;
    let targetSafety = 0;
    let currentSafety = 0;
    let targetReturnGradient = 0;
    let currentReturnGradient = 0;
    let videoDuration = 6;
    let pendingVideoTime = null;
    let currentFrameIndex = 0;
    let playbackEndTurns = 1;
    let rafId = 0;
    const useFrameSequence = video.dataset.videoFormat === "mov";
    const frameUrls = Array.from(
      { length: CHIP_FRAME_COUNT },
      (_, index) =>
        `${ASSET_ROOT}/chip-frames/frame-${String(index + 1).padStart(3, "0")}.webp`,
    );
    const preloadedFrames = [];

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.pause();

    if (useFrameSequence) {
      frameUrls.forEach((src) => {
        const image = new Image();
        image.decoding = "async";
        image.src = src;
        preloadedFrames.push(image);
      });
    }

    const flushVideoSeek = () => {
      if (
        pendingVideoTime === null ||
        video.readyState < 1 ||
        video.seeking
      ) {
        return;
      }

      const nextTime = pendingVideoTime;
      pendingVideoTime = null;
      if (Math.abs(video.currentTime - nextTime) <= 0.012) return;

      if (
        video.dataset.videoFormat === "mov" &&
        typeof video.fastSeek === "function"
      ) {
        video.fastSeek(nextTime);
      } else {
        video.currentTime = nextTime;
      }
    };

    const syncVideoMetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        videoDuration = video.duration;
      }
      video.pause();
      flushVideoSeek();
    };

    const setFeatureProgress = (
      element,
      start,
      end,
      progress,
    ) => {
      const icon = element.querySelector(".chip-feature-icon-motion");
      const units = Array.from(
        element.querySelectorAll(".soft-blur-unit"),
      );
      const localProgress = clamp(
        (progress - start) / Math.max(end - start, 0.0001),
      );
      const enterProgress = clamp(localProgress / 0.38);
      const exitProgress = clamp((localProgress - 0.68) / 0.32);
      const unitCount = Math.max(units.length, 1);
      const layoutScale = getLayoutScale();

      element.style.visibility =
        localProgress > 0 && localProgress < 1
          ? "visible"
          : "hidden";

      const applySoftBlur = (
        motionElement,
        motionIndex,
        blurDistance,
      ) => {
        if (!motionElement) return;

        const rank = motionIndex / Math.max(unitCount - 1, 1);
        const enterDelay = rank * 0.32;
        const exitDelay = rank * 0.38;
        const enter = cubicBezierValue(
          clamp((enterProgress - enterDelay) / 0.68),
          0.22,
          1,
          0.36,
          1,
        );
        const exit = cubicBezierValue(
          clamp((exitProgress - exitDelay) / 0.62),
          0.64,
          0,
          0.78,
          0,
        );
        const isExiting = exitProgress > 0;
        const opacity = isExiting ? 1 - exit : enter;
        const blur = isExiting
          ? blurDistance * exit
          : blurDistance * (1 - enter);
        const y = isExiting
          ? -9.28 * layoutScale * exit
          : 9.28 * layoutScale * (1 - enter);

        motionElement.style.opacity = opacity.toFixed(4);
        motionElement.style.filter = `blur(${blur.toFixed(3)}px)`;
        motionElement.style.transform =
          `translate3d(0, ${y.toFixed(3)}px, 0)`;
      };

      applySoftBlur(icon, 0, 8);
      units.forEach((unit, unitIndex) => {
        applySoftBlur(
          unit,
          unitIndex,
          unit.closest("p") ? 6 : 12,
        );
      });
    };

    const renderScene = () => {
      const isMobile = window.matchMedia("(max-width: 700px)").matches;
      const layoutScale = getLayoutScale();
      const shutterInset = (1 - currentReveal) * 50;
      const chipStartY = isMobile
        ? window.innerHeight * 0.66
        : window.innerHeight * 0.72;
      const chipEndY = isMobile
        ? 47 * layoutScale
        : 0;
      const chipY = mix(chipStartY, chipEndY, currentChip);
      const chipScale = mix(isMobile ? 0.84 : 0.88, 1, currentChip);
      const safetyTextProgress = clamp(currentSafety);
      const safetyGap = (isMobile ? 60 : 101) * layoutScale;
      const safetyExitMargin = (isMobile ? 24 : 40) * layoutScale;
      const chipRenderedHeight =
        Math.max(video.offsetHeight, frame.offsetHeight) * chipScale;
      const safetyStartOffset =
        window.innerHeight / 2 +
        chipY +
        chipRenderedHeight / 2 +
        safetyGap -
        safetyCopy.offsetTop;
      const safetyTravel =
        safetyCopy.offsetTop +
        safetyStartOffset +
        safetyCopy.offsetHeight +
        safetyExitMargin;
      const safetyChipExit = -safetyTravel * safetyTextProgress;
      const grayStageOpacity = clamp(
        currentBackground * (1 - currentReturnGradient),
      );
      const buttonIsInverted = currentReveal >= 0.95;
      const buttonUsesGrayStageStyle = grayStageOpacity >= 0.95;
      const buttonBackground = currentReturnGradient > 0
        ? mixRgb([250, 95, 5], [255, 255, 255], currentReturnGradient)
        : buttonUsesGrayStageStyle
          ? "#fa5f05"
          : buttonIsInverted
            ? "#fff"
            : "#fa5f05";
      const buttonColor = currentReturnGradient > 0
        ? mixRgb([255, 255, 255], [250, 95, 5], currentReturnGradient)
        : buttonUsesGrayStageStyle
          ? "#fff"
          : buttonIsInverted
            ? "#fa5f05"
            : "#fff";
      const marqueeTravel =
        (window.innerWidth + marquee.offsetWidth) / 2;
      const marqueeOffset = mix(
        marqueeTravel,
        -marqueeTravel,
        currentMarquee,
      );
      const definitionStartX = (isMobile ? 495 : 885) * layoutScale;
      const definitionEndX =
        -(window.innerWidth + definitionMarquee.offsetWidth) / 2 -
        24 * layoutScale;
      const definitionOffset = mix(
        definitionStartX,
        definitionEndX,
        currentDefinition,
      );

      const transitionIsActive = currentReveal > 0.0001;
      scene.dataset.chipTransitionActive = transitionIsActive
        ? "true"
        : "false";
      scene.dataset.chipButtonInverted = buttonIsInverted
        ? "true"
        : "false";
      layer.style.visibility = transitionIsActive ? "visible" : "hidden";
      const gradientClip =
        `inset(0 ${shutterInset.toFixed(4)}% 0 ` +
        `${shutterInset.toFixed(4)}%)`;
      gradient.style.clipPath = gradientClip;
      gradient.style.webkitClipPath = gradientClip;
      backgroundTransition.style.opacity =
        grayStageOpacity.toFixed(4);
      video.style.opacity = useFrameSequence
        ? "0"
        : "1";
      frame.style.opacity = useFrameSequence
        ? "1"
        : "0";
      video.style.transform =
        `translate3d(-50%, calc(-50% + ${(chipY + safetyChipExit).toFixed(2)}px), 0) ` +
        `scale(${chipScale.toFixed(5)})`;
      frame.style.transform = video.style.transform;
      marquee.style.setProperty(
        "--advantages-text-x",
        `${marqueeOffset.toFixed(2)}px`,
      );
      marquee.style.opacity = (
        1 - smoothstep(0.94, 1, currentMarquee)
      ).toFixed(4);
      definitionMarquee.style.setProperty(
        "--definition-text-x",
        `${definitionOffset.toFixed(2)}px`,
      );
      const completedFeatureSequence = smoothstep(
        0.97,
        1,
        currentVideo,
      );
      const definitionOpacity = Math.min(
        currentDefinitionVisibility,
        completedFeatureSequence,
      );
      definitionMarquee.style.opacity = definitionOpacity.toFixed(4);
      definitionMarquee.style.visibility =
        definitionOpacity > 0.001 ? "visible" : "hidden";

      const storyTimeline = clamp(currentStory) * STORY_BENEFITS.length;
      storyElements.forEach((element, index) => {
        const localProgress = storyTimeline - index;
        const enter = smoothstep(0, 0.22, localProgress);
        const exit = 1 - smoothstep(0.7, 1, localProgress);
        const opacity = clamp(Math.min(enter, exit));
        element.style.opacity = opacity.toFixed(4);
        element.style.filter = `blur(${((1 - opacity) * 10).toFixed(3)}px)`;
      });

      const safetyReveal = clamp(safetyTextProgress / 0.9);
      safetyCopy.style.visibility =
        safetyTextProgress > 0.0001 && safetyTextProgress < 0.9999
          ? "visible"
          : "hidden";
      safetyCopy.style.transform =
        `translate3d(-50%, ${(safetyStartOffset - safetyTravel * safetyTextProgress).toFixed(2)}px, 0)`;
      const safetyCharacterCount = Math.max(safetyCharacters.length - 1, 1);
      safetyCharacters.forEach((character, index) => {
        const threshold = index / safetyCharacterCount;
        const active = smoothstep(
          threshold - 0.025,
          threshold + 0.025,
          safetyReveal,
        );
        const opacity = mix(0.1, 0.86, active);
        character.style.color =
          `rgba(11, 12, 13, ${opacity.toFixed(4)})`;
      });

      if (useFrameSequence) {
        const loopedVideoProgress =
          currentPlayback >= playbackEndTurns - 0.0005
            ? 1
            : currentPlayback >= 1
            ? currentPlayback % 1
            : clamp(currentPlayback);
        const nextFrameIndex = Math.min(
          Math.round(
            loopedVideoProgress * (CHIP_FRAME_COUNT - 1),
          ),
          CHIP_FRAME_COUNT - 1,
        );
        if (nextFrameIndex !== currentFrameIndex) {
          currentFrameIndex = nextFrameIndex;
          frame.src = frameUrls[currentFrameIndex];
        }
      } else if (video.readyState >= 1) {
        const safeDuration = Math.max(videoDuration - 0.045, 0.001);
        const loopedVideoProgress =
          currentPlayback >= playbackEndTurns - 0.0005
            ? 1
            : currentPlayback >= 1
            ? currentPlayback % 1
            : clamp(currentPlayback);
        pendingVideoTime = loopedVideoProgress * safeDuration;
        flushVideoSeek();
      }

      featureElements.forEach((element, index) => {
        let start;
        let end;
        if (isMobile) {
          start = 0.035 + index * 0.153;
          end = start + 0.142;
        } else {
          const pairIndex = Math.floor(index / 2);
          start = 0.045 + pairIndex * 0.305;
          end = start + 0.255;
        }
        setFeatureProgress(
          element,
          start,
          end,
          currentVideo,
        );
      });

      if (transitionIsActive) {
        button.style.background = buttonBackground;
        button.style.backgroundColor = buttonBackground;
        button.style.color = buttonColor;
        buttonLabel.style.background = "none";
        buttonLabel.style.color = buttonColor;
        buttonLabel.style.webkitTextFillColor = buttonColor;
        const storyStageIsActive = currentStory > 0.0001;
        const mobileFadeOpacity = currentReturnGradient > 0
          ? 1 - currentReturnGradient
          : !buttonIsInverted || storyStageIsActive
            ? 1
            : 0;
        bottomFade.style.opacity = isMobile
          ? mobileFadeOpacity.toFixed(4)
          : "0";
      } else {
        button.style.removeProperty("background");
        button.style.removeProperty("background-color");
        button.style.removeProperty("color");
        buttonLabel.style.removeProperty("background");
        buttonLabel.style.removeProperty("color");
        buttonLabel.style.removeProperty("-webkit-text-fill-color");
      }
    };

    const render = () => {
      currentReveal += (targetReveal - currentReveal) * 0.12;
      currentChip += (targetChip - currentChip) * 0.1;
      marqueeVelocity +=
        (targetMarquee - currentMarquee) * 0.035;
      marqueeVelocity *= 0.82;
      currentMarquee += marqueeVelocity;
      videoVelocity += (targetVideo - currentVideo) * 0.04;
      videoVelocity *= 0.8;
      currentVideo += videoVelocity;
      playbackVelocity +=
        (targetPlayback - currentPlayback) * 0.04;
      playbackVelocity *= 0.8;
      currentPlayback += playbackVelocity;
      definitionVelocity +=
        (targetDefinition - currentDefinition) * 0.035;
      definitionVelocity *= 0.82;
      currentDefinition += definitionVelocity;
      currentDefinitionVisibility +=
        (targetDefinitionVisibility - currentDefinitionVisibility) * 0.16;
      currentBackground +=
        (targetBackground - currentBackground) * 0.12;
      const playbackProgressHasFinished =
        currentPlayback >= playbackEndTurns - 0.002;
      const playbackFrameHasFinished = useFrameSequence
        ? playbackProgressHasFinished
        : video.readyState >= 1 &&
          !video.seeking &&
          video.currentTime >= Math.max(videoDuration - 0.1, 0);
      const playbackHasFinished =
        playbackProgressHasFinished && playbackFrameHasFinished;
      const visibleStoryTarget = playbackHasFinished
        ? targetStory
        : 0;
      currentStory += (visibleStoryTarget - currentStory) * 0.14;
      currentSafety += (targetSafety - currentSafety) * 0.1;
      currentReturnGradient +=
        (targetReturnGradient - currentReturnGradient) * 0.1;

      if (Math.abs(targetReveal - currentReveal) < 0.0005) {
        currentReveal = targetReveal;
      }
      if (Math.abs(targetChip - currentChip) < 0.0005) {
        currentChip = targetChip;
      }
      if (
        Math.abs(targetMarquee - currentMarquee) < 0.0001 &&
        Math.abs(marqueeVelocity) < 0.0002
      ) {
        currentMarquee = targetMarquee;
        marqueeVelocity = 0;
      }
      if (
        Math.abs(targetVideo - currentVideo) < 0.0001 &&
        Math.abs(videoVelocity) < 0.0002
      ) {
        currentVideo = targetVideo;
        videoVelocity = 0;
      }
      if (
        Math.abs(targetPlayback - currentPlayback) < 0.0001 &&
        Math.abs(playbackVelocity) < 0.0002
      ) {
        currentPlayback = targetPlayback;
        playbackVelocity = 0;
      }
      if (
        Math.abs(targetDefinition - currentDefinition) < 0.0001 &&
        Math.abs(definitionVelocity) < 0.0002
      ) {
        currentDefinition = targetDefinition;
        definitionVelocity = 0;
      }
      if (
        Math.abs(
          targetDefinitionVisibility - currentDefinitionVisibility,
        ) < 0.0005
      ) {
        currentDefinitionVisibility = targetDefinitionVisibility;
      }
      if (Math.abs(targetBackground - currentBackground) < 0.0005) {
        currentBackground = targetBackground;
      }
      if (Math.abs(visibleStoryTarget - currentStory) < 0.0005) {
        currentStory = visibleStoryTarget;
      }
      if (Math.abs(targetSafety - currentSafety) < 0.0005) {
        currentSafety = targetSafety;
      }
      if (
        Math.abs(targetReturnGradient - currentReturnGradient) < 0.0005
      ) {
        currentReturnGradient = targetReturnGradient;
      }

      renderScene();

      if (
        currentReveal !== targetReveal ||
        currentChip !== targetChip ||
        currentMarquee !== targetMarquee ||
        marqueeVelocity !== 0 ||
        currentVideo !== targetVideo ||
        videoVelocity !== 0 ||
        currentPlayback !== targetPlayback ||
        playbackVelocity !== 0 ||
        currentDefinition !== targetDefinition ||
        definitionVelocity !== 0 ||
        currentDefinitionVisibility !== targetDefinitionVisibility ||
        currentBackground !== targetBackground ||
        currentStory !== targetStory ||
        currentSafety !== targetSafety ||
        currentReturnGradient !== targetReturnGradient
      ) {
        rafId = window.requestAnimationFrame(render);
      } else {
        rafId = 0;
      }
    };

    const measure = () => {
      const rect = scene.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollRange = Math.max(
        scene.offsetHeight - viewportHeight,
        1,
      );
      const scrollOffset = clamp(-rect.top, 0, scrollRange);
      const revealStart = viewportHeight * 4.28;
      const revealEnd = Math.max(
        viewportHeight * 6.95,
        revealStart + 1,
      );
      const progress = clamp(
        (scrollOffset - revealStart) / (revealEnd - revealStart),
      );
      const marqueeStart = revealEnd;
      const marqueeEnd = Math.max(
        Math.min(viewportHeight * 12.45, scrollRange),
        marqueeStart + 1,
      );
      const videoStart = Math.min(marqueeEnd, scrollRange - 1);
      const firstVideoEnd = Math.max(
        Math.min(videoStart + viewportHeight * 8, scrollRange),
        videoStart + 1,
      );
      const definitionStart = Math.min(
        firstVideoEnd + viewportHeight * 0.1,
        scrollRange - 1,
      );
      const definitionEnd = Math.max(
        Math.min(definitionStart + viewportHeight * 5.5, scrollRange),
        definitionStart + 1,
      );
      playbackEndTurns = Math.max(
        1,
        Math.floor(
          (definitionEnd - marqueeStart) /
            Math.max(viewportHeight * 8, 1),
        ),
      );
      const playbackEnd = Math.min(
        marqueeStart +
          playbackEndTurns * Math.max(viewportHeight * 8, 1),
        scrollRange,
      );
      const backgroundStart = Math.min(
        firstVideoEnd - viewportHeight * 0.15,
        scrollRange - 1,
      );
      const backgroundEnd = Math.max(
        Math.min(backgroundStart + viewportHeight * 2.1, scrollRange),
        backgroundStart + 1,
      );
      const storyStart = Math.min(
        Math.max(
          definitionEnd + viewportHeight * 0.18,
          playbackEnd + viewportHeight * 0.3,
        ),
        scrollRange - 1,
      );
      const storyEnd = Math.max(
        Math.min(storyStart + viewportHeight * 7.2, scrollRange),
        storyStart + 1,
      );
      const safetyStart = Math.min(
        storyEnd + viewportHeight * 0.25,
        scrollRange - 1,
      );
      const safetyEnd = Math.max(
        Math.min(safetyStart + viewportHeight * 6, scrollRange),
        safetyStart + 1,
      );
      const returnGradientStart = Math.min(
        safetyStart + (safetyEnd - safetyStart) * 0.58,
        scrollRange - 1,
      );
      const returnGradientEnd = Math.max(
        Math.min(
          returnGradientStart + viewportHeight * 2.25,
          scrollRange,
        ),
        returnGradientStart + 1,
      );

      targetReveal = smoothstep(0, 0.7, progress);
      targetChip = smoothstep(0.04, 0.68, progress);
      targetMarquee = clamp(
        (scrollOffset - marqueeStart) /
          (marqueeEnd - marqueeStart),
      );
      const continuationTurns =
        (definitionEnd - firstVideoEnd) /
        Math.max(viewportHeight * 8, 1);
      targetVideo = clamp(
        (scrollOffset - videoStart) /
          Math.max(firstVideoEnd - videoStart, 1),
        0,
        1 + continuationTurns,
      );
      targetPlayback = clamp(
        (scrollOffset - marqueeStart) /
          Math.max(viewportHeight * 8, 1),
        0,
        playbackEndTurns,
      );
      targetDefinition = clamp(
        (scrollOffset - definitionStart) /
          (definitionEnd - definitionStart),
      );
      targetDefinitionVisibility = smoothstep(
        definitionStart,
        definitionStart + viewportHeight * 0.18,
        scrollOffset,
      );
      targetBackground = smoothstep(
        backgroundStart,
        backgroundEnd,
        scrollOffset,
      );
      targetStory = clamp(
        (scrollOffset - storyStart) / (storyEnd - storyStart),
      );
      targetSafety = clamp(
        (scrollOffset - safetyStart) / (safetyEnd - safetyStart),
      );
      targetReturnGradient = smoothstep(
        returnGradientStart,
        returnGradientEnd,
        scrollOffset,
      );

      if (reducedMotion) {
        currentReveal = targetReveal;
        currentChip = targetChip;
        currentMarquee = targetMarquee;
        marqueeVelocity = 0;
        currentVideo = targetVideo;
        videoVelocity = 0;
        currentPlayback = targetPlayback;
        playbackVelocity = 0;
        currentDefinition = targetDefinition;
        definitionVelocity = 0;
        currentDefinitionVisibility = targetDefinitionVisibility;
        currentBackground = targetBackground;
        currentStory = targetStory;
        currentSafety = targetSafety;
        currentReturnGradient = targetReturnGradient;
        renderScene();
        return;
      }

      if (!rafId) rafId = window.requestAnimationFrame(render);
    };

    measure();
    video.addEventListener("loadedmetadata", syncVideoMetadata);
    video.addEventListener("loadeddata", syncVideoMetadata);
    video.addEventListener("seeked", flushVideoSeek);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      video.removeEventListener("loadedmetadata", syncVideoMetadata);
      video.removeEventListener("loadeddata", syncVideoMetadata);
      video.removeEventListener("seeked", flushVideoSeek);
      video.pause();
      button.style.removeProperty("background");
      button.style.removeProperty("background-color");
      button.style.removeProperty("color");
      buttonLabel.style.removeProperty("background");
      buttonLabel.style.removeProperty("color");
      buttonLabel.style.removeProperty("-webkit-text-fill-color");
      scene.removeAttribute("data-chip-button-inverted");
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <main>
      <div className="scroll-scene" ref={sceneRef}>
        <section className="hero-stage" aria-label="eSIM от СберМобайла">
          <div className="hero-surface">
            <HeroVideo />
            <SiteHeader />
            <HeroContent />
          </div>
          <div className="white-curtain" aria-hidden="true" />
          <ChipRevealStage
            marqueeRef={marqueeRef}
            videoRef={chipVideoRef}
            frameRef={chipFrameRef}
          />
          <RouletteStage stageRef={rouletteRef} />
          <div className="roulette-bottom-fade" aria-hidden="true">
            <div className="roulette-bottom-svg-layer">
              <img src={`${ASSET_ROOT}/blur.svg`} alt="" />
            </div>
          </div>
          <button className="roulette-button" type="button">
            <span className="roulette-button-label">
              Подключить eSIM
            </span>
          </button>
        </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
