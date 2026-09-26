import test from 'node:test';
import assert from 'node:assert/strict';
import { createChipStoryRenderer } from '../src/animation/chipStory.js';
import { TRACKS } from '../src/animation/timing.js';

test('Opening curtain keeps controls live without reading hidden chip layout every frame', () => {
  let layoutReads = 0;
  let visibilityEvents = 0;
  const nodes = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, {
      style: { setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; } },
      dataset: {}, inert: false,
      get offsetHeight() { layoutReads++; return 200; },
      get offsetWidth() { layoutReads++; return 200; },
      get offsetTop() { layoutReads++; return 0; },
      querySelector: () => ({ dispatchEvent() { visibilityEvents++; } }),
    });
    return nodes.get(selector);
  };
  const render = createChipStoryRenderer({ dataset: {}, querySelector: node, querySelectorAll: () => [] }, { setPlayback() {} });
  const state = { ...Object.fromEntries(Object.keys(TRACKS).map(key => [key, 0])), buttonReveal: 1 };
  const layout = { mobile: true, width: 360, height: 600, scale: 1 };
  render(state, layout, false);
  const initialReads = layoutReads;
  for (let i = 1; i <= 30; i++) {
    state.curtain = i / 30;
    render(state, layout, false);
  }
  assert.equal(layoutReads, initialReads);
  assert.equal(node('.hero-surface').inert, true);
  assert.equal(node('.roulette-button').inert, false);
  assert.equal(node('.roulette-button').style['--button-curtain-split'], '0%');
  assert.equal(node('.roulette-bottom-fade').style.opacity, 1);
  assert.equal(visibilityEvents, 1);

  // Changing geometry must still recompute the composition once.
  render(state, { ...layout, height: 650 }, false);
  assert.ok(layoutReads > initialReads);
  // Traversing the chip and returning to the opening resets its hidden state.
  state.reveal = .5;
  render(state, layout, false);
  assert.equal(node('.chip-reveal-layer').style.visibility, 'visible');
  state.reveal = 0;
  state.curtain = 0;
  render(state, layout, false);
  assert.equal(node('.chip-reveal-layer').style.visibility, 'hidden');
  assert.equal(node('.hero-surface').inert, false);
  assert.equal(visibilityEvents, 2);
});
