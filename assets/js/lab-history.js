/* Private LAB snapshots, side-by-side comparison and explicit local backup controls. */
(function () {
  'use strict';
  const LAB_KEY = 'markovmade-lab-v1';
  const HISTORY_KEY = 'markovmade-lab-history-v1';
  const MAX_HISTORY = 50;
  const tools = {
    body:['Состав тела','Body composition'],
    nutrition:['Питание','Nutrition'],
    overfeeding:['Переедание','Overfeeding'],
    recovery:['Восстановление','Recovery'],
    progress:['Прогресс','Progress'],
    strategy:['Стратегия','Strategy']
  };
  const readJson = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
  const writeJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } };
  const lang = () => document.documentElement.lang === 'en' ? 1 : 0;
  const copy = (ru, en) => lang() ? en : ru;
  const formatDate = value => new Intl.DateTimeFormat(lang() ? 'en-GB' : 'ru-RU', {dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
  const resultLabel = (tool, result) => {
    if (!result || typeof result !== 'object') return '—';
    const map = {
      body: result => Number.isFinite(result.bf) ? `${result.bf.toFixed(1)}% · FFMI ${Number(result.ffmi).toFixed(1)}` : '—',
      nutrition: result => Number.isFinite(result.tdee) ? `~${Math.round(result.tdee)} ${copy('ккал','kcal')}` : '—',
      overfeeding: result => Number.isFinite(result.low) ? `${result.low.toFixed(2)}–${result.high.toFixed(2)} kg` : '—',
      recovery: result => Number.isFinite(result.score) ? `${Math.round(result.score)}/100` : '—',
      progress: result => Number.isFinite(result.weekly) ? `${result.weekly >= 0 ? '+' : ''}${result.weekly.toFixed(2)} kg/week` : '—',
      strategy: result => result.main || '—'
    };
    return (map[tool] || (() => '—'))(result);
  };

  function snapshots() {
    const value = readJson(HISTORY_KEY);
    return Array.isArray(value) ? value.filter(item => item && item.id && tools[item.tool] && item.result).slice(0, MAX_HISTORY) : [];
  }

  function record(tool) {
    const app = window.MarkovMadeLab;
    const result = app && app.state && app.state[tool];
    if (!tools[tool] || !result || !result.modelVersion) return;
    const form = document.querySelector(`[data-mm-lab-panel="${tool}"]`);
    const inputs = {};
    if (form) form.querySelectorAll('input:not([type="file"]),select,textarea').forEach(field => {
      if (field.id) inputs[field.id] = field.value;
    });
    const entry = {
      id: (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      tool, at: new Date().toISOString(), modelVersion: result.modelVersion,
      inputs, result: JSON.parse(JSON.stringify(result))
    };
    const next = [entry, ...snapshots()].slice(0, MAX_HISTORY);
    writeJson(HISTORY_KEY, next);
    renderHistory();
  }

  function addCell(row, text, tag) {
    const cell = document.createElement(tag);
    cell.textContent = text;
    row.appendChild(cell);
    return cell;
  }

  function optionLabel(item) {
    return `${tools[item.tool][lang()]} · ${formatDate(item.at)} · ${resultLabel(item.tool,item.result)}`;
  }

  function renderCompare() {
    const output = document.getElementById('mm-lab-history-output');
    const history = snapshots();
    if (!output) return;
    output.replaceChildren();
    const first = history.find(item => item.id === document.getElementById('mm-lab-history-a').value);
    const second = history.find(item => item.id === document.getElementById('mm-lab-history-b').value);
    if (!first || !second) return;
    if (first.tool !== second.tool) {
      output.textContent = copy('Для сравнения выберите два снимка одного расчётного потока.', 'Choose two snapshots from the same model to compare.');
      return;
    }
    if (first.id === second.id) {
      output.textContent = copy('Добавьте второй расчёт этого потока, чтобы сравнить изменения.', 'Run this model again to compare it with a second snapshot.');
      return;
    }
    const fields = {
      body:[['bf','% жира','Body fat','%',1],['fatMass','Жировая масса','Fat mass','kg',1],['lbm','Безжировая масса','Lean mass','kg',1],['ffmi','FFMI','FFMI','',1],['bmi','Индекс массы тела','Body mass index','',1],['whtr','Талия / рост','Waist / height','',2],['targetWeight','Целевой вес · сценарий','Target weight · scenario','kg',1]],
      nutrition:[['tdee','Поддержание','Maintenance','kcal',0],['target','Цель калорий','Calorie target','kcal',0],['pMid','Белок','Protein','g',0],['fatMid','Жиры','Fats','g',0],['carbMid','Углеводы','Carbs','g',0]],
      overfeeding:[['center','Вероятная прибавка жира','Estimated fat gain','kg',2],['scale','Изменение на весах','Scale change','kg',2]],
      recovery:[['score','Ресурс','Readiness','/100',0]],
      progress:[['weekly','Недельный темп','Weekly pace','kg/week',2],['delta','Изменение веса','Weight change','kg',1],['waistDelta','Изменение талии','Waist change','cm',1]],
      strategy:[['main','Главный рычаг','Primary lever','',0]]
    };
    const table = document.createElement('table');
    const head = table.createTHead().insertRow();
    [copy('Показатель','Metric'),new Intl.DateTimeFormat(lang()?'en-GB':'ru-RU',{day:'numeric',month:'short'}).format(new Date(first.at)),new Intl.DateTimeFormat(lang()?'en-GB':'ru-RU',{day:'numeric',month:'short'}).format(new Date(second.at)),'Δ'].forEach(label => addCell(head,label,'th'));
    const body = table.createTBody();
    (fields[first.tool]||[]).forEach(([key,ru,enLabel,unit,precision]) => {
      const a = first.result[key], b = second.result[key];
      if (typeof a === 'number' && typeof b === 'number' && (!Number.isFinite(a) || !Number.isFinite(b))) return;
      if (a === undefined || b === undefined || a === null || b === null) return;
      if (typeof a !== typeof b || !['number','string'].includes(typeof a)) return;
      if (typeof a === 'number' && Math.abs(b-a)<Math.pow(10,-precision)/2) return;
      if (typeof a === 'string' && a===b) return;
      const row = body.insertRow();
      addCell(row,lang()?enLabel:ru,'th');
      const format=value=>typeof value==='number'?`${new Intl.NumberFormat(lang()?'en-GB':'ru-RU',{maximumFractionDigits:precision,minimumFractionDigits:precision}).format(value)}${unit?' '+unit:''}`:String(value);
      addCell(row,format(a),'td');
      addCell(row,format(b),'td');
      addCell(row,typeof a==='number'?`${b-a>=0?'+':''}${format(b-a)}`:copy('изменилось','changed'),'td');
    });
    if(body.rows.length)output.appendChild(table);
    else output.textContent=copy('Сопоставимые показатели не изменились. Технические поля в сравнении не показываются.','Comparable measures are unchanged. Technical fields are omitted.');
  }

  function renderHistory() {
    const history = snapshots();
    const list = document.getElementById('mm-lab-history-list');
    const selects = ['mm-lab-history-a','mm-lab-history-b'].map(id => document.getElementById(id));
    if (list) {
      list.replaceChildren();
      history.slice(0,12).forEach(item => {
        const row = document.createElement('li');
        row.textContent = optionLabel(item);
        list.appendChild(row);
      });
      if (!history.length) {
        const row = document.createElement('li');
        row.textContent = copy('После первого расчёта здесь появится снимок модели.', 'The first model snapshot will appear here after a calculation.');
        list.appendChild(row);
      }
    }
    selects.forEach((select, index) => {
      if (!select) return;
      const previous = select.value;
      select.replaceChildren();
      history.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = optionLabel(item);
        select.appendChild(option);
      });
      if (history.some(item => item.id === previous)) select.value = previous;
      else if (index === 1 && history.length > 1) select.selectedIndex = 1;
    });
    renderCompare();
  }

  function status(message) {
    const node = document.getElementById('mm-lab-data-status');
    if (node) node.textContent = message;
  }

  function renderPersonalOS() {
    const state = window.MarkovMadeLab && window.MarkovMadeLab.state;
    if (!state) return;
    const n = value => Number.isFinite(value) ? new Intl.NumberFormat(lang() ? 'en-GB' : 'ru-RU', {maximumFractionDigits:1}).format(value) : null;
    const unit = copy('кг','kg');
    const progress = state.progress || {}, nutrition = state.nutrition || {}, recovery = state.recovery || {};
    const profile = state.profile || {};
    const values = {
      calories: Number.isFinite(nutrition.target) ? [`~${n(nutrition.target)} kcal`,copy('рабочая цель','working target')] :
        Number.isFinite(nutrition.tdee) ? [`~${n(nutrition.tdee)} kcal`,copy('поддержание','maintenance')] : ['—',copy('нет расчёта','not calculated')],
      weight: Number.isFinite(profile.weight) ? [`${n(profile.weight)} ${unit}`,progress.source || copy('данные профиля','profile data')] : ['—',copy('нет измерения','no measurement')],
      readiness: Number.isFinite(recovery.score) ? [`${Math.round(recovery.score)}/100`,recovery.status || copy('самооценка','self-report')] : ['—',copy('нет оценки','not scored')],
      trend: Number.isFinite(progress.weekly) ? [`${progress.weekly >= 0 ? '+' : ''}${n(progress.weekly)} ${unit}`,progress.plateau === 'Возможен' ? copy('возможное плато','possible plateau') : copy('среднее за неделю','weekly trend')] : ['—',copy('нужны измерения','measurements needed')]
    };
    Object.entries(values).forEach(([key, parts]) => {
      const main=document.querySelector(`[data-os-model="${key}"]`), note=document.querySelector(`[data-os-model-note="${key}"]`);
      if(main)main.textContent=parts[0]; if(note)note.textContent=parts[1];
    });
    const score=document.querySelector('#mm-os-today-score strong'), scoreBox=document.getElementById('mm-os-today-score');
    if(score)score.textContent=Number.isFinite(recovery.score)?String(Math.round(recovery.score)):'—';
    if(scoreBox)scoreBox.setAttribute('aria-label',Number.isFinite(recovery.score)?copy(`Ресурс ${Math.round(recovery.score)} из 100`,`Readiness ${Math.round(recovery.score)} out of 100`):copy('Ресурс ещё не рассчитан','Readiness has not been calculated'));

    let decision=copy('Сначала соберите исходные данные.','Start by collecting baseline data.');
    let reason=copy('Выполните расчёт в LAB. Здесь появится следующий шаг и сигналы, на которых он основан.','Run a model in LAB. The next step and the signals behind it will appear here.');
    let signal=copy('Данных пока нет','No model data yet');
    let explanation=copy('После расчёта в LAB появится измеримый сигнал, который поддерживает решение дня.','A measurable LAB signal will support the daily decision after a calculation.');
    if(state.strategy && state.strategy.main){
      decision=state.strategy.main; reason=state.strategy.reason || reason; signal=state.strategy.control || signal;
      explanation=copy(`Сверьте результат через ${state.strategy.horizon || 14} дней и меняйте один фактор за раз.`,`Review in ${state.strategy.horizon || 14} days and change one factor at a time.`);
    }else if(Number.isFinite(recovery.score) && recovery.score<55){
      decision=copy('Приоритет — восстановление.','Prioritise recovery.'); reason=recovery.status || reason;
      signal=copy('Снизьте цену нагрузки','Reduce training load'); explanation=copy('Основано на оценке восстановления в LAB.','Based on the recovery assessment in LAB.');
    }else if(progress.plateau==='Возможен'){
      decision=copy('Проверьте сигнал плато.','Review the plateau signal.');
      reason=copy('Сопоставьте соблюдение, средний вес и талию перед небольшой корректировкой.','Check adherence, average weight and waist before making a small adjustment.');
      signal=copy('Тренд почти не меняется','Trend is nearly flat');
      explanation=`${n(progress.weekly)} ${unit} / ${copy('неделю · эвристика, не диагноз','week · heuristic, not diagnosis')}`;
    }else if(Number.isFinite(progress.weekly)){
      decision=copy('Сохраните план до следующей оценки.','Keep the plan until the next review.');
      reason=copy('Читайте вес, талию и соблюдение вместе; один сигнал не требует автоматической коррекции.','Read weight, waist and adherence together; one signal does not call for an automatic change.');
      signal=copy('Недельный тренд','Weekly trend');
      explanation=`${progress.weekly>=0?'+':''}${n(progress.weekly)} ${unit} / ${copy('неделю','week')}`;
    }else if(state.body && Number.isFinite(state.body.ffmi)){
      decision=copy('Уточните следующий шаг в навигаторе стратегии.','Choose a next step in Strategy Navigator.');
      reason=copy('Исходная модель состава тела рассчитана; FFMI сам по себе не определяет цель.','A body-composition baseline is available; FFMI alone does not set a goal.');
      signal=`FFMI ${n(state.body.ffmi)}`;
      explanation=copy('Оценка, не диагноз.','An estimate, not a diagnosis.');
    }
    const set=(id,value)=>{const node=document.getElementById(id);if(node)node.textContent=value;};
    set('mm-os-today-decision',decision); set('mm-os-today-reason',reason); set('mm-os-signal-title',signal); set('mm-os-signal-copy',explanation);
    const actions=state.strategy && Array.isArray(state.strategy.actions)?state.strategy.actions:[
      copy('Рассчитайте состав тела или питание в LAB.','Calculate body composition or nutrition in LAB.'),
      copy('Соберите ежедневный вес для недельного тренда.','Log daily weight to establish a weekly trend.'),
      copy('Повторите оценку ресурса в сопоставимых условиях.','Repeat the recovery check under consistent conditions.')
    ];
    document.querySelectorAll('[data-os-action]').forEach(node=>{node.textContent=actions[Number(node.dataset.osAction)] || copy('Собирайте сопоставимые данные.','Keep collecting consistent data.');});
    document.querySelectorAll('[data-os-action-note]').forEach(node=>{node.textContent=copy('Основание: ваши последние расчёты в LAB.','Based on your latest LAB calculations.');});
  }

  function exportData() {
    const payload = {
      schema:'markovmade-lab-export-v1',
      exportedAt:new Date().toISOString(),
      lab:readJson(LAB_KEY) || {},
      history:snapshots(),
      dailyCheckins:readJson('markovmade-lab-daily-v1') || [],
      favorites:readJson('markovmade-lab-favorites-v1') || []
    };
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `markovmade-lab-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    status(copy('Резервная копия создана на устройстве.', 'Backup downloaded to this device.'));
  }

  async function importData(file) {
    if (!file) return;
    if (file.size > 2_000_000) { status(copy('Файл больше 2 МБ. Выберите корректную резервную копию.', 'File exceeds 2 MB. Choose a valid backup.')); return; }
    try {
      const payload = JSON.parse(await file.text());
      if (!payload || payload.schema !== 'markovmade-lab-export-v1' || !payload.lab || typeof payload.lab !== 'object' || !payload.lab.profile || typeof payload.lab.profile !== 'object') throw new Error('schema');
      const allowed = ['body','nutrition','overfeeding','recovery','progress','strategy'];
      if (allowed.some(key => payload.lab[key] && typeof payload.lab[key] !== 'object')) throw new Error('data');
      const history = Array.isArray(payload.history) ? payload.history.filter(item => item && tools[item.tool] && item.result).slice(0,MAX_HISTORY) : [];
      if (!writeJson(LAB_KEY,payload.lab) || !writeJson(HISTORY_KEY,history)) throw new Error('storage');
      if (Array.isArray(payload.dailyCheckins)) {
        const days=payload.dailyCheckins.filter(item=>item&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)&&['weight','waist','sleep','energy','calories','adherence'].every(key=>item[key]===undefined||Number.isFinite(item[key]))).slice(-180);
        if (!writeJson('markovmade-lab-daily-v1',days)) throw new Error('storage');
      }
      if (Array.isArray(payload.favorites)) {
        const favorites=payload.favorites.filter(key=>tools[key]).slice(0,6);
        if (!writeJson('markovmade-lab-favorites-v1',favorites)) throw new Error('storage');
      }
      status(copy('Данные восстановлены. Обновляю LAB…', 'Data restored. Refreshing LAB…'));
      window.setTimeout(() => window.location.reload(), 450);
    } catch (_) {
      status(copy('Файл не распознан. Используйте JSON-экспорт MARKOVMADE LAB.', 'File not recognized. Use a MARKOVMADE LAB JSON export.'));
    }
  }

  function localize() {
    document.querySelectorAll('[data-copy-ru][data-copy-en]').forEach(node => {
      node.textContent = lang() ? node.dataset.copyEn : node.dataset.copyRu;
    });
  }

  function init() {
    window.mmRefreshPersonalOS = renderPersonalOS;
    const dialog = document.getElementById('mm-lab-history-dialog');
    const trigger = document.querySelector('[data-lab-history-open]');
    const close = document.querySelector('[data-lab-history-close]');
    const file = document.getElementById('mm-lab-import-file');
    if (!dialog || !trigger || !file) return;
    trigger.addEventListener('click', () => { renderHistory(); dialog.showModal(); });
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    ['mm-lab-history-a','mm-lab-history-b'].forEach(id => document.getElementById(id).addEventListener('change', renderCompare));
    document.querySelector('[data-lab-export]').addEventListener('click', exportData);
    document.querySelector('[data-lab-import-trigger]').addEventListener('click', () => file.click());
    file.addEventListener('change', () => importData(file.files && file.files[0]));
    document.addEventListener('click', event => {
      const button = event.target.closest && event.target.closest('[data-calc]');
      if (button) window.setTimeout(() => { record(button.dataset.calc); renderPersonalOS(); }, 0);
    });
    new MutationObserver(localize).observe(document.documentElement, {attributes:true,attributeFilter:['lang']});
    new MutationObserver(renderPersonalOS).observe(document.documentElement, {attributes:true,attributeFilter:['lang']});
    localize();
    renderHistory();
    renderPersonalOS();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
