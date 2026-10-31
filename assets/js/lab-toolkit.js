/* Integrated LAB scenarios, common evidence disclosure and connected local summary. */
(function(){
  'use strict';
  const root=document.getElementById('calculators'),app=window.MarkovMadeLab,models=window.MarkovMadeToolkitModels;
  if(!root||!app||!models)return;
  const en=()=>document.documentElement.lang==='en', t=value=>Array.isArray(value)?value[en()?1:0]:String(value), p=(ru,english)=>[ru,english];
  const node=(tag,copy,className)=>{const el=document.createElement(tag);if(copy!==undefined)el.textContent=t(copy);if(className)el.className=className;return el;};
  const icon=name=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS('http://www.w3.org/2000/svg','use');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');use.setAttribute('href',`#mm-icon-${name}`);svg.append(use);return svg;};
  const legacy=[
    {id:'body',category:'body',title:p('Состав тела · FFMI · целевой вес','Body composition · FFMI · target weight'),subtitle:p('Жир, LBM, FFMI и normalized FFMI вместе','Fat, LBM, FFMI and normalised FFMI together'),type:'Published equation + scenario',formula:'US Navy / Hodgdon–Beckett; LBM = weight × (1 − BF/100); FFMI = LBM / height²; normalised FFMI = FFMI + 6.3 × (1.8 − height); target weight = LBM / (1 − target BF/100)',limits:p('Не измеряет жир напрямую. Целевой вес предполагает сохранение LBM; диапазон ±3% — выбранный запас, не доверительный интервал.','Does not measure fat directly. Target weight assumes constant LBM; ±3% is a chosen planning margin, not a confidence interval.'),source:models.sources.body},
    {id:'nutrition',category:'nutrition',title:p('Калории и БЖУ · QUICK / PRO / adaptive','Calories and macros · QUICK / PRO / adaptive'),subtitle:p('TDEE, цель и калибровка по 14–28 дням','TDEE, targets and 14–28-day calibration'),type:'Published equations + practical calibration',formula:'Mifflin–St Jeor / ten Haaf; TDEE = RMR × PAL. Adaptive: mean intake − Theil–Sen weight slope × assumed 7000–9000 kcal/kg.',limits:p('Не измеряет расход энергии. Калибровка зависит от полноты учёта, воды и соблюдения; качественный наблюдаемый тренд приоритетнее прогностической формулы.','Does not measure energy expenditure. Calibration depends on logging, water and adherence; high-quality observed data take priority over prediction.'),source:['Mifflin et al. 1990','https://pubmed.ncbi.nlm.nih.gov/2305711/']},
    {id:'overfeeding',category:'nutrition',title:p('Переедание и изменение веса','Overeating and weight change'),subtitle:p('Энергетический сценарий, вода и гликоген','Energy scenario, water and glycogen'),type:'MARKOVMADE practical heuristic',formula:'Energy-equivalent surplus / 7700; separate assumed TEF and glycogen-associated water scenarios.',limits:p('Не предсказывает фактическую прибавку жира. Коэффициенты и запасы гликогена меняются.','Does not predict actual fat gain. Energy factors and glycogen stores vary.'),source:['Hall et al. 2011','https://pubmed.ncbi.nlm.nih.gov/21872751/']},
    {id:'recovery',category:'recovery',title:p('Readiness · HRV / RHR baseline','Readiness · HRV / RHR baseline'),subtitle:p('Личные сигналы и минимум 14 наблюдений','Personal signals and at least 14 observations'),type:'MARKOVMADE practical heuristic',formula:'Self-reported weighted signals; personal RHR/HRV baseline = median of last 14–28 valid paired observations.',limits:p('Не медицинский score, не диагноз и не тест готовности. Значения разных устройств несопоставимы.','Not a medical score, diagnosis or readiness test. Different devices are not interchangeable.'),source:['HRV measurement recommendations','https://pubmed.ncbi.nlm.nih.gov/8838590/']},
    {id:'progress',category:'progress',title:p('Тренд веса · плато · ETA · коррекция','Weight trend · plateau · ETA · adjustment'),subtitle:p('Theil–Sen, средние и проверка выбросов','Theil–Sen, averages and outlier review'),type:'Statistical trend + practical heuristic',formula:'Median pairwise daily slopes; moving average; MAD flags. Plateau/ETA/calorie adjustment use practical thresholds.',limits:p('Тренд не отделяет жир от воды. Выбросы требуют проверки, а ETA — условный линейный сценарий.','The trend cannot separate fat from water. Outliers require review and ETA is a conditional linear scenario.'),source:['Sen 1968','https://doi.org/10.1080/01621459.1968.10480934']},
    {id:'strength',category:'training',title:p('Силовой ориентир · e1RM','Strength reference · e1RM'),subtitle:p('Оценка максимума по весу и повторам','Estimate a maximum from load and repetitions'),type:'Published equations',formula:'Epley: load × (1 + reps/30); Brzycki: load × 36/(37 − reps); average, with reduced confidence at high repetitions.',limits:p('Не измеряет реальный 1ПМ. Техника, RIR и упражнение меняют ошибку; не предложение проверять максимум.','Does not measure actual 1RM. Technique, RIR and exercise affect error; not a recommendation to test a maximum.'),source:['Brzycki 1993','https://doi.org/10.1080/07303084.1993.10606684']}
  ].map(item=>({...item,version:'1.0.0',review:models.review}));
  const retired=new Set(['cardio','adherence','friction','minimum','ifthen','review']);
  const tools=[...legacy,...models.definitions.filter(tool=>!retired.has(tool.id))];
  const primary=['body','nutrition','overfeeding','recovery','progress','strength','plates','progression','caffeine'];
  const parent={recomposition:'body',protein:'nutrition',phase:'progress',circumference:'progress',load:'strength',volume:'strength',sleep:'recovery',fatigue:'recovery'};
  const favoriteKey='markovmade-lab-favorites-v1';
  const readList=key=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch{return [];}};
  const favoriteIds=()=>readList(favoriteKey).filter(id=>tools.some(tool=>tool.id===id)).slice(0,6);
  let selected=null;
  const drafts={};
  const shell=root.querySelector('.mm-lab-shell');
  const workspace=node('section',undefined,'mm-toolkit-workspace');workspace.hidden=true;workspace.id='mm-toolkit-workspace';workspace.dataset.noTranslate='';workspace.setAttribute('aria-labelledby','mm-toolkit-active-title');
  const summary=node('section',undefined,'mm-toolkit-summary');summary.dataset.noTranslate='';summary.setAttribute('aria-labelledby','mm-toolkit-summary-title');shell.append(summary);
  function renderScenarios(){
    root.querySelectorAll('.mm-lab-scenarios').forEach(el=>el.remove());
    for(const key of [...new Set(Object.values(parent))]){
      const group=node('div',undefined,'mm-lab-scenarios');group.dataset.noTranslate='';
      group.append(node('h4',p('Дополнительные сценарии','Additional scenarios')));
      for(const tool of tools.filter(tool=>parent[tool.id]===key)){
        const button=node('button',tool.title,'mm-lab-secondary');button.type='button';button.dataset.toolId=tool.id;button.addEventListener('click',()=>open(tool));group.append(button);
      }
      root.querySelector(`[data-mm-lab-panel="${key}"]`).append(group);
    }
  }
  root.addEventListener('mm:lab-tab',event=>{
    const activeForm=workspace.querySelector('form');if(selected&&activeForm)drafts[selected]=Object.fromEntries(new FormData(activeForm));
    const tool=tools.find(tool=>tool.id===event.detail.key);
    if(tool&&legacy.includes(tool)){selected=null;workspace.hidden=true;}
    if(tool&&primary.includes(tool.id)&&!legacy.includes(tool))open(tool,false);
  });
  function evidence(definition){
    const details=node('details',undefined,'mm-evidence'),toggle=node('summary',p('Методика и источники','Method and sources'));
    details.append(toggle,node('p',definition.type,'mm-evidence-type'),node('p',definition.formula),node('p',definition.limits));
    const accuracy=node('p',p('Предположения: корректные единицы и сопоставимые наблюдения. Формула описывает оценку, а не индивидуальную валидацию.','Assumptions: correct units and comparable observations. A formula describes an estimate, not individual validation.'));details.append(accuracy);
    if(definition.source){const link=node('a',definition.source[0]);link.href=definition.source[1];link.target='_blank';link.rel='noopener noreferrer';details.append(link);}
    else details.append(node('p',p('Источник правила: MARKOVMADE. Внешняя валидация этого правила не заявлена.','Rule source: MARKOVMADE. External validation is not claimed.')));
    details.append(node('p',`MARKOVMADE ${definition.version} · ${t(p('Проверено','Reviewed'))} ${definition.review}`));return details;
  }
  function outcome(definition,result,saved=false){
    const out=node('div',undefined,'mm-toolkit-outcome');
    out.append(node('span',saved?p('Сохранённый расчёт','Saved calculation'):p('Расчёт','Estimate'),'mm-toolkit-result-label'),node('p',result.value,'mm-toolkit-value'),node('p',result.meaning,'mm-toolkit-meaning'));
    if(result.modelVersion!==definition.version)out.append(node('p',p(`Модель снимка: ${result.modelVersion}. Новый расчёт: ${definition.version}.`,`Snapshot model: ${result.modelVersion}. New calculation: ${definition.version}.`),'mm-toolkit-meaning'));
    const confidence={high:p('Высокая · для арифметики введённых данных','High · for arithmetic on your inputs'),moderate:p('Умеренная','Moderate'),low:p('Низкая','Low')};
    const action=node('section',undefined,'mm-toolkit-next-step');action.append(node('h4',p('Следующий шаг','Next step')));
    const actions=node('ol');result.actions.forEach(item=>actions.append(node('li',item)));action.append(actions);out.append(action);
    const precision=node('details',undefined,'mm-toolkit-precision');precision.append(node('summary',p('Уверенность и ограничения','Confidence and limits')),node('p',confidence[result.confidence]||confidence.low),node('p',result.uncertainty));
    const accuracy=node('details',undefined,'mm-toolkit-precision');accuracy.append(node('summary',p('Как улучшить точность','How to improve accuracy')),node('p',result.accuracy));
    out.append(precision,accuracy);
    if(definition.id==='caffeine'){
      const dose=Number(app.state.toolkit?.caffeine?.inputs?.dose),hours=Number(app.state.toolkit?.caffeine?.inputs?.hours);
      if(Number.isFinite(dose)&&Number.isFinite(hours)){
        const chart=node('div',undefined,'mm-caffeine-scenarios');chart.append(node('h4',p('Предполагаемый период полувыведения','Assumed half-life')));
        for(const half of [3,5,7]){const remaining=dose*2**(-hours/half),row=node('div',undefined,'mm-caffeine-row'),bar=node('meter');bar.min=0;bar.max=Math.max(1,dose);bar.value=remaining;bar.setAttribute('aria-label',t(p(`${half} ч: ${Math.round(remaining)} мг`,`${half} h: ${Math.round(remaining)} mg`)));row.append(node('span',p(`${half} ч`,`${half} h`)),bar,node('strong',p(`${Math.round(remaining)} мг`,`${Math.round(remaining)} mg`)));chart.append(row);}out.insertBefore(chart,action);
      }
    }
    return out;
  }
  function open(tool,focus=true){
    if(!tool)return;
    const key=parent[tool.id]||tool.id;
    const tab=root.querySelector(`[data-mm-lab-tab="${key}"]`);
    if(tab?.getAttribute('aria-selected')!=='true')tab?.click();
    const activeForm=workspace.querySelector('form');if(selected&&activeForm)drafts[selected]=Object.fromEntries(new FormData(activeForm));
    selected=tool.id;
    if(legacy.includes(tool)){
      workspace.hidden=true;root.querySelector(`[data-mm-lab-tab="${tool.id}"]`).click();
      const panel=document.getElementById('mm-lab-'+tool.id);panel.setAttribute('tabindex','-1');panel.focus({preventScroll:true});panel.scrollIntoView({block:'start',behavior:'auto'});return;
    }
    root.querySelector(`[data-mm-lab-panel="${key}"]`).append(workspace);workspace.hidden=false;workspace.replaceChildren();const title=node('h3',tool.title);title.id='mm-toolkit-active-title';title.tabIndex=-1;
    const form=node('form'),fields=node('div',undefined,'mm-toolkit-fields');form.noValidate=false;
    const previous=app.state.toolkit?.[tool.id]?.inputs||{};
    for(const field of tool.fields){
      const group=node('div',undefined,'mm-lab-field'),label=node('label',field.label),input=node(field.type==='select'?'select':'input');input.id='toolkit-'+tool.id+'-'+field.key;label.htmlFor=input.id;input.name=field.key;if(field.type==='select'){for(const [value,label] of field.options){const option=node('option',label);option.value=value;input.append(option);}}else input.type=field.type||'number';input.className='mm-lab-input';input.required=!field.optional;
      if(input.type==='number'){input.min=field.min;input.max=field.max;input.step='any';input.inputMode='decimal';}
      else if(input.type==='text')input.maxLength=1000;
      const stored=field.profile?app.state.profile[field.profile]:undefined;input.value=drafts[tool.id]?.[field.key]??stored??previous[field.key]??field.value;
      group.append(label,input);fields.append(group);
    }
    const button=node('button',p('Получить результат','Get result'),'mm-lab-primary');button.type='submit';const error=node('p');error.setAttribute('role','alert');
    const output=node('div');output.id='mm-toolkit-result';output.setAttribute('role','status');output.setAttribute('aria-atomic','true');
    const favorite=node('button',favoriteIds().includes(tool.id)?p('★ В избранном','★ Saved'):p('☆ В избранное','☆ Save favorite'),'mm-lab-secondary');favorite.type='button';favorite.classList.add('mm-toolkit-favorite');favorite.setAttribute('aria-pressed',String(favoriteIds().includes(tool.id)));favorite.addEventListener('click',()=>{const ids=readList(favoriteKey),next=ids.includes(tool.id)?ids.filter(id=>id!==tool.id):[...ids,tool.id];if(next.filter(id=>tools.some(tool=>tool.id===id)).length>6){error.textContent=t(p('В избранном уже 6 инструментов. Уберите один рядом с дневником.','You have 6 favorites. Remove one beside the journal first.'));return;}try{localStorage.setItem(favoriteKey,JSON.stringify(next));favorite.setAttribute('aria-pressed',String(next.includes(tool.id)));favorite.textContent=t(next.includes(tool.id)?p('★ В избранном','★ Favorite'):p('☆ В избранное','☆ Favorite'));root.dispatchEvent(new CustomEvent('mm:favorites-change'));}catch{error.textContent=t(p('Браузер не сохранил избранное.','The browser could not save favorites.'));}});
    form.append(fields,button,error,evidence(tool));
    const layout=node('div',undefined,'mm-toolkit-analysis');
    output.className='mm-toolkit-analysis-result';
    const empty=node('div',undefined,'mm-toolkit-empty-result');empty.append(icon(tool.id==='plates'?'plates':tool.id==='progression'?'progression':tool.id==='caffeine'?'caffeine':'compass'),node('h4',p('Ваш следующий шаг','Your next step')),node('p',p('Заполните форму и выполните расчёт. Здесь появятся результат, допущения и конкретное действие.','Complete the form and run the calculation. Your result, assumptions and a practical action will appear here.')));output.append(empty);
    layout.append(form,output);workspace.append(title,node('p',tool.subtitle),favorite,layout);
    if(app.state.toolkit?.[tool.id]?.result)output.replaceChildren(outcome(tool,app.state.toolkit[tool.id].result,true));
    form.addEventListener('input',()=>{const label=output.querySelector('.mm-toolkit-result-label');if(label)label.textContent=t(p('Параметры изменены · пересчитайте результат','Inputs changed · run the calculation again'));});
    form.addEventListener('submit',event=>{
      event.preventDefault();const inputs=Object.fromEntries(new FormData(form));
      try{
        const result=models.calculate(tool.id,inputs);error.textContent='';
        app.state.toolkit=app.state.toolkit||{};app.state.toolkit[tool.id]={inputs,result,at:new Date().toISOString(),modelVersion:tool.version};
        for(const field of tool.fields)if(field.profile)app.state.profile[field.profile]=Number(inputs[field.key]);
        try{localStorage.setItem('markovmade-lab-v1',JSON.stringify(app.state));}catch{error.textContent=t(p('Результат рассчитан, но браузер не сохранил данные.','Calculated, but the browser could not save the data.'));}
        root.querySelectorAll('[data-profile]').forEach(input=>{if(app.state.profile[input.dataset.profile]!=null)input.value=app.state.profile[input.dataset.profile];});
        output.replaceChildren(outcome(tool,result));renderSummary();output.scrollIntoView({block:'nearest',behavior:'auto'});root.dispatchEvent(new CustomEvent('mm:toolkit-result',{detail:{id:tool.id,result}}));
      }catch{const messages={plates:p('Цель должна быть не меньше грифа. Укажите до 24 блинов на сторону, через запятую; каждый вес кратен 0.25 кг. Десятичный разделитель — точка.','The target must be at least the bar. List up to 24 plates per side, separated by commas, in 0.25 kg increments. Use a decimal point.'),volume:p('Запишите подходы как 8 x 60; 7 x 62.5. Не больше 30 подходов, повторы — целые числа.','Enter sets as 8 x 60; 7 x 62.5. Up to 30 sets; repetitions must be whole numbers.'),sleep:p('Проверьте время сна и подъёма. Время бодрствования не должно превышать окно сна.','Check bedtime and wake time. Time awake cannot exceed the sleep opportunity.')};error.textContent=t(messages[tool.id]||p('Проверьте значения, единицы измерения и целые числа в полях повторов и сессий.','Check values, units and whole numbers for repetitions and sessions.'));error.scrollIntoView({block:'nearest',behavior:'auto'});}
    });
    if(focus){title.focus({preventScroll:true});workspace.scrollIntoView({block:'start',behavior:'auto'});}
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
        if(record){const result=record.result;content+=t(tool.title)+'\n'+t(result.value)+'\n'+t(result.meaning)+'\n'+t(p('Уверенность','Confidence'))+': '+result.confidence+'\n'+t(result.uncertainty)+'\n'+result.actions.map(t).join('\n')+'\n'+t(result.accuracy)+'\n'+tool.type+' · '+(record.modelVersion||result.modelVersion||tool.version)+' · '+tool.review+'\n'+(tool.source?.join(' ')||'MARKOVMADE')+'\n\n';}
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
  function localise(){renderScenarios();renderSummary();legacyEvidence();window.mmLanguageReady?.then(legacyResult);if(selected&&models.definitions.some(item=>item.id===selected))open(models.definitions.find(item=>item.id===selected),false);}
  new MutationObserver(localise).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  root.addEventListener('mm:lab-state',()=>{renderSummary();legacyResult();});
  root.addEventListener('click',event=>{if(event.target.closest('[data-calc]'))setTimeout(legacyResult,0);});
  document.getElementById('mm-lab-clear-all')?.addEventListener('click',()=>{
    renderSummary();
    if(!app.state.toolkit){
      const active=root.querySelector('[data-mm-lab-tab][aria-selected="true"]')?.dataset.mmLabTab;
      for(const id of Object.keys(drafts))delete drafts[id];
      workspace.replaceChildren();workspace.hidden=true;selected=null;
      const tool=models.definitions.find(tool=>tool.id===active);if(tool)open(tool,false);
    }
  });
  renderScenarios();renderSummary();legacyEvidence();
  window.MarkovMadeToolkit={tools,primary,open,renderSummary};
})();
