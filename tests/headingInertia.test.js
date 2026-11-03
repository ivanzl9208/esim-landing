import test from 'node:test';
import assert from 'node:assert/strict';
import { createHeadingInertia, headingExitProgress } from '../src/animation/headingInertia.js';
import { createChipRotation, CHIP_ROTATION_DURATION } from '../src/animation/chipRotation.js';
import { createAutoTransitions } from '../src/animation/autoTransitions.js';
import { TRACKS } from '../src/animation/timing.js';
import { advanceStoryMotion, storyMotionFrame } from '../src/animation/storyMotion.js';

test('Both horizontal headings share the chip’s 1.2s inertia at 30/60/120Hz, then stop writing', () => {
  for (const fps of [30, 60, 120]) {
    const headings = createHeadingInertia();
    const chip = createChipRotation();
    headings.update(.7, .7);
    chip.update(.7);
    assert.deepEqual(headings.frame(), { marquee: 0, definition: 0 });
    for (let i = 0; i < fps * (CHIP_ROTATION_DURATION + .1); i++) {
      headings.advance(1 / fps);
      chip.advance(1 / fps);
      assert.deepEqual(headings.frame(), { marquee: chip.value(), definition: chip.value() });
      if (i < fps / 2) assert.ok(headings.frame().marquee < .7);
    }
    assert.deepEqual(headings.frame(), { marquee: .7, definition: .7 });
    assert.equal(headings.advance(1 / fps), false);
  }
});

test('Reverse gestures cancel both heading tails immediately; forward gestures resume inertia', () => {
  const headings = createHeadingInertia();
  headings.update(.9, .6);
  for (let i = 0; i < 20; i++) headings.advance(1 / 60);
  const before = headings.frame();
  headings.update(.1, .2, false, true);
  assert.deepEqual(headings.frame(), { marquee: .1, definition: .2 });
  assert.equal(headings.advance(1 / 60), false, 'Stopping after reverse has no residual motion');
  headings.update(.8, .9);
  assert.deepEqual(headings.frame(), { marquee: .1, definition: .2 });
  headings.advance(1 / 60);
  assert.ok(headings.frame().marquee > .1 && headings.frame().marquee < .8);
  assert.ok(headings.frame().definition > .2 && headings.frame().definition < .9);
  assert.ok(before.marquee > 0 && before.definition > 0);
  headings.update(.5, 1, true);
  assert.deepEqual(headings.frame(), { marquee: .5, definition: 1 });
  assert.equal(headings.advance(.05), false, 'Restore/Reduce Motion cancels pending tails');
});

test('Native reverse scroll clears heading inertia onto the shared visual playhead, not ahead of geometry', () => {
  for (const mobile of [false, true]) for (const fps of [30, 60, 120]) {
    for (const key of ['marquee', 'definition']) {
      const motion = createAutoTransitions(mobile);
      const [start, end] = TRACKS[key];
      const native = start + (end - start) * .7;
      const reverse = start + (end - start) * .6;
      motion.update(start, 0, true);
      motion.update(start + .1, 0, false, native);
      motion.advance(1 / fps);
      assert.ok(motion.frame()[key] < .7);
      // The visual playhead still moves down, but the finger has moved up.
      motion.update(start + .2, 0, false, reverse);
      const shared = .2 / (end - start);
      assert.ok(Math.abs(motion.frame()[key] - shared) < 1e-12);
      for (let i = 0; i < fps * 1.5; i++) {
        motion.update(start + .2, 0, false, reverse);
        motion.advance(1 / fps);
        assert.ok(Math.abs(motion.frame()[key] - shared) < 1e-12, 'No extra reverse tail after the shared playhead stops');
      }
      motion.update(start + .3, 0, false, native);
      assert.ok(Math.abs(motion.frame()[key] - shared) < 1e-12);
      motion.advance(1 / fps);
      assert.ok(motion.frame()[key] > shared && motion.frame()[key] < .7, 'Forward inertia resumes');
    }
  }
});

test('The restored shared reverse handoff never returns a heading over the outgoing text layer', () => {
  for (const mobile of [false, true]) for (const fps of [30, 60, 120]) {
    for (const [key, from, target] of [
      ['definition', TRACKS.story[0] + .8, TRACKS.definition[0] - .3],
      ['marquee', TRACKS.features[0] + 1, TRACKS.marquee[0] + 1],
    ]) {
      const motion = createAutoTransitions(mobile);
      let visual = from;
      motion.update(visual, storyMotionFrame(visual).story, true, from);
      let sawHeading = false;
      for (let i = 0; i < fps * 4; i++) {
        // Desktop has an additional shared geometry follower; mobile still
        // has a lagging ScrollTrigger scrub. Native input has already crossed.
        visual = mobile ? visual + (target - visual) * (1 - Math.exp(-1 / fps / .15))
          : advanceStoryMotion(visual, target, 1 / fps);
        const scene = storyMotionFrame(visual);
        motion.update(visual, scene.story, false, target);
        const rendered = { ...scene, ...motion.frame() };
        const [start, end] = TRACKS[key];
        const expected = Math.min(1, Math.max(0, (visual - start) / (end - start)));
        assert.ok(Math.abs(rendered[key] - expected) < 1e-10, 'Reverse heading shares the scene playhead exactly');
        if (rendered[key] < 1) {
          sawHeading = true;
          if (key === 'definition') {
            assert.equal(rendered.story, 0, 'The old gray geometry has left before the heading returns');
            assert.deepEqual(rendered.storyText, [0, 0, 0, 0]);
          } else assert.deepEqual(rendered.featureText, [0, 0, 0, 0, 0, 0]);
        }
        motion.advance(1 / fps);
      }
      assert.equal(sawHeading, true);
    }
  }
});

