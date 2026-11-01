/* Integrated LAB scenarios, common evidence disclosure and connected local summary. */
(function(){
  'use strict';
  const root=document.getElementById('calculators'),app=window.MarkovMadeLab,models=window.MarkovMadeToolkitModels;
  if(!root||!app||!models)return;
  const en=()=>document.documentElement.lang==='en', t=value=>Array.isArray(value)?value[en()?1:0]:String(value), p=(ru,english)=>[ru,english];
  const node=(tag,copy,className)=>{const el=document.createElement(tag);if(copy!==undefined)el.textContent=t(copy);if(className)el.className=className;return el;};
  const icon=name=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS('http://www.w3.org/2000/svg','use');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');use.setAttribute('href',`#mm-icon-${name}`);svg.append(use);return svg;};
  const legacy=[
    {id:'body',category:'body',title:p('Состав тела · FFMI · целевой вес','Body composition · FFMI · target weight'),subtitle:p('Жир, LBM, FFMI и normalized FFMI вместе','Fat, LBM, FFMI and normalised FFMI together'),type:'Published equation + scenario',formula:'US Navy / Hodgdon–Beckett; LBM = weight × (1 − BF/100); FFMI = LBM / height²; male reference only: normalised FFMI = FFMI + 6.3 × (1.8 − height); target weight = LBM / (1 − target BF/100)',limits:p('Не измеряет жир напрямую. Целевой вес предполагает сохранение FFM; сценарий погрешности задаёт пользователь, это не доверительный интервал.','Does not measure fat directly. Target weight assumes constant FFM; user-entered sensitivity is not a confidence interval.'),source:models.sources.body,references:[['Hodgdon–Beckett · men · 1984','https://doi.org/10.21236/ADA143890'],['Hodgdon–Beckett · women · 1984','https://doi.org/10.21236/ADA146456']]},
    {id:'nutrition',category:'nutrition',title:p('Калории и БЖУ · QUICK / PRO / adaptive','Calories and macros · QUICK / PRO / adaptive'),subtitle:p('TDEE, цель и калибровка по 14–28 дням','TDEE, targets and 14–28-day calibration'),type:'Published equations + practical calibration',formula:'Mifflin–St Jeor / ten Haaf; TDEE = RMR × PAL. Adaptive: mean intake − Theil–Sen weight slope × assumed 7000–9000 kcal/kg.',limits:p('Не измеряет расход энергии. Калибровка зависит от полноты учёта, воды и соблюдения; качественный наблюдаемый тренд приоритетнее прогностической формулы.','Does not measure energy expenditure. Calibration depends on logging, water and adherence; high-quality observed data take priority over prediction.'),source:['Mifflin et al. 1990','https://pubmed.ncbi.nlm.nih.gov/2305711/'],references:[['ten Haaf & Weijs 2014','https://doi.org/10.1371/journal.pone.0108460'],['Morton et al. 2018','https://pubmed.ncbi.nlm.nih.gov/28698222/'],['Helms et al. 2014 · lean athletes during restriction','https://pubmed.ncbi.nlm.nih.gov/24092765/']]},
    {id:'overfeeding',category:'nutrition',title:p('Переедание и изменение веса','Overeating and weight change'),subtitle:p('Энергетический сценарий, вода и гликоген','Energy scenario, water and glycogen'),type:'MARKOVMADE practical heuristic',formula:'Energy-equivalent surplus / 7700; separate assumed TEF and glycogen-associated water scenarios.',limits:p('Не предсказывает фактическую прибавку жира. Коэффициенты и запасы гликогена меняются.','Does not predict actual fat gain. Energy factors and glycogen stores vary.'),source:['Hall et al. 2011','https://pubmed.ncbi.nlm.nih.gov/21872751/']},
    {id:'recovery',category:'recovery',title:p('Readiness · HRV / RHR baseline','Readiness · HRV / RHR baseline'),subtitle:p('Личные сигналы и минимум 14 наблюдений','Personal signals and at least 14 observations'),type:'MARKOVMADE practical heuristic',formula:'Self-reported weighted signals; personal RHR/HRV baseline = median of last 14–28 valid paired observations.',limits:p('Не медицинский score, не диагноз и не тест готовности. Значения разных устройств несопоставимы.','Not a medical score, diagnosis or readiness test. Different devices are not interchangeable.'),source:['HRV measurement recommendations','https://pubmed.ncbi.nlm.nih.gov/8838590/']},
    {id:'progress',category:'progress',title:p('Тренд веса · плато · ETA · коррекция','Weight trend · plateau · ETA · adjustment'),subtitle:p('Theil–Sen, средние и проверка выбросов','Theil–Sen, averages and outlier review'),type:'Statistical trend + practical heuristic',formula:'Median pairwise daily slopes; moving average; MAD flags. Plateau/ETA/calorie adjustment use practical thresholds.',limits:p('Тренд не отделяет жир от воды. Выбросы требуют проверки, а ETA — условный линейный сценарий.','The trend cannot separate fat from water. Outliers require review and ETA is a conditional linear scenario.'),source:['Sen 1968','https://doi.org/10.1080/01621459.1968.10480934']},
    {id:'strength',category:'training',title:p('Силовой ориентир · e1RM','Strength reference · e1RM'),subtitle:p('Оценка максимума по весу и повторам','Estimate a maximum from load and repetitions'),type:'Published equations',formula:'Epley: load × (1 + reps/30); Brzycki: load × 36/(37 − reps); average for 2–11 reps; Epley only at 12–15; a single rep retains the entered load without confirming maximal effort.',limits:p('Не измеряет реальный 1ПМ. Техника, RIR и упражнение меняют ошибку; не предложение проверять максимум.','Does not measure actual 1RM. Technique, RIR and exercise affect error; not a recommendation to test a maximum.'),source:['Brzycki 1993','https://doi.org/10.1080/07303084.1993.10606684']}
  ].map(item=>({...item,version:['body','recovery','strength'].includes(item.id)?'1.1.0':'1.0.0',review:'2026-11-01'}));
  const retired=new Set(['cardio','adherence','friction','minimum','ifthen','review']);
  const tools=[...legacy,...models.definitions.filter(tool=>!retired.has(tool.id))];
  const primary=['body','nutrition','overfeeding','recovery','progress','strength','plates','progression','caffeine'];
  const parent={recomposition:'body',protein:'nutrition',phase:'progress',circumference:'progress',load:'strength',volume:'strength',sleep:'recovery',fatigue:'recovery'};
  const favoriteKey='markovmade-lab-favorites-v1';
  // Drafts retain disabled quick inputs; submitted PRO records still replace them.
  const captureDraft=form=>Object.fromEntries([...form.elements].filter(field=>field.name&&'value' in field).map(field=>[field.name,field.value]));
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
        const button=node('button',tool.title,'mm-lab-secondary');button.prepend(icon('scenario-'+tool.id));button.type='button';button.dataset.toolId=tool.id;button.addEventListener('click',()=>open(tool));group.append(button);
      }
      root.querySelector(`[data-mm-lab-panel="${key}"]`).append(group);
    }
  }
  root.addEventListener('mm:lab-tab',event=>{
    const activeForm=workspace.querySelector('form');if(selected&&activeForm)drafts[selected]=captureDraft(activeForm);
    const tool=tools.find(tool=>tool.id===event.detail.key);
    if(tool&&legacy.includes(tool)){selected=null;workspace.hidden=true;}
    if(tool&&primary.includes(tool.id)&&!legacy.includes(tool))open(tool,false);
  });
  const numberText=(value,digits=1)=>Number.isFinite(value)?new Intl.NumberFormat(en()?'en-GB':'ru-RU',{maximumFractionDigits:digits}).format(value):'—';
  const modelKinds={body:p('Опубликованная оценка + сценарий','Published estimate + scenario'),nutrition:p('Оценка расхода + план','Expenditure estimate + plan'),overfeeding:p('Сценарий энергобаланса','Energy-balance scenario'),recovery:p('Авторская эвристика','Practical heuristic'),progress:p('Статистическая оценка','Statistical estimate'),strength:p('Опубликованные оценочные формулы','Published estimation equations'),plates:p('Точная арифметика инвентаря','Exact inventory arithmetic'),progression:p('Авторская эвристика','Practical heuristic'),caffeine:p('Условный сценарий','Hypothetical scenario'),recomposition:p('Сценарная арифметика','Scenario arithmetic'),phase:p('Линейный сценарий','Linear scenario'),circumference:p('Арифметика измерений','Measurement arithmetic'),protein:p('Групповые данные · ориентир','Group evidence · reference'),load:p('Формула + эвристика RIR','Equation + RIR heuristic'),volume:p('Точная арифметика подходов','Exact set arithmetic'),sleep:p('Арифметика времени','Time arithmetic'),fatigue:p('Эвристика самонаблюдения','Self-observation heuristic')};
  const svgNode=(tag,attributes={})=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attributes))el.setAttribute(key,String(value));return el;};
  function dataFigure(series,title,unit,xLabel=p('Наблюдения по порядку','Observations in order')){
    const values=series.flatMap(item=>item.points.map(point=>point.y)).filter(Number.isFinite),xs=series.flatMap(item=>item.points.map(point=>point.x)).filter(Number.isFinite);if(!values.length)return node('p',p('Недостаточно наблюдений для графика.','Not enough observations for a chart.'));
    const low=Math.min(...values),high=Math.max(...values),x0=Math.min(...xs),x1=Math.max(...xs),range=Math.max(high-low,Math.abs(high)*.01,.01),figure=node('figure',undefined,'mm-data-figure'),svg=svgNode('svg',{viewBox:'0 0 640 180',preserveAspectRatio:'none',role:'img','aria-label':t(title)+' · '+t(unit)}),svgTitle=svgNode('title');svgTitle.textContent=t(title);svg.append(svgTitle);
    for(let i=0;i<3;i++)svg.append(svgNode('line',{x1:8,x2:632,y1:12+i*78,y2:12+i*78,class:'mm-data-grid'}));
    series.forEach((item,index)=>{const points=item.points.filter(point=>Number.isFinite(point.y)&&Number.isFinite(point.x)).map(point=>({x:12+(point.x-x0)/Math.max(1,x1-x0)*616,y:164-(point.y-low)/range*144,flag:point.flag}));if(!item.scatter)svg.append(svgNode('path',{d:points.map((point,i)=>`${i?'L':'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' '),class:'mm-data-line mm-series-'+index}));for(const point of points)if(item.scatter||points.length===1)svg.append(svgNode('circle',{cx:point.x,cy:point.y,r:4,class:point.flag?'mm-data-point mm-data-flag':'mm-data-point'}));});
    const legend=node('div',undefined,'mm-data-legend');series.forEach((item,index)=>{const label=node('span',item.label,'mm-series-label mm-series-'+index);legend.append(label);});
    figure.append(node('figcaption',title),legend,svg,node('p',p(`Шкала: ${numberText(low,2)}–${numberText(high,2)} ${t(unit)}. `,`Scale: ${numberText(low,2)}–${numberText(high,2)} ${t(unit)}. `),'mm-data-scale'));const ticks=node('div',undefined,'mm-data-x-ticks');for(const x of [x0,(x0+x1)/2,x1])ticks.append(node('span',x0>10000?new Date(x*86400000).toISOString().slice(0,10):numberText(x,1)));figure.append(ticks,node('p',xLabel,'mm-data-axis'));return figure;
  }
  function comparisonRows(entries,title){
    const block=node('section',undefined,'mm-comparison');block.append(node('h4',title));const max=Math.max(1,...entries.map(row=>row.value).filter(Number.isFinite));
    for(const entry of entries){const row=node('div',undefined,'mm-comparison-row'),meter=node('meter');meter.min=0;meter.max=max*1.1;meter.value=Math.max(0,entry.value||0);meter.setAttribute('aria-label',t(entry.label));const unit=t(entry.unit||p('кг','kg')),digits=[t(p('ккал/день','kcal/day')),t(p('мг','mg'))].includes(unit)?0:1,value=Number.isFinite(entry.value)?`${numberText(entry.value,digits)} ${unit}`:'—';meter.setAttribute('aria-valuetext',value);meter.hidden=!Number.isFinite(entry.value);row.append(node('span',entry.label),meter,node('strong',value));block.append(row);}return block;
  }
  function plateDiagram(data,version){
    const block=node('figure',undefined,'mm-plate-diagram'),plates=Array.isArray(data.plates)?data.plates:[],svg=svgNode('svg',{viewBox:'0 0 640 110','aria-hidden':'true'});svg.append(svgNode('line',{x1:12,x2:628,y1:50,y2:50,class:'mm-bar-shaft'}));svg.append(svgNode('rect',{x:240,y:43,width:160,height:14,rx:3,class:'mm-bar-grip'}));
    const spacing=Math.min(24,210/Math.max(1,plates.length));for(const sign of [-1,1])plates.forEach((weight,index)=>svg.append(svgNode('rect',{x:320+sign*(100+index*spacing)-Math.max(3,spacing*.35),y:19,width:Math.max(6,spacing*.7),height:62,rx:2,class:'mm-bar-plate'})));
    block.append(node('figcaption',p('Симметричная загрузка · схема не в масштабе','Symmetric loading · schematic, not to scale')),svg);
    const list=plates.length?plates.map(value=>numberText(value,3)).join(' + '):t(p('без блинов','no plates'));for(const side of [p('Левая сторона','Left side'),p('Правая сторона','Right side')]){const row=node('p');row.append(node('strong',side),document.createTextNode(': '+list+(plates.length?' '+t(p('кг','kg')):'')));block.append(row);}
    if(version==='2.0.0')block.append(node('p',p('Архивная модель не учитывала массу замков.','The archived model did not include collar mass.'),'mm-data-scale'));return block;
  }
  let analysisDays=28;
  function renderLegacyAnalysis(){
    const core=window.MarkovMadeModels;if(!core)return;
    for(const tool of legacy){
      const panel=root.querySelector(`[data-mm-lab-panel="${tool.id}"]`);if(!panel)continue;
      let host=panel.querySelector('[data-analysis="'+tool.id+'"]');if(!host){host=node('section',undefined,'mm-analysis-host');host.dataset.analysis=tool.id;host.dataset.noTranslate='';(tool.id==='progress'?panel.querySelector('.mm-progress-workspace')||panel:panel.querySelector('.mm-lab-result')||panel.querySelector('.mm-lab-e1rm')||panel).append(host);}host.replaceChildren();
      host.append(node('span',modelKinds[tool.id],'mm-model-kind'),node('h4',p('Данные → решение','Data → decision')));
      const state=app.state[tool.id]||{};
      if(!state?.modelVersion&&!(tool.id==='progress'&&readList('markovmade-lab-daily-v1').length)){host.append(node('p',p('После расчёта здесь появятся структура результата, качество данных и сравнения.','Run a calculation to see the result structure, data quality and comparisons.'),'mm-analysis-empty'));continue;}
      if(tool.id==='body'){
        if(!Number.isFinite(state.fatMass)||!Number.isFinite(state.lbm)){host.append(node('p',p('Процент жира не оценён: состав тела не изображается без необходимых данных.','Body fat was not estimated; composition is not drawn without the required data.')));continue;}
        const mass=node('div',undefined,'mm-mass-stack'),fat=node('span'),lean=node('span');fat.style.flexGrow=String(state.fatMass);lean.style.flexGrow=String(state.lbm);fat.className='mm-mass-fat';lean.className='mm-mass-lean';mass.setAttribute('role','img');mass.setAttribute('aria-label',`${t(p('Жировая масса','Fat mass'))} ${numberText(state.fatMass)}; ${t(p('безжировая масса','fat-free mass'))} ${numberText(state.lbm)} ${t(p('кг','kg'))}`);mass.append(fat,lean);host.append(mass,comparisonRows([{label:p('Жировая масса · оценка','Fat mass · estimate'),value:state.fatMass},{label:p('Безжировая масса · оценка','Fat-free mass · estimate'),value:state.lbm}],p('Компоненты текущей оценки','Components of the current estimate')));
        const sensitivity=state.sensitivity;
        if(sensitivity?.supplied){const list=node('dl',undefined,'mm-analysis-metrics');for(const [label,lo,hi,unit]of [[p('BF · ваше допущение','BF · your assumption'),sensitivity.low.bodyFat,sensitivity.high.bodyFat,'%'],[p('Безжировая масса','Fat-free mass'),sensitivity.high.leanMass,sensitivity.low.leanMass,t(p('кг','kg'))],[p('FFMI','FFMI'),sensitivity.high.ffmi,sensitivity.low.ffmi,'']]){list.append(node('dt',label),node('dd',`${numberText(lo)}–${numberText(hi)} ${unit}`));}host.append(node('p',p('Чувствительность к введённой погрешности. Это сценарий, не доверительный интервал.','Sensitivity to your entered uncertainty. A scenario, not a confidence interval.')),list);}else host.append(node('p',p('Индивидуальная погрешность неизвестна. При необходимости задайте отдельный сценарий ± п.п. в форме.','Individual error is unknown. Enter an optional ± percentage-point scenario in the form.')));
        if(Number.isFinite(state.targetWeight))host.append(comparisonRows([{label:p('Сейчас · введённый вес','Current · entered weight'),value:state.fatMass+state.lbm},{label:p('Цель · неизменная FFM','Target · constant FFM'),value:state.targetWeight}],p('Условный целевой сценарий','Conditional target scenario')));
        const previous=state.measurementMethod!=='unknown'&&readList('markovmade-lab-history-v1').filter(row=>row.tool==='body'&&row.result?.measurementMethod===state.measurementMethod&&row.result.assessmentMethod===state.assessmentMethod&&row.result.height===state.height&&row.result.sex===state.sex&&Number.isFinite(row.result.lbm)&&row.result.calculatedAt!==state.calculatedAt&&Date.parse(row.at)<Date.parse(state.calculatedAt)).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))[0];
        if(previous)host.append(node('p',p(`Предыдущая запись того же метода: FFM ${numberText(previous.result.lbm)} → ${numberText(state.lbm)} кг. Условия замера не подтверждены; изменение не равно росту мышц.`,`Previous record using the same method: FFM ${numberText(previous.result.lbm)} → ${numberText(state.lbm)} kg. Conditions are unverified; the change is not muscle growth.`)));
      }
      if(tool.id==='nutrition'){
        host.append(comparisonRows([{label:state.tdeeMethod==='фактические калории поддержания'?p('Введённое поддержание','Entered maintenance'):state.tdeeMethod?p('Модельное поддержание','Modelled maintenance'):p('Поддержание · источник не записан','Maintenance · source not recorded'),value:Number.isFinite(state.formulaTdee)?state.formulaTdee:state.tdee,unit:p('ккал/день','kcal/day')},...(state.calibration?[{label:p('По наблюдениям · оценка','From observations · estimate'),value:state.tdee,unit:p('ккал/день','kcal/day')}]:[]),{label:p('Выбранный план · сценарий','Selected plan · scenario'),value:state.target,unit:p('ккал/день','kcal/day')}],p('Оценка расхода и выбранный план','Expenditure estimate and selected plan')));
        host.append(node('p',state.calibration?p(`Наблюдений: ${state.calibration.days} дней; полнота ${state.calibration.completenessPct}%. Энергоэквивалент 7000–9000 ккал/кг — чувствительность модели, не константа ткани.`,`Observations: ${state.calibration.days} days; completeness ${state.calibration.completenessPct}%. 7000–9000 kcal/kg is a sensitivity assumption, not a tissue constant.`):p('Наблюдаемая калибровка пока отсутствует. Для неё нужны 14–28 ежедневных весов и питание за тот же период.','Observed calibration is unavailable. It needs 14–28 daily weights and intake from the same period.')));
        const multiplier=state.goal==='cut'?[.9,.83,.77]:state.goal==='bulk'?[1.04,1.07,1.1]:[.96,1,1.04];host.append(comparisonRows(multiplier.map((value,index)=>({label:p(`Сценарий ${index+1} · ${numberText((value-1)*100,0)}%`,`Scenario ${index+1} · ${numberText((value-1)*100,0)}%`),value:state.tdee*value,unit:p('ккал/день','kcal/day')})),p('Альтернативы для обсуждения, не назначения','Alternatives to consider, not prescriptions')),node('p',p('Диапазоны плана — выбранный запас. Ошибки учёта питания, вода и неодинаковые условия взвешивания влияют на калибровку.','Plan ranges are chosen margins. Food-logging error, water and inconsistent weighing affect calibration.')));
      }
      if(tool.id==='overfeeding'){
        host.append(comparisonRows([{label:p('Жировой эквивалент · нижний сценарий','Fat equivalent · lower scenario'),value:state.low},{label:p('Жировой эквивалент · верхний сценарий','Fat equivalent · upper scenario'),value:state.high},{label:p('Гликоген + вода · верхний сценарий','Glycogen + water · upper scenario'),value:state.glyWaterHigh}],p('Факторы краткосрочного изменения массы','Factors in short-term scale change')),node('p',p('Эти сценарии нельзя складывать как измеренные компоненты прибавки. Содержимое ЖКТ, натрий и другая вода не оценены. Один эпизод не задаёт точный прирост жировой ткани.','These scenarios cannot be added as measured components of weight gain. Gut contents, sodium and other water are not estimated. One episode does not determine exact fat gain.')));
      }
      if(tool.id==='recovery'){
        const now=new Date(),endDate=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-'),baseline=core.datedRecoveryBaseline(state.history||[],{device:state.device||'',endDate});host.append(node('p',p(`Сопоставимых дат RHR/HRV: ${baseline.days}/14. Устройство/протокол: ${baseline.device||'не указан'}. Балл выше — отдельная авторская эвристика.`,`Comparable RHR/HRV dates: ${baseline.days}/14. Device/protocol: ${baseline.device||'not recorded'}. The score above is a separate practical heuristic.`)));
        if(!baseline.deviceVerified)host.append(node('p',p('Без указанного устройства и протокола эти записи не становятся автоматическим baseline. При необходимости явно введите свой обычный RHR/HRV.','Without a recorded device and protocol, these records do not form an automatic baseline. You can explicitly enter your usual RHR/HRV.')));
        for(const [key,title,unit]of [['rhr',p('Пульс покоя · наблюдения','Resting heart rate · observations'),p('уд/мин','bpm')],['hrv',p('HRV · наблюдения одного протокола','HRV · same-protocol observations'),p('мс','ms')]])if(baseline.sample.length)host.append(dataFigure([{label:p('Введённые измерения','Entered measurements'),scatter:true,points:baseline.sample.map(row=>({x:Date.parse(row.date)/86400000,y:row[key]}))}],title,unit,p('Реальные даты; пропуски не заполнены','Actual dates; missing days are not filled')));
        const sleep=(Array.isArray(state.observations)?state.observations:[]).filter(row=>Number.isFinite(row.sleepHours)&&row.sleepHours>=0&&row.sleepHours<=16);if(sleep.length)host.append(dataFigure([{label:p('Введённая длительность','Entered duration'),scatter:true,points:sleep.map(row=>({x:Date.parse(row.date)/86400000,y:row.sleepHours}))}],p('Сон · записанная длительность','Sleep · recorded duration'),p('ч','h')));
        host.append(node('p',p('HRV зависит от устройства, метрики, позы, дыхания и времени записи. Разные протоколы не объединяются в baseline. Это не диагностика и не прогноз тренировки.','HRV depends on device, metric, posture, breathing and timing. Different protocols are not combined into a baseline. This is not diagnosis or a workout prediction.')));
      }
      if(tool.id==='progress'){
        const controls=node('div',undefined,'mm-analysis-windows');controls.setAttribute('role','group');controls.setAttribute('aria-label',t(p('Период дневника','Journal window')));for(const days of [7,14,28]){const button=node('button',p(`${days} дней`,`${days} days`),'mm-lab-secondary');button.type='button';button.setAttribute('aria-pressed',String(days===analysisDays));button.addEventListener('click',()=>{analysisDays=days;renderLegacyAnalysis();root.querySelector(`[data-analysis="progress"] button[aria-pressed="true"]`)?.focus({preventScroll:true});});controls.append(button);}host.append(controls);
        const trend=core.datedTrend(readList('markovmade-lab-daily-v1'),analysisDays);host.append(node('p',p(`Дневник: ${trend.count}/${analysisDays} дат с весом; промежуток ${trend.span} дней. Соблюдение известно за ${trend.adherenceCount} дат.`,`Journal: ${trend.count}/${analysisDays} weight dates; ${trend.span} elapsed days. Adherence is known on ${trend.adherenceCount} dates.`)));
        if(!trend.ready)host.append(node('p',p('Для устойчивого тренда этого окна нужны ≥7 дат и ≥6 дней. Ручной ряд выше остаётся отдельным анализом; пропуски дневника не заменяются предположениями.','A robust trend in this window needs ≥7 dates over ≥6 days. The manual series above remains separate; journal gaps are not replaced by assumptions.')));
        if(trend.count)host.append(node('p',p(`Даты окна: ${trend.observations[0].date} — ${trend.observations.at(-1).date}. Окно заканчивается последней записью, не обязательно сегодня.`,`Recorded window: ${trend.observations[0].date} — ${trend.observations.at(-1).date}. The window ends at the latest entry, which may not be today.`)));if(trend.count){const origin=trend.observations[0].day,series=[{label:p('Реальные веса','Actual weights'),scatter:true,points:trend.observations.map(row=>({x:row.day-origin,y:row.weight,flag:trend.flags.includes(row.date)}))}];if(trend.ready)series.push({label:p('Theil–Sen · оценка','Theil–Sen estimate'),points:[{x:0,y:trend.intercept},{x:trend.span,y:trend.intercept+trend.dailySlope*trend.span}]});host.append(dataFigure(series,p('Дневник · вес и устойчивый тренд','Journal · weight and robust trend'),p('кг','kg'),p('Дни от первой записи; пропуски сохранены','Days since the first entry; gaps are preserved')));if(trend.ready)host.append(node('p',p(`Темп: ${numberText(trend.weeklySlope,2)} кг/нед. Разброс наблюдений: ${numberText(trend.min)}–${numberText(trend.max)} кг. Проверьте ${trend.flags.length} возможных выбросов; они сохранены.`,`Rate: ${numberText(trend.weeklySlope,2)} kg/week. Observed spread: ${numberText(trend.min)}–${numberText(trend.max)} kg. Review ${trend.flags.length} possible outliers; they remain stored.`)));if(trend.waistChange!==null)host.append(node('p',p(`Талия: ${numberText(trend.waistChange)} см за окно. Это отдельный замер, не доля жировой ткани.`,`Waist: ${numberText(trend.waistChange)} cm over the window. A separate measurement, not a fat-tissue fraction.`)));}
      }
      if(tool.id==='strength'){
        const history=(Array.isArray(state.history)?state.history:[]).filter(row=>Number.isFinite(row.value)&&Number.isFinite(row.load));if(!history.length)continue;const latest=history.at(-1),same=history.filter(row=>row.exercise===latest.exercise),verified=same.filter(row=>latest.protocol&&row.protocol===latest.protocol&&Number.isFinite(row.rir)&&row.rir===latest.rir);
        host.append(dataFigure([{label:p('Записанные оценки e1RM','Recorded e1RM estimates'),scatter:true,points:same.map((row,index)=>({x:index,y:row.value}))}],p('История одного упражнения','Single-exercise history'),p('кг','kg'),p('Порядок реальных записей, не прогноз','Actual record order, not a forecast')),node('p',p(`Записей упражнения: ${same.length}; с совпадающими указанными протоколом и RIR: ${verified.length}. Совпадение меток не подтверждает технику автоматически.`,`Exercise records: ${same.length}; matching entered protocol and RIR: ${verified.length}. Matching labels do not automatically verify technique.`)));
        const details=node('details',undefined,'mm-evidence');details.append(node('summary',p('Вес, повторы и RIR в записях','Recorded load, reps and RIR')));const list=node('ol');same.slice(-12).forEach(row=>list.append(node('li',`${row.date||'—'} · ${numberText(row.load)} ${t(p('кг','kg'))} × ${row.reps} · RIR ${row.rir??'—'} · ${row.protocol||t(p('протокол не указан','protocol not recorded'))}`)));details.append(list);host.append(details,node('p',p('e1RM — оценка по Epley/Brzycki, а не измеренный максимум. Тоннаж сравнивайте внутри одного упражнения; он не измеряет стимул гипертрофии.','e1RM is an Epley/Brzycki estimate, not a measured maximum. Compare tonnage within one exercise; it does not measure hypertrophy stimulus.')));
      }
      if(state.calculatedAt)host.append(node('p',t(p('Расчёт обновлён: ','Calculated: '))+new Date(state.calculatedAt).toLocaleString(en()?'en-GB':'ru-RU'),'mm-analysis-date'));
    }
  }

  function evidence(definition){
    const details=node('details',undefined,'mm-evidence'),toggle=node('summary',p('Методика и источники','Method and sources'));
    details.append(toggle,node('p',modelKinds[definition.id]||definition.type,'mm-evidence-type'),node('p',definition.formula),node('p',definition.limits));
    const accuracy=node('p',p('Предположения: корректные единицы и сопоставимые наблюдения. Формула описывает оценку, а не индивидуальную валидацию.','Assumptions: correct units and comparable observations. A formula describes an estimate, not individual validation.'));details.append(accuracy);
    if(definition.source){for(const source of [definition.source,...(definition.references||[])]){const link=node('a',source[0]);link.href=source[1];link.target='_blank';link.rel='noopener noreferrer';details.append(link);}}
    else details.append(node('p',p('Источник правила: MARKOVMADE. Внешняя валидация этого правила не заявлена.','Rule source: MARKOVMADE. External validation is not claimed.')));
    details.append(node('p',`MARKOVMADE ${definition.version} · ${t(p('Проверено','Reviewed'))} ${definition.review}`));return details;
  }
  function outcome(definition,result,saved=false){
    const out=node('div',undefined,'mm-toolkit-outcome');
    out.append(node('span',saved?p('Сохранённый расчёт','Saved calculation'):p('Расчёт','Estimate'),'mm-toolkit-result-label'),node('p',result.value,'mm-toolkit-value'),node('p',result.meaning,'mm-toolkit-meaning'));
    if(result.modelVersion&&result.modelVersion!==definition.version)out.append(node('p',p(`Модель снимка: ${result.modelVersion}. Новый расчёт: ${definition.version}.`,`Snapshot model: ${result.modelVersion}. New calculation: ${definition.version}.`),'mm-toolkit-meaning'));
    if(definition.id==='load'&&result.modelVersion==='2.0.0')out.append(node('p',p('Архивная модель округляла к ближайшему шагу, иногда выше исходного ориентира. Перед планированием нагрузки пересчитайте в текущей версии.','The archived model rounded to the nearest increment, sometimes above the original reference. Recalculate with the current version before planning a load.'),'mm-toolkit-meaning'));
    out.insertBefore(node('span',modelKinds[definition.id]||p('Расчёт','Calculation'),'mm-model-kind'),out.firstChild);
    const confidence={high:p('Высокая · для арифметики введённых данных','High · for arithmetic on your inputs'),moderate:p('Умеренная','Moderate'),low:p('Низкая','Low')};
    const action=node('section',undefined,'mm-toolkit-next-step');action.append(node('h4',p('Следующий шаг','Next step')));
    const actions=node('ol');result.actions.forEach(item=>actions.append(node('li',item)));action.append(actions);out.append(action);
    const precision=node('details',undefined,'mm-toolkit-precision');precision.append(node('summary',p('Уверенность и ограничения','Confidence and limits')),node('p',confidence[result.confidence]||confidence.low),node('p',result.uncertainty));
    const accuracy=node('details',undefined,'mm-toolkit-precision');accuracy.append(node('summary',p('Как улучшить точность','How to improve accuracy')),node('p',result.accuracy));
    out.append(precision,accuracy);
    if(definition.id==='caffeine'){
      const doses=result.data?.doses;
      if(Array.isArray(doses)&&doses.length){
        const chart=node('div',undefined,'mm-caffeine-scenarios');
        chart.append(node('h4',p('Сценарии выведения · все введённые дозы','Elimination scenarios · all entered doses')));
        const summary=node('p',p('Сумма введённых доз: '+result.data.totalDose+' мг. Условный остаток при трёх скоростях выведения.','Total entered intake: '+result.data.totalDose+' mg. Hypothetical remaining amounts under three elimination rates.'),'mm-caffeine-summary');chart.append(summary);
        for(const scenario of result.data.scenarios||[]){
          const half=scenario.halfLife,remaining=scenario.remaining,row=node('div',undefined,'mm-caffeine-row'),bar=node('meter');bar.min=0;bar.max=Math.max(1,result.data.totalDose);bar.value=remaining;
          bar.setAttribute('aria-label',t(p(half+' ч: '+Math.round(remaining)+' мг',half+' h: '+Math.round(remaining)+' mg')));
          row.append(node('span',p(half+' ч',half+' h')),bar,node('strong',p(Math.round(remaining)+' мг',Math.round(remaining)+' mg')));chart.append(row);
        }
        chart.append(node('p',p('Не определяет индивидуальное время выведения, качество сна или безопасную дозу.','Does not determine individual clearance, sleep quality or a safe dose.'),'mm-caffeine-caption'));
        out.insertBefore(chart,action);
      }
    }
    if(definition.id==='plates'&&result.data){
      const data=result.data,detail=node('div',undefined,'mm-plate-breakdown');
      detail.append(node('h4',p('Состав комплекта','Load breakdown')));
      const values=[p('Гриф','Bar'),p('Замки · всего','Collars · total'),p('Блины · каждая сторона','Plates · each side')];
      const quantities=[Number.isFinite(data.bar)?data.bar+' кг':'—',Number.isFinite(data.collars)?data.collars+' кг':t(p('Не учтены в архиве','Not included in archive')),Number.isFinite(data.perSide)?data.perSide+' кг':(data.plates||[]).reduce((sum,value)=>sum+value,0)+' кг'];
      for(let i=0;i<values.length;i++){const row=node('div',undefined,'mm-plate-row');row.append(node('span',values[i]),node('strong',p(quantities[i],quantities[i].replace('кг','kg'))));detail.append(row);}
      detail.append(plateDiagram(data,result.modelVersion));
      if(Number.isFinite(data.above)&&!data.exact){detail.append(node('p',p('Для сравнения: следующий достижимый вес '+data.above+' кг. Не рекомендация увеличивать нагрузку.','For comparison: next achievable load '+data.above+' kg. Not an instruction to increase load.'),'mm-plate-caution'));if(data.abovePlates)detail.append(plateDiagram({...data,plates:data.abovePlates},result.modelVersion));}
      out.insertBefore(detail,action);
    }
    if(definition.id==='caffeine'&&result.data?.timeline){
      const data=result.data,figure=dataFigure(data.timeline.map(item=>({label:p(`Полувыведение ${item.halfLife} ч`,`Half-life ${item.halfLife} h`),points:item.points.map(point=>({x:-point.hoursBeforeBed,y:point.remaining}))})),p('Условное количество до сна','Hypothetical amount before bedtime'),p('мг','mg'),p('От −24 часов до сна (0). Скачки соответствуют введённым дозам.','From −24 hours to bedtime (0). Increases correspond to entered doses.'));
      out.insertBefore(figure,action);
      const comparison=comparisonRows(data.earlierScenarios.map(item=>({label:p(`Последняя доза раньше · ${item.halfLife} ч`,`Earlier last dose · ${item.halfLife} h`),value:item.remaining,unit:p('мг','mg')})),p('Сдвиг последней дозы до 2 часов раньше','Move the last dose up to 2 hours earlier'));
      comparison.append(node('p',p('Остальные дозы неизменны. Сдвиг ограничен 24-часовым окном; это сценарий, а не прогноз улучшения сна.','Other doses stay unchanged. The shift is limited by the 24-hour window; this is a scenario, not a sleep improvement forecast.')));out.insertBefore(comparison,action);
      if(data.referenceExceeded)out.insertBefore(node('p',p('Сумма превышает ориентир EFSA 400 мг/день для здоровых взрослых. Этот ориентир не является персональной безопасной дозой и не относится к беременности.','The total exceeds EFSA’s 400 mg/day reference for healthy adults. This is not an individual safe dose and does not apply to pregnancy.'),'mm-plate-caution'),action);
    }
    if(definition.id==='progression'&&result.data?.sessions)out.insertBefore(node('p',p(`Записано сессий: ${result.data.sessions.length}. Условия сравниваются по введённым подписям; фактическая техника не проверяется.`,`Recorded sessions: ${result.data.sessions.length}. Comparison uses your protocol labels; actual technique is not verified.`)),action);
    return out;
  }
  function recordEditor(tool,field,raw){
    const disclosure=node('details',undefined,'mm-record-disclosure'),toggle=node('summary',field.label);disclosure.dataset.recordDisclosure=field.key;disclosure.append(toggle);
    disclosure.addEventListener('invalid',()=>{disclosure.open=true;},true);
    const group=node('fieldset',undefined,'mm-record-editor');group.dataset.recordEditor=field.key;group.append(node('legend',field.recordKind==='caffeine'?p('Источники и дозы','Sources and doses'):p('Записанные тренировки','Recorded workouts')));
    const hidden=node('input');hidden.type='hidden';hidden.id='toolkit-'+tool.id+'-'+field.key;hidden.name=field.key;group.append(hidden);
    const caffeine=field.recordKind==='caffeine',specs=caffeine?[['source',p('Источник','Source'),'text'],['dose',p('Доза · мг','Dose · mg'),'number',.1,600],['time',p('Время приёма','Dose time'),'time']]:[['exercise',p('Упражнение','Exercise'),'text'],['load',p('Вес · кг','Load · kg'),'number',1,500],['sets',p('Подходы','Sets'),'number',1,30],['reps',p('Минимум повторов','Fewest reps'),'number',1,30],['rir',p('Минимальный RIR','Lowest RIR'),'number',0,5],['technique',p('Протокол техники','Technique protocol'),'text'],['rom',p('Амплитуда · протокол','Range · protocol'),'text'],['rest',p('Отдых · секунд','Rest · seconds'),'number',15,900]];
    let records=[];try{const value=JSON.parse(raw||'[]');if(Array.isArray(value))records=value;}catch{}
    if(!records.length)records=caffeine?[{}]:[{},{}];
    const rows=node('div',undefined,'mm-record-rows'),add=node('button',caffeine?p('Добавить источник','Add source'):p('Добавить сессию','Add session'),'mm-lab-secondary');add.type='button';
    const sync=()=>{const entered=records.filter(record=>Object.values(record).some(value=>value!==null&&value!==undefined&&value!==''));hidden.value=entered.length?JSON.stringify(entered):'';
      toggle.textContent=t(field.label)+(entered.length?' · '+entered.length+' '+t(p('активных','active')):'');
      const form=group.closest('form');if(form){for(const key of caffeine?['dose','hours','extra']:['load','reps','rir','sessions','comparable']){const input=form.elements.namedItem(key);if(input)input.disabled=Boolean(entered.length);}if(caffeine&&form.elements.bedtime)form.elements.bedtime.required=Boolean(entered.length);}
    };
    function render(focus=false){rows.replaceChildren();records.forEach((record,index)=>{
      const row=node('fieldset',undefined,'mm-record-row');row.append(node('legend',caffeine?p(`Источник ${index+1}`,`Source ${index+1}`):p(`Сессия ${index+1}`,`Session ${index+1}`)));
      const grid=node('div',undefined,'mm-record-fields');for(const [key,label,type,min,max]of specs){const cell=node('div',undefined,'mm-lab-field'),id=`toolkit-${tool.id}-${field.key}-${index}-${key}`,caption=node('label',label),input=node('input');caption.htmlFor=id;input.id=id;input.type=type;input.className='mm-lab-input';input.value=record[key]??'';
        if(type==='number'){input.min=min;input.max=max;input.step=['reps','sets','rest'].includes(key)?'1':'any';input.inputMode='decimal';}if(type==='text')input.maxLength=80;
        input.addEventListener('input',()=>{record[key]=type==='number'?(input.value===''?null:Number(input.value)):input.value;sync();});cell.append(caption,input);grid.append(cell);
      }
      const remove=node('button',caffeine?p('Удалить источник','Remove source'):p('Удалить сессию','Remove session'),'mm-lab-secondary');remove.type='button';remove.setAttribute('aria-label',t(caffeine?p(`Удалить источник ${index+1}`,`Remove source ${index+1}`):p(`Удалить сессию ${index+1}`,`Remove session ${index+1}`)));remove.addEventListener('click',()=>{const previous=hidden.value;records.splice(index,1);render();if(hidden.value!==previous)hidden.dispatchEvent(new Event('input',{bubbles:true}));add.focus();});row.append(grid,remove);rows.append(row);
    });sync();if(focus)rows.lastElementChild?.querySelector('input')?.focus();add.disabled=records.length>=(caffeine?9:12);}
    add.addEventListener('click',()=>{records.push({});render(true);});
    group.append(node('p',caffeine?p('Эти строки заменяют быстрый ввод доз выше. Укажите время сна; часы относятся к предшествующим 24 часам.','These rows replace the quick dose inputs above. Enter bedtime; clock times refer to the preceding 24 hours.'):p('Эти записи заменяют вес, повторы и RIR быстрого режима. Верх диапазона и доступный шаг берутся из полей выше. Одинаковые названия протокола не доказывают одинаковую технику.','These records replace quick-mode load, reps and RIR. The rep ceiling and increment come from the fields above. Matching protocol names do not prove identical technique.'),'mm-record-hint'),rows,add);render();group.sync=sync;disclosure.append(group);disclosure.open=Boolean(hidden.value);return disclosure;
  }

  function open(tool,focus=true){
    if(!tool)return;
    const key=parent[tool.id]||tool.id;
    const tab=root.querySelector(`[data-mm-lab-tab="${key}"]`);
    if(tab?.getAttribute('aria-selected')!=='true')tab?.click();
    const activeForm=workspace.querySelector('form');if(selected&&activeForm)drafts[selected]=captureDraft(activeForm);
    selected=tool.id;
    if(legacy.includes(tool)){
      workspace.hidden=true;root.querySelector(`[data-mm-lab-tab="${tool.id}"]`).click();
      const panel=document.getElementById('mm-lab-'+tool.id);panel.setAttribute('tabindex','-1');panel.focus({preventScroll:true});panel.scrollIntoView({block:'start',behavior:'auto'});return;
    }
    root.querySelector(`[data-mm-lab-panel="${key}"]`).append(workspace);workspace.hidden=false;workspace.replaceChildren();const title=node('h3',tool.title);title.id='mm-toolkit-active-title';title.tabIndex=-1;
    const form=node('form'),fields=node('div',undefined,'mm-toolkit-fields');form.noValidate=false;
    const previous=app.state.toolkit?.[tool.id]?.inputs||{};
    for(const field of tool.fields){
      if(field.type==='records'){const editor=recordEditor(tool,field,drafts[tool.id]?.[field.key]??previous[field.key]??field.value);if(field.recordKind==='caffeine'){const bedtime=fields.querySelector('#toolkit-caffeine-bedtime')?.closest('.mm-lab-field');if(bedtime)editor.querySelector('legend').after(bedtime);}fields.append(editor);continue;}
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
    fields.querySelectorAll('[data-record-editor]').forEach(editor=>editor.sync());
    if(app.state.toolkit?.[tool.id]?.result)output.replaceChildren(outcome(tool,app.state.toolkit[tool.id].result,true));
    form.addEventListener('input',()=>{const label=output.querySelector('.mm-toolkit-result-label'),message=t(p('Параметры изменены · пересчитайте результат','Inputs changed · run the calculation again'));if(label&&label.textContent!==message)label.textContent=message;});
    form.addEventListener('submit',event=>{
      event.preventDefault();const inputs=Object.fromEntries(new FormData(form));
      try{
        const result=models.calculate(tool.id,inputs);error.textContent='';
        app.state.toolkit=app.state.toolkit||{};app.state.toolkit[tool.id]={inputs,result,at:new Date().toISOString(),modelVersion:tool.version};
        for(const field of tool.fields)if(field.profile)app.state.profile[field.profile]=Number(inputs[field.key]);
        try{localStorage.setItem('markovmade-lab-v1',JSON.stringify(app.state));}catch{error.textContent=t(p('Результат рассчитан, но браузер не сохранил данные.','Calculated, but the browser could not save the data.'));}
        root.querySelectorAll('[data-profile]').forEach(input=>{if(app.state.profile[input.dataset.profile]!=null)input.value=app.state.profile[input.dataset.profile];});
        output.replaceChildren(outcome(tool,result));renderSummary();output.scrollIntoView({block:'nearest',behavior:'auto'});root.dispatchEvent(new CustomEvent('mm:toolkit-result',{detail:{id:tool.id,result}}));
      }catch{const messages={caffeine:p('Проверьте дозировки и время. Для PRO нужны источник, доза, время каждой записи и время сна. В быстром режиме дополнительные дозы: 100@12; 50@4.','Check doses and times. PRO needs a source, dose and time for each record and a bedtime. Quick-mode extra doses: 100@12; 50@4.'),plates:p('Цель должна быть не меньше грифа. Укажите до 24 блинов на сторону через ;. Дроби — через точку или запятую; точность до 0.001 кг.','The target must be at least the bar. List up to 24 plates per side, separated by ;, to 0.001 kg precision. Decimal point or comma is accepted.'),volume:p('Запишите подходы как 8 x 60; 7 x 62.5. Не больше 30 подходов, повторы — целые числа.','Enter sets as 8 x 60; 7 x 62.5. Up to 30 sets; repetitions must be whole numbers.'),sleep:p('Проверьте время сна и подъёма. Время бодрствования не должно превышать окно сна.','Check bedtime and wake time. Time awake cannot exceed the sleep opportunity.')};error.textContent=t(messages[tool.id]||p('Проверьте значения, единицы измерения и целые числа в полях повторов и сессий.','Check values, units and whole numbers for repetitions and sessions.'));error.scrollIntoView({block:'nearest',behavior:'auto'});}
    });
    if(focus){title.focus({preventScroll:true});workspace.scrollIntoView({block:'start',behavior:'auto'});}
  }
  function renderSummary(){
    summary.replaceChildren();summary.hidden=false;const summaryHead=node('div',undefined,'mm-toolkit-summary-head'),summaryBrand=node('div',undefined,'mm-toolkit-summary-brand');summaryBrand.append(icon('lock'),node('span',p('Сводка · хранится в браузере','Summary · stored on this device'),'mm-toolkit-summary-kicker'));summaryHead.append(summaryBrand);const title=node('h3','MARKOVMADE SUMMARY');title.id='mm-toolkit-summary-title';summaryHead.append(title);summary.append(summaryHead);
    const complete=legacy.filter(tool=>app.state[tool.id]?.modelVersion),extra=Object.entries(app.state.toolkit||{}).filter(([,value])=>value.result);const total=complete.length+extra.length;
    const lastTwo=total%100,last=total%10,calculationWord=total===1?'расчёта':last>=2&&last<=4&&(lastTwo<12||lastTwo>14)?'расчёта':'расчётов';
    summary.append(node('p',total?t(p(`Здесь собраны результаты ${total} ${calculationWord} из этого браузера.`,`Your results from ${total} calculation${total===1?'':'s'} on this device.`)):p('Сделайте первый расчёт — здесь появятся показатели и следующий шаг.','Run your first calculation to see your key measures and next step here.')));
    if(!total){summary.hidden=true;return;}
    const entries=[['weight',p('Вес · введённый профиль','Weight · entered profile'),app.state.profile.weight?`${app.state.profile.weight} ${en()?'kg':'кг'}`:null,'scale'],['bodyFat',p('Процент жира · оценка','Estimated body fat'),app.state.body?.bf?`${app.state.body.bf.toFixed(1)}%`:null,'body'],['tdee',p('Поддержание · оценка','Estimated maintenance'),Number.isFinite(app.state.nutrition?.tdee)?`${Math.round(app.state.nutrition.tdee)} ${en()?'kcal/day':'ккал/день'}`:null,'calories'],['trend',p('Изменение веса за неделю','Weekly weight change'),Number.isFinite(app.state.progress?.weekly)?`${app.state.progress.weekly>0?'+':''}${app.state.progress.weekly.toFixed(2)} ${en()?'kg/week':'кг/нед.'}`:null,'trend']];
    const metrics=node('div',undefined,'mm-toolkit-summary-metrics');
    entries.forEach(([key,label,value,iconName])=>{if(!value)return;const card=node('article',undefined,'mm-summary-metric'),index=String(metrics.children.length+1).padStart(2,'0');card.append(node('span',index,'mm-summary-metric-index'),icon(iconName),node('span',label,'mm-summary-metric-label'),node('strong',value,'mm-summary-metric-value'));card.children[1].classList.add('mm-summary-metric-icon');const at={bodyFat:app.state.body?.calculatedAt,tdee:app.state.nutrition?.calculatedAt,trend:app.state.progress?.calculatedAt}[key],known=typeof at==='string'&&Number.isFinite(Date.parse(at));card.append(node('small',known?new Date(at).toLocaleString(en()?'en-GB':'ru-RU'):key==='weight'?p('Дата ввода не записана','Entry date not recorded'):p('Дата расчёта не записана','Calculation date not recorded'),'mm-summary-metric-date'));metrics.append(card);});summary.append(metrics);const dates=legacy.map(tool=>app.state[tool.id]?.calculatedAt).concat(Object.values(app.state.toolkit||{}).map(record=>record.at)).filter(value=>Number.isFinite(Date.parse(value))).sort();summary.append(node('p',dates.length?p('Последний известный расчёт: ','Latest recorded calculation: '):p('У архивных записей дата расчёта может быть неизвестна.','Archived records may have no calculation timestamp.'),'mm-analysis-date'));if(dates.length)summary.lastElementChild.append(document.createTextNode(new Date(dates.at(-1)).toLocaleString(en()?'en-GB':'ru-RU')));
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
          content+=t(tool.title)+'\n'+(value||'—')+'\n'+(meaning||t(tool.subtitle))+'\n'+t(tool.limits)+'\n'+[...panel.querySelectorAll('#lab-'+prefix+'-actions li')].map(el=>el.textContent).join('\n')+'\n'+tool.type+' · '+(app.state[tool.id].modelVersion||tool.version)+' · '+tool.review+'\n'+(tool.source?.join(' ')||'MARKOVMADE')+'\n\n';
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
        const result={value:`e1RM ≈ ${entry.value.toFixed(1)} kg`,meaning:p('Ориентир для сравнения одинакового упражнения. Не проверяйте реальный максимум только на основании расчёта.','A reference for comparing the same exercise. Do not test a real maximum solely on this estimate.'),confidence:entry.reps>1&&entry.reps<=5?'moderate':'low',uncertainty:tool.limits,actions:[p('Выберите рабочий вес в инструменте %1RM / RIR и проверьте его разминкой.','Choose a working load with the %1RM / RIR tool and check it in warm-up.')],accuracy:p('Используйте одинаковую технику и учитывайте повторы в запасе.','Use consistent technique and account for reps in reserve.')};
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
      const heuristic=['strategy','recovery','overfeeding'].includes(tool.id),limited=heuristic||/низкая|ограниченная|low|limited/i.test(state.confidence||'')||(tool.id==='progress'&&(state.dailyCount||0)<7);
      body.append(node('p',heuristic?p('Уверенность: низкая · практическая эвристика','Confidence: low · practical heuristic'):limited?p('Уверенность: низкая','Confidence: low'):p('Уверенность: умеренная','Confidence: moderate')));
      body.append(node('p',tool.limits));
      const accuracy=node('details');accuracy.append(node('summary',p('Как улучшить точность','How to improve accuracy')),node('p',result.accuracy));body.append(accuracy);component.append(body);panel.append(component);
    }
  }
  function localise(){renderLegacyAnalysis();renderScenarios();renderSummary();legacyEvidence();window.mmLanguageReady?.then(legacyResult);if(selected&&models.definitions.some(item=>item.id===selected))open(models.definitions.find(item=>item.id===selected),false);}
  new MutationObserver(localise).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  root.addEventListener('mm:lab-state',()=>{renderSummary();legacyResult();renderLegacyAnalysis();});
  document.addEventListener('mm:daily-updated',()=>{renderSummary();renderLegacyAnalysis();});
  root.addEventListener('click',event=>{if(event.target.closest('[data-calc]'))setTimeout(()=>{legacyResult();renderLegacyAnalysis();},0);});
  document.getElementById('mm-lab-clear-all')?.addEventListener('click',()=>{
    renderSummary();
    if(!app.state.toolkit){
      const active=root.querySelector('[data-mm-lab-tab][aria-selected="true"]')?.dataset.mmLabTab;
      for(const id of Object.keys(drafts))delete drafts[id];
      workspace.replaceChildren();workspace.hidden=true;selected=null;
      const tool=models.definitions.find(tool=>tool.id===active);if(tool)open(tool,false);
    }
  });
  renderScenarios();renderSummary();legacyEvidence();renderLegacyAnalysis();
  window.MarkovMadeToolkit={tools,primary,open,renderSummary};
})();
