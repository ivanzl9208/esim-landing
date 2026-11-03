// Development-only fixture; not part of the production entry.
import { createApp } from 'vue';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import App from '../src/App.vue';
import { TRACKS, SCENE_SCROLL_END } from '../src/animation/timing.js';
import 'lenis/dist/lenis.css';
import '../src/styles/reference.css';
import '../src/styles/accessibility.css';

const params = new URLSearchParams(location.search);
if (params.has('dpr')) Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: Number(params.get('dpr')) });
createApp(App).mount('#app');
let presentedTime;
const observedVideo = document.querySelector('.chip-scroll-video');
const observeFrame = (_now, metadata) => {
  presentedTime = metadata.mediaTime;
  observedVideo.requestVideoFrameCallback(observeFrame);
};
observedVideo?.requestVideoFrameCallback?.(observeFrame);
const inspect = () => {
  const rect = selector => {
    const element = document.querySelector(selector);
    const bounds = element?.getBoundingClientRect();
    return bounds ? { top: bounds.top, bottom: bounds.bottom, height: bounds.height } : null;
  };
  const video = document.querySelector('.chip-scroll-video');
  const still = document.querySelector('.chip-scroll-still');
  const scene = ScrollTrigger.getAll().find(trigger => trigger.trigger?.classList.contains('scroll-scene'));
  const report = document.getElementById('handoff-state');
  report.hidden = false;
  report.textContent = JSON.stringify({ innerHeight, visualHeight: visualViewport?.height,
    timeline: scene?.animation?.time(), playback: scene?.animation?.data?.playback,
    stage: rect('.hero-stage'), button: rect('.roulette-button'),
    video: { format: video?.dataset.videoFormat, time: video?.currentTime,
      ready: video?.readyState, paused: video?.paused, duration: video?.duration,
      seeking: video?.seeking, error: video?.error?.code, opacity: video?.style.opacity, presentedTime },
    still: { opacity: still?.style.opacity, loaded: Boolean(still?.complete && still?.naturalWidth) },
  }, null, 2);
};
document.getElementById('inspect-handoff').onclick = () => {
  const report = document.getElementById('handoff-state');
  if (report.hidden) inspect(); else report.hidden = true;
};
const jump = time => {
  const scene = ScrollTrigger.getAll().find(trigger => trigger.trigger?.classList.contains('scroll-scene'));
  if (scene) window.scrollTo({ top: scene.start + time / SCENE_SCROLL_END * (scene.end - scene.start), behavior: 'instant' });
};
document.querySelectorAll('[data-offset], [data-zoom]').forEach(button => {
  button.addEventListener('click', () => {
    const time = button.dataset.zoom !== undefined
      ? TRACKS.chipZoom[0] + Number(button.dataset.zoom) * (TRACKS.chipZoom[1] - TRACKS.chipZoom[0])
      : TRACKS.definition[1] + Number(button.dataset.offset);
    jump(time);
  });
});
// Native simulator QA can open this deterministic checkpoint without needing
// remote Web Inspector access or modifying the production page.
if (params.has('zoom')) setTimeout(() => {
  jump(TRACKS.chipZoom[0] + Number(params.get('zoom')) * (TRACKS.chipZoom[1] - TRACKS.chipZoom[0]));
  if (!params.has('visual')) setTimeout(inspect, 3000);
}, 600);
