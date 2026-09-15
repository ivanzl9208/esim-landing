<script setup>
import { onMounted, onScopeDispose, ref, watch } from 'vue';
import { asset } from '../utils/assets.js';
import { useMotionPreference } from '../composables/useMotionPreference.js';

const video = ref(null);
const source = ref('');
const reduced = useMotionPreference();
let observer;
let visible = true;
let disposed = false;
const syncPlayback = () => {
  const element = video.value;
  if (!element || disposed) return;
  if (reduced.value || document.hidden || !visible || element.closest('.hero-surface')?.inert) {
    element.pause();
  } else {
    element.play()?.catch(() => {});
  }
};
watch(reduced, syncPlayback, { flush: 'post' });
onMounted(() => {
  video.value.defaultMuted = true;
  video.value.muted = true;
  video.value.playsInline = true;
  const safari = navigator.vendor.includes('Apple') && !/(CriOS|FxiOS|EdgiOS|OPiOS)/i.test(navigator.userAgent);
  source.value = asset(safari ? 'hero-alpha.mov' : 'hero.webm');
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
    :poster="reduced ? asset('esim-chip-static.png') : undefined" :autoplay="!reduced" loop muted playsinline
    :preload="reduced ? 'none' : 'auto'" aria-hidden="true" @canplay="syncPlayback" @scenevisibilitychange="syncPlayback" />
</template>
