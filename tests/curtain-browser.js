// Development-only motion trace; no production imports this fixture.
import { createApp } from 'vue';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import App from '../src/App.vue';
import 'lenis/dist/lenis.css';
import '../src/styles/reference.css';
import '../src/styles/accessibility.css';

const params = new URLSearchParams(location.search);
const originalMatchMedia = window.matchMedia.bind(window);
window.matchMedia = query => {
  if (params.has('reduce') && query === '(prefers-reduced-motion: reduce)') {
    return Object.assign(new EventTarget(), { matches: true, media: query });
  }
  return originalMatchMedia(query);
};
createApp(App).mount('#app');
const ids = new WeakMap();
let serial = 0;
let samples = [];
let measuring = false;
const scene = () => document.querySelector('.scroll-scene');
const trigger = () => ScrollTrigger.getAll().find(value => value.trigger === scene());
const inspect = () => {
  const jumps = samples.slice(1).map((sample, i) => ({ delta: Math.abs(sample.curtain - samples[i].curtain), sample }));
  document.getElementById('summary').textContent = JSON.stringify({
    frames: samples.length, instances: [...new Set(samples.map(sample => sample.id))],
    maxStep: Math.max(0, ...jumps.map(value => value.delta)),
    final: samples.at(-1), samples,
  });
};
const measure = async (reverse = false, simulateResize = false) => {
  if (measuring) return;
  measuring = true;
  samples = [];
  const unit = innerHeight;
  const heightDescriptor = Object.getOwnPropertyDescriptor(window, 'innerHeight');
  window.scrollTo({ top: reverse ? unit : 0, behavior: 'instant' });
  await new Promise(resolve => setTimeout(resolve, 350));
  const start = performance.now();
  const duration = params.has('long') ? 10000 : 2400;
  let resized = false;
  const sample = time => {
    const elapsed = time - start;
    const t = Math.min(elapsed / duration, 1);
    window.scrollTo({ top: simulateResize ? unit * .5 : unit * (reverse ? 1 - t : t), behavior: 'instant' });
    if (simulateResize && !resized && elapsed >= 70) {
      resized = true;
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: unit - 60 });
      window.dispatchEvent(new Event('resize'));
    }
    const current = trigger();
    if (current && !ids.has(current)) ids.set(current, ++serial);
    samples.push({ time: Math.round(elapsed), y: scrollY, width: innerWidth, height: innerHeight, id: ids.get(current),
      curtain: parseFloat(document.querySelector('.white-curtain').style.getPropertyValue('--curtain-y')),
      playhead: current?.animation.time(), progress: current?.progress, end: current?.end,
      duration: current?.animation.duration(), sceneHeight: scene().offsetHeight });
    if (elapsed < duration + 800) requestAnimationFrame(sample);
    else {
      if (simulateResize) Object.defineProperty(window, 'innerHeight', heightDescriptor);
      measuring = false; inspect();
    }
  };
  requestAnimationFrame(sample);
};
document.getElementById('forward').onclick = () => measure();
document.getElementById('reverse').onclick = () => measure(true);
document.getElementById('resize').onclick = () => measure(false, true);
