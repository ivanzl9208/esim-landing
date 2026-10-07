// Local-only interaction fixture; never imported by the production entry.
import { createApp, nextTick } from 'vue';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import App from '../src/App.vue';
import 'lenis/dist/lenis.css';
import '../src/styles/reference.css';
import '../src/styles/accessibility.css';

const params = new URLSearchParams(location.search);
if (params.has('reduce')) {
  const originalMatchMedia = window.matchMedia.bind(window);
  const reduced = Object.assign(new EventTarget(), { matches: true, media: '(prefers-reduced-motion: reduce)' });
  reduced.addListener = callback => reduced.addEventListener('change', callback);
  reduced.removeListener = callback => reduced.removeEventListener('change', callback);
  window.matchMedia = query => query === reduced.media ? reduced : originalMatchMedia(query);
}
const events = [];
let keyboard = false;
let keyboardInset = 0;
const viewport = new EventTarget();
Object.defineProperties(viewport, {
  height: { get: () => innerHeight - keyboardInset }, width: { get: () => innerWidth },
  offsetTop: { value: 0 }, offsetLeft: { value: 0 }, scale: { value: 1 },
});
if (params.has('keyboard')) Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
const app = createApp(App);
app.config.errorHandler = (error, _instance, info) => { events.push({ name: 'vue-error', message: String(error), info }); };
window.addEventListener('unhandledrejection', event => events.push({ name: 'rejection', message: String(event.reason) }));
app.mount('#app');
const checker = () => document.getElementById('device-checker');
const input = () => checker().querySelector('input');
const report = document.getElementById('report');
const read = () => {
  const section = checker();
  const field = input();
  const result = { query: field?.value,
    state: section.className, expanded: field?.getAttribute('aria-expanded'),
    top: section.getBoundingClientRect().top, internalScroll: section.scrollTop,
    focused: document.activeElement?.tagName, heading: section.querySelector('.checker-result-copy h2')?.textContent,
    panelInert: section.querySelector('.checker-panel').inert,
    progress: ScrollTrigger.getAll().find(trigger => trigger.trigger?.classList.contains('scroll-scene'))?.progress, keyboardInset,
    lenis: document.documentElement.classList.contains('lenis'),
  };
  report.textContent = JSON.stringify({ events, ...result });
  document.getElementById('summary').textContent = JSON.stringify(result);
};
for (const name of ['pointerdown', 'touchstart', 'pointerup', 'touchend', 'pointercancel', 'mousedown', 'mouseup', 'click', 'blur']) {
  checker().addEventListener(name, event => {
    events.push({ name, type: event.pointerType, target: event.target.className, query: input()?.value, y: scrollY, time: Math.round(performance.now()) });
  }, true);
}
window.addEventListener('scroll', () => {
  events.push({ name: 'page-scroll', y: scrollY, state: checker().className, time: Math.round(performance.now()) });
});
if (params.has('keyboard')) {
  checker().addEventListener('focusin', event => {
    if (event.target !== input()) return;
    keyboard = true; keyboardInset = 280; viewport.dispatchEvent(new Event('resize'));
  });
  checker().addEventListener('focusout', event => {
    if (event.target.tagName !== 'INPUT' || !keyboard) return;
    keyboard = false;
    // Simulate the viewport expanding in stages and Safari's final scroll adjustment.
    setTimeout(() => { keyboardInset = 140; viewport.dispatchEvent(new Event('resize')); }, 100);
    setTimeout(() => { keyboardInset = 0; viewport.dispatchEvent(new Event('resize')); }, 220);
    setTimeout(() => {
      window.scrollTo({ top: checker().getBoundingClientRect().top + scrollY + 120, behavior: 'instant' });
      viewport.dispatchEvent(new Event('scroll'));
      events.push({ name: 'keyboard-settled', y: scrollY });
    }, 300);
  });
}
document.getElementById('start').onclick = async () => {
  events.length = 0;
  window.scrollTo({ top: checker().getBoundingClientRect().top + scrollY + 100, behavior: 'instant' });
  // Let the existing scroll entrance release inert before focusing the field.
  await new Promise(resolve => setTimeout(resolve, 350));
  input().focus({ preventScroll: true });
  input().value = 'Айфон';
  input().dispatchEvent(new Event('input', { bubbles: true }));
  read();
};
const touch = async cancel => {
  const option = checker().querySelector('.checker-option');
  const rect = option.getBoundingClientRect();
  const base = { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0,
    clientX: rect.x + 20, clientY: rect.y + 20 };
  option.dispatchEvent(new PointerEvent('pointerdown', base));
  input().blur();
  await nextTick();
  const hit = document.elementFromPoint(base.clientX, base.clientY);
  events.push({ name: 'hit-after-blur', target: hit?.className });
  if (cancel) {
    option.dispatchEvent(new PointerEvent('pointermove', { ...base, clientY: base.clientY + 30 }));
    option.dispatchEvent(new PointerEvent('pointercancel', base));
    option.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
  } else hit?.dispatchEvent(new PointerEvent('pointerup', base));
  await nextTick(); read();
  setTimeout(read, 1500);
};
document.getElementById('tap').onclick = () => touch(false);
document.getElementById('pan').onclick = () => touch(true);
document.getElementById('read').onclick = read;
read();
