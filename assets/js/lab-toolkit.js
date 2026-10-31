/* LAB task catalogue, common evidence disclosure and connected local summary. */
(function(){
  'use strict';
  const root=document.getElementById('calculators'),app=window.MarkovMadeLab,models=window.MarkovMadeToolkitModels;
  if(!root||!app||!models)return;
  const en=()=>document.documentElement.lang==='en', t=value=>Array.isArray(value)?value[en()?1:0]:String(value), p=(ru,english)=>[ru,english];
  const node=(tag,copy,className)=>{const el=document.createElement(tag);if(copy!==undefined)el.textContent=t(copy);if(className)el.className=className;return el;};
  const icon=name=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS('http://www.w3.org/2000/svg','use');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');use.setAttribute('href',`#mm-icon-${name}`);svg.append(use);return svg;};
  const categories={all:p('Все задачи','All tasks'),favorites:p('Избранное','Favorites'),recent:p('Недавние','Recent'),body:p('Тело','Body'),nutrition:p('Питание','Nutrition'),training:p('Тренировки','Training'),recovery:p('Восстановление','Recovery'),progress:p('Прогресс','Progress'),behaviour:p('Мышление / поведение','Thinking / behaviour')};
  const categoryIcons={body:'body',nutrition:'calories',training:'strength',recovery:'recovery',progress:'trend',behaviour:'compass'};
  const legacy=[
    {id:'body',category:'body',title:p('Состав тела · FFMI · целевой вес','Body composition · FFMI · target weight'),subtitle:p('Жир, LBM, FFMI и normalized FFMI вместе','Fat, LBM, FFMI and normalised FFMI together'),type:'Published equation + scenario',formula:'US Navy / Hodgdon–Beckett; LBM = weight × (1 − BF/100); FFMI = LBM / height²; normalised FFMI = FFMI + 6.3 × (1.8 − height); target weight = LBM / (1 − target BF/100)',limits:p('Не измеряет жир напрямую. Целевой вес предполагает сохранение LBM; диапазон ±3% — выбранный запас, не доверительный интервал.','Does not measure fat directly. Target weight assumes constant LBM; ±3% is a chosen planning margin, not a confidence interval.'),source:models.sources.body},
    {id:'nutrition',category:'nutrition',title:p('Калории и БЖУ · QUICK / PRO / adaptive','Calories and macros · QUICK / PRO / adaptive'),subtitle:p('TDEE, цель и калибровка по 14–28 дням','TDEE, targets and 14–28-day calibration'),type:'Published equations + practical calibration',formula:'Mifflin–St Jeor / ten Haaf; TDEE = RMR × PAL. Adaptive: mean intake − Theil–Sen weight slope × assumed 7000–9000 kcal/kg.',limits:p('Не измеряет расход энергии. Калибровка зависит от полноты учёта, воды и соблюдения; качественный наблюдаемый тренд приоритетнее прогностической формулы.','Does not measure energy expenditure. Calibration depends on logging, water and adherence; high-quality observed data take priority over prediction.'),source:['Mifflin et al. 1990','https://pubmed.ncbi.nlm.nih.gov/2305711/']},
    {id:'overfeeding',category:'nutrition',title:p('Переедание и изменение веса','Overeating and weight change'),subtitle:p('Энергетический сценарий, вода и гликоген','Energy scenario, water and glycogen'),type:'MARKOVMADE practical heuristic',formula:'Energy-equivalent surplus / 7700; separate assumed TEF and glycogen-associated water scenarios.',limits:p('Не предсказывает фактическую прибавку жира. Коэффициенты и запасы гликогена меняются.','Does not predict actual fat gain. Energy factors and glycogen stores vary.'),source:['Hall et al. 2011','https://pubmed.ncbi.nlm.nih.gov/21872751/']},
    {id:'recovery',category:'recovery',title:p('Readiness · HRV / RHR baseline','Readiness · HRV / RHR baseline'),subtitle:p('Личные сигналы и минимум 14 наблюдений','Personal signals and at least 14 observations'),type:'MARKOVMADE practical heuristic',formula:'Self-reported weighted signals; personal RHR/HRV baseline = median of last 14–28 valid paired observations.',limits:p('Не медицинский score, не диагноз и не тест готовности. Значения разных устройств несопоставимы.','Not a medical score, diagnosis or readiness test. Different devices are not interchangeable.'),source:['HRV measurement recommendations','https://pubmed.ncbi.nlm.nih.gov/8838590/']},
    {id:'progress',category:'progress',title:p('Тренд веса · плато · ETA · коррекция','Weight trend · plateau · ETA · adjustment'),subtitle:p('Theil–Sen, средние и проверка выбросов','Theil–Sen, averages and outlier review'),type:'Statistical trend + practical heuristic',formula:'Median pairwise daily slopes; moving average; MAD flags. Plateau/ETA/calorie adjustment use practical thresholds.',limits:p('Тренд не отделяет жир от воды. Выбросы требуют проверки, а ETA — условный линейный сценарий.','The trend cannot separate fat from water. Outliers require review and ETA is a conditional linear scenario.'),source:['Sen 1968','https://doi.org/10.1080/01621459.1968.10480934']},
    {id:'strength',category:'training',title:p('Силовой ориентир · e1RM','Strength reference · e1RM'),subtitle:p('Оценка максимума по весу и повторам','Estimate a maximum from load and repetitions'),type:'Published equations',formula:'Epley: load × (1 + reps/30); Brzycki: load × 36/(37 − reps); average, with reduced confidence at high repetitions.',limits:p('Не измеряет реальный 1ПМ. Техника, RIR и упражнение меняют ошибку; не предложение проверять максимум.','Does not measure actual 1RM. Technique, RIR and exercise affect error; not a recommendation to test a maximum.'),source:['Brzycki 1993','https://doi.org/10.1080/07303084.1993.10606684']}
  ].map(item=>({...item,version:'1.0.0',review:models.review}));
  const tools=[...legacy,...models.definitions];
  const favoriteKey='markovmade-lab-favorites-v1';
  const readList=key=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch{return [];}};
  const favoriteIds=()=>readList(favoriteKey).filter(id=>tools.some(tool=>tool.id===id)).slice(0,6);
  const recentIds=()=>[...new Set(readList('markovmade-lab-history-v1').map(item=>item?.tool))].filter(id=>tools.some(tool=>tool.id===id));
  let category='all',selected=null,expanded=false;
  const drafts={};
  const shell=root.querySelector('.mm-lab-shell'),catalogue=node('section',undefined,'mm-toolkit');catalogue.dataset.noTranslate='';catalogue.setAttribute('aria-labelledby','mm-toolkit-title');
  const heading=node('h3',p('Что хотите решить?','What would you like to solve?'));heading.id='mm-toolkit-title';
  const lead=node('p',p(`Инструментов: ${tools.length}. Начните с задачи; профиль и результаты остаются на этом устройстве.`,`${tools.length} tools. Start with a task; your profile and results stay on this device.`),'mm-toolkit-lead');
  const searchLabel=node('label',p('Поиск по задаче','Search by task'));searchLabel.htmlFor='mm-toolkit-search';
  const search=node('input');search.type='search';search.id='mm-toolkit-search';search.className='mm-lab-input';search.autocomplete='off';
  const filters=node('div',undefined,'mm-toolkit-filters');filters.setAttribute('role','group');
  for(const key of Object.keys(categories)){const button=node('button',categories[key]);button.type='button';button.dataset.category=key;button.setAttribute('aria-pressed',String(key==='all'));button.addEventListener('click',()=>{category=key;renderCards();});filters.append(button);}
  const count=node('p',undefined,'mm-toolkit-count');count.setAttribute('role','status');
  const cards=node('div',undefined,'mm-toolkit-cards'),workspace=node('section',undefined,'mm-toolkit-workspace');workspace.hidden=true;workspace.id='mm-toolkit-workspace';workspace.setAttribute('aria-labelledby','mm-toolkit-active-title');
  const more=node('button',p(`Показать все · ${tools.length}`,`Show all · ${tools.length}`),'mm-lab-secondary');more.type='button';more.addEventListener('click',()=>{expanded=!expanded;renderCards();});
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
    out.append(node('span',p('Расчёт','Estimate'),'mm-toolkit-result-label'),node('p',result.value,'mm-toolkit-value'),node('p',result.meaning,'mm-toolkit-meaning'));
    const confidence={high:p('Высокая · для арифметики введённых данных','High · for arithmetic on your inputs'),moderate:p('Умеренная','Moderate'),low:p('Низкая','Low')};
    const action=node('section',undefined,'mm-toolkit-next-step');action.append(node('h4',p('Следующий шаг','Next step')));
    const actions=node('ol');result.actions.forEach(item=>actions.append(node('li',item)));action.append(actions);out.append(action);
    const precision=node('details',undefined,'mm-toolkit-precision');precision.append(node('summary',p('Уверенность и ограничения','Confidence and limits')),node('p',confidence[result.confidence]||confidence.low),node('p',result.uncertainty));
    const accuracy=node('details',undefined,'mm-toolkit-precision');accuracy.append(node('summary',p('Как улучшить точность','How to improve accuracy')),node('p',result.accuracy));
    out.append(precision,accuracy,evidence(definition));return out;
  }
  function renderCards(){
    const query=search.value.trim().toLocaleLowerCase();cards.replaceChildren();
    const favorites=favoriteIds(),recent=recentIds();
    const matches=tools.filter(tool=>(category==='all'||category==='favorites'&&favorites.includes(tool.id)||category==='recent'&&recent.includes(tool.id)||tool.category===category)&&(!query||[...tool.title,...tool.subtitle,tool.id].join(' ').toLocaleLowerCase().includes(query)));
    if(category==='recent')matches.sort((a,b)=>recent.indexOf(a.id)-recent.indexOf(b.id));
    const shown=category==='all'&&!query&&!expanded?matches.filter(tool=>['body','nutrition','progress'].includes(tool.id)):matches;
    shown.forEach(tool=>{
      const button=node('button',undefined,'mm-toolkit-card');button.type='button';button.dataset.toolId=tool.id;
      const head=node('span',undefined,'mm-toolkit-card-head');head.append(node('span',categories[tool.category]),icon(categoryIcons[tool.category]||'compass'));button.append(head,node('strong',tool.title),node('span',tool.subtitle));button.setAttribute('aria-controls',models.definitions.includes(tool)?workspace.id:'mm-lab-'+tool.id);button.addEventListener('click',()=>open(tool));
      const item=node('article',undefined,'mm-toolkit-item'),favorite=node('button',undefined,'mm-toolkit-favorite');favorite.type='button';
      /* The star is a picture of a state, not a word: as button text it becomes the
         visible label and "В избранное: …" fails WCAG 2.5.3 (label in name). It is also
         a glyph whose rendering depends on the fallback font. */
      const star=document.createElementNS('http://www.w3.org/2000/svg','svg'),starPath=document.createElementNS('http://www.w3.org/2000/svg','path');
      star.setAttribute('viewBox','0 0 24 24');star.setAttribute('class','mm-toolkit-favorite-icon');star.setAttribute('aria-hidden','true');star.setAttribute('focusable','false');
      starPath.setAttribute('d','M12 3.7l2.55 5.17 5.7.83-4.12 4.02.97 5.68L12 16.6l-5.1 2.8.97-5.68L3.75 9.7l5.7-.83z');
      star.append(starPath);favorite.append(star);
      favorite.setAttribute('aria-pressed',String(favorites.includes(tool.id)));favorite.setAttribute('aria-label',t(favorites.includes(tool.id)?p('Убрать из избранного: ','Remove favorite: '):p('В избранное: ','Add favorite: '))+t(tool.title));
      favorite.addEventListener('click',()=>{
        const current=favoriteIds(),next=current.includes(tool.id)?current.filter(id=>id!==tool.id):[...current,tool.id];
        if(next.length>6){count.textContent=t(p('В избранном уже 6 инструментов. Уберите один, чтобы добавить новый.','You have 6 favorites. Remove one before adding another.'));return;}
        try{localStorage.setItem(favoriteKey,JSON.stringify(next));root.dispatchEvent(new CustomEvent('mm:favorites-change'));const replacement=cards.querySelector(`[data-tool-id="${tool.id}"]`)?.parentElement.querySelector('.mm-toolkit-favorite');(replacement||search).focus();}catch{count.textContent=t(p('Браузер не сохранил избранное.','The browser could not save favorites.'));}
      });item.append(button,favorite);cards.append(item);
    });
    if(!matches.length)cards.append(node('p',category==='favorites'?p('Добавьте нужные инструменты звёздочкой в каталоге.','Star tools in the catalogue to keep them here.'):category==='recent'?p('Здесь появятся выполненные расчёты.','Completed calculations will appear here.'):p('Ничего не найдено. Попробуйте другую задачу или категорию.','No matches. Try another task or category.'),'mm-toolkit-empty'));
    count.textContent=t(p(`Показано: ${shown.length} из ${matches.length}`,`Showing: ${shown.length} of ${matches.length}`));
    more.hidden=category!=='all'||Boolean(query);more.textContent=t(expanded?p('Свернуть каталог','Collapse catalogue'):p(`Показать все · ${tools.length}`,`Show all · ${tools.length}`));more.setAttribute('aria-expanded',String(expanded));
    for(const button of filters.children){button.textContent=t(categories[button.dataset.category]);button.setAttribute('aria-pressed',String(category===button.dataset.category));}
    filters.setAttribute('aria-label',t(p('Категории инструментов','Tool categories')));
  }
  search.addEventListener('input',renderCards);
  root.addEventListener('mm:favorites-change',renderCards);
  root.addEventListener('mm:toolkit-result',()=>{if(category==='recent')renderCards();});
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
    summary.replaceChildren();summary.hidden=false;const summaryHead=node('div',undefined,'mm-toolkit-summary-head'),summaryBrand=node('div',undefined,'mm-toolkit-summary-brand');summaryBrand.append(icon('lock'),node('span',p('Сводка · хранится в браузере','Summary · stored on this device'),'mm-toolkit-summary-kicker'));summaryHead.append(summaryBrand);const title=node('h3','MARKOVMADE SUMMARY');title.id='mm-toolkit-summary-title';summaryHead.append(title);summary.append(summaryHead);
    const complete=legacy.filter(tool=>app.state[tool.id]?.modelVersion),extra=Object.entries(app.state.toolkit||{}).filter(([,value])=>value.result);const total=complete.length+extra.length;
    const lastTwo=total%100,last=total%10,calculationWord=total===1?'расчёта':last>=2&&last<=4&&(lastTwo<12||lastTwo>14)?'расчёта':'расчётов';
    summary.append(node('p',total?t(p(`Здесь собраны результаты ${total} ${calculationWord} из этого браузера.`,`Your results from ${total} calculation${total===1?'':'s'} on this device.`)):p('Сделайте первый расчёт — здесь появятся показатели и следующий шаг.','Run your first calculation to see your key measures and next step here.')));
    if(!total){summary.hidden=true;return;}
    const entries=[['weight',p('Вес сейчас','Current weight'),app.state.profile.weight?`${app.state.profile.weight} ${en()?'kg':'кг'}`:null,'scale'],['bodyFat',p('Процент жира · оценка','Estimated body fat'),app.state.body?.bf?`${app.state.body.bf.toFixed(1)}%`:null,'body'],['tdee',p('Поддержание · оценка','Estimated maintenance'),Number.isFinite(app.state.nutrition?.tdee)?`${Math.round(app.state.nutrition.tdee)} ${en()?'kcal/day':'ккал/день'}`:null,'calories'],['trend',p('Изменение веса за неделю','Weekly weight change'),Number.isFinite(app.state.progress?.weekly)?`${app.state.progress.weekly>0?'+':''}${app.state.progress.weekly.toFixed(2)} ${en()?'kg/week':'кг/нед.'}`:null,'trend']];
    const metrics=node('div',undefined,'mm-toolkit-summary-metrics');
    entries.forEach(([key,label,value,iconName])=>{if(!value)return;const card=node('article',undefined,'mm-summary-metric'),index=String(metrics.children.length+1).padStart(2,'0');card.append(node('span',index,'mm-summary-metric-index'),icon(iconName),node('span',label,'mm-summary-metric-label'),node('strong',value,'mm-summary-metric-value'));card.children[1].classList.add('mm-summary-metric-icon');metrics.append(card);});summary.append(metrics);
    const observed=Boolean(app.state.nutrition?.calibration),trend=Number.isFinite(app.state.progress?.weekly),physical=complete.some(tool=>!['strategy','strength'].includes(tool.id));

    const behavioural=app.state.toolkit?.review?.result?.value||app.state.toolkit?.minimum?.result?.value;
    const next=app.state.toolkit?.fatigue?.result?.data?.reviewLoad?app.state.toolkit.fatigue.result.actions[0]:app.state.strategy?.actions?.[0]?(en()&&window.__mmDynamicTranslate?window.__mmDynamicTranslate(app.state.strategy.actions[0]):app.state.strategy.actions[0]):behavioural||((trend||observed)?p('Сохраните план ещё на неделю и пересмотрите динамику.','Keep the plan for another week, then review the trend.'):physical?p('Соберите 14 дней утреннего веса и фактического питания.','Collect 14 days of morning weights and actual food intake.'):p('Проверьте выбранное действие в течение 7 дней.','Test your chosen action over 7 days.'));
    const notes=node('div',undefined,'mm-toolkit-summary-notes'),source=node('article',undefined,'mm-summary-note');source.append(node('h4',p('Как читать эти цифры','About these measures')),node('p',(trend||observed)?p('Это расчёты и ваши замеры. На результат влияют условия измерения и полнота записей.','These are calculations and your measurements. Results depend on how and when you record them.'):p('Сейчас здесь есть расчётные оценки и ваши ответы. Регулярные замеры помогут увидеть изменения.','This view combines estimates and your entries. Regular measurements can show changes over time.')));
    const action=node('article',undefined,'mm-summary-note mm-summary-next-step');action.append(node('span',p('ДАЛЬШЕ','NEXT'),'mm-summary-next-kicker'),node('h4',p('Что сделать дальше','What to do next')),node('p',next));notes.append(source,action);summary.append(notes);
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
      const component=node('details',undefined,'mm-result-precision');component.dataset.standardResult='';component.dataset.noTranslate='';
      component.append(node('summary',p('Уверенность и ограничения','Confidence and limits')));
      const body=node('div',undefined,'mm-result-precision-body');
      body.append(node('p',tool.id==='strategy'||tool.id==='recovery'?p('Уверенность: низкая · практическая эвристика','Confidence: low · practical heuristic'):p('Уверенность: умеренная','Confidence: moderate')));
      body.append(node('p',tool.limits));
      const accuracy=node('details');accuracy.append(node('summary',p('Как улучшить точность','How to improve accuracy')),node('p',result.accuracy));body.append(accuracy);component.append(body);panel.append(component);
    }
  }
  function localise(){heading.textContent=t(p('Что хотите решить?','What would you like to solve?'));lead.textContent=t(p(`Инструментов: ${tools.length}. Начните с задачи; профиль и результаты остаются на этом устройстве.`,`${tools.length} tools. Start with a task; your profile and results stay on this device.`));searchLabel.textContent=t(p('Поиск по задаче','Search by task'));renderCards();renderSummary();legacyEvidence();window.mmLanguageReady?.then(legacyResult);if(selected&&models.definitions.some(item=>item.id===selected))open(models.definitions.find(item=>item.id===selected));}
  new MutationObserver(localise).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  root.addEventListener('mm:lab-state',()=>{renderSummary();legacyResult();});
  root.addEventListener('click',event=>{if(event.target.closest('[data-calc]'))setTimeout(legacyResult,0);});
  document.getElementById('mm-lab-clear-all')?.addEventListener('click',()=>{renderSummary();if(!app.state.toolkit){for(const id of Object.keys(drafts))delete drafts[id];workspace.replaceChildren();workspace.hidden=true;selected=null;}});
  renderCards();renderSummary();legacyEvidence();
  window.MarkovMadeToolkit={tools,open,renderSummary};
})();
