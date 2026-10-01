/* Local daily signals and quick access. No data leaves this browser. */
(function () {
  'use strict';
  const DAILY_KEY='markovmade-lab-daily-v1';
  const FAV_KEY='markovmade-lab-favorites-v1';
  const HISTORY_KEY='markovmade-lab-history-v1';
  const tools={body:['Состав тела','Body'],nutrition:['Питание','Nutrition'],overfeeding:['Переедание','Overfeeding'],recovery:['Ресурс','Recovery'],progress:['Прогресс','Progress'],strength:['Сила','Strength'],strategy:['Решение','Decision']};
  const $=id=>document.getElementById(id);
  const en=()=>document.documentElement.lang==='en';
  const copy=(ru,english)=>en()?english:ru;
  const fmt=(value,digits=1)=>new Intl.NumberFormat(en()?'en-GB':'ru-RU',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
  const today=()=>{const date=new Date();return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;};
  const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??fallback;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}};
  const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(new Date(`${value}T12:00:00`).getTime());
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
    const profile=window.MarkovMadeLab?.state?.profile||{};
    for(const field of ['weight','waist','sleep','energy','calories','adherence']){
      const node=$(`mm-checkin-${field}`);
      if(!node||preserveExisting&&node.value.trim())continue;
      node.value=Number.isFinite(record[field])?String(record[field]):field==='weight'&&Number.isFinite(profile.weight)&&date===today()?String(profile.weight):'';
    }
  }

  function saveDay(event){
    event.preventDefault();
    const date=$('mm-checkin-date').value;
    const earliest=new Date();earliest.setDate(earliest.getDate()-179);
    const floor=`${earliest.getFullYear()}-${String(earliest.getMonth()+1).padStart(2,'0')}-${String(earliest.getDate()).padStart(2,'0')}`;
    if(!validDate(date)||date>today()||date<floor){status(copy('Выберите дату за последние 180 дней.','Choose a date within the last 180 days.'));return;}
    const record={date};
    const bounds={weight:[35,300],waist:[40,200],sleep:[0,16],energy:[1,10],calories:[1000,8000],adherence:[0,100]};
    for(const [key,[min,max]] of Object.entries(bounds)){
      const value=number(`mm-checkin-${key}`);
      if(value===null)continue;
      if(!Number.isFinite(value)||value<min||value>max){status(copy('Проверьте значения и единицы измерения.','Check values and units.'));return;}
      record[key]=value;
    }
    if(Object.keys(record).length===1){status(copy('Добавьте хотя бы один показатель.','Add at least one measurement.'));return;}
    const next=entries().filter(item=>item.date!==date);next.push(record);next.sort((a,b)=>a.date.localeCompare(b.date));
    if(!write(DAILY_KEY,next.slice(-180))){status(copy('Не удалось сохранить данные на этом устройстве.','Could not save data on this device.'));return;}
    status(copy('День сохранён локально.','Day saved on this device.'));
    render();
  }

  function calibration(records){
    const complete=records.filter(item=>Number.isFinite(item.weight)&&Number.isFinite(item.calories)).sort((a,b)=>a.date.localeCompare(b.date));
    let run=[];
    for(const item of complete){
      const previous=run.at(-1);
      if(previous&&Math.round((new Date(item.date)-new Date(previous.date))/86400000)!==1)run=[];
      run.push(item);
    }
    if(run.length<14)return {ready:false,count:run.length};
    const sample=run.slice(-28);
    const adherence=sample.filter(item=>Number.isFinite(item.adherence));
    const averageCalories=sample.reduce((sum,item)=>sum+item.calories,0)/sample.length;
    const averageAdherence=adherence.length>=Math.ceil(sample.length*.75)?adherence.reduce((sum,item)=>sum+item.adherence,0)/adherence.length:70;
    const waist=sample.filter(item=>Number.isFinite(item.waist));
    const waistDelta=waist.length>=2?waist.at(-1).waist-waist[0].waist:NaN;
    try{return {ready:true,sample,result:window.MarkovMadeModels.maintenanceCalibration(sample.map(item=>item.weight),averageCalories,100,averageAdherence,waistDelta),averageCalories,averageAdherence,waistDelta};}
    catch(_){return {ready:false,count:run.length};}
  }

  function trendText(metric,unit){
    if(metric.delta===null)return copy(`Нужно ≥3 замера · ${metric.count} есть`,`Need ≥3 readings · ${metric.count} logged`);
    return `${metric.delta>=0?'+':''}${fmt(metric.delta)} ${unit}`;
  }

  function renderSparkline(id,metric){
    const value=$(id),card=value?.parentElement;
    if(!card)return;
    card.querySelector('.mm-trend-line')?.remove();
    const points=metric.points||[];
    if(points.length<2)return;
    const min=Math.min(...points.map(point=>point.value)),max=Math.max(...points.map(point=>point.value));
    const start=new Date(points[0].date).getTime(),span=new Date(points.at(-1).date).getTime()-start||1;
    const coords=points.map(point=>`${8+((new Date(point.date).getTime()-start)/span)*184},${36-((point.value-min)/(max-min||1))*28}`).join(' ');
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 200 44');svg.setAttribute('class','mm-trend-line');svg.setAttribute('aria-hidden','true');
    const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');
    line.setAttribute('points',coords);line.setAttribute('fill','none');line.setAttribute('stroke','currentColor');line.setAttribute('stroke-width','2.5');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');
    svg.append(line);card.append(svg);
  }

  function renderTrends(){
    const records=entries(),model=window.MarkovMadeModels;
    if(!model)return;
    const trend=model.checkinTrends(records,period);
    set('mm-checkin-summary',trend.count?copy(`${trend.count} из ${period} дней с записями · сравнивайте одинаковые условия.`,`${trend.count} of ${period} days logged · compare consistent conditions.`):copy('Начните с первого дня. Для тренда нужны несколько сопоставимых записей.','Start with your first day. A trend needs several comparable records.'));
    set('mm-checkin-weight-trend',trendText(trend.weight,copy('кг','kg')));
    set('mm-checkin-waist-trend',trendText(trend.waist,copy('см','cm')));
    set('mm-checkin-energy-trend',trend.energy.average===null?copy(`Нужно ≥3 оценки · ${trend.energy.count} есть`,`Need ≥3 ratings · ${trend.energy.count} logged`):`${fmt(trend.energy.average)}/10 · ${trendText(trend.energy,copy('п.','pt'))}`);
    set('mm-checkin-sleep-trend',trend.sleep.average===null?copy(`Нужно ≥3 записи · ${trend.sleep.count} есть`,`Need ≥3 readings · ${trend.sleep.count} logged`):`${fmt(trend.sleep.average)} ${copy('ч','h')} · ${trendText(trend.sleep,copy('ч','h'))}`);
    for(const key of ['weight','waist','energy','sleep'])renderSparkline(`mm-checkin-${key}-trend`,trend[key]);
    const observed=calibration(records),use=$('mm-checkin-use-calibration');
    if(observed.ready){
      const {result}=observed;
      set('mm-checkin-maintenance',copy(`Наблюдаемое поддержание: ${fmt(result.low,0)}–${fmt(result.high,0)} ккал/сут · ${result.days} последовательных дней · уверенность ${result.confidence.toLowerCase()}. Это ориентир с допущениями энергетического баланса.`,`Observed maintenance: ${fmt(result.low,0)}–${fmt(result.high,0)} kcal/day · ${result.days} consecutive days · ${result.confidence==='Низкая'?'low':result.confidence==='Умеренная'?'moderate':'above average'} confidence. This is an estimate with energy-balance assumptions.`));
      use.hidden=false;
    }else{
      set('mm-checkin-maintenance',copy(`Адаптивное поддержание появится после 14 последовательных дней с весом и калориями. Сейчас: ${observed.count}/14.`,`Adaptive maintenance needs 14 consecutive days with weight and calories. Current: ${observed.count}/14.`));
      use.hidden=true;
    }
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
      const go=document.createElement('button');go.type='button';go.className='mm-lab-quick-open';go.textContent=tools[key][Number(en())];go.addEventListener('click',()=>openTool(key));
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
    if(Number.isFinite(observed.waistDelta))$('lab-nutri-calibration-waist').value=String(observed.waistDelta.toFixed(1));
    status(copy('Данные перенесены. Проверьте профиль и запустите расчёт Питания.','Data transferred. Check your profile and run Nutrition.'));
  }

  function render(){renderTrends();renderQuick();}
  function init(){
    if(!$('mm-lab-checkin-form'))return;
    if(!$('mm-checkin-date').value)$('mm-checkin-date').value=today();
    $('mm-checkin-date').max=today();populate($('mm-checkin-date').value,true);
    $('mm-checkin-date').addEventListener('change',event=>{populate(event.target.value);status('');});
    $('mm-lab-checkin-form').addEventListener('submit',saveDay);
    document.querySelectorAll('[data-checkin-period]').forEach(button=>button.addEventListener('click',()=>{period=Number(button.dataset.checkinPeriod);document.querySelectorAll('[data-checkin-period]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));renderTrends();}));
    $('mm-lab-repeat-last').addEventListener('click',repeatLast);
    $('mm-checkin-use-calibration').addEventListener('click',useCalibration);
    document.addEventListener('click',event=>{if(event.target.closest?.('[data-calc]'))setTimeout(renderQuick,50);if(event.target.closest?.('#mm-lab-clear-all'))setTimeout(()=>{populate(today());render();},50);});
    new MutationObserver(localize).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    localize();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
