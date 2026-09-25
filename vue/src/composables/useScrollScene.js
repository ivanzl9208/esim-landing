import { onMounted, onScopeDispose } from 'vue';
import { TRACKS, SCENE_SCROLL_END, getLayout } from '../animation/timing.js';
import { createRouletteRenderer } from '../animation/roulette.js';
import { createChipStoryRenderer } from '../animation/chipStory.js';
import { createCheckerEntrance } from '../animation/checkerEntrance.js';
import { smoothstep } from '../animation/math.js';

/** One native sticky stage. ScrollTrigger supplies progress; Lenis only smooths desktop wheel input. */
export function useScrollScene(sceneRef, mediaRef, checkerRef) {
  let disposed = false;
  let cleanup = () => {};
  let navigate = () => {};

  onMounted(async () => {
    // Browser-dependent packages are evaluated only after mounting (also safe in Nuxt SSR).
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'), import('gsap/ScrollTrigger'),
    ]);
    if (disposed) return;
    gsap.registerPlugin(ScrollTrigger);
    const scene = sceneRef.value;
    const previousScale = scene.style.getPropertyValue('--layout-scale');
    const previousHeight = scene.style.height;
    const previousMargin = scene.style.marginBottom;
    let scrollUnit = window.innerHeight;
    let scrollWidth = window.innerWidth;
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
      let renderEntrance = () => {};
      const checkerEntrance = createCheckerEntrance(checkerRef.value.section);
      const tick = time => lenis?.raf(time * 1000);
      if (!reduced && fine && !mobile) {
        import('lenis').then(({ default: Lenis }) => {
          if (!active || disposed) return;
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
          lenis.resize();
        });
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
        const checkerElement = checkerRef.value.section;
        const oldCheckerTop = checkerElement.getBoundingClientRect().top + window.scrollY;
        const flowOffset = geometry && window.scrollY >= oldCheckerTop - geometry.height
          ? window.scrollY - oldCheckerTop : null;
        if (scrollWidth !== window.innerWidth) {
          scrollWidth = window.innerWidth;
          scrollUnit = window.innerHeight;
        }
        const oldButtonProgress = timeline?.data?.buttonReveal ?? 0;
        revealDelay?.kill(); revealDelay = undefined;
        buttonTween?.kill(); buttonTween = undefined;
        sceneContext?.revert();
        geometry = getLayout(window.innerWidth, window.innerHeight);
        // Preserve preceding animation distances, then hold the finished checker
        // briefly within this same stage before the document-flow handoff.
        // Mobile browser chrome changes the visible height, not the already
        // traversed scroll distance. Keep the checker's document top stable.
        scene.style.height = `${Math.ceil(SCENE_SCROLL_END * scrollUnit) + geometry.height}px`;
        scene.style.marginBottom = `-${geometry.height}px`;
        scene.style.setProperty('--layout-scale', geometry.scale.toFixed(5));
        const renderRoulette = createRouletteRenderer(scene);
        const renderChip = createChipStoryRenderer(scene, mediaRef.value);
        const state = { ...Object.fromEntries(Object.keys(TRACKS).map(key => [key, 0])), buttonReveal: oldButtonProgress };
        const checkerTop = checkerElement.getBoundingClientRect().top + window.scrollY;
        renderEntrance = () => checkerEntrance.render(state.outro, geometry, reduced, window.scrollY < checkerTop);
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
          // The pinned story is always in the viewport, so visibility cannot
          // tell us when to fetch its media. Prepare two scroll units early.
          if (timeline?.time() >= TRACKS.reveal[0] - 2) mediaRef.value?.prepare();
          renderChip(state, geometry, reduced);
          renderEntrance();
          rendering = false;
        };
        sceneContext = gsap.context(() => {
          timeline = gsap.timeline({ paused: true, onUpdate: render, data: state });
          const units = Math.max((scene.offsetHeight - geometry.height) / scrollUnit, 1);
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
        if (flowOffset !== null) {
          const top = checkerElement.getBoundingClientRect().top + window.scrollY + flowOffset;
          if (Math.abs(top - window.scrollY) > 0.5) {
            if (lenis) lenis.scrollTo(top, { immediate: true });
            else window.scrollTo({ top, behavior: 'instant' });
            ScrollTrigger.update();
            timeline.totalProgress(trigger.progress, false);
          }
        }
      };
      const resize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => rebuild(), 120);
      };
      const fontsReady = () => { if (active && !disposed) rebuild(true); };
      rebuild(true);
      window.addEventListener('resize', resize, { passive: true });
      // The fixed-to-flow handoff must also update outside the timeline's range.
      const scroll = () => renderEntrance();
      window.addEventListener('scroll', scroll, { passive: true });
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
        const target = checkerRef.value.section.getBoundingClientRect().top + window.scrollY;
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
        window.removeEventListener('scroll', scroll);
        window.removeEventListener('orientationchange', resize);
        revealDelay?.kill(); buttonTween?.kill(); focusDelay?.kill();
        sceneContext?.revert();
        checkerEntrance.clear();
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
      scene.style.marginBottom = previousMargin;
    };
  });
  onScopeDispose(() => { disposed = true; cleanup(); });
  return { goToChecker: () => navigate() };
}
