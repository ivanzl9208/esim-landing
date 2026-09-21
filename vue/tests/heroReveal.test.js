import test from 'node:test';
import assert from 'node:assert/strict';
import { heroRevealFrame, HERO_REVEAL_SCROLL_DISTANCE, FAQ_REVEAL_OPACITY_END } from '../src/animation/heroReveal.js';
import { TRACKS } from '../src/animation/timing.js';

test('Shared Hero entrance preserves its sampled translation and opacity', () => {
  // Reference samples of the original first roulette line at 1440×720.
  for (const [progress, y, opacity] of [[0, 592, .05], [.25, 522, .1984375], [.5, 452, .525], [.75, 382, .8515625], [1, 312, 1]]) {
    const frame = heroRevealFrame(progress, 592, 312);
    assert.equal(frame.y, y);
    assert.ok(Math.abs(frame.opacity - opacity) < 1e-10);
  }
});

test('FAQ uses Figma endpoints and reverses without stateful animation', () => {
  for (const [from, to] of [[548, 96], [347, 64]]) {
    const forward = [0, .25, .5, .75, 1].map(p => heroRevealFrame(p, from, to));
    const backward = [1, .75, .5, .25, 0].map(p => heroRevealFrame(p, from, to));
    assert.deepEqual(backward.reverse(), forward);
    assert.equal(forward[0].y, from);
    assert.equal(forward.at(-1).y, to);
    assert.equal(forward.at(-1).opacity, 1);
  }
});

test('FAQ starts after the complete curtain with the original Hero scroll duration', () => {
  assert.deepEqual(TRACKS.roulette, [1.28, 4.35, 10, 'none']);
  assert.deepEqual(TRACKS.resultCurtain, [43, 44, 1, 'none']);
  assert.equal(TRACKS.faqReveal[0], TRACKS.resultCurtain[1]);
  assert.ok(Math.abs(TRACKS.faqReveal[1] - TRACKS.faqReveal[0] - HERO_REVEAL_SCROLL_DISTANCE) < 1e-10);
  assert.equal(TRACKS.faqReveal[3], TRACKS.roulette[3]);
});

test('FAQ reaches full opacity at its early review position without changing motion or Hero', () => {
  for (const progress of [0, .125, .25, .5, 1]) {
    const original = heroRevealFrame(progress, 452, 0);
    const faq = heroRevealFrame(progress, 452, 0, FAQ_REVEAL_OPACITY_END);
    assert.equal(faq.y, original.y);
    if (progress >= .25) assert.equal(faq.opacity, 1);
  }
  assert.equal(heroRevealFrame(.25, 452, 0).opacity, .1984375);
});
