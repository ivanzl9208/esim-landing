// Static footer labels from sbermobile.ru/sberprime/.
export const footerGroups = [
  {
    title: 'Связь',
    links: [
      ['Тарифы', '/tariffs/'], ['eSIM', '/esim/'], ['Карта покрытия', '/karta-pokrytiya/'], ['Роуминг', '/roaming/'],
      ['Зарплатным клиентам', '/tariffs/dlya-professionalov/'], ['Абонентам от 55+', '/tariffs/pilotmasters/'],
      ['Иностранцам', '/instruction-for-foreigners/'], ['Детям', '/sberkids/'], ['Абонементы на связь', '/banner'],
      ['eSIM для путешествий', '/esim-travel/'], ['Архив тарифов', '/b2c/archive/'],
    ],
  },
  {
    title: 'Услуги и сервисы',
    links: [
      ['Перенести номер', '/mnp/'], ['Безопасность', '/security/'], ['Близкий круг', '/blizkiy-krug/'],
      ['СберПрайм', '/sberprime/'], ['Бонусы Спасибо', '/about/spasibo/'],
      ['Активировать сим-карту', 'https://lk.sbermobile.ru/self-registration/select-iccid'],
      ['Дополнительные услуги', '/services/'], ['Оплата зарубежных сервисов', 'https://embedded.multitransfer.ru/sber-mobile/'],
    ],
  },
  {
    title: 'Помощь',
    links: [
      ['Поддержка', '/faq/'], ['Спросите у ГигаЧата', '/assistant/'],
      ['Восстановить сим-карту', '/faq/top-voprosy/kak_zablokirovat_simkarty_pri_ytere_ili_krazhe_nastroika.html'],
      ['Доступ к приложениям из белого списка', '/faq/mobilnaya-svyaz-i-internet/predostavlyaet-li-sbermobajl-dostup-k-soczialno-znachimym-informaczionnym-resursam-pri-otklyuchenii-interneta.html'],
      ['Как пополнить баланс', '/faq/top-voprosy/kak_popolnit_balans.html'],
      ['Настроить интернет', '/faq/mobilnaya-svyaz-i-internet/kak_nastroit_internet.html'],
      ['Связаться с нами в Max', 'https://max.ru/sbermobile_support_bot'],
    ],
  },
  {
    title: 'Компания',
    links: [
      ['О нас', '/about/'], ['Акции и скидки', '/about/actions/'], ['Точки продаж', '/officesmap/'],
      ['Вакансии', '/about/vacancies/'], ['Блог', '/about/blog/'], ['Пригласить друга', '/friends/'], ['Новости', '/about/news/'],
    ],
  },
  { title: 'Ещё', links: [['Карта сайта', '/sitemap/'], ['Документы', '/about/documents/']] },
];

export const footerHref = href => href.startsWith('http') ? href : `https://sbermobile.ru${href}`;

export const appStores = [
  { name: 'Android', verb: 'Загрузите на', icon: 'ending/store-0.svg' },
  { name: 'iOS', verb: 'Установите на', icon: 'ending/store-1.svg' },
  { name: 'AppGallery', verb: 'Откройте в', icon: 'ending/store-2.svg' },
  { name: 'RuStore', verb: 'Скачайте в', icon: 'ending/store-3.svg' },
];
