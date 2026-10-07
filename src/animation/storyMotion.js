import { clamp, smoothstep } from './math.js';
import { TRACKS } from './timing.js';
import { STORY_ENTER_END, STORY_EXIT_START } from './storyComposition.js';
import { STORY_BENEFITS } from '../data/story.js';

const motionTracks = ['story', 'storyCenter', 'chipZoom', 'safety', 'returnGradient', 'outro'].map(key => {
  const [start, end, value, ease] = TRACKS[key];
  return { key, start, duration: end - start, value, ease };
});

// Side coordinates are -1..1 (±20% of viewport width). A full column change
// takes at least .8s; a half-distance centre return at least .4s.
export const STORY_SIDE_SPEED = 2.5;
const TIME_SPEED = 8;
const thesisDistance = (TRACKS.story[1] - TRACKS.story[0]) / STORY_BENEFITS.length;
const lateralSegments = [
  [TRACKS.story[0], TRACKS.story[0] + thesisDistance * STORY_ENTER_END, 1],
  ...Array.from({ length: STORY_BENEFITS.length - 1 }, (_, index) => {
    const boundary = TRACKS.story[0] + thesisDistance * (index + 1);
    return [boundary - thesisDistance * (1 - STORY_EXIT_START), boundary + thesisDistance * STORY_ENTER_END, 2];
  }),
  [TRACKS.storyCenter[0], TRACKS.storyCenter[1], 1],
];

// Cumulative *travel*, rather than net x, keeps skipped opposite columns from
// cancelling each other out. All geometry still comes from the shared time.
const lateralTravel = time => lateralSegments.reduce((total, [start, end, distance]) =>
  total + distance * smoothstep(start, end, time), 0);

export function advanceStoryMotion(time, target, seconds) {
  const delta = Math.min(Math.max(seconds, 0), .05);
  // Earlier scenes have no lateral motion; skip their already hidden playhead
  // instead of delaying a large scroll before the first thesis.
  if (time <= TRACKS.story[0] && target <= TRACKS.story[0]) return target;
  if (time < TRACKS.story[0]) time = TRACKS.story[0];
  const next = time + clamp(target - time, -TIME_SPEED * delta, TIME_SPEED * delta);
  const from = lateralTravel(time), to = lateralTravel(next);
  const budget = STORY_SIDE_SPEED * delta;
  if (Math.abs(to - from) <= budget) return next;
  const wanted = from + Math.sign(to - from) * budget;
  let travelled = 0;
  for (const [start, end, distance] of lateralSegments) {
    if (wanted <= travelled + distance) {
      const progress = (wanted - travelled) / distance;
      let low = 0, high = 1;
      for (let step = 0; step < 24; step++) {
        const middle = (low + high) / 2;
        if (smoothstep(0, 1, middle) < progress) low = middle;
        else high = middle;
      }
      return start + (end - start) * (low + high) / 2;
    }
    travelled += distance;
  }
  return next;
}

// Sample lateral return, growth, copy, background and checker from one time.
// Independent followers can leave x in the old column while y/scale already
// reach the zoom scene on a fast scroll; a shared time keeps the phase order.
export function storyMotionFrame(time) {
  return Object.fromEntries(motionTracks.map(({ key, start, duration, value, ease }) => {
    const progress = clamp((time - start) / duration);
    return [key, (ease === 'smooth' ? smoothstep(0, 1, progress) : progress) * value];
  }));
}
