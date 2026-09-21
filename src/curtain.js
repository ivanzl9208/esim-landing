export const RESULT_CURTAIN_START = 43;
export const curtainOffset = progress => (1 - progress) * 100;

// Preserve the opening curtain's existing follow rate and settling threshold.
export function advanceCurtain(current, target) {
  const next = current + (target - current) * 0.16;
  return Math.abs(target - next) < 0.0005 ? target : next;
}
