import { clamp, mix, smoothstep } from './math.js';

export const STORY_ENTER_END = 0.25;
export const STORY_EXIT_START = 0.75;

export function storyThesisFrame(progress) {
  return {
    opacity: Math.min(smoothstep(0, STORY_ENTER_END, progress), 1 - smoothstep(STORY_EXIT_START, 1, progress)),
    holding: progress >= STORY_ENTER_END && progress <= STORY_EXIT_START,
  };
}

// Change columns only while the adjacent theses are fading out / coming in.
// The object returns to the centre before the existing safety scene begins.
export function storyComposition(progress, count, reduced = false) {
  const time = clamp(progress) * count;
  if (time === 0 || time === count) return { side: 0, presence: 0 };
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
  return { side: side * presence, presence };
}
