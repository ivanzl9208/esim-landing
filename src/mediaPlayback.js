/**
 * WebM decoding support does not imply support for its alpha channel.
 * Chrome/Firefox/Edge on iOS must use the Apple media path too.
 * Accept a navigator snapshot so this policy stays pure and SSR-safe.
 */
export function getMediaPlayback({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  const ios = /iPad|iPhone|iPod|CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent)
    || (/Mac/i.test(platform) && maxTouchPoints > 1);
  const safari = /AppleWebKit/i.test(userAgent) && /Safari/i.test(userAgent)
    && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR|OPiOS|Android/i.test(userAgent);
  const appleMedia = ios || safari;
  return {
    heroSource: appleMedia ? 'hero-alpha.mov' : 'hero.webm',
    chipFrames: appleMedia,
  };
}
