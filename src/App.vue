<script setup>
import { provide, ref } from 'vue';
import HeroIntro from './components/HeroIntro.vue';
import FadeIntroStage from './components/FadeIntroStage.vue';
import ChipStory from './components/ChipStory.vue';
import StoryTranscript from './components/StoryTranscript.vue';
import DeviceChecker from './components/DeviceChecker.vue';
import LandingEnding from './components/LandingEnding.vue';
import SiteFooter from './components/SiteFooter.vue';
import ScrollProgress from './components/ScrollProgress.vue';
import './styles/ending.css';
import { useScrollScene } from './composables/useScrollScene.js';
import { provideMediaConnection } from './composables/useMediaConnection.js';
import { SCENE_BASE_HEIGHT } from './animation/timing.js';
import { asset } from './utils/assets.js';
import { typograph } from './utils/typography.js';
const main = ref(null);
const scene = ref(null);
const media = ref(null);
const checker = ref(null);
const progress = ref(null);
provideMediaConnection();
const { goToChecker, prepareCheckerResult, setScrollPosition } = useScrollScene(scene, media, checker, progress);
provide('setScrollPosition', setScrollPosition);
const focusMain = () => {
  main.value?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
};
</script>
<template>
  <nav class="skip-links" aria-label="Быстрая навигация">
    <a class="skip-link" href="#main-content" @click.prevent="focusMain">{{ typograph('Перейти к основному содержимому') }}</a>
    <a class="skip-link" href="#device-checker" @click.prevent="goToChecker">{{ typograph('Перейти к проверке устройства') }}</a>
  </nav>
  <main id="main-content" ref="main" tabindex="-1">
    <div ref="scene" class="scroll-scene" :style="{ '--scene-base-height': SCENE_BASE_HEIGHT }">
      <section class="hero-stage" aria-labelledby="esim-intro-title">
        <HeroIntro @check="goToChecker" />
        <StoryTranscript />
        <div class="white-curtain" aria-hidden="true">
          <FadeIntroStage />
        </div>
        <ChipStory ref="media" />
        <div class="roulette-bottom-fade" aria-hidden="true"><div class="roulette-bottom-svg-layer"><img draggable="false" :src="asset('blur.svg')" alt="" /></div></div>
        <a class="roulette-button" href="#device-checker" tabindex="-1" inert @click.prevent="goToChecker"><span class="roulette-button-label">Подключить eSIM</span></a>
      </section>
    </div>
    <DeviceChecker ref="checker" :prepare-result="prepareCheckerResult" />
    <LandingEnding />
  </main>
  <SiteFooter />
  <ScrollProgress ref="progress" />
</template>
