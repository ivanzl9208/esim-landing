import test from 'node:test';
import assert from 'node:assert/strict';
import { createSuggestionPointer } from '../src/utils/suggestionPointer.js';

const event = (changes = {}) => ({ pointerId: 3, pointerType: 'touch', isPrimary: true, button: 0, clientX: 20, clientY: 20, preventDefault() {}, ...changes });
test('Touch selection completes on release without a compatibility click, once', () => {
  const selected = [];
  const device = { model: 'iPhone 16 Pro' };
  const pointer = createSuggestionPointer(value => selected.push(value), () => {});
  pointer.down(event(), device);
  assert.equal(pointer.active, true); // blur must not close/reposition the pending option
  pointer.up(event());
  pointer.up(event());
  pointer.click({ detail: 1 }, device);
  assert.deepEqual(selected, [device]);
  assert.equal(pointer.active, false);
});
test('Scrolling, pointercancel, secondary pointers and a different release do not select', () => {
  const selected = [];
  let released = 0;
  const pointer = createSuggestionPointer(value => selected.push(value), () => released++);
  pointer.down(event({ isPrimary: false }), 'secondary');
  pointer.up(event());
  pointer.down(event(), 'pan');
  pointer.move(event({ clientY: 50 }));
  pointer.up(event());
  pointer.click({ detail: 1 }, 'pan');
  pointer.down(event(), 'cancel');
  pointer.cancel();
  pointer.up(event());
  pointer.down(event(), 'wrong pointer');
  pointer.up(event({ pointerId: 4 }));
  assert.deepEqual(selected, []);
  assert.equal(released, 2);
});
test('Assistive click activation remains available after a cancelled gesture', () => {
  let selected;
  const pointer = createSuggestionPointer(value => { selected = value; }, () => {});
  pointer.down(event(), 'cancelled');
  pointer.cancel();
  pointer.click({ detail: 0 }, 'assistive');
  assert.equal(selected, 'assistive');
});
test('Mouse uses the same selection, without moving focus on pointerdown', () => {
  let selected;
  let prevented = false;
  const pointer = createSuggestionPointer(value => { selected = value; }, () => {});
  pointer.down(event({ pointerType: 'mouse', preventDefault() { prevented = true; } }), 'desktop');
  assert.equal(prevented, true);
  pointer.up(event({ pointerType: 'mouse' }));
  assert.equal(selected, 'desktop');
});
