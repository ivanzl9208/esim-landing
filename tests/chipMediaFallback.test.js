import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer, h, nextTick, shallowRef } from 'vue';
import { createServer } from 'vite';
import { MEDIA_LOAD_DEADLINE, CHIP_MOV_LOAD_DEADLINE } from '../src/utils/mediaConnection.js';

let server, useChipMedia, provideMediaConnection;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
  ({ useChipMedia } = await server.ssrLoadModule('/src/composables/useChipMedia.js'));
  ({ provideMediaConnection } = await server.ssrLoadModule('/src/composables/useMediaConnection.js'));
});
after(async () => { await server?.close(); });
const flush = async () => { for (let i = 0; i < 150; i++) await nextTick(); };

// Exercise the real Vue lifecycle, shared hero policy, loader and still decode.
// Browser downloads/events are controlled; no copy of the media state machine.
function mountMedia(t, { slow = false, pendingVideo = false, iphone = false, unavailableFrames = false } = {}) {
  const previous = new Map();
  const replace = (key, value) => {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  };
  const motion = new EventTarget(); motion.matches = false;
  const window = new EventTarget(); window.matchMedia = () => motion;
  replace('window', window); replace('document', Object.assign(new EventTarget(), { hidden: false }));
  replace('navigator', { userAgent: iphone ? 'iPhone Safari' : 'Chrome', onLine: true, connection: Object.assign(new EventTarget(), { effectiveType: slow ? '3g' : '4g' }) });
  let clock = 0;
  replace('requestAnimationFrame', callback => { const id = ++clock; queueMicrotask(() => callback(id * 16)); return id; });
  replace('cancelAnimationFrame', () => {});
  const requests = [];
  replace('fetch', (url, { signal } = {}) => {
    requests.push(url);
    if (pendingVideo && /chip-scroll(?:-alpha)?\.(webm|mov)/.test(url)) return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
    return Promise.resolve({ ok: true, blob: async () => new Blob(['media']) });
  });
  replace('Image', class {
    set src(value) { this._src = value; if (value) queueMicrotask(() => unavailableFrames ? this.onerror?.() : this.onload?.()); }
    get src() { return this._src; }
    decode() { return Promise.resolve(); }
    removeAttribute() { this._src = ''; }
  });
  const video = Object.assign(new EventTarget(), {
    readyState: 0, videoWidth: 800, duration: 6, currentTime: 0, seeking: false,
    pause() {}, load() {}, hasAttribute() { return Boolean(this.src); }, removeAttribute() { this.src = ''; },
  });
  let videoSrc;
  Object.defineProperty(video, 'src', { get: () => videoSrc, set(value) {
    videoSrc = value;
    if (value) queueMicrotask(() => {
      video.readyState = 2;
      video.dispatchEvent(new Event('loadedmetadata'));
      video.dispatchEvent(new Event('loadeddata'));
    });
  } });
  const frame = Object.assign(new EventTarget(), { src: '/assets/chip-frames/frame-001.webp', naturalWidth: 640, complete: true });
  const still = { naturalWidth: 1350, decode: async () => {}, removeAttribute() { this.src = ''; } };
  let media, policy;
  const Child = { setup() { media = useChipMedia(shallowRef(video), shallowRef(frame), shallowRef(still)); return () => null; } };
  const renderer = createRenderer({ createComment: () => ({}), insert() {}, remove() {}, parentNode() {}, nextSibling() {} });
  const app = renderer.createApp({ setup() { policy = provideMediaConnection(); return () => h(Child); } });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  app.mount({});
  t.after(() => {
    app.unmount();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { media, policy, frame, video, motion, requests, recoverFrames: () => { unavailableFrames = false; } };
}

for (const slow of [false, true]) {
  test(`Chip ignores network estimates and shared hints, falls back only on its own failure (${slow ? 'initial slow connection' : 'hero timeout during playback'})`, async t => {
    const { media, policy, frame, video, requests } = mountMedia(t, { slow });
    media.setPlayback(.25, 4); await flush();
    policy.markSlow(); await flush();
    assert.equal(media.frameMode.value, false);
    assert.equal(media.videoReady.value, true);
    assert.ok(requests.some(url => url.includes('chip-scroll.webm')));
    video.dispatchEvent(new Event('error')); await flush();
    assert.equal(media.frameMode.value, true);
    assert.match(frame.src, /frame-038.webp$/);
    media.setPlayback(.5, 4); await flush();
    assert.match(frame.src, /frame-076.webp$/);
    media.setPlayback(.25, 4); await flush();
    assert.match(frame.src, /frame-038.webp$/);
    media.prepareStill(); media.setPlayback(4, 4);
    media.setZoomQuality({ width: 1400, scale: 2, dpr: 2, zoom: 1 }); await flush();
    assert.match(frame.src, /frame-150.webp$/);
    assert.equal(media.stillOpacity.value, 1);
    assert.equal(media.stillFilter.value, 'none');
    media.setPlayback(.5, 4); await flush();
    assert.match(frame.src, /frame-076.webp$/);
    assert.equal(media.stillOpacity.value, 0);
  });
}

test('A video download timeout falls back to rotating frames; Reduce Motion still stays static and can resume', async t => {
  const { media, frame, motion } = mountMedia(t, { pendingVideo: true });
  media.setPlayback(.5, 4); await flush();
  t.mock.timers.tick(MEDIA_LOAD_DEADLINE); await flush();
  assert.equal(media.frameMode.value, true);
  assert.match(frame.src, /frame-076.webp$/);
  motion.matches = true; motion.dispatchEvent(new Event('change')); await flush();
  assert.match(frame.src, /frame-001.webp$/);
  media.setPlayback(.75, 4); await flush();
  assert.match(frame.src, /frame-001.webp$/);
  motion.matches = false; motion.dispatchEvent(new Event('change')); await flush();
  assert.match(frame.src, /frame-113.webp$/);
});

test('Both media ignore latched slow hints and follow Save-Data and online changes', async t => {
  const { policy, media } = mountMedia(t, { slow: true });
  media.setPlayback(.25, 4); await flush();
  assert.equal(policy.staticMedia.value, true);
  assert.equal(policy.avoidVideo.value, false);
  assert.equal(media.frameMode.value, false);
  policy.markSlow(); await flush();
  assert.equal(policy.avoidVideo.value, false);
  navigator.connection.saveData = true;
  navigator.connection.dispatchEvent(new Event('change')); await flush();
  assert.equal(policy.avoidVideo.value, true);
  assert.equal(media.frameMode.value, true);
  navigator.connection.saveData = false;
  navigator.onLine = false;
  window.dispatchEvent(new Event('offline')); await flush();
  assert.equal(policy.avoidVideo.value, true);
  navigator.onLine = true;
  window.dispatchEvent(new Event('online')); await flush();
  assert.equal(policy.avoidVideo.value, false);
  assert.equal(media.frameMode.value, false);
  assert.equal(media.videoReady.value, true);
  assert.equal(policy.staticMedia.value, true, 'A latched hint does not suppress video');
});

for (const event of ['online', 'pageshow', 'visibilitychange']) {
  test(`iPhone resumes the current chip orientation after transient frame failure and ${event}`, async t => {
    const { media, frame, recoverFrames } = mountMedia(t, { iphone: true, pendingVideo: true, unavailableFrames: true });
    media.setPlayback(.25, 4); await flush();
    t.mock.timers.tick(MEDIA_LOAD_DEADLINE); await flush();
    assert.equal(media.frameMode.value, false, 'The larger MOV can continue downloading beyond the WebM deadline');
    t.mock.timers.tick(CHIP_MOV_LOAD_DEADLINE - MEDIA_LOAD_DEADLINE); await flush();
    assert.equal(media.frameMode.value, true);
    assert.match(frame.src, /frame-001.webp$/);
    recoverFrames();
    (event === 'visibilitychange' ? document : window).dispatchEvent(new Event(event)); await flush();
    assert.match(frame.src, /frame-038.webp$/);
    media.setPlayback(.5, 4); await flush();
    assert.match(frame.src, /frame-076.webp$/);
    media.setPlayback(.25, 4); await flush();
    assert.match(frame.src, /frame-038.webp$/);
  });
}

test('iPhone uses the transparent MOV, seeks in both directions and blends the same final still', async t => {
  const { media, video, requests } = mountMedia(t, { iphone: true });
  media.setPlayback(.25, 4); await flush();
  assert.equal(media.frameMode.value, false);
  assert.equal(media.videoReady.value, true);
  assert.equal(media.videoSource.value, 'chip-scroll-alpha.mov');
  assert.ok(requests.some(url => url.endsWith('/chip-scroll-alpha.mov')));
  assert.ok(!requests.some(url => /chip-frames|chip-scroll\.webm/.test(url)));
  const quarter = video.currentTime;
  media.setPlayback(.5, 4); await flush();
  assert.ok(video.currentTime > quarter);
  media.setPlayback(.25, 4); await flush();
  assert.equal(video.currentTime, quarter);
  media.prepareStill(); media.setPlayback(4, 4);
  media.setZoomQuality({ width: 1400, scale: 2, dpr: 2, zoom: 1 }); await flush();
  assert.equal(media.stillOpacity.value, 1);
  media.setPlayback(.5, 4); await flush();
  assert.equal(media.stillOpacity.value, 0);
});
