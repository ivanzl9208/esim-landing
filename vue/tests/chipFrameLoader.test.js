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
