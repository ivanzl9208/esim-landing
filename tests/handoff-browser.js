// Development-only fixture; not part of the production entry.
import { createApp } from 'vue';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import App from '../src/App.vue';
import { TRACKS, SCENE_SCROLL_END } from '../src/animation/timing.js';
import 'lenis/dist/lenis.css';
import '../src/styles/reference.css';
import '../src/styles/accessibility.css';

createApp(App).mount('#app');
document.getElementById('inspect-handoff').onclick = () => {
  const rect = selector => {
    const element = document.querySelector(selector);
    const bounds = element?.getBoundingClientRect();
    return bounds ? { top: bounds.top, bottom: bounds.bottom, height: bounds.height } : null;
  };
  const video = document.querySelector('.chip-scroll-video');
  const scene = ScrollTrigger.getAll().find(trigger => trigger.trigger?.classList.contains('scroll-scene'));
  const report = document.getElementById('handoff-state');
  report.hidden = !report.hidden;
  report.textContent = JSON.stringify({ innerHeight, visualHeight: visualViewport?.height,
    timeline: scene?.animation?.time(), playback: scene?.animation?.data?.playback,
    stage: rect('.hero-stage'), button: rect('.roulette-button'),
    video: { format: video?.dataset.videoFormat, time: video?.currentTime,
      ready: video?.readyState, paused: video?.paused, duration: video?.duration,
      seeking: video?.seeking, error: video?.error?.code },
  }, null, 2);
};
document.querySelectorAll('[data-offset]').forEach(button => {
  button.addEventListener('click', () => {
    const scene = ScrollTrigger.getAll().find(trigger => trigger.trigger?.classList.contains('scroll-scene'));
    if (!scene) return;
    const time = TRACKS.definition[1] + Number(button.dataset.offset);
    window.scrollTo({ top: scene.start + time / SCENE_SCROLL_END * (scene.end - scene.start), behavior: 'instant' });
  });
});
