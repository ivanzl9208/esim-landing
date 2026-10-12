import test from 'node:test';
import assert from 'node:assert/strict';
import { createAutoTransitions, SHUTTER_DURATION } from '../src/animation/autoTransitions.js';
import { TRACKS } from '../src/animation/timing.js';
import { featureWindow, FEATURE_SCROLL_DISTANCE, FEATURE_READING_EXTENSION } from '../src/animation/featureReading.js';
import { STORY_ENTER_END, STORY_EXIT_START } from '../src/animation/storyComposition.js';

const featureTime = (index, local, mobile) => {
  const { start, end } = featureWindow(index, mobile);
  const progress = start + (end - start) * local;
  const count = mobile ? 6 : 3;
  const holds = Array.from({ length: count }, (_, slot) => {
    const window = featureWindow(mobile ? slot : slot * 2, mobile);
    return progress > window.start + (window.end - window.start) * .53;
  }).filter(Boolean).length;
  return TRACKS.features[0] + progress * FEATURE_SCROLL_DISTANCE + holds * FEATURE_READING_EXTENSION / count;
};
const finish = (motion, time, story, fps = 60, seconds = 2) => {
  for (let frame = 0; frame < fps * seconds; frame++) {
    motion.update(time, story);
    motion.advance(1 / fps);
  }
  return motion.frame();
};

test('A small first scroll opens the entire shutter and raises the chip without more scrolling', () => {
  for (const mobile of [false, true]) {
    const motion = createAutoTransitions(mobile);
    motion.update(0, 0, true);
    const time = TRACKS.reveal[0] + .01;
    motion.update(time, 0);
    motion.advance(SHUTTER_DURATION / 2);
    assert.ok(motion.frame().reveal > 0 && motion.frame().reveal < 1);
    const completed = finish(motion, time, 0);
    assert.equal(completed.reveal, 1);
    assert.equal(completed.chip, 1);
  }
});

test('Stopping during any text entrance or exit settles the complete card on desktop and mobile', () => {
  for (const mobile of [false, true]) {
    for (let index = 0; index < 6; index++) {
      const motion = createAutoTransitions(mobile);
      motion.update(0, 0, true);
      const entering = featureTime(index, .1, mobile);
      const visible = finish(motion, entering, 0).featureText[index];
      assert.ok(visible >= .38 && visible <= .68);
      const exiting = featureTime(index, .85, mobile);
      assert.equal(finish(motion, exiting, 0).featureText[index], 1);
      assert.ok(finish(motion, exiting - .01, 0).featureText[index] >= .38);
      const hidden = featureTime(index, .1, mobile);
      assert.equal(finish(motion, hidden, 0).featureText[index], 0);
    }
  }
});

test('Gray text blocks also finish their entrance/exit after scroll stops', () => {
  for (const mobile of [false, true]) {
    for (let index = 0; index < 4; index++) {
      const motion = createAutoTransitions(mobile);
      motion.update(TRACKS.story[0], 0, true);
      const story = (index + .05) / 4;
      const visible = finish(motion, TRACKS.story[0] + 1, story).storyText[index];
      assert.ok(visible >= STORY_ENTER_END && visible <= STORY_EXIT_START);
      assert.equal(finish(motion, TRACKS.story[0] + 2, (index + .95) / 4).storyText[index], 1);
    }
  }
});

test('Interrupted shutter movement reverses continuously and finishes its new direction', () => {
  const motion = createAutoTransitions(false);
  const time = TRACKS.reveal[0] + .2;
  motion.update(0, 0, true);
  motion.update(time, 0);
  motion.advance(.4);
  const before = motion.frame();
  motion.update(time - .01, 0);
  assert.deepEqual(motion.frame(), before, 'Changing direction must not jump position');
  assert.equal(finish(motion, time - .01, 0).reveal, 0);
  assert.equal(finish(motion, time, 0).reveal, 1);
});

test('Reversing a partially revealed or disappearing card never jumps its word phase', () => {
  const motion = createAutoTransitions(false);
  const entering = featureTime(0, .1, false);
  motion.update(0, 0, true);
  motion.update(entering, 0);
  motion.advance(.2);
  const partial = motion.frame().featureText[0];
  motion.update(entering - .01, 0);
  assert.equal(motion.frame().featureText[0], partial);
  assert.equal(finish(motion, entering - .01, 0).featureText[0], 0);
  finish(motion, entering, 0);
  const exiting = featureTime(0, .85, false);
  motion.update(exiting, 0);
  motion.advance(.1);
  const fading = motion.frame().featureText[0];
  motion.update(exiting - .01, 0);
  assert.equal(motion.frame().featureText[0], fading);
  const settled = finish(motion, exiting - .01, 0).featureText[0];
  assert.ok(settled >= .38 && settled <= .68);
});

test('Restored positions and reduced motion settle immediately; fast jumps never flash unseen cards', () => {
  const motion = createAutoTransitions(false);
  motion.update(0, 0, true);
  motion.update(TRACKS.features[1] + 1, 1);
  assert.deepEqual(motion.frame().featureText, [1, 1, 1, 1, 1, 1]);
  assert.deepEqual(motion.frame().storyText, [1, 1, 1, 1]);
  motion.update(featureTime(0, .1, false), 0, true);
  assert.equal(motion.frame().reveal, 1);
  assert.ok(motion.frame().featureText[0] >= .38);
  assert.equal(motion.advance(1), false);
});

test('Transition endpoints match at 30/60/120 fps and settled clocks stop rendering', () => {
  for (const fps of [30, 60, 120]) {
    const motion = createAutoTransitions(true);
    motion.update(0, 0, true);
    const result = finish(motion, featureTime(2, .1, true), 0, fps, 4);
    assert.equal(result.reveal, 1);
    assert.ok(result.featureText[2] >= .38 && result.featureText[2] <= .68);
    assert.equal(motion.advance(1 / fps), false);
  }
});

test('Leaving a text window clears the outgoing card immediately in either direction', () => {
  for (const mobile of [false, true]) {
    const motion = createAutoTransitions(mobile);
    motion.update(0, 0, true);
    finish(motion, featureTime(0, .5, mobile), 0);
    assert.ok(motion.frame().featureText[0] > 0 && motion.frame().featureText[0] < 1);
    motion.update(TRACKS.definition[0] + 1, 0);
    assert.deepEqual(motion.frame().featureText, [1, 1, 1, 1, 1, 1]);
    finish(motion, TRACKS.story[0] + 1, .375);
    assert.ok(motion.frame().storyText[1] > 0 && motion.frame().storyText[1] < 1);
    motion.update(TRACKS.definition[0] + 1, 0);
    assert.deepEqual(motion.frame().storyText, [0, 0, 0, 0]);
    motion.update(0, 0);
    assert.equal(motion.frame().reveal, 0);
    assert.equal(motion.frame().chip, 0);
  }
});

test('Automatic curtain and card clocks leave chip rotation and heading movement to scroll', () => {
  for (const mobile of [false, true]) {
    const motion = createAutoTransitions(mobile);
    motion.update(0, 0, true);
    const frame = finish(motion, TRACKS.reveal[0] + .01, 0, 60, 10);
    assert.equal(frame.reveal, 1);
    assert.ok(frame.featureText.every(value => value === 0));
    assert.equal('playback' in frame, false);
    assert.equal('marquee' in frame, false);
    assert.equal(motion.advance(1), false);
    assert.deepEqual(motion.frame(), frame);
  }
});
