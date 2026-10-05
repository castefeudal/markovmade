/* LAB task catalogue, common evidence disclosure and connected local summary. */
(function(){
  'use strict';
  const root=document.getElementById('calculators'),app=window.MarkovMadeLab,models=window.MarkovMadeToolkitModels;
  if(!root||!app||!models)return;
  const en=()=>document.documentElement.lang==='en', t=value=>Array.isArray(value)?value[en()?1:0]:String(value), p=(ru,english)=>[ru,english];
  const node=(tag,copy,className)=>{const el=document.createElement(tag);if(copy!==undefined)el.textContent=t(copy);if(className)el.className=className;return el;};
  const categories={all:p('Все задачи','All tasks'),body:p('Тело','Body'),nutrition:p('Питание','Nutrition'),training:p('Тренировки','Training'),recovery:p('Восстановление','Recovery'),progress:p('Прогресс','Progress'),behaviour:p('Мышление / поведение','Thinking / behaviour')};
  const legacy=[
    {id:'body',category:'body',title:p('Состав тела · FFMI · целевой вес','Body composition · FFMI · target weight'),subtitle:p('Жир, LBM, FFMI и normalized FFMI вместе','Fat, LBM, FFMI and normalised FFMI together'),type:'Published equation + scenario',formula:'US Navy / Hodgdon–Beckett; LBM = weight × (1 − BF/100); FFMI = LBM / height²; normalised FFMI = FFMI + 6.3 × (1.8 − height); target weight = LBM / (1 − target BF/100)',limits:p('Не измеряет жир напрямую. Целевой вес предполагает сохранение LBM; диапазон ±3% — выбранный запас, не доверительный интервал.','Does not measure fat directly. Target weight assumes constant LBM; ±3% is a chosen planning margin, not a confidence interval.'),source:models.sources.body},
    {id:'nutrition',category:'nutrition',title:p('Калории и БЖУ · QUICK / PRO / adaptive','Calories and macros · QUICK / PRO / adaptive'),subtitle:p('TDEE, цель и калибровка по 14–28 дням','TDEE, targets and 14–28-day calibration'),type:'Published equations + practical calibration',formula:'Mifflin–St Jeor / ten Haaf; TDEE = RMR × PAL. Adaptive: mean intake − Theil–Sen weight slope × assumed 7000–9000 kcal/kg.',limits:p('Не измеряет расход энергии. Калибровка зависит от полноты учёта, воды и соблюдения; качественный наблюдаемый тренд приоритетнее прогностической формулы.','Does not measure energy expenditure. Calibration depends on logging, water and adherence; high-quality observed data take priority over prediction.'),source:['Mifflin et al. 1990','https://pubmed.ncbi.nlm.nih.gov/2305711/']},
    {id:'overfeeding',category:'nutrition',title:p('Переедание и изменение веса','Overeating and weight change'),subtitle:p('Энергетический сценарий, вода и гликоген','Energy scenario, water and glycogen'),type:'MARKOVMADE practical heuristic',formula:'Energy-equivalent surplus / 7700; separate assumed TEF and glycogen-associated water scenarios.',limits:p('Не предсказывает фактическую прибавку жира. Коэффициенты и запасы гликогена меняются.','Does not predict actual fat gain. Energy factors and glycogen stores vary.'),source:['Hall et al. 2011','https://pubmed.ncbi.nlm.nih.gov/21872751/']},
    {id:'recovery',category:'recovery',title:p('Readiness · HRV / RHR baseline','Readiness · HRV / RHR baseline'),subtitle:p('Личные сигналы и минимум 14 наблюдений','Personal signals and at least 14 observations'),type:'MARKOVMADE practical heuristic',formula:'Self-reported weighted signals; personal RHR/HRV baseline = median of last 14–28 valid paired observations.',limits:p('Не медицинский score, не диагноз и не тест готовности. Значения разных устройств несопоставимы.','Not a medical score, diagnosis or readiness test. Different devices are not interchangeable.'),source:['HRV measurement recommendations','https://pubmed.ncbi.nlm.nih.gov/8838590/']},
    {id:'progress',category:'progress',title:p('Тренд веса · плато · ETA · коррекция','Weight trend · plateau · ETA · adjustment'),subtitle:p('Theil–Sen, средние и проверка выбросов','Theil–Sen, averages and outlier review'),type:'Statistical trend + practical heuristic',formula:'Median pairwise daily slopes; moving average; MAD flags. Plateau/ETA/calorie adjustment use practical thresholds.',limits:p('Тренд не отделяет жир от воды. Выбросы требуют проверки, а ETA — условный линейный сценарий.','The trend cannot separate fat from water. Outliers require review and ETA is a conditional linear scenario.'),source:['Sen 1968','https://doi.org/10.1080/01621459.1968.10480934']},
    {id:'strength',category:'training',title:p('Силовой ориентир · e1RM','Strength reference · e1RM'),subtitle:p('Оценка максимума по весу и повторам','Estimate a maximum from load and repetitions'),type:'Published equations',formula:'Epley: load × (1 + reps/30); Brzycki: load × 36/(37 − reps); average, with reduced confidence at high repetitions.',limits:p('Не измеряет реальный 1ПМ. Техника, RIR и упражнение меняют ошибку; не предложение проверять максимум.','Does not measure actual 1RM. Technique, RIR and exercise affect error; not a recommendation to test a maximum.'),source:['Brzycki 1993','https://doi.org/10.1080/07303084.1993.10606684']},
    {id:'strategy',category:'behaviour',title:p('Главный рычаг на 7–14 дней','One main lever for 7–14 days'),subtitle:p('Приоритет из цели, ограничений и ресурса','Prioritise using goals, constraints and capacity'),type:'MARKOVMADE practical heuristic',formula:'Rule-based prioritisation of goal, blocker, resources and chosen horizon.',limits:p('Не психологическая диагностика. Правило помогает выбрать эксперимент, но не доказывает причину проблемы.','Not psychological diagnosis. A rule helps choose an experiment but does not prove a cause.'),source:null}
  ].map(item=>({...item,version:'1.0.0',review:models.review}));
  const tools=[...legacy,...models.definitions];
  let category='all',selected=null,expanded=false;
  const drafts={};
  const shell=root.querySelector('.mm-lab-shell'),catalogue=node('section',undefined,'mm-toolkit');catalogue.dataset.noTranslate='';catalogue.setAttribute('aria-labelledby','mm-toolkit-title');
  const heading=node('h3',p('Что хотите решить?','What would you like to solve?'));heading.id='mm-toolkit-title';
  const lead=node('p',p('24 инструмента. Начните с задачи; профиль и результаты остаются на этом устройстве.','24 tools. Start with a task; your profile and results stay on this device.'),'mm-toolkit-lead');
  const searchLabel=node('label',p('Поиск по задаче','Search by task'));searchLabel.htmlFor='mm-toolkit-search';
  const search=node('input');search.type='search';search.id='mm-toolkit-search';search.className='mm-lab-input';search.autocomplete='off';
  const filters=node('div',undefined,'mm-toolkit-filters');filters.setAttribute('role','group');
  for(const key of Object.keys(categories)){const button=node('button',categories[key]);button.type='button';button.dataset.category=key;button.setAttribute('aria-pressed',String(key==='all'));button.addEventListener('click',()=>{category=key;renderCards();});filters.append(button);}
  const count=node('p',undefined,'mm-toolkit-count');count.setAttribute('role','status');
  const cards=node('div',undefined,'mm-toolkit-cards'),workspace=node('section',undefined,'mm-toolkit-workspace');workspace.hidden=true;workspace.id='mm-toolkit-workspace';workspace.setAttribute('aria-labelledby','mm-toolkit-active-title');
  const more=node('button',p('Показать все 24 инструмента','Show all 24 tools'),'mm-lab-secondary');more.type='button';more.addEventListener('click',()=>{expanded=!expanded;renderCards();});
  catalogue.append(heading,lead,searchLabel,search,filters,count,cards,more,workspace);shell.prepend(catalogue);
  const summary=node('section',undefined,'mm-toolkit-summary');summary.dataset.noTranslate='';summary.setAttribute('aria-labelledby','mm-toolkit-summary-title');catalogue.after(summary);
  function evidence(definition){
    const details=node('details',undefined,'mm-evidence'),toggle=node('summary',p('Методика и источники','Method and sources'));
    details.append(toggle,node('p',definition.type,'mm-evidence-type'),node('p',definition.formula),node('p',definition.limits));
    const accuracy=node('p',p('Предположения: корректные единицы и сопоставимые наблюдения. Формула описывает оценку, а не индивидуальную валидацию.','Assumptions: correct units and comparable observations. A formula describes an estimate, not individual validation.'));details.append(accuracy);
    if(definition.source){const link=node('a',definition.source[0]);link.href=definition.source[1];link.target='_blank';link.rel='noopener noreferrer';details.append(link);}
    else details.append(node('p',p('Источник правила: MARKOVMADE. Внешняя валидация этого правила не заявлена.','Rule source: MARKOVMADE. External validation is not claimed.')));
    details.append(node('p',`MARKOVMADE ${definition.version} · ${t(p('Проверено','Reviewed'))} ${definition.review}`));return details;
  }
  function outcome(definition,result){
    const out=node('div',undefined,'mm-toolkit-outcome');out.setAttribute('role','status');
    out.append(node('h4',p('Результат','Result')),node('p',result.value,'mm-toolkit-value'),node('h4',p('Что это значит','What it means')),node('p',result.meaning));
    const confidence={high:p('Высокая · для арифметики введённых данных','High · for arithmetic on your inputs'),moderate:p('Умеренная','Moderate'),low:p('Низкая','Low')};
    out.append(node('h4',p('Уверенность','Confidence')),node('p',confidence[result.confidence]||confidence.low),node('h4',p('Главный источник неопределённости','Main uncertainty')),node('p',result.uncertainty),node('h4',p('Следующее действие','Next action')));
    const actions=node('ol');result.actions.forEach(action=>actions.append(node('li',action)));out.append(actions);
    const precision=node('details');precision.append(node('summary',p('Как улучшить точность','How to improve accuracy')),node('p',result.accuracy));out.append(precision,evidence(definition));return out;
  }
  function renderCards(){
    const query=search.value.trim().toLocaleLowerCase();cards.replaceChildren();
    const matches=tools.filter(tool=>(category==='all'||tool.category===category)&&(!query||[...tool.title,...tool.subtitle,tool.id].join(' ').toLocaleLowerCase().includes(query)));
    const shown=category==='all'&&!query&&!expanded?matches.filter(tool=>['body','nutrition','strategy'].includes(tool.id)):matches;
    shown.forEach(tool=>{
      const button=node('button',undefined,'mm-toolkit-card');button.type='button';button.dataset.toolId=tool.id;
      button.append(node('span',categories[tool.category]),node('strong',tool.title),node('span',tool.subtitle));button.setAttribute('aria-controls',models.definitions.includes(tool)?workspace.id:'mm-lab-'+tool.id);button.addEventListener('click',()=>open(tool));cards.append(button);
    });
    count.textContent=t(p(`Показано: ${cards.childElementCount} из ${matches.length}`,`Showing: ${cards.childElementCount} of ${matches.length}`));
    more.hidden=category!=='all'||Boolean(query);more.textContent=t(expanded?p('Свернуть каталог','Collapse catalogue'):p('Показать все 24 инструмента','Show all 24 tools'));more.setAttribute('aria-expanded',String(expanded));
    for(const button of filters.children){button.textContent=t(categories[button.dataset.category]);button.setAttribute('aria-pressed',String(category===button.dataset.category));}
    filters.setAttribute('aria-label',t(p('Категории инструментов','Tool categories')));
  }
  search.addEventListener('input',renderCards);
  function open(tool){
    const activeForm=workspace.querySelector('form');if(selected&&activeForm)drafts[selected]=Object.fromEntries(new FormData(activeForm));
    selected=tool.id;
    if(legacy.includes(tool)){
      workspace.hidden=true;root.querySelector(`[data-mm-lab-tab="${tool.id}"]`).click();
      const panel=document.getElementById('mm-lab-'+tool.id);panel.setAttribute('tabindex','-1');panel.focus({preventScroll:true});panel.scrollIntoView({block:'start',behavior:'auto'});return;
    }
    workspace.hidden=false;workspace.replaceChildren();const title=node('h3',tool.title);title.id='mm-toolkit-active-title';title.tabIndex=-1;
    const form=node('form'),fields=node('div',undefined,'mm-toolkit-fields');form.noValidate=false;
    const previous=app.state.toolkit?.[tool.id]?.inputs||{};
    for(const field of tool.fields){
      const group=node('div',undefined,'mm-lab-field'),label=node('label',field.label),input=node('input');input.id='toolkit-'+tool.id+'-'+field.key;label.htmlFor=input.id;input.name=field.key;input.type=field.type||'number';input.className='mm-lab-input';input.required=true;
      if(input.type==='number'){input.min=field.min;input.max=field.max;input.step='any';input.inputMode='decimal';}
      else if(input.type==='text')input.maxLength=1000;
      const stored=field.profile?app.state.profile[field.profile]:undefined;input.value=drafts[tool.id]?.[field.key]??stored??previous[field.key]??field.value;
      group.append(label,input);fields.append(group);
    }
    const button=node('button',p('Получить результат','Get result'),'mm-lab-primary');button.type='submit';const error=node('p');error.setAttribute('role','alert');
    const output=node('div');output.id='mm-toolkit-result';
    form.append(fields,button,error);workspace.append(title,node('p',tool.subtitle),form,evidence(tool),output);
    if(app.state.toolkit?.[tool.id]?.result)output.append(outcome(tool,app.state.toolkit[tool.id].result));
    form.addEventListener('submit',event=>{
      event.preventDefault();const inputs=Object.fromEntries(new FormData(form));
      try{
        const result=models.calculate(tool.id,inputs);error.textContent='';
        app.state.toolkit=app.state.toolkit||{};app.state.toolkit[tool.id]={inputs,result,at:new Date().toISOString(),modelVersion:tool.version};
        for(const field of tool.fields)if(field.profile)app.state.profile[field.profile]=Number(inputs[field.key]);
        try{localStorage.setItem('markovmade-lab-v1',JSON.stringify(app.state));}catch{error.textContent=t(p('Результат рассчитан, но браузер не сохранил данные.','Calculated, but the browser could not save the data.'));}
        root.querySelectorAll('[data-profile]').forEach(input=>{if(app.state.profile[input.dataset.profile]!=null)input.value=app.state.profile[input.dataset.profile];});
        output.replaceChildren(outcome(tool,result));renderSummary();output.scrollIntoView({block:'nearest',behavior:'auto'});root.dispatchEvent(new CustomEvent('mm:toolkit-result',{detail:{id:tool.id,result}}));
      }catch{error.textContent=t(p('Проверьте значения и единицы. Завершённые действия не могут превышать план; целевой вес штанги должен быть не меньше грифа.','Check values and units. Completed actions cannot exceed the plan; target barbell load must be at least the bar weight.'));}
    });
    title.focus({preventScroll:true});workspace.scrollIntoView({block:'start',behavior:'auto'});
  }
  function renderSummary(){
    summary.replaceChildren();const title=node('h3','MARKOVMADE SUMMARY');title.id='mm-toolkit-summary-title';summary.append(title);
    const complete=legacy.filter(tool=>app.state[tool.id]?.modelVersion),extra=Object.entries(app.state.toolkit||{}).filter(([,value])=>value.result);const total=complete.length+extra.length;
    summary.append(node('p',total?t(p(`Рассчитано задач: ${total}. Это сводка ваших локальных данных.`,`Completed tasks: ${total}. This summary uses your local data.`)):p('Выполните несколько инструментов — здесь появится связанная сводка.','Complete a few tools to see a connected summary.')));
    if(!total)return;
    const metrics=node('dl');
    const entries=[['weight',p('Текущий вес','Current weight'),app.state.profile.weight?`${app.state.profile.weight} kg`:null],['bodyFat',p('Жир · оценка','Body fat · estimate'),app.state.body?.bf?`${app.state.body.bf.toFixed(1)}%`:null],['tdee',p('Maintenance · оценка','Maintenance · estimate'),Number.isFinite(app.state.nutrition?.tdee)?`${Math.round(app.state.nutrition.tdee)} kcal`:null],['trend',p('Недельный тренд','Weekly trend'),Number.isFinite(app.state.progress?.weekly)?`${app.state.progress.weekly.toFixed(2)} kg/week`:null]];
    entries.forEach(([,label,value])=>{if(value)metrics.append(node('dt',label),node('dd',value));});summary.append(metrics);
    const observed=Boolean(app.state.nutrition?.calibration),trend=Number.isFinite(app.state.progress?.weekly),physical=complete.some(tool=>!['strategy','strength'].includes(tool.id));
    const behavioural=app.state.toolkit?.review?.result?.value||app.state.toolkit?.minimum?.result?.value;
    const next=app.state.toolkit?.fatigue?.result?.data?.reviewLoad?app.state.toolkit.fatigue.result.actions[0]:app.state.strategy?.actions?.[0]?(en()&&window.__mmDynamicTranslate?window.__mmDynamicTranslate(app.state.strategy.actions[0]):app.state.strategy.actions[0]):behavioural||((trend||observed)?p('Сохраните план ещё на неделю и пересмотрите динамику.','Keep the plan for another week, then review the trend.'):physical?p('Соберите 14 дней утреннего веса и фактического питания.','Collect 14 days of morning weights and actual food intake.'):p('Проверьте выбранное действие в течение 7 дней.','Test your chosen action over 7 days.'));
    summary.append(node('h4',p('Качество данных','Data quality')),node('p',(trend||observed)?p('Есть наблюдаемый тренд. Проверяйте полноту учёта и условия замеров.','An observed trend is available. Check logging completeness and measurement conditions.'):p('Пока преобладают оценки, сценарии и самоотчёт.','Estimates, scenarios and self-report currently predominate.')),
      node('h4',p('Главное ограничение','Main limitation')),node('p',(trend||observed)?p('Учёт питания и изменения воды могут искажать калибровку.','Food logging and water changes can distort calibration.'):physical?p('Недостаточно сопоставимых наблюдений за 14–28 дней.','Not enough comparable observations over 14–28 days.'):p('Нет наблюдений о выполнении выбранного действия.','There are no observations of adherence to the chosen action.')),
      node('h4',p('Одно следующее действие','One next action')),node('p',next));
    const download=node('button',p('Скачать читаемую сводку','Download readable summary'),'mm-lab-secondary');download.type='button';download.addEventListener('click',()=>{
      let content=summary.innerText+'\n\n';for(const tool of tools){
        const record=app.state.toolkit?.[tool.id];
        if(record){const result=record.result;content+=t(tool.title)+'\n'+t(result.value)+'\n'+t(result.meaning)+'\n'+t(p('Уверенность','Confidence'))+': '+result.confidence+'\n'+t(result.uncertainty)+'\n'+result.actions.map(t).join('\n')+'\n'+t(result.accuracy)+'\n'+tool.type+' · '+tool.version+' · '+tool.review+'\n'+(tool.source?.join(' ')||'MARKOVMADE')+'\n\n';}
        else if(app.state[tool.id]?.modelVersion){
          const panel=document.getElementById('mm-lab-'+tool.id),prefix={body:'body',nutrition:'nutri',overfeeding:'fat',recovery:'rec',progress:'prog',strategy:'str'}[tool.id];
          const value=prefix?panel.querySelector('#lab-'+prefix+'-main')?.textContent:panel.querySelector('#lab-e1rm-result')?.textContent;
          const meaning=prefix?panel.querySelector('#lab-'+prefix+'-meaning')?.textContent:null;
          content+=t(tool.title)+'\n'+(value||'—')+'\n'+(meaning||t(tool.subtitle))+'\n'+t(tool.limits)+'\n'+[...panel.querySelectorAll('#lab-'+prefix+'-actions li')].map(el=>el.textContent).join('\n')+'\n'+tool.type+' · '+tool.version+' · '+tool.review+'\n'+(tool.source?.join(' ')||'MARKOVMADE')+'\n\n';
        }
      }
      const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'})),link=node('a');link.href=url;link.download='markovmade-summary-'+new Date().toISOString().slice(0,10)+'.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });summary.append(download);
  }
  function legacyEvidence(){
    for(const tool of legacy){const panel=document.getElementById('mm-lab-'+tool.id);if(!panel)continue;
      panel.querySelector('[data-common-evidence]')?.remove();const details=evidence(tool);details.dataset.commonEvidence='';details.dataset.noTranslate='';panel.append(details);
    }
  }
  function legacyResult(){
    for(const tool of legacy){
      const state=app.state[tool.id],panel=document.getElementById('mm-lab-'+tool.id);if(!panel)continue;
      panel.querySelector('[data-standard-result]')?.remove();if(!state?.modelVersion)continue;
      if(tool.id==='strength'){
        const entry=state.history?.at(-1);if(!entry)continue;
        const result={value:`e1RM ≈ ${entry.value.toFixed(1)} kg`,meaning:p('Ориентир для сравнения одинакового упражнения. Не проверяйте реальный максимум только на основании расчёта.','A reference for comparing the same exercise. Do not test a real maximum solely on this estimate.'),confidence:entry.reps<=5?'moderate':'low',uncertainty:tool.limits,actions:[p('Выберите рабочий вес в инструменте %1RM / RIR и проверьте его разминкой.','Choose a working load with the %1RM / RIR tool and check it in warm-up.')],accuracy:p('Используйте одинаковую технику и учитывайте повторы в запасе.','Use consistent technique and account for reps in reserve.')};
        const component=outcome(tool,result);component.dataset.standardResult='';component.dataset.noTranslate='';panel.append(component);continue;
      }
      const prefix={body:'body',nutrition:'nutri',overfeeding:'fat',recovery:'rec',progress:'prog',strategy:'str'}[tool.id];if(!prefix)continue;
      const main=panel.querySelector('#lab-'+prefix+'-main')||panel.querySelector('#lab-'+prefix+'-tdee')||panel.querySelector('#lab-'+prefix+'-score');
      const meaning=panel.querySelector('#lab-'+prefix+'-meaning'),actions=[...panel.querySelectorAll('#lab-'+prefix+'-actions li')].map(el=>el.textContent);
      if(!main)continue;
      const result={value:main.textContent,meaning:meaning?.textContent||tool.subtitle,confidence:tool.id==='recovery'||tool.id==='strategy'?'low':'moderate',uncertainty:tool.limits,actions:actions.length?actions.slice(0,3):[p('Повторите оценку через неделю в одинаковых условиях.','Repeat the assessment in a week under the same conditions.')],accuracy:p('Добавьте сопоставимые наблюдения за 14–28 дней. Проверяйте единицы, метод замеров и полноту учёта.','Add comparable observations over 14–28 days. Check units, measurement method and logging completeness.')};
      // Existing metric, interpretation, confidence badge and action list remain
      // the result owner. Add only the two missing standard fields.
      const component=node('div',undefined,'mm-result-precision');component.dataset.standardResult='';component.dataset.noTranslate='';
      if(!meaning)component.append(node('h4',p('Что это значит','What it means')),node('p',tool.subtitle));
      if(tool.id==='strategy')component.append(node('h4',p('Уверенность','Confidence')),node('p',p('Низкая · практическая эвристика','Low · practical heuristic')));
      component.append(node('h4',p('Главный источник неопределённости','Main uncertainty')),node('p',tool.limits));
      const accuracy=node('details');accuracy.append(node('summary',p('Как улучшить точность','How to improve accuracy')),node('p',result.accuracy));component.append(accuracy);panel.append(component);
    }
  }
  function localise(){heading.textContent=t(p('Что хотите решить?','What would you like to solve?'));lead.textContent=t(p('24 инструмента. Начните с задачи; профиль и результаты остаются на этом устройстве.','24 tools. Start with a task; your profile and results stay on this device.'));searchLabel.textContent=t(p('Поиск по задаче','Search by task'));renderCards();renderSummary();legacyEvidence();window.mmLanguageReady?.then(legacyResult);if(selected&&models.definitions.some(item=>item.id===selected))open(models.definitions.find(item=>item.id===selected));}
  new MutationObserver(localise).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  root.addEventListener('mm:lab-state',()=>{renderSummary();legacyResult();});
  root.addEventListener('click',event=>{if(event.target.closest('[data-calc]'))setTimeout(legacyResult,0);});
  document.getElementById('mm-lab-clear-all')?.addEventListener('click',()=>{renderSummary();if(!app.state.toolkit){for(const id of Object.keys(drafts))delete drafts[id];workspace.replaceChildren();workspace.hidden=true;selected=null;}});
  renderCards();renderSummary();legacyEvidence();
  window.MarkovMadeToolkit={tools,open,renderSummary};
})();
