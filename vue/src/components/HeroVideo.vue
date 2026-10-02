<script setup>
import { onMounted, onScopeDispose, ref, watch } from 'vue';
import { asset } from '../utils/assets.js';
import { getMediaPlayback } from '../utils/mediaPlayback.js';
import { useMotionPreference } from '../composables/useMotionPreference.js';
import { useMediaConnection } from '../composables/useMediaConnection.js';
import { MEDIA_LOAD_DEADLINE } from '../utils/mediaConnection.js';

const video = ref(null);
const source = ref('');
const presented = ref(false);
const playbackError = ref('');
const reduced = useMotionPreference();
const { avoidVideo, markSlow } = useMediaConnection();
let disposed = false;
let mounted = false;
let frameCallback;
let presentationFrame;
let loadDeadline;
let failed = false;
const cancelPresentation = () => {
  clearTimeout(loadDeadline);
  if (frameCallback !== undefined) video.value?.cancelVideoFrameCallback?.(frameCallback);
  if (presentationFrame !== undefined) cancelAnimationFrame(presentationFrame);
  frameCallback = undefined;
  presentationFrame = undefined;
};
const reportError = error => {
  if (disposed || error?.name === 'AbortError') return;
  const message = `${error?.name || 'MediaError'}: ${error?.message || 'Unable to decode video'}`;
  presented.value = false;
  failed = true;
  cancelPresentation();
  source.value = '';
  if (message !== playbackError.value) console.warn('[HeroVideo]', message);
  playbackError.value = message;
};
const markPresented = () => {
  const element = video.value;
  if (!element || disposed) return;
  const ready = () => {
    frameCallback = undefined;
    if (!disposed && source.value && !reduced.value && !avoidVideo.value) {
      clearTimeout(loadDeadline);
      presented.value = true; playbackError.value = '';
    }
  };
  // `playing` promises playback, not a painted frame. Keep the identical
  // static composition until the browser has actually presented the video.
  if (element.requestVideoFrameCallback) {
    if (frameCallback !== undefined) element.cancelVideoFrameCallback(frameCallback);
    frameCallback = element.requestVideoFrameCallback(ready);
  } else {
    if (presentationFrame !== undefined) cancelAnimationFrame(presentationFrame);
    presentationFrame = requestAnimationFrame(() => { presentationFrame = undefined; ready(); });
  }
};
const syncPlayback = () => {
  const element = video.value;
  if (!element || disposed) return;
  if (failed || reduced.value || avoidVideo.value || document.hidden) {
    element.pause();
    cancelPresentation();
    source.value = '';
    presented.value = false;
  } else {
    if (!source.value) {
      source.value = asset(getMediaPlayback(navigator).heroSource);
      loadDeadline = setTimeout(() => {
        markSlow();
        reportError(new Error('Video load deadline exceeded'));
      }, MEDIA_LOAD_DEADLINE);
    }
    element.play()?.catch(reportError);
  }
};
const syncSource = () => {
  if (!mounted) return;
  syncPlayback();
};
watch([reduced, avoidVideo], syncSource, { flush: 'post' });
onMounted(() => {
  mounted = true;
  video.value.defaultMuted = true;
  video.value.muted = true;
  video.value.playsInline = true;
  syncSource();
  document.addEventListener('visibilitychange', syncPlayback);
  window.addEventListener('pageshow', syncPlayback);
});
onScopeDispose(() => {
  disposed = true;
  cancelPresentation();
  video.value?.pause();
  video.value?.removeAttribute('src');
  video.value?.load();
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', syncPlayback);
    window.removeEventListener('pageshow', syncPlayback);
  }
});
</script>

<template>
  <video ref="video" class="hero-video" :src="source || undefined"
    :data-playback-error="playbackError || undefined" :autoplay="!reduced && !avoidVideo" loop muted playsinline
    :preload="reduced || avoidVideo ? 'none' : 'auto'" aria-hidden="true" @canplay="syncPlayback" @playing="markPresented"
    @error="reportError($event.target.error)" />
  <img v-show="reduced || avoidVideo || !presented" class="hero-video hero-video-fallback" :src="asset('hero-poster.webp')"
    width="930" height="1030" alt="" aria-hidden="true" draggable="false" fetchpriority="high" />
</template>
