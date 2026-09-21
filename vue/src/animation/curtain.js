// Reuse the opening curtain: one viewport of linear scroll, translated 100% → 0%.
// The checker is fully visible at 39.68; hold it for another 0.75 viewport.
export const RESULT_CURTAIN_START = 40.43;
export const curtainTrack = start => [start, start + 1, 1, 'none'];
export const curtainOffset = progress => (1 - progress) * 100;
