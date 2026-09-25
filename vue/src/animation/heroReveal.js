import { clamp, mix, smoothstep } from './math.js';

// Original “eSIM —” roulette track: its first unit is the entrance.
export const ROULETTE_TRACK = [1.28, 4.35, 10, 'none'];

// Translation follows scroll linearly; only opacity uses smoothstep.
export function heroRevealFrame(progress, fromY, toY) {
  const p = clamp(progress);
  return { y: mix(fromY, toY, p), opacity: mix(0.05, 1, smoothstep(0, 1, p)) };
}
