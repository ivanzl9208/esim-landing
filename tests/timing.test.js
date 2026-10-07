import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS, SCENE_SCROLL_END, CHECKER_HOLD, CENTERED_CHIP_HOLD, CHIP_CENTER_RETURN_EXTENSION, INTRO_HANDOFF_ADVANCE } from '../src/animation/timing.js';

test('Checker holds for three viewports after its entrance without stretching earlier tracks', () => {
  assert.deepEqual(TRACKS.curtain, [0, 1, 1, 'none']);
  assert.deepEqual(TRACKS.introText, [1, 5.93, 1, 'none']);
  assert.equal(INTRO_HANDOFF_ADVANCE, .7);
  assert.deepEqual(TRACKS.reveal, [5.23, 7.099, 1, 'smooth']);
  assert.ok(Math.abs(TRACKS.playback[0] - TRACKS.reveal[1] - .401) < 1e-10);
  assert.deepEqual(TRACKS.features, [13, 27, 1, 'none']);
  assert.deepEqual(TRACKS.definition, [27.1, 32.6, 1, 'none']);
  assert.deepEqual(TRACKS.playback, [7.5, 32.6, 4, 'none']);
  assert.equal('definitionTurn' in TRACKS, false);
  assert.equal(CHECKER_HOLD, 3);
  assert.ok(Math.abs(TRACKS.story[0] - 32.78) < 1e-10);
  assert.deepEqual(TRACKS.story.slice(1), [45.38, 1, 'none']);
  assert.ok(Math.abs(TRACKS.story[1] - TRACKS.story[0] - 12.6) < 1e-10);
  assert.equal(CENTERED_CHIP_HOLD, 2);
  assert.ok(Math.abs(TRACKS.safety[0] - TRACKS.story[1] - CHIP_CENTER_RETURN_EXTENSION - 0.25 - CENTERED_CHIP_HOLD) < 1e-10);
  assert.ok(Math.abs(TRACKS.safety[1] - TRACKS.safety[0] - 6) < 1e-10);
  assert.ok(Math.abs(TRACKS.returnGradient[1] - TRACKS.returnGradient[0] - 2.25) < 1e-10);
  assert.equal(SCENE_SCROLL_END, 57.155);
  assert.deepEqual(TRACKS.outro, [51.875, 54.155, 1, 'smooth']);
  assert.equal(Math.max(...Object.values(TRACKS).map(track => track[1])), 54.155);
  assert.equal('resultCurtain' in TRACKS, false);
  assert.equal('faqReveal' in TRACKS, false);
});
