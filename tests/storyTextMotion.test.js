import test from 'node:test';
import assert from 'node:assert/strict';
import { createChipStoryRenderer } from '../src/animation/chipStory.js';
import { TRACKS } from '../src/animation/timing.js';
import { STORY_ENTER_END, STORY_EXIT_START } from '../src/animation/storyComposition.js';
import { featureWindow, FEATURE_SCROLL_DISTANCE, FEATURE_READING_EXTENSION } from '../src/animation/featureReading.js';

const fixture = () => {
  const nodes = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, {
      style: { setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; } },
      dataset: {}, offsetHeight: 200, offsetWidth: 200, offsetTop: 0,
      querySelector: () => ({ style: {} }), querySelectorAll: () => [],
    });
    return nodes.get(selector);
  };
  let wordWrites = 0;
  const words = inParagraph => Array.from({ length: 3 }, () => ({
    style: new Proxy({}, { set(target, key, value) { wordWrites++; target[key] = value; return true; } }),
    closest: () => inParagraph ? {} : null,
  }));
  const featureWords = words(false);
  const feature = node('feature');
  feature.querySelectorAll = () => featureWords;
  const storyWords = Array.from({ length: 4 }, () => words(true));
  const stories = storyWords.map((units, index) => {
    const element = node(`story-${index}`);
    element.querySelectorAll = () => units;
    return element;
  });
  const renderer = createChipStoryRenderer({ dataset: {}, querySelector: node,
    querySelectorAll: selector => selector === '.chip-feature' ? [feature] : selector === '.story-benefit' ? stories : [],
  }, { setPlayback() {} });
  const state = { ...Object.fromEntries(Object.keys(TRACKS).map(key => [key, 1])), safety: 0, outro: 0, returnGradient: 0, buttonReveal: 1 };
  const render = (local, featureLocal, index, mobile = false, reduced = false) => {
    state.story = (index + local) / 4;
    // The original feature timing differs on mobile; compare the same phase.
    const originalProgress = mobile ? .035 + .142 * featureLocal : .045 + .255 * featureLocal;
    const count = mobile ? 6 : 3;
    const passedHolds = Array.from({ length: count }, (_, slot) => {
      const { start, end } = featureWindow(mobile ? slot : slot * 2, mobile);
      return originalProgress > start + (end - start) * .53;
    }).filter(Boolean).length;
    state.features = (originalProgress * FEATURE_SCROLL_DISTANCE + passedHolds * FEATURE_READING_EXTENSION / count) /
      (FEATURE_SCROLL_DISTANCE + FEATURE_READING_EXTENSION);
    renderer(state, { mobile, width: mobile ? 390 : 1440, height: 900, scale: 1 }, reduced);
    return storyWords[index].map(unit => ({ ...unit.style }));
  };
  return { render, featureWords, stories, wordWrites: () => wordWrites };
};

test('Settled words do not receive repeated style writes; reverse and Reduce Motion invalidate their cached state', () => {
  const { render, wordWrites } = fixture();
  const settled = render(.5, .5, 0, true);
  const writes = wordWrites();
  for (let i = 0; i < 60; i++) assert.deepEqual(render(.5, .5, 0, true), settled);
  assert.equal(wordWrites(), writes, 'Other scene animation must not rewrite unchanged words');
  const reverse = render(.1, .1, 0, true);
  assert.notDeepEqual(reverse, settled);
  assert.deepEqual(render(.5, .5, 0, true), settled);
  assert.equal(render(.1, .1, 0, true, true)[0].filter, 'blur(0.000px)');
  assert.deepEqual(render(.1, .1, 0, true), reverse);
});

test('All four gray theses reuse the orange heading word effect and keep their reading hold', () => {
  for (const mobile of [false, true]) {
    const { render, featureWords, stories } = fixture();
    for (let index = 0; index < 4; index++) {
      for (const phase of [.15, .5, .9]) {
        const entering = render(STORY_ENTER_END * phase, .38 * phase, index, mobile);
        assert.deepEqual(entering, featureWords.map(unit => ({ ...unit.style })));
        assert.equal(stories[index].style.filter, undefined);
        assert.ok(Number(entering[0].opacity) > Number(entering[2].opacity));
        const exiting = render(STORY_EXIT_START + (1 - STORY_EXIT_START) * phase, .68 + .32 * phase, index, mobile);
        assert.deepEqual(exiting, featureWords.map(unit => ({ ...unit.style })));
        assert.deepEqual(render(STORY_ENTER_END * phase, .38 * phase, index, mobile), entering);
      }
      for (const local of [STORY_ENTER_END, .5, STORY_EXIT_START]) {
        for (const unit of render(local, .5, index, mobile)) {
          assert.equal(unit.opacity, '1.0000');
          assert.equal(unit.filter, 'blur(0.000px)');
          assert.match(unit.transform, /^translate3d\(0, -?0\.000px, 0\)$/u);
        }
      }
      render(0, 0, index, mobile);
      assert.equal(stories[index].style.visibility, 'hidden');
      render(1, 1, index, mobile);
      assert.equal(stories[index].style.visibility, 'hidden');
      for (const unit of render(.08, .2, index, mobile, true)) {
        assert.equal(unit.filter, 'blur(0.000px)');
        assert.equal(unit.transform, 'translate3d(0, 0.000px, 0)');
      }
    }
  }
});
