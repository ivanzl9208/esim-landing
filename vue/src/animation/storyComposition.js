import { clamp, mix, smoothstep } from './math.js';

// Change columns only while the adjacent theses are fading out / coming in.
// The object returns to the centre before the existing safety scene begins.
export function storyComposition(progress, count, reduced = false) {
  const time = clamp(progress) * count;
  if (time === 0 || time === count) return { side: 0, presence: 0 };
  const presence = Math.min(smoothstep(0, .45, time), 1 - smoothstep(count - .45, count, time));
  let side = Math.floor(time) % 2 ? 1 : -1;
  for (let boundary = 1; boundary < count; boundary += 1) {
    if (time >= boundary - .45 && time <= boundary + .4) {
      const previous = boundary % 2 ? -1 : 1;
      side = mix(previous, -previous, smoothstep(boundary - .45, boundary + .4, time));
      break;
    }
  }
  if (reduced) {
    const index = time % 1 < .85 ? Math.floor(time) : Math.ceil(time);
    return { side: index % 2 ? 1 : -1, presence: 0 };
  }
  return { side: side * presence, presence };
}
