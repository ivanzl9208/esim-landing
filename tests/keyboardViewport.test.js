import test from 'node:test';
import assert from 'node:assert/strict';
import { keyboardIsOpen, createKeyboardViewportState, keyboardFormFrame, keyboardVisibleTop, waitForKeyboardClose } from '../src/utils/keyboardViewport.js';

test('Safari panning does not disguise an open keyboard; orientation resets the baseline', () => {
  const state = createKeyboardViewportState();
  const viewport = { height: 844, offsetTop: 0 };
  assert.equal(state.update(viewport, 844, 393), false);
  viewport.height = 484;
  viewport.offsetTop = 280;
  assert.equal(keyboardIsOpen(viewport, 844), true, 'offsetTop is not subtracted from keyboard height');
  assert.equal(state.update(viewport, 484, 393), true, 'The full height survives browsers shrinking innerHeight too');
  assert.deepEqual(keyboardFormFrame(viewport, -100), { top: 380, height: 484 }, 'The entire form follows the visible viewport, not just the input');
  viewport.height = 844;
  viewport.offsetTop = 0;
  assert.equal(state.update(viewport, 844, 393), false);
  viewport.height = 393;
  assert.equal(state.update(viewport, 393, 844), false, 'Landscape is not mistaken for a keyboard');
});

test('Visual- and layout-relative rects align the form without double-counting Safari keyboard pan', () => {
  const viewport = { offsetTop: 280, height: 360, pageTop: 1280 };
  assert.equal(keyboardVisibleTop(viewport, -1000), 280);
  assert.equal(keyboardVisibleTop(viewport, -1280), 0);
  assert.deepEqual(keyboardFormFrame(viewport, 530, 450, -1000), { top: 200, height: 360 });
  assert.deepEqual(keyboardFormFrame(viewport, 530, 450, -1280), { top: -80, height: 360 });
  assert.deepEqual(keyboardFormFrame(viewport, 530, 450, -1000, 844), { top: -284, height: 360 },
    'A full-height composition moves up by the keyboard inset without shrinking');
});

test('No keyboard needs no timer or animated viewport wait', async () => {
  const viewport = Object.assign(new EventTarget(), { height: 844, offsetTop: 0 });
  await waitForKeyboardClose({ viewport, layoutTarget: new EventTarget(), layoutHeight: () => 844 });
});
test('Waits for keyboard expansion and the trailing scroll to settle before anchoring', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const viewport = Object.assign(new EventTarget(), { height: 564, offsetTop: 0 });
  const layout = new EventTarget();
  let done = false;
  const closed = waitForKeyboardClose({ viewport, layoutTarget: layout, layoutHeight: () => 844 }).then(() => { done = true; });
  t.mock.timers.tick(300);
  await Promise.resolve();
  assert.equal(done, false);
  viewport.height = 844;
  viewport.dispatchEvent(new Event('resize'));
  t.mock.timers.tick(100);
  layout.dispatchEvent(new Event('scroll'));
  t.mock.timers.tick(179);
  await Promise.resolve();
  assert.equal(done, false);
  t.mock.timers.tick(1);
  await closed;
  assert.equal(done, true);
});
test('Viewport wait is cancelled on unmount and bounded if the final event is absent', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const viewport = Object.assign(new EventTarget(), { height: 564, offsetTop: 0 });
  const controller = new AbortController();
  const args = { viewport, layoutTarget: new EventTarget(), layoutHeight: () => 844 };
  const aborted = waitForKeyboardClose({ ...args, signal: controller.signal });
  controller.abort();
  await aborted;
  const bounded = waitForKeyboardClose(args);
  t.mock.timers.tick(2000);
  await bounded;
});

test('A panned keyboard with a contracted layout viewport still waits for dismissal', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const viewport = Object.assign(new EventTarget(), { height: 484, offsetTop: 280 });
  let height = 484;
  let done = false;
  const closed = waitForKeyboardClose({ viewport, layoutTarget: new EventTarget(),
    layoutHeight: () => height, baselineHeight: () => 844 }).then(() => { done = true; });
  await Promise.resolve();
  assert.equal(done, false);
  height = viewport.height = 844;
  viewport.offsetTop = 0;
  viewport.dispatchEvent(new Event('resize'));
  t.mock.timers.tick(180);
  await closed;
  assert.equal(done, true);
});
