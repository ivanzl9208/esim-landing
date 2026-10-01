import { clamp } from './math.js';

export const FEATURE_SCROLL_DISTANCE = 8;
export const FEATURE_READING_EXTENSION = 6;

export function featureWindow(index, mobile) {
  const start = mobile ? 0.035 + index * 0.153 : 0.045 + Math.floor(index / 2) * 0.305;
  return { start, end: start + (mobile ? 0.142 : 0.255) };
}

// Freeze only the text playhead at a fully revealed point. The chip's
// independent scroll track continues through all six extra viewports.
export function featureReadingProgress(progress, mobile) {
  const distance = clamp(progress) * (FEATURE_SCROLL_DISTANCE + FEATURE_READING_EXTENSION);
  const count = mobile ? 6 : 3;
  const hold = FEATURE_READING_EXTENSION / count;
  let inserted = 0;
  for (let index = 0; index < count; index++) {
    const { start, end } = featureWindow(mobile ? index : index * 2, mobile);
    const anchor = start + (end - start) * 0.53;
    const holdStart = anchor * FEATURE_SCROLL_DISTANCE + inserted;
    if (distance < holdStart) break;
    if (distance <= holdStart + hold) return anchor;
    inserted += hold;
  }
  return clamp((distance - inserted) / FEATURE_SCROLL_DISTANCE);
}
