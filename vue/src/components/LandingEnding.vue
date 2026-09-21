<script setup>
import { ref } from 'vue';
import FaqSection from './FaqSection.vue';
import TransferBanner from './TransferBanner.vue';
import ConnectCta from './ConnectCta.vue';
import { useEndingMotion } from '../composables/useEndingMotion.js';
const root = ref(null);
useEndingMotion(root);
defineExpose({ root });
</script>
<template>
  <div ref="root" class="landing-ending">
    <div class="ending-white">
      <div class="faq-reveal-clip">
        <div class="faq-reveal-composition" inert>
          <FaqSection />
          <TransferBanner />
        </div>
      </div>
    </div>
    <ConnectCta />
  </div>
</template>
