import { onMounted, onScopeDispose } from 'vue';
import { getLayout } from '../animation/timing.js';

export function useKeyboardViewport(section) {
  let viewport;
  let observer;
  let sizeObserver;
  const sync = () => {
    if (!section.value) return;
    const keyboardOpen = viewport && window.innerHeight - viewport.height - viewport.offsetTop > 100;
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
    viewport?.removeEventListener('resize', sync);
    viewport?.removeEventListener('scroll', sync);
    window.removeEventListener('scroll', sync);
    window.removeEventListener('resize', sync);
    section.value?.removeEventListener('scroll', sync);
    sizeObserver?.disconnect();
    observer?.disconnect();
  });
}
