import { onMounted, onScopeDispose } from 'vue';
import { TRACKS, SCENE_SCROLL_END, getLayout } from '../animation/timing.js';
import { createIntroTextRenderer } from '../animation/introText.js';
import { createChipStoryRenderer } from '../animation/chipStory.js';
import { createCheckerEntrance } from '../animation/checkerEntrance.js';
import { reverseCheckerScroll } from '../animation/checkerHold.js';
import { createAutoTransitions } from '../animation/autoTransitions.js';
import { createChipRotation } from '../animation/chipRotation.js';
import { smoothstep } from '../animation/math.js';
import { captureScenePosition, restoreScenePosition } from '../animation/scenePosition.js';
import { storyComposition } from '../animation/storyComposition.js';
import { storyMotionFrame, advanceStoryMotion } from '../animation/storyMotion.js';
import { STORY_BENEFITS } from '../data/story.js';

/** One native sticky stage. ScrollTrigger supplies progress; Lenis only smooths desktop wheel input. */
export function useScrollScene(sceneRef, mediaRef, checkerRef, progressRef) {
  let disposed = false;
  let cleanup = () => {};
  let navigate = () => {};
  let anchorResult = async () => {};
  let positionViewport = top => window.scrollTo({ top, behavior: 'instant' });

  onMounted(async () => {
    // Browser-dependent packages are evaluated only after mounting (also safe in Nuxt SSR).
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'), import('gsap/ScrollTrigger'),
    ]);
    if (disposed) return;
    gsap.registerPlugin(ScrollTrigger);
    // Safari's address bar changes innerHeight repeatedly during one touch
    // gesture. Those small changes must not refresh the scrubbed timeline.
    ScrollTrigger.config({ ignoreMobileResize: true });
    const scene = sceneRef.value;
    const previousScale = scene.style.getPropertyValue('--layout-scale');
    const previousHeight = scene.style.height;
    const previousMargin = scene.style.marginBottom;
    let scrollUnit = window.innerHeight;
    let scrollWidth = window.innerWidth;
    const media = gsap.matchMedia();
    let mediaPosition;
    let position;
    let restorePosition = () => {};
    // Media queries run after CSS has resized the scene and the browser may
    // already have clamped scrollY. Use the last stable geometry and position.
    const rememberMediaScroll = () => { mediaPosition = position; };
    const restoreMediaScroll = () => {
      if (!disposed && mediaPosition) {
        restorePosition(mediaPosition);
        ScrollTrigger.refresh();
      }
      mediaPosition = undefined;
    };
    gsap.addEventListener('matchMediaInit', rememberMediaScroll);
    gsap.addEventListener('matchMedia', restoreMediaScroll);

    media.add({ always: 'all', reduced: '(prefers-reduced-motion: reduce)', fine: '(pointer: fine)', mobile: '(max-width: 700px)' }, context => {
      const { reduced, fine, mobile } = context.conditions;
      const nativeTouch = mobile || !fine;
      let lenis;
      let sceneContext;
      let timeline;
      let trigger;
      let resizeTimer;
      let resizeFrame;
      let sceneRenderFrame;
      let revealDelay;
      let buttonTween;
      let focusDelay;
      let finishResultAnchor;
      let previousScrollY = window.scrollY;
      let active = true;
      let geometry;
      let signature;
      let positionGeometry;
      let renderEntrance = () => {};
      let renderScene = () => {};
      let settleStoryMotion = () => {};
      let advanceMotion = () => {};
      const autoTransitions = createAutoTransitions(mobile, reduced);
      const checkerEntrance = createCheckerEntrance(checkerRef.value.section);
      const tick = (time, delta) => { lenis?.raf(time * 1000); advanceMotion(delta / 1000); };
      if (!reduced) gsap.ticker.add(tick);
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
          lenis.resize();
        });
      }

      const keyboardIsOpen = () => {
        const viewport = window.visualViewport;
        return viewport && window.innerHeight - viewport.height - viewport.offsetTop > 100;
      };
      const updateGeometry = () => {
        // Keep typography and the scroll unit stable while mobile browser
        // chrome changes the live stage height. Width changes reset scrollUnit.
        geometry = { ...getLayout(window.innerWidth, (mobile || !fine) ? scrollUnit : window.innerHeight), height: window.innerHeight, dpr: window.devicePixelRatio || 1 };
        scene.style.height = `${Math.ceil(SCENE_SCROLL_END * scrollUnit) + geometry.height}px`;
        scene.style.marginBottom = `-${geometry.height}px`;
        scene.style.setProperty('--layout-scale', geometry.scale.toFixed(5));
        positionGeometry = {
          checkerTop: checkerRef.value.section.getBoundingClientRect().top + window.scrollY,
          height: geometry.height,
          sceneTop: scene.getBoundingClientRect().top + window.scrollY,
        };
      };
      const rebuild = (force = false) => {
        if (!active || disposed || (keyboardIsOpen() && geometry?.width === window.innerWidth)) return;
        const nextSignature = `${window.innerWidth}:${window.innerHeight}`;
        if (!force && signature === nextSignature) return;
        const heightOnly = !force && geometry?.width === window.innerWidth && (mobile || !fine);
        signature = nextSignature;
        const savedPosition = position;
        if (heightOnly) {
          // Browser chrome changes the live composition's height, but not its
          // scroll range. Keep the same timeline, playhead and pending scrub;
          // destroying them here snapped the curtain to the latest scrollY.
          // Native scrolling continues during the resize debounce. A stale
          // checkpoint would rewind the gesture while the address bar moves.
          updateGeometry();
          // Safari already owns the native gesture and viewport anchoring.
          // Rescaling a checker checkpoint here scrolled the form a second
          // time as the toolbar expanded on the way back from FAQ.
          lenis?.resize();
          renderScene();
          position = captureScenePosition(window.scrollY, positionGeometry);
          previousScrollY = window.scrollY;
          return;
        }
        if (scrollWidth !== window.innerWidth) {
          scrollWidth = window.innerWidth;
          scrollUnit = window.innerHeight;
        }
        const oldButtonProgress = timeline?.data?.buttonReveal ?? 0;
        revealDelay?.kill(); revealDelay = undefined;
        buttonTween?.kill(); buttonTween = undefined;
        cancelAnimationFrame(sceneRenderFrame);
        sceneRenderFrame = undefined;
        sceneContext?.revert();
        // Preserve preceding animation distances, then hold the finished checker
        // briefly within this same stage before the document-flow handoff.
        // Mobile browser chrome changes the visible height, not the already
        // traversed scroll distance. Keep the checker's document top stable.
        updateGeometry();
        const renderIntroText = createIntroTextRenderer(scene);
        const renderChip = createChipStoryRenderer(scene, mediaRef.value);
        const state = { ...Object.fromEntries(Object.keys(TRACKS).map(key => [key, 0])), buttonReveal: oldButtonProgress };
        const storyMotion = { time: 0 };
        let displayedStoryTime = 0;
        let followStory;
        let storyTarget = 0;
        let initializing = true;
        let checkerProgress = 0;
        const chipRotation = createChipRotation();
        const visualTime = () => nativeTouch || reduced ? storyMotion.time : displayedStoryTime;
        const motionFrame = () => storyMotionFrame(visualTime());
        const checkerTop = positionGeometry.checkerTop;
        renderEntrance = () => checkerEntrance.render(checkerProgress, geometry, reduced, window.scrollY < checkerTop);
        const renderChipFrame = (immediate = false) => {
          const motion = motionFrame();
          autoTransitions.update(visualTime(), motion.story, immediate || initializing || reduced);
          const side = storyComposition(motion.story, STORY_BENEFITS.length, reduced, motion.storyCenter).side;
          const renderedState = { ...state, ...motion, ...autoTransitions.frame(), storySide: side };
          // Only video rotation gets the approved 1.2s tail. Read native scroll
          // rather than stacking it after the timeline and geometry followers.
          // Gray copy/zoom use a fixed front pose, including their reverse exit.
          const nativeTime = (window.scrollY - positionGeometry.sceneTop) / scrollUnit;
          const fixedPose = visualTime() >= TRACKS.playback[1];
          const turns = fixedPose ? TRACKS.playback[2] : autoTransitions.playbackAt(nativeTime);
          chipRotation.update(turns, immediate || initializing || reduced || fixedPose || renderedState.reveal === 0);
          renderedState.playback = chipRotation.value();
          // The checker entrance follows the same playhead as the chip and copy.
          checkerProgress = renderedState.outro;
          renderChip(renderedState, geometry, reduced);
          progressRef?.value?.setScene(renderedState, geometry);
          renderEntrance();
        };
        let queueChipRender = renderChipFrame;
        advanceMotion = seconds => {
          if (!active || initializing || reduced) return;
          let changed = autoTransitions.advance(seconds);
          if (chipRotation.advance(seconds)) changed = true;
          if (!nativeTouch) {
            const next = advanceStoryMotion(displayedStoryTime, storyMotion.time, seconds);
            if (Math.abs(next - displayedStoryTime) >= 1e-9) {
              displayedStoryTime = next;
              changed = true;
            }
          }
          if (changed) queueChipRender();
        };
        let rendering = false;
        const renderNow = () => {
          if (!active || rendering) return;
          rendering = true;
          if (mobile) state.buttonReveal = 1;
          else if (state.curtain >= 0.999 && state.buttonReveal < 0.999 && !revealDelay && !buttonTween) {
            revealDelay = gsap.delayedCall(reduced ? 0 : 1, () => {
              revealDelay = undefined;
              buttonTween = gsap.to(state, { buttonReveal: 1, duration: reduced ? 0 : 0.32, ease: 'power2.out', onUpdate: renderScene });
            });
          } else if (!mobile && state.curtain < 0.999) {
            revealDelay?.kill(); revealDelay = undefined;
            buttonTween?.kill(); buttonTween = undefined;
            state.buttonReveal = 0;
          }
          renderIntroText(state, geometry, reduced);
          // The pinned story is always in the viewport, so visibility cannot
          // tell us when to fetch its media. Prepare two scroll units early.
          if (timeline?.time() >= TRACKS.reveal[0] - 2) mediaRef.value?.prepare();
          // Lateral return and subsequent zoom/copy share one follower, so
          // growth cannot start while a separate horizontal tween lags behind.
          const storyTime = timeline?.time() ?? 0;
          // Touch already has ScrollTrigger's scrub. A second .75s follower
          // both rendered this subtree twice and delayed it behind native flow.
          // Keep the shared follower through the adjacent definition screen:
          // resetting at the story edge snapped the chip from its side to centre.
          // Only a jump past that whole screen discards an obsolete gray scene
          // before earlier orange/intro content can become visible.
          const skippingStory = storyTime < TRACKS.definition[0] && displayedStoryTime >= TRACKS.story[0];
          if (initializing || reduced || nativeTouch || skippingStory) {
            followStory?.tween.pause();
            storyMotion.time = storyTarget = storyTime;
            displayedStoryTime = storyTime;
          } else if (storyTarget !== storyTime) {
            storyTarget = storyTime;
            followStory(storyTime);
          }
          renderChipFrame();
          rendering = false;
        };
        let pendingFullRender = false;
        let pendingChipRender = false;
        const flushSceneRender = () => {
          sceneRenderFrame = undefined;
          const full = pendingFullRender;
          const chip = pendingChipRender;
          pendingFullRender = pendingChipRender = false;
          if (full) renderNow();
          else if (chip) renderChipFrame();
        };
        const scheduleSceneRender = () => {
          if (sceneRenderFrame === undefined) sceneRenderFrame = requestAnimationFrame(flushSceneRender);
        };
        const render = (immediate = false) => {
          if (!nativeTouch || initializing || immediate) {
            pendingFullRender = pendingChipRender = false;
            cancelAnimationFrame(sceneRenderFrame);
            sceneRenderFrame = undefined;
            renderNow();
            return;
          }
          pendingFullRender = true;
          scheduleSceneRender();
        };
        queueChipRender = (immediate = false) => {
          if (!nativeTouch || initializing || immediate) {
            renderChipFrame(immediate);
            return;
          }
          pendingChipRender = true;
          scheduleSceneRender();
        };
        renderScene = render;
        settleStoryMotion = () => {
          followStory?.tween.pause();
          storyMotion.time = storyTarget = displayedStoryTime = timeline.time();
          renderChipFrame(true);
        };
        sceneContext = gsap.context(() => {
          if (!reduced && !nativeTouch) followStory = gsap.quickTo(storyMotion, 'time', {
            duration: 0.75, ease: 'power2.out',
            onUpdate: () => { if (active && !initializing) renderChipFrame(); },
          });
          timeline = gsap.timeline({ paused: true, onUpdate: render, data: state });
          const units = Math.max((scene.offsetHeight - geometry.height) / scrollUnit, 1);
          timeline.to({ hold: 0 }, { hold: 1, duration: units, ease: 'none' }, 0);
          for (const [key, [start, end, value, ease]] of Object.entries(TRACKS)) {
            timeline.fromTo(state, { [key]: 0 }, {
              [key]: value, duration: end - start, ease: ease === 'smooth' ? t => smoothstep(0, 1, t) : 'none', immediateRender: false,
            }, start);
          }
          let refreshViewport = { width: window.innerWidth, height: window.innerHeight };
          let refreshPlayhead;
          trigger = ScrollTrigger.create({
            trigger: scene, animation: timeline, start: 'top top',
            end: () => `+=${Math.max(scene.offsetHeight - geometry.height, 1)}`,
            scrub: reduced ? true : (mobile || !fine ? 0.42 : 0.24), invalidateOnRefresh: true,
            onRefreshInit: () => {
              // Some touch browsers also refresh ScrollTrigger as their bars
              // collapse. Preserve the lagging visual playhead in that case.
              const { innerWidth: width, innerHeight: height } = window;
              refreshPlayhead = !reduced && (mobile || !fine) && refreshViewport.width === width && refreshViewport.height !== height
                ? timeline.totalProgress() : undefined;
              refreshViewport = { width, height };
            },
            onRefresh: self => {
              if (refreshPlayhead !== undefined) {
                const progress = refreshPlayhead;
                refreshPlayhead = undefined;
                timeline.totalProgress(progress, false);
                self.getTween()?.resetTo('totalProgress', self.progress, progress);
              }
              // Refresh suppresses timeline callbacks; keep our DOM in sync.
              render();
            },
          });
          // Initialize deterministically at restored browser scroll positions.
          timeline.totalProgress(trigger.progress, false);
          render();
          initializing = false;
        }, scene);
        lenis?.resize();
        ScrollTrigger.refresh();
        if (savedPosition) {
          const top = restoreScenePosition(savedPosition, positionGeometry);
          if (Math.abs(top - window.scrollY) > 0.5) {
            if (lenis) lenis.scrollTo(top, { immediate: true });
            else window.scrollTo({ top, behavior: 'instant' });
            ScrollTrigger.update();
            timeline.totalProgress(trigger.progress, false);
          }
        }
        // Resize is a checkpoint restoration, not a scroll gesture. Complete
        // the pending scrub so its old playhead cannot briefly hide checker.
        trigger.getTween()?.progress?.(1);
        timeline.totalProgress(trigger.progress, false);
        render();
        position = captureScenePosition(window.scrollY, positionGeometry);
        previousScrollY = window.scrollY;
      };
      const resize = () => {
        clearTimeout(resizeTimer);
        cancelAnimationFrame(resizeFrame);
        cancelAnimationFrame(sceneRenderFrame);
        // Follow Safari's live toolbar height once per frame. A 120ms debounce
        // left the composition at its old centre, then moved it in one step.
        if (nativeTouch && geometry?.width === window.innerWidth) {
          resizeFrame = requestAnimationFrame(() => rebuild());
        } else resizeTimer = setTimeout(() => rebuild(), 120);
      };
      const fontsReady = () => { if (active && !disposed) rebuild(true); };
      rebuild(true);
      window.addEventListener('resize', resize, { passive: true });
      // The fixed-to-flow handoff must also update outside the timeline's range.
      const scroll = () => {
        // Ignore scroll clamping during resize until rebuild has restored the
        // checkpoint. Reading the new DOM here would lose the old scene point.
        if (signature === `${window.innerWidth}:${window.innerHeight}`) {
          const current = window.scrollY;
          const top = keyboardIsOpen() || finishResultAnchor ? current : reverseCheckerScroll(previousScrollY, current, {
            start: positionGeometry.sceneTop + TRACKS.outro[1] * scrollUnit,
            end: positionGeometry.checkerTop,
          });
          previousScrollY = top;
          if (top !== current) {
            // Both ends of the skipped range show the same finished checker.
            // Sync native scroll, Lenis and the scrub/follower in this event so
            // the fixed-to-flow handoff cannot flash a stale form position.
            if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
            else window.scrollTo({ top, behavior: 'instant' });
            ScrollTrigger.update();
            trigger.getTween()?.progress?.(1);
            timeline.totalProgress(trigger.progress, false);
            settleStoryMotion();
            renderScene();
          }
          position = captureScenePosition(window.scrollY, positionGeometry);
        }
        renderEntrance();
      };
      positionViewport = top => {
        // Keep wheel smoothing and native scrolling at the same position when
        // an accordion changes layout during a programmatic scroll.
        previousScrollY = top;
        if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
        else window.scrollTo({ top, behavior: 'instant' });
        ScrollTrigger.update();
      };
      window.addEventListener('scroll', scroll, { passive: true });
      window.addEventListener('orientationchange', resize, { passive: true });
      document.fonts?.ready.then(fontsReady);
      restorePosition = checkpoint => {
        if (!active) return;
        // Lenis.scrollTo can skip a target that equals its cached position
        // while ScrollTrigger has temporarily moved the native scroller to 0.
        const top = restoreScenePosition(checkpoint, positionGeometry);
        previousScrollY = top;
        window.scrollTo({ top, behavior: 'instant' });
        lenis?.resize();
        lenis?.scrollTo(top, { immediate: true, force: true });
        ScrollTrigger.update();
        trigger.getTween()?.progress?.(1);
        timeline.totalProgress(trigger.progress, false);
        renderScene();
        position = captureScenePosition(window.scrollY, positionGeometry);
      };
      anchorResult = () => new Promise(resolve => {
        if (!active) { resolve(); return; }
        // A pending CTA focus must not reopen the keyboard during a check.
        focusDelay?.kill();
        clearTimeout(resizeTimer);
        cancelAnimationFrame(resizeFrame);
        rebuild();
        const section = checkerRef.value.section;
        section.scrollTop = 0;
        const target = section.getBoundingClientRect().top + window.scrollY;
        const finish = () => {
          finishResultAnchor = undefined;
          if (active) {
            ScrollTrigger.update();
            trigger.getTween()?.progress?.(1);
            timeline.totalProgress(trigger.progress, false);
            renderScene();
            position = captureScenePosition(window.scrollY, positionGeometry);
            previousScrollY = window.scrollY;
          }
          resolve();
        };
        finishResultAnchor = finish;
        if (lenis) {
          lenis.scrollTo(target, { duration: 0.45, immediate: Math.abs(target - window.scrollY) <= 0.5, lock: true, force: true, onComplete: finish });
        } else {
          window.scrollTo({ top: target, behavior: 'instant' });
          finish();
        }
      });
      navigate = (immediate = false) => {
        if (!active) return;
        const target = checkerRef.value.section.getBoundingClientRect().top + window.scrollY;
        focusDelay?.kill();
        const focus = () => {
          // Finish the checker entrance before focusing it. With reduced
          // motion the zero-delay focus can otherwise run while it is inert.
          ScrollTrigger.update();
          trigger.getTween()?.progress?.(1);
          timeline.totalProgress(trigger.progress, false);
          renderScene();
          // A direct CTA/skip-link jump does not need to replay the hidden
          // desktop story follower after arriving at the checker.
          settleStoryMotion();
          previousScrollY = window.scrollY;
          focusDelay = gsap.delayedCall(reduced || immediate ? 0 : 0.35, () => { if (active) checkerRef.value?.focusInput(); });
        };
        if (lenis) lenis.scrollTo(target, { duration: immediate ? 0 : 1.2, immediate, force: immediate, onComplete: focus });
        else {
          window.scrollTo({ top: target, behavior: 'instant' });
          ScrollTrigger.update();
          focus();
        }
      };
      return () => {
        active = false;
        finishResultAnchor?.();
        clearTimeout(resizeTimer);
        cancelAnimationFrame(resizeFrame);
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
        anchorResult = async () => {};
        positionViewport = top => window.scrollTo({ top, behavior: 'instant' });
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
  return {
    goToChecker: () => navigate(),
    prepareCheckerResult: () => anchorResult(),
    setScrollPosition: top => positionViewport(top),
  };
}
