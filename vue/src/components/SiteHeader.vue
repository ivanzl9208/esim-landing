<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { asset } from '../utils/assets.js';
import { headerSections } from '../data/headerNavigation.js';
import HeaderMenuContent from './HeaderMenuContent.vue';

const root = ref(null);
const mobileDialog = ref(null);
const mobileButton = ref(null);
const desktopSection = ref(null);
const mobileSection = ref(null);
const mobileOpen = ref(false);
const currentSection = computed(() => headerSections.find(section => section.index === desktopSection.value));
const navigation = [
  { label: 'Связь', section: 0 },
  { label: 'Услуги и сервисы', section: 1 },
  { label: 'Оплата', href: 'https://sbermobile.ru/payment/pay/' },
  { label: 'Помощь', section: 3 },
  { label: 'Компания', section: 4 },
  { label: 'Кабинет абонента', href: 'https://lk.sbermobile.ru/' },
];
const mobileQuick = [
  { label: 'Кабинет абонента', href: 'https://lk.sbermobile.ru/' },
  { label: 'Мобильное приложение', href: 'https://sbermobile.ru/lk/' },
  { label: 'Карта покрытия', href: 'https://sbermobile.ru/karta-pokrytiya/' },
  { label: 'Поддержка', href: 'https://sbermobile.ru/faq/' },
  { label: 'Напишите нам', href: 'https://sbermobile.ru/faq/?feedback=true' },
  { label: 'Активировать сим-карту', href: 'https://lk.sbermobile.ru/self-registration/select-iccid' },
];
let trigger = null;
function toggleDesktop(section, event) {
  trigger = event.currentTarget;
  desktopSection.value = desktopSection.value === section ? null : section;
}
function closeDesktop(restoreFocus = false) {
  desktopSection.value = null;
  if (restoreFocus) trigger?.focus({ preventScroll: true });
}
function openMobile() {
  closeDesktop();
  mobileSection.value = null;
  mobileOpen.value = true;
  mobileDialog.value.showModal();
}
function closeMobile() { mobileDialog.value?.close(); }
function onMobileClose() {
  mobileOpen.value = false;
  mobileSection.value = null;
  mobileButton.value?.focus({ preventScroll: true });
}
async function setMobileSection(section) {
  mobileSection.value = section;
  await nextTick();
  mobileDialog.value.querySelector('.mobile-sheet-body')?.scrollTo(0, 0);
  mobileDialog.value.querySelector('.mobile-sheet-heading')?.focus({ preventScroll: true });
}
function onScroll() { if (desktopSection.value !== null) closeDesktop(); }
function onResize() { closeDesktop(); if (mobileOpen.value) closeMobile(); }
function onOutside(event) { if (!root.value?.contains(event.target)) closeDesktop(); }
onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('pointerdown', onOutside);
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onResize);
  document.removeEventListener('pointerdown', onOutside);
});
</script>

