import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouletteRenderer } from '../src/animation/roulette.js';
import { TRACKS } from '../src/animation/timing.js';

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
    for (const progress of [6.8, 7, 8, 9, 9.5, 9.8, 9.9, 10, 9.9, 9.5, 9, 8, 7, 6.8]) {
      assert.equal(Number(render(progress).opacity), 1);
    }
    assert.deepEqual(render(6), entrance);
    assert.equal(Number(render(7, true).opacity), 1);
  }
});

test('Phone text fully leaves before the next curtain opens, without returning at the final frames', () => {
  for (const [width, height, scale] of [[320, 568, .88], [375, 667, 1.04], [440, 900, 1.22], [700, 320, .88]]) {
    const render = fixture({ mobile: true, width, height, scale });
    const progressAt = scroll => (scroll - TRACKS.roulette[0]) /
      (TRACKS.roulette[1] - TRACKS.roulette[0]) * TRACKS.roulette[2];
    const exit = render(progressAt(TRACKS.reveal[0]));
    assert.ok(parseFloat(exit.top) + 192 * scale < 0);
    assert.equal(Number(exit.opacity), 1);
    for (const scroll of [TRACKS.reveal[0], 4.3, 4.35, 4.3, TRACKS.reveal[0]]) {
      assert.deepEqual(render(progressAt(scroll)), exit);
    }
    let previousTop = Number.POSITIVE_INFINITY;
    for (let progress = 8; progress <= 10; progress += .01) {
      const top = parseFloat(render(progress).top);
      assert.ok(top <= previousTop + .001, 'Text must never move back down during its exit');
      previousTop = top;
    }
  }
});

test('Desktop finale keeps its existing opacity and position', () => {
  const render = fixture({ mobile: false, width: 1440, height: 720, scale: 1 });
  for (const [progress, top, opacity] of [[6, 592, .2], [7, 312, .35], [8, 196, .5], [9, 90, 1], [9.8, -410, .08], [10, -470, 0]]) {
    const frame = render(progress);
    assert.equal(parseFloat(frame.top), top);
    assert.equal(Number(frame.opacity), opacity);
  }
});
