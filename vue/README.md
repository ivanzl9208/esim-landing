# eSIM Landing — Vue

Самостоятельная копия React-эталона на Vue 3.5.35. Исходный проект в корне репозитория не изменён. Весь контент, база устройств, шрифты и 176 исходных assets находятся внутри этого приложения; ссылок на соседний React-проект для запуска нет.

## Запуск

Требуется Node.js 20.19+ либо 22.12+.

```sh
cd vue
npm ci
npm run dev
```

Dev: http://127.0.0.1:5174. Production: `npm run build`, затем `npm run preview` — http://127.0.0.1:4174. Проверки: `npm test`.

## Зависимости

| Пакет | Зафиксированная версия | Назначение |
| --- | --- | --- |
| vue | 3.5.35 | Composition API, SFC |
| gsap | 3.15.0 | Timeline, ScrollTrigger из того же пакета, ticker |
| lenis | 1.3.26 | Сглаживание desktop wheel/trackpad |
| vite | 7.3.6 | Dev server и production build |
| @vitejs/plugin-vue | 6.0.9 | Компиляция Vue SFC |

Версии точные и в package.json, и в package-lock.json. React, ReactDOM, plugin-react и дополнительные UI/animation библиотеки не устанавливались.

**Smooth scrolling: Lenis.** Он работает с нативной позицией страницы, сохраняет CSS sticky и интегрируется в ticker GSAP без собственного RAF-цикла приложения. Используется только при ширине более 700 px, `pointer: fine` и выключенном Reduce Motion. На мобильных и устройствах с coarse pointer — нативный scroll; `syncTouch: false`. Так основной touch-scroll и работа экранной клавиатуры остаются под управлением браузера. Autocomplete и внутренний scroll checker в низких окнах исключены из сглаживания.

