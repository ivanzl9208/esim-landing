export const keyboardIsOpen = (viewport, layoutHeight) => Boolean(viewport && layoutHeight - viewport.height - viewport.offsetTop > 100);

/** Wait for the keyboard's resize AND Safari's trailing scroll adjustment before anchoring. */
export function waitForKeyboardClose({ viewport, layoutTarget, layoutHeight, signal, quietMs = 180, timeoutMs = 2000 }) {
  if (signal?.aborted || !keyboardIsOpen(viewport, layoutHeight())) return Promise.resolve();
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
      if (!keyboardIsOpen(viewport, layoutHeight())) quietTimer = setTimeout(finish, quietMs);
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
