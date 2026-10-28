<script setup>
import { footerGroups, appStores, footerHref } from '../data/footerLinks.js';
import { asset } from '../utils/assets.js';
import { typograph } from '../utils/typography.js';
</script>
<template>
  <footer id="site-footer" class="site-footer" aria-label="СберМобайл">
    <div class="footer-container">
      <div class="footer-columns">
        <div class="footer-contact">
          <div><a class="footer-phone" href="tel:901">901</a><p>{{ typograph('Бесплатно с номеров СберМобайла') }}<br />{{ typograph('по России') }}</p></div>
          <div><a class="footer-phone" href="tel:+74996514444">+7 (499) 651-44-44</a><p>{{ typograph('Бесплатно с номеров СберМобайла в роуминге, по тарифам оператора — с номеров других операторов') }}</p></div>
          <a class="ending-button ending-button-orange footer-contact-action" href="https://sbermobile.ru/support/feedback/">Напишите нам</a>
        </div>
        <div class="footer-navigation" aria-label="Разделы сайта СберМобайл">
          <section v-for="group in footerGroups" :key="group.title" class="footer-link-group">
            <h3>{{ typograph(group.title) }}</h3>
            <ul><li v-for="([label, href]) in group.links" :key="label"><a :href="footerHref(href)">{{ typograph(label) }}</a></li></ul>
          </section>
        </div>
        <div class="footer-utilities">
          <div class="footer-app">
            <p class="footer-app-title">Скачать приложение<br />СберМобайл</p>
            <div class="footer-qr"><img draggable="false" :src="asset('ending/footer-qr.webp')" width="146" height="146" alt="QR-код для скачивания приложения СберМобайл" loading="lazy" /></div>
            <div class="footer-stores"><span v-for="store in appStores" :key="store.name"><img draggable="false" :src="asset(store.icon)" width="32" height="32" alt="" loading="lazy" /><span>{{ store.verb }}<strong>{{ store.name }}</strong></span></span></div>
          </div>
          <a class="footer-service" href="https://sbermobile.ru/payment/pay/"><strong>Оплата связи</strong><span>{{ typograph('Пополните баланс рублями или бонусами Спасибо') }}</span><img draggable="false" :src="asset('ending/footer-chevron.svg')" width="16" height="16" alt="" /></a>
          <a class="footer-service" href="https://lk.sbermobile.ru/"><strong>Кабинет абонента</strong><span>{{ typograph('Настроить тариф, подключить услуги, проверить баланс') }}</span><img draggable="false" :src="asset('ending/footer-chevron.svg')" width="16" height="16" alt="" /></a>
        </div>
      </div>
      <div class="footer-legal">
        <p class="footer-copyright">{{ typograph('© 2017 — 2026, Сбербанк-Телеком') }}</p>
        <p class="footer-privacy">{{ typograph('Оставаясь на сайте, вы соглашаетесь') }} <span>{{ typograph('на обработку данных') }}</span> {{ typograph('и использование') }} <span>cookies</span>. {{ typograph('Вы можете принять или заблокировать cookies в настройках браузера.') }}</p>
        <nav class="footer-social" aria-label="СберМобайл в социальных сетях"><a href="https://t.me/sbermobile" aria-label="СберМобайл в Telegram"><img draggable="false" :src="asset('ending/telegram.svg')" width="32" height="32" alt="" loading="lazy" /></a><a href="https://vk.com/sbermobile" aria-label="СберМобайл во ВКонтакте"><img draggable="false" :src="asset('ending/vk.svg')" width="32" height="32" alt="" loading="lazy" /></a></nav>
      </div>
    </div>
  </footer>
</template>
