import { computed, onMounted, onScopeDispose, ref, watch } from 'vue';
import { asset } from '../utils/assets.js';
import { getMediaPlayback } from '../utils/mediaPlayback.js';
import { CHIP_FRAME_COUNT, createChipFrameLoader } from '../utils/chipFrameLoader.js';
import { MEDIA_LOAD_DEADLINE } from '../utils/mediaConnection.js';
import { useMediaConnection } from './useMediaConnection.js';
import { useMotionPreference } from './useMotionPreference.js';

export { CHIP_FRAME_COUNT };

export function useChipMedia(videoRef, frameRef, stillRef) {
  const frameMode = ref(false);
  const videoReady = ref(false);
  const stillReady = ref(false);
  const stillActive = ref(false);
  const stillVisible = computed(() => stillReady.value && stillActive.value);
  const reduced = useMotionPreference();
  const { staticMedia, markSlow } = useMediaConnection();
  let video;
  let mounted = false;
  let disposed = false;
  let duration = 6;
  let requestedTurns = 0;
  let endTurns = 1;
  let displayedTurns = 0;
  let pendingTime = 0;
  let frameIndex = 0;
  let mediaRequested = false;
  let fetchController;
  let blobUrl;
  let loadDeadline;
  let seekDeadline;
  let loader;
  let stillRequested = false;
  let stillWanted = false;
  let stillUrl;
  let stillGeneration = 0;
  const releaseStill = () => {
    stillGeneration++;
    stillReady.value = false;
    stillRef?.value?.removeAttribute('src');
    if (stillUrl) { URL.revokeObjectURL(stillUrl); stillUrl = undefined; }
  };
  const frameUrl = index => asset(`chip-frames/frame-${String(index + 1).padStart(3, '0')}.webp`);
  const isStatic = () => reduced.value || staticMedia.value;
  const captureStill = async () => {
    if (!mounted || disposed || !stillWanted || stillRequested || reduced.value || !stillRef?.value) return;
    if (Math.abs(requestedTurns - endTurns) >= .0005) return;
    const useVideo = videoReady.value && !frameMode.value && !staticMedia.value;
    const source = useVideo ? video : frameRef.value;
    if (useVideo) {
      // Snapshot only the displayed final frame, never an outstanding seek.
      if (video.seeking || video.readyState < 2 || Math.abs(video.currentTime - pendingTime) > .012) return;
    } else if (!source?.complete || !source.naturalWidth || (!isStatic() && frameIndex !== CHIP_FRAME_COUNT - 1)) return;
    stillRequested = true;
    const generation = stillGeneration;
    try {
      // Preserve the decoder's exact pose, colour and detail. A separate render
      // changed those pixels even though both layers shared the same transform.
      const canvas = document.createElement('canvas');
      canvas.width = useVideo ? video.videoWidth : source.naturalWidth;
      canvas.height = useVideo ? video.videoHeight : source.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Chip snapshot context unavailable');
      context.drawImage(source, 0, 0);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (disposed || reduced.value || generation !== stillGeneration) return;
      if (!blob) throw new Error('Chip snapshot encoding failed');
      stillUrl = URL.createObjectURL(blob);
      stillRef.value.src = stillUrl;
      await stillRef.value.decode();
      if (disposed || reduced.value || generation !== stillGeneration) return;
      stillReady.value = true;
    } catch {
      if (!disposed && generation === stillGeneration) releaseStill();
      // The decoded video/front frame remains visible and uses the same zoom.
    }
  };
  const prepareStill = () => {
    stillWanted = true;
    captureStill();
  };
  const setStillActive = active => {
    stillActive.value = active;
    if (active) prepareStill();
  };
  const showFront = () => {
    videoReady.value = false;
    if (frameIndex !== 0) { frameRef.value.src = frameUrl(0); frameIndex = 0; }
  };
  const releaseVideo = () => {
    clearTimeout(loadDeadline); clearTimeout(seekDeadline);
    fetchController?.abort(); fetchController = undefined;
    videoReady.value = false;
    if (video?.hasAttribute('src')) {
      video.pause(); video.removeAttribute('src'); video.load();
    }
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = undefined; }
  };
  const loadFrame = (index, signal) => new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    const cleanup = () => {
      clearTimeout(deadline);
      signal.removeEventListener('abort', abort);
      image.onload = image.onerror = null;
    };
    const abort = () => { cleanup(); image.removeAttribute('src'); reject(new DOMException('Aborted', 'AbortError')); };
    const deadline = setTimeout(() => {
      markSlow(); abort();
    }, MEDIA_LOAD_DEADLINE);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) { abort(); return; }
    image.onerror = () => { cleanup(); reject(new Error(`Chip frame ${index + 1} failed`)); };
    image.onload = async () => {
      try {
        await image.decode();
        if (signal.aborted) return;
        cleanup(); resolve(image);
      } catch (error) { cleanup(); reject(error); }
    };
    image.src = frameUrl(index);
  });
  const prepareFrames = () => {
    if (loader || isStatic() || disposed) return;
    loader = createChipFrameLoader({
      load: loadFrame,
      present: (index, image) => {
        if (disposed || isStatic()) return;
        frameRef.value.src = image.src;
        frameIndex = index;
      },
      failed: () => markSlow(),
    });
  };
  const fallback = () => {
    if (disposed || isStatic()) return;
    releaseVideo();
    frameMode.value = true;
    prepareFrames();
    draw(displayedTurns);
  };
  const loadMedia = async () => {
    if (!mounted || disposed || isStatic()) return;
    if (frameMode.value) { prepareFrames(); draw(displayedTurns); return; }
    if (fetchController || blobUrl) return;
    const controller = new AbortController();
    fetchController = controller;
    loadDeadline = setTimeout(markSlow, MEDIA_LOAD_DEADLINE);
    try {
      // A complete local Blob eliminates seeks into unbuffered HTTP ranges.
      // Keep the front image visible until decoding can actually present video.
      const response = await fetch(asset('chip-scroll.webm'), { signal: controller.signal });
      if (!response.ok) throw new Error(`Chip video HTTP ${response.status}`);
      const blob = await response.blob();
      if (disposed || isStatic() || controller.signal.aborted) return;
      blobUrl = URL.createObjectURL(blob);
      video.preload = 'auto';
      video.src = blobUrl;
    } catch (error) {
      if (error.name !== 'AbortError' && !disposed && !isStatic()) fallback();
    }
  };
  const prepare = () => {
    if (mediaRequested) return;
    mediaRequested = true;
    loadMedia();
  };
  const flush = () => {
    if (disposed || isStatic() || document.hidden || frameMode.value || !blobUrl || video.readyState < 2 || video.seeking) return;
    if (Math.abs(video.currentTime - pendingTime) > .012) {
      // Don't clear the latest desired time until a completed seek has been
      // observed. A new scroll update during decoding is flushed by seeked.
      video.currentTime = pendingTime;
      clearTimeout(seekDeadline);
      seekDeadline = setTimeout(fallback, MEDIA_LOAD_DEADLINE);
    }
  };
  const draw = turns => {
    displayedTurns = turns;
    if (!mounted || disposed) return;
    if (isStatic()) { showFront(); return; }
    if (document.hidden) return;
    const phase = Math.abs(turns - endTurns) < .0005 ? 1 : ((turns % 1) + 1) % 1;
    const index = Math.min(Math.round(phase * (CHIP_FRAME_COUNT - 1)), CHIP_FRAME_COUNT - 1);
    if (frameMode.value) {
      if (mediaRequested) loader?.request(index);
    } else {
      pendingTime = index / (CHIP_FRAME_COUNT - 1) * Math.max(duration - .04, .001);
      flush();
    }
  };
  const setPlayback = (progress, turns = 1) => {
    requestedTurns = Math.max(0, Math.min(progress, turns));
    endTurns = turns;
    if (progress > 0 && !mediaRequested) prepare();
    if (!mounted) return;
    if (isStatic()) showFront();
    else draw(requestedTurns);
  };
  const metadata = () => {
    if (Number.isFinite(video.duration) && video.duration > 0) duration = video.duration;
    video.pause();
    draw(displayedTurns);
  };
  const decoded = () => {
    if (disposed || isStatic() || frameMode.value || video.readyState < 2) return;
    clearTimeout(loadDeadline); clearTimeout(seekDeadline);
    videoReady.value = true;
    flush();
    captureStill();
  };
  const visibility = () => {
    if (!document.hidden) draw(requestedTurns);
  };
  watch([reduced, staticMedia], () => {
    if (!mounted) return;
    if (isStatic()) {
      if (!stillReady.value) releaseStill();
      if (reduced.value) { releaseStill(); stillRequested = false; }
      loader?.dispose(); loader = undefined;
      releaseVideo(); showFront();
    } else {
      if (mediaRequested) loadMedia();
      draw(requestedTurns);
    }
  });
  onMounted(() => {
    mounted = true;
    video = videoRef.value;
    frameMode.value = getMediaPlayback(navigator).chipFrames;
    video.defaultMuted = true; video.muted = true;
    video.addEventListener('loadedmetadata', metadata);
    video.addEventListener('loadeddata', decoded);
    video.addEventListener('seeked', decoded);
    video.addEventListener('error', fallback);
    frameRef.value.addEventListener('load', captureStill);
    document.addEventListener('visibilitychange', visibility);
    visibility();
    if (mediaRequested) loadMedia();
    draw(requestedTurns);
  });
  onScopeDispose(() => {
    disposed = true;
    loader?.dispose(); releaseVideo(); releaseStill();
    if (video) {
      video.removeEventListener('loadedmetadata', metadata);
      video.removeEventListener('loadeddata', decoded);
      video.removeEventListener('seeked', decoded);
      video.removeEventListener('error', fallback);
    }
    frameRef.value?.removeEventListener('load', captureStill);
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', visibility);
  });
  return { frameMode, videoReady, reduced, staticMedia, stillVisible, prepare, setPlayback, prepareStill, setStillActive };
}
