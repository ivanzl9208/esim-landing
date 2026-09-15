<script setup>
import { ref } from 'vue';
import HeroIntro from './components/HeroIntro.vue';
import RouletteStage from './components/RouletteStage.vue';
import ChipStory from './components/ChipStory.vue';
import StoryTranscript from './components/StoryTranscript.vue';
import DeviceChecker from './components/DeviceChecker.vue';
import { useScrollScene } from './composables/useScrollScene.js';
import { asset } from './utils/assets.js';
const scene = ref(null);
const media = ref(null);
const checker = ref(null);
const { goToChecker } = useScrollScene(scene, media, checker);
</script>
<template>
  <main>
    <a class="skip-link" href="#device-checker" @click.prevent="goToChecker">Перейти к проверке устройства</a>
    <div ref="scene" class="scroll-scene">
      <section class="hero-stage" aria-label="eSIM от СберМобайла">
        <HeroIntro @check="goToChecker" />
        <StoryTranscript />
        <div class="white-curtain" aria-hidden="true" />
        <ChipStory ref="media" />
        <RouletteStage />
        <div class="roulette-bottom-fade" aria-hidden="true"><div class="roulette-bottom-svg-layer"><img :src="asset('blur.svg')" alt="" /></div></div>
        <a class="roulette-button" href="#device-checker" tabindex="-1" inert @click.prevent="goToChecker"><span class="roulette-button-label">Подключить eSIM</span></a>
        <DeviceChecker ref="checker" />
      </section>
    </div>
  </main>
</template>
