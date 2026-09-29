(function(){
  'use strict';

  function clamp(v,min,max){return Math.min(max,Math.max(min,v));}
  function isEnglish(){return document.documentElement.lang === 'en';}

  /* ---------- Resilient direct video scrubbing for mouse / trackpad ---------- */
  function initHeroDirectScrub(){
    var hero=document.getElementById('hero');
    var media=hero&&hero.querySelector('.mm-hero-media');
    var video=document.getElementById('hero-head-video');
    if(!hero||!media||!video||media.dataset.mmV31DirectReady==='true') return;
    if(!(window.matchMedia&&window.matchMedia('(hover: hover) and (pointer: fine)').matches)) return;
    media.dataset.mmV31DirectReady='true';
    video.muted=true; video.defaultMuted=true; video.playsInline=true; video.preload='auto';

    var ref=8.041667, duration=ref, pending=null, raf=0, lastTime=-1, direct=false, segmentPlaying=false;
    function scale(t){return clamp(t*(duration/ref),0,Math.max(.01,duration-.015));}
    function enableDirect(){
      if(direct) return;
      direct=true;
      media.dataset.mmV31Direct='true';
      media.classList.add('mm-direct-ready');
      media.classList.remove('mm-frames-ready','mm-video-error');
      try{video.pause();}catch(e){}
    }
    function seekNow(){
      raf=0;
      if(pending===null||segmentPlaying) return;
      var t=pending; pending=null;
      if(Math.abs((video.currentTime||0)-t)<.018) return;
      try{video.currentTime=t;lastTime=t;}catch(e){}
    }
    function queueSeek(t){pending=t;if(!raf)raf=requestAnimationFrame(seekNow);}
    function targetFromPointer(x,y){
      var turn=clamp((.76-x)/.70,0,1);
      var nod=clamp((y-.58)/.34,0,1);
      if(nod>.035){return scale(2.72+(3.72-2.72)*nod);}
      return scale(.08+(2.42-.08)*turn);
    }
    function onMove(ev){
      if(ev.pointerType==='touch'||segmentPlaying) return;
      var r=hero.getBoundingClientRect();
      if(ev.clientY<r.top||ev.clientY>r.bottom||ev.clientX<r.left||ev.clientX>r.right) return;
      enableDirect();
      var x=clamp((ev.clientX-r.left)/Math.max(1,r.width),0,1);
      var y=clamp((ev.clientY-r.top)/Math.max(1,r.height),0,1);
      media.style.setProperty('--mm-hero-x',((x-.5)*7).toFixed(2)+'px');
      media.style.setProperty('--mm-hero-y',((y-.5)*4).toFixed(2)+'px');
      queueSeek(targetFromPointer(x,y));
    }
    function neutral(){if(!direct||segmentPlaying)return;queueSeek(scale(.10));media.style.setProperty('--mm-hero-x','0px');media.style.setProperty('--mm-hero-y','0px');}

    function waitForSeek(t){
      return new Promise(function(resolve){
        var done=false, timer=setTimeout(finish,650);
        function finish(){if(done)return;done=true;clearTimeout(timer);video.removeEventListener('seeked',finish);resolve();}
        video.addEventListener('seeked',finish,{once:true});
        try{video.currentTime=t;}catch(e){finish();}
        if(Math.abs((video.currentTime||0)-t)<.015) setTimeout(finish,0);
      });
    }
    async function playSegment(a,b){
      await waitForSeek(scale(a));
      try{await video.play();}catch(e){return;}
      await new Promise(function(resolve){
        var stopAt=scale(b), guard=performance.now()+2500;
        function tick(){
          if((video.currentTime||0)>=stopAt-.035||performance.now()>guard){try{video.pause();}catch(e){}resolve();return;}
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }
    async function onClick(ev){
      if(ev.target&&ev.target.closest&&ev.target.closest('a,button,input,select,textarea,label')) return;
      enableDirect(); segmentPlaying=true; pending=null;
      try{await playSegment(2.72,4.58);await new Promise(function(r){setTimeout(r,120);});await playSegment(5.06,7.72);}finally{segmentPlaying=false;neutral();}
    }

    video.addEventListener('loadedmetadata',function(){if(Number.isFinite(video.duration)&&video.duration>.2)duration=video.duration;},{once:true});
    video.addEventListener('error',function(){
      /* One clean retry; cache-busted source above prevents stale broken media responses. */
      if(video.dataset.mmV31Retried==='true') return;
      video.dataset.mmV31Retried='true';
      setTimeout(function(){try{video.load();}catch(e){}},180);
    });
    window.addEventListener('pointermove',onMove,{passive:true});
    hero.addEventListener('pointerleave',neutral,{passive:true});
    hero.addEventListener('click',onClick);
  }

  /* ---------- Product ambient pointer light (no text transform / no blur) ---------- */
  function initProductLight(){
    var product=document.querySelector('#app-ecosystem .mm-os-product');
    if(!product||product.dataset.mmV31Light==='true') return;
    product.dataset.mmV31Light='true';
    product.addEventListener('pointermove',function(e){
      if(e.pointerType==='touch') return;
      var r=product.getBoundingClientRect();
      product.style.setProperty('--os-px',(clamp((e.clientX-r.left)/Math.max(1,r.width),0,1)*100).toFixed(1)+'%');
      product.style.setProperty('--os-py',(clamp((e.clientY-r.top)/Math.max(1,r.height),0,1)*100).toFixed(1)+'%');
    },{passive:true});
    product.addEventListener('pointerleave',function(){product.style.setProperty('--os-px','72%');product.style.setProperty('--os-py','26%');},{passive:true});
  }

  /* ---------- Bilingual deterministic personalized insight engine ---------- */
  var COPY={
    ru:{
      kicker:'ПЕРСОНАЛЬНЫЕ ИНСАЙТЫ · ЛОКАЛЬНО В БРАУЗЕРЕ',title:'Не ещё один совет. Точный следующий ход.',lead:'Выберите, что сейчас важно, что мешает и сколько у вас ресурса. Система не ставит диагноз и не пытается «угадать вас» — она собирает рабочую гипотезу: на чём сфокусироваться, что убрать и с какого шага начать.',private:'Ответы никуда не отправляются',contextLabel:'КОНТЕКСТ',contextHint:'3 сигнала → 1 рабочий вектор',qGoal:'Что сейчас важнее всего?',goalBody:'Тело / форма',goalEnergy:'Энергия / ресурс',goalDiscipline:'Дисциплина / режим',goalNutrition:'Питание / срывы',goalClarity:'Ясность / решение',goalConfidence:'Уверенность / масштаб',qBlocker:'Что сильнее всего тормозит?',blockOverload:'Перегруз и хаос',blockConsistency:'Начинаю и бросаю',blockPerfect:'Перфекционизм',blockTime:'Не хватает времени',blockUncertain:'Не понимаю, что важнее',blockSupport:'Нет обратной связи',qResource:'Сколько ресурса сейчас?',resLow:'Низкий',resLowSub:'держусь на минимуме',resMid:'Средний',resMidSub:'могу менять одно',resHigh:'Высокий',resHighSub:'готов к нагрузке',localTitle:'Local-first',localBody:'Выборы обрабатываются только в этой вкладке. Ничего не сохраняется и не отправляется автоматически.',resultBadge:'ПЕРСОНАЛЬНЫЙ СИГНАЛ',resultNow:'СЕЙЧАС',outVector:'ВЕКТОР',outPlan:'ПЛАН НА 7 ДНЕЙ',outAvoid:'НЕ ДЕЛАТЬ',mentorLabel:'ВОПРОС МЕНТОРА',formatLabel:'ПОДХОДЯЩИЙ ФОРМАТ',copyBtn:'Скопировать план',copiedBtn:'Скопировано',tgBtn:'Обсудить в Telegram',disclaimer:'Инструмент для самоанализа и постановки цели. Не является психологической или медицинской диагностикой и не заменяет работу с профильным специалистом, когда она нужна.',copyPrefix:'MARKOVMADE / Персональный инсайт',copyGoal:'Фокус',copyBlock:'Стоп-фактор',copyResource:'Ресурс',copyVector:'Вектор',copyPlan:'План на 7 дней',copyAvoid:'Не делать',copyQuestion:'Вопрос ментора',copyFormat:'Формат'
    },
    en:{
      kicker:'PERSONAL INSIGHTS · LOCAL IN YOUR BROWSER',title:'Not another tip. Your precise next move.',lead:'Choose what matters now, what is blocking you, and how much capacity you have. The system does not diagnose or pretend to “read you” — it builds a working hypothesis: what to focus on, what to remove, and where to start.',private:'Your answers are not sent anywhere',contextLabel:'CONTEXT',contextHint:'3 signals → 1 working direction',qGoal:'What matters most right now?',goalBody:'Body / physique',goalEnergy:'Energy / capacity',goalDiscipline:'Discipline / routine',goalNutrition:'Nutrition / slips',goalClarity:'Clarity / decision',goalConfidence:'Confidence / scale',qBlocker:'What is slowing you down most?',blockOverload:'Overload and chaos',blockConsistency:'Start and quit',blockPerfect:'Perfectionism',blockTime:'Not enough time',blockUncertain:'I do not know what matters',blockSupport:'No feedback loop',qResource:'How much capacity do you have now?',resLow:'Low',resLowSub:'running on minimum',resMid:'Medium',resMidSub:'can change one thing',resHigh:'High',resHighSub:'ready for load',localTitle:'Local-first',localBody:'Selections are processed only in this tab. Nothing is stored or sent automatically.',resultBadge:'PERSONAL SIGNAL',resultNow:'RIGHT NOW',outVector:'DIRECTION',outPlan:'7-DAY PLAN',outAvoid:'DO NOT',mentorLabel:'MENTOR QUESTION',formatLabel:'BEST-FIT FORMAT',copyBtn:'Copy plan',copiedBtn:'Copied',tgBtn:'Discuss in Telegram',disclaimer:'A tool for self-reflection and goal setting. It is not psychological or medical diagnosis and does not replace qualified professional care when that is needed.',copyPrefix:'MARKOVMADE / Personal insight',copyGoal:'Focus',copyBlock:'Blocker',copyResource:'Capacity',copyVector:'Direction',copyPlan:'7-day plan',copyAvoid:'Do not',copyQuestion:'Mentor question',copyFormat:'Format'
    }
  };
  var GOALS={
    ru:{
      body:{code:'B',headline:'Сейчас важнее не «ускорить форму», а сделать прогресс управляемым.',lever:'Один измеримый контур: питание → нагрузка → 7-дневный тренд.',plan:'На 7 дней зафиксируйте один коридор питания, 3–4 ключевые тренировки и один показатель прогресса. Корректируйте только по тренду, не по отдельному дню.',avoid:'Не менять одновременно питание, кардио и тренировочный объём.',question:'Какой показатель вы пытаетесь «починить» быстрее, чем он успевает дать честный сигнал?',format:'Персональный разбор тела + система контроля прогресса.'},
      energy:{code:'E',headline:'Сейчас рост результата упирается не в мотивацию, а в доступный ресурс.',lever:'Сначала восстановить базовый ресурс: сон, питание, нагрузка и окна без перегруза.',plan:'7 дней: фиксированное время подъёма, один защищённый блок восстановления и никаких новых обязательств. Отмечайте энергию утром и вечером по 10-балльной шкале.',avoid:'Не лечить усталость ещё большей дисциплиной и стимуляцией.',question:'Что в вашем расписании выглядит «обязательным», но крадёт ресурс без сопоставимой отдачи?',format:'Разбор режима / восстановления + сопровождение.'},
      discipline:{code:'D',headline:'Вам нужен не новый всплеск мотивации, а система, которая работает в плохой день.',lever:'Минимальный стандарт + три якоря дня.',plan:'Определите 3 неоспоримых действия и минимальную версию каждого на 10–15 минут. Выполняйте минимум даже в слабый день; расширение — только бонус.',avoid:'Не строить режим, который работает только при идеальном настроении.',question:'Какая часть вашей «дисциплины» на самом деле зависит от вдохновения?',format:'Менторство + персональная система привычек.'},
      nutrition:{code:'N',headline:'Проблема чаще не в знании «что есть», а в среде и сценариях, где план разваливается.',lever:'Сделать правильное решение самым лёгким заранее.',plan:'7 дней: 2–3 повторяемых базовых приёма пищи, план на самый рискованный период дня, белок и клетчатка как якорь, без компенсационных голодовок после отклонений.',avoid:'Не отвечать на один срыв жёстким урезанием на следующий день.',question:'В какой момент дня решение о еде перестаёт быть осознанным и становится реакцией?',format:'Нутрициология + система соблюдения.'},
      clarity:{code:'C',headline:'Сейчас вам нужен не ещё один источник информации, а одно решение с понятным критерием успеха.',lever:'Выбрать один рычаг, который сильнее всего меняет результат.',plan:'На 7 дней сформулируйте одну цель, один показатель и одно ежедневное действие. Всё, что не поддерживает эту связку, временно отложите.',avoid:'Не собирать новые инструменты до проверки текущей гипотезы.',question:'Какое решение вы откладываете не из-за нехватки данных, а потому что оно требует отказаться от альтернатив?',format:'Стратегический разбор + менторство.'},
      confidence:{code:'X',headline:'Уверенность сейчас лучше строить не убеждениями, а накопленными доказательствами собственной надёжности.',lever:'Маленькие обещания себе + видимые действия вне привычной зоны комфорта.',plan:'7 дней: одно обязательство, которое вы выполняете ежедневно, и 3 намеренно дискомфортных, но безопасных действия — разговор, публикация, решение или граница.',avoid:'Не ждать ощущения полной готовности перед действием.',question:'Какое действие вы бы уже сделали, если бы не пытались сначала почувствовать полную уверенность?',format:'Психология & менторство / работа с решениями и поведением.'}
    },
    en:{
      body:{code:'B',headline:'The priority is not to “speed up your physique” but to make progress controllable.',lever:'One measurable loop: nutrition → training → 7-day trend.',plan:'For 7 days, hold one nutrition range, 3–4 key training sessions, and one progress metric. Adjust from the trend, not from a single day.',avoid:'Do not change nutrition, cardio, and training volume at the same time.',question:'Which metric are you trying to “fix” faster than it can give you an honest signal?',format:'Body assessment + progress-control system.'},
      energy:{code:'E',headline:'Your result is currently limited less by motivation than by available capacity.',lever:'Restore the base first: sleep, nutrition, load, and protected low-demand windows.',plan:'For 7 days: keep a fixed wake time, protect one recovery block, and add no new commitments. Rate energy morning and evening on a 10-point scale.',avoid:'Do not treat fatigue with even more discipline and stimulation.',question:'What in your schedule looks “mandatory” but consumes capacity without comparable return?',format:'Routine / recovery assessment + coaching.'},
      discipline:{code:'D',headline:'You do not need another burst of motivation. You need a system that still works on a bad day.',lever:'A minimum standard + three daily anchors.',plan:'Define 3 non-negotiable actions and a 10–15 minute minimum version of each. Hit the minimum on weak days; anything more is a bonus.',avoid:'Do not build a routine that only works when you feel ideal.',question:'Which part of your “discipline” actually depends on inspiration?',format:'Mentoring + a personal habit system.'},
      nutrition:{code:'N',headline:'The problem is usually not knowing what to eat; it is the environment and situations where the plan breaks.',lever:'Make the right decision the easiest decision in advance.',plan:'For 7 days: use 2–3 repeatable base meals, plan for the riskiest time of day, anchor protein and fibre, and avoid compensatory restriction after deviations.',avoid:'Do not answer one slip with aggressive restriction the next day.',question:'At what time of day does eating stop being a deliberate decision and become a reaction?',format:'Nutrition coaching + adherence system.'},
      clarity:{code:'C',headline:'You do not need another source of information. You need one decision with a clear success criterion.',lever:'Choose the single lever with the strongest effect on the result.',plan:'For 7 days, define one goal, one metric, and one daily action. Temporarily park everything that does not support that link.',avoid:'Do not collect new tools before testing the current hypothesis.',question:'Which decision are you delaying not because you lack data, but because it requires giving up alternatives?',format:'Strategic assessment + mentoring.'},
      confidence:{code:'X',headline:'Confidence is better built from accumulated evidence that you can rely on yourself, not from affirmations.',lever:'Small promises kept + visible actions outside your habitual comfort zone.',plan:'For 7 days: keep one daily commitment and do 3 deliberately uncomfortable but safe actions — a conversation, publication, decision, or boundary.',avoid:'Do not wait to feel completely ready before acting.',question:'What would you already have done if you were not waiting to feel fully confident first?',format:'Psychology & mentoring / decision and behaviour work.'}
    }
  };
  var BLOCKERS={
    ru:{overload:{code:'O',text:'Срежьте активные задачи до трёх: одна главная, одна поддерживающая, одна бытовая.'},inconsistency:{code:'I',text:'Установите «пол» выполнения: версию действия, которую невозможно честно оправдать пропуском.'},perfectionism:{code:'P',text:'Порог успеха — 80% выполнения; улучшать систему разрешено только после недели фактического соблюдения.'},time:{code:'T',text:'Планируйте от доступных 20 минут, не от идеального часа.'},uncertainty:{code:'U',text:'Перед действием используйте фильтр: «это меняет ключевой показатель в ближайшие 7 дней — да или нет?»'},support:{code:'F',text:'Добавьте один внешний отчёт в неделю: факт → вывод → следующая корректировка.'}},
    en:{overload:{code:'O',text:'Cut active commitments to three: one primary, one supporting, and one basic-life task.'},inconsistency:{code:'I',text:'Set a minimum floor: a version of the action that is genuinely hard to justify skipping.'},perfectionism:{code:'P',text:'Define success as 80% adherence; improve the system only after one week of actually following it.'},time:{code:'T',text:'Plan from the 20 minutes you really have, not from an imaginary perfect hour.'},uncertainty:{code:'U',text:'Before acting, use one filter: “Will this change the key metric within 7 days — yes or no?”'},support:{code:'F',text:'Add one external weekly check-in: fact → conclusion → next adjustment.'}}
  };
  var RESOURCES={
    ru:{low:{code:'L',text:'Режим нагрузки: щадящий. Не добавляйте новые цели — сначала уберите один источник перегруза.'},medium:{code:'M',text:'Режим нагрузки: рабочий. Меняйте только один рычаг за раз.'},high:{code:'H',text:'Режим нагрузки: высокий. Можно добавить один измеримый челлендж, но без распыления.'}},
    en:{low:{code:'L',text:'Load mode: conservative. Do not add new goals; remove one source of overload first.'},medium:{code:'M',text:'Load mode: workable. Change only one lever at a time.'},high:{code:'H',text:'Load mode: high. You can add one measurable challenge, but do not scatter attention.'}}
  };
  var LABELS={
    ru:{goal:{body:'Тело / форма',energy:'Энергия / ресурс',discipline:'Дисциплина / режим',nutrition:'Питание / срывы',clarity:'Ясность / решение',confidence:'Уверенность / масштаб'},blocker:{overload:'Перегруз и хаос',inconsistency:'Начинаю и бросаю',perfectionism:'Перфекционизм',time:'Не хватает времени',uncertainty:'Не понимаю, что важнее',support:'Нет обратной связи'},resource:{low:'Низкий',medium:'Средний',high:'Высокий'}},
    en:{goal:{body:'Body / physique',energy:'Energy / capacity',discipline:'Discipline / routine',nutrition:'Nutrition / slips',clarity:'Clarity / decision',confidence:'Confidence / scale'},blocker:{overload:'Overload and chaos',inconsistency:'Start and quit',perfectionism:'Perfectionism',time:'Not enough time',uncertainty:'I do not know what matters',support:'No feedback loop'},resource:{low:'Low',medium:'Medium',high:'High'}}
  };

  function initInsights(){
    var root=document.getElementById('insights');
    var form=document.getElementById('mm-insights-form');
    if(!root||!form||root.dataset.mmInsightsReady==='true') return;
    root.dataset.mmInsightsReady='true';
    var ids={headline:'mm-insights-headline',resource:'mm-insights-resource-note',lever:'mm-insights-lever',plan:'mm-insights-plan',avoid:'mm-insights-avoid',question:'mm-insights-question',format:'mm-insights-format',code:'mm-insights-code'};
    var current=null;
    function val(name,fallback){var el=form.querySelector('input[name="'+name+'"]:checked');return el?el.value:fallback;}
    function lang(){return isEnglish()?'en':'ru';}
    function setText(id,value){var el=document.getElementById(id);if(el)el.textContent=value;}
    function renderCopy(){
      var l=lang(), c=COPY[l];
      root.querySelectorAll('[data-ins-copy]').forEach(function(el){var key=el.getAttribute('data-ins-copy');if(c[key]){
        if(key==='title'){
          var parts=c[key].split('. ');el.innerHTML=(parts[0]?parts[0]+'.':'')+(parts[1]?'<br><em>'+parts.slice(1).join('. ')+'</em>':'');
        }else{el.textContent=c[key];}
      }});
    }
    function render(){
      var l=lang(), g=val('insight-goal','clarity'), b=val('insight-blocker','uncertainty'), r=val('insight-resource','medium');
      var base=GOALS[l][g], block=BLOCKERS[l][b], res=RESOURCES[l][r];
      current={l:l,g:g,b:b,r:r,base:base,block:block,res:res};
      setText(ids.headline,base.headline);setText(ids.resource,res.text);setText(ids.lever,base.lever);
      setText(ids.plan,base.plan+' '+block.text);setText(ids.avoid,base.avoid);setText(ids.question,base.question);setText(ids.format,base.format);setText(ids.code,base.code+'-'+block.code+'-'+res.code);
      var tg=document.getElementById('mm-insights-telegram');
      if(tg)tg.href='https://t.me/markovmade?text='+encodeURIComponent(buildText());
      if(window.mmTrack){try{window.mmTrack('insight_engine_change',{goal:g,blocker:b,resource:r});}catch(e){}}
    }
    function buildText(){
      if(!current)return '';
      var c=COPY[current.l], labels=LABELS[current.l];
      return [c.copyPrefix,c.copyGoal+': '+labels.goal[current.g],c.copyBlock+': '+labels.blocker[current.b],c.copyResource+': '+labels.resource[current.r],'',current.base.headline,c.copyVector+': '+current.base.lever,c.copyPlan+': '+current.base.plan+' '+current.block.text,c.copyAvoid+': '+current.base.avoid,c.copyQuestion+': '+current.base.question,c.copyFormat+': '+current.base.format].join('\n');
    }
    async function copyPlan(){
      var btn=document.getElementById('mm-insights-copy'), label=btn&&btn.querySelector('[data-ins-copy="copyBtn"]');
      var txt=buildText(), ok=false;
      if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(txt);ok=true;}catch(e){}}
      if(!ok){
        var ta=document.createElement('textarea');ta.value=txt;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;opacity:0;left:-9999px';document.body.appendChild(ta);ta.select();
        try{ok=document.execCommand('copy');}catch(e){}ta.remove();
      }
      if(label){var l=lang();label.textContent=COPY[l].copiedBtn;setTimeout(function(){label.textContent=COPY[lang()].copyBtn;},1500);}
      if(window.mmTrack){try{window.mmTrack('insight_plan_copy',{ok:!!ok});}catch(e){}}
    }
    form.addEventListener('change',render);
    var copyBtn=document.getElementById('mm-insights-copy');if(copyBtn)copyBtn.addEventListener('click',copyPlan);
    renderCopy();render();
    var langObserver=new MutationObserver(function(muts){
      if(!muts.some(function(m){return m.type==='attributes'&&m.attributeName==='lang';}))return;
      renderCopy();render();updateStandaloneCopy();
    });
    langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }

  function updateStandaloneCopy(){
    var en=isEnglish();
    document.querySelectorAll('[data-mm-copy-ru][data-mm-copy-en]').forEach(function(el){el.textContent=en?el.getAttribute('data-mm-copy-en'):el.getAttribute('data-mm-copy-ru');});
  }

  function syncHeaderMode(){
    var w=window.innerWidth||document.documentElement.clientWidth||0;
    document.body.classList.toggle('mm-header-menu-mode',w>=768&&w<=1180);
  }

  function init(){
    syncHeaderMode();
    window.addEventListener('resize',syncHeaderMode,{passive:true});
    initProductLight();updateStandaloneCopy();initInsights();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
