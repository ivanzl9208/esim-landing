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
    // Keep the existing parallax bounds anchored to the footer / CTA bottom.
    const footer = root.value.parentElement.nextElementSibling;
    const media = gsap.matchMedia();
    let endingTrigger;
    media.add({ always: 'all', reduced: '(prefers-reduced-motion: reduce)' }, context => {
      if (context.conditions.reduced) return;
      const tween = gsap.fromTo(surface, { y: () => -section.offsetHeight }, {
        y: 0, ease: 'none',
        scrollTrigger: { trigger: footer, start: () => `top bottom+=${section.offsetHeight}`, end: 'top bottom', scrub: true, invalidateOnRefresh: true },
      });
      endingTrigger = tween.scrollTrigger;
      return () => { endingTrigger = undefined; };
    });
    let timer;
    const refresh = () => {
      if (disposed) return;
      clearTimeout(timer);
      // Accordion height moves only the footer trigger. Rewinding every
      // earlier scene on every answer transition is unnecessary and disrupts
      // both the checker handoff and the smooth-scroll position.
      timer = setTimeout(() => { if (!disposed) endingTrigger?.refresh(); }, 120);
    };
    const observer = new ResizeObserver(refresh);
    observer.observe(root.value.querySelector('.ending-white'));
    observer.observe(section);
    document.fonts?.ready.then(refresh);
    cleanup = () => { clearTimeout(timer); observer.disconnect(); media.revert(); };
  });
  onScopeDispose(() => { disposed = true; cleanup(); });
}
