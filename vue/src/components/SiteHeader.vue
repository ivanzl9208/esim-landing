<script setup>
import { asset } from '../utils/assets.js';

const navigation = ['Связь', 'Услуги и сервисы', 'Оплата', 'Помощь', 'Компания', 'Кабинет абонента'];
</script>

<template>
  <header class="site-header">
    <div class="site-header-container">
      <div class="site-header-brand">
        <span class="brand-logo">
          <picture>
            <source media="(max-width: 1279px)" :srcset="asset('site-chrome/logo-mobile.svg')" />
            <img draggable="false" :src="asset('site-chrome/logo.svg')" width="115" height="54" alt="СберМобайл — выгоднее с Прайм" />
          </picture>
        </span>
        <span class="location">
          <img draggable="false" :src="asset('location-pin.svg')" width="12" height="12" alt="" /><span>Москва</span>
        </span>
      </div>
      <div class="site-header-actions">
        <div class="desktop-nav" aria-label="Разделы сайта">
          <span v-for="item in navigation" :key="item">{{ item }}</span>
        </div>
        <div class="header-account">
          <span class="header-bonus">Бонусы<img :src="asset('site-chrome/spasibo.svg')" draggable="false" width="16" height="16" alt="" /></span>
          <span class="header-login">Войти</span>
        </div>
        <span class="mobile-menu" aria-label="Меню">
          <img draggable="false" :src="asset('site-chrome/menu.svg')" width="32" height="32" alt="" />
        </span>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* The site chrome keeps its own pixel dimensions outside the scroll-scene scale. */
.site-header { position: absolute; z-index: 4; inset: 0 0 auto; color: #fff; }
.site-header-container { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; max-width: 1440px; height: 94px; margin-inline: auto; padding-inline: 60px; }
.site-header-brand { display: flex; align-items: center; gap: 16px; }
.brand-logo { display: block; flex: 0 0 115px; width: 115px; height: 54px; }
.brand-logo img { display: block; width: 100%; height: 100%; object-fit: contain; }
.location { display: flex; align-items: center; gap: 8px; height: 36px; max-width: 204px; padding: 0 16px; border-radius: 100px; color: rgba(11,12,13,.86); background: #fff; font: 600 14px/16px "SB Sans Text", Arial, sans-serif; letter-spacing: -.42px; }
.location img { flex: 0 0 12px; }
.site-header-actions { display: flex; align-items: center; gap: 10px; }
.desktop-nav { display: flex; align-items: center; }
.desktop-nav > span { display: flex; padding: 12px 10px; border-radius: 100px; font: 600 14px/16px "SB Sans Text", Arial, sans-serif; letter-spacing: -.42px; white-space: nowrap; }
.header-account { display: flex; align-items: center; gap: 4px; }
.header-bonus { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 10px; border-radius: 17px 17px 17px 0; background: linear-gradient(94deg,#9ddb10 4.38%,#32ba23 30.09%,#1db565 66.42%,#0d9fb0); color: #fff; font: 600 16px/16px "SB Sans Text", Arial, sans-serif; }
.header-login { display: flex; align-items: center; height: 36px; padding: 0 16px; border-radius: 48px; background: #fff; color: #fa5f05; font: 600 14px/16px "SB Sans Text", Arial, sans-serif; letter-spacing: -.42px; }
.mobile-menu { display: none; width: 32px; height: 32px; }
.mobile-menu img { display: block; width: 100%; height: 100%; }
@media (max-width: 1279px) {
  .site-header-container { height: calc(67px + env(safe-area-inset-top)); padding: env(safe-area-inset-top) max(16px,env(safe-area-inset-right)) 0 max(16px,env(safe-area-inset-left)); }
  .brand-logo { flex-basis: 95px; width: 95px; height: 43px; }
  .location, .desktop-nav { display: none; }
  .site-header-actions { gap: 16px; }
  .header-bonus { font-size: 14px; gap: 4px; padding-inline: 8px; }
  .header-bonus img { width: 14px; height: 14px; }
  .header-login { height: 32px; padding-inline: 12px; font-size: 12px; }
  .mobile-menu { display: block; }
}
@media (max-width: 359px) {
  .site-header-container, .site-header-actions { gap: 6px; }
  .header-login { padding-inline: 10px; }
  .header-bonus { padding-inline: 6px; font-size: 12px; }
}
</style>
