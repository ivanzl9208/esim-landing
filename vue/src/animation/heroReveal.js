import { clamp, mix, smoothstep } from './math.js';

// Keep the entrance speed, then hold the legible finale and ease its exit.
// Desktop reaches its final size at 9; phone is centred at 7.
export const ROULETTE_READING_HOLD = .75;
export const ROULETTE_EXIT_EXTENSION = .9;
export const ROULETTE_MOTION_DURATION = 3.07;
export const ROULETTE_TRACK = [1.28,
  Number((1.28 + ROULETTE_MOTION_DURATION + ROULETTE_READING_HOLD + ROULETTE_EXIT_EXTENSION).toFixed(4)),
  10, 'none'];

export function rouletteSegments(mobile) {
  const anchor = mobile ? 7 : 9;
  const holdStart = ROULETTE_TRACK[0] + ROULETTE_MOTION_DURATION * anchor / 10;
  return [
    { start: ROULETTE_TRACK[0], end: holdStart, from: 0, to: anchor, ease: 'none' },
    { start: holdStart + ROULETTE_READING_HOLD, end: ROULETTE_TRACK[1], from: anchor, to: 10, ease: 'smooth' },
  ];
}

// The renderer uses the same eased phase as GSAP to put the final glyph above
// the viewport exactly when the next curtain starts, including reverse scroll.
export function rouletteProgressAt(scroll, mobile) {
  const [entrance, exit] = rouletteSegments(mobile);
  if (scroll <= entrance.end) return mix(entrance.from, entrance.to,
    clamp((scroll - entrance.start) / (entrance.end - entrance.start)));
  if (scroll < exit.start) return entrance.to;
  return mix(exit.from, exit.to, smoothstep(exit.start, exit.end, scroll));
}

// Translation follows scroll linearly; only opacity uses smoothstep.
export function heroRevealFrame(progress, fromY, toY) {
  const p = clamp(progress);
  return { y: mix(fromY, toY, p), opacity: mix(0.05, 1, smoothstep(0, 1, p)) };
}
