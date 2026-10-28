<script setup>
import { onMounted, onScopeDispose, ref } from 'vue';
import { clamp, smoothstep } from '../animation/math.js';

const root = ref(null);
const percent = ref(0);
const keyboardOpen = ref(false);
const visible = ref(false);
let setScene = () => {};
let cleanup = () => {};
defineExpose({ setScene: (...args) => setScene(...args) });

onMounted(() => {
  let frame = 0;
  let range = 0;
  let measure = true;
  let disposed = false;
  let faqLimit = Infinity;
  let bounds;
  let sceneState;
  let sceneWidth;
  const viewport = window.visualViewport;
  const present = () => {
    if (!bounds || !sceneState) return;
    if (bounds.width <= 0) {
      if (visible.value) root.value.style.opacity = '0';
      visible.value = false;
      return;
    }
    const opacity = keyboardOpen.value ? 0
      : smoothstep(0, .04, sceneState.introText) * smoothstep(0, 64, faqLimit - window.scrollY);
    root.value.style.opacity = String(opacity);
    visible.value = opacity > .001;
    // A clipped white copy follows the orange shutter's actual edges. It
    // stays pure white on orange, including while the shutter is opening.
    // The dark copy underneath remains readable on the white/grey stage.
    const reveal = clamp(sceneState.reveal);
    const left = clamp((sceneWidth * (1 - reveal) / 2 - bounds.left) / bounds.width);
    const right = clamp((bounds.right - sceneWidth * (1 + reveal) / 2) / bounds.width);
    const whiteStart = left;
    const whiteEnd = Math.max(whiteStart, 1 - right);
    const grey = clamp(sceneState.background * (1 - sceneState.returnGradient));
    root.value.style.setProperty('--white-progress-start', `${whiteStart * 100}%`);
    root.value.style.setProperty('--white-progress-end', `${whiteEnd * 100}%`);
    root.value.style.setProperty('--white-progress-inset', `0 ${(1 - whiteEnd) * 100}% 0 ${whiteStart * 100}%`);
    root.value.style.setProperty('--white-progress-opacity', String(1 - grey));
    root.value.style.setProperty('--dark-progress-center-opacity', String(grey));
  };
  setScene = (state, geometry) => {
    sceneState = state;
    sceneWidth = geometry.width;
    present();
  };
  const render = () => {
    frame = 0;
    if (disposed) return;
    if (measure) {
      range = Math.max((document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight, 0);
      keyboardOpen.value = Boolean(viewport && window.innerHeight - viewport.height > 150);
      bounds = root.value.getBoundingClientRect();
      const faq = document.querySelector('#esim-faq');
      faqLimit = faq ? faq.getBoundingClientRect().top + window.scrollY - window.innerHeight : Infinity;
      measure = false;
    }
    if (bounds.width <= 0) { present(); return; }
    const progress = range > 0 ? Math.min(Math.max(window.scrollY / range, 0), 1) : 0;
    // One inherited property updates both colour layers. Width (rather than
    // scaleX) preserves the circular end cap at every progress value.
    root.value.style.setProperty('--scroll-progress', String(progress));
    percent.value = Math.round(progress * 100);
    present();
  };
  const schedule = () => {
    if (!measure && bounds?.width === 0) return;
    if (!frame && !disposed) frame = requestAnimationFrame(render);
  };
  const resize = () => { measure = true; schedule(); };
  const observer = new ResizeObserver(resize);
  observer.observe(document.body);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  viewport?.addEventListener('resize', resize, { passive: true });
  document.fonts?.ready.then(() => { if (!disposed) resize(); });
  schedule();
  cleanup = () => {
    disposed = true;
    setScene = () => {};
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', resize);
    viewport?.removeEventListener('resize', resize);
  };
});
onScopeDispose(() => cleanup());
</script>

<template>
  <div ref="root" class="scroll-progress" aria-hidden="true">
    <div v-for="tone in ['dark', 'white']" :key="tone" class="scroll-progress-content"
      :class="`scroll-progress-${tone}`" aria-hidden="true">
      <span class="scroll-progress-label">Дальше</span>
      <span class="scroll-progress-track"><span class="scroll-progress-fill" /></span>
      <span class="scroll-progress-percent">{{ percent }}%</span>
    </div>
  </div>
</template>

<style scoped>
@font-face {
  font-family: "SB Sans Text Medium";
  src: url("/assets/SBSansText-Medium.woff2") format("woff2");
  font-style: normal;
  font-weight: 500;
  font-display: swap;
}
.scroll-progress {
  position: fixed;
  z-index: 60;
  right: max(28px, env(safe-area-inset-right));
  bottom: max(24px, env(safe-area-inset-bottom));
  width: min(280px, calc(100vw - 56px));
  color: #303334;
  opacity: 0;
  pointer-events: none;
  user-select: none;
  font-family: "SB Sans Text Medium", "SB Sans Text", Arial, sans-serif;
  font-size: 15px;
  font-weight: 500;
  line-height: 20px;
}
.scroll-progress-content { display: flex; align-items: center; gap: 14px; }
.scroll-progress-dark {
  /* Remove the dark copy below the orange/white copy. Without this mask two
     25% tracks blend together and neither endpoint has the specified colour. */
  -webkit-mask-image: linear-gradient(to right,
    #000 0 var(--white-progress-start, 50%),
    rgba(0, 0, 0, var(--dark-progress-center-opacity, 0)) var(--white-progress-start, 50%) var(--white-progress-end, 50%),
    #000 var(--white-progress-end, 50%) 100%);
  mask-image: linear-gradient(to right,
    #000 0 var(--white-progress-start, 50%),
    rgba(0, 0, 0, var(--dark-progress-center-opacity, 0)) var(--white-progress-start, 50%) var(--white-progress-end, 50%),
    #000 var(--white-progress-end, 50%) 100%);
}
.scroll-progress-white {
  position: absolute;
  inset: 0;
  color: #fff;
  clip-path: inset(var(--white-progress-inset, 0 50%));
  opacity: var(--white-progress-opacity, 0);
}
.scroll-progress-label { flex-shrink: 0; }
.scroll-progress-track {
  position: relative;
  flex: 1;
  height: 2px;
  overflow: hidden;
  border-radius: 999px;
}
.scroll-progress-track::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}
.scroll-progress-dark .scroll-progress-track::before { background: rgba(48, 51, 52, .25); }
.scroll-progress-white .scroll-progress-track::before { background: rgba(255, 255, 255, .25); }
.scroll-progress-fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: calc(var(--scroll-progress, 0) * 100%);
  background: currentColor;
  border-radius: inherit;
}
.scroll-progress-percent {
  width: 4ch;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
@media (max-width: 700px) {
  .scroll-progress {
    right: 4px;
    bottom: 4px;
    left: 4px;
    width: auto;
  }
  .scroll-progress-content { display: block; }
  .scroll-progress-label,
  .scroll-progress-percent { display: none; }
  .scroll-progress-track { display: block; width: 100%; height: 2px; }
}
</style>
