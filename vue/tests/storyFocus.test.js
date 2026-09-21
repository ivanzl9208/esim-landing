import test from 'node:test';
import assert from 'node:assert/strict';
import { desktopStoryFrame } from '../src/animation/storyFocus.js';

test('Desktop focus states match Figma 31, 33, 35 and 37', () => {
  const expected = [[1, .6, .4, .2], [.2, 1, .6, .4], [.2, .2, 1, .6], [.2, .2, .2, 1]];
  expected.forEach((opacities, active) => {
    const progress = (active + .5) / 4;
    opacities.forEach((opacity, index) => assert.deepEqual(desktopStoryFrame(progress, index), {
      opacity, blur: index === active ? 0 : 10,
    }));
  });
});

test('Inactive labels stay present throughout the scene, including reverse scroll', () => {
  for (let step = 8; step <= 390; step++) {
    const progress = step / 400;
    for (let index = 0; index < 4; index++) {
      const forward = desktopStoryFrame(progress, index);
      desktopStoryFrame(1, index);
      assert.deepEqual(desktopStoryFrame(progress, index), forward);
      assert.ok(forward.opacity >= .2 - 1e-12);
    }
  }
  for (const progress of [0, 1]) {
    for (let index = 0; index < 4; index++) assert.equal(desktopStoryFrame(progress, index).opacity, 0);
  }
});
