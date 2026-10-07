<script setup>
import { computed } from 'vue';
import { typograph } from '../utils/typography.js';
const props = defineProps({ text: { type: String, required: true } });
const segments = computed(() => typograph(props.text).split(/(\n|[ \t]+)/u).filter(Boolean));
</script>
<template>
  <template v-for="(segment, segmentIndex) in segments" :key="segmentIndex">
    <br v-if="segment === '\n'" />
    <span v-else-if="/^[ \t]+$/u.test(segment)" class="soft-blur-space">{{ segment }}</span>
    <span v-else class="soft-blur-word soft-blur-unit">{{ segment }}</span>
  </template>
</template>
