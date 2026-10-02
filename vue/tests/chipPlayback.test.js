import test from 'node:test';
import assert from 'node:assert/strict';
import { gsap } from 'gsap';
import { createChipStoryRenderer } from '../src/animation/chipStory.js';
import { TRACKS } from '../src/animation/timing.js';

function fixture() {
  const nodes = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, {
      style: { setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; } },
      dataset: {}, offsetHeight: 200, offsetWidth: 200, offsetTop: 0,
      querySelector: () => ({ dispatchEvent() {} }),
      querySelectorAll: () => [],
    });
    return nodes.get(selector);
  };
  let playback;
  const benefits = Array.from({ length: 4 }, (_, index) => node(`benefit-${index}`));
  const render = createChipStoryRenderer({ dataset: {}, querySelector: node, querySelectorAll: selector => selector === '.story-benefit' ? benefits : [] }, {
    setPlayback(progress, turns) { playback = { progress, turns }; },
  });
  return { node, benefits, render, get playback() { return playback; } };
}

test('Chip continues turning until the definition leaves, including reverse scroll', () => {
  const media = fixture();
  const state = { ...Object.fromEntries(Object.keys(TRACKS).map(key => [key, 0])), reveal: 1, buttonReveal: 1 };
  const timeline = gsap.timeline({ paused: true });
  for (const key of ['playback', 'definitionTurn', 'definition']) {
    const [start, end, value] = TRACKS[key];
    timeline.fromTo(state, { [key]: 0 }, { [key]: value, duration: end - start, ease: 'none', immediateRender: false }, start);
  }
  const sample = time => {
    timeline.seek(time);
    media.render(state, { mobile: false, width: 832, height: 1130, scale: 1 }, false);
    return { ...media.playback, definition: state.definition };
  };
  try {
    const playbackMiddle = (TRACKS.playback[0] + TRACKS.playback[1]) / 2;
    assert.equal(sample(playbackMiddle).progress, 1.5);
    assert.equal(sample(TRACKS.playback[1]).progress, 3);
    const definitionMiddle = (TRACKS.definitionTurn[0] + TRACKS.definitionTurn[1]) / 2;
    const middle = sample(definitionMiddle);
    assert.equal(middle.progress, 3.5);
    assert.ok(middle.definition < 1);
    const end = sample(TRACKS.definition[1]);
    assert.equal(end.progress, 4);
    assert.equal(end.turns, 4);
    assert.equal(end.definition, 1);
    assert.deepEqual(sample(definitionMiddle), middle);
    assert.equal(sample(TRACKS.playback[1]).progress, 3);
    assert.equal(sample(playbackMiddle).progress, 1.5);
  } finally {
    timeline.kill();
  }
});

test('Chip lifts and grows while safety copy enters on the first zoom, in both directions', () => {
  for (const mobile of [false, true]) {
    const media = fixture();
    const state = { ...Object.fromEntries(Object.keys(TRACKS).map(key => [key, 1])), story: 0, chipZoom: 0, safety: 0, outro: 0, returnGradient: 0, buttonReveal: 1 };
    const timeline = gsap.timeline({ paused: true });
    for (const key of ['story', 'chipZoom', 'safety']) {
      const [start, end, value] = TRACKS[key];
      timeline.fromTo(state, { [key]: 0 }, { [key]: value, duration: end - start, ease: 'none', immediateRender: false }, start);
    }
    const sample = time => {
      timeline.seek(time);
      media.render(state, { mobile, width: mobile ? 430 : 832, height: 1130, scale: 1 }, false);
      return {
        chip: media.node('.chip-scroll-video').style.transform,
        safety: media.node('.safety-copy').style.visibility,
        copy: media.node('.safety-copy').style.transform,
        theses: media.benefits.map(element => element.style.opacity),
      };
    };
    try {
      const holdStart = TRACKS.story[1];
      const holdEnd = TRACKS.safety[0];
      const holdSamples = [.02, .28, .55, .8, .96].map(progress => holdStart + (holdEnd - holdStart) * progress);
      const samples = holdSamples.map(sample);
      for (const [index, frame] of samples.entries()) {
        assert.match(frame.chip, /calc\(-50% \+ 0.00px\)/);
        assert.equal(frame.safety, holdSamples[index] > TRACKS.chipZoom[0] ? 'visible' : 'hidden');
        assert.deepEqual(frame.theses, Array(4).fill('0.0000'));
      }
      const scales = samples.map(frame => Number(frame.chip.match(/scale\(([\d.]+)\)/u)[1]));
      for (let index = 1; index < scales.length; index++) assert.ok(scales[index] > scales[index - 1]);
      const offsets = samples.map(frame => Number(frame.copy.match(/, ([\d.-]+)px/u)[1]));
      for (let index = 1; index < offsets.length; index++) assert.ok(offsets[index] < offsets[index - 1]);
      assert.equal(sample(holdEnd + 0.22).safety, 'visible');
      assert.deepEqual([...holdSamples].reverse().map(sample), [...samples].reverse());
    } finally {
      timeline.kill();
    }
  }
});
