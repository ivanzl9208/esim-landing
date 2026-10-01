export const CHIP_FRAME_COUNT = 150;

const distance = (a, b) => Math.min(Math.abs(a - b), CHIP_FRAME_COUNT - Math.abs(a - b));

/** Decode before presenting, prioritize the latest scroll position, and bound
 * both concurrent downloads and decoded image memory (40 × 640² ≈ 63 MiB). */
export function createChipFrameLoader({ load, present, failed, concurrency = 3, cacheSize = 40 }) {
  const ready = new Map();
  const active = new Map();
  const errors = new Set();
  let wanted = 0;
  let shown = -1;
  let plan = [];
  let disposed = false;
  const show = () => {
    if (disposed || !ready.size) return;
    const nearest = [...ready.keys()].sort((a, b) => distance(a, wanted) - distance(b, wanted))[0];
    if (nearest !== shown) { shown = nearest; present(nearest, ready.get(nearest)); }
  };
  const trim = () => {
    while (ready.size > cacheSize) {
      const old = [...ready.keys()].find(index => index !== 0 && index !== shown && !plan.includes(index))
        ?? [...ready.keys()].find(index => index !== 0 && index !== shown);
      if (old === undefined) break;
      ready.delete(old);
    }
  };
  const pump = () => {
    if (disposed) return;
    for (const index of plan) {
      if (active.size >= concurrency) break;
      if (ready.has(index) || active.has(index) || errors.has(index)) continue;
      const controller = new AbortController();
      active.set(index, controller);
      Promise.resolve().then(() => load(index, controller.signal)).then(image => {
        if (disposed) return;
        ready.set(index, image);
        show();
        trim();
      }, error => {
        if (disposed) return;
        errors.add(index);
        failed?.(error);
      }).finally(() => { active.delete(index); pump(); });
    }
  };
  return {
    request(index) {
      if (disposed) return;
      const next = Math.min(Math.max(Math.round(index), 0), CHIP_FRAME_COUNT - 1);
      if (next === wanted && plan.length) return;
      wanted = next;
      const nearby = [];
      for (let offset = 1; offset <= 8; offset++) {
        nearby.push((wanted + offset) % CHIP_FRAME_COUNT, (wanted - offset + CHIP_FRAME_COUNT) % CHIP_FRAME_COUNT);
      }
      // Front views stay available during the reading screens. Sparse frames
      // provide a usable rotation before all the nearby frames have arrived.
      const overview = Array.from({ length: 15 }, (_, i) => i * 10)
        .sort((a, b) => distance(a, wanted) - distance(b, wanted));
      plan = [...new Set([wanted, 0, CHIP_FRAME_COUNT - 1, ...nearby, ...overview])];
      show();
      pump();
    },
    dispose() {
      disposed = true;
      active.forEach(controller => controller.abort());
      active.clear(); ready.clear(); plan = [];
    },
  };
}
