import test from 'node:test';
import assert from 'node:assert/strict';
import { reverseCheckerScroll } from '../src/animation/checkerHold.js';

const hold = { start: 5000, end: 7000 };

test('Downward scrolling and stationary positions retain the complete reading hold', () => {
  for (const [previous, current] of [[4900, 5100], [5500, 5600], [6900, 7100], [6000, 6000]]) {
    assert.equal(reverseCheckerScroll(previous, current, hold), current);
  }
});

test('Upward scrolling skips the hold from FAQ and from a partly traversed reading hold', () => {
  assert.equal(reverseCheckerScroll(7050, 6950, hold), 4950);
  assert.equal(reverseCheckerScroll(6000, 5980, hold), 4980);
  assert.equal(reverseCheckerScroll(7000, 6999, hold), 4999);
});

test('Fast reverse gestures keep their distance after skipping the stationary interval', () => {
  assert.equal(reverseCheckerScroll(7100, 4700, hold), 2700);
  assert.equal(reverseCheckerScroll(5500, 4700, hold), 4200);
  assert.equal(reverseCheckerScroll(7100, 100, hold), 0);
});

test('Earlier scenes and later page content keep their original scroll positions', () => {
  assert.equal(reverseCheckerScroll(4900, 4800, hold), 4800);
  assert.equal(reverseCheckerScroll(7200, 7100, hold), 7100);
  assert.equal(reverseCheckerScroll(7100, 7000, hold), 7000);
  const skipped = reverseCheckerScroll(7050, 6950, hold);
  assert.equal(reverseCheckerScroll(skipped, skipped - 20, hold), skipped - 20);
  assert.equal(reverseCheckerScroll(skipped, skipped + 20, hold), skipped + 20);
});
