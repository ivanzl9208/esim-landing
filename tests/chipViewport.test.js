import test from 'node:test';
import assert from 'node:assert/strict';
import { chipViewportTarget, advanceChipViewport, chipViewportOffset } from '../src/animation/chipViewport.js';

test('Mobile chip shares extra viewport space equally between the fixed copy and bottom CTA', () => {
  const base = { mobile: true, height: 700, motionHeight: 700 };
  for (const change of [-60, 0, 24, 100, 160]) {
    const layout = { ...base, height: base.height + change };
    const offset = chipViewportOffset(layout, { chip: 1 });
    assert.equal(offset, change / 2);
    assert.equal(change - offset, offset, 'Top and bottom gaps gain the same space');
    assert.equal(chipViewportTarget({ ...layout, mobile: false }), 0);
    assert.equal(chipViewportOffset({ ...layout, mobile: false }, { chip: 1 }), 0);
  }
});

test('Toolbar adjustment settles monotonically in either direction at 30/60/120 fps', () => {
  for (const fps of [30, 60, 120]) {
    let offset = 0;
    for (const target of [60, 10, -20, 0]) {
      for (let frame = 0; frame < fps * 2; frame++) {
        const next = advanceChipViewport(offset, target, 1 / fps);
        assert.ok(next >= Math.min(offset, target) && next <= Math.max(offset, target));
        offset = next;
      }
      assert.equal(offset, target);
    }
    let value = 0;
    for (let frame = 0; frame < fps * .6; frame++) value = advanceChipViewport(value, 60, 1 / fps);
    assert.ok(Math.abs(value - 60 * (1 - Math.exp(-5))) < 1e-8, 'Same response at every refresh rate');
  }
});

test('Viewport compensation enters with the chip and leaves smoothly before safety copy, including reverse scroll', () => {
  const layout = { mobile: true, height: 800, motionHeight: 700, chipViewportOffset: 50 };
  assert.equal(chipViewportOffset(layout, { chip: 0 }), 0);
  assert.equal(chipViewportOffset(layout, { chip: 1 }), 50);
  const forward = Array.from({ length: 101 }, (_, index) => chipViewportOffset(layout, { chip: 1, chipZoom: index / 100 }));
  assert.deepEqual(Array.from({ length: 101 }, (_, index) => chipViewportOffset(layout, { chip: 1, chipZoom: (100 - index) / 100 })).reverse(), forward);
  for (let index = 1; index < forward.length; index++) {
    assert.ok(forward[index] <= forward[index - 1]);
    assert.ok(forward[index - 1] - forward[index] < 1.7, 'No position jump at zoom boundaries');
  }
  assert.equal(chipViewportOffset(layout, { chip: 1, chipZoom: .45 }), 0);
  assert.equal(chipViewportOffset(layout, { chip: 1, chipZoom: 1, safety: .1 }), 0);
});
