import test from 'node:test';
import assert from 'node:assert/strict';
import { createChipRotation, CHIP_ROTATION_DURATION } from '../src/animation/chipRotation.js';
import { createAutoTransitions } from '../src/animation/autoTransitions.js';
import { TRACKS } from '../src/animation/timing.js';

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

test('Restoration, hidden scenes and fixed front pose cancel an obsolete rotation tail', () => {
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