<template>
  <header ref="root" :class="['site-header', { 'is-expanded': currentSection }]" @keydown.esc.stop.prevent="closeDesktop(true)" @focusout="event => { if (event.relatedTarget && !root.contains(event.relatedTarget)) closeDesktop(); }">
    <div class="site-header-container">
      <div class="site-header-brand">
        <a class="brand-logo" href="https://sbermobile.ru/" aria-label="СберМобайл — главная">
          <picture>
            <source v-if="!currentSection" media="(max-width: 1279px)" :srcset="asset('site-chrome/logo-mobile.svg')" />
            <img draggable="false" :src="asset(currentSection ? 'site-chrome/logo-dark.svg' : 'site-chrome/logo.svg')" width="115" height="54" alt="СберМобайл — выгоднее с Прайм" />
          </picture>
        </a>
        <a class="location" href="https://sbermobile.ru/" aria-label="Выбрать регион на сайте СберМобайла. Текущий регион: Москва">
          <img draggable="false" :src="asset('location-pin.svg')" width="12" height="12" alt="" /><span>Москва</span>
        </a>
      </div>
      <div class="site-header-actions">
        <nav class="desktop-nav" aria-label="Основная навигация">
          <template v-for="item in navigation" :key="item.label">
            <a v-if="item.href" :href="item.href">{{ item.label }}</a>
            <button v-else type="button" :aria-expanded="desktopSection === item.section" aria-controls="site-header-menu" @click="toggleDesktop(item.section, $event)">{{ item.label }}</button>
          </template>
        </nav>
        <div class="header-account">
          <a class="header-bonus" href="https://sbermobile.ru/about/spasibo/">Бонусы<img :src="asset('site-chrome/spasibo.svg')" draggable="false" width="16" height="16" alt="Спасибо" /></a>
          <a class="header-login" href="https://lk.sbermobile.ru/">Войти</a>
        </div>
        <button ref="mobileButton" class="mobile-menu" type="button" aria-label="Открыть меню" aria-controls="site-mobile-menu" :aria-expanded="mobileOpen" @click="openMobile">
          <img draggable="false" :src="asset('site-chrome/menu.svg')" width="32" height="32" alt="" />
        </button>
      </div>
    </div>
    <div id="site-header-menu" v-show="currentSection" class="desktop-menu-panel" :inert="!currentSection" data-lenis-prevent>
      <HeaderMenuContent v-if="currentSection" :section="currentSection" />
    </div>
  </header>
  <Teleport to="body">
    <dialog ref="mobileDialog" id="site-mobile-menu" class="mobile-sheet" aria-label="Меню СберМобайла" @close="onMobileClose" @click="event => { if (event.target === mobileDialog) closeMobile(); }" data-lenis-prevent>
      <div class="mobile-sheet-bar">
        <button v-if="mobileSection" class="mobile-sheet-back" type="button" aria-label="Назад в меню" @click="setMobileSection(null)">‹</button>
        <h2 class="mobile-sheet-heading" tabindex="-1">{{ mobileSection?.title || 'Частным лицам' }}</h2>
        <button class="mobile-sheet-close" type="button" aria-label="Закрыть меню" @click="closeMobile">×</button>
      </div>
      <div class="mobile-sheet-body">
        <HeaderMenuContent v-if="mobileSection" :section="mobileSection" compact />
        <template v-else>
          <a class="mobile-feature" :href="headerSections[1].cards[0].href"><img :src="headerSections[1].cards[0].img" width="48" height="48" alt="" draggable="false" /><span><strong>Перенести номер</strong><small>Подарим ×2 Гб каждый месяц за перенос номера в СберМобайл</small></span><span aria-hidden="true">›</span></a>
          <div class="mobile-category-grid">
            <button v-for="section in headerSections" :key="section.index" type="button" @click="setMobileSection(section)"><strong>{{ section.title }}</strong><span aria-hidden="true">›</span><img :src="section.mobileImg" width="64" height="64" alt="" draggable="false" /></button>
          </div>
          <a class="mobile-feature" href="https://sbermobile.ru/payment/pay/"><span><strong>Оплата связи</strong><small>Пополните баланс рублями или бонусами Спасибо</small></span><span aria-hidden="true">›</span></a>
          <nav class="mobile-quick" aria-label="Быстрые ссылки"><a v-for="link in mobileQuick" :key="link.href" :href="link.href">{{ link.label }}<span aria-hidden="true">›</span></a></nav>
          <a class="mobile-region" href="https://sbermobile.ru/">Москва <span aria-hidden="true">›</span></a>
        </template>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
