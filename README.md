# MARKOVMADE

Статический RU/EN продукт Павла Маркова: MARKOVMADE LAB, Personal OS, локальная история и явный импорт/экспорт. Production: [GitHub Pages](https://castefeudal.github.io/markovmade/).

## Разработка

```sh
npm ci
npx playwright install chromium firefox webkit
npm run build
npm run serve
```

Нужен Node.js 22+. Открывайте HTTP-адрес, который печатает сервер: фрагменты LAB/OS загружаются через fetch, поэтому file:// не поддерживается.

`src/index.html` — оболочка; `src/components/*.html` — build-time разделы. `scripts/source-components.cjs` собирает их до выделения critical CSS и ленивых LAB/OS-фрагментов. `index.html` и `assets/dist/` — воспроизводимый статический результат сборки, который необходимо коммитить для Pages. Сборка использует Chromium для отбора critical CSS, Lightning CSS и esbuild для минификации. Серверная часть production не требуется.

## Владение компонентами

- `assets/css/tokens.css`: семантические палитры Aurum Noir, Event Horizon, Clarity.
- `hero.css`, `header.css`, `controls.css`: композиция первого экрана, навигация и CTA.
- `editorial.css`, `lab.css`, `personal-os.css`: соответствующие разделы.
- `foundation.css`: базовые утилиты. `author.css` владеет trust, услугами, биографией, сообществом и контактом; `toolkit.css` — каталогом и общим evidence-компонентом. Явный порядок `base → priority → components` сохраняет прежние контракты и отдаёт новым владельцам управление. Исполняемых `!important` нет.
- `assets/js/navigation.js`: якоря, mobile focus trap, меню, progress и floating controls.
- `hero-loader.js` / `hero-media.js`: статический fallback и единый rAF-контроллер кадров/пространственного смещения.
- `style-loader.js`: полноэкранная оболочка получает critical CSS сразу; остальные стили входят при намерении прокрутки/взаимодействия.
- `content-loader.js`: контактная форма и взаимодействия содержательных разделов входят при прокрутке или keyboard intent.
- `lab-loader.js` / `os-loader.js`: отложенная загрузка HTML и runtime соответствующих компонентов.
- `lab-models.js`: прежние чистые модели; `toolkit-models.js`: 17 новых моделей. `lab-runtime.js` собирается из `lab-domains/` по направлениям; `lab-toolkit.js` владеет каталогом из 24 задач, сводкой и evidence disclosure; `lab-history.js` — историей, JSON и связью с Personal OS.
- `language-loader.js` / `i18n.js`: первый экран EN получает небольшой словарь из сборки; полный перевод входит при переключении или прокрутке. `src/locales/shared.en.json`, `lab.en.json` и `personal-os.en.json` разделены по namespace. LAB/OS-словари входят только при загрузке соответствующего раздела на EN. Исходные RU-узлы сохраняются для точного обратного переключения.

Старые значения тем мигрируют в три поддерживаемые темы. Предпросмотр темы не сохраняется до явного выбора. Язык, расчёты и история сохраняются на устройстве; очистка и экспорт требуют действия пользователя.

## Hero и медиа

Публикуемый `hero-portrait.mp4` имеет размер 960×648: нижние 72 пикселя исходника исключены перед кодированием. Все poster/canvas/video используют эту область, а не накладную маску. AVIF/WebP постеры имеют тот же crop. Touch, Save-Data и reduced motion не выделяют декодер/банк кадров. Desktop использует один rAF с интерполяцией направления и пространственного смещения; pointer leave возвращает neutral.

`tests/hero-crop.json` фиксирует область исключения и SHA-256 всех публикуемых hero-ассетов. Замена медиа требует повторной проверки всех поз и обновления manifest/baselines. Размеры изображений — в `assets/media/image-manifest.json`. `scripts/optimize-fonts.py` требует fonttools/brotli; обычная сборка использует уже сохранённые WOFF2, с сохранёнными copyright/license records.

## Проверки

```sh
npm test
npm run test:e2e
npm run test:a11y
npm run test:visual
npm run test:paint
npm run test:lighthouse
npm run test:production
```

E2E проверяет реальные модели, QUICK/PRO, историю, импорт/экспорт, Insights и responsive. Axe проверяет RU/EN × три темы × четыре ширины, семь прежних панелей LAB, 17 новых форм с результатами, пять вкладок OS и диалоги; дополнительно включены heading-order и label-content-name-mismatch. Для аудита вне viewport content-visibility временно отключается только в тесте.

Visual contracts проверяют Chromium/Firefox/WebKit, RU/EN, три темы и 13 ширин 320–2560; 30 строгих hero-baselines имеют лимит 1,5%. Отдельно проверяются crop, отсутствие пересечения лица с текстом, Clarity CTA default/hover/focus/active/disabled, touch, live reduced motion и pointer turn/nod/neutral. Проверяются также все панели LAB/OS на внутреннее переполнение, первый экран с сохранёнными настройками, ошибки сети и повторная загрузка. Скриншоты и JSON-отчёты находятся в игнорируемой `test-results/`.

Строгие hero-baselines разделены для Windows и Linux (`tests/visual-baselines/linux`), поскольку растеризация шрифтов различается. При отсутствии Linux-эталонов CI сохраняет полный набор снимков и завершается ошибкой до их визуального просмотра и коммита.

Обновление baseline допустимо только после визуального просмотра:

```powershell
$env:UPDATE_VISUAL_BASELINES='1'
npm run test:e2e
npm run test:visual
Remove-Item Env:UPDATE_VISUAL_BASELINES
```

Lighthouse запускается последовательно, без параллельных browser/build задач. `LIGHTHOUSE_MATRIX=1` проверяет RU/EN × три темы × mobile/desktop; `LIGHTHOUSE_RUNS=3` (по умолчанию) повторяет cold-site измерения, `BASE_URL` позволяет проверить production. `summary.json` явно перечисляет результаты ниже цели 100/100 и оставшиеся аудиты. CI требует медиану Performance ≥95 для каждого сценария и остальные категории 100 в каждом прогоне; все выбросы сохраняются, `aggregates.json` отдельно сообщает, были ли все прогоны 100; это порог обнаружения регрессий, а не объявление достижения цели 100.

29 unit/source тестов и fixtures новых инструментов дополняют прежние проверки. Численные fixtures фиксируют Mifflin–St Jeor, Navy, FFMI, TDEE, TEF, гликогеновый сценарий, тренды, плато, e1RM и baseline восстановления. При изменении моделей обновляйте modelVersion и проверяйте assumptions. Это ориентиры самонаблюдения, без медицинской диагностики и обещаний результата.

## Публикация

`test:paint` доставляет hero двумя HTML-чанками с паузой 700 ms и задерживает шрифты на 1200 ms: RU/EN × три темы × 320/768/1350/2560 px, CLS <0,01. Текст и header показываются после разбора полного hero; picture загружается сразу. Manrope `font-display: optional` сохраняет читаемый метрический fallback при медленном соединении, без поздних переносов строк. Объединённое подмножество содержит исходные глифы Manrope 4.504 ([источник](https://github.com/google/fonts/tree/8f9a401dbb3793e0d1264b15d96aa253f05280f5/ofl/manrope)); ширины и контуры сверены на весах 400/500/800, SIL OFL приложена к ассету.

Pages публикует корень `main`. Перед push нужны сборка, проверки и `git diff --check`. После push проверяйте SHA опубликованной сборки, HTTP и загрузку production-ассетов. Quality workflow сохраняет отчёты браузеров, accessibility и Lighthouse как artifacts.

Подробные результаты и оставшиеся ограничения: [проверка выпуска](docs/release-quality.md). Для production smoke: `npm run test:production`.

## Модели, данные и выпуск

[Каталог 24 инструментов и границы моделей](docs/toolkit-models.md). Поиск и шесть тематических фильтров помогают выбрать задачу; на старте видны три основных пути. Новые результаты и профиль включены в общий JSON backup и историю. Читаемая сводка скачивается в TXT. Перед переходом в мессенджер показан сформированный текст; автоматической отправки нет.

`Visual candidates (review only)` — отдельный capture workflow для просмотра Linux-снимков. Capture не утверждает baseline и намеренно возвращает ненулевой код. Обновлять `tests/visual-baselines/linux` можно только после просмотра artifact. Обычный Quality workflow сохраняет строгий visual threshold 1,5% и запускается без capture-флагов.
