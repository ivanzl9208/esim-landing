import test from 'node:test';
import assert from 'node:assert/strict';
import { gsap } from 'gsap';
import { featureWindow, featureReadingProgress, FEATURE_SCROLL_DISTANCE, FEATURE_READING_EXTENSION } from '../src/animation/featureReading.js';
import { createChipStoryRenderer } from '../src/animation/chipStory.js';
import { TRACKS } from '../src/animation/timing.js';

test('Added reading distance freezes text only, preserving continuous forward and reverse progress', () => {
  assert.equal(TRACKS.features[1] - TRACKS.features[0], 14);
  for (const mobile of [false, true]) {
    const values = Array.from({ length: 2001 }, (_, index) => featureReadingProgress(index / 2000, mobile));
    assert.equal(values[0], 0);
    assert.equal(values.at(-1), 1);
    for (let index = 1; index < values.length; index++) {
      assert.ok(values[index] >= values[index - 1]);
      assert.ok(values[index] - values[index - 1] < .001);
    }
    const reverse = Array.from({ length: 2001 }, (_, index) => featureReadingProgress((2000 - index) / 2000, mobile));
    assert.deepEqual(reverse.reverse(), values);
  }
});

test('Every orange feature stays fully legible while the actual chip track advances through each reading pause', () => {
  for (const mobile of [false, true]) {
    const nodes = new Map();
    const node = selector => {
      if (!nodes.has(selector)) nodes.set(selector, {
        style: { setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; } },
        dataset: {}, offsetHeight: 200, offsetWidth: 200, offsetTop: 0,
        querySelector: () => ({ style: {} }), querySelectorAll: () => [],
      });
      return nodes.get(selector);
    };
    const words = Array.from({ length: 6 }, () => Array.from({ length: 5 }, (_, index) => ({ style: {}, closest: () => index > 2 ? {} : null })));
    const features = words.map((units, index) => {
      const element = node(`feature-${index}`);
      element.querySelectorAll = () => units;
      return element;
    });
    let playback;
    const renderer = createChipStoryRenderer({ dataset: {}, querySelector: node,
      querySelectorAll: selector => selector === '.chip-feature' ? features : [],
    }, { setPlayback(value) { playback = value; } });
    const state = { ...Object.fromEntries(Object.keys(TRACKS).map(key => [key, 0])), reveal: 1, buttonReveal: 1 };
    const timeline = gsap.timeline({ paused: true });
    for (const key of ['features', 'playback']) {
      const [start, end, value] = TRACKS[key];
      timeline.fromTo(state, { [key]: 0 }, { [key]: value, duration: end - start, ease: 'none', immediateRender: false }, start);
    }
    const sample = (time, indices) => {
      timeline.seek(time);
      renderer(state, { mobile, width: mobile ? 390 : 1440, height: 900, scale: 1 }, false);
      for (const index of indices) {
        assert.equal(features[index].style.visibility, 'visible');
        for (const unit of words[index]) {
          assert.equal(unit.style.opacity, '1.0000');
          assert.equal(unit.style.filter, 'blur(0.000px)');
          assert.match(unit.style.transform, /^translate3d\(0, -?0\.000px, 0\)$/u);
        }
      }
      return playback;
    };
    const count = mobile ? 6 : 3;
    const hold = FEATURE_READING_EXTENSION / count;
    try {
      for (let slot = 0; slot < count; slot++) {
        const index = mobile ? slot : slot * 2;
        const indices = mobile ? [index] : [index, index + 1];
        const { start, end } = featureWindow(index, mobile);
        const anchor = start + (end - start) * .53;
        const holdStart = TRACKS.features[0] + anchor * FEATURE_SCROLL_DISTANCE + slot * hold;
        const times = [holdStart + .05, holdStart + hold / 2, holdStart + hold - .05];
        const turns = times.map(time => sample(time, indices));
        assert.ok(turns[0] < turns[1] && turns[1] < turns[2]);
        assert.deepEqual([...times].reverse().map(time => sample(time, indices)), [...turns].reverse());
      }
    } finally { timeline.kill(); }
  }
});
