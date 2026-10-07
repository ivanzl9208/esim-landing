import test from 'node:test';
import assert from 'node:assert/strict';
import { createChipFrameLoader } from '../src/utils/chipFrameLoader.js';
const drain = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

const setup = () => {
  const loads = new Map();
  const shown = [];
  let running = 0;
  let peak = 0;
  const loader = createChipFrameLoader({
    load: (index, signal) => new Promise((resolve, reject) => {
      running++; peak = Math.max(peak, running);
      loads.set(index, { signal, finish: () => { running--; resolve({ src: `frame-${index}` }); }, reject });
    }),
    present: index => shown.push(index),
  });
  return { loader, loads, shown, peak: () => peak };
};

test('Slow frames never replace the visible image; late downloads present the latest requested orientation', async () => {
  const { loader, loads, shown, peak } = setup();
  loader.request(75); await drain();
  assert.equal(loads.size, 3); assert.equal(shown.length, 0);
  loads.get(0).finish(); await drain();
  assert.equal(shown.at(-1), 0);
  loader.request(120); loads.get(75).finish(); await drain();
  assert.ok(loads.has(120));
  assert.notEqual(shown.at(-1), 120);
  loads.get(120).finish(); await drain();
  assert.equal(shown.at(-1), 120);
  assert.equal(peak(), 3);
  loader.dispose();
});

test('Ending the rotation restores a front view even when the final frame is still downloading', async () => {
  const { loader, loads, shown } = setup();
  loader.request(0); await drain(); loads.get(0).finish(); await drain();
  loader.request(75); loads.get(1).finish(); await drain();
  loads.get(75).finish(); await drain();
  assert.equal(shown.at(-1), 75);
  loader.request(149); assert.equal(shown.at(-1), 0);
  loads.get(149).finish(); await drain(); assert.equal(shown.at(-1), 149);
  loader.request(0); assert.equal(shown.at(-1), 0);
  loader.dispose();
});

test('Unmount aborts the bounded queue and ignores late decodes', async () => {
  const { loader, loads, shown } = setup();
  loader.request(40); await drain(); loader.dispose();
  assert.ok([...loads.values()].every(item => item.signal.aborted));
  loads.get(40).finish(); await drain();
  assert.equal(shown.length, 0); assert.equal(loads.size, 3);
});

test('Transient frame failures retry without another scroll event; permanent errors have a bounded backoff', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const attempts = new Map();
  const shown = [];
  let available = false;
  const loader = createChipFrameLoader({
    load: async index => {
      attempts.set(index, (attempts.get(index) ?? 0) + 1);
      if (!available) throw new Error('Temporary connection failure');
      return { src: `frame-${index}` };
    },
    present: index => shown.push(index),
  });
  t.after(() => loader.dispose());
  loader.request(75); await drain();
  assert.equal(shown.length, 0);
  t.mock.timers.tick(499); await drain();
  assert.equal(attempts.get(75), 1, 'No tight retry loop');
  available = true;
  t.mock.timers.tick(1); await drain();
  assert.equal(shown.at(-1), 75);

  available = false;
  loader.request(110); await drain();
  for (const delay of [500, 1000, 2000, 8000]) { t.mock.timers.tick(delay); await drain(); }
  assert.equal(attempts.get(110), 4, 'A missing asset is not downloaded forever');
  available = true;
  loader.retry(); await drain();
  assert.equal(shown.at(-1), 110, 'Explicit connection/page recovery can retry exhausted frames');
});

test('Disposal cancels a scheduled retry', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  let calls = 0;
  const loader = createChipFrameLoader({ load: async () => { calls++; throw new Error('Unavailable'); }, present() {} });
  loader.request(40); await drain();
  loader.dispose();
  const before = calls;
  t.mock.timers.tick(10000); await drain();
  assert.equal(calls, before);
});
