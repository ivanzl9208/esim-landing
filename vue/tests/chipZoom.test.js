import test from 'node:test';
import assert from 'node:assert/strict';
import { chipZoomFrame } from '../src/animation/chipZoom.js';
import { createChipStoryRenderer } from '../src/animation/chipStory.js';
import { TRACKS } from '../src/animation/timing.js';

test('The chip grows through the desktop and mobile storyboard without a boundary jump', () => {
  for (const mobile of [false, true]) {
    const base = mobile ? 280 : 470;
    for (const [zoom, safety, size, y] of mobile
      ? [[0, 0, 280, 47], [1, 0, 339, -104.5], [1, .18, 586, -272], [1, .42, 721, -524.5]]
      : [[0, 0, 470, 0], [1, 0, 575, -172.5], [1, .18, 910, -381], [1, .42, 1182, -770]]) {
      const frame = chipZoomFrame(zoom, safety, mobile);
      assert.ok(Math.abs(frame.scale * base - size) < 1e-8);
      assert.ok(Math.abs(frame.y - y) < 1e-8);
    }
    for (const boundary of [0, .18, .42]) {
      const left = chipZoomFrame(1, boundary - 1e-6, mobile);
      const right = chipZoomFrame(1, boundary + 1e-6, mobile);
      assert.ok(Math.abs(left.scale - right.scale) < .00002);
      assert.ok(Math.abs(left.y - right.y) < .005);
    }
    const frames = Array.from({ length: 100 }, (_, index) => chipZoomFrame(index / 99, 0, mobile));
    for (let index = 1; index < frames.length; index++) {
      assert.ok(frames[index].scale > frames[index - 1].scale);
      assert.ok(frames[index].y <= frames[index - 1].y);
      if (index / 99 <= .2) assert.equal(frames[index].y, mobile ? 47 : 0);
      else assert.ok(frames[index].y < frames[index - 1].y);
    }
    const reverse = Array.from({ length: 100 }, (_, index) => chipZoomFrame((99 - index) / 99, 0, mobile));
    assert.deepEqual(reverse.reverse(), frames);
  }
});

test('Safety copy enters from below the viewport, stays below the chip, and all media share zoom geometry', () => {
  assert.ok(Math.abs(TRACKS.chipZoom[0] - TRACKS.story[1] - .25) < 1e-8);
  assert.equal(TRACKS.chipZoom[1], TRACKS.safety[0]);
  for (const [mobile, width, height, scale] of [[false, 1440, 720, 1], [false, 1762, 1130, 1762 / 1440], [true, 360, 600, 1], [true, 375, 667, 375 / 360]]) {
    const nodes = new Map();
    const node = selector => {
      if (!nodes.has(selector)) nodes.set(selector, {
        style: { setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; } },
        dataset: {}, offsetHeight: (mobile ? 280 : 470) * scale, offsetWidth: 470,
        offsetTop: selector === '.safety-copy' ? (mobile ? 461 : 655) * scale : 0,
        querySelector: () => ({ style: {} }), querySelectorAll: () => [],
      });
      return nodes.get(selector);
    };
    node('.safety-copy').offsetHeight = (mobile ? 416 : 672) * scale;
    let activeStill;
    const renderer = createChipStoryRenderer({ dataset: {}, querySelector: node, querySelectorAll: () => [] }, {
      setPlayback() {}, prepareStill() {}, setStillActive(value) { activeStill = value; },
    });
    const state = { ...Object.fromEntries(Object.keys(TRACKS).map(key => [key, 0])), reveal: 1, chip: 1, story: 1, chipZoom: 0, buttonReveal: 1 };
    const layout = { mobile, width, height, scale };
    const copyTop = () => node('.safety-copy').offsetTop +
      Number(node('.safety-copy').style.transform.match(/, ([\d.-]+)px/u)[1]);
    renderer(state, layout, false);
    assert.equal(node('.safety-copy').style.visibility, 'hidden');
    assert.ok(Math.abs(copyTop() - height) < .01);
    state.chipZoom = .2;
    renderer(state, layout, false);
    assert.equal(node('.safety-copy').style.visibility, 'hidden');
    state.chipZoom = .2002;
    renderer(state, layout, false);
    assert.equal(node('.safety-copy').style.visibility, 'visible');
    assert.ok(Math.abs(copyTop() - height) < .01, 'First visible frame starts at the lower edge');
    let previousTop = copyTop();
    for (let progress = .205; progress <= 1; progress += .005) {
      state.chipZoom = progress;
      renderer(state, layout, false);
      assert.ok(copyTop() <= previousTop + .01, 'Entrance must move upwards continuously');
      assert.ok(previousTop - copyTop() < 5 * scale, 'Slow scroll must not jump');
      previousTop = copyTop();
    }
    state.chipZoom = 1;
    for (const [safety, top] of [[0, height / 2 + (mobile ? 125 : 216) * scale], [.18, height / 2 + (mobile ? 81 : 175) * scale], [.42, height / 2 + (mobile ? -104 : -78) * scale]]) {
      state.safety = safety;
      renderer(state, layout, false);
      const transform = node('.chip-scroll-video').style.transform;
      assert.equal(node('.chip-scroll-frame').style.transform, transform);
      assert.equal(node('.chip-scroll-still').style.transform, transform);
      const offset = Number(node('.safety-copy').style.transform.match(/, ([\d.-]+)px/u)[1]);
      assert.ok(Math.abs(node('.safety-copy').offsetTop + offset - top) < .01);
      assert.equal(activeStill, true);
    }
    state.safety = 0;
    renderer(state, layout, true);
    assert.equal(activeStill, false);
    assert.match(node('.chip-scroll-still').style.transform, /scale\(1\.00000\)/u);
    state.chipZoom = 0;
    renderer(state, layout, false);
    assert.equal(activeStill, true);
    assert.match(node('.chip-scroll-still').style.transform, /scale\(1\.00000\)/u);
    state.story = 0;
    renderer(state, layout, false);
    assert.equal(activeStill, false);
  }
});
