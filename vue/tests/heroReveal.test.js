import test from 'node:test';
import assert from 'node:assert/strict';
import { heroRevealFrame } from '../src/animation/heroReveal.js';
import { TRACKS, SCENE_SCROLL_END, CHECKER_HOLD } from '../src/animation/timing.js';

test('Shared Hero entrance preserves its sampled translation and opacity', () => {
  // Reference samples of the original first roulette line at 1440×720.
  for (const [progress, y, opacity] of [[0, 592, .05], [.25, 522, .1984375], [.5, 452, .525], [.75, 382, .8515625], [1, 312, 1]]) {
    const frame = heroRevealFrame(progress, 592, 312);
    assert.equal(frame.y, y);
    assert.ok(Math.abs(frame.opacity - opacity) < 1e-10);
  }
});

test('Checker holds for one viewport after its entrance without stretching earlier tracks', () => {
  assert.deepEqual(TRACKS.curtain, [0, 1, 1, 'none']);
  assert.deepEqual(TRACKS.roulette, [1.28, 4.35, 10, 'none']);
  assert.equal(CHECKER_HOLD, 1);
  assert.equal(SCENE_SCROLL_END, 40.68);
  assert.deepEqual(TRACKS.outro, [37.4, 39.68, 1, 'smooth']);
  assert.equal(Math.max(...Object.values(TRACKS).map(track => track[1])), 39.68);
  assert.equal('resultCurtain' in TRACKS, false);
  assert.equal('faqReveal' in TRACKS, false);
});
