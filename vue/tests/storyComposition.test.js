import test from 'node:test';
import assert from 'node:assert/strict';
import { storyComposition, STORY_ENTER_END, STORY_EXIT_START } from '../src/animation/storyComposition.js';
import { TRACKS } from '../src/animation/timing.js';

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

test('all four theses double their reading hold while preserving entrance and exit distances', () => {
  const distance = (TRACKS.story[1] - TRACKS.story[0]) / 4;
  assert.ok(Math.abs(distance * STORY_ENTER_END - 0.525) < 1e-10);
  assert.ok(Math.abs(distance * (1 - STORY_EXIT_START) - 0.525) < 1e-10);
  assert.ok(Math.abs(distance * (STORY_EXIT_START - STORY_ENTER_END) - 2.1) < 1e-10);
  for (let index = 0; index < 4; index++) {
    const side = index % 2 ? 1 : -1;
    for (const local of [STORY_ENTER_END, 0.25, 0.5, 0.75, STORY_EXIT_START]) {
      assert.deepEqual(storyComposition((index + local) / 4, 4), { side, presence: 1 });
    }
  }
});

test('reduced motion uses stationary columns without scaling or intermediate travel', () => {
  for (let i = 0; i <= 100; i++) {
    const frame = storyComposition(i / 100, 4, true);
    assert.ok([-1, 0, 1].includes(frame.side));
    assert.equal(frame.presence, 0);
  }
});
