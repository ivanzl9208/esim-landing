<script setup>
import { ref, useId } from 'vue';
import { footerGroups, appStores } from '../data/footerLinks.js';
import { asset } from '../utils/assets.js';
const uid = useId();
const expanded = ref([]);
const toggle = index => { expanded.value = expanded.value.includes(index) ? expanded.value.filter(i => i !== index) : [...expanded.value, index]; };
</script>
<template>
  <footer class="site-footer" aria-label="СберМобайл">
    <div class="footer-container">
      <div class="footer-columns">
        <div class="footer-contact">
          <div><a href="tel:901">901</a><p>Бесплатно с номеров СберМобайла<br />по России</p></div>
          <div><a href="tel:+74996514444">+7 (499) 651-44-44</a><p>Бесплатно с номеров СберМобайла в роуминге, по тарифам оператора — с номеров других операторов</p></div>
          <a class="ending-button ending-button-orange" href="https://sbermobile.ru/faq/?feedback=true">Напишите нам</a>
        </div>
        <nav class="footer-navigation" aria-label="Разделы сайта СберМобайл">
          <section v-for="(group, index) in footerGroups" :key="group.title" class="footer-link-group" :class="{ 'is-open': expanded.includes(index) }">
            <h3 class="footer-desktop-heading">{{ group.title }}</h3>
            <h3 class="footer-mobile-heading"><button type="button" :aria-expanded="expanded.includes(index)" :aria-controls="`${uid}-links-${index}`" @click="toggle(index)">{{ group.title }}<img :src="asset('ending/footer-chevron.svg')" width="16" height="16" alt="" /></button></h3>
            <ul :id="`${uid}-links-${index}`"><li v-for="link in group.links" :key="link.href"><a :href="link.href">{{ link.label }}</a></li></ul>
          </section>
        </nav>
        <div class="footer-utilities">
          <div class="footer-app">
            <p class="footer-app-title">Скачать приложение<br />СберМобайл</p>
            <div class="footer-qr"><img :src="asset('ending/footer-qr.png')" width="150" height="150" alt="QR-код для скачивания приложения СберМобайл" loading="lazy" /></div>
            <div class="footer-stores"><a v-for="store in appStores" :key="store.name" :href="store.href" :aria-label="`Приложение СберМобайл: ${store.name}`"><img :src="asset(store.icon)" width="32" height="32" alt="" loading="lazy" /><span>{{ store.verb }}<strong>{{ store.name }}</strong></span></a></div>
          </div>
          <a class="footer-service" href="https://sbermobile.ru/payment/pay"><strong>Оплата связи</strong><span>Пополните баланс рублями или бонусами Спасибо</span><img :src="asset('ending/footer-chevron.svg')" width="16" height="16" alt="" /></a>
          <a class="footer-service" href="https://lk.sbermobile.ru/"><strong>Кабинет абонента</strong><span>Настроить тариф, подключить услуги, проверить баланс</span><img :src="asset('ending/footer-chevron.svg')" width="16" height="16" alt="" /></a>
        </div>
      </div>
      <div class="footer-legal">
        <p class="footer-copyright">© 2017 — 2026, Сбербанк-Телеком</p>
        <p class="footer-privacy">Оставаясь на сайте, вы соглашаетесь <a href="https://sbermobile.ru/upload/politika_pdn_sbermobail.pdf">на обработку данных</a> и использование <a href="https://sbermobile.ru/upload/cookies.pdf">cookies</a>. Вы можете принять или заблокировать cookies в настройках браузера</p>
        <div class="footer-social"><a href="https://t.me/sbermobile_official" aria-label="СберМобайл в Telegram"><img :src="asset('ending/telegram.svg')" width="32" height="32" alt="" loading="lazy" /></a><a href="https://vk.com/sbermobile_official" aria-label="СберМобайл во ВКонтакте"><img :src="asset('ending/vk.svg')" width="32" height="32" alt="" loading="lazy" /></a></div>
      </div>
    </div>
  </footer>
</template>
