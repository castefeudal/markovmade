# Проверка выпуска MARKOVMADE — 2026-10-04

Проверенный код: `23e9f6952d686d1fcf2fae16d67cb6fa2bf5611a`. [Production](https://castefeudal.github.io/markovmade/). [CI ветки](https://github.com/castefeudal/markovmade/actions/runs/37214521559) и [повторный CI main](https://github.com/castefeudal/markovmade/actions/runs/37215094868) полностью прошли. GitHub Pages опубликовал этот код; последующий коммит отчётов не меняет исполняемые файлы сайта.

## Повторный аудит репозитория и Production — 2026-10-05

Повторно проверен `main` (`4d8cd620e9deeefe9dc3a80b51328268612160f0`), включая уже опубликованные байты. `npm run build` воспроизводит HTML 180819 B, critical CSS 40579 B и full CSS 288321 B без diff. `npm run test:ci` прошёл полностью: 21 тест, E2E, axe, visual/contracts в Chromium/Firefox/WebKit и 24 потоковых first-paint сценария. Повторные production smoke-прогоны RU/EN × три темы подтвердили совпадение HTML/CSS/fonts/media/fragments с текущей сборкой, рабочий LAB и отсутствие runtime errors или горизонтального overflow. `npm audit` сообщает 0 уязвимостей.

Свежая одна холодная Lighthouse-выборка каждого из 12 production-сценариев сохранена в [JSON-отчёте](lighthouse-production-audit-2026-10-05.json). Performance desktop — 100 во всех сценах; mobile: RU Aurum Noir 99, Event Horizon 100, Clarity 100; EN Aurum Noir 98, Event Horizon 99, Clarity 100. Accessibility, Best Practices и SEO — 100 во всех 12 измерениях, CLS — 0. Mobile LCP составил 1,326–1,749 ms при TBT 0–53 ms. Это подтверждающий срез из одного запуска, а не три повтора.

Во всех сценах единственный Lighthouse audit с предполагаемой экономией времени указывает на кеширование: GitHub Pages отдаёт `Cache-Control: max-age=600`, примерно 48–89 KiB и расчётную экономию LCP 150–400 ms на mobile. Это настраивается хостингом, не проектным репозиторием; клиентская имитация заголовка не исправила бы сетевое поведение. Повторяемые 100/100 на production поэтому остаются открытой целью. CSS debt также остаётся: в поддерживаемых таблицах стилей 1573 `!important`; массовое удаление без покомпонентной проверки каскада небезопасно и не было замаскировано как завершённая миграция.

Буквальные повторяемые 100/100 во всех категориях на публичном сайте **не достигнуты**. Ниже сохранены реальные результаты, включая неудачные измерения. Прохождение регрессионного порога CI не выдаётся за выполнение этого критерия DoD.

## Изменения продукта

- Пересобраны hero, navigation, CTA и визуальная иерархия Aurum Noir, Event Horizon и Clarity. Крупный персонаж не пересекает основной текст. Один rAF управляет сглаживанием направления/смещения, уход курсора возвращает neutral; touch/reduced-motion/Save-Data используют статический portrait.
- KlingAI исключён из исходных пикселей до кодирования: 960×720 → 960×648. Video, canvas и AVIF/WebP posters используют один crop. Все пять media-ассетов закреплены SHA-256 в `tests/hero-crop.json`. Crop и композиция проверяются независимо от визуальных эталонов, без overlay-маски.
- Clarity CTA имеют явные semantic foreground/background, наследование цвета текста/иконок и проверенные default/hover/focus/active/disabled. Исправлены внутренние переполнения LAB/OS, focus/menu/dialog navigation и accessible names.
- LAB/OS fragments, полный CSS, полный перевод и below-fold runtime загружаются по intent; ошибки загрузки дают работающий retry. Модели `lab-models.js` сохранены. История, daily check-in, localStorage, миграция тем, import/export и backup проверяются E2E.
- Удалён `legacy.css` (7976 строк); правила распределены по владельцам компонентов. В старом legacy было 2641 `!important`, в поддерживаемом CSS сейчас 1573. Оставшиеся объявления — совместимость содержательных секций/LAB/OS, а не объявление завершённой миграции на 100%. 22 старых исполняемых inline guards заменены модулями; небольшой theme/language bootstrap остаётся на critical path.
- Убраны неподтверждённые отзывы и обещания гарантированного результата. Оставлены ограничения моделей и методология; Personal OS обозначен прототипом.

## Первый экран и медленная доставка

Сборка: HTML 180819 B, critical CSS 40579 B, полный minified CSS 288321 B. Исходный HTML был 340624 B. Manrope 4.504 объединён в один variable subset 31516 B; outlines/advances прежних глифов сверены на весах 400/500/800. Лицензия приложена. RU display normal/italic — 22252/22612 B; ASCII, Cyrillic, пунктуация и необходимые символы сохранены, EN использует отдельные Latin faces.

Production выявил реальный CLS при частично полученном HTML: центрированный hero перемещался по мере разбора текста. Исправление показывает завершённый hero/header после critical перевода, а picture загружается сразу. Удалён мешавший visibility guard. Manrope `font-display: optional` сохраняет читаемый метрический fallback, когда шрифт приходит поздно, без повторных переносов текста. Готовая композиция не менялась.

`test:paint`: 24 сочетания RU/EN × три темы × 320/768/1350/2560 px, HTML доставляется двумя чанками с паузой 700 ms, fonts задерживаются на 1200 ms. Требование CLS <0,01 выполняется на Windows и Linux; Windows результаты 0–0,00005. Все шесть финальных production Lighthouse-прогонов имеют CLS 0.

## Проверки

- `npm test`: 21 unit/source/model тест, включая численные fixtures и sealed crop.
- E2E: QUICK/PRO, семь инструментов LAB, Insights, история 12 записей, daily check-in 14 записей, валидный/повреждённый импорт и восстановление backup, темы/языки и responsive.
- Axe: RU/EN × три темы × 320/390/768/1440, семь LAB и пять OS панелей, диалоги; WCAG 2/2.1/2.2 AA, heading-order, label-content-name-mismatch. Нарушений не обнаружено. Это автоматизированный аудит, не сертификат WCAG.
- Visual/contracts: Chromium, Firefox, WebKit × RU/EN × три темы × 13 ширин 320–2560. 30 просмотренных hero-эталонов Windows/Linux, прежний лимит 1,5%; дополнительные проверки face bounds, crop, Clarity CTA, keyboard, pointer turn/nod/neutral, touch, live reduced motion, network failure/retry, font/media first paint и каждой панели на внутренний overflow.
- `npm run test:production`: совпадение served bytes для HTML/CSS/fragments/hero module, объединённого шрифта и пяти cropped media; все шесть языковых/тематических сценариев mobile/desktop прошли, runtime errors и overflow не обнаружены.

## Lighthouse на изолированном Linux CI

[Все 36 raw измерений](lighthouse-ci-stable-paint.json), [агрегаты](lighthouse-ci-stable-paint-aggregates.json).

| Сценарии | Performance | A / BP / SEO | CLS |
|---|---|---|---|
| Все шесть desktop | 100 во всех трёх прогонах | 100 / 100 / 100 | 0 |
| Все EN mobile; RU Clarity/Event Horizon mobile | 100 во всех трёх прогонах | 100 / 100 / 100 | 0 |
| RU Aurum Noir mobile | 90 / 99 / 100, медиана 99 | 100 / 100 / 100 | 0 |

34/36 raw измерений имеют четыре оценки 100, 11/12 сцен — повторяемые 100. RU Aurum Noir mobile: LCP 1,806–1,809 s, TBT 384/113/0 ms. Длинные задачи первого trace: 278/135/121/100 ms, отнесены к Other; script/style/render breakdown конкретных задач — 0 ms. Причина variance не доказана. Выявленных Lighthouse diagnostics по render-blocking CSS, font chains, media, accessibility не осталось; открыты временные метрики этого сценария.

CI требует медиану Performance ≥95 и A/BP/SEO 100 в каждом raw прогоне. Все значения ниже 100 остаются в отчётах; это регрессионный порог, не замена цели 100.

## Публичный GitHub Pages: три холодных прогона

[Все шесть измерений](lighthouse-production-stable-paint.json), [агрегаты](lighthouse-production-stable-paint-aggregates.json). Это Windows i7-8750H с активными сторонними приложениями, а не изолированный CPU benchmark.

| Профиль, RU Aurum Noir | P, три прогона | A / BP | SEO, три прогона | CLS |
|---|---|---|---|---|
| Mobile | 94 / 99 / 94 | 100 / 100 | 100 / 100 / 100 | 0 |
| Desktop | 99 / 100 / 100 | 100 / 100 | 100 / 100 / 92 | 0 |

Mobile LCP 1,612–1,766 s, TBT 73–289,5 ms; desktop LCP 0,506–0,814 s, TBT 0. Production quality-floor запуск **не прошёл**: mobile median 94 и один SEO 92. Отдельная повторная проверка SEO дала 100: единственное падение — таймаут fetch корневого `https://castefeudal.github.io/robots.txt`, а не malformed directives. Прямой fetch вернул обычный 404 за 468 ms; отсутствие robots не запрещает crawl. Project repository не управляет корнем другого Pages сайта. [Изолированная SEO-сверка](lighthouse-production-seo-confirmation.json) сохранена отдельно и не заменяет неудачный raw результат.

Доставка Pages отдаёт `Cache-Control: max-age=600` для fonts/assets; проверено HTTP для нового Manrope. Lighthouse cache-insight отмечает около 89 KiB и прогнозирует LCP savings 400–450 ms. Этот header задаёт GitHub Pages; в данном project repository нельзя настроить custom response headers. Он остаётся конкретным hosting blocker. Не добавлены фиктивные meta/cache headers или клиентские обходы аудита.

## Открытые критерии DoD

Повторяемые literal 100 на публичном сайте остаются открыты: вариативный main-thread/cold browser/host, фиксированный cache lifetime Pages и единичный origin robots fetch timeout. Все actionable дефекты страницы, выявленные проверками (включая production CLS), исправлены; hosting/measurement ограничения явно сохранены. Не заявлены общий объективный 100/100 продукта или ручная сертификация accessibility.

## Предыдущие измерения сохранены

[Локальная исходная матрица](lighthouse-local.json), [локальные повторы](lighthouse-local-repeat.json), [первый CI](lighthouse-ci-initial.json), [предыдущая серия 36](lighthouse-ci-three-runs.json), [следующая серия](lighthouse-ci-final.json), [до исправления streaming](lighthouse-ci-release.json), [первый production с CLS](lighthouse-production-initial.json). Ни один неудачный результат не заменён лучшим повтором.
