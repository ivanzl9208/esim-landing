<script setup>
import { ref } from 'vue';
import { asset } from '../utils/assets.js';
import { useChipMedia } from '../composables/useChipMedia.js';
const video = ref(null);
const frame = ref(null);
const still = ref(null);
const { frameMode, videoReady, reduced, staticMedia, stillVisible, prepare, setPlayback, prepareStill, setStillActive } = useChipMedia(video, frame, still);
defineExpose({ prepare, setPlayback, prepareStill, setStillActive });
</script>
<template>
  <video ref="video" class="chip-scroll-video" :poster="asset('chip-frames/frame-001.webp')"
    :data-video-format="staticMedia || reduced ? 'static' : frameMode ? 'frames' : 'webm'" :style="{ opacity: videoReady && !frameMode && !reduced && !staticMedia && !stillVisible ? 1 : 0 }"
    muted playsinline preload="none" aria-hidden="true" />
  <img draggable="false" ref="frame" class="chip-scroll-frame" :src="asset('chip-frames/frame-001.webp')"
    width="640" height="640" :style="{ opacity: (!videoReady || frameMode || reduced || staticMedia) && !stillVisible ? 1 : 0 }" alt="" aria-hidden="true" />
  <img draggable="false" ref="still" class="chip-scroll-still" width="800" height="800"
    :style="{ opacity: stillVisible ? 1 : 0 }" alt="" aria-hidden="true" />
</template>
