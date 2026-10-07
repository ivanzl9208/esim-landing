import { clamp, mix, smoothstep } from './math.js';

// Retain the final handoff and all following scene timings.
export const INTRO_SCROLL_EXTENSION = 1.65;
// The opening phrases already travel with the curtain before this column track
// takes over. Keep the final handoff at the same scroll position.
export const INTRO_TEXT_TRACK = [1, 5.93, 1, 'none'];

// SberBoom's intro uses opacity 0 → 1 → 0, scale .96 → 1, measured
// against each item's passage through the viewport. Its large Sound heading
// starts at top 120% and finishes 150% of a viewport later.
export function introFadeFrame(top, height, finale = false, reduced = false) {
  const start = finale ? 1.2 : 1.1;
  const distance = finale ? 1.5 : 1.1;
  const progress = clamp((start - top / height) / distance);
  const entrance = smoothstep(0, .5, progress);
  const exit = smoothstep(.5, 1, progress);
  return {
    opacity: reduced ? Number(progress > 0 && progress < 1) : entrance * (1 - exit),
    scale: reduced ? 1 : mix(finale ? .96 : .88, 1, entrance),
  };
}

export function introColumnY(progress, height, bottom) {
  return mix(.55 * height, -bottom - .3 * height, clamp(progress));
}

// Content belongs to the rising panel: it is already within its lower half,
// rather than entering from below after the panel has covered the hero.
export function introPanelColumnY(progress, curtain, height, bottom) {
  if (curtain >= 1) return introColumnY(progress, height, bottom);
  const t = clamp(curtain);
  const speed = (bottom + .85 * height) / (INTRO_TEXT_TRACK[1] - INTRO_TEXT_TRACK[0]);
  // Hermite interpolation joins the panel's screen-space velocity to the
  // column's velocity without a sudden slowdown when the curtain settles.
  return (2 * t ** 3 - 3 * t ** 2 + 1) * .25 * height
    + (t ** 3 - 2 * t ** 2 + t) * .3 * height
    + (-2 * t ** 3 + 3 * t ** 2) * .55 * height
    + (t ** 3 - t ** 2) * (height - speed);
}
