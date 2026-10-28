import { curtainTrack } from './curtain.js';
import { INTRO_TEXT_TRACK, INTRO_SCROLL_EXTENSION } from './introFade.js';
import { FEATURE_READING_EXTENSION } from './featureReading.js';

// All positions are viewport-height multiples measured from the scene top.
// Safety and the returning gradient retain their original overlapping tracks.
// Four theses use 2.1 viewports each, retaining entrance and exit distances.
// Later tracks shift without being compressed.
const STORY_EXTENSION = 1.2;
// After the last thesis, halve the former .775-viewport wait before zoom.
// Keep the final centre return inside that handoff, ahead of any growth.
export const POST_STORY_ZOOM_GAP = (.525 + .25) / 2;
export const CHIP_CENTER_RETURN_EXTENSION = POST_STORY_ZOOM_GAP - .25;
// Scroll space for the first zoom and the simultaneous safety-copy entrance.
export const CENTERED_CHIP_HOLD = 2;
const CHIP_INTRO_PAUSE_REDUCTION = .4;
// Spend the former empty definition→thesis interval on decoder lead-in
// while the outgoing heading is still present, not on a blank gray screen.
export const DEFINITION_HANDOFF_ADVANCE = .18;
// The opacity-based finale fades before its column has fully left the screen.
// Start the shutter during that quiet tail instead of leaving an empty viewport.
export const INTRO_HANDOFF_ADVANCE = .7;
const BASE_TRACKS = {
  curtain: curtainTrack(0),
  introText: INTRO_TEXT_TRACK,
  reveal: [4.28, 6.149, 1, 'smooth'],
  chip: [4.3868, 6.0956, 1, 'smooth'],
  marquee: [6.95, 12.45, 1, 'none'],
  features: [12.45, 20.45 + FEATURE_READING_EXTENSION, 1, 'none'],
  // One linear track gives equal rotation for equal scroll distances through
  // the features and definition. Finish underneath the outgoing heading so
  // its final decoded front pose is ready when the first thesis enters.
  playback: [6.95, 26.05 + FEATURE_READING_EXTENSION - DEFINITION_HANDOFF_ADVANCE, 4, 'none'],
  definition: [20.55 + FEATURE_READING_EXTENSION, 26.05 + FEATURE_READING_EXTENSION, 1, 'none'],
  definitionVisibility: [20.55 + FEATURE_READING_EXTENSION, 20.73 + FEATURE_READING_EXTENSION, 1, 'smooth'],
  background: [20.3 + FEATURE_READING_EXTENSION, 22.4 + FEATURE_READING_EXTENSION, 1, 'smooth'],
  story: [26.23 + FEATURE_READING_EXTENSION, 33.43 + STORY_EXTENSION + FEATURE_READING_EXTENSION, 1, 'none'],
  chipZoom: [33.68 + STORY_EXTENSION + FEATURE_READING_EXTENSION, 33.68 + STORY_EXTENSION + CENTERED_CHIP_HOLD + FEATURE_READING_EXTENSION, 1, 'none'],
  safety: [33.68 + STORY_EXTENSION + CENTERED_CHIP_HOLD + FEATURE_READING_EXTENSION, 39.68 + STORY_EXTENSION + CENTERED_CHIP_HOLD + FEATURE_READING_EXTENSION, 1, 'none'],
  returnGradient: [37.16 + STORY_EXTENSION + CENTERED_CHIP_HOLD + FEATURE_READING_EXTENSION, 39.41 + STORY_EXTENSION + CENTERED_CHIP_HOLD + FEATURE_READING_EXTENSION, 1, 'smooth'],
  outro: [37.4 + STORY_EXTENSION + CENTERED_CHIP_HOLD + FEATURE_READING_EXTENSION, 39.68 + STORY_EXTENSION + CENTERED_CHIP_HOLD + FEATURE_READING_EXTENSION, 1, 'smooth'], // Original checker entrance and floating CTA exit.
};
// Remove the empty intro tail, shifting subsequent tracks together so their
// durations, reading holds and overlaps remain unchanged.
export const TRACKS = Object.fromEntries(Object.entries(BASE_TRACKS).map(([key, track]) => {
  const [start, end, value, ease] = track;
  if (start < BASE_TRACKS.reveal[0]) return [key, track];
  const introReduction = start >= BASE_TRACKS.marquee[0] ? CHIP_INTRO_PAUSE_REDUCTION : 0;
  const centreExtension = start > BASE_TRACKS.story[1] ? CHIP_CENTER_RETURN_EXTENSION : 0;
  // Move the entire following sequence, keeping each card's entrance,
  // reading hold, exit and all later handoffs the same length.
  const definitionAdvance = start >= BASE_TRACKS.story[0] ? DEFINITION_HANDOFF_ADVANCE : 0;
  const shift = INTRO_SCROLL_EXTENSION - INTRO_HANDOFF_ADVANCE - introReduction + centreExtension - definitionAdvance;
  return [key, [Number((start + shift).toFixed(4)), Number((end + shift).toFixed(4)), value, ease]];
}));
TRACKS.storyCenter = [
  TRACKS.story[1] - .525,
  TRACKS.story[1] + CHIP_CENTER_RETURN_EXTENSION,
  1, 'none',
];
// Give the fully revealed checker two viewports of reading/selection space
// before handing it to document flow, without stretching its entrance.
export const CHECKER_HOLD = 2;
export const SCENE_SCROLL_END = TRACKS.outro[1] + CHECKER_HOLD;
export const SCENE_BASE_HEIGHT = `${(SCENE_SCROLL_END + 1) * 100}svh`;
export const getLayout = (width, height) => {
  const mobile = width <= 700;
  const raw = Math.min(width / (mobile ? 360 : 1440), height / (mobile ? 600 : 720));
  return { width, height, mobile, scale: Math.min(Math.max(raw, mobile ? 0.88 : 0.72), mobile ? 1.25 : 1.6) };
};