Актуальность версии 1.3.26 и схема интеграции проверены по [официальному репозиторию Lenis](https://github.com/darkroomengineering/lenis). [Лицензия MIT](https://github.com/darkroomengineering/lenis/blob/main/LICENSE) допускает коммерческое использование с сохранением copyright/license notice. У GSAP собственная [Standard License](https://gsap.com/community/standard-license/), допускающая использование в коммерческом лендинге; это не MIT. Notices Vue, Lenis и GSAP включены в `public/third-party-notices.txt` и production build. Права на исходные брендовые изображения и шрифты этим не переоформляются.

## Структура

```text
vue/
  index.html, vite.config.js, package.json, package-lock.json
  public/
    assets/                  # независимые копии исходных assets
    third-party-notices.txt
  src/
    main.js                  # клиентская точка входа
    App.vue                  # единая sticky-сцена и переход к checker
    components/
      HeroIntro.vue, HeroVideo.vue
      RouletteStage.vue, SoftBlurText.vue
      ChipStory.vue, ChipMedia.vue
      StoryTranscript.vue, DeviceChecker.vue
    composables/
      useScrollScene.js      # GSAP, ScrollTrigger, Lenis, resize и cleanup
      useChipMedia.js        # video seek и WebP fallback
      useDeviceChecker.js    # состояние формы, клавиатура, таймеры, фокус
      useKeyboardViewport.js # visualViewport
      useMotionPreference.js
    animation/
      timing.js              # позиции всех событий в высотах viewport
      roulette.js            # геометрия текстовой рулетки
      chipStory.js           # геометрия чипа, текста, фона и checker
      math.js
    data/                    # тексты и исходная база устройств
    utils/                   # чистые функции поиска и пути assets
    styles/
      reference.css          # стили, шрифты, токены и адаптив эталона
      accessibility.css      # семантика, фокус, reduced motion, низкие окна
  tests/
    deviceSearch.test.js, ssr.test.js
    browser.html, browser.js # ручной браузерный стенд; вне production entry
  .qa/                       # локальные снимки и измерения; gitignored
  dist/                      # самостоятельная production-сборка; gitignored
```

## Непрерывная scroll-сцена

Сохранены одна сцена `4400svh`, один нативный sticky-stage и исходная схема наложения. Новых pin-spacer, transform-контейнеров или фоновых fullscreen-секций нет. Прозрачный checker находится над тем же градиентом, который возвращается за текстом безопасности.

Последовательность: **hero → белая шторка → рулетка → раскрытие оранжевого фона/чип → строка преимуществ → шесть преимуществ → серый блок «eSIM — это…» → четыре тезиса → безопасность → возвращение оранжевого фона → checker**.

React wheel-handler, spring scroll и собственные RAF-циклы не перенесены. Один GSAP timeline анимирует числовые каналы, ScrollTrigger привязывает его к нативному scroll. Изолированные render-функции переводят каналы в исходные transform/clip-path/blur/opacity и `video.currentTime`. Они кешируют узлы и сами не запускают циклы. Нормальный scrub — 0,24 с; Reduce Motion — непосредственное следование scroll с упрощённой декоративной геометрией. Профиль инерции Lenis отличается от собственной пружины эталона, поэтому математическое совпадение каждого промежуточного кадра при резком wheel не заявляется.

Основные тайминги в высотах viewport:

| Канал | Начало → конец |
| --- | --- |
| Белая шторка | 0 → 1 |
| Рулетка | 1,28 → 4,35 |
| Раскрытие фона / чип | 4,28 → 6,149 / 4,3868 → 6,0956 |
| Строка преимуществ | 6,95 → 12,45 |
| Шесть преимуществ | 12,45 → 20,45 |
| Два оборота чипа | 6,95 → 22,95 |
| «eSIM — это…» | 20,55 → 26,05 |
| Четыре тезиса | 26,23 → 33,43 |
| Безопасность | 33,68 → 39,68 |
| Возврат градиента | 37,16 → 39,41 |
| Подъём checker | 37,4 → 39,68 |

Последние три канала намеренно перекрываются. Текст безопасности уходит вверх, одновременно checker поднимается снизу; переход не заменён появлением через opacity.

При смене media query сохраняется нативная позиция, ограниченная новой высотой страницы; Lenis синхронизируется с ней после пересчёта ScrollTrigger. При resize/orientation геометрия пересчитывается после короткого debounce, также учитывается загрузка шрифтов. При открытой экранной клавиатуре пересборка на неизменной ширине пропускается; положение формы обновляет visualViewport. `onRefresh` синхронизирует DOM с восстановленным playhead ScrollTrigger, в том числе после перезагрузки на ненулевом scroll.

## Чип и lifecycle

`ChipMedia` / `useChipMedia` изолируют видео от scroll orchestration. Видео не проигрывается циклом: задаётся последняя запрошенная позиция, ожидающий seek завершается через `seeked`. Safari-ветка сохраняет все 150 WebP-кадров и их предварительную загрузку. При ошибке видео также доступен кадровый fallback. В Reduce Motion показан статичный кадр, hero video приостановлен; Lenis выключен.

При unmount и смене media query:

- `gsap.context().revert()` и `matchMedia.revert()` удаляют timeline/ScrollTrigger;
- убираются callback ticker, GSAP media-event callbacks и Lenis scroll listener, вызывается `lenis.destroy()`;
- завершаются отложенные CTA/focus tweens и resize/checker/Snackbar timers;
- удаляются resize/orientation, visualViewport, media-query, video и visibility listeners, отключается IntersectionObserver;
- видео останавливаются и освобождают src; ссылки на предзагруженные кадры очищаются;
- проверки disposed/active предотвращают запуск после позднего dynamic import или `document.fonts.ready`.

Глобальные внутренние служебные механизмы зарегистрированного GSAP-плагина не отключаются принудительно: это могло бы повредить другим сценам будущего приложения. Собственные экземпляры и callbacks компонента удаляются.

## Checker

Скопированы исходные **28 устройств**, **10 популярных моделей**, максимум **5 подсказок**. Нормализация, алиасы/кириллица, Levenshtein, ранжирование и fuzzy matching сохранены в чистых функциях. Результат всегда использует официальное название из базы.

Все четыре заданных русскоязычных примера распознаются. Состояния: пустая форма → autocomplete → загрузка **720 ms** → поддерживается / не поддерживается. Неизвестная модель возвращает форму со Snackbar **10 s**. Escape закрывает подсказки/уведомление; Arrow Up/Down меняют выбранную подсказку; Enter запускает проверку. Reset и очистка сбрасывают запрос, selection, результат, таймеры, загрузку и Snackbar, возвращают фокус в пустой input и популярные модели.

**Унаследованное ограничение поиска:** fuzzy matching может подобрать близкий вариант, отсутствующий в запросе: например, `iPhone 16` → `Apple iPhone 16 Pro`, `Samsung S23 FE` → `Samsung Galaxy S23`. Это зафиксировано тестом и сохранено ради функционального соответствия. Корректность/актуальность самой базы устройств не пересматривалась.

## Accessibility

Исправлено:

- основной текст доступен через семантический `StoryTranscript`, визуальные посимвольные копии скрыты от screen reader;
- используются main/nav/section/heading/form/label/button/link, осмысленные alt и пустые alt для декора;
- combobox/listbox имеет controls, expanded, activedescendant, selected и управление клавиатурой;
- `aria-busy` и отдельный `role=status` объявляют загрузку/ошибку; фокус переходит к заголовку результата и обратно при reset;
- скрытые CTA и ещё не появившийся checker исключены из взаимодействия через inert/tabindex;
- добавлены skip-link, focus-visible, доступная при фокусе кнопка submit, увеличенная область закрытия Snackbar;
- Reduce Motion отключает smooth scroll, blur и большую часть декоративных перемещений, останавливает hero;
- zoom не ограничивается в viewport meta; на mobile input минимум 16 px; в низких окнах checker допускает внутреннюю прокрутку.

Намеренно оставлено:

- фирменный контраст: белый/оранжевый около **3,13:1**, placeholder около **3,23:1**; малый полупрозрачный текст поверх градиента требует отдельного дизайн-решения;
- исходная композиция с фиксированными размерами не гарантирует полного reflow при большом browser/text zoom; стандартный viewport сохранён, соответствие WCAG на 200–400% не заявляется;
- пункты навигации, регион, вход/меню и основной CTA результата не имеют бизнес-действий в эталоне: показаны настоящими disabled buttons. Главные CTA лендинга ведут к checker. Реальные маршруты/оформление подключения требуют отдельной интеграции;
- hero остаётся декоративным autoplay в обычном режиме. Reduce Motion его останавливает; отдельная видимая кнопка pause потребует согласованного изменения интерфейса.

## Проверки

Проверено локально во встроенном Chromium-браузере:

- Vue production build проходит; React production build проходит; `git diff` исходного React-проекта пуст, в статусе только новая папка `vue/`.
- Все **10 Node-тестов** проходят: четыре заданных алиаса, опечатки, неподдерживаемое/неизвестное устройство, база/популярные/лимит подсказок, спорный fuzzy-подбор и SSR.
- Полный App импортируется и рендерится через Vue server renderer без `window` / `document`; браузерные библиотеки загружаются внутри onMounted.
- Сравнены desktop **1440×720** и mobile **390×844**: hero, roulette (desktop), преимущества, определение (desktop), safety→checker, подъём и итоговый checker. Сохранены парные скриншоты в `.qa/`.
- В 10 контрольных замерах границ элементов максимальная разница React/Vue — **0,01 px**. Это проверка выбранной геометрии, а не попиксельное доказательство всех состояний: hero video имеет независимую фазу, декодирование seek также может различаться.
- Проверены autocomplete, Arrow Up/Down/Enter/Escape, success/unsupported/unknown, loader, Snackbar, reset/clear и фокус.
- Проверены refresh на ненулевой позиции, смена viewport 390×844 → 844×390 с сохранением позиции, переключение Reduce Motion в конце сцены и повторный mount/unmount. После unmount у сцены нет ScrollTrigger, активных анимаций или Lenis.
- Проверена нативная обратная прокрутка mobile и внутренний scroll checker в **844×390**.
- Safari-ветка проверена **имитацией UA**, coarse pointer — **имитацией matchMedia**, экранная клавиатура — **имитацией visualViewport**: запрашиваются 150 кадров, показаны первый/последний, поле и подсказки остаются выше смоделированной клавиатуры 280 px.
- **axe-core 4.11.0** запущен локально, без добавления в production dependencies. На hero найден `color-contrast`; в стабильном раскрытом combobox подтверждённых нарушений не найдено. Есть проверки `incomplete`, включая контраст. Это не полная сертификация WCAG и не замена VoiceOver/ручному аудиту.

Локальные артефакты: `.qa/geometry-summary.json`, парные PNG, `.qa/axe-combobox.json`, `.qa/lifecycle-unmounted.json`, `.qa/lifecycle-desktop-unmounted.json`, `.qa/resize-reduced.json`, `.qa/mobile-keyboard-simulated.png`. В git и production build они не входят.

### Повторение браузерных проверок

При запущенном dev server откройте `/tests/browser.html`. Кнопки позволяют mount/unmount, refresh, переключение Reduce Motion и имитацию клавиатуры. `?safari&touch` включает Safari-ветку и coarse pointer; `?reduce` включает Reduce Motion при старте. Стенд намеренно содержит browser API на уровне entry: он не импортируется приложением или SSR.

Для повторного axe-аудита распакуйте официальный `axe-core@4.11.0` в `.qa/axe`, чтобы там находился `axe.min.js`, затем нажмите «Проверить axe». Сама библиотека и её LICENSE уже сохранены в локальной `.qa/` этой рабочей копии.

## Safari/iOS и будущий Nuxt 4

**Реальный WebKit/Safari и физический iPhone в этой сессии не проверялись.** Перед выпуском нужны проверки autoplay/alpha MOV, затрат памяти 150 кадров, инерции touch, динамических панелей Safari, реальной клавиатуры, pinch zoom, VoiceOver и поворота устройства. Имитация UA подтверждает выбор ветки кода, но не возможности декодера и поведение iOS.

Для Nuxt:

1. Перенести компоненты/composables/data и public assets, подключить общие стили в конфигурации; SSR-разметку оставлять доступной. Анимационные импорты уже находятся в onMounted.
2. Заменить `asset()` на resolver с учётом Nuxt app.baseURL / CDN и согласовать пути font-face. Сейчас база — Vite `BASE_URL`.
3. Согласовать единственного владельца Lenis/ticker, если smooth scrolling станет общим для всех маршрутов. Не создавать несколько экземпляров на document.
4. Учитывать scroll restoration роутера, page transitions, обновление шрифтов/размеров и момент ScrollTrigger.refresh после завершения перехода.
5. Если применится KeepAlive, добавить управление deactivated/activated: текущая очистка рассчитана на unmount.
6. Изолировать глобальные reference CSS при встраивании в общий сайт. Проверить id и SSR hydration в конечном layout, а также перенести SEO/meta в Nuxt useHead.
7. Оставить кадровый fallback изолированным; его memory/network оптимизация — отдельная работа после измерений на iOS.

## Публикация на Vercel

Vue публикуется отдельным проектом `esim-landing-vue` из того же GitHub-репозитория. Root Directory в настройках Vercel — `vue` (папка `/vue` относительно корня репозитория), Framework Preset — Vite, production branch — `main`. Команды `npm ci` / `npm run build` и каталог результата `dist` зафиксированы в `vue/vercel.json`.

Существующий React-проект `esim-landing`, его root-настройки и `.github/workflows/deploy-pages.yml` не изменяются. Push в main запускает прежний GitHub Pages workflow по его существующим правилам; он продолжает собирать React из корня. Не запускайте `vercel link` в корне репозитория для Vue: корневая `.vercel/project.json` относится к React.
