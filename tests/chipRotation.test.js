import test from 'node:test';
import assert from 'node:assert/strict';
import { createChipRotation, CHIP_ROTATION_DURATION } from '../src/animation/chipRotation.js';
import { createAutoTransitions } from '../src/animation/autoTransitions.js';
import { TRACKS } from '../src/animation/timing.js';
import { readFile } from 'node:fs/promises';

test('Rotation keeps moving after scroll stops and settles in 1.2 seconds at different refresh rates', () => {
  for (const fps of [30, 60, 120]) {
    const rotation = createChipRotation();
    rotation.update(1);
    let previous = 0;
    for (let frame = 0; frame < Math.floor(fps * (CHIP_ROTATION_DURATION - .1)); frame++) {
      rotation.advance(1 / fps);
      assert.ok(rotation.value() > previous && rotation.value() < 1);
      previous = rotation.value();
    }
    assert.ok(rotation.moving());
    for (let frame = 0; frame < Math.ceil(fps * .12) + 1; frame++) rotation.advance(1 / fps);
    assert.equal(rotation.value(), 1);
    assert.equal(rotation.advance(1 / fps), false);
  }
});

test('Reversing and crossing video loops keep the current pose and never overshoot', () => {
  const rotation = createChipRotation(.9);
  rotation.update(1.3);
  for (let frame = 0; frame < 20; frame++) rotation.advance(1 / 60);
  const pose = rotation.value();
  assert.ok(pose > 1 && pose < 1.3);
  rotation.update(.7);
  assert.equal(rotation.value(), pose);
  let previous = pose;
  for (let frame = 0; frame < 74; frame++) {
    rotation.advance(1 / 60);
    assert.ok(rotation.value() <= previous && rotation.value() >= .7);
    previous = rotation.value();
  }
  assert.equal(rotation.value(), .7);
});

test('Restoration, hidden scenes and reduced motion cancel an obsolete rotation tail', () => {
  const rotation = createChipRotation();
  rotation.update(2);
  rotation.advance(.05);
  for (const pose of [4, 0, 2.5]) {
    rotation.update(pose, true);
    assert.equal(rotation.value(), pose);
    assert.equal(rotation.advance(.05), false);
  }
  rotation.update(2.6);
  rotation.advance(.05);
  assert.ok(rotation.value() > 2.5 && rotation.value() < 2.6);
});

test('Entering the static gray scene finishes a lagging turn without replacing its current pose', async () => {
  const scene = await readFile(new URL('../src/composables/useScrollScene.js', import.meta.url), 'utf8');
  // Guard the actual integration: static geometry sets the target, not an
  // immediate update that would cancel the follower at the scene boundary.
  assert.match(scene, /const turns = fixedPose \? TRACKS\.playback\[2\] : autoTransitions\.playbackAt\(nativeTime\)/);
  assert.match(scene, /chipRotation\.update\(turns, immediate \|\| initializing \|\| reduced \|\| renderedState\.reveal === 0\)/);
  for (const fps of [30, 60, 120]) {
    for (const start of [2.7, 3.65, 3.98]) {
      const rotation = createChipRotation(start);
      rotation.update(TRACKS.playback[2]);
      assert.equal(rotation.value(), start, 'Crossing into the first text cannot replace the displayed pose');
      let previous = start;
      const samples = [];
      for (let frame = 0; frame < Math.ceil(fps * (CHIP_ROTATION_DURATION + .1)); frame++) {
        rotation.advance(1 / fps);
        const pose = rotation.value();
        assert.ok(pose >= previous && pose <= 4, 'Completion follows the original forward rotation');
        assert.ok(pose - previous < (4 - start) * .12, 'No single-frame jump to the front');
        samples.push(pose);
        previous = pose;
      }
      assert.ok(new Set(samples).size > 10, 'Intermediate orientations remain visible');
      assert.equal(rotation.value(), 4);
      assert.equal(rotation.moving(), false);
      assert.equal(rotation.advance(1 / fps), false, 'The gray scene stays static after completion');
    }
  }
});

test('Reversing an unfinished front-pose handoff continues from the visible orientation', () => {
  for (const fps of [30, 60, 120]) {
    const rotation = createChipRotation(3.6);
    rotation.update(4);
    for (let frame = 0; frame < fps / 4; frame++) rotation.advance(1 / fps);
    const pose = rotation.value();
    rotation.update(3.5);
    assert.equal(rotation.value(), pose, 'Reverse scrolling does not reset an unfinished handoff');
    rotation.advance(1 / fps);
    assert.ok(rotation.value() < pose && rotation.value() > 3.5);
    for (let frame = 0; frame < fps * 1.3; frame++) rotation.advance(1 / fps);
    assert.equal(rotation.value(), 3.5);
  }
});

test('Native rotation target shares the opened shutter anchor without advancing text or geometry', () => {
  for (const mobile of [false, true]) {
    const transitions = createAutoTransitions(mobile);
    const opening = TRACKS.reveal[0] + .01;
    transitions.update(opening, 0);
    transitions.advance(1.1);
    transitions.update(opening, 0);
    const frame = transitions.frame();
    assert.equal(frame.playback, 0);
    const moved = opening + .1;
    assert.ok(Math.abs(transitions.playbackAt(moved) - 4 * .1 / (TRACKS.playback[1] - opening)) < 1e-12);
    assert.deepEqual(transitions.frame(), frame);
    assert.equal(transitions.playbackAt(TRACKS.playback[1]), 4);
    assert.equal(transitions.playbackAt(0), 0);
  }
});
