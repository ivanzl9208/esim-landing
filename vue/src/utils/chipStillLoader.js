/** One deferred decode, with cancellation and no rejected promise escaping to
 * the animation. A failed still leaves the current video/frame untouched. */
export function createChipStillLoader({ load, present }) {
  let requested = false;
  let disposed = false;
  let controller;
  return {
    prepare() {
      if (requested || disposed) return;
      requested = true;
      controller = new AbortController();
      Promise.resolve().then(() => load(controller.signal)).then(result => {
        if (disposed) result.release();
        else present(result);
      }).catch(() => {});
    },
    dispose() { disposed = true; controller?.abort(); },
  };
}
