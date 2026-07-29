import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const ASSET_ROOT = `${import.meta.env.BASE_URL}assets`;
const ROULETTE_LINES = [
  "eSIM —",
  "виртуальная",
  "сим-карта:",
  "звонки,",
  "интернет",
  "и смс —",
];

function BrandLogo() {
  return (
    <img
      className="brand-logo"
      src={`${ASSET_ROOT}/sbermobile-logo.svg`}
      alt="СберМобайл — выгоднее с Прайм"
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
        <span>Услуги и сервисы</span>
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
  return (
    <video
      className="hero-video"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-label="Анимация eSIM"
    >
      <source src={`${ASSET_ROOT}/hero.webm`} type="video/webm" />
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
        всё как <br className="finale-desktop-break" />
        у обычной
        <br />
        сим-карты
      </div>
    </div>
  );
}

function App() {
  const sceneRef = useRef(null);
  const rouletteRef = useRef(null);

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
        sceneScrollEnd - viewportHeight * 0.35,
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
        clamp((scrollOffset - rouletteStart) / rouletteRange) * 9;

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
      rouletteButton.style.transform =
        `translate3d(${isMobile ? "-50%" : "0"}, ${buttonOffset.toFixed(2)}px, 0)`;
      rouletteButton.style.pointerEvents =
        buttonProgress > 0.98 ? "auto" : "none";

      if (isMobile) {
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
      } else {
        rouletteButton.style.backgroundColor = "#fa5f05";
        rouletteButton.style.color = "#fff";
        rouletteBottomFade.style.opacity = "0";
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
              top: viewportHeight / 2 - 53,
              fontSize: 56,
              lineHeight: 56,
              opacity: 0.35,
            },
            {
              at: 8,
              top: viewportHeight / 2 - 56,
              fontSize: 64,
              lineHeight: 64,
              opacity: 0.5,
            },
            {
              at: 9,
              top: viewportHeight / 2 - 133,
              fontSize: 64,
              lineHeight: 64,
              opacity: 1,
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
          ];
      const finaleFrame = sampleKeyframes(
        finaleFrames,
        currentTimeline,
      );

      rouletteFinale.style.top = `${finaleFrame.top}px`;
      rouletteFinale.style.fontSize = `${finaleFrame.fontSize}px`;
      rouletteFinale.style.lineHeight = `${finaleFrame.lineHeight}px`;
      rouletteFinale.style.letterSpacing =
        `${(-finaleFrame.fontSize * 0.02).toFixed(2)}px`;
      rouletteFinale.style.opacity = finaleFrame.opacity.toFixed(4);
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
          <RouletteStage stageRef={rouletteRef} />
          <div className="roulette-bottom-fade" aria-hidden="true">
            <span className="roulette-bottom-blur-layer" />
            <span className="roulette-bottom-blur-layer" />
            <span className="roulette-bottom-blur-layer" />
            <span className="roulette-bottom-blur-layer" />
          </div>
          <button className="roulette-button" type="button">
            <span className="roulette-button-label">
              Подключить eSIM
            </span>
          </button>
        </section>
      </div>

      <section className="next-section" aria-label="Следующий раздел" />
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
