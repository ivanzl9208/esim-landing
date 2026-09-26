<script setup>
import { computed } from 'vue';
import { typograph } from '../utils/typography.js';
const props = defineProps({ text: { type: String, required: true } });
const segments = computed(() => typograph(props.text).split(/(\n|[ \t]+)/u).filter(Boolean));
</script>
<template>
  <template v-for="(segment, segmentIndex) in segments" :key="segmentIndex">
    <br v-if="segment === '\n'" />
    <template v-else-if="/^[ \t]+$/u.test(segment)">
      <span v-for="(character, index) in Array.from(segment)" :key="index" class="soft-blur-unit soft-blur-space">{{ character }}</span>
    </template>
    <span v-else class="soft-blur-word"><span v-for="(character, index) in Array.from(segment)" :key="index" class="soft-blur-unit">{{ character }}</span></span>
  </template>
</template>
