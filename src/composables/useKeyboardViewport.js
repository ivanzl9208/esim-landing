import { onMounted, onScopeDispose } from 'vue';
import { getLayout } from '../animation/timing.js';
import { keyboardIsOpen, waitForKeyboardClose } from '../utils/keyboardViewport.js';

export function useKeyboardViewport(section) {
  let viewport;
  let observer;
  let sizeObserver;
  let closeController;
  const sync = () => {
    if (!section.value) return;
    const keyboardOpen = keyboardIsOpen(viewport, window.innerHeight);
    const panel = section.value.querySelector('.checker-panel');
    const offset = keyboardOpen
      ? Math.max(0, panel.getBoundingClientRect().bottom - viewport.height - viewport.offsetTop)
      : 0;
    section.value.style.setProperty('--checker-keyboard-offset', `${offset}px`);
    section.value.dataset.keyboardOpen = keyboardOpen ? 'true' : 'false';
    if (!keyboardOpen) section.value.style.setProperty('--layout-scale', getLayout(window.innerWidth, section.value.clientHeight).scale.toFixed(5));
  };
  onMounted(() => {
    viewport = window.visualViewport;
    sync();
    viewport?.addEventListener('resize', sync);
    viewport?.addEventListener('scroll', sync);
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    section.value.addEventListener('scroll', sync, { passive: true });
    sizeObserver = new ResizeObserver(sync);
    sizeObserver.observe(section.value);
    observer = new IntersectionObserver(([entry]) => {
      section.value.dataset.inView = String(entry.isIntersecting);
    });
    observer.observe(section.value);
  });
  onScopeDispose(() => {
    closeController?.abort();
    viewport?.removeEventListener('resize', sync);
    viewport?.removeEventListener('scroll', sync);
    window.removeEventListener('scroll', sync);
    window.removeEventListener('resize', sync);
    section.value?.removeEventListener('scroll', sync);
    sizeObserver?.disconnect();
    observer?.disconnect();
  });
  return {
    waitForKeyboardClose: () => {
      closeController?.abort();
      closeController = new AbortController();
      return waitForKeyboardClose({ viewport, layoutTarget: window, layoutHeight: () => window.innerHeight, signal: closeController.signal });
    },
  };
}
