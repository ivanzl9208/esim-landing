import { onMounted, onScopeDispose, ref, watch } from 'vue';
import { asset } from '../utils/assets.js';
import { useMotionPreference } from './useMotionPreference.js';

export const CHIP_FRAME_COUNT = 150;

/** Latest-request-wins seeking; no polling loop and no dependency on story timing. */
export function useChipMedia(videoRef, frameRef) {
  const frameMode = ref(false);
  const reduced = useMotionPreference();
  let video;
  let disposed = false;
  let mounted = false;
  let duration = 6;
  let requestedProgress = 0;
  let pendingTime = null;
  let frameIndex = 0;
  let images = [];
  const frameUrl = (index) => asset(`chip-frames/frame-${String(index + 1).padStart(3, '0')}.webp`);

  const preload = () => {
    if (images.length || reduced.value || disposed) return;
    images = Array.from({ length: CHIP_FRAME_COUNT }, (_, index) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = frameUrl(index);
      return image;
    });
  };
  const flush = () => {
    if (disposed || frameMode.value || !video || video.readyState < 1 || video.seeking || pendingTime === null) return;
    const target = pendingTime;
    pendingTime = null;
    if (Math.abs(video.currentTime - target) > 0.012) video.currentTime = target;
  };
  const draw = () => {
    if (!mounted || disposed) return;
    const progress = reduced.value ? 0 : requestedProgress;
    if (frameMode.value || reduced.value) {
      const next = Math.min(Math.round(progress * (CHIP_FRAME_COUNT - 1)), CHIP_FRAME_COUNT - 1);
      if (next !== frameIndex) {
        frameRef.value.src = frameUrl(next);
        frameIndex = next;
      }
    } else {
      pendingTime = progress * Math.max(duration - 0.045, 0.001);
      flush();
    }
  };
  const setPlayback = (progress, turns = 1) => {
    requestedProgress = progress >= turns - 0.0005 ? 1 : progress >= 1 ? progress % 1 : Math.max(0, progress);
    draw();
  };
  const metadata = () => {
    if (Number.isFinite(video.duration) && video.duration > 0) duration = video.duration;
    video.pause();
    draw();
  };
  const fallback = () => {
    if (disposed) return;
    frameMode.value = true;
    preload();
    draw();
  };
  watch(reduced, () => {
    if (!mounted) return;
    video.pause();
    if (frameMode.value) preload();
    draw();
  });
  onMounted(() => {
    mounted = true;
    video = videoRef.value;
    frameMode.value = /Safari/i.test(navigator.userAgent) && !/(Chrome|Chromium|CriOS|FxiOS|Edg|EdgiOS|OPiOS|Android)/i.test(navigator.userAgent);
    video.defaultMuted = true;
    video.muted = true;
    video.addEventListener('loadedmetadata', metadata);
    video.addEventListener('loadeddata', metadata);
    video.addEventListener('seeked', flush);
    video.addEventListener('error', fallback);
    video.src = asset(frameMode.value ? 'chip-scroll.mov' : 'chip-scroll.webm');
    if (frameMode.value) preload();
    draw();
  });
  onScopeDispose(() => {
    disposed = true;
    pendingTime = null;
    if (video) {
      video.pause();
      video.removeEventListener('loadedmetadata', metadata);
      video.removeEventListener('loadeddata', metadata);
      video.removeEventListener('seeked', flush);
      video.removeEventListener('error', fallback);
      video.removeAttribute('src');
      video.load();
    }
    images.forEach(image => image.removeAttribute('src'));
    images = [];
  });
  return { frameMode, reduced, setPlayback };
}
