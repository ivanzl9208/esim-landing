# Autocomplete и позиционирование результата eSIM

## Причина

Выбор option зависел от отложенного `click`. Обработчик `blur` сразу менял `focused`, закрывал dropdown и перестраивал положение поля. В воспроизведённой цепочке `pointerdown → blur → pointerup` точка отпускания уже попадала в контейнер формы; выбранная модель не передавалась в проверку. Отдельно воспроизведён вариант, когда после touch нет compatibility click.

Это подтверждённая гонка в существующем коде. Точная последовательность событий на iPhone пользователя не записана; аппаратная проверка остаётся необходимой.

## Исправление

- Общий для мыши и touch обработчик сохраняет модель и координаты на `pointerdown`, завершает выбор на `pointerup`. До отпускания или отмены `blur` не закрывает список. `preventDefault` сохраняет фокус и геометрию на нажатии.
- Смещение пальца более 10 px и `pointercancel` отменяют выбор. Последующий compatibility click подавляется. Click без pointer-цепочки, включая assistive activation, остаётся доступен.
- Используется существующий `choose → runCheck`: официальное название сразу подставляется, dropdown закрывается, повторный запуск блокируется на время подготовки/проверки.
- Перед blur запоминается состояние клавиатуры. Ожидание учитывает `visualViewport` и события resize/scroll окна; после восстановления viewport ждёт 180 ms без событий, включая позднюю коррекцию scroll Safari. Максимальное ожидание — 2 s, чтобы не зависнуть при пропущенном событии браузера.
- Затем существующий scroll-контроллер позиционирует страницу по `checker.getBoundingClientRect().top + scrollY`, обнуляет внутренний scroll checker и синхронизирует ScrollTrigger/рендер сцены. Desktop использует Lenis (0,45 s), mobile и reduced motion — мгновенный native scroll. Loading/result начинается после позиционирования.
- Reset не вызывает якорение. Фокус возвращается в поле с `preventScroll`; результат получает фокус заголовка без открытия клавиатуры.
- Исправлена обнаруженная ошибка reduced motion: `getTween()` может возвращать `false`; вызов `progress` теперь проверяет наличие метода.

## Файлы

- `src/components/DeviceChecker.vue`: option pointer/click, blur, busy, связка подготовки результата.
- `src/composables/useDeviceChecker.js`: единый выбор/проверка, управление фокусом, защита от повторного запуска, отмена при dispose/reset.
- `src/utils/suggestionPointer.js`: общий контроллер выбора и отмены жеста.
- `src/composables/useKeyboardViewport.js`, `src/utils/keyboardViewport.js`: ожидание закрытия клавиатуры и очистка подписок/таймеров.
- `src/composables/useScrollScene.js`, `src/App.vue`: передача и выполнение якорения через текущий scroll-контроллер.
- `tests/suggestionPointer.test.js`, `tests/keyboardViewport.test.js`: проверки событий и ожидания viewport.
- `tests/checker-interaction.html`, `tests/checker-interaction.js`: локальный сценарный стенд с настоящими компонентами; не входит в production entry.

Визуальные стили, база поиска, FAQ, header/footer и другие блоки в рамках этого исправления не менялись. В рабочей директории сохранены изменения предыдущего аудита.

## Проверки

| Сценарий | Результат |
| --- | --- |
| Touch pointerdown → фактический blur input → pointerup, без click | Официальная модель, закрытый dropdown, автоматическая проверка |
| Touch-прокрутка / cancel / последующий click | Выбор не запускается |
| Кириллица «Айфон», «Айфон 16 Про» | Официальная Apple iPhone модель |
| Desktop mouse click | Success, checker top=0 |
| ArrowDown/ArrowUp, Enter, Escape, active descendant | Сохранены |
| Популярная Apple Watch Series 11 | Success, checker top=0 |
| Apple iPhone X / iPhone 8 Plus | Unsupported, checker top=0 |
| Поэтапное закрытие имитированной клавиатуры и поздний scroll Safari | Единственная коррекция к checker после стабилизации |
| Очистка после алерта | Пустое поле, фокус в input |
| Reset → повторная проверка | Работает; reset не вызывает программное якорение |
| Desktop Lenis / mobile native scroll | Работают; ScrollTrigger progress=1 на результате |
| Reduced motion | Результат у checker top=0, без Lenis и ошибки getTween |
| Автоматические тесты | 45/45 |
| Production build, git diff --check | Успешно |

Проверки выполнены в Chrome на desktop/mobile viewport и в реальных desktop-движках Safari и Яндекс Браузера. Touch-последовательности синтетические; закрытие экранной клавиатуры имитировано через visualViewport. Реальный iPhone недоступен. iOS Simulator не удалось запустить: локальный Xcode требует принятия лицензии; системные настройки не изменялись.

Логи стенда: `.qa/checker-interaction-2026-09-26/`. Проверено, что CSS production-сборки сохранил прежний hash. Коммит и публикация не выполнялись.
