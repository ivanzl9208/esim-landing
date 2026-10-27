import test from 'node:test';
import assert from 'node:assert/strict';
import { avoidsVideo, prefersStaticMedia } from '../src/utils/mediaConnection.js';
import { getMediaPlayback, prefersLiteChipVideo } from '../src/utils/mediaPlayback.js';

test('Hero attempts playback on estimated slow connections; explicit data saving and offline still stop downloads', () => {
  for (const connection of [undefined, {}, { effectiveType: '3g', downlink: .8, rtt: 600 },
    { effectiveType: '2g' }, { effectiveType: '4g', downlink: 10 }]) {
    assert.equal(avoidsVideo({ connection, onLine: true }), false);
  }
  assert.equal(avoidsVideo({ connection: { saveData: true } }), true);
  assert.equal(avoidsVideo({ onLine: false }), true);
  assert.equal(avoidsVideo({}), false);
});

test('Poor connectivity and data saving choose pictures, including a changing connection', () => {
  for (const connection of [{ saveData: true }, { effectiveType: 'slow-2g' }, { effectiveType: '2g' },
    { effectiveType: '3g' }, { downlink: .8 }, { rtt: 600 }]) {
    assert.equal(prefersStaticMedia({ connection }), true);
  }
  assert.equal(prefersStaticMedia({ onLine: false }), true);
});

test('Unknown Safari connection and fast networks retain animation until an actual load timeout', () => {
  for (const navigator of [{}, { connection: {} }, { connection: { effectiveType: '4g', downlink: 10, rtt: 50 } },
    { connection: { effectiveType: '4g', downlink: 1.45, rtt: 50 } }]) {
    assert.equal(prefersStaticMedia(navigator), false);
  }
});

test('Legacy and low-power desktop Chromium use the lighter video without changing mobile or Safari media', () => {
  const desktop = { userAgent: 'Mozilla/5.0 Chrome/140.0 YaBrowser/25.8 Safari/537.36', platform: 'Win32' };
  const oldYandex = { userAgent: 'Mozilla/5.0 Chrome/98.0.4758.141 YaBrowser/22.3.4.734 Safari/537.36', platform: 'Win32' };
  assert.equal(prefersLiteChipVideo({ ...desktop, hardwareConcurrency: 4, deviceMemory: 8 }), true);
  assert.equal(prefersLiteChipVideo({ ...desktop, hardwareConcurrency: 8, deviceMemory: 4 }), true);
  assert.equal(prefersLiteChipVideo({ ...desktop, hardwareConcurrency: 8, deviceMemory: 8 }), false);
  assert.equal(prefersLiteChipVideo(oldYandex), true);
  assert.equal(getMediaPlayback(oldYandex).chipSource, 'chip-scroll-lite.webm');
  assert.equal(prefersLiteChipVideo({ ...desktop, hardwareConcurrency: 4, userAgentData: { mobile: true } }), false);
  assert.equal(prefersLiteChipVideo({ userAgent: 'Mozilla/5.0 Safari/605.1.15', platform: 'MacIntel', hardwareConcurrency: 4 }), false);
  assert.equal(prefersLiteChipVideo({ userAgent: 'Mozilla/5.0 CriOS/140.0 Mobile', platform: 'iPhone', hardwareConcurrency: 4 }), false);
});
