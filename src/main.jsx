import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const ASSET_ROOT = `${import.meta.env.BASE_URL}assets`;
const CHIP_FRAME_COUNT = 150;
const CHIP_START_FRAME_INDEX = 75;
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
    title: <>Моментальный выпуск<br />онлайн</>,
    description: (
      <>
        Подключение за&nbsp;5&nbsp;минут через Госуслуги, без&nbsp;офиса
        и&nbsp;курьера. Перевыпуск&nbsp;— прямо в&nbsp;приложении
      </>
    ),
  },
  {
    icon: "feature-dual-sim.svg",
    title: <>Несколько номеров<br />в&nbsp;одном устройстве</>,
    description: (
      <>
        Используйте eSIM и&nbsp;обычную сим-карту для&nbsp;разных задач&nbsp;—
        и&nbsp;легко переключайтесь между&nbsp;ними
      </>
    ),
  },
  {
    icon: "feature-chip.svg",
    title: <>Всегда надёжна<br />и&nbsp;под рукой</>,
    description: (
      <>
        eSIM встроена в&nbsp;смартфон&nbsp;— не&nbsp;потеряется,
        не&nbsp;сломается и&nbsp;не&nbsp;имеет срока годности
      </>
    ),
  },
  {
    icon: "feature-location.svg",
    title: <>Без ограничений<br />и&nbsp;бесплатно</>,
    description: (
      <>
        eSIM доступна на&nbsp;любом тарифе и&nbsp;в&nbsp;любом регионе&nbsp;—
        без&nbsp;доплат
      </>
    ),
  },
  {
    icon: "feature-watch.svg",
    title: <>Не&nbsp;только для&nbsp;смартфонов</>,
    description: (
      <>Совместима с&nbsp;планшетами, смарт-часами и&nbsp;трекерами</>
    ),
  },
  {
    icon: "feature-lock.svg",
    title: <>Усиленная безопасность</>,
    description: (
      <>
        Управлять eSIM можно только с&nbsp;вашего устройства&nbsp;— при&nbsp;этом
        её&nbsp;легко перенести, если смените смартфон
      </>
    ),
  },
];

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

