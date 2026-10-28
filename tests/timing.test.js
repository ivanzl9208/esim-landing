import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS, SCENE_SCROLL_END, CHECKER_HOLD, CENTERED_CHIP_HOLD, CHIP_CENTER_RETURN_EXTENSION, POST_STORY_ZOOM_GAP, INTRO_HANDOFF_ADVANCE } from '../src/animation/timing.js';

test('Checker holds for two viewports after its entrance without stretching earlier tracks', () => {
  assert.deepEqual(TRACKS.curtain, [0, 1, 1, 'none']);
  assert.deepEqual(TRACKS.introText, [1, 5.93, 1, 'none']);
  assert.equal(INTRO_HANDOFF_ADVANCE, .7);
  assert.deepEqual(TRACKS.reveal, [5.23, 7.099, 1, 'smooth']);
  assert.ok(Math.abs(TRACKS.playback[0] - TRACKS.reveal[1] - .401) < 1e-10);
  assert.deepEqual(TRACKS.features, [13, 22.5, 1, 'none']);
  assert.deepEqual(TRACKS.definition, [22.6, 28.1, 1, 'none']);
  assert.deepEqual(TRACKS.playback, [7.5, 27.92, 4, 'none']);
  assert.equal('definitionTurn' in TRACKS, false);
  assert.equal(CHECKER_HOLD, 2);
  assert.equal(TRACKS.story[0], TRACKS.definition[1]);
  assert.deepEqual(TRACKS.story.slice(1), [36.5, 1, 'none']);
  assert.ok(Math.abs(TRACKS.story[1] - TRACKS.story[0] - 8.4) < 1e-10);
  assert.equal(CENTERED_CHIP_HOLD, 2);
  assert.ok(Math.abs(TRACKS.safety[0] - TRACKS.story[1] - CHIP_CENTER_RETURN_EXTENSION - 0.25 - CENTERED_CHIP_HOLD) < 1e-10);
  assert.ok(Math.abs(TRACKS.safety[1] - TRACKS.safety[0] - 6) < 1e-10);
  assert.ok(Math.abs(TRACKS.returnGradient[1] - TRACKS.returnGradient[0] - 2.25) < 1e-10);
  assert.equal(SCENE_SCROLL_END, 46.8875);
  assert.deepEqual(TRACKS.outro, [42.6075, 44.8875, 1, 'smooth']);
  assert.equal(Math.max(...Object.values(TRACKS).map(track => track[1])), 44.8875);
  assert.equal('resultCurtain' in TRACKS, false);
  assert.equal('faqReveal' in TRACKS, false);
});

test('The pause after the fourth thesis is halved without changing its reading time or zoom speed', () => {
  assert.equal(POST_STORY_ZOOM_GAP, .775 / 2);
  assert.ok(Math.abs(TRACKS.chipZoom[0] - TRACKS.story[1] - POST_STORY_ZOOM_GAP) < 1e-10);
  assert.ok(Math.abs(TRACKS.story[1] - TRACKS.story[0] - 8.4) < 1e-10);
  assert.equal(TRACKS.chipZoom[1] - TRACKS.chipZoom[0], 2);
  assert.ok(TRACKS.storyCenter[1] < TRACKS.chipZoom[0], 'Centre return must finish before growth');
});

test('Original scroll-controlled heading and zoom retain shorter orange and gray reading holds', () => {
  assert.ok(Math.abs(TRACKS.features[0] - TRACKS.reveal[1] - 5.901) < 1e-10);
  assert.deepEqual(TRACKS.marquee, [7.5, 13, 1, 'none']);
  for (const [key, duration] of [['features', 9.5], ['definition', 5.5], ['story', 8.4], ['chipZoom', 2], ['safety', 6]]) {
    assert.ok(Math.abs(TRACKS[key][1] - TRACKS[key][0] - duration) < 1e-10);
  }
});
