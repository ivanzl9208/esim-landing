import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForKeyboardClose } from '../src/utils/keyboardViewport.js';

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
