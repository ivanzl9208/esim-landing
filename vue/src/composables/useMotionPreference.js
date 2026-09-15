import { onMounted, onScopeDispose, ref } from 'vue';

export function useMotionPreference() {
  const reduced = ref(false);
  let media;
  const update = () => { reduced.value = media.matches; };
  onMounted(() => {
    media = window.matchMedia('(prefers-reduced-motion: reduce)');
    update();
    media.addEventListener('change', update);
  });
  onScopeDispose(() => media?.removeEventListener('change', update));
  return reduced;
}
