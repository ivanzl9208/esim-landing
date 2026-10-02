import test from 'node:test';
import assert from 'node:assert/strict';
import { checkerEntranceFrame } from '../src/animation/checkerEntrance.js';
import { smoothstep } from '../src/animation/math.js';
import { TRACKS, getLayout } from '../src/animation/timing.js';
import { storyMotionFrame } from '../src/animation/storyMotion.js';

test('Checker retains the original entrance duration and desktop/mobile displacement in both directions', () => {
  assert.deepEqual(TRACKS.outro, [52.575, 54.855, 1, 'smooth']);
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

test('Shared handoff clock retains checker/background easing and the matching safety position in either direction', () => {
  for (const key of ['outro', 'returnGradient']) {
    const [start, end] = TRACKS[key];
    const expected = [0, .15625, .5, .84375, 1];
    for (const index of [0, 1, 2, 3, 4, 3, 2, 1, 0]) {
      const time = start + (end - start) * index / 4;
      const frame = storyMotionFrame(time);
      assert.ok(Math.abs(frame[key] - expected[index]) < 1e-10);
      assert.ok(Math.abs(frame.safety - (time - TRACKS.safety[0]) / (TRACKS.safety[1] - TRACKS.safety[0])) < 1e-10);
    }
  }
  const mid = storyMotionFrame((TRACKS.outro[0] + TRACKS.outro[1]) / 2);
  assert.ok(Math.abs(checkerEntranceFrame(mid.outro, getLayout(1440, 720)).y - 384) < 1e-8);
  assert.equal(storyMotionFrame(TRACKS.safety[1]).outro, 1);
});
