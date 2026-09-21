import { curtainTrack, RESULT_CURTAIN_START } from './curtain.js';
import { ROULETTE_TRACK, heroRevealTrack } from './heroReveal.js';

// All positions are viewport-height multiples measured from the scene top.
// Overlap is intentional: safety, background return, and checker share one stage.
export const TRACKS = {
  curtain: curtainTrack(0),
  rouletteReveal: [0.8, 1, 1, 'smooth'],
  roulette: ROULETTE_TRACK,
  reveal: [4.28, 6.149, 1, 'smooth'],
  chip: [4.3868, 6.0956, 1, 'smooth'],
  marquee: [6.95, 12.45, 1, 'none'],
  features: [12.45, 20.45, 1, 'none'],
  playback: [6.95, 22.95, 2, 'none'],
  definition: [20.55, 26.05, 1, 'none'],
  definitionVisibility: [20.55, 20.73, 1, 'smooth'],
  background: [20.3, 22.4, 1, 'smooth'],
  story: [26.23, 33.43, 1, 'none'],
  safety: [33.68, 39.68, 1, 'none'],
  returnGradient: [37.16, 39.41, 1, 'smooth'],
  checker: [37.4, 39.68, 1, 'smooth'],
  resultCurtain: curtainTrack(RESULT_CURTAIN_START),
  faqReveal: heroRevealTrack(RESULT_CURTAIN_START + 1),
};
// One extra viewport belongs to the sticky stage itself.
export const SCENE_BASE_HEIGHT = `${(TRACKS.resultCurtain[1] + 1) * 100}svh`;
export const CHECKER_SCROLL_TARGET = TRACKS.checker[1] + 0.2;
export const getLayout = (width, height) => {
  const mobile = width <= 700;
  const raw = Math.min(width / (mobile ? 360 : 1440), height / (mobile ? 600 : 720));
  return { width, height, mobile, scale: Math.min(Math.max(raw, mobile ? 0.88 : 0.72), mobile ? 1.25 : 1.6) };
};
