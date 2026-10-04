(function(){
  'use strict';
  var exact = {
    'Нужен мышечный фундамент':'Muscle foundation needed',
    'Нормальная база':'Normal base',
    'Атлетичная форма':'Athletic form',
    'Фитнес-форма':'Fitness form',
    'Очень сильная мышечная база':'Very strong muscle base',
    'Экстремально высокий уровень мышечной массы':'Extremely high level of muscle mass',
    'Умеренный дефицит, силовые 3–5 раз в неделю, шаги и контроль талии раз в 7 дней.':'Moderate deficit, strength training 3–5 times per week, steps and waist control every 7 days.',
    'Умеренный профицит, прогрессия в базовых движениях и контроль набора жировой массы.':'Moderate surplus, progression in key lifts and control of fat gain.',
    'Рекомпозиция: белок, силовая прогрессия, умеренная активность и стабильный сон.':'Recomposition: protein, strength progression, moderate activity and stable sleep.',
    'Поддержание формы без лишней агрессии: восстановление, силовые и контроль энергии.':'Maintenance without excessive aggression: recovery, strength training and energy control.',
    'Поддержание с точечной коррекцией питания и тренировок по динамике формы.':'Maintenance with precise nutrition and training adjustments based on form dynamics.',
    'Проверить через 10–14 дней: средний вес за неделю, талию, силовые и самочувствие.':'Check after 10–14 days: weekly average weight, waist, strength and well-being.',
    'Главный риск — переоценить мотивацию и недооценить среду. Упростите минимум действия.':'The main risk is overestimating motivation and underestimating environment. Simplify the minimum action.',
    'Главный риск — перестать фиксировать процесс, когда первые результаты уже появились.':'The main risk is stopping process tracking after the first results appear.',
    'Сначала выполните расчёт на сайте MARKOVMADE.':'Run the MARKOVMADE assessment first.',
    'базовая':'basic',
    'расширенная':'advanced',
    'уточнённая':'refined',
    'экспертная':'expert',
    'Мышечная база уже может работать как визуальный актив.':'Your muscle base can already work as a visual asset.',
    'Процент жира позволяет быстро улучшить визуальную форму.':'Your body-fat level allows a fast visual improvement.',
    'Главная сильная сторона — понятная точка А, от которой можно строить систему.':'The main strength is a clear starting point to build the system from.',
    'Жировая масса забирает визуальную плотность и может маскировать мышечный потенциал.':'Body fat reduces visual density and may hide muscular potential.',
    'Недостаточно сухой массы: нужен силовой фундамент.':'Lean mass is insufficient: a strength foundation is needed.',
    'Основной риск — неправильно выбрать скорость цели и потерять восстановление.':'The main risk is choosing the wrong goal pace and compromising recovery.',
    'Предупреждение: дефицит выглядит агрессивным. Следите за сном, силовыми, либидо, настроением и восстановлением.':'Warning: the deficit looks aggressive. Monitor sleep, strength, libido, mood, and recovery.',
    'Предупреждение: целевые калории близко к базовому обмену. Такой режим лучше не держать долго без контроля.':'Warning: target calories are close to basal metabolism. Do not maintain this setup for long without monitoring.',
    'Ресурсное состояние':'Resourced state',
    'Адаптационный стресс':'Adaptation stress',
    'Высокий риск перегруза':'High overload risk',
    'Можно тренироваться по плану. Лучший день для прогрессии и сложных задач.':'You can train as planned. This is a good day for progression and demanding work.',
    'Кардио можно оставить в умеренном объёме.':'Cardio can stay at a moderate volume.',
    'Сохранить режим сна и не ломать восстановление поздними стимулами.':'Keep your sleep schedule and avoid late stimuli that disrupt recovery.',
    'Держать белок, воду, электролиты и стабильные приёмы пищи.':'Keep protein, water, electrolytes, and regular meals stable.',
    'Тренироваться можно, но без геройства: снизить отказные подходы и следить за техникой.':'You can train, but without heroics: reduce failure sets and monitor technique.',
    'Кардио оставить лёгким или умеренным. Не превращать его во вторую тренировку.':'Keep cardio light or moderate. Do not turn it into a second workout.',
    'Приоритет — сон и снижение вечерней стимуляции.':'Prioritize sleep and reduce evening stimulation.',
    'Не ужесточать дефицит. Углеводы лучше ставить вокруг тренировки.':'Do not deepen the deficit. Place more carbohydrates around training.',
    'Зона внимания: ресурс уже тратится быстрее, чем восстанавливается.':'Attention zone: resources are being spent faster than they recover.',
    'Лучше сделать лёгкую тренировку, технику, мобилити или день восстановления.':'Choose a light workout, technique work, mobility, or a recovery day.',
    'Только лёгкое кардио/ходьба. Интервалы и добивание лучше убрать.':'Only light cardio or walking. Remove intervals and finishers.',
    'Главная задача — 1–2 ночи качественного сна без позднего кофеина и лишнего экрана.':'The main task is 1–2 nights of quality sleep without late caffeine or unnecessary screen time.',
    'Не резать калории сильнее. Добавить нормальный приём пищи, воду и соль по самочувствию.':'Do not cut calories further. Add a proper meal, water, and salt according to how you feel.',
    'Если такое состояние держится долго, появляются боль, панические симптомы, бессонница или резкое ухудшение самочувствия — нужен профильный специалист.':'If this state persists, or pain, panic symptoms, insomnia, or a sharp decline in well-being appear, consult an appropriate specialist.',
    'Стартовая сумма':'Starting amount',
    'Пополнение в месяц':'Monthly contribution',
    'Срок, лет':'Term, years',
    'Капитал':'Capital',
    'Деньги растут не только от суммы, а от регулярности, качества решений и горизонта.':'Money grows not only from the amount, but from consistency, decision quality, and time horizon.',
    'Фиксировать пополнение, не ломать систему в плохие месяцы и пересматривать план раз в 30 дней.':'Keep contributions fixed, do not break the system in bad months, and review the plan every 30 days.',
    'Текущий оборот / база':'Current revenue / base',
    'Прирост в месяц':'Monthly growth',
    'Срок, месяцев':'Term, months',
    'Масштаб':'Scale',
    'Бизнес растёт через повторяемую систему действий, а не через разовые рывки.':'Business grows through a repeatable system of actions, not isolated bursts.',
    'Выделить один главный канал роста, закрепить недельный ритм и отслеживать конверсию.':'Choose one primary growth channel, establish a weekly rhythm, and track conversion.',
    'Текущая аудитория':'Current audience',
    'Публикаций / действий в месяц':'Posts / actions per month',
    'Аудитория':'Audience',
    'Контент даёт эффект накопления, когда регулярность соединяется с улучшением качества.':'Content compounds when consistency is combined with improving quality.',
    'Держать стабильный выпуск, усиливать упаковку и каждую неделю анализировать удержание внимания.':'Maintain consistent output, improve presentation, and analyze attention retention every week.',
    'Текущий уровень 1–100':'Current level 1–100',
    'Минут практики в день':'Practice minutes per day',
    'Уровень':'Level',
    'Навык растёт через минуты практики, качество повторений и отсутствие длинных провалов.':'A skill grows through practice minutes, repetition quality, and the absence of long gaps.',
    'Практиковать коротко, но ежедневно: 10–30 минут дают больше, чем редкие героические рывки.':'Practice briefly but daily: 10–30 minutes delivers more than rare heroic bursts.',
    'Текущая дисциплина, %':'Current discipline, %',
    'Полезных действий в день':'Useful actions per day',
    'Стабильность':'Stability',
    'Дисциплина — это не насилие над собой, а среда, где правильное действие становится проще.':'Discipline is not self-violence; it is an environment where the right action becomes easier.',
    'Оставить минимум дня, привязать полезное к приятному и убрать лишнее трение.':'Define a daily minimum, pair useful actions with enjoyable ones, and remove unnecessary friction.',
    'Для финансов срок считается в годах.':'For finance, the term is measured in years.',
    'Для этого режима срок считается в месяцах.':'For this mode, the term is measured in months.',
    'Персональный разбор':'Personal assessment',
    'Точка А':'Starting point',
    'Сейчас':'Now',
    '7 дней':'7 days',
    'Мягко':'Gradually',
    'Нужно сначала снять хаос, собрать данные и выбрать рабочую стратегию.':'First, remove the chaos, collect the data, and choose a workable strategy.',
    'Фитнес-наставничество':'Fitness mentoring',
    'Питание / тело':'Nutrition / body',
    'Главная задача — не просто снизить вес, а собрать понятную систему питания, активности и контроля динамики.':'The main task is not simply to lose weight, but to build a clear system for nutrition, activity, and progress tracking.',
    'Тело и рекомпозиция':'Body and recomposition',
    'Силовые / БЖУ':'Strength / macros',
    'Здесь важны силовая прогрессия, белок, восстановление и корректная оценка состава тела.':'Strength progression, protein, recovery, and an accurate body-composition assessment matter here.',
    'Система дисциплины':'Discipline system',
    'Режим / энергия':'Routine / energy',
    'Основной узел — не отсутствие желания, а отсутствие структуры, ритуалов и понятного минимума дня.':'The main issue is not a lack of desire, but a lack of structure, rituals, and a clear daily minimum.',
    'Личный бренд / стратегия':'Personal brand / strategy',
    'Упаковка / рост':'Positioning / growth',
    'Нужно связать личность, продукт, контент и понятный путь заявки без лишнего шума.':'Connect personality, product, content, and a clear inquiry path without unnecessary noise.',
    'Сначала отправьте цель и текущую ситуацию — без обязательства стартовать сразу.':'First send your goal and current situation, without any obligation to start immediately.',
    'Отправьте исходные данные, цель, главное препятствие и желаемый срок результата.':'Send your starting data, goal, main obstacle, and desired result timeframe.',
    'Скрин расчётов, цель, вес/рост, режим, питание, тренировки и что сейчас больше всего мешает.':'Send screenshots of the calculations, your goal, weight/height, routine, nutrition, training, and what is currently holding you back most.',
    'Проверьте базовые поля: возраст, рост и вес обязательны для расчёта.':'Check the basic fields: age, height, and weight are required.',
    'Заполните базовые параметры от 1 до 10.':'Fill in the basic parameters from 1 to 10.',
    'Заполните старт, регулярное действие и срок.':'Fill in the starting value, recurring action, and term.',
    'Работать по плану. Сегодня можно прогрессировать без дополнительного снижения нагрузки.':'Follow the plan. Today you can progress without an additional load reduction.',
    'Сохранить тренировку, но убрать геройство: меньше отказа, больше контроля техники и сна.':'Keep the workout, but remove the heroics: less failure work, more control over technique and sleep.',
    'Снизить нагрузку: восстановительная сессия, ходьба или отдых вместо тяжёлой тренировки.':'Reduce the load: choose a recovery session, walking, or rest instead of heavy training.',
    'заполните талию':'enter your waist',
    'низкий диапазон':'low range',
    'рабочий диапазон':'working range',
    'зона внимания':'attention range',
    'высокий диапазон':'high range',
    '≈ стабильный вес':'≈ stable weight',
    'введите талию — оценю зону риска':'enter waist — I will assess the risk zone',
    'талия в низком диапазоне':'waist is in a low range',
    'талия в рабочем диапазоне':'waist is in a working range',
    'талия требует внимания':'waist needs attention',
    'высокий риск по талии':'high waist-risk zone'
  };
  var parts = [
    ['Жир:', 'Fat:'], ['жир —', 'body fat —'], ['жир ', 'body fat '], ['жировой массы', 'fat mass'], ['жировая масса', 'fat mass'], ['Жировая масса', 'Fat mass'],
    ['Точность модели:', 'Model accuracy:'], ['точность модели:', 'model accuracy:'], ['модель:', 'model:'], ['базовая','basic'], ['расширенная','advanced'], ['уточнённая','refined'], ['экспертная','expert'], ['кг','kg'], ['ккал','kcal'], [' г',' g'],
    ['указан вручную','entered manually'], ['оценка Navy method','Navy method estimate'], ['модельная оценка из-за нехватки данных','model estimate due to insufficient data'],
    ['больше углеводов вокруг тренировки.','more carbs around training.'], ['чуть ниже калории, белок оставить стабильным.','slightly lower calories, keep protein stable.'],
    ['Сохранено введённое значение ','Saved entered value '], [' без коррекции. Источник: ',' without adjustment. Source: '], ['Точный диапазон ошибки без индивидуальной валидации не выводится.','No precise error range is reported without individual validation.'],
    ['белки —','protein —'], ['жиры —','fats —'], ['углеводы —','carbs —'], ['Тренировочный день','Training day'], ['день отдыха','rest day'],
    ['мужчина','male'], ['женщина','female'], ['сухая масса','lean mass'], ['Сухая масса','Lean mass'], ['Результат:','Result:'], ['Мои данные:','My data:'], ['Статус:','Status:'],
    ['Здравствуйте, Павел. Я прошёл расчёт на сайте MARKOVMADE.','Hello, Pavel. I completed the MARKOVMADE assessment.'], ['Хочу получить разбор и понять, какая стратегия мне подойдёт.','I want an audit and to understand which strategy fits me.'],
    ['Baseline формируется','Baseline forming'], ['качественных дней','quality days'], ['Личный baseline','Personal baseline'], ['внесите RHR и HRV в PRO-режиме.','enter RHR and HRV in PRO mode.'], ['Вклад сигналов в индекс самонаблюдения','Signal contributions to the self-monitoring score'], ['Силовой ориентир · e1RM','Strength reference · e1RM'], ['Расчётный максимум для сравнения динамики, а не рекомендация проверять реальный 1ПМ.','Estimated max for tracking progress, not a recommendation to test a true one-rep max.'], ['Упражнение','Exercise'], ['Рабочий вес · кг','Working load · kg'], ['Повторения','Repetitions'], ['Оценить 1ПМ','Estimate 1RM'], ['Введите вес и повторы.','Enter load and reps.'], ['Укажите рабочий вес от 1 до 500 кг и 1–15 повторений.','Enter a working load from 1 to 500 kg and 1–15 repetitions.'], ['Запись стала начальной точкой тренда','This is the starting point for your trend'], ['к предыдущей записи','vs previous entry'], ['уверенность: Умеренная','confidence: Moderate'], ['уверенность: Ограниченная','confidence: Limited'], ['уверенность: Низкая','confidence: Low'], ['уверенность: Высокая','confidence: High'], ['Умеренная','Moderate'], ['При ','At '], ['% жира ориентир ','% body fat, indicative range '], ['если безжировая масса изменится в пределах ±3%.','if lean mass changes within ±3%.'], ['Это сценарная чувствительность, не доверительный интервал и не обещание.','This shows scenario sensitivity, not a confidence interval or promise.']
  ];
  function isEn(){
    try { return document.documentElement.lang === 'en' || window.mmSafeStorage.get('markovmade_lang', 'ru') === 'en'; } catch(e){ return document.documentElement.lang === 'en'; }
  }
  window.__mmDynamicTranslate = function(value){
    var s = String(value == null ? '' : value);
    if (!isEn()) return s;
    if (exact[s]) return exact[s];
    parts.forEach(function(pair){ s = s.split(pair[0]).join(pair[1]); });
    return s;
  };
  function applyVisibleCalcLang(){
    var ids=['body-accuracy','body-confidence-label','body-fatmass','body-ffmi','body-lbm','body-nffmi','body-status','body-strategy','body-strong','body-weak','body-target-weight','body-pace','body-whtr','body-whtr-note','body-decision-explain','format-first-step','format-focus','format-reason','format-send','format-start','format-title','growth-accuracy','growth-add-label','growth-gain','growth-main-label','growth-meaning','growth-multiplier','growth-risk','growth-start-label','growth-strategy','growth-term-hint','growth-total','nutri-bmr','nutri-carbs','nutri-check','nutri-fat-result','nutri-protein','nutri-rest-day','nutri-target','nutri-tdee','nutri-training-day','nutri-warning','nutri-corridor','nutri-weekly-change','nutri-water','nutrition-accuracy','nutrition-confidence-label','rec-cardio-result','rec-nutrition-result','rec-score','rec-sleep-result','rec-status','rec-training','rec-warning','rec-decision','recovery-accuracy','lab-rec-baseline','lab-e1rm-result'];
    ids.push('lab-body-range');
    ids.forEach(function(id){
      var el=document.getElementById(id);
      if(!el) return;
      if(!el.dataset.ruDynamicText) el.dataset.ruDynamicText=el.textContent || '';
      el.textContent = isEn() ? window.__mmDynamicTranslate(el.dataset.ruDynamicText) : el.dataset.ruDynamicText;
    });
    document.querySelectorAll('[data-ru-dynamic-text]').forEach(function(el){
      el.textContent = isEn() ? window.__mmDynamicTranslate(el.dataset.ruDynamicText) : el.dataset.ruDynamicText;
    });
  }
  window.__mmApplyVisibleCalcLang = applyVisibleCalcLang;
  document.addEventListener('click', function(e){
    if(e.target && e.target.closest && e.target.closest('[data-lang-toggle]')) setTimeout(applyVisibleCalcLang, 140);
  }, true);
})();
