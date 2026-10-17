/* Local daily signals and quick access. No data leaves this browser. */
(function () {
  'use strict';
  const DAILY_KEY='markovmade-lab-daily-v1';
  const FAV_KEY='markovmade-lab-favorites-v1';
  const HISTORY_KEY='markovmade-lab-history-v1';
  const tools={body:['Состав тела','Body'],nutrition:['Питание','Nutrition'],overfeeding:['Переедание','Overfeeding'],recovery:['Ресурс','Recovery'],progress:['Прогресс','Progress'],strength:['Сила','Strength']};
  const toolIcons={body:'body',nutrition:'calories',overfeeding:'balance',recovery:'recovery',progress:'trend',strength:'strength'};
  const $=id=>document.getElementById(id);
  const en=()=>document.documentElement.lang==='en';
  const copy=(ru,english)=>en()?english:ru;
  const fmt=(value,digits=1)=>new Intl.NumberFormat(en()?'en-GB':'ru-RU',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
  const today=()=>{const date=new Date();return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;};
  const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??fallback;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}};
  const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
  const entries=()=>{const raw=read(DAILY_KEY,[]);return Array.isArray(raw)?raw.filter(item=>item&&validDate(item.date)).sort((a,b)=>a.date.localeCompare(b.date)).slice(-180):[];};
  const number=id=>{const raw=$(id).value.trim().replace(',','.');return raw===''?null:Number(raw);};
  const set=(id,value)=>{const node=$(id);if(node)node.textContent=value;};
  const status=value=>set('mm-checkin-status',value);
  let period=7;

  function localize(){
    document.querySelectorAll('[data-checkin-ru][data-checkin-en]').forEach(node=>{node.textContent=en()?node.dataset.checkinEn:node.dataset.checkinRu;});
    const group=document.querySelector('.mm-lab-periods');
    if(group)group.setAttribute('aria-label',copy('Период тренда','Trend period'));
    const quick=$('mm-lab-quick-list');if(quick)quick.setAttribute('aria-label',copy('Инструменты LAB','LAB tools'));
    render();
  }

  function populate(date,preserveExisting=false){
    const record=entries().find(item=>item.date===date)||{};

    for(const field of ['weight','waist','sleep','energy','calories','adherence']){
      const node=$(`mm-checkin-${field}`);
      if(!node||preserveExisting&&node.value.trim())continue;
      node.value=Number.isFinite(record[field])?String(record[field]):'';
    }
  }

  function saveDay(event){
    event.preventDefault();
    const date=$('mm-checkin-date').value;
    const earliest=new Date();earliest.setDate(earliest.getDate()-179);
    const floor=`${earliest.getFullYear()}-${String(earliest.getMonth()+1).padStart(2,'0')}-${String(earliest.getDate()).padStart(2,'0')}`;
    if(!validDate(date)||date>today()||date<floor){status(copy('Выберите дату за последние 180 дней.','Choose a date within the last 180 days.'));return;}
    const record={...entries().find(item=>item.date===date),date};
    let supplied=0;
    const bounds={weight:[35,300],waist:[40,200],sleep:[0,16],energy:[1,10],calories:[1000,8000],adherence:[0,100]};
    for(const [key,[min,max]] of Object.entries(bounds)){
      const value=number(`mm-checkin-${key}`);
      if(value===null)continue;
      if(!Number.isFinite(value)||value<min||value>max){status(copy('Проверьте значения и единицы измерения.','Check values and units.'));return;}
      record[key]=value;supplied++;
    }
    if(!supplied){status(copy('Добавьте хотя бы один показатель.','Add at least one measurement.'));return;}
    let stored;
    try{stored=JSON.parse(localStorage.getItem(DAILY_KEY)||'[]');if(!Array.isArray(stored))throw new Error('format');}
    catch(_){status(copy('Сохранение недоступно. Прежние данные не изменены.','Saving is unavailable. Existing data was not changed.'));return;}
    const next=(Array.isArray(stored)?stored:[]).filter(item=>item?.date!==date);next.push(record);next.sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||'')));
    if(!write(DAILY_KEY,next)){status(copy('Не удалось сохранить данные на этом устройстве.','Could not save data on this device.'));return;}
    status(copy('День сохранён локально.','Day saved on this device.'));
    render();
    document.dispatchEvent(new CustomEvent('mm:daily-updated'));
    window.mmRefreshPersonalOS?.();
  }

  const calibration=records=>window.MarkovMadeModels.dailyCalibration(records);
  const dateLabel=date=>new Intl.DateTimeFormat(en()?'en-GB':'ru-RU',{day:'numeric',month:'short'}).format(new Date(date+'T12:00:00'));
  const metrics={weight:['Вес','Weight','кг','kg'],waist:['Талия','Waist','см','cm'],sleep:['Сон','Sleep','ч','h'],energy:['Энергия','Energy','/10','/10']};
  function trendText(metric,unit){
    if(metric.delta===null)return copy('Недостаточно сопоставимых измерений','Not enough comparable measurements');
    return (metric.delta>=0?'+':'')+fmt(metric.delta)+' '+unit;
  }
  function renderChart(trend){
    const root=$('mm-progress-chart'),key=$('mm-progress-metric').value,metric=trend[key],points=metric.points;
    root.replaceChildren();
    if(!points.length){root.textContent=copy('В этом периоде нет измерений выбранного показателя.','No measurements for this metric in this period.');set('mm-progress-chart-caption','');return;}
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');const chartWidth=Math.max(280,Math.min(800,root.clientWidth||640)),left=60,right=chartWidth-16;svg.setAttribute('viewBox','0 0 '+chartWidth+' 250');svg.setAttribute('role','img');svg.setAttribute('aria-labelledby','mm-chart-title mm-chart-description');
    const node=(tag,attributes,text)=>{const el=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attributes))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;svg.append(el);return el;};
    node('title',{id:'mm-chart-title'},metrics[key][Number(en())]+' · '+period+' '+copy('дней','days'));
    node('desc',{id:'mm-chart-description'},copy('Точки — реальные измерения. Пунктир соединяет дни с пропусками; отсутствующие значения не рассчитаны.','Dots are observed readings. Dashes connect gaps; missing values are not estimated.'));
    const end=Date.parse(today()),start=end-(period-1)*86400000;
    const values=points.map(p=>p.value),lo=Math.min(...values),hi=Math.max(...values),pad=Math.max((hi-lo)*.18,key==='energy'?.5:key==='sleep'?.25:.2),min=lo-pad,max=hi+pad;
    const x=date=>left+(Date.parse(date)-start)/Math.max(86400000,end-start)*(right-left),y=value=>210-(value-min)/(max-min)*184;
    for(let i=0;i<3;i++){const value=min+(max-min)*i/2;node('line',{x1:left,x2:right,y1:y(value),y2:y(value),class:'mm-chart-grid'});node('text',{x:left-10,y:y(value)+5,'text-anchor':'end',class:'mm-chart-label'},fmt(value));}
    for(let i=1;i<points.length;i++){const prev=points[i-1],p=points[i];node('line',{x1:x(prev.date),y1:y(prev.value),x2:x(p.date),y2:y(p.value),class:'mm-chart-line','stroke-dasharray':(Date.parse(p.date)-Date.parse(prev.date))/86400000>1?'5 5':'none'});}
    for(const p of points){const circle=node('circle',{cx:x(p.date),cy:y(p.value),r:4,class:'mm-chart-point'});const title=document.createElementNS(ns,'title');title.textContent=dateLabel(p.date)+': '+fmt(p.value);circle.append(title);}
    const first=new Date(start).toISOString().slice(0,10);node('text',{x:left,y:240,class:'mm-chart-label'},dateLabel(first));node('text',{x:right,y:240,'text-anchor':'end',class:'mm-chart-label'},dateLabel(today()));root.append(svg);
    const mean=window.MarkovMadeModels.average(values),comparison=window.MarkovMadeModels.checkinComparison(entries(),period).metrics[key];
    const unit=metrics[key][en()?3:2];
    set('mm-progress-chart-caption',copy('Измерений: ','Readings: ')+points.length+'/'+period+' · '+copy('Среднее: ','Mean: ')+fmt(mean)+' '+unit+' · '+copy('Изменение по тренду: ','Trend change: ')+trendText(metric,unit)+' · '+copy('Среднее против предыдущего периода: ','Mean vs previous period: ')+(comparison.delta===null?copy('недостаточно данных','insufficient data'):(comparison.delta>=0?'+':'')+fmt(comparison.delta)+' '+unit)+' ('+comparison.currentCount+'/'+period+' · '+comparison.previousCount+'/'+period+'). '+copy('Пунктир — пропуски измерений. Сравнение средних требует ≥75% дней в обоих периодах.','Dashed lines mark gaps. Mean comparison requires ≥75% of days in both periods.'));
  }
  function renderRecords(records){
    const root=$('mm-progress-records');root.replaceChildren();
    for(const record of records.slice().reverse()){
      const li=document.createElement('li'),button=document.createElement('button'),values=document.createElement('span');button.type='button';button.textContent=dateLabel(record.date);button.setAttribute('aria-label',copy('Изменить запись за ','Edit record for ')+dateLabel(record.date));
      button.addEventListener('click',()=>{$('mm-checkin-date').value=record.date;populate(record.date);$('mm-checkin-weight').focus();});
      const parts=[];for(const[key,meta]of Object.entries(metrics))if(Number.isFinite(record[key]))parts.push(meta[Number(en())]+': '+fmt(record[key])+' '+meta[en()?3:2]);
      if(Number.isFinite(record.calories))parts.push(fmt(record.calories,0)+' '+copy('ккал','kcal'));if(Number.isFinite(record.adherence))parts.push(copy('соблюдение ','adherence ')+fmt(record.adherence,0)+'%');
      values.textContent=parts.join(' · ');li.append(button,values);root.append(li);
    }
  }
  function renderTrends(){
    const records=entries(),model=window.MarkovMadeModels;if(!model)return;
    const trend=model.checkinTrends(records,period),latest=records.filter(r=>Number.isFinite(r.weight)).at(-1);
    set('mm-progress-preview',latest?fmt(latest.weight)+' '+copy('кг','kg')+' · '+dateLabel(latest.date):copy('Дата и вес · остальные показатели по желанию','Date and weight · other measurements optional'));
    $('mm-progress-history').hidden=!records.length;
    set('mm-checkin-summary',trend.count?copy(trend.count+' из '+period+' дней с записями · сравнивайте одинаковые условия.',trend.count+' of '+period+' days logged · compare consistent conditions.'):copy('Начните с первого дня. Для тренда нужны несколько сопоставимых записей.','Start with your first day. A trend needs several comparable records.'));
    for(const key of ['weight','waist','energy','sleep'])set('mm-checkin-'+key+'-trend',trendText(trend[key],metrics[key][en()?3:2])+' · '+trend[key].count+'/'+period);
    renderChart(trend);renderRecords(records);
    const observed=calibration(records),use=$('mm-checkin-use-calibration');use.hidden=!observed.ready;
    if(observed.ready){const {result}=observed;set('mm-checkin-maintenance',copy('Наблюдаемое поддержание: ','Observed maintenance: ')+fmt(result.low,0)+'–'+fmt(result.high,0)+' '+copy('ккал/сут','kcal/day')+' · '+result.days+' '+copy('последовательных дней','consecutive days')+' · '+copy('соблюдение известно за ','adherence recorded on ')+observed.adherenceCount+'/'+observed.count+' '+copy('дней. Уверенность: ','days. Confidence: ')+(en()?(result.confidence==='Низкая'?'low':result.confidence==='Умеренная'?'moderate':'above average'):result.confidence.toLowerCase())+'. '+copy('Ориентир с допущениями энергетического баланса.','An estimate with energy-balance assumptions.'));}
    else if(observed.reason==='adherence')set('mm-checkin-maintenance',copy('Недостаточно данных о соблюдении: ','Insufficient adherence data: ')+observed.adherenceCount+'/'+observed.count+'. '+copy('Для калибровки нужны оценки минимум за 75% дней. Пропуски не заменяются предполагаемыми значениями.','Calibration needs ratings on at least 75% of days. Missing ratings are never replaced with assumed values.'));
    else set('mm-checkin-maintenance',copy('Адаптивное поддержание появится после 14 последовательных дней с весом и калориями. Сейчас: ','Adaptive maintenance needs 14 consecutive days with weight and calories. Current: ')+observed.count+'/14.');
  }

  function history(){const value=read(HISTORY_KEY,[]);return Array.isArray(value)?value.filter(item=>item&&tools[item.tool]&&item.inputs):[];}
  function favorites(){const raw=read(FAV_KEY,[]);return Array.isArray(raw)?raw.filter(item=>tools[item]).slice(0,6):[];}
  function openTool(key){const tab=document.querySelector(`[data-mm-lab-tab="${key}"]`);if(tab){tab.click();tab.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});}}
  function renderQuick(){
    const root=$('mm-lab-quick-list');if(!root)return;
    const fav=favorites(),recent=[...new Set(history().map(item=>item.tool))];
    const order=[...new Set([...fav,...recent,...Object.keys(tools)])];
    root.replaceChildren();
    order.forEach(key=>{
      const item=document.createElement('span');item.className='mm-lab-quick-item';
      const go=document.createElement('button');go.type='button';go.className='mm-lab-quick-open';const icon=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS('http://www.w3.org/2000/svg','use');icon.setAttribute('aria-hidden','true');icon.setAttribute('focusable','false');use.setAttribute('href',`#mm-icon-${toolIcons[key]}`);icon.append(use);go.append(icon,document.createTextNode(tools[key][Number(en())]));go.addEventListener('click',()=>openTool(key));
      const star=document.createElement('button');star.type='button';star.className='mm-lab-quick-favorite';star.textContent=fav.includes(key)?'★':'☆';star.setAttribute('aria-pressed',String(fav.includes(key)));star.setAttribute('aria-label',copy(`${fav.includes(key)?'Убрать из избранного':'В избранное'}: ${tools[key][0]}`,`${fav.includes(key)?'Remove favorite':'Add favorite'}: ${tools[key][1]}`));
      star.addEventListener('click',()=>{const next=fav.includes(key)?fav.filter(item=>item!==key):[...fav,key];write(FAV_KEY,next);renderQuick();});
      item.append(go,star);root.appendChild(item);
    });
    const repeat=$('mm-lab-repeat-last');repeat.disabled=history().length===0;
  }

  function repeatLast(){
    const last=history()[0];if(!last){status(copy('Сначала выполните расчёт.','Run a calculation first.'));return;}
    openTool(last.tool);
    const panel=document.querySelector(`[data-mm-lab-panel="${last.tool}"]`);
    Object.entries(last.inputs).forEach(([id,value])=>{const field=panel?.querySelector(`#${CSS.escape(id)}`);if(field&&field.type!=='file')field.value=String(value);});
    const button=panel?.querySelector(`[data-calc="${last.tool}"]`);if(button)button.click();
    status(copy('Последний расчёт повторён с сохранёнными полями.','Last calculation repeated with saved inputs.'));
    renderQuick();
  }

  function useCalibration(){
    const observed=calibration(entries());if(!observed.ready)return;
    openTool('nutrition');
    document.querySelector('[data-mode-switch="nutrition"] [data-mode="calibrated"]')?.click();
    $('lab-nutri-calibration-weights').value=observed.sample.map(item=>item.weight).join('\n');
    $('lab-nutri-calibration-calories').value=String(Math.round(observed.averageCalories));
    $('lab-nutri-calibration-completeness').value='100';
    $('lab-nutri-calibration-adherence').value=String(Math.round(observed.averageAdherence));
    $('lab-nutri-calibration-waist').value=Number.isFinite(observed.waistDelta)?String(observed.waistDelta.toFixed(1)):'';
    status(copy('Данные перенесены. Проверьте профиль и запустите расчёт Питания.','Data transferred. Check your profile and run Nutrition.'));
  }

  function render(){renderTrends();renderQuick();}
  function init(){
    if(!$('mm-lab-checkin-form'))return;
    if(!$('mm-checkin-date').value)$('mm-checkin-date').value=today();
    $('mm-checkin-date').max=today();populate($('mm-checkin-date').value,true);
    $('mm-checkin-date').addEventListener('change',event=>{populate(event.target.value);status('');});
    $('mm-lab-checkin-form').addEventListener('submit',saveDay);
    $('mm-progress-metric').addEventListener('change',renderTrends);
    if('ResizeObserver' in window){let width=0;new ResizeObserver(items=>{const next=Math.round(items[0].contentRect.width);if(next>0&&next!==width){width=next;requestAnimationFrame(renderTrends);}}).observe($('mm-progress-chart'));}
    window.addEventListener('storage',event=>{if(event.key===DAILY_KEY){populate($('mm-checkin-date').value);render();}});
    document.querySelectorAll('[data-checkin-period]').forEach(button=>button.addEventListener('click',()=>{period=Number(button.dataset.checkinPeriod);document.querySelectorAll('[data-checkin-period]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));renderTrends();}));
    $('mm-lab-repeat-last').addEventListener('click',repeatLast);
    $('mm-checkin-use-calibration').addEventListener('click',useCalibration);
    document.addEventListener('click',event=>{if(event.target.closest?.('[data-calc]'))setTimeout(renderQuick,50);if(event.target.closest?.('#mm-lab-clear-all'))setTimeout(()=>{populate(today());render();},50);});
    new MutationObserver(localize).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    localize();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
