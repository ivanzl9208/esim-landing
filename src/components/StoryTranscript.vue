<script setup>
import { CHIP_FEATURES, STORY_BENEFITS, SAFETY_COPY } from '../data/story.js';
</script>
<template>
  <div class="sr-only story-transcript">
    <section aria-labelledby="esim-definition-heading">
      <h2 id="esim-definition-heading">Что такое eSIM</h2>
      <p>eSIM — виртуальная сим-карта: звонки, интернет и смс — всё как у обычной сим-карты.</p>
    </section>
    <section aria-labelledby="esim-features-heading">
      <h2 id="esim-features-heading">Преимущества eSIM</h2>
      <article v-for="feature in CHIP_FEATURES" :key="feature.icon">
        <h3>{{ feature.title.replaceAll('\n', ' ') }}</h3><p>{{ feature.description }}</p>
      </article>
    </section>
    <section aria-labelledby="esim-story-heading">
      <h2 id="esim-story-heading">eSIM — это…</h2>
      <ul><li v-for="benefit in STORY_BENEFITS" :key="benefit">{{ benefit.replace(/^\.\.\./, '') }}</li></ul>
      <p>{{ SAFETY_COPY.replaceAll('\n', '') }}</p>
    </section>
  </div>
</template>
