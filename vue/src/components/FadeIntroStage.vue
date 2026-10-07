<script setup>
import { INTRO_LINES } from '../data/story.js';
</script>
<template>
  <div class="intro-text-viewport" aria-hidden="true">
    <div class="intro-text-column">
      <div class="intro-text-list">
        <span v-for="line in INTRO_LINES" :key="line" class="intro-text-line">{{ line }}</span>
      </div>
      <div class="intro-text-finale">всё&nbsp;как<br />у&nbsp;обычной<br />сим-карты</div>
    </div>
  </div>
</template>
