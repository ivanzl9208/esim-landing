import { clamp, mix, smoothstep } from './math.js';

// Original “eSIM —” roulette track: its first unit is the entrance.
export const ROULETTE_TRACK = [1.28, 4.35, 10, 'none'];
export const HERO_REVEAL_SCROLL_DISTANCE = (ROULETTE_TRACK[1] - ROULETTE_TRACK[0]) / ROULETTE_TRACK[2];
export const heroRevealTrack = start => [start, start + HERO_REVEAL_SCROLL_DISTANCE, 1, 'none'];

// Translation follows scroll linearly; only opacity uses smoothstep.
export function heroRevealFrame(progress, fromY, toY) {
  const p = clamp(progress);
  return { y: mix(fromY, toY, p), opacity: mix(0.05, 1, smoothstep(0, 1, p)) };
}
