# Проверка выпуска MARKOVMADE

Дата: 2026-10-04. Цель 100/100 по всем категориям остаётся открытой, пока не подтверждены повторяемые Performance 100. Порог CI Performance 95 не заменяет эту цель.

## Реализовано

Крупный hero с независимой композицией Clarity, единым rAF для направления головы и пространственного смещения, возвратом neutral, статическим touch/Save-Data/reduced-motion fallback. Watermark исключён из исходной видимой области до кодирования: 960×720 → 960×648. Хеши всех video/poster вариантов закреплены в tests/hero-crop.json; тесты проверяют каждый drawable и всю матрицу размеров, а не накладывают маску.

legacy.css удалён. Правила распределены по владельцам компонентов. По сравнению с удалённым legacy, число !important в поддерживаемом CSS уменьшилось с 2641 до 1574; это постепенная миграция, оставшиеся правила сохранены для совместимости содержательных разделов. Hero/header/controls не используют !important. 22 исполняемых inline-скрипта старой страницы заменены модулями; только небольшой bootstrap темы/языка входит в critical path.

Ни один калькулятор не переписан: исходные lab-models.js и численные fixtures сохранены. Проверяются localStorage, история, daily check-in, экспорт, отклонение повреждённого импорта и восстановление backup. LAB/OS HTML, полный CSS, перевод и runtime содержательных разделов загружаются по intent. Сборка удаляет устаревшие generated файлы.

## Локальные проверки

- 21 unit/source/model тест.
- E2E: QUICK/PRO, семь инструментов, история/JSON, Insights wizard, миграция тем, 13 размеров. Повторный запуск без обновления эталонов проходит.
- Axe: RU/EN × 3 темы × 4 ширины; 7 LAB/5 OS панелей и два диалога; WCAG 2.2 AA, heading-order, label-content-name-mismatch. Нарушений нет.
- Visual contracts: Chromium/Firefox/WebKit × RU/EN × 3 темы × 13 ширин 320–2560; 30 hero-эталонов с лимитом 1,5%. Дополнительно проверяются все панели на внутреннее переполнение, сохранённые настройки, сетевые ошибки/retry, motion/touch, исходный crop и пять состояний Clarity CTA. Эталоны просмотрены визуально.

## Lighthouse: Windows, локальный сервер

Исходный mobile: Performance 75, Accessibility 99, Best Practices 100, SEO 100; LCP 3,8 s, TBT 400 ms. Новая матрица ниже измерялась последовательно, без одновременной собственной browser/build задачи. Сторонние Telegram, Firefox и браузерные процессы активно использовали CPU i7-8750H во время измерений; результаты Performance не являются изолированным benchmark. Все результаты, включая неудачные, сохранены.

| Сценарий | P / A / BP / SEO | LCP, s | TBT, ms | CLS |
|---|---|---:|---:|---:|
| ru-aurum-noir-mobile | 99 / 100 / 100 / 100 | 2.06 | 41 | 0.0002 |
| ru-aurum-noir-desktop | 99 / 100 / 100 / 100 | 0.51 | 101 | 0.0002 |
| ru-event-horizon-mobile | 91 / 100 / 100 / 100 | 2.29 | 301 | 0.0002 |
| ru-event-horizon-desktop | 100 / 100 / 100 / 100 | 0.49 | 2 | 0.0002 |
| ru-clarity-mobile | 91 / 100 / 100 / 100 | 2.16 | 290 | 0.0000 |
| ru-clarity-desktop | 100 / 100 / 100 / 100 | 0.39 | 0 | 0.0002 |
| en-aurum-noir-mobile | 86 / 100 / 100 / 100 | 2.30 | 395 | 0.0000 |
| en-aurum-noir-desktop | 100 / 100 / 100 / 100 | 0.44 | 0 | 0.0008 |
| en-event-horizon-mobile | 92 / 100 / 100 / 100 | 2.16 | 254 | 0.0000 |
| en-event-horizon-desktop | 100 / 100 / 100 / 100 | 0.50 | 24 | 0.0008 |
| en-clarity-mobile | 93 / 100 / 100 / 100 | 1.98 | 221 | 0.0000 |
| en-clarity-desktop | 100 / 100 / 100 / 100 | 0.38 | 0 | 0.0008 |

Оставшиеся аудиты перечислены в [lighthouse-local.json](lighthouse-local.json). Практический blocker повторяемых 100 — нестабильное CPU-время Style/Layout в совместно используемом окружении и cold-start браузерной инфраструктуры. После добавления ранних preload для реально используемых шрифтов аудит network dependency tree больше не содержит замечаний. Нет сторонних font origins или render-blocking stylesheet на первом экране; ниже цели остаются измеряемые FCP/LCP/TBT. GitHub Actions запускает ту же матрицу отдельно и сохраняет полные отчёты.

## Production

Публикуется проверенный main через GitHub Pages. npm run test:production сравнивает served bytes с локальной сборкой и crop-ассетами, затем проверяет обе локализации/три темы, touch CTA, LAB/OS и отсутствие runtime errors на mobile/desktop. Результат CI и production дописывается после публикации.

Первый Linux CI: [полная матрица](lighthouse-ci-initial.json). Desktop 100 во всех сценах; mobile 99–100 кроме первого прогона Aurum Noir (85, TBT 546 ms; наибольшая задача 463 ms отнесена к Unattributable/Other). Следующий запуск предварительно инициализирует браузер на about:blank с нейтральным системным шрифтом; ни одного ресурса сайта при этом не загружается, site cache остаётся холодным. Локальные повторные замеры сохранены отдельно в [lighthouse-local-repeat.json](lighthouse-local-repeat.json).