function ChipRevealStage({ chipRef, marqueeRef, videoRef, frameRef }) {
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
        <div className="advantages-marquee" ref={marqueeRef}>
          Преимущества&nbsp;eSIM
        </div>
        <img
          className="chip-static"
          ref={chipRef}
          src={`${ASSET_ROOT}/esim-chip-static.png`}
          alt=""
        />
        <video
          className="chip-scroll-video"
          ref={videoRef}
          src={videoSrc}
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
          src={`${ASSET_ROOT}/chip-frames/frame-076.webp`}
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
                    src={`${ASSET_ROOT}/icons/${feature.icon}`}
                    alt=""
                  />
                </span>
                <span className="chip-feature-line" />
              </div>
              <div className="chip-feature-copy">
                <h2>{feature.title}</h2>
                <p>{feature.description}</p>
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
  const chipRef = useRef(null);
  const marqueeRef = useRef(null);
  const chipVideoRef = useRef(null);
  const chipFrameRef = useRef(null);

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
      const viewportHeight = window.innerHeight;
      const lineStep = isMobile ? 160 : 280;
      const centerTop = isMobile
        ? viewportHeight / 2 - 89
        : viewportHeight / 2 - 48;
      const linePosition = currentTimeline - 1;

      scene.style.setProperty("--curtain-y", `${curtainOffset}%`);
      roulette.style.setProperty("--curtain-clip", `${curtainOffset}%`);
      roulette.style.setProperty("--roulette-reveal", currentReveal);

      const buttonProgress = isMobile ? 1 : currentButtonReveal;
      const buttonOffset = isMobile
        ? 0
        : -96 * (1 - buttonProgress);
      const chipTransitionIsActive =
        scene.dataset.chipTransitionActive === "true";
      rouletteButton.style.transform =
        `translate3d(${isMobile ? "-50%" : "0"}, ${buttonOffset.toFixed(2)}px, 0)`;
      rouletteButton.style.pointerEvents =
        buttonProgress > 0.98 ? "auto" : "none";

      if (isMobile && !chipTransitionIsActive) {
        const curtainTop = (1 - currentCurtain) * viewportHeight;
        const buttonTop = viewportHeight - 74;
        const buttonSplit = clamp(
          (curtainTop - buttonTop) / 50,
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
              top: viewportHeight / 2 + 231,
              fontSize: 48,
              lineHeight: 48,
              opacity: 0,
            },
            {
              at: 6,
              top: viewportHeight / 2 + 71,
              fontSize: 52,
              lineHeight: 52,
              opacity: 0.2,
            },
            {
              at: 7,
              top: viewportHeight / 2 - 89,
              fontSize: 56,
              lineHeight: 56,
              opacity: 0.35,
            },
            {
              at: 8,
              top: viewportHeight / 2 - 249,
              fontSize: 64,
              lineHeight: 64,
              opacity: 0.5,
            },
            {
              at: 9,
              top: viewportHeight / 2 - 409,
              fontSize: 64,
              lineHeight: 64,
              opacity: 1,
            },
            {
              at: 9.8,
              top: -105,
              fontSize: 64,
              lineHeight: 64,
              opacity: 0.08,
            },
            {
              at: 10,
              top: -120,
              fontSize: 64,
              lineHeight: 64,
              opacity: 0,
            },
          ]
        : [
            {
              at: 5,
              top: viewportHeight / 2 + 512,
              fontSize: 90,
              lineHeight: 72,
              opacity: 0,
            },
            {
              at: 6,
              top: viewportHeight / 2 + 232,
              fontSize: 120,
              lineHeight: 96,
              opacity: 0.2,
            },
            {
              at: 7,
              top: viewportHeight / 2 - 48,
              fontSize: 150,
              lineHeight: 120,
              opacity: 0.35,
            },
            {
              at: 8,
              top: viewportHeight / 2 - 164,
              fontSize: 180,
              lineHeight: 140,
              opacity: 0.5,
            },
            {
              at: 9,
              top: viewportHeight / 2 - 270,
              fontSize: 220,
              lineHeight: 180,
              opacity: 1,
            },
            {
              at: 9.8,
              top: -410,
              fontSize: 220,
              lineHeight: 180,
              opacity: 0.08,
            },
            {
              at: 10,
              top: -470,
              fontSize: 220,
              lineHeight: 180,
              opacity: 0,
            },
          ];
      const finaleFrame = sampleKeyframes(
        finaleFrames,
        currentTimeline,
      );
      const finaleBaseFontSize = isMobile ? 64 : 220;
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
    const chip = chipRef.current;
    const marquee = marqueeRef.current;
    const video = chipVideoRef.current;
    const frame = chipFrameRef.current;
    if (!scene || !chip || !marquee || !video || !frame) {
      return undefined;
    }

    const layer = scene.querySelector(".chip-reveal-layer");
    const gradient = scene.querySelector(".chip-gradient");
    const button = scene.querySelector(".roulette-button");
    const buttonLabel = scene.querySelector(".roulette-button-label");
    const bottomFade = scene.querySelector(".roulette-bottom-fade");
    const featureElements = Array.from(
      scene.querySelectorAll(".chip-feature"),
    );
    if (
      !layer ||
      !gradient ||
      !button ||
      !buttonLabel ||
      !bottomFade ||
      featureElements.length !== CHIP_FEATURES.length
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
    const mix = (from, to, progress) => from + (to - from) * progress;
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
    let videoDuration = 6;
    let pendingVideoTime = null;
    let currentFrameIndex = CHIP_START_FRAME_INDEX;
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

    const setFeatureProgress = (element, enter, exit, isMobile) => {
      const opacity = enter * (1 - exit);
      const translateY = mix(6, 0, enter) - exit * 4;
      const blur = mix(2, 0, enter);
      element.style.opacity = opacity.toFixed(4);
      element.style.transform =
        `translate3d(${isMobile ? "-50%" : "0"}, ` +
        `${translateY.toFixed(2)}px, 0)`;
      element.style.filter = `blur(${blur.toFixed(2)}px)`;
      element.style.setProperty(
        "--feature-line-progress",
        Math.min(enter * 1.18, 1).toFixed(4),
      );
    };

    const renderScene = () => {
      const isMobile = window.matchMedia("(max-width: 700px)").matches;
      const shutterInset = (1 - currentReveal) * 50;
      const chipStartY = isMobile
        ? window.innerHeight * 0.66
        : window.innerHeight * 0.72;
      const chipEndY = isMobile
        ? 47
        : 0;
      const chipY = mix(chipStartY, chipEndY, currentChip);
      const chipScale = mix(isMobile ? 0.84 : 0.88, 1, currentChip);
      const buttonIsInverted = currentReveal >= 0.95;
      const buttonBackground = buttonIsInverted ? "#fff" : "#fa5f05";
      const buttonColor = buttonIsInverted ? "#fa5f05" : "#fff";
      const marqueeTravel =
        (window.innerWidth + marquee.offsetWidth) / 2;
      const marqueeOffset = mix(
        marqueeTravel,
        -marqueeTravel,
        currentMarquee,
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
      chip.style.transform =
        `translate3d(-50%, calc(-50% + ${chipY.toFixed(2)}px), 0) ` +
        `scale(${chipScale.toFixed(5)})`;
      const videoOpacity = smoothstep(0, 0.045, currentVideo);
      chip.style.opacity = (1 - videoOpacity).toFixed(4);
      video.style.opacity = useFrameSequence
        ? "0"
        : videoOpacity.toFixed(4);
      frame.style.opacity = useFrameSequence
        ? videoOpacity.toFixed(4)
        : "0";
      video.style.transform =
        `translate3d(-50%, calc(-50% + ${chipY.toFixed(2)}px), 0) ` +
        `scale(${chipScale.toFixed(5)})`;
      frame.style.transform = video.style.transform;
      marquee.style.setProperty(
        "--advantages-text-x",
        `${marqueeOffset.toFixed(2)}px`,
      );

      if (useFrameSequence && currentVideo > 0.0001) {
        const frameAdvance = Math.round(
          clamp(currentVideo) * CHIP_FRAME_COUNT,
        );
        const nextFrameIndex =
          (CHIP_START_FRAME_INDEX + frameAdvance) %
          CHIP_FRAME_COUNT;
        if (nextFrameIndex !== currentFrameIndex) {
          currentFrameIndex = nextFrameIndex;
          frame.src = frameUrls[currentFrameIndex];
        }
      } else if (video.readyState >= 1 && currentVideo > 0.0001) {
        const loopProgress =
          (CHIP_START_FRAME_INDEX / CHIP_FRAME_COUNT +
            clamp(currentVideo)) %
          1;
        pendingVideoTime = loopProgress * videoDuration;
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
        const enter = smoothstep(start, start + 0.052, currentVideo);
        const exit = smoothstep(end - 0.052, end, currentVideo);
        setFeatureProgress(element, enter, exit, isMobile);
      });

      if (transitionIsActive) {
        button.style.background = buttonBackground;
        button.style.backgroundColor = buttonBackground;
        button.style.color = buttonColor;
        buttonLabel.style.background = "none";
        buttonLabel.style.color = buttonColor;
        buttonLabel.style.webkitTextFillColor = buttonColor;
        bottomFade.style.opacity =
          isMobile && !buttonIsInverted ? "1" : "0";
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

      renderScene();

      if (
        currentReveal !== targetReveal ||
        currentChip !== targetChip ||
        currentMarquee !== targetMarquee ||
        marqueeVelocity !== 0 ||
        currentVideo !== targetVideo ||
        videoVelocity !== 0
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
      const videoStart = Math.min(
        viewportHeight * 12.0,
        scrollRange - 1,
      );
      const videoEnd = Math.max(
        Math.min(viewportHeight * 20.0, scrollRange),
        videoStart + 1,
      );

      targetReveal = smoothstep(0, 0.7, progress);
      targetChip = smoothstep(0.04, 0.68, progress);
      targetMarquee = clamp(
        (scrollOffset - marqueeStart) /
          (marqueeEnd - marqueeStart),
      );
      targetVideo = smoothstep(
        0,
        1,
        clamp(
          (scrollOffset - videoStart) /
            (videoEnd - videoStart),
        ),
      );

      if (reducedMotion) {
        currentReveal = targetReveal;
        currentChip = targetChip;
        currentMarquee = targetMarquee;
        marqueeVelocity = 0;
        currentVideo = targetVideo;
        videoVelocity = 0;
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
            chipRef={chipRef}
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
