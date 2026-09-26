<script setup>
import { asset } from '../utils/assets.js';
import { typograph } from '../utils/typography.js';
</script>
<template>
  <section class="connect-cta" aria-labelledby="connect-cta-title">
    <div class="connect-cta-surface">
      <div class="connect-cta-content">
        <h2 id="connect-cta-title"><span>Подключайтесь</span><span>{{ typograph('к СберМобайлу') }}</span><img draggable="false" :src="asset('ending/lightning.png')" width="160" height="160" alt="" loading="lazy" /></h2>
        <a class="ending-button ending-button-white" href="https://sbermobile.ru/tariffs/">Оформить сим-карту</a>
      </div>
    </div>
  </section>
</template>
