// Development-only integration fixture, not a production HTML entry.
import { MEDIA_BROWSERS } from './fixtures/mediaBrowsers.js';
const params = new URLSearchParams(location.search);
const browserProfile = params.get('browser');
const profile = MEDIA_BROWSERS[browserProfile];
if (profile) {
  for (const key of ['userAgent', 'vendor', 'platform', 'maxTouchPoints']) {
    Object.defineProperty(navigator, key, { configurable: true, value: profile[key] });
  }
}
const originalMatchMedia = window.matchMedia.bind(window);
window.matchMedia = query => {
  const result = originalMatchMedia(query);
  if (params.has('touch') && query === '(pointer: fine)') Object.defineProperty(result, 'matches', { value: false });
  return result;
};
document.getElementById('inspect').onclick = () => {
  const frame = document.querySelector('.chip-scroll-frame');
  document.getElementById('test-report').textContent = JSON.stringify({
    browserProfile,
    heroSource: document.querySelector('.hero-video source')?.getAttribute('src'),
    chipVideoSource: document.querySelector('.chip-scroll-video')?.getAttribute('src'),
    frame: frame?.getAttribute('src'), frameOpacity: frame ? getComputedStyle(frame).opacity : null,
    frameLoaded: Boolean(frame?.complete && frame?.naturalWidth),
    frameRequests: performance.getEntriesByType('resource').filter(r => r.name.includes('/chip-frames/')).length,
  }, null, 2);
};
await import('../src/main.jsx');
