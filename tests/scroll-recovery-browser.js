// Local browser regression fixture. Never imported by the production entry.
import { createApp } from 'vue';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import App from '../src/App.vue';
import { TRACKS } from '../src/animation/timing.js';
import { storyMotionFrame } from '../src/animation/storyMotion.js';
import { checkerEntranceFrame } from '../src/animation/checkerEntrance.js';
import 'lenis/dist/lenis.css';
import '../src/styles/reference.css';
import '../src/styles/accessibility.css';

createApp(App).mount('#app');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
window.runScrollRecoveryChecks = async () => {
  await document.fonts.ready;
  const scene = document.querySelector('.scroll-scene');
  const section = document.querySelector('.device-checker');
  const panel = section.querySelector('.checker-panel');
  for (let i = 0; i < 50 && !scene.style.height; i++) await wait(50);
  await wait(200);
  const trigger = ScrollTrigger.getAll().find(value => value.trigger === scene);
  const unit = (trigger.end - trigger.start) / trigger.animation.duration();
  const checkerTop = section.getBoundingClientRect().top + scrollY;
  const height = innerHeight;
  const nativeScroll = window.scrollTo.bind(window);
  const scrollCalls = [];
  const descriptor = Object.getOwnPropertyDescriptor(window, 'innerHeight');
  window.scrollTo = (...args) => { scrollCalls.push(args); nativeScroll(...args); };
  try {
    nativeScroll({ top: checkerTop + height * .6, behavior: 'instant' });
    await wait(1600);
    const before = scrollY;
    scrollCalls.length = 0;
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: height + 80 });
    window.dispatchEvent(new Event('resize'));
    await wait(300);
    const toolbar = { pass: scrollCalls.length === 0 && scrollY === before, before, after: scrollY, scrollCalls: scrollCalls.length };
    Object.defineProperty(window, 'innerHeight', descriptor);
    window.dispatchEvent(new Event('resize'));
    await wait(300);

    // The visible checker must share the scrubbed playhead in both directions,
    // including while still moving; a second follower used to trail it by .75s.
    const from = TRACKS.outro[0] + .1;
    const to = TRACKS.outro[1] - .1;
    const traces = [];
    for (const reverse of [false, true]) {
      nativeScroll({ top: unit * (reverse ? to : from), behavior: 'instant' });
      await wait(1600);
      const start = performance.now();
      const samples = [];
      await new Promise(resolve => {
        const sample = now => {
          nativeScroll({ top: unit * (reverse ? from : to), behavior: 'instant' });
          const progress = storyMotionFrame(trigger.animation.time()).outro;
          const expected = checkerEntranceFrame(progress, { height: innerHeight, scale: parseFloat(scene.style.getPropertyValue('--layout-scale')) });
          samples.push({ time: now - start, y: new DOMMatrix(getComputedStyle(panel).transform).m42, expected: expected.y });
          if (now - start < 1200) requestAnimationFrame(sample); else resolve();
        };
        requestAnimationFrame(sample);
      });
      const maxError = Math.max(...samples.map(sample => Math.abs(sample.y - sample.expected)));
      traces.push({ reverse, maxError, pass: maxError < .02, samples });
    }
    return { toolbar, traces, pass: toolbar.pass && traces.every(trace => trace.pass) };
  } finally {
    Object.defineProperty(window, 'innerHeight', descriptor);
    window.scrollTo = nativeScroll;
    window.dispatchEvent(new Event('resize'));
  }
};
