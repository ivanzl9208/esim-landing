// offsetTop is Safari's pan of the visible viewport, not keyboard height.
// Subtracting it can classify an open keyboard as closed after input focus.
export const keyboardIsOpen = (viewport, layoutHeight, baselineHeight = layoutHeight) =>
  Boolean(viewport && Math.max(layoutHeight, baselineHeight) - viewport.height > 100);

export function createKeyboardViewportState() {
  let baseline = 0;
  let width;
  return {
    update(viewport, height, nextWidth) {
      if (width !== nextWidth) { width = nextWidth; baseline = height; }
      const open = keyboardIsOpen(viewport, height, baseline);
      if (!open) baseline = height;
      return open;
    },
    height: () => baseline,
  };
}

// Rects can be relative to the layout or the visual viewport in WebKit.
// Calibrate against the document's origin rather than adding offsetTop twice.
export const keyboardVisibleTop = (viewport, documentTop) =>
  Number.isFinite(viewport.pageTop) && Number.isFinite(documentTop)
    ? Math.max(0, viewport.pageTop + documentTop)
    : viewport.offsetTop;

export const keyboardFormFrame = (viewport, formTop, offset = 0, documentTop, contentHeight = viewport.height) => ({
  // Keep the uncompressed composition bottom-aligned above the keyboard.
  // Its heading / model rows leave through the top instead of being packed in.
  top: offset + keyboardVisibleTop(viewport, documentTop) + viewport.height - contentHeight - formTop,
  height: viewport.height,
});

/** Wait for the keyboard's resize AND Safari's trailing scroll adjustment before anchoring. */
export function waitForKeyboardClose({ viewport, layoutTarget, layoutHeight, baselineHeight = layoutHeight, signal, quietMs = 180, timeoutMs = 2000 }) {
  const isOpen = () => keyboardIsOpen(viewport, layoutHeight(), baselineHeight());
  if (signal?.aborted || !isOpen()) return Promise.resolve();
  return new Promise(resolve => {
    let quietTimer;
    let deadline;
    const targets = [viewport, layoutTarget].filter(Boolean);
    const finish = () => {
      clearTimeout(quietTimer);
      clearTimeout(deadline);
      for (const target of targets) {
        target.removeEventListener('resize', changed);
        target.removeEventListener('scroll', changed);
      }
      signal?.removeEventListener('abort', finish);
      resolve();
    };
    const changed = () => {
      clearTimeout(quietTimer);
      if (!isOpen()) quietTimer = setTimeout(finish, quietMs);
    };
    for (const target of targets) {
      target.addEventListener('resize', changed, { passive: true });
      target.addEventListener('scroll', changed, { passive: true });
    }
    signal?.addEventListener('abort', finish, { once: true });
    // Avoid trapping a check if a browser omits its final viewport event.
    deadline = setTimeout(finish, timeoutMs);
  });
}
