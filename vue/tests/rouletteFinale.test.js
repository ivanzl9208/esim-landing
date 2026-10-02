import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouletteRenderer } from '../src/animation/roulette.js';

const fixture = geometry => {
  const nodes = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, {
      style: { setProperty(key, value) { this[key] = value; } },
      querySelector: node,
      querySelectorAll: () => [],
    });
    return nodes.get(selector);
  };
  const render = createRouletteRenderer({ querySelector: node });
  return (progress, reduced = false) => {
    render({ curtain: 1, roulette: progress, rouletteReveal: 1 }, geometry, reduced);
    return { ...node('.roulette-finale').style };
  };
};

test('Phone finale becomes fully legible near the viewport centre in either scroll direction', () => {
  for (const [width, height, scale] of [[320, 568, .88], [375, 667, 1.04], [440, 900, 1.22]]) {
    const render = fixture({ mobile: true, width, height, scale });
    const entrance = render(6);
    assert.ok(Number(entrance.opacity) < 1);
    const centred = render(7);
    const centre = parseFloat(centred.top) + 3 * 56 * scale / 2;
    assert.ok(Math.abs(centre - height / 2) < 10 * scale);
    assert.equal(Number(centred.opacity), 1);
    for (const progress of [6.8, 7, 8, 9, 8, 7, 6.8]) {
      assert.equal(Number(render(progress).opacity), 1);
    }
    assert.deepEqual(render(6), entrance);
    assert.ok(Number(render(9.9).opacity) < .1);
    assert.equal(Number(render(10).opacity), 0);
    assert.equal(Number(render(7, true).opacity), 1);
  }
});

test('Desktop finale keeps its existing opacity and position', () => {
  const render = fixture({ mobile: false, width: 1440, height: 720, scale: 1 });
  for (const [progress, top, opacity] of [[6, 592, .2], [7, 312, .35], [8, 196, .5], [9, 90, 1]]) {
    const frame = render(progress);
    assert.equal(parseFloat(frame.top), top);
    assert.equal(Number(frame.opacity), opacity);
  }
});
