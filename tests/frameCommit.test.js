import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrameCommit } from '../src/animation/frameCommit.js';

test('One display tick commits the newest full scene, not each scroll/clock update', () => {
  const commit = createFrameCommit();
  const calls = [];
  for (let i = 0; i < 20; i++) {
    commit.request(() => calls.push(`scene-${i}`), 1);
    commit.request(() => calls.push(`chip-${i}`));
  }
  assert.deepEqual(calls, []);
  commit.flush();
  assert.deepEqual(calls, ['scene-19']);
  commit.flush();
  assert.equal(calls.length, 1, 'Settled ticks do not rewrite the DOM');
  commit.request(() => calls.push('chip'));
  commit.flush();
  assert.equal(calls.at(-1), 'chip');
});

test('Rebuild cancels stale work and reverse input replaces forward input', () => {
  const commit = createFrameCommit();
  let pose = 0;
  commit.request(() => { pose = 1; });
  commit.request(() => { pose = -1; });
  commit.flush();
  assert.equal(pose, -1);
  commit.request(() => { pose = 10; });
  commit.clear();
  commit.flush();
  assert.equal(pose, -1);
});
