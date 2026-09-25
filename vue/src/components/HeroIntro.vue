<script setup>
import HeroVideo from './HeroVideo.vue';
import { asset } from '../utils/assets.js';
defineEmits(['check']);
const navigation = ['Связь', 'Услуги и\u00a0сервисы', 'Оплата', 'Помощь', 'Компания', 'Кабинет абонента'];
</script>

<template>
  <div class="hero-surface" id="esim-intro">
    <HeroVideo />
    <header class="site-header">
      <img draggable="false" class="brand-logo" :src="asset('sbermobile-logo.svg')" alt="СберМобайл — выгоднее с Прайм" />
      <button class="location" type="button" disabled aria-label="Регион: Ханты-Мансийский автономный округ">
        <img draggable="false" :src="asset('location-pin.svg')" alt="" /><span>Ханты-Мансийский...</span>
      </button>
      <nav class="desktop-nav" aria-label="Основная навигация">
        <button v-for="item in navigation" :key="item" type="button" disabled>{{ item }}</button>
      </nav>
      <button class="mobile-menu" type="button" aria-label="Меню" disabled><img draggable="false" :src="asset('menu-icon.svg')" alt="" /></button>
    </header>
    <div class="hero-content">
      <div class="hero-copy">
        <h1>eSIM&nbsp;—&nbsp;виртуальная сим-карта</h1>
        <p>Безопасное подключение онлайн за&nbsp;5&nbsp;минут</p>
      </div>
      <a class="connect-button" href="#device-checker" @click.prevent="$emit('check')">Подключить eSIM</a>
    </div>
  </div>
</template>
