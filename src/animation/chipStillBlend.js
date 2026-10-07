import { clamp, mix, smoothstep } from './math.js';

/** Screen pixel density chooses the handoff; a zoom gate prevents an instant
 * swap on Retina, where the resting video already exceeds its pixel budget. */
export function chipStillBlend({ width, dpr = 1, sourceWidth = 800, zoom = 0, safety = 0, scale = 1, ready = false, frontReady = false }) {
  const ratio = width * dpr / Math.max(sourceWidth, 1);
  const fade = ready && frontReady
    ? Math.min(Math.max(smoothstep(.7, .98, ratio), smoothstep(.2, .34, safety)), smoothstep(.04, .34, zoom)) : 0;
  // Small DPR1 viewports may never exhaust the video pixel budget. Finish the
  // handoff and sharpening within the existing last growth phase nevertheless.
  const sharpen = Math.min(Math.max(smoothstep(.98, 1.18, ratio), smoothstep(.34, .42, safety)), smoothstep(.34, .62, zoom));
  return {
    ratio,
    fade: clamp(fade),
    // Keep the blur in screen pixels even as the shared wrapper grows.
    blur: fade > 0 ? mix(.8, .28, fade) * (1 - sharpen) / Math.max(scale, .001) : 0,
  };
}
