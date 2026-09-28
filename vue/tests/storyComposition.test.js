import test from 'node:test';
import assert from 'node:assert/strict';
import { storyComposition, storyThesisFrame } from '../src/animation/storyComposition.js';

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

test('all four theses keep a full-opacity, stationary half-segment in both scroll directions', () => {
  for (let index = 0; index < 4; index++) {
    const side = index % 2 ? 1 : -1;
    for (const local of [0.25, 0.5, 0.75]) {
      assert.deepEqual(storyThesisFrame(local), { opacity: 1, holding: true });
      assert.deepEqual(storyComposition((index + local) / 4, 4), { side, presence: 1 });
    }
    assert.equal(storyThesisFrame(0).opacity, 0);
    assert.equal(storyThesisFrame(1).opacity, 0);
    assert.equal(storyThesisFrame(0.24).holding, false);
    assert.equal(storyThesisFrame(0.76).holding, false);
    const forward = [0, 0.125, 0.25, 0.5, 0.75, 0.875, 1].map(local => storyThesisFrame(local).opacity);
    const reverse = [1, 0.875, 0.75, 0.5, 0.25, 0.125, 0].map(local => storyThesisFrame(local).opacity);
    assert.deepEqual(reverse, [...forward].reverse());
  }
});

test('reduced motion uses stationary columns without scaling or intermediate travel', () => {
  for (let i = 0; i <= 100; i++) {
    const frame = storyComposition(i / 100, 4, true);
    assert.ok([-1, 0, 1].includes(frame.side));
    assert.equal(frame.presence, 0);
  }
});
