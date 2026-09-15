import { onMounted, onScopeDispose } from 'vue';

export function useKeyboardViewport(section) {
  let viewport;
  const sync = () => {
    if (!section.value || !viewport) return;
    const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    section.value.style.setProperty('--checker-keyboard-offset', `${offset}px`);
    section.value.dataset.keyboardOpen = offset > 100 ? 'true' : 'false';
  };
  onMounted(() => {
    viewport = window.visualViewport;
    if (!viewport) return;
    sync();
    viewport.addEventListener('resize', sync);
    viewport.addEventListener('scroll', sync);
  });
  onScopeDispose(() => {
    viewport?.removeEventListener('resize', sync);
    viewport?.removeEventListener('scroll', sync);
  });
}
