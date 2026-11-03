# eSIM Landing

Лендинг СберМобайла на Vue 3, Vite и GSAP. Единственное приложение находится в корне репозитория.

## Актуальная версия и публикация

Единственная рабочая и production-ветка — `main`. Прежняя `codex/improvements` объединена с ней; старые состояния доступны только в истории Git.

- Исходники: https://github.com/ivanzl9208/esim-landing
- Production: https://esim-landing-next.layero.app/
- GitHub Pages: https://ivanzl9208.github.io/esim-landing/

Layero автоматически собирает push в `main` и публикует успешную сборку. GitHub Pages обновляется workflow `Deploy to GitHub Pages` из этой же ветки после тестов и сборки. Репозиторий `esim-landing-next` содержит только workflow дополнительного Pages-адреса, а не отдельную копию исходников.

## Структура

- `src/components/` — Vue-компоненты интерфейса.
- `src/composables/` — состояние интерфейса и управление медиа.
- `src/animation/` — геометрия, тайминги и scroll-анимации.
- `src/data/` — тексты, FAQ и база устройств.
- `src/utils/` — поиск, типографика и вспомогательные функции.
- `src/styles/` — общие стили и доступность.
- `public/` — видео, изображения, шрифты и лицензии.
- `tests/` — автоматические проверки и браузерные стенды.
- `docs/` — описание архитектуры.
- `archive/` — материалы, исключённые из приложения.

## Проверка и сборка

Требуется Node.js 20.19+ либо 22.12+. Команды выполняются из корня репозитория:

```sh
npm ci
npm test
npm run build
```

Результат сборки — `dist/`. Зависимости зафиксированы в `package-lock.json`.

Подробнее — [архитектура](docs/architecture.md) и [назначение архива](archive/README.md).