test('Reverse movement outside the heading range also cancels a pending forward tail', () => {
  for (const mobile of [false, true]) for (const key of ['marquee', 'definition']) {
    const motion = createAutoTransitions(mobile);
    const [start, end] = TRACKS[key];
    motion.update(start, 0, true);
    motion.update(end + 2, 0, false, end + 2);
    motion.advance(1 / 60);
    assert.equal(motion.frame()[key], 1, 'Leaving the heading range completes its geometric exit');
    motion.update(end + 1, 0, false, end + 1);
    assert.equal(motion.frame()[key], 1, 'Clamped 1→1 still detects a native direction change');
    assert.equal(motion.frame()[key === 'marquee' ? 'definition' : 'marquee'], key === 'marquee' ? 0 : 1);
    motion.update(start - .1, 0, false, start - .1);
    assert.equal(motion.frame()[key], 0, 'The heading cannot linger in a preceding layer');
  }
});

test('Mobile and desktop copy starts at its scroll window without waiting for heading inertia', () => {
  for (const mobile of [false, true]) {
    for (const [key, nextTime, story, copy] of [
      ['marquee', TRACKS.features[0] + .8, 0, 'featureText'],
      ['definition', TRACKS.story[0] + .1, .01, 'storyText'],
    ]) {
      const motion = createAutoTransitions(mobile);
      const track = TRACKS[key];
      motion.update((track[0] + track[1]) / 2, 0, true);
      motion.update(nextTime, story);
      assert.equal(motion.frame()[key], 1, 'The outgoing heading has left when the next text window starts');
      motion.advance(1 / 60);
      assert.ok(motion.frame()[copy][0] > 0, 'The first display tick starts the incoming words');
      assert.equal(motion.frame()[key], 1, 'No trailing letters remain over the incoming words');
      for (let i = 0; i < 160; i++) {
        motion.update(nextTime, story);
        motion.advance(1 / 60);
      }
      assert.equal(motion.frame()[key], 1);
      assert.ok(motion.frame()[copy][0] > 0 && motion.frame()[copy][0] < 1, 'Copy starts without another scroll gesture');
    }
  }
});

test('Forward inertia smoothly rejoins the shared clock only near its exit, without opacity or an added hold', () => {
  for (const inertial of [0, .2, .5, .79]) {
    for (const shared of [0, .2, .5, .79, .8]) assert.equal(headingExitProgress(inertial, shared), inertial);
    let previous = inertial;
    for (let i = 0; i <= 200; i++) {
      const shared = .8 + i / 1000;
      const value = headingExitProgress(inertial, shared);
      assert.ok(value >= previous - 1e-12 && value <= shared + 1e-12);
      assert.ok(value - previous < .009, 'No discontinuity while handing off to the next layer');
      previous = value;
    }
    assert.equal(headingExitProgress(inertial, 1), 1);
  }
});

test('Fast forward swipes never render either incoming text layer with a trailing horizontal heading', () => {
  for (const mobile of [false, true]) for (const fps of [30, 60, 120]) {
    for (const [key, target, copy] of [
      ['marquee', TRACKS.features[0] + .8, 'featureText'],
      ['definition', TRACKS.story[0] + .3, 'storyText'],
    ]) {
      for (const initial of [.3, .7, .95]) {
        const motion = createAutoTransitions(mobile);
        const [start, end] = TRACKS[key];
        const from = start + (end - start) * initial;
        motion.update(from, 0, true);
        let appeared = false;
        for (let i = 0; i <= fps * 2; i++) {
          const p = Math.min(i / (fps * .42), 1);
          const visual = from + (target - from) * (1 - (1 - p) ** 3);
          const scene = storyMotionFrame(visual);
          motion.update(visual, scene.story, false, target);
          const rendered = motion.frame();
          if (rendered[copy][0] > 0 && rendered[copy][0] < 1) {
            appeared = true;
            assert.equal(rendered[key], 1, 'No remaining glyph can overlap the incoming layer');
          }
          if (visual >= end) assert.equal(rendered[key], 1, 'The heading has exited by the original boundary');
          motion.advance(1 / fps);
        }
        assert.equal(appeared, true, 'The next layer still appears, without waiting for the 1.2s tail');
      }
    }
  }
});

test('Native heading targets avoid stacking the geometry scrub; reduced motion renders immediately', () => {
  for (const mobile of [false, true]) {
    const start = TRACKS.definition[0], end = TRACKS.definition[1];
    for (const reduced of [false, true]) {
      const motion = createAutoTransitions(mobile, reduced);
      motion.update(start, 0, true);
      const native = start + (end - start) * .75;
      for (let i = 0; i < 160; i++) {
        motion.update(start + .1, 0, false, native);
        motion.advance(1 / 60);
      }
      assert.ok(Math.abs(motion.frame().definition - .75) < 1e-12);
      motion.update(end, 0, reduced);
      assert.equal(motion.frame().definition, 1, 'The shared exit boundary is respected with or without reduced motion');
    }
  }
});
