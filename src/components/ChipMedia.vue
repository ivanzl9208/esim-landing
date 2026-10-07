<script setup>
import { ref } from 'vue';
import { asset } from '../utils/assets.js';
import { useChipMedia } from '../composables/useChipMedia.js';
const video = ref(null);
const frame = ref(null);
const still = ref(null);
const { frameMode, videoSource, videoReady, reduced, stillOpacity, stillFilter, prepare, setPlayback, prepareStill, setZoomQuality } = useChipMedia(video, frame, still);
defineExpose({ prepare, setPlayback, prepareStill, setZoomQuality });
</script>
<template>
  <div class="chip-media-wrapper">
  <video ref="video" class="chip-scroll-video" :poster="asset('chip-frames/frame-001.webp')"
    :data-video-format="reduced ? 'static' : frameMode ? 'frames' : videoSource.endsWith('.mov') ? 'mov' : 'webm'" :style="{ opacity: videoReady && !frameMode && !reduced ? 1 - stillOpacity : 0 }"
    muted playsinline preload="none" aria-hidden="true" />
  <img draggable="false" ref="frame" class="chip-scroll-frame" :src="asset('chip-frames/frame-001.webp')"
    width="640" height="640" :style="{ opacity: (!videoReady || frameMode || reduced) ? 1 - stillOpacity : 0 }" alt="" aria-hidden="true" />
  <img draggable="false" ref="still" class="chip-scroll-still" width="1350" height="1350"
    :style="{ opacity: stillOpacity, filter: stillFilter }" alt="" aria-hidden="true" />
  </div>
</template>
