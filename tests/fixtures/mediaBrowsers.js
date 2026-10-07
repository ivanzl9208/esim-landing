// Representative browser identities for the iOS transparent-video regression.
const iphoneWebKit = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)';
const desktopWebKit = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)';
const iphone = { platform: 'iPhone', maxTouchPoints: 5, vendor: 'Apple Computer, Inc.' };
export const MEDIA_BROWSERS = {
  'safari-ios': { ...iphone, userAgent: `${iphoneWebKit} Version/18.0 Mobile/15E148 Safari/604.1`, appleMedia: true },
  'chrome-ios': { ...iphone, vendor: 'Google Inc.', userAgent: `${iphoneWebKit} CriOS/140.0.7339.39 Mobile/15E148 Safari/604.1`, appleMedia: true },
  'firefox-ios': { ...iphone, vendor: '', userAgent: `${iphoneWebKit} FxiOS/142.0 Mobile/15E148 Safari/605.1.15`, appleMedia: true },
  'edge-ios': { ...iphone, userAgent: `${iphoneWebKit} EdgiOS/140.0.3485.54 Mobile/15E148 Safari/605.1.15`, appleMedia: true },
  'opera-ios': { ...iphone, userAgent: `${iphoneWebKit} OPiOS/5.2.0 Mobile/15E148 Safari/9537.53`, appleMedia: true },
  'webview-ios': { ...iphone, userAgent: `${iphoneWebKit} Mobile/15E148`, appleMedia: true },
  'safari-ipad-desktop': { platform: 'MacIntel', maxTouchPoints: 5, vendor: 'Apple Computer, Inc.', userAgent: `${desktopWebKit} Version/18.0 Safari/605.1.15`, appleMedia: true },
  'chrome-ipad-desktop': { platform: 'MacIntel', maxTouchPoints: 5, vendor: 'Google Inc.', userAgent: `${desktopWebKit} CriOS/140.0.7339.39 Safari/605.1.15`, appleMedia: true },
  'safari-macos': { platform: 'MacIntel', maxTouchPoints: 0, vendor: 'Apple Computer, Inc.', userAgent: `${desktopWebKit} Version/18.0 Safari/605.1.15`, appleMedia: true },
  'chrome-macos': { platform: 'MacIntel', maxTouchPoints: 0, vendor: 'Google Inc.', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', appleMedia: false },
  'firefox-macos': { platform: 'MacIntel', maxTouchPoints: 0, vendor: '', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0', appleMedia: false },
  'edge-windows-touch': { platform: 'Win32', maxTouchPoints: 10, vendor: 'Google Inc.', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', appleMedia: false },
  'chrome-android': { platform: 'Linux armv8l', maxTouchPoints: 5, vendor: 'Google Inc.', userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36', appleMedia: false },
};
