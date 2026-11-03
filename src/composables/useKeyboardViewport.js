import { inject, onMounted, onScopeDispose } from 'vue';
import { getLayout } from '../animation/timing.js';
import { createKeyboardViewportState, keyboardFormFrame, keyboardVisibleTop, waitForKeyboardClose } from '../utils/keyboardViewport.js';

export function useKeyboardViewport(section) {
  // Reuse the landing's scroll coordinator: it updates native/Lenis positions
  // together and prevents a focus jump being mistaken for reverse-hold input.
  const positionViewport = inject('setScrollPosition', top => window.scrollTo({ top, behavior: 'instant' }));
  let viewport;
  let observer;
  let sizeObserver;
  let closeController;
  let frame;
  let settlingUntil = 0;
  let observedForm;
  let restingFormHeight = 0;
  let layoutDirty = true;
  const keyboard = createKeyboardViewportState();
  const sync = () => {
    if (!section.value) return;
    const keyboardOpen = keyboard.update(viewport, window.innerHeight, window.innerWidth);
    const form = section.value.querySelector('.checker-form-view');
    if (form !== observedForm) {
      restingFormHeight = 0;
      if (observedForm) sizeObserver?.unobserve(observedForm);
      observedForm = form;
      if (form) sizeObserver?.observe(form);
    }
    const focused = fieldFocused();
    if (!focused && !keyboardOpen) restingFormHeight = 0;
    if (focused && form && !restingFormHeight) {
      // Read once on focus, before switching keyboard CSS. If Safari has
      // already resized the layout, retain the last closed viewport height.
      restingFormHeight = Math.max(form.getBoundingClientRect().height || 0, keyboard.height());
    }
    if (focused && keyboardOpen && form) {
      const restingHeight = `${restingFormHeight.toFixed(2)}px`;
      if (section.value.style.getPropertyValue('--checker-keyboard-layout-height') !== restingHeight)
        section.value.style.setProperty('--checker-keyboard-layout-height', restingHeight);
    }
    const open = String(keyboardOpen);
    if (section.value.dataset.keyboardOpen !== open) section.value.dataset.keyboardOpen = open;
    // Apply the keyboard layout before measuring. Follow the form's actual
    // border box: parent coordinates alone miss Safari's focused-content pan
    // and internal scroller offsets during the fixed-to-flow handoff.
    const height = `${(keyboardOpen ? viewport.height : 0).toFixed(2)}px`;
    if (section.value.style.getPropertyValue('--checker-keyboard-height') !== height) section.value.style.setProperty('--checker-keyboard-height', height);
    const correcting = keyboardOpen && focused && form;
    // The offscreen checker must never force document layout during hero /
    // curtain / chip scrolling. Safari pan calibration is needed only while
    // its input is actually being edited with the keyboard open.
    const documentTop = correcting ? document.documentElement?.getBoundingClientRect().top : undefined;
    const visibleTop = correcting ? keyboardVisibleTop(viewport, documentTop) : 0;
    if (correcting) {
      // WebKit may pan the document again while revealing the caret. Keep
      // the SAME orange section behind the full visible keyboard viewport;
      // don't chase that native pan with repeated scrollTo calls. The form's
      // resting height remains frozen, so this only reserves space before FAQ.
      const cover = Math.max(restingFormHeight, visibleTop + viewport.height - section.value.getBoundingClientRect().top);
      const coverHeight = `${cover.toFixed(2)}px`;
      if (section.value.style.getPropertyValue('--checker-keyboard-cover-height') !== coverHeight)
        section.value.style.setProperty('--checker-keyboard-cover-height', coverHeight);
    }
    const offset = parseFloat(section.value.style.getPropertyValue('--checker-keyboard-top')) || 0;
    const visible = correcting
      ? keyboardFormFrame(viewport, form.getBoundingClientRect().top, offset, documentTop, restingFormHeight) : { top: 0 };
    for (const [key, number] of Object.entries(visible)) {
      const property = `--checker-keyboard-${key}`;
      const value = `${number.toFixed(2)}px`;
      if (section.value.style.getPropertyValue(property) !== value) section.value.style.setProperty(property, value);
    }
    if (correcting) {
      const field = section.value.querySelector('input');
      const bounds = field?.getBoundingClientRect?.();
      if (bounds) {
        const space = `${Math.max(0, bounds.top - visibleTop - 8).toFixed(2)}px`;
        if (section.value.style.getPropertyValue('--checker-suggestions-space') !== space)
          section.value.style.setProperty('--checker-suggestions-space', space);
      }
    }
    if (!keyboardOpen && layoutDirty) {
      const scale = getLayout(window.innerWidth, section.value.clientHeight).scale.toFixed(5);
      if (section.value.style.getPropertyValue('--layout-scale') !== scale) section.value.style.setProperty('--layout-scale', scale);
      layoutDirty = false;
    }
  };
  const fieldFocused = () => section.value?.contains(document.activeElement) && document.activeElement?.matches('input, textarea');
  const tick = now => {
    frame = undefined;
    sync();
    // Focus, Vue's class update, entrance transforms and Safari's keyboard pan
    // do not finish in one event. Follow that brief settling window, then stop.
    if (now < settlingUntil && fieldFocused()) frame = requestAnimationFrame(tick);
  };
  const schedule = () => {
    if (fieldFocused()) settlingUntil = performance.now() + 700;
    if (frame === undefined) frame = requestAnimationFrame(tick);
  };
  const scroll = () => {
    if (fieldFocused() || section.value?.dataset.keyboardOpen === 'true') schedule();
  };
  const resize = () => { layoutDirty = true; schedule(); };
  const focus = () => {
    if (fieldFocused()) {
      const bounds = section.value?.getBoundingClientRect();
      if (bounds && bounds.top < -1) {
        // When FAQ is already visible, translating just the inner form moves
        // the input onto its white card. Return the whole document to checker
        // once, synchronously on focus, before Safari opens/pans the keyboard.
        const documentTop = document.documentElement?.getBoundingClientRect().top;
        const top = Number.isFinite(documentTop) ? bounds.top - documentTop : bounds.top + window.scrollY;
        positionViewport(top);
      }
    }
    schedule();
  };
  onMounted(() => {
    viewport = window.visualViewport;
    sync();
    viewport?.addEventListener('resize', resize);
    viewport?.addEventListener('scroll', scroll);
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    section.value.addEventListener('scroll', scroll, { passive: true });
    section.value.addEventListener('focusin', focus);
    section.value.addEventListener('focusout', schedule);
    sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(section.value);
    if (observedForm) sizeObserver.observe(observedForm);
    observer = new IntersectionObserver(([entry]) => {
      section.value.dataset.inView = String(entry.isIntersecting);
    });
    observer.observe(section.value);
  });
  onScopeDispose(() => {
    closeController?.abort();
    cancelAnimationFrame(frame);
    viewport?.removeEventListener('resize', resize);
    viewport?.removeEventListener('scroll', scroll);
    window.removeEventListener('scroll', scroll);
    window.removeEventListener('resize', resize);
    section.value?.removeEventListener('scroll', scroll);
    section.value?.removeEventListener('focusin', focus);
    section.value?.removeEventListener('focusout', schedule);
    sizeObserver?.disconnect();
    observer?.disconnect();
  });
  return {
    waitForKeyboardClose: () => {
      closeController?.abort();
      closeController = new AbortController();
      return waitForKeyboardClose({ viewport, layoutTarget: window, layoutHeight: () => window.innerHeight,
        baselineHeight: keyboard.height, signal: closeController.signal });
    },
  };
}
