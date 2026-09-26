<script setup>
import { ref } from 'vue';
import ChipMedia from './ChipMedia.vue';
import SoftBlurText from './SoftBlurText.vue';
import { CHIP_FEATURES, STORY_BENEFITS, SAFETY_COPY } from '../data/story.js';
import { asset } from '../utils/assets.js';
import { typograph } from '../utils/typography.js';
const media = ref(null);
defineExpose({ prepare: () => media.value?.prepare(), setPlayback: (progress, turns) => media.value?.setPlayback(progress, turns) });
</script>
<template>
  <div class="chip-reveal-layer" aria-hidden="true">
    <div class="chip-gradient">
      <div class="chip-background-transition" />
      <div class="advantages-marquee">Преимущества&nbsp;eSIM</div>
      <div class="esim-definition-marquee">eSIM&nbsp;— это...</div>
      <div class="story-benefits-copy">
        <p v-for="(text, index) in STORY_BENEFITS" :key="text" :class="`story-benefit story-benefit-${index + 1}`">{{ typograph(text) }}</p>
      </div>
      <p class="safety-copy"><template v-for="(character, index) in Array.from(typograph(SAFETY_COPY))" :key="index"><br v-if="character === '\n'" class="safety-mobile-break" /><span v-else class="safety-character">{{ character }}</span></template></p>
      <ChipMedia ref="media" />
      <div class="chip-features">
        <article v-for="(feature, index) in CHIP_FEATURES" :key="feature.icon" :class="`chip-feature chip-feature-${index}`">
          <div class="chip-feature-rule"><span class="chip-feature-icon"><img draggable="false" class="chip-feature-icon-motion" :src="asset(`icons/${feature.icon}`)" alt="" /></span></div>
          <div class="chip-feature-copy">
            <div class="chip-feature-title-clip"><h2><SoftBlurText :text="feature.title" /></h2></div>
            <div class="chip-feature-paragraph-clip"><p><SoftBlurText :text="feature.description" /></p></div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
