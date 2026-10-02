import test from 'node:test';
import assert from 'node:assert/strict';
import { heroRevealFrame } from '../src/animation/heroReveal.js';
import { TRACKS, SCENE_SCROLL_END, CHECKER_HOLD, CENTERED_CHIP_HOLD, CHIP_CENTER_RETURN_EXTENSION } from '../src/animation/timing.js';

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
  assert.ok(Math.abs(TRACKS.playback[0] - TRACKS.reveal[1] - .401) < 1e-10);
  assert.deepEqual(TRACKS.features, [12.05, 26.05, 1, 'none']);
  assert.deepEqual(TRACKS.definition, [26.15, 31.65, 1, 'none']);
  assert.equal(CHECKER_HOLD, 1);
  assert.ok(Math.abs(TRACKS.story[0] - 31.83) < 1e-10);
  assert.deepEqual(TRACKS.story.slice(1), [44.43, 1, 'none']);
  assert.ok(Math.abs(TRACKS.story[1] - TRACKS.story[0] - 12.6) < 1e-10);
  assert.equal(CENTERED_CHIP_HOLD, 2);
  assert.ok(Math.abs(TRACKS.safety[0] - TRACKS.story[1] - CHIP_CENTER_RETURN_EXTENSION - 0.25 - CENTERED_CHIP_HOLD) < 1e-10);
  assert.ok(Math.abs(TRACKS.safety[1] - TRACKS.safety[0] - 6) < 1e-10);
  assert.ok(Math.abs(TRACKS.returnGradient[1] - TRACKS.returnGradient[0] - 2.25) < 1e-10);
  assert.equal(SCENE_SCROLL_END, 54.205);
  assert.deepEqual(TRACKS.outro, [50.925, 53.205, 1, 'smooth']);
  assert.equal(Math.max(...Object.values(TRACKS).map(track => track[1])), 53.205);
  assert.equal('resultCurtain' in TRACKS, false);
  assert.equal('faqReveal' in TRACKS, false);
});
