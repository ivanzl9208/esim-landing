import { clamp, cubicBezierValue } from './math.js';

export function checkerEntranceFrame(progress, { height, scale }, reduced = false) {
  const reveal = clamp(progress);
  return {
    // Original checker translation (7e9ba25), on the original smoothstep track.
    y: reduced ? 0 : (1 - reveal) * (height + 48 * scale),
    // The former checker-view-in opacity easing, now reversible with the scroll.
    opacity: reduced ? 1 : cubicBezierValue(reveal, .22, 1, .36, 1),
    visible: reveal > (reduced ? .96 : .001),
    interactive: reveal > .96,
  };
}

/** Borrow the existing sticky stage's background until the flow block reaches it. */
export function createCheckerEntrance(section) {
  const panel = section.querySelector('.checker-panel');
  return {
    render(progress, geometry, reduced, entering) {
      const frame = checkerEntranceFrame(progress, geometry, reduced);
      section.dataset.entering = String(entering);
      section.dataset.entranceVisible = String(frame.visible);
      panel.style.transform = `translate3d(0, ${frame.y.toFixed(2)}px, 0)`;
      panel.style.opacity = String(frame.opacity);
      panel.style.visibility = frame.visible ? 'visible' : 'hidden';
      panel.inert = !frame.interactive;
    },
    clear() {
      delete section.dataset.entering;
      delete section.dataset.entranceVisible;
      panel.style.removeProperty('transform');
      panel.style.removeProperty('opacity');
      panel.style.removeProperty('visibility');
      panel.inert = false;
    },
  };
}
