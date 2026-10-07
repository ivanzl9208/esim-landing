<script setup>
import { ref } from 'vue';
import FaqSection from './FaqSection.vue';
import TransferBanner from './TransferBanner.vue';
import ConnectCta from './ConnectCta.vue';
import { useEndingMotion } from '../composables/useEndingMotion.js';
const root = ref(null);
useEndingMotion(root);
</script>
<template>
  <div ref="root" class="landing-ending">
    <div class="ending-white">
      <FaqSection />
      <TransferBanner />
    </div>
    <ConnectCta />
  </div>
</template>
