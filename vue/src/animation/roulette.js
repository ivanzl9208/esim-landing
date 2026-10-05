import { mix, smoothstep, sampleKeyframes } from './math.js';
import { curtainOffset } from './curtain.js';
import { heroRevealFrame, rouletteProgressAt } from './heroReveal.js';
import { TRACKS } from './timing.js';

// Finish the text exit exactly where the next curtain starts, on the
// same scroll playhead. Reverse scrolling closes the curtain before text returns.
const finaleExitPhases = [false, true].map(mobile => rouletteProgressAt(TRACKS.reveal[0], mobile));

// Preserve the entrance keyframes; GSAP owns timing and scrub.
export function createRouletteRenderer(scene) {
  const curtain = scene.querySelector('.white-curtain');
  const rouletteViewport = scene.querySelector('.roulette-viewport');
  const roulette = scene.querySelector('.roulette-stage');
  const rouletteLines = [...roulette.querySelectorAll('.roulette-line')];
  const rouletteFinale = roulette.querySelector('.roulette-finale');
  return (state, geometry, reduced) => {
    const { curtain: currentCurtain, roulette: currentTimeline, rouletteReveal: currentReveal } = state;
      const offset = curtainOffset(currentCurtain);
      const isMobile = geometry.mobile;
      const finaleExitAt = finaleExitPhases[Number(isMobile)];
      const layoutScale = geometry.scale;
      const viewportHeight = geometry.height;
      // Desktop glyphs extend beyond the 180px line boxes at a 220px font size.
      const finaleExitTop = -(isMobile ? 192 + 16 : 540 + 40 + 16) * layoutScale;
      const lineStep = (isMobile ? 160 : 280) * layoutScale;
      const centerTop = isMobile
        ? viewportHeight / 2 - 89 * layoutScale
        : viewportHeight / 2 - 48 * layoutScale;
      const linePosition = currentTimeline - 1;
      // The preceding line remains inside tall phone viewports at the finale.
      // Finish its fade as the finale becomes legible, using the same reversible phase.
      const precedingOpacity = isMobile ? 1 - smoothstep(6, 6.8, currentTimeline) : 1;

      // This value belongs to the moving leaf, not the whole story subtree.
      curtain.style.setProperty("--curtain-y", `${offset}%`);
      rouletteViewport.style.setProperty("--curtain-y", `${offset}%`);
      roulette.style.setProperty("--roulette-reveal", currentReveal);

      rouletteLines.forEach((line, index) => {
        const slot = index - linePosition;
        const centerDistance = Math.abs(slot);
        let y = centerTop + slot * lineStep;
        const fadeStrength = slot >= 0 ? 1.609 : 2.996;
        const depthOpacity = Math.exp(
          -fadeStrength * centerDistance * centerDistance,
        );
        let opacity = depthOpacity;

        if (currentTimeline <= 1) {
          const introProgress = smoothstep(0, 1, currentTimeline);

          if (index === 0) {
            const intro = heroRevealFrame(currentTimeline, centerTop + lineStep, centerTop);
            opacity = intro.opacity;
            y = intro.y;
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
        line.style.opacity = (opacity * precedingOpacity).toFixed(4);
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
              at: 6.8,
              top: viewportHeight / 2 - 57 * layoutScale,
              fontSize: 55.2 * layoutScale,
              lineHeight: 55.2 * layoutScale,
              opacity: 1,
            },
            {
              at: 7,
              top: viewportHeight / 2 - 89 * layoutScale,
              fontSize: 56 * layoutScale,
              lineHeight: 56 * layoutScale,
              opacity: 1,
            },
            {
              at: 8,
              top: viewportHeight / 2 - 249 * layoutScale,
              fontSize: 64 * layoutScale,
              lineHeight: 64 * layoutScale,
              opacity: 1,
            },
            {
              at: 9,
              top: Math.max(viewportHeight / 2 - 409 * layoutScale, finaleExitTop),
              fontSize: 64 * layoutScale,
              lineHeight: 64 * layoutScale,
              opacity: 1,
            },
            {
              at: finaleExitAt,
              top: finaleExitTop,
              fontSize: 64 * layoutScale,
              lineHeight: 64 * layoutScale,
              opacity: 1,
            },
            {
              at: 10,
              top: finaleExitTop,
              fontSize: 64 * layoutScale,
              lineHeight: 64 * layoutScale,
              opacity: 1,
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
              top: Math.max(viewportHeight / 2 - 270 * layoutScale, finaleExitTop),
              fontSize: 220 * layoutScale,
              lineHeight: 180 * layoutScale,
              opacity: 1,
            },
            {
              at: finaleExitAt,
              top: finaleExitTop,
              fontSize: 220 * layoutScale,
              lineHeight: 180 * layoutScale,
              opacity: 1,
            },
            {
              at: 10,
              top: finaleExitTop,
              fontSize: 220 * layoutScale,
              lineHeight: 180 * layoutScale,
              opacity: 1,
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
    rouletteViewport.style.transform = reduced ? 'none' : '';
    roulette.style.transform = reduced ? 'none' : '';
    curtain.style.opacity = reduced ? (currentCurtain >= 0.8 ? '1' : '0') : '';
    curtain.style.transform = reduced ? 'none' : '';
    if (reduced) {
      rouletteLines.forEach((line, index) => {
        line.style.opacity = currentTimeline < 6 && index === Math.round(Math.max(0, currentTimeline - 1)) ? '1' : '0';
        line.style.transform = 'translate(-50%, ' + centerTop + 'px)';
      });
      rouletteFinale.style.opacity = currentTimeline >= 6 && currentTimeline < finaleExitAt ? '1' : '0';
      rouletteFinale.style.top = '30%';
      rouletteFinale.style.transform = 'translateX(-50%) scale(0.7)';
    }
  };
}