Theme change завершает только цветовые CSS transitions, чтобы фон и текст новой палитры появлялись вместе. Аудит ждёт завершения перевода, готовности шрифтов и двух кадров; при нарушении сохраняется диагностический screenshot. Visual contracts дополнительно проверяют контраст сразу после выбора каждой темы.

Третья проверка использует три независимых cold-site прогона на сценарий (36 Lighthouse отчётов для матрицы). Порог Performance 95 применяется к медиане; A/BP/SEO должны быть 100 в каждом прогоне. Это статистическая проверка регрессий, не достижение буквальных повторяемых 100. Первые Linux hero-эталоны требуют просмотра и коммита, без повышения лимита 1,5%. Кириллические display-подмножества включают пробелы/пунктуацию; preload выбирается по языку и теме. Шрифтовые метрики и рисунок букв сохранены.

Linux: [36 cold-site измерений](lighthouse-ci-three-runs.json), [агрегаты](lighthouse-ci-three-runs-aggregates.json). 10 из 12 сценариев имеют 100 во всех категориях во всех трёх прогонах; RU Aurum Noir/Event Horizon mobile имеют Performance 99 и A/BP/SEO 100. Их LCP около 2,0 s; TBT 0–45 ms, CLS 0. Все 30 Linux hero-снимков просмотрены и сохранены отдельными эталонами с прежним лимитом 1,5%. Все structural/keyboard/motion/overflow assertions прошли; capture-job намеренно завершился ошибкой до утверждения эталонов.

Последняя оптимизация объединяет Cyrillic/Latin/punctuation display-глифы RU в два предзагруженных файла и использует локальный метрический fallback: отсутствует поздний запрос другой webfont-семьи. Локальный холодный замер: mobile 99/100/100/100, FCP 1,03 s, LCP 1,95 s, TBT 34 ms, CLS 0; desktop 100/100/100/100. В этом замере больше нет actionable Lighthouse diagnostics, только временные метрики. Итоговая CI-сверка эталонов выполняется отдельно.

Финальный CI [37211842744](https://github.com/castefeudal/markovmade/actions/runs/37211842744) полностью прошёл: unit, E2E, axe, три браузера и строгая сверка утверждённых Linux эталонов. [Все 36 измерений](lighthouse-ci-final.json), [агрегаты](lighthouse-ci-final-aggregates.json): A/BP/SEO 100 в каждом прогоне, все desktop 100; mobile 95–100, медианы 99–100. Холодный RU Aurum Noir #1 имеет TBT 223 ms (прочие RU 0–81 ms), RU dark LCP 1,954–1,960 s, CLS 0. EN Aurum Noir имеет вариативный TBT 77–102 ms; длинная задача отмечена Unattributable/Other. Это конкретный оставшийся blocker literal повторяемых 100, а не скрытый допуск CI.

Выявленный в EN запрос cormorant-normal-cyrillic (97 ms, Lighthouse прогнозирует LCP savings 0) дополнительно исключён из critical CSS: исходные section-only лица остаются в полном stylesheet. Сетевой contract теперь запрещает этот запрос на первом экране в обеих локализациях/трёх темах. Итоговые результаты этого изменения и production будут записаны после проверки.

Проверяемый release a6d6c64: [CI 37212551946](https://github.com/castefeudal/markovmade/actions/runs/37212551946) полностью зелёный. [Все raw измерения](lighthouse-ci-release.json), [медианы](lighthouse-ci-release-aggregates.json). Ни одного замечания network dependency tree: лишний EN-запрос устранён. Все desktop и A/BP/SEO во всех 36 прогонах — 100. Mobile медианы 99–100; 29 из 36 raw прогонов имеют все четыре 100. Исключения: RU dark mobile обычно 99 (LCP 1,956–1,965 s, TBT 0–15 ms), один EN Event Horizon 99. Первый cold RU Aurum Noir — 66, FCP 2,08 s, LCP 2,50 s, TBT 1537,5 ms; этот результат не исключён из отчёта/медианы. Trace показывает 13 длинных задач Other, включая 690 ms на tiny os-loader с 0 ms script/style в breakdown конкретной задачи; общий main-thread 4,3 s. Отнесение к cold браузерной/host нестабильности — интерпретация сравнительных повторов, а не доказанный дефект/отсутствие дефекта сайта. Требование literal повторяемых 100 остаётся открытым.

GitHub Pages build a6d6c646d47fb9ea4fec1f5226c0b9efff7a1107 завершён, публичный URL https://castefeudal.github.io/markovmade/. Production smoke прошёл для RU/EN × всех тем × mobile/desktop: served bytes совпали с локальной сборкой для index, stylesheet, LAB/OS fragments, hero module и пяти утверждённых crop-ассетов; CTA открывает LAB, модули загружаются, runtime errors/overflow не обнаружены.

Production Lighthouse выявил actionable CLS, отсутствовавший на быстром local-server: [первые шесть raw измерений](lighthouse-production-initial.json), desktop CLS 0,389 (Performance 77–82). Это не списано на variance: контролируемый streaming воспроизвёл смещение центрированного контейнера при частичном HTML; отложенные отдельно Latin/Cyrillic шрифты давали временный дополнительный перенос на 320 px. Hero/header теперь показываются после разбора полного hero и critical перевода, portrait paints сразу; удалён мешавший visibility:visible !important guard. Manrope 4.504 объединён в один subset 31516 B (все прежние widths/outlines проверены на 400/500/800), optional display исключает поздние изменения переносов при плохой сети. Геометрия готовой композиции сохранена. Новый test:paint проходит 24 сценария с HTML pause 700 ms/fonts delay 1200 ms: CLS 0–0,00005. Выпуск повторно проверяется перед обновлением Pages.
