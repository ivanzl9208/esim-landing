/** Flush after GSAP's updateRoot, in the same ticker, not a second rAF loop. */
export function createFrameCommit() {
  let pending;
  let priority = -1;
  return {
    request(callback, rank = 0) {
      if (rank >= priority) { pending = callback; priority = rank; }
    },
    flush() {
      const callback = pending;
      pending = undefined;
      priority = -1;
      callback?.();
    },
    clear() { pending = undefined; priority = -1; },
  };
}
