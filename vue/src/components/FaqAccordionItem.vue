<script setup>
import { asset } from '../utils/assets.js';
defineProps({ item: { type: Object, required: true }, open: Boolean, id: { type: String, required: true } });
defineEmits(['toggle']);
</script>
<template>
  <article class="faq-item" :class="{ 'is-open': open }">
    <h3>
      <button :id="`${id}-question`" type="button" :aria-expanded="open" :aria-controls="`${id}-answer`" @click="$emit('toggle')">
        <span>{{ item.question }}</span><img draggable="false" :src="asset('ending/chevron.svg')" width="24" height="24" alt="" />
      </button>
    </h3>
    <div :id="`${id}-answer`" class="faq-answer" role="region" :aria-labelledby="`${id}-question`" :aria-hidden="!open" :inert="!open">
      <div class="faq-answer-clip"><p>{{ item.answer }}</p></div>
    </div>
  </article>
</template>