/* These dimensions stay in CSS pixels, independent of the animated scene scale. */
.site-header { position: absolute; z-index: 4; inset: 0 0 auto; color: #fff; }
.site-header-container { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; max-width: 1440px; height: 94px; margin-inline: auto; padding-inline: 60px; }
.site-header-brand { display: flex; align-items: center; gap: 16px; }
.brand-logo { display: block; flex: 0 0 115px; width: 115px; height: 54px; }
.brand-logo img { display: block; width: 100%; height: 100%; object-fit: contain; }
.location { display: flex; align-items: center; gap: 8px; height: 36px; max-width: 204px; padding: 0 16px; border-radius: 100px; color: rgba(11,12,13,.86); background: #fff; font: 600 14px/16px "SB Sans Text", Arial, sans-serif; letter-spacing: -.42px; }
.location img { flex: 0 0 12px; }
.site-header-actions { display: flex; align-items: center; gap: 10px; }
.desktop-nav { display: flex; align-items: center; }
.desktop-nav > a, .desktop-nav > button { display: flex; padding: 12px 10px; border: 0; border-radius: 100px; background: none; color: inherit; font: 600 14px/16px "SB Sans Text", Arial, sans-serif; letter-spacing: -.42px; white-space: nowrap; cursor: pointer; }
.desktop-nav > :hover { background: rgba(255,255,255,.16); }
.desktop-nav > [aria-expanded="true"] { color: #fff; background: #fa5f05; }
.header-account { display: flex; align-items: center; gap: 4px; }
.header-bonus { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 10px; border-radius: 17px 17px 17px 0; background: linear-gradient(94deg,#9ddb10 4.38%,#32ba23 30.09%,#1db565 66.42%,#0d9fb0); color: #fff; font: 600 16px/16px "SB Sans Text", Arial, sans-serif; }
.header-login { display: flex; align-items: center; height: 36px; padding: 0 16px; border-radius: 48px; background: #fff; color: #fa5f05; font: 600 14px/16px "SB Sans Text", Arial, sans-serif; letter-spacing: -.42px; }
.header-bonus:hover { filter: brightness(1.06); }
.header-login:hover, .location:hover { background: #f4f4f4; }
.mobile-menu { display: none; padding: 0; width: 32px; height: 32px; background: none; cursor: pointer; }
.mobile-menu img { display: block; width: 100%; height: 100%; }
.site-header.is-expanded { background: #fff; color: #2d2e2e; border-radius: 0 0 60px 60px; box-shadow: 0 30px 80px rgba(0,0,0,.2); }
.is-expanded .header-login, .is-expanded .location { background: #f4f4f4; color: #2d2e2e; }
.is-expanded .desktop-nav > :hover:not([aria-expanded="true"]) { background: #f4f4f4; }
.desktop-menu-panel { max-width: 1440px; max-height: calc(100dvh - 94px); overflow: auto; overscroll-behavior: contain; margin-inline: auto; padding: 0 60px 24px; border-radius: 0 0 60px 60px; }
.mobile-sheet { position: fixed; inset: 16px 0 0; width: 100%; max-width: 600px; height: calc(100dvh - 16px); max-height: none; margin: 0 auto; padding: 0; border: 0; border-radius: 24px 24px 0 0; background: #e9ebeb; color: #2d2e2e; font-family: "SB Sans Text", Arial, sans-serif; }
.mobile-sheet[open] { display: flex; flex-direction: column; }
.mobile-sheet::backdrop { background: rgba(0,0,0,.6); }
.mobile-sheet-bar { display: flex; align-items: center; gap: 12px; padding: 16px; flex-shrink: 0; }
.mobile-sheet-heading { flex: 1; margin: 0; font: 600 17px/20px "SB Sans Display", Arial, sans-serif; }
.mobile-sheet-heading:focus { outline: none; box-shadow: none; }
.mobile-sheet-close, .mobile-sheet-back { display: grid; place-items: center; padding: 0; width: 32px; height: 32px; background: none; color: inherit; font: 400 30px/1 Arial, sans-serif; cursor: pointer; }
.mobile-sheet-body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0 16px max(24px,env(safe-area-inset-bottom)); }
.mobile-feature { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 24px; background: #fff; }
.mobile-feature > span:nth-last-child(2) { flex: 1; }
.mobile-feature strong { display: block; font-size: 17px; line-height: 20px; font-weight: 600; }
.mobile-feature small { display: block; margin-top: 4px; font-size: 14px; line-height: 16px; letter-spacing: -.42px; }
.mobile-category-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; margin-block: 16px; }
.mobile-category-grid button { position: relative; display: flex; align-items: flex-start; justify-content: space-between; min-height: 140px; padding: 16px; border-radius: 24px; background: #fff; color: inherit; text-align: left; cursor: pointer; }
.mobile-category-grid strong { max-width: 120px; font: 600 17px/20px "SB Sans Display", Arial, sans-serif; }
.mobile-category-grid img { position: absolute; bottom: 16px; left: 16px; object-fit: contain; }
.mobile-quick { display: flex; flex-direction: column; gap: 24px; margin-top: 16px; padding: 20px; border-radius: 24px; background: #fff; }
.mobile-quick a, .mobile-region { display: flex; align-items: center; justify-content: space-between; gap: 16px; font-size: 16px; line-height: 22px; }
.mobile-region { padding: 24px 20px; }
.mobile-sheet a:hover, .mobile-category-grid button:hover { color: #fa5f05; }
@media (max-width: 1279px) {
  .site-header-container { height: calc(67px + env(safe-area-inset-top)); padding: env(safe-area-inset-top) max(16px,env(safe-area-inset-right)) 0 max(16px,env(safe-area-inset-left)); }
  .brand-logo { flex-basis: 95px; width: 95px; height: 43px; }
  .location, .desktop-nav, .desktop-menu-panel { display: none; }
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
