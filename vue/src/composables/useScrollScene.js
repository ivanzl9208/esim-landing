import { onMounted, onScopeDispose } from 'vue';
import { TRACKS, getLayout } from '../animation/timing.js';
import { createRouletteRenderer } from '../animation/roulette.js';
import { createChipStoryRenderer } from '../animation/chipStory.js';
import { smoothstep } from '../animation/math.js';
import { HERO_REVEAL_SCROLL_DISTANCE, FAQ_REVEAL_OPACITY_END, heroRevealFrame } from '../animation/heroReveal.js';

/** One native sticky stage. ScrollTrigger supplies progress; Lenis only smooths desktop wheel input. */
export function useScrollScene(sceneRef, mediaRef, checkerRef, endingRef) {
  let disposed = false;
  let cleanup = () => {};
  let navigate = () => {};

  onMounted(async () => {
    // Browser-dependent packages are evaluated only after mounting (also safe in Nuxt SSR).
    const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
      import('gsap'), import('gsap/ScrollTrigger'), import('lenis'),
    ]);
    if (disposed) return;
    gsap.registerPlugin(ScrollTrigger);
    const scene = sceneRef.value;
    const ending = endingRef?.value?.root;
    const faq = ending?.querySelector('.faq-reveal-composition');
    const previousScale = scene.style.getPropertyValue('--layout-scale');
    const previousHeight = scene.style.height;
    const media = gsap.matchMedia();
    let mediaScroll;
    let restorePosition = () => {};
    // Killing the only ScrollTrigger clears its recorded scroll position.
    // Keep the browser's already-clamped position across a media-query rebuild.
    const rememberMediaScroll = () => { mediaScroll = window.scrollY; };
    const restoreMediaScroll = () => {
      if (!disposed && mediaScroll !== undefined) {
        restorePosition(mediaScroll);
        ScrollTrigger.refresh();
      }
      mediaScroll = undefined;
    };
    gsap.addEventListener('matchMediaInit', rememberMediaScroll);
    gsap.addEventListener('matchMedia', restoreMediaScroll);

    media.add({ always: 'all', reduced: '(prefers-reduced-motion: reduce)', fine: '(pointer: fine)', mobile: '(max-width: 700px)' }, context => {
      const { reduced, fine, mobile } = context.conditions;
      let lenis;
      let sceneContext;
      let timeline;
      let trigger;
      let resizeTimer;
      let revealDelay;
      let buttonTween;
      let focusDelay;
      let active = true;
      let geometry;
      let signature;
      const tick = time => lenis?.raf(time * 1000);
      if (!reduced && fine && !mobile) {
        lenis = new Lenis({
          autoRaf: false, lerp: 0.11, smoothWheel: true, syncTouch: false,
          prevent: node => {
            if (node.closest?.('[data-lenis-prevent]')) return true;
            const checker = node.closest?.('.device-checker');
            return Boolean(checker && checker.scrollHeight > checker.clientHeight && getComputedStyle(checker).overflowY === 'auto');
          },
        });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(tick);
      }

      const keyboardIsOpen = () => {
        const viewport = window.visualViewport;
        return viewport && window.innerHeight - viewport.height - viewport.offsetTop > 100;
      };
      const rebuild = (force = false) => {
        if (!active || disposed || (keyboardIsOpen() && geometry?.width === window.innerWidth)) return;
        const nextSignature = `${window.innerWidth}:${window.innerHeight}`;
        if (!force && signature === nextSignature) return;
        signature = nextSignature;
        const oldButtonProgress = timeline?.data?.buttonReveal ?? 0;
        revealDelay?.kill(); revealDelay = undefined;
        buttonTween?.kill(); buttonTween = undefined;
        sceneContext?.revert();
        geometry = getLayout(window.innerWidth, window.innerHeight);
        // Append the same scroll distance as the original Hero entrance.
        // Existing tracks retain their positions and the shared scrub.
        // Round the layout extension up so offsetHeight cannot shorten the
        // timeline and rescale any preceding track by a fractional pixel.
        if (ending) scene.style.height = `calc(4500svh + ${Math.ceil(HERO_REVEAL_SCROLL_DISTANCE * geometry.height)}px)`;
        scene.style.setProperty('--layout-scale', geometry.scale.toFixed(5));
        ending?.style.setProperty('--ending-overlap', `${geometry.height}px`);
        const sceneEnd = scene.getBoundingClientRect().top + window.scrollY + scene.offsetHeight - geometry.height;
        const renderRoulette = createRouletteRenderer(scene);
        const renderChip = createChipStoryRenderer(scene, mediaRef.value);
        const state = { ...Object.fromEntries(Object.keys(TRACKS).map(key => [key, 0])), buttonReveal: oldButtonProgress };
        let rendering = false;
        const render = () => {
          if (!active || rendering) return;
          rendering = true;
          if (mobile) state.buttonReveal = 1;
          else if (state.curtain >= 0.999 && state.buttonReveal < 0.999 && !revealDelay && !buttonTween) {
            revealDelay = gsap.delayedCall(reduced ? 0 : 1, () => {
              revealDelay = undefined;
              buttonTween = gsap.to(state, { buttonReveal: 1, duration: reduced ? 0 : 0.32, ease: 'power2.out', onUpdate: render });
            });
          } else if (!mobile && state.curtain < 0.999) {
            revealDelay?.kill(); revealDelay = undefined;
            buttonTween?.kill(); buttonTween = undefined;
            state.buttonReveal = 0;
          }
          renderRoulette(state, geometry, reduced);
          renderChip(state, geometry, reduced);
          if (ending) {
            // Follow the curtain's edge, then hold the white surface at the
            // viewport top while FAQ enters. At the extended sticky end this
            // offset becomes zero and ordinary document scrolling resumes.
            // Use the actual sticky end: svh and innerHeight can differ while
            // mobile browser chrome expands or collapses.
            const target = Math.min(1, 1 + (window.scrollY - sceneEnd) / geometry.height);
            const offset = target > 0 || state.resultCurtain > 0 ? (target - state.resultCurtain) * geometry.height : 0;
            ending.style.setProperty('--ending-reveal-offset', `${offset}px`);
            const covered = state.resultCurtain >= 0.99999;
            const intro = heroRevealFrame(state.faqReveal, mobile ? 347 - 64 : 548 - 96, 0, FAQ_REVEAL_OPACITY_END);
            faq.style.visibility = covered ? 'visible' : 'hidden';
            faq.style.transform = `translate3d(0, ${reduced ? 0 : intro.y}px, 0)`;
            // Hide the whole composition, including descendants with their own
            // visibility transitions, until the curtain completely covers the checker.
            faq.style.opacity = !covered ? '0' : reduced ? '1' : intro.opacity.toFixed(4);
            const ready = covered && (reduced || state.faqReveal >= 0.99999);
            faq.inert = !(covered && (reduced || state.faqReveal >= FAQ_REVEAL_OPACITY_END));
            ending.dataset.faqReady = String(ready);
          }
          rendering = false;
        };
        sceneContext = gsap.context(() => {
          timeline = gsap.timeline({ paused: true, onUpdate: render, data: state });
          const units = Math.max((scene.offsetHeight - geometry.height) / geometry.height, 1);
          timeline.to({ hold: 0 }, { hold: 1, duration: units, ease: 'none' }, 0);
          for (const [key, [start, end, value, ease]] of Object.entries(TRACKS)) {
            timeline.fromTo(state, { [key]: 0 }, {
              [key]: value, duration: end - start, ease: ease === 'smooth' ? t => smoothstep(0, 1, t) : 'none', immediateRender: false,
            }, start);
          }
          trigger = ScrollTrigger.create({
            trigger: scene, animation: timeline, start: 'top top',
            end: () => `+=${Math.max(scene.offsetHeight - geometry.height, 1)}`,
            scrub: reduced ? true : 0.24, invalidateOnRefresh: true,
            // Refresh restores GSAP's playhead with callbacks suppressed. Our
            // media/geometry renderer must also run after that restoration.
            onRefresh: render,
          });
          // Initialize deterministically at restored browser scroll positions.
          timeline.totalProgress(trigger.progress, false);
          render();
        }, scene);
        lenis?.resize();
        ScrollTrigger.refresh();
      };
      const resize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => rebuild(), 120);
      };
      const fontsReady = () => { if (active && !disposed) rebuild(true); };
      rebuild(true);
      window.addEventListener('resize', resize, { passive: true });
      window.addEventListener('orientationchange', resize, { passive: true });
      document.fonts?.ready.then(fontsReady);
      restorePosition = top => {
        if (!active) return;
        // Lenis.scrollTo can skip a target that equals its cached position
        // while ScrollTrigger has temporarily moved the native scroller to 0.
        window.scrollTo({ top, behavior: 'instant' });
        lenis?.resize();
        ScrollTrigger.update();
        timeline.totalProgress(trigger.progress, false);
      };
      navigate = () => {
        if (!active) return;
        const target = scene.getBoundingClientRect().top + window.scrollY + geometry.height * 40.2;
        focusDelay?.kill();
        const focus = () => {
          focusDelay = gsap.delayedCall(reduced ? 0 : 0.35, () => { if (active) checkerRef.value?.focusInput(); });
        };
        if (lenis) lenis.scrollTo(target, { duration: 1.2, onComplete: focus });
        else {
          window.scrollTo({ top: target, behavior: 'instant' });
          ScrollTrigger.update();
          focus();
        }
      };
      return () => {
        active = false;
        clearTimeout(resizeTimer);
        window.removeEventListener('resize', resize);
        window.removeEventListener('orientationchange', resize);
        revealDelay?.kill(); buttonTween?.kill(); focusDelay?.kill();
        sceneContext?.revert();
        gsap.ticker.remove(tick);
        lenis?.off('scroll', ScrollTrigger.update);
        lenis?.destroy();
        navigate = () => {};
        restorePosition = () => {};
      };
    });
    cleanup = () => {
      gsap.removeEventListener('matchMediaInit', rememberMediaScroll);
      gsap.removeEventListener('matchMedia', restoreMediaScroll);
      media.revert();
      if (previousScale) scene.style.setProperty('--layout-scale', previousScale);
      else scene.style.removeProperty('--layout-scale');
      scene.style.height = previousHeight;
      ending?.style.removeProperty('--ending-overlap');
      ending?.style.removeProperty('--ending-reveal-offset');
      if (ending) delete ending.dataset.faqReady;
    };
  });
  onScopeDispose(() => { disposed = true; cleanup(); });
  return { goToChecker: () => navigate() };
}
