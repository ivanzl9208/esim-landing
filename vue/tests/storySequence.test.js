import test from 'node:test';
import assert from 'node:assert/strict';
import { gsap } from 'gsap';
import { storySequenceFrame } from '../src/animation/storySequence.js';
import { storyComposition } from '../src/animation/storyComposition.js';
import { chipZoomFrame } from '../src/animation/chipZoom.js';
import { TRACKS } from '../src/animation/timing.js';

test('A fast scroll still completes the lateral return and centred hold before growth and text push', () => {
  const playhead = { time: TRACKS.story[1] - .525 };
  const tween = gsap.to(playhead, { time: TRACKS.safety[0], duration: .75, ease: 'power2.out', paused: true });
  const samples = [];
  try {
    for (let index = 0; index <= 300; index++) {
      tween.progress(index / 300);
      const state = storySequenceFrame(playhead.time);
      const side = storyComposition(state.story, 4).side;
      const chip = chipZoomFrame(state.chipZoom, state.safety, false);
      samples.push({ time: playhead.time, side, ...chip });
      if (state.story < 1) {
        assert.ok(side > 0);
        assert.equal(chip.scale, 1);
        assert.equal(chip.y, 0);
      } else {
        assert.equal(side, 0);
      }
      if (playhead.time >= TRACKS.story[1] && playhead.time <= TRACKS.chipZoom[0]) {
        assert.equal(chip.scale, 1);
        assert.equal(chip.y, 0);
      }
      if (state.chipZoom > 0 && state.chipZoom <= .2) {
        assert.ok(chip.scale > 1);
        assert.equal(chip.y, 0);
      }
      if (state.chipZoom > .2) assert.ok(chip.y < 0);
    }
    assert.ok(samples.some(frame => frame.time > TRACKS.story[1] && frame.scale === 1));
    assert.ok(samples.some(frame => frame.scale > 1 && frame.y === 0));
    for (let index = 300; index >= 0; index--) {
      tween.progress(index / 300);
      const state = storySequenceFrame(playhead.time);
      assert.deepEqual({ time: playhead.time, side: storyComposition(state.story, 4).side,
        ...chipZoomFrame(state.chipZoom, state.safety, false) }, samples[index]);
    }
  } finally { tween.kill(); }
});
