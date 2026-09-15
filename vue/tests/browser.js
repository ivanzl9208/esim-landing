// Development-only fixture, excluded from the production HTML entry.
import { createApp } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import App from '../src/App.vue';
import { MEDIA_BROWSERS } from './fixtures/mediaBrowsers.js';
import 'lenis/dist/lenis.css';
import '../src/styles/reference.css';
import '../src/styles/accessibility.css';

gsap.registerPlugin(ScrollTrigger);
const baselineAnimations = new Set(gsap.globalTimeline.getChildren(true, true, true));
const params = new URLSearchParams(location.search);
const report = document.getElementById('test-report');
const ticks = new Set();
const originalAdd = gsap.ticker.add;
const originalRemove = gsap.ticker.remove;
gsap.ticker.add = function (callback, ...args) { const result = originalAdd.call(this, callback, ...args); ticks.add(callback); return result; };
gsap.ticker.remove = function (callback) { ticks.delete(callback); return originalRemove.call(this, callback); };
const originalMatchMedia = window.matchMedia.bind(window);
const reducedMedia = new EventTarget();
reducedMedia.matches = params.has('reduce');
reducedMedia.media = '(prefers-reduced-motion: reduce)';
reducedMedia.addListener = cb => reducedMedia.addEventListener('change', cb);
reducedMedia.removeListener = cb => reducedMedia.removeEventListener('change', cb);
window.matchMedia = query => {
  if (query === reducedMedia.media) return reducedMedia;
  const result = originalMatchMedia(query);
  if (params.has('touch') && query === '(pointer: fine)') Object.defineProperty(result, 'matches', { value: false });
  return result;
};
const browserProfile = params.get('browser') ?? (params.has('safari') ? 'safari-ios' : null);
if (browserProfile && MEDIA_BROWSERS[browserProfile]) {
  for (const key of ['userAgent', 'vendor', 'platform', 'maxTouchPoints']) {
    Object.defineProperty(navigator, key, { configurable: true, value: MEDIA_BROWSERS[browserProfile][key] });
  }
}
const fixtureLoadedAt = Date.now();
const resizeEvents = [];
window.addEventListener('resize', () => resizeEvents.push({ width: innerWidth, height: innerHeight, y: scrollY }));
let app;
const originalViewport = window.visualViewport;
let keyboardOpen = false;
const simulatedViewport = new EventTarget();
Object.defineProperties(simulatedViewport, { height: { get: () => innerHeight - 280 }, width: { get: () => innerWidth }, offsetTop: { value: 0 }, offsetLeft: { value: 0 }, scale: { value: 1 } });
document.getElementById('keyboard').onclick = () => {
  app?.unmount(); app = undefined;
  keyboardOpen = !keyboardOpen;
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: keyboardOpen ? simulatedViewport : originalViewport });
  app = createApp(App); app.mount('#test-app');
  inspect();
};
const inspect = () => {
  const video = document.querySelector('.hero-video');
  const frame = document.querySelector('.chip-scroll-frame');
  report.textContent = JSON.stringify({ fixtureLoadedAt, resizeEvents, mounted: Boolean(app), triggers: ScrollTrigger.getAll().length,
    progress: ScrollTrigger.getAll()[0]?.progress, renderedChecker: document.querySelector('.scroll-scene')?.getAttribute('data-checker-visible'), curtain: document.querySelector('.scroll-scene')?.style.getPropertyValue('--curtain-y'),
    ownedTickerCallbacks: ticks.size,
    activeTweens: gsap.globalTimeline.getChildren(true, true, true).filter(tween => tween.isActive()).length,
    ownedAnimations: gsap.globalTimeline.getChildren(true, true, true).filter(tween => !baselineAnimations.has(tween)).length,
    lenis: document.documentElement.classList.contains('lenis'), reduceMotion: reducedMedia.matches,
    browserProfile, heroSource: video?.getAttribute('src'), heroPaused: video?.paused,
    chipVideoSource: document.querySelector('.chip-scroll-video')?.getAttribute('src'),
    frame: frame?.getAttribute('src'), frameOpacity: frame ? getComputedStyle(frame).opacity : null,
    frameLoaded: Boolean(frame?.complete && frame?.naturalWidth),
    keyboardSimulated: keyboardOpen, keyboardOffset: document.querySelector('.device-checker')?.style.getPropertyValue('--checker-keyboard-offset'),
    finePointer: window.matchMedia('(pointer: fine)').matches,
    frameRequests: performance.getEntriesByType('resource').filter(r => r.name.includes('/chip-frames/')).length,
    busy: document.querySelector('.checker-form-view')?.getAttribute('aria-busy'),
  }, null, 2);
};
document.getElementById('mount').onclick = () => { if (!app) { app = createApp(App); app.mount('#test-app'); } inspect(); };
document.getElementById('unmount').onclick = () => { app?.unmount(); app = undefined; inspect(); };
document.getElementById('inspect').onclick = inspect;
document.getElementById('refresh').onclick = () => { ScrollTrigger.refresh(); inspect(); };
document.getElementById('motion').onclick = () => { reducedMedia.matches = !reducedMedia.matches; reducedMedia.dispatchEvent(new Event('change')); inspect(); };
document.getElementById('audit').onclick = async () => {
  try {
    if (!window.axe) await new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = '../.qa/axe/axe.min.js'; script.onload = resolve; script.onerror = reject; document.head.append(script);
    });
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
    const results = await window.axe.run(document.getElementById('test-app'));
    report.textContent = JSON.stringify({ axe: results.testEngine.version, violations: results.violations.map(v => ({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})), incomplete: results.incomplete.map(v=>v.id) }, null, 2);
  } catch (error) { report.textContent = 'axe unavailable: ' + String(error); }
};
inspect();
