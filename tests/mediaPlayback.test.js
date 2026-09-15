import test from 'node:test';
import assert from 'node:assert/strict';
import { getMediaPlayback } from '../src/mediaPlayback.js';
import { MEDIA_BROWSERS } from './fixtures/mediaBrowsers.js';

for (const [name, browser] of Object.entries(MEDIA_BROWSERS)) {
  test(`Selects transparent media and scroll playback for ${name}`, () => {
    assert.deepEqual(getMediaPlayback(browser), {
      heroSource: browser.appleMedia ? 'hero-alpha.mov' : 'hero.webm',
      chipFrames: browser.appleMedia,
    });
  });
}

test('Media policy imports and runs without browser globals', () => {
  assert.equal(typeof window, 'undefined');
  assert.equal(typeof document, 'undefined');
  assert.deepEqual(getMediaPlayback(), { heroSource: 'hero.webm', chipFrames: false });
});
