import { clamp, mix, smoothstep, cubicBezierValue, mixRgb } from './math.js';
import { STORY_BENEFITS } from '../data/story.js';
import { storyComposition, STORY_ENTER_END, STORY_EXIT_START } from './storyComposition.js';
import { featureReadingProgress, featureWindow } from './featureReading.js';
import { TRACKS } from './timing.js';
import { chipZoomFrame } from './chipZoom.js';

export function createChipStoryRenderer(scene, media) {
  const select = selector => scene.querySelector(selector);
  const layer = select('.chip-reveal-layer'), gradient = select('.chip-gradient');
  const backgroundTransition = select('.chip-background-transition');
  const marquee = select('.advantages-marquee'), definitionMarquee = select('.esim-definition-marquee');
  const video = select('.chip-scroll-video'), frame = select('.chip-scroll-frame');
  const mediaWrapper = select('.chip-media-wrapper');
  const button = select('.roulette-button'), buttonLabel = select('.roulette-button-label');
  const bottomFade = select('.roulette-bottom-fade'), safetyCopy = select('.safety-copy');
  const heroSurface = select('.hero-surface');
  const featureElements = [...scene.querySelectorAll('.chip-feature')];
  const storyElements = [...scene.querySelectorAll('.story-benefit')];
  const safetyCharacters = [...scene.querySelectorAll('.safety-character')];
  const safetyText = safetyCharacters.map(character => character.textContent).join('');
  // Start grey below the viewport; fill half the first line during its entrance.
  const safetyEntranceFillStart = .5;
  const safetyEntranceFillEnd = .065;
  const safetyFillEnd = .9;
  const lostPhraseEnd = safetyText.indexOf('потерять') + 'потерять'.length - 1;
  const buttonExitStart = 0.9 * (lostPhraseEnd / Math.max(safetyCharacters.length - 1, 1) + 0.025);
  const textMotionCache = new Map(featureElements.map(element => [element, {
    icon: element.querySelector('.chip-feature-icon-motion'), units: [...element.querySelectorAll('.soft-blur-unit')],
  }]));
  storyElements.forEach(element => textMotionCache.set(element, {
    icon: null, units: [...element.querySelectorAll('.soft-blur-unit')], story: true,
  }));
  let geometry, reduced;
  let preludeLayout;
  let measuredLayout;
  let measurements;
  const setButtonPalette = (background, color) => {
    if (geometry.mobile) {
      // Keep the same clipped label throughout the curtain and chip scenes.
      // Switching from transparent gradient text to solid text started a CSS
      // colour transition from alpha 0, making the existing button blink.
      button.style.removeProperty('background');
      button.style.removeProperty('color');
      buttonLabel.style.removeProperty('background');
      buttonLabel.style.removeProperty('color');
      buttonLabel.style.removeProperty('-webkit-text-fill-color');
      button.style.setProperty('--button-background', background);
      button.style.setProperty('--button-color', color);
    } else {
      button.style.background = background;
      button.style.color = color;
      buttonLabel.style.background = 'none';
      buttonLabel.style.color = color;
      buttonLabel.style.webkitTextFillColor = color;
    }
  };
  const renderControls = state => {
    const { reveal, background, story, safety, returnGradient, outro } = state;
    const isMobile = geometry.mobile;
    const layoutScale = geometry.scale;
    const transitionIsActive = reveal > 0.0001;
    const buttonProgress = isMobile ? 1 : state.buttonReveal;
    const buttonOffset = isMobile ? 0 : -96 * layoutScale * (1 - buttonProgress);
    button.style.transform = 'translate3d(' + (isMobile ? '-50%' : '0') + ', ' + buttonOffset + 'px, 0)';
    const buttonVisibility = 1 - smoothstep(buttonExitStart, buttonExitStart + 0.04, clamp(safety));
    const interactive = buttonProgress > 0.98 && buttonVisibility > 0.99 && clamp(outro) < 0.01;
    button.inert = !interactive;
    button.tabIndex = interactive ? 0 : -1;
    button.style.pointerEvents = interactive ? 'auto' : 'none';
    const heroCovered = state.curtain > 0.01;
    if (heroSurface.inert !== heroCovered) {
      heroSurface.inert = heroCovered;
    }
    if (!transitionIsActive) {
      if (isMobile) {
        const curtainTop = (1 - state.curtain) * geometry.height;
        const buttonHeight = 50 * layoutScale;
        const buttonTop = geometry.height - 24 * layoutScale - buttonHeight;
        const split = clamp((curtainTop - buttonTop) / buttonHeight);
        setButtonPalette('#fa5f05', '#fff');
        button.style.setProperty('--button-curtain-split', (split * 100) + '%');
        bottomFade.style.opacity = state.curtain;
      } else {
        setButtonPalette('#fa5f05', '#fff');
        bottomFade.style.opacity = '0';
      }
      button.style.opacity = '1';
    } else {
      // Interpolate the palette itself: mobile uses clipped gradients whose
      // custom colours cannot be eased by a background-color transition.
      const whiteAmount = returnGradient > 0
        ? clamp(returnGradient)
        : smoothstep(.65, .95, reveal) * (1 - clamp(background));
      const buttonBackground = mixRgb([250, 95, 5], [255, 255, 255], whiteAmount);
      // A complementary white/orange blend hides the label halfway through.
      // Pass through dark orange so the text remains distinct from the fill.
      const buttonColor = whiteAmount <= .5
        ? mixRgb([255, 255, 255], [90, 35, 2], smoothstep(0, .5, whiteAmount))
        : mixRgb([90, 35, 2], [250, 95, 5], smoothstep(.5, 1, whiteAmount));
      setButtonPalette(buttonBackground, buttonColor);
      if (isMobile) button.style.setProperty('--button-curtain-split', '0%');
      const fade = returnGradient > 0 ? 1 - returnGradient
        : story > 0.0001 ? 1 : 1 - smoothstep(.65, .95, reveal);
      bottomFade.style.opacity = isMobile ? fade * (1 - clamp(outro)) * buttonVisibility : 0;
      button.style.opacity = (1 - clamp(outro)) * buttonVisibility;
    }
  };
    const setSoftBlurProgress = (
      element,
      start,
      end,
      progress,
      enterEnd = 0.38,
      exitStart = 0.68,
    ) => {
      const { icon, units, story } = textMotionCache.get(element);

      const localProgress = clamp(
        (progress - start) / Math.max(end - start, 0.0001),
      );
      const enterProgress = clamp(localProgress / enterEnd);
      const exitProgress = clamp((localProgress - exitStart) / (1 - exitStart));
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
          !story && unit.closest("p") ? 6 : 12,
        );
      });
    };


  return (state, layout, reduceMotion) => {
    geometry = layout; reduced = reduceMotion;
    const { reveal: currentReveal, chip: currentChip, marquee: currentMarquee, features: currentVideo, playback: currentPlayback, definition: currentDefinition, definitionVisibility: currentDefinitionVisibility, background: currentBackground, story: currentStory, safety: currentSafety, returnGradient: currentReturnGradient, outro: currentOutro } = state;
    const layoutKey = `${geometry.width}:${geometry.height}:${geometry.scale}:${reduced}`;
    const prelude = currentReveal === 0 && currentOutro === 0;
    if (!measurements || measuredLayout !== layoutKey) {
      // These dimensions only change with the viewport or fonts. Reading them
      // after hundreds of per-frame style writes forced layout on iOS Safari.
      measurements = {
        chipHeight: Math.max(video.offsetHeight, frame.offsetHeight),
        chipWidth: mediaWrapper.offsetWidth,
        safetyTop: safetyCopy.offsetTop,
        safetyHeight: safetyCopy.offsetHeight,
        marqueeWidth: marquee.offsetWidth,
        definitionWidth: definitionMarquee.offsetWidth,
      };
      measuredLayout = layoutKey;
    }
    renderControls(state);
    // During the curtain only the controls change. Initialize/reset hidden
    // chip content once; don't read its layout and rewrite every blur unit on
    // every frame of the opening scroll. Re-entering the prelude resets it.
    if (prelude && preludeLayout === layoutKey) return;
    preludeLayout = prelude ? layoutKey : undefined;
    const playbackEndTurns = TRACKS.playback[2];
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
      const zoomProgress = reduced ? 0 : clamp(state.chipZoom ?? 0);
      const zoomFrame = reduced ? { scale: 1, y: isMobile ? 47 : 0 } : chipZoomFrame(zoomProgress, currentSafety, isMobile);
      const displayedScale = chipScale * zoomFrame.scale;
      const displayedY = chipY + (zoomFrame.y - (isMobile ? 47 : 0)) * layoutScale;
      const composition = storyComposition(currentStory, STORY_BENEFITS.length, reduced, state.storyCenter);
      const storyX = isMobile ? 0 : geometry.width * .20 * (state.storySide ?? composition.side);
      gradient.style.setProperty('--chip-story-presence', composition.presence.toFixed(4));
      gradient.dataset.storyActive = String(composition.presence > 0 && !reduced);
      const safetyTextProgress = clamp(currentSafety);
      const safetyGap = (isMobile ? 60 : 101) * layoutScale;
      const safetyExitMargin = (isMobile ? 24 : 40) * layoutScale;
      const chipRenderedHeight = measurements.chipHeight * displayedScale;
      // The resting frame's opaque chip spans y=45..609 in its 640px canvas.
      // Align desktop copy to that object's centre, excluding transparent padding.
      gradient.style.setProperty('--chip-story-center-y', `${(chipY + chipRenderedHeight * (7 / 640)).toFixed(2)}px`);
      const safetyStartOffset =
        geometry.height / 2 +
        displayedY +
        chipRenderedHeight / 2 +
        safetyGap -
        measurements.safetyTop;
      // Bring the copy in from below while the first zoom lifts the chip.
      // Its gap continues following the chip during the later safety track.
      const safetyEntranceOffset = reduced ? 0 :
        Math.max(0, geometry.height - measurements.safetyTop - safetyStartOffset) *
        (1 - smoothstep(0, 1, zoomProgress));
      const safetyTravel =
        measurements.safetyTop +
        safetyStartOffset +
        measurements.safetyHeight +
        safetyExitMargin;
      const safetyExitProgress = reduced ? safetyTextProgress : clamp((safetyTextProgress - .42) / .58);
      const safetyChipExit = -safetyTravel * safetyExitProgress;
      const grayStageOpacity = clamp(
        currentBackground * (1 - currentReturnGradient),
      );
      const buttonIsInverted = currentReveal >= 0.95;
      const marqueeTravel =
        (geometry.width + measurements.marqueeWidth) / 2;
      const marqueeOffset = mix(
        marqueeTravel,
        -marqueeTravel,
        currentMarquee,
      );
      const definitionStartX = (isMobile ? 495 : 885) * layoutScale;
      const definitionEndX =
        -(geometry.width + measurements.definitionWidth) / 2 -
        24 * layoutScale;
      const definitionOffset = mix(
        definitionStartX,
        definitionEndX,
        currentDefinition,
      );

      const transitionIsActive = currentReveal > 0.0001;
      const revealing = !reduced && transitionIsActive && currentReveal < 0.9999;
      if (gradient.dataset.revealing !== String(revealing)) gradient.dataset.revealing = String(revealing);
      scene.dataset.chipTransitionActive = transitionIsActive ? 'true' : 'false';
      scene.dataset.chipButtonInverted = buttonIsInverted
        ? "true"
        : "false";
      layer.style.visibility = transitionIsActive ? "visible" : "hidden";
      const gradientClip =
        `inset(0 ${shutterInset.toFixed(4)}% 0 ` +
        `${shutterInset.toFixed(4)}%)`;
      gradient.style.clipPath = currentReveal >= 0.9999 || reduced ? 'none' : gradientClip;
      gradient.style.webkitClipPath = gradient.style.clipPath;
      backgroundTransition.style.opacity =
        grayStageOpacity.toFixed(4);
      mediaWrapper.style.transform =
        `translate3d(calc(-50% + ${storyX.toFixed(2)}px), calc(-50% + ${(displayedY + safetyChipExit).toFixed(2)}px), 0) ` +
        `scale(${displayedScale.toFixed(5)})`;
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
      const featureProgress = featureReadingProgress(currentVideo, isMobile);
      const completedFeatureSequence = smoothstep(
        0.97,
        1,
        featureProgress,
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
        setSoftBlurProgress(element, index, index + 1, storyTimeline, STORY_ENTER_END, STORY_EXIT_START);
        // The words own the effect; the paragraph stays sharp and stationary.
        element.style.opacity = storyTimeline > index && storyTimeline < index + 1 ? '1.0000' : '0.0000';
      });

      const entranceReveal = mix(-.025, safetyEntranceFillEnd,
        clamp((zoomProgress - safetyEntranceFillStart) / (1 - safetyEntranceFillStart)));
      const safetyReveal = reduced ? clamp(safetyTextProgress / safetyFillEnd)
        : mix(entranceReveal, 1, clamp(safetyTextProgress / safetyFillEnd));
      safetyCopy.style.visibility =
        (zoomProgress > 0.0001 || safetyTextProgress > 0.0001) && safetyTextProgress < 0.9999
          ? "visible"
          : "hidden";
      safetyCopy.style.transform =
        `translate3d(-50%, ${(safetyStartOffset + safetyEntranceOffset - safetyTravel * safetyExitProgress).toFixed(2)}px, 0)`;
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
      if (currentDefinition >= .9 || currentStory > 0) media.prepareStill?.();
      media.setZoomQuality?.({ width: measurements.chipWidth * displayedScale,
        scale: displayedScale, dpr: geometry.dpr ?? 1, zoom: zoomProgress, safety: safetyTextProgress });

      featureElements.forEach((element, index) => {
        const { start, end } = featureWindow(index, isMobile);
        setSoftBlurProgress(
          element,
          start,
          end,
          featureProgress,
        );
      });

      if (reduced) {
        gradient.style.clipPath = 'none';
        marquee.style.setProperty('--advantages-text-x', '0px');
        definitionMarquee.style.setProperty('--definition-text-x', '0px');
      }

  };
}
