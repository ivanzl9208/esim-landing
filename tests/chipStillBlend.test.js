import test from 'node:test';
import assert from 'node:assert/strict';
import { chipStillBlend } from '../src/animation/chipStillBlend.js';
import { createChipStillLoader } from '../src/utils/chipStillLoader.js';

const sample = (width, zoom, extra = {}) => chipStillBlend({ width, zoom, ready: true, frontReady: true, ...extra });

test('Still waits for matching pose, decode, zoom and the source pixel budget', () => {
  for (const dpr of [1, 2]) {
    assert.equal(sample(1600, 0, { dpr }).fade, 0);
    assert.equal(sample(1600, 1, { dpr, ready: false }).fade, 0);
    assert.equal(sample(1600, 1, { dpr, frontReady: false }).fade, 0);
    assert.equal(sample(250, 1, { dpr }).fade, 0);
  }
  assert.equal(sample(560, 1).fade, 0);
  assert.equal(sample(784, 1).fade, 1);
  assert.equal(sample(392, 1, { dpr: 2 }).fade, 1);
  assert.equal(sample(627.2, 1, { sourceWidth: 640 }).fade, 1);
  const phoneEnd = sample(721, 1, { dpr: 1, safety: .42 });
  assert.equal(phoneEnd.fade, 1);
  assert.equal(phoneEnd.blur, 0);
});

test('Retina starts with a blend instead of swapping on the first zoom frame; sharpening continues after handoff', () => {
  assert.equal(sample(600, .04, { dpr: 2 }).fade, 0);
  assert.ok(Math.abs(sample(600, .19, { dpr: 2 }).fade - .5) < 1e-8);
  const handoff = sample(600, .34, { dpr: 2 });
  assert.equal(handoff.fade, 1);
  assert.equal(handoff.blur, .28);
  assert.ok(sample(600, .48, { dpr: 2 }).blur < handoff.blur);
  assert.equal(sample(600, .62, { dpr: 2 }).blur, 0);
  const growing = sample(600, .19, { dpr: 2, scale: 2 });
  assert.ok(Math.abs(growing.blur * 2 - sample(600, .19, { dpr: 2 }).blur) < 1e-8);
});

test('Slow/fast and reverse sampling use identical continuous states on desktop/mobile DPR1/2', () => {
  for (const [base, final] of [[575, 1446], [292, 751]]) for (const dpr of [1, 2]) {
    const states = Array.from({ length: 1001 }, (_, i) => sample(base + (final - base) * i / 1000, Math.min(i / 400, 1), { dpr }));
    for (let i = 1; i < states.length; i++) {
      assert.ok(states[i].fade >= states[i - 1].fade);
      assert.ok(states[i].fade - states[i - 1].fade < .02);
    }
    assert.deepEqual(Array.from({ length: 1001 }, (_, i) => sample(base + (final - base) * (1000 - i) / 1000,
      Math.min((1000 - i) / 400, 1), { dpr })).reverse(), states);
  }
});

test('Preload is one-shot, presents only after decode and safely ignores failed/disposed loads', async () => {
  let finish;
  let calls = 0;
  let shown = 0;
  let released = 0;
  const pending = new Promise(resolve => { finish = resolve; });
  const loader = createChipStillLoader({ load: () => { calls++; return pending; }, present: () => shown++ });
  loader.prepare(); loader.prepare();
  await Promise.resolve();
  assert.equal(calls, 1); assert.equal(shown, 0);
  loader.dispose();
  finish({ release: () => released++ });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(shown, 0); assert.equal(released, 1);
  const failure = createChipStillLoader({ load: () => Promise.reject(new Error('HTTP 404 or decode failure')), present: () => shown++ });
  failure.prepare();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(shown, 0);
  const ready = createChipStillLoader({ load: async () => ({ release() {} }), present: () => shown++ });
  ready.prepare();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(shown, 1);
});
