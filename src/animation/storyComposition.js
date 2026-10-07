import { clamp, mix, smoothstep } from './math.js';

// Each thesis uses 3.15 viewport heights: 0.525 in, 2.1 hold, 0.525 out.
// Only the hold grows; the word and column transitions keep their distance.
export const STORY_ENTER_END = 1 / 6;
export const STORY_EXIT_START = 5 / 6;

// Change columns only while the adjacent theses are fading out / coming in.
// The object returns to the centre before the existing safety scene begins.
export function storyComposition(progress, count, reduced = false, centreReturn) {
  const time = clamp(progress) * count;
  const lastSide = (count - 1) % 2 ? 1 : -1;
  if (time === 0) return { side: 0, presence: 0 };
  if (time === count) return {
    side: centreReturn === undefined || reduced ? 0 : lastSide * (1 - smoothstep(0, 1, centreReturn)),
    presence: 0,
  };
  const presence = Math.min(smoothstep(0, STORY_ENTER_END, time), 1 - smoothstep(count - (1 - STORY_EXIT_START), count, time));
  let side = Math.floor(time) % 2 ? 1 : -1;
  for (let boundary = 1; boundary < count; boundary += 1) {
    if (time >= boundary - (1 - STORY_EXIT_START) && time <= boundary + STORY_ENTER_END) {
      const previous = boundary % 2 ? -1 : 1;
      side = mix(previous, -previous, smoothstep(boundary - (1 - STORY_EXIT_START), boundary + STORY_ENTER_END, time));
      break;
    }
  }
  if (reduced) {
    const index = time % 1 < .85 ? Math.floor(time) : Math.ceil(time);
    return { side: index % 2 ? 1 : -1, presence: 0 };
  }
  // The final return gets its own scroll distance; earlier column changes
  // and text/background fades keep their existing timing.
  if (centreReturn !== undefined && time >= count - (1 - STORY_EXIT_START)) {
    side = lastSide * (1 - smoothstep(0, 1, centreReturn));
  } else side *= presence;
  return { side, presence };
}
