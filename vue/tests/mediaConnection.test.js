import test from 'node:test';
import assert from 'node:assert/strict';
import { prefersStaticMedia } from '../src/utils/mediaConnection.js';

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
