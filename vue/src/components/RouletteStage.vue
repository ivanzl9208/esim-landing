<script setup>
import { ROULETTE_LINES } from '../data/story.js';
</script>
<template>
  <div class="roulette-stage" aria-hidden="true">
    <div class="roulette-copy">
      <span v-for="(line, index) in ROULETTE_LINES" :key="line" class="roulette-line" :data-roulette-index="index">{{ line }}</span>
    </div>
    <div class="roulette-finale">всё&nbsp;как <br class="finale-desktop-break" />у&nbsp;обычной<br />сим-карты</div>
  </div>
</template>
