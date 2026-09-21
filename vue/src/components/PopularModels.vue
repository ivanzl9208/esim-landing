<script setup>
import { computed } from 'vue';

const props = defineProps({ items: { type: Array, required: true }, loading: Boolean });
defineEmits(['choose']);
// Preserve the three rows of the existing mobile layout.
const rows = computed(() => [props.items.slice(0, 4), props.items.slice(4, 8), props.items.slice(8)]);
const cycle = row => row.length === 2 ? [...row, ...row] : row;
</script>

<template>
  <div class="checker-popular-list">
    <button v-for="item in items" :key="item.label" type="button" :disabled="loading" @click="$emit('choose', item.device)">{{ item.label }}</button>
  </div>
  <div class="checker-popular-marquee">
    <div v-for="(row, index) in rows" :key="index" class="checker-model-row" data-lenis-prevent>
      <div class="checker-model-track" :style="{ '--marquee-duration': `${[28, 30, 29][index]}s` }">
        <div v-for="copy in 2" :key="copy" class="checker-model-group" :class="{ 'is-copy': copy === 2 }" :aria-hidden="copy === 2 ? true : undefined">
          <button v-for="(item, itemIndex) in cycle(row)" :key="`${itemIndex}-${item.label}`" type="button"
            :class="{ 'is-copy': itemIndex >= row.length }" :aria-hidden="itemIndex >= row.length ? true : undefined"
            :tabindex="copy === 2 || itemIndex >= row.length ? -1 : undefined" :disabled="loading"
            @pointerdown.prevent
            @click="$emit('choose', item.device)">{{ item.label }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
