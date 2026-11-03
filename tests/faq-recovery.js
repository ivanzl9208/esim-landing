// Development-only regression fixture; not included in the production entry.
import { createApp } from 'vue';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import App from '../src/App.vue';
import 'lenis/dist/lenis.css';
import '../src/styles/reference.css';
import '../src/styles/accessibility.css';
createApp(App).mount('#app');
const history = [];
const sample = () => {
  const section = document.querySelector('.device-checker');
  const panel = section.querySelector('.checker-panel');
  const trigger = ScrollTrigger.getAll().find(t => t.trigger?.classList.contains('scroll-scene'));
  return { y: scrollY, checkerTop: section.getBoundingClientRect().top, entering: section.dataset.entering,
    hidden: panel.style.visibility, opacity: panel.style.opacity, inert: panel.inert,
    progress: trigger?.progress, time: trigger?.animation.time(), outro: trigger?.animation.data.outro };
};
const read = () => { document.querySelector('#report').textContent = JSON.stringify({ current: sample(), history }, null, 2); };
window.addEventListener('scroll', () => { history.push(sample()); if (history.length > 30) history.shift(); }, { passive: true });
const jump = (selector, offset = 0) => window.scrollTo({ top: document.querySelector(selector).getBoundingClientRect().top + scrollY + offset, behavior: 'instant' });
document.querySelector('#faq').onclick = () => jump('#esim-faq', -60);
document.querySelector('#checker').onclick = () => jump('.device-checker');
document.querySelector('#scene').onclick = () => jump('.device-checker', -innerHeight * 3);
let refreshCheck;
document.querySelector('#refresh').onclick = () => {
  const before = sample();
  ScrollTrigger.refresh();
  const after = sample();
  refreshCheck = { before, after, pass: before.hidden === after.hidden && before.opacity === after.opacity && before.y === after.y };
  read();
  document.querySelector('#report').textContent = JSON.stringify({ refreshCheck, current: sample() }, null, 2);
};
document.querySelector('#read').onclick = read;
read();
