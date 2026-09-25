<script setup>
import HeroVideo from './HeroVideo.vue';
import SiteHeader from './SiteHeader.vue';
defineEmits(['check']);
</script>

<template>
  <div class="hero-surface" id="esim-intro">
    <HeroVideo />
    <SiteHeader />
    <div class="hero-content">
      <div class="hero-copy">
        <h1>eSIM&nbsp;—&nbsp;виртуальная сим-карта</h1>
        <p>Безопасное подключение онлайн за&nbsp;5&nbsp;минут</p>
      </div>
      <a class="connect-button" href="#device-checker" @click.prevent="$emit('check')">Подключить eSIM</a>
    </div>
  </div>
</template>
