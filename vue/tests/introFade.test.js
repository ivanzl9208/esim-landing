import test from 'node:test';
import assert from 'node:assert/strict';
import { introFadeFrame, introColumnY, introPanelColumnY, INTRO_TEXT_TRACK } from '../src/animation/introFade.js';
import { createIntroTextRenderer } from '../src/animation/introText.js';
import { TRACKS } from '../src/animation/timing.js';

test('Intro phrases fade from transparent to solid and back as they cross the screen', () => {
  for (const height of [568, 780, 932, 1194]) {
    assert.deepEqual(introFadeFrame(1.1 * height, height), { opacity: 0, scale: .88 });
    assert.deepEqual(introFadeFrame(.55 * height, height), { opacity: 1, scale: 1 });
    assert.deepEqual(introFadeFrame(0, height), { opacity: 0, scale: 1 });
    assert.equal(introFadeFrame(2 * height, height).opacity, 0);
    assert.equal(introFadeFrame(-height, height).opacity, 0);
  }
});

test('Text travels inside the rising curtain and becomes visible before it covers the hero', () => {
  for (const height of [780, 932, 984]) {
    const positions = [];
    for (let i = 0; i <= 100; i++) {
      const curtain = i / 100;
      const localY = introPanelColumnY(0, curtain, height, 1800);
      const top = (1 - curtain) * height + localY;
      positions.push(top);
      assert.ok(localY >= 0, 'Text stays below the moving curtain edge');
    }
    assert.ok(positions.slice(1).every((top, i) => top < positions[i]));
    assert.ok(introFadeFrame(positions[65], height).opacity > .4);
    assert.equal(introFadeFrame(positions[100], height).opacity, 1);
    assert.equal(introPanelColumnY(0, .999999, height, 1800).toFixed(2), introColumnY(0, height, 1800).toFixed(2));
    assert.equal(introPanelColumnY(.5, 1, height, 1800), introColumnY(.5, height, 1800));
    const epsilon = .00001;
    const before = epsilon * height + introPanelColumnY(0, 1 - epsilon, height, 1800);
    const at = introColumnY(0, height, 1800);
    const after = introColumnY(epsilon / (INTRO_TEXT_TRACK[1] - INTRO_TEXT_TRACK[0]), height, 1800);
    assert.ok(Math.abs((at - before) / epsilon - (after - at) / epsilon) < .05,
      'The rising panel and settled column join with the same velocity');
  }
});

test('The large finale uses Sound 360’s longer viewport fade window', () => {
  const height = 900;
  assert.deepEqual(introFadeFrame(1.2 * height, height, true), { opacity: 0, scale: .96 });
  assert.deepEqual(introFadeFrame(.45 * height, height, true), { opacity: 1, scale: 1 });
  assert.equal(introFadeFrame(-.3 * height, height, true).opacity, 0);
  const frames = Array.from({ length: 151 }, (_, i) => introFadeFrame((1.2 - i / 100) * height, height, true));
  assert.ok(frames.slice(1).every((f, i) => Math.abs(f.opacity - frames[i].opacity) < .03));
  assert.ok(frames.slice(1).every((f, i) => f.scale >= frames[i].scale));
});

test('A single column moves at constant speed with no reading hold or exit acceleration', () => {
  const frames = Array.from({ length: 101 }, (_, i) => introColumnY(i / 100, 932, 1080));
  const steps = frames.slice(1).map((y, i) => frames[i] - y);
  assert.ok(steps.every(step => step > 0 && Math.abs(step - steps[0]) < 1e-9));
  assert.ok(frames.at(-1) + 1080 < 0);
  assert.ok(TRACKS.reveal[0] < TRACKS.introText[1], 'The next shutter overlaps the quiet fade-out tail');
});

test('Reverse scroll reproduces the same fade and scale without another animation clock', () => {
  const forward = Array.from({ length: 101 }, (_, i) => {
    const y = introColumnY(i / 100, 780, 1080);
    return [introFadeFrame(y, 780), introFadeFrame(y + 800, 780, true)];
  });
  for (let i = 100; i >= 0; i--) {
    const y = introColumnY(i / 100, 780, 1080);
    assert.deepEqual([introFadeFrame(y, 780), introFadeFrame(y + 800, 780, true)], forward[i]);
  }
});

test('Reduced motion keeps in-view text solid and removes decorative scale', () => {
  for (const finale of [false, true]) {
    assert.deepEqual(introFadeFrame(300, 780, finale, true), { opacity: 1, scale: 1 });
    assert.equal(introFadeFrame(1000, 780, finale, true).opacity, 0);
    assert.equal(introFadeFrame(-780, 780, finale, true).opacity, 0);
  }
});

test('Renderer only measures layout on resize and clears the column by the end of its track', () => {
  let reads = 0;
  const item = (top, height) => ({ style: {}, get offsetTop() { reads++; return top; }, get offsetHeight() { reads++; return height; } });
  const lines = Array.from({ length: 6 }, (_, i) => item(i * 100, 50));
  const finale = item(680, 280);
  const column = { style: {}, querySelectorAll: () => lines, querySelector: () => finale };
  const curtain = { style: { setProperty(key, value) { this[key] = value; } } };
  const hero = { style: {} };
  const nodes = { '.intro-text-column': column, '.white-curtain': curtain, '.hero-surface': hero };
  const render = createIntroTextRenderer({ querySelector: key => nodes[key] });
  let geometry = { width: 430, height: 932, scale: 1.1944 };
  const sample = progress => render({ curtain: 1, introText: progress }, geometry, false);
  sample(0);
  const initialReads = reads;
  for (let i = 0; i <= 100; i++) sample(i / 100);
  assert.equal(reads, initialReads);
  assert.ok([...lines, finale].every(node => Number(node.style.opacity) === 0));
  assert.equal('top' in finale.style, false, 'Scroll must not animate layout properties');
  geometry = { ...geometry, height: 780 };
  sample(.5);
  assert.equal(reads, initialReads, 'Toolbar resize only changes the viewport fade window');
  geometry = { width: 932, height: 430, scale: .72 };
  sample(.5);
  assert.ok(reads > initialReads, 'Orientation change remeasures the flowing text');
});
