<script setup>
import { INTRO_GROUPS } from '../data/story.js';
</script>
<template>
  <div class="intro-text-viewport" aria-hidden="true">
    <div class="intro-text-column">
      <div class="intro-text-list">
        <div v-for="group in INTRO_GROUPS" :key="group[0]" class="intro-text-group">
          <span v-for="line in group" :key="line" class="intro-text-line">{{ line }}</span>
        </div>
      </div>
      <div class="intro-text-finale">всё&nbsp;как<br />у&nbsp;обычной<br />сим-карты</div>
    </div>
  </div>
</template>
