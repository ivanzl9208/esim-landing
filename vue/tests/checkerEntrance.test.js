import test from 'node:test';
import assert from 'node:assert/strict';
import { checkerEntranceFrame } from '../src/animation/checkerEntrance.js';
import { smoothstep } from '../src/animation/math.js';
import { TRACKS, getLayout } from '../src/animation/timing.js';

test('Checker retains the original entrance track and desktop/mobile displacement in both directions', () => {
  assert.deepEqual(TRACKS.outro, [37.4, 39.68, 1, 'smooth']);
  for (const [width, height, offsets] of [[1440, 720, [768, 648, 384, 120, 0]], [360, 600, [648, 546.75, 324, 101.25, 0]]]) {
    const geometry = getLayout(width, height);
    for (const index of [0, 1, 2, 3, 4, 3, 2, 1, 0]) {
      const frame = checkerEntranceFrame(smoothstep(0, 1, index / 4), geometry);
      assert.equal(frame.y, offsets[index]);
      assert.equal(frame.interactive, index === 4);
      assert.equal(frame.visible, index !== 0);
      if (index === 0 || index === 4) assert.equal(frame.opacity, index / 4);
    }
  }
});

test('Reduced motion has no checker translation or fading', () => {
  for (const progress of [0, .5, 1]) {
    const frame = checkerEntranceFrame(progress, getLayout(390, 844), true);
    assert.equal(frame.y, 0);
    assert.equal(frame.opacity, 1);
    assert.equal(frame.visible, progress === 1);
  }
});
