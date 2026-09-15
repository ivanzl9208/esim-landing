<script setup>
import { ref } from 'vue';
import { asset } from '../utils/assets.js';
import { useChipMedia } from '../composables/useChipMedia.js';
const video = ref(null);
const frame = ref(null);
const { frameMode, reduced, setPlayback } = useChipMedia(video, frame);
defineExpose({ setPlayback });
</script>
<template>
  <video ref="video" class="chip-scroll-video" :poster="asset('chip-frames/frame-001.webp')"
    :data-video-format="frameMode ? 'mov' : 'webm'" :style="{ opacity: frameMode || reduced ? 0 : 1 }"
    muted playsinline :preload="reduced ? 'none' : 'auto'" aria-hidden="true" />
  <img ref="frame" class="chip-scroll-frame" :src="asset('chip-frames/frame-001.webp')"
    :style="{ opacity: frameMode || reduced ? 1 : 0 }" alt="" aria-hidden="true" />
</template>
