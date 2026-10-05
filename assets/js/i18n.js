(function() {
    'use strict';
    var DICT = Object.assign({}, window.mmCriticalCopy || {}, window.mmLocaleCopy || {});
    var ATTR_DICT = {
  "Сценарий распределения макронутриентов": "Macronutrient distribution scenario",
  "Сменить тему: тёмная / светлая": "Switch theme: dark / light",
  "Сменить тему: тёмная или светлая": "Switch theme: dark or light",
  "Сменить тему": "Switch theme",
  "Павел / @telegram / WhatsApp": "Pavel / @telegram / WhatsApp",
  "Сушка, набор, режим, дисциплина, восстановление": "Fat loss, muscle gain, routine, discipline, recovery",
  "Спина, колено, плечо, давление, график, восстановление": "Back, knee, shoulder, blood pressure, schedule, recovery",
  "Что мешает: вес стоит, срывы, боли, хаос в питании, нет режима": "What blocks you: stuck weight, breakdowns, pain, nutrition chaos, no routine",

  "Снижение веса, набор мышц, режим, питание, дисциплина": "Fat loss, muscle gain, routine, nutrition, discipline",
  "Вес стоит, срывы, боли, нет режима, мало энергии": "Stuck weight, breakdowns, pain, no routine, low energy",
  "Что пробовали, сроки, ограничения, травмы, график, что важно учесть": "What you tried, deadlines, limitations, injuries, schedule, what matters",
  'Вы стараетесь — но тело не отвечает так, как должно.': 'You are putting in the work — but your body is not responding the way it should.',
  'не отвечает так, как должно': 'not responding the way it should',
  'Я смотрю на картину целиком: нагрузку, питание, сон, стресс, ограничения и поведение. Так быстрее видно, где теряется форма и какой шаг даст первый ощутимый сдвиг.': 'I look at the whole picture: training load, nutrition, sleep, stress, constraints, and behavior. This makes it faster to see where the physique is getting stuck and which step creates the first real shift.',
  'Не громкие обещания — рабочие опоры.': 'Not loud promises — practical foundations.',
  'рабочие опоры': 'practical foundations',
  'Я не продаю универсальный шаблон. Работа держится на вводных человека, наблюдении, цифрах, обратной связи и корректировках — поэтому движение становится не вспышкой мотивации, а управляемым процессом.': 'I do not sell a universal template. The work is built on a person’s starting details, observation, numbers, feedback, and adjustments — so progress becomes a managed process, not a burst of motivation.',
  'Сценарии результата': 'Result scenarios',
  'Как запрос превращается в понятное движение.': 'How a request becomes clear movement.',
  'понятное движение': 'clear movement',
  'Ниже — типовые кейс-сценарии для сайта: не фейковые отзывы, а честная упаковка ситуаций, с которыми человек обычно приходит на разбор. Когда появятся подтверждённые данные клиентов, этот блок легко заменить на реальные кейсы с цифрами и фото.': 'Below are typical case scenarios for the website: not fake testimonials, but an honest structure for situations people usually bring to a personal assessment. Once verified client data appears, this block can be replaced with real cases, numbers, and photos.',
  'Сценарий 01': 'Scenario 01',
  'Вес стоит, хотя человек старается': 'Weight is stuck despite real effort',
  'Было': 'Before',
  'Тренировки есть, питание скачет, энергии мало, визуальная форма почти не меняется.': 'Training is present, nutrition is inconsistent, energy is low, and the visual shape barely changes.',
  'Делаем': 'What we do',
  'Смотрим калории, БЖУ, шаги, сон, стресс и нагрузку. Убираем лишнее давление и фиксируем главный рычаг.': 'We review calories, macros, steps, sleep, stress, and training load. We remove unnecessary pressure and identify the main lever.',
  'Выход': 'Outcome',
  'Понятный дефицит, контроль талии/фото/самочувствия и первые действия без перегруза.': 'A clear deficit, waist/photo/well-being tracking, and first steps without overload.',
  'Сценарий 02': 'Scenario 02',
  'Старт есть, но режим быстро разваливается': 'The start is there, but the routine breaks quickly',
  'Человек начинает резко, держится несколько дней, потом работа, усталость и срывы возвращают всё назад.': 'The person starts aggressively, lasts a few days, then work, fatigue, and setbacks pull everything back.',
  'Собираем минимальный рабочий ритм: питание, тренировки, восстановление и отчётность под реальный график.': 'We build the minimum working rhythm: nutrition, training, recovery, and reporting around the real schedule.',
  'Не идеальный режим на бумаге, а схема, которую можно удерживать и корректировать по фактам.': 'Not a perfect routine on paper, but a structure that can be maintained and adjusted by facts.',
  'Сценарий 03': 'Scenario 03',
  'Цель есть, но непонятно, какой формат выбрать': 'The goal is clear, but the right format is not',
  'Много идей: похудеть, набрать, наладить питание, вернуть дисциплину — но нет последовательности.': 'Many ideas: lose fat, gain muscle, fix nutrition, restore discipline — but no sequence.',
  'Разбираем стартовую позицию, ограничения, опыт, риски и ближайший шаг, который даст заметный сдвиг.': 'We review the starting position, constraints, experience, risks, and the nearest step that creates a visible shift.',
  'Понятный формат работы: разбор, система, сопровождение или персональный план под текущий ресурс.': 'A clear work format: personal assessment, system, coaching, or a plan matched to the current resources.',
  'Важно: этот блок не выдаёт придуманные результаты за реальные отзывы. Он показывает структуру кейса. Для максимального доверия сюда стоит постепенно добавить подтверждённые клиентские данные: срок, фото, замеры, вес, талию и описание работы.': 'Important: this block does not present invented results as real testimonials. It shows the structure of a case. For maximum trust, gradually add verified client data here: timeframe, photos, measurements, weight, waist, and work description.',
  'Меньше разговоров — больше точных действий.': 'Less talk — more precise action.',
  'точных действий': 'precise action',
  'Первый контакт нужен для ясности: увидеть текущую картину, отделить главное от второстепенного и собрать действия, которые реально помещаются в ваш день.': 'The first contact is for clarity: to see the current picture, separate what matters from what does not, and build actions that actually fit into your day.',
  'Я разбираю картину': 'I review the full picture',
  'цель, график, ограничения, питание и тренировки — чтобы разбор шёл по вашей ситуации, а не по общей фразе «хочу форму».': 'goal, schedule, constraints, nutrition, and training — so the assessment is based on your situation, not a generic “I want to get in shape.”',
  'смотрю тело, восстановление, поведение, риски и слабые места — становится понятно, где теряется результат.': 'I review body, recovery, behavior, risks, and weak points — so it becomes clear where the result is being lost.',
  'первые шаги, точки наблюдения и формат работы — без ставки на идеальные условия.': 'first steps, tracking points, and work format — without relying on ideal conditions.',
  'Если вы уже узнали себя — не ждите идеального понедельника. Оставьте вводные: я быстро увижу картину, выделю главный рычаг и покажу, с чего начать именно сейчас.': 'If you recognize yourself here, do not wait for the perfect Monday. Send your starting details: I will quickly see the picture, identify the main lever, and show where to start right now.',
  'Отметьте цель и главный стопор — я получу контекст, а вы сразу перейдёте от размышлений к первому действию.': 'Select your goal and main blocker — I get the context, and you move from thinking to the first action.',
  'Отметьте пункты выше — и заявка станет конкретной.': 'Select the points above — and your request becomes specific.',
  'Кому подходит': 'Best for',
  'Что получаете': 'You get',
  'IV. Обо мне': 'IV. About me',
  'VI. Команда': 'VI. Team',
  'Вы стараетесь — но тело': 'You are putting in the work — but your body',
  'Не громкие обещания —': 'Not loud promises —',
  'Лёгкий': 'Light',
  'Меньше разговоров — больше': 'Less talk — more',
  'Настройки по фактам': 'Fact-based adjustments',
  'мало энергии': 'low energy',
  'Короткие': 'Quick',
  'ответы': 'answers',
  'перед заявкой.': 'before submitting.'

};
    DICT['Расчёты выполняются в браузере. Отдельные инструменты сохраняют профиль, историю, сценарии и снимки результатов в локальном хранилище браузера на вашем устройстве. Эти данные автоматически не отправляются владельцу сайта.'] = 'Calculations run in your browser. Some tools store your profile, history, scenarios, and result snapshots in this browser on your device. This data is not sent to the site owner automatically.';
    DICT['Чтобы удалить локально сохранённые данные, очистите данные сайта в настройках браузера. Сообщение откроется в выбранном мессенджере только после нажатия вами кнопки; перед отправкой его можно проверить и изменить.'] = 'To remove locally stored data, clear this site’s data in your browser settings. A message opens in your chosen messenger only after you press the button; you can review and edit it before sending.';
    DICT['Ваша текущая модель'] = 'Your current model';
    DICT['Показатели появятся после расчётов. Данные остаются в браузере, оценки уточняются по динамике.'] = 'Your summary appears after you run a calculation. Data stays in your browser; estimates are refined using observed trends.';
    DICT['Только рассчитанные показатели'] = 'Calculated metrics only';
    DICT['Заполните состав тела или питание — сводка соберёт расчётные сигналы в одном месте.'] = 'Complete body composition or nutrition to bring your calculated signals together here.';
    DICT['Следующий шаг'] = 'Next step';
    var META = {
        ru: {
            title: 'MARKOVMADE | Тело и питание под вашу жизнь — Павел Марков',
            description: 'MARKOVMADE Павла Маркова: тело, питание, восстановление и мышление под реальную жизнь. Бесплатный LAB — 24 инструмента с методикой, локальной историей и следующим действием.'
        },
        en: {
            title: 'MARKOVMADE | Pavel Markov — body and nutrition for your life',
            description: 'Pavel Markov’s MARKOVMADE: body, nutrition, recovery and thinking for real life. Free LAB: 24 tools with methods, local history and actionable next steps.'
        }
    };
    window.mmAddTranslations=function(copy){Object.assign(DICT,copy);};
    var currentLang = window.mmSafeStorage.get('markovmade_lang', 'ru') || 'ru';
    var textOriginals = window.mmTextOriginals || new WeakMap();
    var attrOriginals = new WeakMap();
    function normalize(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
    function translateString(s) {
        var raw = String(s);
        var leading = (raw.match(/^\s*/) || [''])[0];
        var trailing = (raw.match(/\s*$/) || [''])[0];
        var core = normalize(raw);
        if (!core) return s;
        if (Object.prototype.hasOwnProperty.call(DICT, core)) return leading + DICT[core] + trailing;
        if (core.length < 8) return leading + core.replace(/(^|[^А-Яа-яA-Za-z])кг(?=$|[^А-Яа-яA-Za-z])/g, '$1kg').replace(/(^|[^А-Яа-яA-Za-z])см(?=$|[^А-Яа-яA-Za-z])/g, '$1cm').replace(/(^|[^А-Яа-яA-Za-z])ккал(?=$|[^А-Яа-яA-Za-z])/g, '$1kcal').replace(/(^|[^А-Яа-яA-Za-z])БЖУ(?=$|[^А-Яа-яA-Za-z])/g, '$1macros').replace(/(^|[^А-Яа-яA-Za-z])ЦНС(?=$|[^А-Яа-яA-Za-z])/g, '$1CNS') + trailing;
        var out = core;
        out = out.replace(/(^|[^А-Яа-яA-Za-z])кг(?=$|[^А-Яа-яA-Za-z])/g, '$1kg').replace(/(^|[^А-Яа-яA-Za-z])см(?=$|[^А-Яа-яA-Za-z])/g, '$1cm').replace(/(^|[^А-Яа-яA-Za-z])ккал(?=$|[^А-Яа-яA-Za-z])/g, '$1kcal').replace(/(^|[^А-Яа-яA-Za-z])БЖУ(?=$|[^А-Яа-яA-Za-z])/g, '$1macros').replace(/(^|[^А-Яа-яA-Za-z])ЦНС(?=$|[^А-Яа-яA-Za-z])/g, '$1CNS');
        return leading + out + trailing;
    }
    function shouldSkipNode(node) {
        var p = node && node.parentElement;
        if (!p) return true;
        if (p.closest('script, style, noscript, code, pre, svg, [data-no-translate], [data-lang-toggle]')) return true;
        return false;
    }
    function walkText(root, cb) {
        var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: function(node) {
                if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
                if (!normalize(node.nodeValue)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        var n;
        while ((n = walker.nextNode())) cb(n);
    }
    function storeAttr(el, attr) {
        var obj = attrOriginals.get(el) || {};
        if (!obj[attr]) obj[attr] = el.getAttribute(attr);
        attrOriginals.set(el, obj);
    }
    function applyAttrs(root, lang) {
        var elements = (root || document).querySelectorAll ? (root || document).querySelectorAll('[placeholder], [title], [aria-label]') : [];
        elements.forEach(function(el) {
            if (el.closest('[data-no-translate], [data-lang-toggle]')) return;
            ['placeholder','title','aria-label'].forEach(function(attr) {
                if (!el.hasAttribute(attr)) return;
                storeAttr(el, attr);
                var original = (attrOriginals.get(el) || {})[attr] || el.getAttribute(attr);
                var key = normalize(original);
                if (lang === 'en') {
                    el.setAttribute(attr, ATTR_DICT[key] || DICT[key] || translateString(original));
                } else {
                    el.setAttribute(attr, original);
                }
            });
        });
    }
    function updateButtons(lang) {
        document.querySelectorAll('[data-lang-toggle]').forEach(function(btn) {
            var flag = btn.querySelector('.lang-switch-flag');
            var label = btn.querySelector('.lang-switch-label');
            if (flag) {
                flag.textContent = '';
                flag.classList.toggle('lang-flag-ru', lang === 'en');
                flag.classList.toggle('lang-flag-en', lang !== 'en');
            }
            if (label) label.textContent = lang === 'en' ? 'RU' : 'EN';
            btn.setAttribute('aria-label', lang === 'en' ? 'RU — Switch to Russian' : 'EN — Switch to English');
            btn.setAttribute('title', lang === 'en' ? 'Switch to Russian' : 'Switch to English');
        });
    }
    function updateMeta(lang) {
        document.documentElement.lang = lang;
        document.title = META[lang].title;
        var desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute('content', META[lang].description);
    }
    var languageRun = 0;
    function translateTree(root, lang, run) {
        var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: function(node) {
                return shouldSkipNode(node) || !normalize(node.nodeValue) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }
        });
        return new Promise(function(resolve) {
        function flush() {
            if (run !== languageRun) { resolve(); return; }
            var count = 0, node;
            while (count < 180 && (node = walker.nextNode())) {
                if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue);
                var original = textOriginals.get(node);
                var translated = lang === 'en' ? translateString(original) : original;
                if (node.nodeValue !== translated) node.nodeValue = translated;
                count++;
            }
            if (count === 180) window.setTimeout(flush, 0);
            else resolve();
        }
        window.setTimeout(flush, 0);
        });
    }
    function applyLanguage(lang) {
        currentLang = lang;
        languageRun++;
        var run = languageRun;
        window.mmSafeStorage.set('markovmade_lang', lang);
        updateMeta(lang);
        updateButtons(lang);
        document.body.classList.toggle('lang-en', lang === 'en');
        document.documentElement.dataset.languageReady = '';
        window.mmLanguageReady = Promise.all(lang==='en'?[document.querySelector('[data-component="lab"][data-hydrated]')&&window.mmLoadLocale('lab'),document.querySelector('[data-component="personal-os"][data-hydrated]')&&window.mmLoadLocale('personal-os')]:[]).then(()=>translateTree(document.body, lang, run)).then(function() {
            if (run !== languageRun) return;
            applyAttrs(document, lang);
            document.documentElement.dataset.languageReady = lang;
        });
        return window.mmLanguageReady;
    }
    window.mmTranslate = async function(root) {
        if(currentLang==='en'){
          if(root.closest?.('#calculators'))await window.mmLoadLocale('lab');
          if(root.closest?.('#app-ecosystem'))await window.mmLoadLocale('personal-os');
        }
        applyAttrs(root, currentLang);
        return translateTree(root, currentLang, languageRun);
    };
    window.mmLanguageReady = Promise.resolve();
    function initBilingual() {
        document.querySelectorAll('[data-lang-toggle]').forEach(function(btn) {
            if (btn.__langReady) return;
            btn.__langReady = true;
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                applyLanguage(currentLang === 'en' ? 'ru' : 'en');
            });
        });
        updateMeta(currentLang);
        updateButtons(currentLang);
        document.body.classList.toggle('lang-en', currentLang === 'en');
        if (currentLang === 'en') applyLanguage('en');
        var observer = new MutationObserver(function(mutations) {
            if (currentLang !== 'en') return;
            mutations.forEach(function(m) {
                m.addedNodes && m.addedNodes.forEach(function(node) {
                    if (node.nodeType === 3 && !shouldSkipNode(node)) {
                        if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue);
                        node.nodeValue = translateString(textOriginals.get(node));
                    } else if (node.nodeType === 1) {
                        translateTree(node, 'en', languageRun);
                        applyAttrs(node, 'en');
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBilingual, { once: true });
    else initBilingual();
})();
