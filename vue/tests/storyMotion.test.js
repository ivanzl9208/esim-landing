import test from 'node:test';
import assert from 'node:assert/strict';
import { gsap } from 'gsap';
import { storyMotionFrame, advanceStoryMotion, STORY_SIDE_SPEED } from '../src/animation/storyMotion.js';
import { storyComposition } from '../src/animation/storyComposition.js';
import { chipZoomFrame } from '../src/animation/chipZoom.js';
import { TRACKS } from '../src/animation/timing.js';

function position(time, mobile) {
  const frame = storyMotionFrame(time);
  const side = mobile ? 0 : storyComposition(frame.story, 4, false, frame.storyCenter).side;
  return { ...frame, x: side, ...chipZoomFrame(frame.chipZoom, frame.safety, mobile) };
}

test('Fast jumps through the final return never combine lateral movement with growth or lift, including reverse and interruption', () => {
  const column = TRACKS.story[1] - 1;
  const zoom = TRACKS.safety[0] + 1;
  for (const mobile of [false, true]) {
    const motion = { time: column };
    const targets = [zoom, column, zoom, TRACKS.storyCenter[0], zoom, column];
    for (const target of targets) {
      const tween = gsap.to(motion, { time: target, duration: .75, ease: 'power2.out', paused: true });
      try {
        for (let index = 0; index <= 150; index++) {
          tween.progress(index / 150);
          const frame = position(motion.time, mobile);
          if (frame.chipZoom > 0 || frame.safety > 0) {
            assert.equal(frame.x, 0, 'The chip must already be centred whenever it grows or lifts');
            assert.equal(frame.storyCenter, 1);
          }
          if (Math.abs(frame.x) > .0001) {
            assert.equal(frame.scale, 1);
            assert.equal(frame.y, mobile ? 47 : 0);
          }
          // Reverse the target before completion too, as with an interrupted wheel gesture.
          if (target === TRACKS.storyCenter[0] && index === 60) break;
        }
      } finally { tween.kill(); }
    }
  }
});

test('Shared motion preserves scroll distances, centred hold, geometry and forward/reverse sampling', () => {
  for (const mobile of [false, true]) {
    assert.equal(position(TRACKS.storyCenter[0], mobile).scale, 1);
    const centre = position(TRACKS.storyCenter[1], mobile);
    for (let step = 0; step <= 10; step++) {
      const held = position(TRACKS.storyCenter[1] + step / 10 * (TRACKS.chipZoom[0] - TRACKS.storyCenter[1]), mobile);
      assert.equal(held.x, centre.x);
      assert.equal(held.y, centre.y);
      assert.equal(held.scale, centre.scale);
    }
    const start = TRACKS.storyCenter[0];
    const duration = TRACKS.safety[1] - start;
    const forward = Array.from({ length: 1001 }, (_, index) => position(start + duration * index / 1000, mobile));
    const reverse = Array.from({ length: 1001 }, (_, index) => position(start + duration * (1000 - index) / 1000, mobile));
    assert.deepEqual(reverse.reverse(), forward);
    for (const [zoom, safety] of [[.25, 0], [.75, 0], [1, .18], [1, .42]]) {
      const time = safety ? TRACKS.safety[0] + (TRACKS.safety[1] - TRACKS.safety[0]) * safety
        : TRACKS.chipZoom[0] + (TRACKS.chipZoom[1] - TRACKS.chipZoom[0]) * zoom;
      const actual = position(time, mobile);
      const reference = chipZoomFrame(zoom, safety, mobile);
      assert.ok(Math.abs(actual.scale - reference.scale) < 1e-10);
      assert.ok(Math.abs(actual.y - reference.y) < 1e-10);
    }
  }
});


test('All lateral transfers obey the same speed budget at 30/60/120 fps and settle without diagonal zoom', () => {
  const distance = (TRACKS.story[1] - TRACKS.story[0]) / 4;
  const windows = [
    [TRACKS.story[0], TRACKS.story[0] + .525],
    ...[1, 2, 3].map(index => [TRACKS.story[0] + distance * index - .525, TRACKS.story[0] + distance * index + .525]),
    [TRACKS.storyCenter[0], TRACKS.storyCenter[1]],
  ];
  for (const fps of [30, 60, 120]) {
    const delta = 1 / fps;
    for (const [start, end] of windows) {
      for (const backwards of [false, true]) {
        const target = backwards ? start : end;
        let time = backwards ? end : start;
        let peak = 0;
        let frames = 0;
        while (Math.abs(time - target) > 1e-8 && frames++ < 1000) {
          const previous = position(time, false);
          time = advanceStoryMotion(time, target, delta);
          const current = position(time, false);
          const speed = Math.abs(current.x - previous.x) / delta;
          peak = Math.max(peak, speed);
          assert.ok(speed <= STORY_SIDE_SPEED + .0001);
          assert.equal(current.y, 0);
          assert.equal(current.scale, 1);
        }
        assert.ok(frames < 1000, 'The follower must finish when scrolling stops');
        assert.ok(Math.abs(peak - STORY_SIDE_SPEED) < .001, 'Every transfer uses the same maximum lateral speed');
      }
    }
    let time = TRACKS.story[1] - 1;
    for (const target of [TRACKS.safety[0] + 1, TRACKS.story[1] - 1]) {
      for (let frames = 0; frames < 1000 && Math.abs(time - target) > 1e-8; frames++) {
        time = advanceStoryMotion(time, target, delta);
        const current = position(time, false);
        if (current.chipZoom > 0 || current.safety > 0) assert.equal(current.x, 0);
      }
      assert.ok(Math.abs(time - target) < 1e-8);
    }
  }
});

test('Interrupted lateral movement reverses with the same speed budget; slow scroll and restored states retain geometry', () => {
  const start = TRACKS.storyCenter[0];
  const end = TRACKS.storyCenter[1];
  let time = start;
  for (const target of [end, start, end, start]) {
    for (let step = 0; step < 15; step++) {
      const before = position(time, false);
      time = advanceStoryMotion(time, target, 1 / 60);
      const after = position(time, false);
      assert.ok(Math.abs(after.x - before.x) <= STORY_SIDE_SPEED / 60 + .00001);
      assert.equal(after.scale, 1);
    }
  }
  for (const startTime of [0, TRACKS.story[0] - 1, start, end, TRACKS.safety[0]]) {
    assert.equal(advanceStoryMotion(startTime, startTime, 1 / 60), startTime);
  }
  assert.equal(advanceStoryMotion(0, 20, 1 / 60), 20);
  for (const direction of [-1, 1]) {
    for (let step = 1; step < 100; step++) {
      const from = start + step * .001;
      const to = from + direction * .001;
      assert.ok(Math.abs(advanceStoryMotion(from, to, 1 / 60) - to) < 1e-10);
    }
  }
});
