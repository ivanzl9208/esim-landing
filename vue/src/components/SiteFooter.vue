<script setup>
import { footerGroups, appStores } from '../data/footerLinks.js';
import { asset } from '../utils/assets.js';
</script>
<template>
  <footer class="site-footer" aria-label="СберМобайл">
    <div class="footer-container">
      <div class="footer-columns">
        <div class="footer-contact">
          <div><span class="footer-phone">901</span><p>Бесплатно с номеров СберМобайла<br /> по России</p></div>
          <div><span class="footer-phone">+7 (499) 651-44-44</span><p>Бесплатно с номеров СберМобайла в роуминге, по тарифам оператора — с номеров других операторов</p></div>
          <span class="ending-button ending-button-orange footer-contact-action">Напишите нам</span>
        </div>
        <div class="footer-navigation" aria-label="Разделы сайта СберМобайл">
          <section v-for="group in footerGroups" :key="group.title" class="footer-link-group">
            <h3>{{ group.title }}</h3>
            <ul><li v-for="label in group.links" :key="label"><span>{{ label }}</span></li></ul>
          </section>
        </div>
        <div class="footer-utilities">
          <div class="footer-app">
            <p class="footer-app-title">Скачать приложение<br />СберМобайл</p>
            <div class="footer-qr"><img draggable="false" :src="asset('ending/footer-qr.png')" width="146" height="146" alt="QR-код для скачивания приложения СберМобайл" loading="lazy" /></div>
            <div class="footer-stores"><span v-for="store in appStores" :key="store.name"><img draggable="false" :src="asset(store.icon)" width="32" height="32" alt="" loading="lazy" /><span>{{ store.verb }}<strong>{{ store.name }}</strong></span></span></div>
          </div>
          <div class="footer-service"><strong>Оплата связи</strong><span>Пополните баланс рублями или бонусами Спасибо</span><img draggable="false" :src="asset('ending/footer-chevron.svg')" width="16" height="16" alt="" /></div>
          <div class="footer-service"><strong>Кабинет абонента</strong><span>Настроить тариф, подключить услуги, проверить баланс</span><img draggable="false" :src="asset('ending/footer-chevron.svg')" width="16" height="16" alt="" /></div>
        </div>
      </div>
      <div class="footer-legal">
        <p class="footer-copyright">© 2017 — 2026, Сбербанк-Телеком</p>
        <p class="footer-privacy">Оставаясь на сайте, вы соглашаетесь <span>на обработку данных</span> и использование <span>cookies</span>. Вы можете принять или заблокировать cookies в настройках браузера.</p>
        <div class="footer-social"><span><img draggable="false" :src="asset('ending/telegram.svg')" width="32" height="32" alt="Telegram" loading="lazy" /></span><span><img draggable="false" :src="asset('ending/vk.svg')" width="32" height="32" alt="ВКонтакте" loading="lazy" /></span></div>
      </div>
    </div>
  </footer>
</template>
