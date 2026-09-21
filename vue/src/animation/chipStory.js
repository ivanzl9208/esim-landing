import { clamp, mix, smoothstep, cubicBezierValue, mixRgb } from './math.js';
import { STORY_BENEFITS } from '../data/story.js';
import { desktopStoryFrame } from './storyFocus.js';

export function createChipStoryRenderer(scene, media) {
  const select = selector => scene.querySelector(selector);
  const layer = select('.chip-reveal-layer'), gradient = select('.chip-gradient');
  const backgroundTransition = select('.chip-background-transition');
  const marquee = select('.advantages-marquee'), definitionMarquee = select('.esim-definition-marquee');
  const video = select('.chip-scroll-video'), frame = select('.chip-scroll-frame');
  const button = select('.roulette-button'), buttonLabel = select('.roulette-button-label');
  const bottomFade = select('.roulette-bottom-fade'), safetyCopy = select('.safety-copy');
  const checker = select('.device-checker');
  const heroSurface = select('.hero-surface');
  const featureElements = [...scene.querySelectorAll('.chip-feature')];
  const storyElements = [...scene.querySelectorAll('.story-benefit')];
  const safetyCharacters = [...scene.querySelectorAll('.safety-character')];
  const featureCache = new Map(featureElements.map(element => [element, {
    icon: element.querySelector('.chip-feature-icon-motion'), units: [...element.querySelectorAll('.soft-blur-unit')],
  }]));
  let geometry, reduced;
    const setFeatureProgress = (
      element,
      start,
      end,
      progress,
    ) => {
      const { icon, units } = featureCache.get(element);

      const localProgress = clamp(
        (progress - start) / Math.max(end - start, 0.0001),
      );
      const enterProgress = clamp(localProgress / 0.38);
      const exitProgress = clamp((localProgress - 0.68) / 0.32);
      const unitCount = Math.max(units.length, 1);
      const layoutScale = geometry.scale;

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
        const blur = reduced ? 0 : isExiting
          ? blurDistance * exit
          : blurDistance * (1 - enter);
        const y = reduced ? 0 : isExiting
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


  return (state, layout, reduceMotion) => {
    geometry = layout; reduced = reduceMotion;
    const { reveal: currentReveal, chip: currentChip, marquee: currentMarquee, features: currentVideo, playback: currentPlayback, definition: currentDefinition, definitionVisibility: currentDefinitionVisibility, background: currentBackground, story: currentStory, safety: currentSafety, returnGradient: currentReturnGradient, checker: currentChecker } = state;
    const playbackEndTurns = 2;
      const isMobile = geometry.mobile;
      const layoutScale = geometry.scale;
      const shutterInset = (1 - currentReveal) * 50;
      const chipStartY = isMobile
        ? geometry.height * 0.66
        : geometry.height * 0.72;
      const chipEndY = isMobile
        ? 47 * layoutScale
        : 0;
      const chipY = reduced ? chipEndY : mix(chipStartY, chipEndY, currentChip);
      const chipScale = reduced ? 1 : mix(isMobile ? 0.84 : 0.88, 1, currentChip);
      const safetyTextProgress = clamp(currentSafety);
      const safetyGap = (isMobile ? 60 : 101) * layoutScale;
      const safetyExitMargin = (isMobile ? 24 : 40) * layoutScale;
      const chipRenderedHeight =
        Math.max(video.offsetHeight, frame.offsetHeight) * chipScale;
      const safetyStartOffset =
        geometry.height / 2 +
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
        (geometry.width + marquee.offsetWidth) / 2;
      const marqueeOffset = mix(
        marqueeTravel,
        -marqueeTravel,
        currentMarquee,
      );
      const definitionStartX = (isMobile ? 495 : 885) * layoutScale;
      const definitionEndX =
        -(geometry.width + definitionMarquee.offsetWidth) / 2 -
        24 * layoutScale;
      const definitionOffset = mix(
        definitionStartX,
        definitionEndX,
        currentDefinition,
      );

      const transitionIsActive = currentReveal > 0.0001;
      const checkerReveal = clamp(currentChecker);
      const checkerOffset = (1 - checkerReveal) *
        (geometry.height + 48 * layoutScale);
      scene.dataset.chipTransitionActive = transitionIsActive
        ? "true"
        : "false";
      scene.dataset.checkerVisible = checkerReveal > 0.001
        ? "true"
        : "false";
      scene.dataset.checkerInteractive = checkerReveal > 0.96
        ? "true"
        : "false";
      scene.style.setProperty(
        "--checker-y",
        `${checkerOffset.toFixed(2)}px`,
      );
      checker.inert = checkerReveal <= 0.96 || state.resultCurtain >= 0.999;
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
        if (!isMobile) {
          const frame = desktopStoryFrame(currentStory, index);
          element.style.opacity = frame.opacity.toFixed(4);
          element.style.filter = `blur(${frame.blur.toFixed(3)}px)`;
          return;
        }
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

      media.setPlayback(currentPlayback, playbackEndTurns);

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

      const buttonProgress = isMobile ? 1 : state.buttonReveal;
      const buttonOffset = isMobile ? 0 : -96 * layoutScale * (1 - buttonProgress);
      button.style.transform = 'translate3d(' + (isMobile ? '-50%' : '0') + ', ' + buttonOffset + 'px, 0)';
      const interactive = buttonProgress > 0.98 && checkerReveal < 0.01;
      button.inert = !interactive;
      button.tabIndex = interactive ? 0 : -1;
      button.style.pointerEvents = interactive ? 'auto' : 'none';
      const heroCovered = state.curtain > 0.01;
      if (heroSurface.inert !== heroCovered) {
        heroSurface.inert = heroCovered;
        heroSurface.querySelector('.hero-video')?.dispatchEvent(new Event('scenevisibilitychange'));
      }
      if (!transitionIsActive) {
        if (isMobile) {
          const curtainTop = (1 - state.curtain) * geometry.height;
          const buttonHeight = 50 * layoutScale;
          const buttonTop = geometry.height - 24 * layoutScale - buttonHeight;
          const split = clamp((curtainTop - buttonTop) / buttonHeight);
          button.style.removeProperty('background');
          button.style.removeProperty('color');
          buttonLabel.style.removeProperty('background');
          buttonLabel.style.removeProperty('color');
          buttonLabel.style.removeProperty('-webkit-text-fill-color');
          button.style.setProperty('--button-curtain-split', (split * 100) + '%');
          bottomFade.style.opacity = state.curtain;
        } else {
          button.style.background = '#fa5f05';
          button.style.color = '#fff';
          bottomFade.style.opacity = '0';
        }
        button.style.opacity = '1';
      } else {
        button.style.background = buttonBackground;
        button.style.color = buttonColor;
        buttonLabel.style.background = 'none';
        buttonLabel.style.color = buttonColor;
        buttonLabel.style.webkitTextFillColor = buttonColor;
        const fade = currentReturnGradient > 0 ? 1 - currentReturnGradient : !buttonIsInverted || currentStory > 0.0001 ? 1 : 0;
        bottomFade.style.opacity = isMobile ? fade * (1 - checkerReveal) : 0;
        button.style.opacity = 1 - checkerReveal;
      }
      if (reduced) {
        gradient.style.clipPath = 'none';
        marquee.style.setProperty('--advantages-text-x', '0px');
        definitionMarquee.style.setProperty('--definition-text-x', '0px');
        storyElements.forEach(element => { element.style.filter = 'none'; });
      }

  };
}
