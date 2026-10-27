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
    chipSource: appleMedia ? 'chip-scroll-alpha.mov' : 'chip-scroll.webm',
  };
}

/**
 * Seeking a VP9 video on every scroll update is substantially more expensive
 * than ordinary playback. Older desktop Chromium/Yandex installations often
 * decode those seeks in software and visibly jump after the decoder catches
 * up. The existing WebP sequence trades a little more transfer for predictable
 * frame presentation on that class of hardware.
 *
 * Keep phones/tablets and Apple media on their dedicated paths: mobile memory
 * is tighter, while Safari uses the all-keyframe HEVC source instead of VP9.
 */
export function prefersFrameScrubbing({
  userAgent = '',
  platform = '',
  maxTouchPoints = 0,
  hardwareConcurrency = 0,
  deviceMemory = 0,
  userAgentData,
} = {}) {
  const mobile = Boolean(userAgentData?.mobile)
    || /Android|iPad|iPhone|iPod|Mobile/i.test(userAgent)
    || (/Mac/i.test(platform) && maxTouchPoints > 1);
  const chromium = /Chrome|Chromium|YaBrowser|Edg|OPR/i.test(userAgent)
    && !/CriOS|EdgiOS|OPiOS/i.test(userAgent);
  if (mobile || !chromium) return false;

  const cores = Number(hardwareConcurrency);
  const memory = Number(deviceMemory);
  return (Number.isFinite(cores) && cores > 0 && cores <= 4)
    || (Number.isFinite(memory) && memory > 0 && memory <= 4);
}
