<script setup>
import { onMounted, onScopeDispose, ref, watch } from 'vue';
import { asset } from '../utils/assets.js';
import { getMediaPlayback } from '../utils/mediaPlayback.js';
import { useMotionPreference } from '../composables/useMotionPreference.js';

const video = ref(null);
const source = ref('');
const presented = ref(false);
const playbackError = ref('');
const reduced = useMotionPreference();
let observer;
let visible = true;
let disposed = false;
let mounted = false;
let frameCallback;
const reportError = error => {
  if (disposed || error?.name === 'AbortError') return;
  const message = `${error?.name || 'MediaError'}: ${error?.message || 'Unable to decode video'}`;
  presented.value = false;
  if (message !== playbackError.value) console.warn('[HeroVideo]', message);
  playbackError.value = message;
};
const markPresented = () => {
  const element = video.value;
  if (!element || disposed) return;
  const ready = () => {
    frameCallback = undefined;
    if (!disposed && !reduced.value) { presented.value = true; playbackError.value = ''; }
  };
  // `playing` promises playback, not a painted frame. Keep the identical
  // static composition until the browser has actually presented the video.
  if (element.requestVideoFrameCallback) {
    if (frameCallback !== undefined) element.cancelVideoFrameCallback(frameCallback);
    frameCallback = element.requestVideoFrameCallback(ready);
  } else requestAnimationFrame(ready);
};
const syncPlayback = () => {
  const element = video.value;
  if (!element || disposed) return;
  if (reduced.value || document.hidden || !visible || element.closest('.hero-surface')?.inert) {
    element.pause();
  } else if (source.value) {
    element.play()?.catch(reportError);
  }
};
const syncSource = () => {
  if (!mounted) return;
  const next = reduced.value ? '' : asset(getMediaPlayback(navigator).heroSource);
  if (source.value !== next) { presented.value = false; source.value = next; }
  syncPlayback();
};
watch(reduced, syncSource, { flush: 'post' });
onMounted(() => {
  mounted = true;
  video.value.defaultMuted = true;
  video.value.muted = true;
  video.value.playsInline = true;
  syncSource();
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncPlayback();
  }, { threshold: 0.01 });
  observer.observe(video.value);
  document.addEventListener('visibilitychange', syncPlayback);
  window.addEventListener('pageshow', syncPlayback);
});
onScopeDispose(() => {
  disposed = true;
  if (frameCallback !== undefined) video.value?.cancelVideoFrameCallback?.(frameCallback);
  observer?.disconnect();
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
    :data-playback-error="playbackError || undefined" :autoplay="!reduced" loop muted playsinline
    :preload="reduced ? 'none' : 'auto'" aria-hidden="true" @canplay="syncPlayback" @playing="markPresented"
    @error="reportError($event.target.error)" @scenevisibilitychange="syncPlayback" />
  <img v-show="reduced || !presented" class="hero-video hero-video-fallback" :src="asset('hero-poster.webp')"
    width="930" height="1030" alt="" aria-hidden="true" draggable="false" fetchpriority="high" />
</template>
