import { clamp, smoothstep } from './math.js';

// The copy keeps its top inset and the CTA follows the bottom edge. Half of
// the extra toolbar-free height keeps the chip between those two anchors.
// Never use this height to recalculate the scroll timeline or media scale.
export function chipViewportTarget({ mobile, height, motionHeight = height }) {
  return mobile ? (height - motionHeight) / 2 : 0;
}

export function advanceChipViewport(current, target, seconds) {
  if (Math.abs(target - current) < .01) return target;
  return current + (target - current) * (1 - Math.exp(-Math.max(0, seconds) / .12));
}

export function chipViewportOffset(layout, { chip = 0, chipZoom = 0, safety = 0 }) {
  if (!layout.mobile || safety > 0) return 0;
  // Return to the existing zoom axis before the safety copy enters. Changing
  // Safari chrome during that text must not push its reading position backwards.
  const presence = smoothstep(0, 1, clamp(chip)) * (1 - smoothstep(0, .45, chipZoom));
  return (layout.chipViewportOffset ?? chipViewportTarget(layout)) * presence;
}
