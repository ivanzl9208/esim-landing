import test from 'node:test';
import assert from 'node:assert/strict';
import { captureScenePosition, restoreScenePosition } from '../src/animation/scenePosition.js';

const portrait = { sceneTop: 0, checkerTop: 34334, height: 844 };
const landscape = { sceneTop: 0, checkerTop: 15865, height: 390 };
test('Orientation changes preserve the checker and reverse round trip', () => {
  for (const y of [34334, 34545, 35178, 35800]) {
    const anchor = captureScenePosition(y, portrait);
    const rotated = restoreScenePosition(anchor, landscape);
    assert.equal(restoreScenePosition(captureScenePosition(rotated, landscape), portrait), y);
  }
});
test('A scene checkpoint preserves scroll progress instead of absolute pixels', () => {
  const anchor = captureScenePosition(portrait.checkerTop * .6, portrait);
  assert.equal(restoreScenePosition(anchor, landscape), landscape.checkerTop * .6);
});
test('Height-only changes keep scene distances and the start of FAQ stable', () => {
  const next = { ...portrait, height: 780 };
  assert.equal(restoreScenePosition(captureScenePosition(10000, portrait), next), 10000);
  assert.equal(restoreScenePosition(captureScenePosition(35178, portrait), next), 35114);
});
