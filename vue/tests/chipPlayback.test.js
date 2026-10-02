import test from 'node:test';
import assert from 'node:assert/strict';
import { gsap } from 'gsap';
import { createChipStoryRenderer } from '../src/animation/chipStory.js';
import { TRACKS } from '../src/animation/timing.js';
import { SAFETY_COPY } from '../src/data/story.js';
import { typograph } from '../src/utils/typography.js';

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
  const characters = [...typograph(SAFETY_COPY)].filter(character => character !== '\n').map(textContent => ({ textContent, style: {} }));
  const render = createChipStoryRenderer({ dataset: {}, querySelector: node, querySelectorAll: selector =>
    selector === '.story-benefit' ? benefits : selector === '.safety-character' ? characters : [] }, {
    setPlayback(progress, turns) { playback = { progress, turns }; },
  });
  return { node, benefits, characters, render, get playback() { return playback; } };
}

test('Safety copy enters grey, fills its first phrase early and reverses continuously', () => {
  for (const mobile of [false, true]) {
    const media = fixture();
    const state = { ...Object.fromEntries(Object.keys(TRACKS).map(key => [key, 0])), reveal: 1, chip: 1, story: 1, buttonReveal: 1 };
    const sample = (chipZoom, safety) => {
      media.render({ ...state, chipZoom, safety }, { mobile, width: mobile ? 375 : 1440, height: 720, scale: 1 }, false);
      return { visibility: media.node('.safety-copy').style.visibility, colors: media.characters.map(character => character.style.color) };
    };
    const entrance = sample(.5, 0);
    assert.equal(entrance.visibility, 'visible');
    assert.ok(entrance.colors.every(color => color.endsWith('0.1000)')));
    const entering = sample(1, 0);
    const firstPhraseLength = 'А ещё eSIM'.length;
    const filledCharacters = entering.colors.slice(0, firstPhraseLength)
      .map(color => Number(color.match(/, ([\d.]+)\)$/u)[1]));
    const equivalentFilledCharacters = filledCharacters.reduce((sum, alpha) => sum + (alpha - .1) / .76, 0);
    assert.ok(equivalentFilledCharacters >= firstPhraseLength * .45 && equivalentFilledCharacters <= firstPhraseLength * .65,
      'About half the first line is filled before the initial zoom ends');
    assert.ok(entering.colors.at(-1).endsWith('0.1000)'));
    const firstLine = sample(1, .2);
    assert.ok(firstLine.colors.slice(0, 'А ещё eSIM'.length).every(color => color.endsWith('0.8600)')),
      'At least the first line is filled while the copy is moving into view');
    assert.ok(firstLine.colors.at(-1).endsWith('0.1000)'));
    const filling = sample(1, .66);
    assert.ok(filling.colors[0].endsWith('0.8600)'));
    assert.ok(filling.colors.at(-1).endsWith('0.1000)'));
    assert.deepEqual(sample(1, .2), firstLine);
    assert.deepEqual(sample(1, 0), entering);
    assert.deepEqual(sample(.5, 0), entrance);
  }
});

test('Chip continues turning until the definition leaves, including reverse scroll', () => {
  const media = fixture();
  const state = { ...Object.fromEntries(Object.keys(TRACKS).map(key => [key, 0])), reveal: 1, buttonReveal: 1 };
  const timeline = gsap.timeline({ paused: true });
  for (const key of ['playback', 'definition']) {
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
    assert.equal(sample(playbackMiddle).progress, 2);
    assert.equal(sample(TRACKS.playback[1]).progress, 4);
    const definitionMiddle = (TRACKS.definition[0] + TRACKS.definition[1]) / 2;
    const middle = sample(definitionMiddle);
    assert.ok(middle.progress > 3 && middle.progress < 4);
    assert.ok(middle.definition < 1);
    const end = sample(TRACKS.definition[1]);
    assert.equal(end.progress, 4);
    assert.equal(end.turns, 4);
    assert.equal(end.definition, 1);
    assert.deepEqual(sample(definitionMiddle), middle);
    assert.equal(sample(TRACKS.playback[1]).progress, 4);
    assert.equal(sample(playbackMiddle).progress, 2);
  } finally {
    timeline.kill();
  }
});

test('Equal scroll distances rotate the chip equally across features, reading holds and the former definition boundary', () => {
  for (const mobile of [false, true]) {
    const media = fixture();
    const state = { ...Object.fromEntries(Object.keys(TRACKS).map(key => [key, 0])), reveal: 1, chip: 1, buttonReveal: 1 };
    const timeline = gsap.timeline({ paused: true });
    const [start, end, turns, ease] = TRACKS.playback;
    timeline.fromTo(state, { playback: 0 }, { playback: turns, duration: end - start, ease, immediateRender: false }, start);
    const sample = time => {
      timeline.seek(time);
      media.render(state, { mobile, width: mobile ? 375 : 1762, height: 900, scale: 1 }, false);
      return media.playback.progress;
    };
    try {
      const times = Array.from({ length: 1001 }, (_, index) => start + (end - start) * index / 1000);
      const values = times.map(sample);
      for (let index = 1; index < values.length; index++) {
        assert.ok(Math.abs(values[index] - values[index - 1] - turns / 1000) < 2e-6);
      }
      // This was where the independent last turn accelerated by 2.36x.
      const previousBoundary = 28.55;
      assert.ok(Math.abs((sample(previousBoundary + .05) - sample(previousBoundary)) -
        (sample(previousBoundary) - sample(previousBoundary - .05))) < 2e-6);
      assert.deepEqual([...times].reverse().map(sample), [...values].reverse());
      assert.equal(sample(end + 1), 4);
      assert.equal(media.playback.turns, 4, 'The high-res still still matches the complete final turn');
    } finally { timeline.kill(); }
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
        chip: media.node('.chip-media-wrapper').style.transform,
        safety: media.node('.safety-copy').style.visibility,
        copy: media.node('.safety-copy').style.transform,
        theses: media.benefits.map(element => element.style.opacity),
      };
    };
    try {
      const holdStart = TRACKS.storyCenter[1];
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
