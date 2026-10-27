/**
 * WebM decoding support does not imply support for its alpha channel.
 * Chrome/Firefox/Edge on iOS must use the Apple media path too.
 * Accept a navigator snapshot so this policy stays pure and SSR-safe.
 */
export function getMediaPlayback({
  userAgent = '',
  platform = '',
  maxTouchPoints = 0,
  hardwareConcurrency = 0,
  deviceMemory = 0,
  userAgentData,
} = {}) {
  const ios = /iPad|iPhone|iPod|CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent)
    || (/Mac/i.test(platform) && maxTouchPoints > 1);
  const safari = /AppleWebKit/i.test(userAgent) && /Safari/i.test(userAgent)
    && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR|OPiOS|Android/i.test(userAgent);
  const appleMedia = ios || safari;
  return {
    heroSource: appleMedia ? 'hero-alpha.mov' : 'hero.webm',
    chipSource: appleMedia ? 'chip-scroll-alpha.mov'
      : prefersLiteChipVideo({ userAgent, platform, maxTouchPoints, hardwareConcurrency, deviceMemory, userAgentData })
        ? 'chip-scroll-lite.webm'
        : 'chip-scroll.webm',
  };
}

/**
 * Older desktop Chromium/Yandex installations often decode VP9 seeks in
 * software. Keep the same transparent all-keyframe video pipeline, but use a
 * 480px source that cuts per-frame pixel work by 64%. Phones retain the full
 * source (their decoder path is normally hardware accelerated), while Safari
 * remains on its transparent MOV.
 */
export function prefersLiteChipVideo({
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

  const chromeVersion = Number(userAgent.match(/(?:Chrome|Chromium)\/(\d+)/i)?.[1]);
  const yandexVersion = Number(userAgent.match(/YaBrowser\/(\d+)/i)?.[1]);
  const legacyDecoder = (Number.isFinite(chromeVersion) && chromeVersion < 110)
    || (Number.isFinite(yandexVersion) && yandexVersion < 24);
  const cores = Number(hardwareConcurrency);
  const memory = Number(deviceMemory);
  const lowPower = (Number.isFinite(cores) && cores > 0 && cores <= 4)
    || (Number.isFinite(memory) && memory > 0 && memory <= 4);
  return legacyDecoder || lowPower;
}
