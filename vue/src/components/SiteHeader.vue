<script setup>
import { asset } from '../utils/assets.js';

const navigation = ['Связь', 'Услуги и сервисы', 'Оплата', 'Помощь', 'Компания', 'Кабинет абонента'];
</script>

<template>
  <header class="site-header">
    <div class="site-header-container">
      <div class="site-header-brand">
        <picture class="brand-logo">
          <source media="(max-width: 1279px)" :srcset="asset('site-chrome/logo-mobile.svg')" />
          <img draggable="false" :src="asset('site-chrome/logo.svg')" width="115" height="54" alt="СберМобайл — выгоднее с Прайм" />
        </picture>
        <button class="location" type="button" disabled aria-label="Регион: Москва">
          <img draggable="false" :src="asset('location-pin.svg')" width="12" height="12" alt="" />
          <span>Москва</span>
        </button>
      </div>
      <nav class="desktop-nav" aria-label="Основная навигация">
        <button v-for="item in navigation" :key="item" type="button" disabled>{{ item }}</button>
      </nav>
      <button class="mobile-menu" type="button" aria-label="Меню" disabled>
        <img draggable="false" :src="asset('site-chrome/menu.svg')" width="32" height="32" alt="" />
      </button>
    </div>
  </header>
</template>

<style scoped>
/* Production chrome uses CSS pixels, independently of the animated scene scale. */
.site-header { position: absolute; z-index: 4; inset: 0 0 auto; color: #fff; }
.site-header-container { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; max-width: 1440px; height: 94px; margin-inline: auto; padding-inline: 60px; }
.site-header-brand { display: flex; align-items: center; gap: 16px; }
.brand-logo { display: block; flex: 0 0 115px; width: 115px; height: 54px; }
.brand-logo img { display: block; width: 100%; height: 100%; object-fit: contain; }
.location { display: flex; align-items: center; gap: 8px; height: 36px; max-width: 204px; padding: 0 16px; border-radius: 100px; color: rgba(11,12,13,.86); background: #fff; font: 600 14px/16px "SB Sans Text", Arial, sans-serif; letter-spacing: -.42px; }
.location img { flex: 0 0 12px; }
.location span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.desktop-nav { display: flex; align-items: center; }
.desktop-nav button { display: flex; padding: 12px 10px; border: 0; background: none; color: inherit; font: 600 14px/16px "SB Sans Text", Arial, sans-serif; letter-spacing: -.42px; white-space: nowrap; }
.mobile-menu { display: none; padding: 0; width: 32px; height: 32px; background: none; }
.mobile-menu img { display: block; width: 100%; height: 100%; }
@media (max-width: 1279px) {
  .site-header-container { height: calc(67px + env(safe-area-inset-top)); padding: env(safe-area-inset-top) max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left)); }
  .brand-logo { flex-basis: 95px; width: 95px; height: 43px; }
  .location, .desktop-nav { display: none; }
  .mobile-menu { display: block; }
}
</style>
