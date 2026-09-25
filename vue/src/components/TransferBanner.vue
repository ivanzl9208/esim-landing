<script setup>
import { asset } from '../utils/assets.js';
</script>
<template>
  <aside class="transfer-banner" aria-label="Перенос номера в СберМобайл">
    <img draggable="false" class="transfer-banner-image" :src="asset('ending/2gb.png')" width="540" height="531" alt="" loading="lazy" />
    <div class="transfer-banner-copy"><h3>Перенести номер</h3><p>Удваиваем Гб каждый месяц за перенос номера в СберМобайл</p></div>
    <button class="ending-button ending-button-orange" type="button">Перенести номер</button>
  </aside>
</template>
