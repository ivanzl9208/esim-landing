import test from 'node:test';
import assert from 'node:assert/strict';
import { storyComposition, STORY_ENTER_END, STORY_EXIT_START } from '../src/animation/storyComposition.js';
import { TRACKS } from '../src/animation/timing.js';

test('the object alternates opposite the four theses and rejoins adjacent scenes at the centre', () => {
  assert.deepEqual(storyComposition(0, 4), { side: 0, presence: 0 });
  assert.deepEqual(storyComposition(1, 4), { side: 0, presence: 0 });
  assert.deepEqual([.125, .375, .625, .875].map(p => storyComposition(p, 4).side), [-1, 1, -1, 1]);
});

test('forward and reverse sampling is continuous across column changes', () => {
  const forward = Array.from({ length: 1001 }, (_, i) => storyComposition(i / 1000, 4).side);
  const reverse = Array.from({ length: 1001 }, (_, i) => storyComposition((1000 - i) / 1000, 4).side);
  assert.deepEqual(reverse.reverse(), forward);
  for (let i = 1; i < forward.length; i++) assert.ok(Math.abs(forward[i] - forward[i - 1]) < .04);
});

test('all four theses double their reading hold while preserving entrance and exit distances', () => {
  const distance = (TRACKS.story[1] - TRACKS.story[0]) / 4;
  assert.ok(Math.abs(distance * STORY_ENTER_END - 0.525) < 1e-10);
  assert.ok(Math.abs(distance * (1 - STORY_EXIT_START) - 0.525) < 1e-10);
  assert.ok(Math.abs(distance * (STORY_EXIT_START - STORY_ENTER_END) - 2.1) < 1e-10);
  for (let index = 0; index < 4; index++) {
    const side = index % 2 ? 1 : -1;
    for (const local of [STORY_ENTER_END, 0.25, 0.5, 0.75, STORY_EXIT_START]) {
      assert.deepEqual(storyComposition((index + local) / 4, 4), { side, presence: 1 });
    }
  }
});

test('reduced motion uses stationary columns without scaling or intermediate travel', () => {
  for (let i = 0; i <= 100; i++) {
    const frame = storyComposition(i / 100, 4, true);
    assert.ok([-1, 0, 1].includes(frame.side));
    assert.equal(frame.presence, 0);
  }
});

test('Final return uses twice the scroll distance without changing previous column changes or growth durations', () => {
  const [start, end] = TRACKS.storyCenter;
  const duration = end - start;
  const previousDuration = (TRACKS.story[1] - TRACKS.story[0]) / 4 * (1 - STORY_EXIT_START);
  assert.ok(Math.abs(duration - previousDuration * 2) < 1e-10);
  assert.ok(Math.abs(TRACKS.chipZoom[0] - end - .25) < 1e-10);
  assert.equal(TRACKS.chipZoom[1] - TRACKS.chipZoom[0], 2);
  const sample = time => storyComposition((time - TRACKS.story[0]) / (TRACKS.story[1] - TRACKS.story[0]),
    4, false, (time - start) / duration);
  assert.equal(sample(start).side, 1);
  assert.ok(Math.abs(sample(TRACKS.story[1]).side - .5) < 1e-10,
    'Chip is halfway back when the old faster return would already finish');
  assert.equal(sample(end).side, 0);
  const forward = Array.from({ length: 101 }, (_, index) => sample(start + duration * index / 100));
  for (let index = 1; index < forward.length; index++) {
    assert.ok(forward[index].side < forward[index - 1].side);
    assert.ok(forward[index - 1].side - forward[index].side < .016);
  }
  assert.deepEqual(Array.from({ length: 101 }, (_, index) => sample(start + duration * (100 - index) / 100)), [...forward].reverse());
  for (const progress of [.125, .375, .625, .875]) {
    assert.deepEqual(storyComposition(progress, 4, false, 0), storyComposition(progress, 4));
  }
  assert.equal(storyComposition(1, 4, true, .5).side, 0);
});
