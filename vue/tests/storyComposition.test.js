import test from 'node:test';
import assert from 'node:assert/strict';
import { storyComposition } from '../src/animation/storyComposition.js';

test('the object alternates opposite the four theses and rejoins adjacent scenes at the centre', () => {
  assert.deepEqual(storyComposition(0, 4), { side: 0, presence: 0 });
  assert.deepEqual(storyComposition(1, 4), { side: 0, presence: 0 });
  assert.deepEqual([.125, .375, .625, .875].map(p => storyComposition(p, 4).side), [-1, 1, -1, 1]);
});

test('forward and reverse sampling is continuous across column changes', () => {
  const forward = Array.from({ length: 1001 }, (_, i) => storyComposition(i / 1000, 4).side);
  const reverse = Array.from({ length: 1001 }, (_, i) => storyComposition((1000 - i) / 1000, 4).side);
  assert.deepEqual(reverse.reverse(), forward);
  for (let i = 1; i < forward.length; i++) assert.ok(Math.abs(forward[i] - forward[i - 1]) < .04);
});

test('reduced motion uses stationary columns without scaling or intermediate travel', () => {
  for (let i = 0; i <= 100; i++) {
    const frame = storyComposition(i / 100, 4, true);
    assert.ok([-1, 0, 1].includes(frame.side));
    assert.equal(frame.presence, 0);
  }
});
