import { curtainTrack } from './curtain.js';
import { ROULETTE_TRACK, ROULETTE_READING_HOLD, ROULETTE_EXIT_EXTENSION } from './heroReveal.js';
import { FEATURE_READING_EXTENSION } from './featureReading.js';

// All positions are viewport-height multiples measured from the scene top.
// Safety and the returning gradient retain their original overlapping tracks.
// Four theses use 3.15 viewports each, with twice the previous reading hold.
// Later tracks shift without being compressed.
const STORY_EXTENSION = 5.4;
// Double only the last lateral return, adding half a viewport before zoom.
export const CHIP_CENTER_RETURN_EXTENSION = .525;
// Scroll space for the first zoom and the simultaneous safety-copy entrance.
export const CENTERED_CHIP_HOLD = 2;
const CHIP_INTRO_PAUSE_REDUCTION = .4;
const BASE_TRACKS = {
  curtain: curtainTrack(0),
  rouletteReveal: [0.8, 1, 1, 'smooth'],
  roulette: ROULETTE_TRACK,
  reveal: [4.28, 6.149, 1, 'smooth'],
  chip: [4.3868, 6.0956, 1, 'smooth'],
  marquee: [6.95, 12.45, 1, 'none'],
  features: [12.45, 20.45 + FEATURE_READING_EXTENSION, 1, 'none'],
  // One linear track gives equal rotation for equal scroll distances through
  // the features and definition. Four complete turns retain the final pose.
  playback: [6.95, 26.05 + FEATURE_READING_EXTENSION, 4, 'none'],
  definition: [20.55 + FEATURE_READING_EXTENSION, 26.05 + FEATURE_READING_EXTENSION, 1, 'none'],
  definitionVisibility: [20.55 + FEATURE_READING_EXTENSION, 20.73 + FEATURE_READING_EXTENSION, 1, 'smooth'],
  background: [20.3 + FEATURE_READING_EXTENSION, 22.4 + FEATURE_READING_EXTENSION, 1, 'smooth'],
  story: [26.23 + FEATURE_READING_EXTENSION, 33.43 + STORY_EXTENSION + FEATURE_READING_EXTENSION, 1, 'none'],
  chipZoom: [33.68 + STORY_EXTENSION + FEATURE_READING_EXTENSION, 33.68 + STORY_EXTENSION + CENTERED_CHIP_HOLD + FEATURE_READING_EXTENSION, 1, 'none'],
  safety: [33.68 + STORY_EXTENSION + CENTERED_CHIP_HOLD + FEATURE_READING_EXTENSION, 39.68 + STORY_EXTENSION + CENTERED_CHIP_HOLD + FEATURE_READING_EXTENSION, 1, 'none'],
  returnGradient: [37.16 + STORY_EXTENSION + CENTERED_CHIP_HOLD + FEATURE_READING_EXTENSION, 39.41 + STORY_EXTENSION + CENTERED_CHIP_HOLD + FEATURE_READING_EXTENSION, 1, 'smooth'],
  outro: [37.4 + STORY_EXTENSION + CENTERED_CHIP_HOLD + FEATURE_READING_EXTENSION, 39.68 + STORY_EXTENSION + CENTERED_CHIP_HOLD + FEATURE_READING_EXTENSION, 1, 'smooth'], // Original checker entrance and floating CTA exit.
};
// Insert reading space before the chip reveal and shorten its later idle gap.
// Shift following tracks together, preserving their durations and overlaps.
export const TRACKS = Object.fromEntries(Object.entries(BASE_TRACKS).map(([key, track]) => {
  const [start, end, value, ease] = track;
  if (start < BASE_TRACKS.reveal[0]) return [key, track];
  const introReduction = start >= BASE_TRACKS.marquee[0] ? CHIP_INTRO_PAUSE_REDUCTION : 0;
  const centreExtension = start > BASE_TRACKS.story[1] ? CHIP_CENTER_RETURN_EXTENSION : 0;
  const shift = ROULETTE_READING_HOLD + ROULETTE_EXIT_EXTENSION - introReduction + centreExtension;
  return [key, [Number((start + shift).toFixed(4)), Number((end + shift).toFixed(4)), value, ease]];
}));
TRACKS.storyCenter = [
  TRACKS.story[1] - .525,
  TRACKS.story[1] + CHIP_CENTER_RETURN_EXTENSION,
  1, 'none',
];
// Give the fully revealed checker three viewports of reading/selection space
// before handing it to document flow, without stretching its entrance.
export const CHECKER_HOLD = 3;
export const SCENE_SCROLL_END = TRACKS.outro[1] + CHECKER_HOLD;
export const SCENE_BASE_HEIGHT = `${(SCENE_SCROLL_END + 1) * 100}svh`;
export const getLayout = (width, height) => {
  const mobile = width <= 700;
  const raw = Math.min(width / (mobile ? 360 : 1440), height / (mobile ? 600 : 720));
  return { width, height, mobile, scale: Math.min(Math.max(raw, mobile ? 0.88 : 0.72), mobile ? 1.25 : 1.6) };
};
