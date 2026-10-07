// Reuse the opening curtain: one viewport of linear scroll, translated 100% → 0%.
export const curtainTrack = start => [start, start + 1, 1, 'none'];
export const curtainOffset = progress => (1 - progress) * 100;
