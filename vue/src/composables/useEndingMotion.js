import { onMounted, onScopeDispose } from 'vue';

// Reproduce the production footer reveal: the CTA rests at the viewport bottom
// under the preceding white card, then rejoins ordinary document scrolling.
export function useEndingMotion(root) {
  let disposed = false;
  let cleanup = () => {};
  onMounted(async () => {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
    if (disposed) return;
    gsap.registerPlugin(ScrollTrigger);
    const section = root.value.querySelector('.connect-cta');
    const surface = section.querySelector('.connect-cta-surface');
    // The footer is outside the temporarily translated FAQ/CTA wrapper.
    // Its top is the CTA's layout bottom, so these bounds are equivalent
    // to the original section bounds and remain stable during FAQ reveal.
    const footer = root.value.parentElement.nextElementSibling;
    const media = gsap.matchMedia();
    media.add({ always: 'all', reduced: '(prefers-reduced-motion: reduce)' }, context => {
      if (context.conditions.reduced) return;
      gsap.fromTo(surface, { y: () => -section.offsetHeight }, {
        y: 0, ease: 'none',
        scrollTrigger: { trigger: footer, start: () => `top bottom+=${section.offsetHeight}`, end: 'top bottom', scrub: true, invalidateOnRefresh: true },
      });
    });
    let timer;
    const refresh = () => {
      if (disposed) return;
      clearTimeout(timer);
      timer = setTimeout(() => { if (!disposed) ScrollTrigger.refresh(); }, 120);
    };
    const observer = new ResizeObserver(refresh);
    observer.observe(root.value.querySelector('.ending-white'));
    observer.observe(section);
    document.fonts?.ready.then(refresh);
    cleanup = () => { clearTimeout(timer); observer.disconnect(); media.revert(); };
  });
  onScopeDispose(() => { disposed = true; cleanup(); });
}
