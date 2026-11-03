// Development-only motion trace; no production imports this fixture.
import { createApp } from 'vue';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import App from '../src/App.vue';
import { introPanelColumnY } from '../src/animation/introFade.js';
import { TRACKS } from '../src/animation/timing.js';
import 'lenis/dist/lenis.css';
import '../src/styles/reference.css';
import '../src/styles/accessibility.css';

const params = new URLSearchParams(location.search);
// Exercise the real media lifecycle with the original bytes delivered slowly,
// not a mock decoder. The old absolute deadline aborted this healthy stream.
let slowDownload;
let downloadReport;
if (params.has('slow-media')) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (url, options) => {
    const response = await originalFetch(url, options);
    if (!/chip-scroll(?:-(?:alpha|lite))?\.(mov|webm)$/.test(String(url))) return response;
    const bytes = new Uint8Array(await response.arrayBuffer());
    let finish;
    slowDownload = new Promise(resolve => { finish = resolve; });
    downloadReport = { bytes: 0, aborted: false, complete: false };
    const start = performance.now();
    const body = new ReadableStream({ start(controller) {
      let offset = 0;
      const cleanup = () => { clearInterval(timer); options.signal.removeEventListener('abort', abort); finish(); };
      const abort = () => {
        downloadReport.aborted = true;
        cleanup(); controller.error(new DOMException('Aborted', 'AbortError'));
      };
      const timer = setInterval(() => {
        const end = Math.min(bytes.length, offset + Math.ceil(bytes.length / 24));
        controller.enqueue(bytes.subarray(offset, end)); offset = end;
        downloadReport.bytes = offset;
        downloadReport.elapsed = Math.round(performance.now() - start);
        if (offset === bytes.length) {
          downloadReport.complete = true;
          cleanup(); controller.close();
        }
      }, 1000);
      options.signal.addEventListener('abort', abort, { once: true });
    } });
    return new Response(body, { headers: response.headers });
  };
}
let releaseFonts;
if (params.has('late-fonts')) {
  const originalReady = document.fonts.ready;
  const deferred = new Promise(resolve => { releaseFonts = () => originalReady.then(resolve); });
  Object.defineProperty(document.fonts, 'ready', { configurable: true, get: () => deferred });
}
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
let seeks = [];
let measuring = false;
const scene = () => document.querySelector('.scroll-scene');
const trigger = () => ScrollTrigger.getAll().find(value => value.trigger === scene());
const inspect = () => {
  const jumps = samples.slice(1).map((sample, i) => ({ delta: Math.abs(sample.curtain - samples[i].curtain), sample }));
  const gaps = samples.slice(1).map((sample, i) => sample.time - samples[i].time);
  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const columnSteps = samples.slice(1).map((sample, i) => Math.abs(sample.column - samples[i].column));
  const seekGaps = seeks.slice(1).map((sample, i) => sample.time - seeks[i].time);
  const video = document.querySelector('.chip-scroll-video');
  const worst = jumps.reduce((result, value, index) => !result || value.delta > result.delta
    ? { ...value, before: samples[index] } : result, null);
  document.getElementById('summary').textContent = JSON.stringify({
    download: downloadReport,
    video: params.has('chip') ? { format: video.dataset.videoFormat, ready: video.readyState,
      seeks: seeks.length, maxSeekGap: Math.max(0, ...seekGaps),
      lastTime: seeks.at(-1)?.mediaTime } : undefined,
    frames: samples.length, instances: [...new Set(samples.map(sample => sample.id))],
    maxStep: Math.max(0, ...jumps.map(value => value.delta)),
    maxColumnStep: Math.max(0, ...columnSteps), maxFrameGap: Math.max(0, ...gaps),
    medianFrameGap: sortedGaps[Math.floor(sortedGaps.length * .5)],
    p95FrameGap: sortedGaps[Math.floor(sortedGaps.length * .95)],
    maxCoordinateError: Math.max(0, ...samples.map(sample => sample.coordinateError)),
    framesOver50ms: gaps.filter(gap => gap > 50).length,
    worst: params.has('compact') ? { delta: worst?.delta, time: worst?.sample.time,
      from: worst?.before.playhead, to: worst?.sample.playhead,
      scrollFrom: worst?.before.y, scrollTo: worst?.sample.y } : undefined,
    final: params.has('compact') ? { curtain: samples.at(-1)?.curtain, playhead: samples.at(-1)?.playhead,
      scroll: samples.at(-1)?.y, chipTime: samples.at(-1)?.chipTime } : samples.at(-1),
    samples: params.has('samples') ? samples : undefined,
  }, null, 2);
};
const measure = async (reverse = false, simulateResize = false) => {
  if (measuring) return;
  measuring = true;
  samples = [];
  seeks = [];
  const unit = innerHeight;
  const sceneHeight = scene().offsetHeight;
  const chip = params.has('chip');
  const from = chip ? TRACKS.marquee[0] : 0;
  const to = chip ? TRACKS.marquee[0] + 2 : 1;
  const panelHeight = document.querySelector('.white-curtain').offsetHeight;
  const finale = document.querySelector('.intro-text-finale');
  const columnBottom = finale.offsetTop + finale.offsetHeight;
  const heightDescriptor = Object.getOwnPropertyDescriptor(window, 'innerHeight');
  window.scrollTo({ top: (reverse ? to : from) * unit, behavior: 'instant' });
  await new Promise(resolve => setTimeout(resolve, 350));
  const start = performance.now();
  const video = document.querySelector('.chip-scroll-video');
  const seeked = () => seeks.push({ time: Math.round(performance.now() - start), mediaTime: video.currentTime });
  if (chip) video.addEventListener('seeked', seeked);
  const duration = params.has('long') ? 10000 : 2400;
  let resized = false;
  const sample = time => {
    const elapsed = time - start;
    const t = Math.min(elapsed / duration, 1);
    window.scrollTo({ top: simulateResize || params.has('late-fonts') ? unit * .5
      : unit * (from + (to - from) * (reverse ? 1 - t : t)), behavior: 'instant' });
    if (releaseFonts && elapsed >= 70) { releaseFonts(); releaseFonts = undefined; }
    if (simulateResize && !resized && elapsed >= 70) {
      resized = true;
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: unit - 60 });
      window.dispatchEvent(new Event('resize'));
    }
    const current = trigger();
    if (current && !ids.has(current)) ids.set(current, ++serial);
    const column = parseFloat(document.querySelector('.intro-text-column').style.transform.match(/translate3d\([^,]+,\s*([\d.-]+)px/)?.[1] ?? 0);
    const curtain = parseFloat(document.querySelector('.white-curtain').style.transform.match(/translate3d\([^,]+,\s*([\d.-]+)%/)?.[1] ?? 0);
    const expected = introPanelColumnY(current?.animation.data.introText ?? 0, 1 - curtain / 100, panelHeight, columnBottom);
    samples.push({ time: Math.round(elapsed), y: scrollY, width: innerWidth, height: innerHeight, id: ids.get(current),
      column, curtain, coordinateError: Math.abs(column - expected),
      playhead: current?.animation.time(), progress: current?.progress, end: current?.end,
      duration: current?.animation.duration(), sceneHeight,
      chipTime: document.querySelector('.chip-scroll-video')?.currentTime });
    if (elapsed < duration + 800) requestAnimationFrame(sample);
    else {
      if (simulateResize) Object.defineProperty(window, 'innerHeight', heightDescriptor);
      video.removeEventListener('seeked', seeked);
      measuring = false; inspect();
    }
  };
  requestAnimationFrame(sample);
};
document.getElementById('forward').onclick = () => measure();
document.getElementById('reverse').onclick = () => measure(true);
document.getElementById('resize').onclick = () => measure(false, true);
// Native Safari QA without relying on simulator coordinate automation. The
// diagnostic samples JS/style values, not layout, inside the measured loop.
if (params.has('auto')) document.fonts.ready.then(async () => {
  if (params.has('slow-media')) {
    // App mounting starts the fetch; let its response wrapper initialize first.
    while (!slowDownload) await new Promise(resolve => setTimeout(resolve, 50));
    await slowDownload;
  }
  setTimeout(() => measure(params.has('reverse'), params.has('resize')), 1200);
});
