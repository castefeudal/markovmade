/* Calculation and persistence owner, loaded as the LAB approaches view. */
(function(){
        // === MARKOVMADE LAB / calculator-only runtime ===
        const mmCalcSummaries = window.mmCalcSummaries = {};

        (function initMarkovMadeLab(){
            const root = document.getElementById('calculators');
            if (!root) return;

            const STORAGE_KEY = 'markovmade-lab-v1';
            const MODEL_VERSIONS = Object.freeze({ body:'1.0.0', nutrition:'1.0.0', overfeeding:'1.0.0', recovery:'1.0.0', progress:'1.0.0', strategy:'1.0.0' });
            const {mifflin,tenHaaf,tenHaafFFM,navyBodyFat,ffmi,weightedTef,glycogenRange,average:avg,movingAverage,regressionSlope,maintenanceCalibration,plateauStatus,detectWeightOutliers,robustDailySlope,estimate1RM,personalRecoveryBaseline} = window.MarkovMadeModels;
            const K = Object.freeze({
                kcalPerKgFatEquivalent: 7700,
                navySee: 3.6,
                glycogenWaterLow: 2.7,
                glycogenWaterHigh: 4.0,
                tef: { protein:[0.20,0.25,0.30], carbs:[0.05,0.075,0.10], fat:[0.00,0.02,0.03], alcohol:[0.10,0.20,0.30] },
                walkingKcalKgKm: 0.50,
                stepLengthHeightRatio: 0.414,
                strengthMet: 5,
                mixedDietTef: 0.10
            });

            const emptyState = () => ({
                profile: { sex:'', age:null, height:null, weight:null, bodyFat:null },
                body: {}, nutrition: {}, overfeeding: {}, recovery: {}, progress: {}, strength: {}, strategy: {}
            });
            let state = emptyState();
            try {
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
                if (saved && typeof saved === 'object') state = Object.assign(emptyState(), saved, { profile:Object.assign(emptyState().profile, saved.profile || {}) });
            } catch(e) {}

            const $ = (sel, ctx=root) => ctx.querySelector(sel);
            const $$ = (sel, ctx=root) => Array.from(ctx.querySelectorAll(sel));
            const el = id => document.getElementById(id);
            const val = id => el(id) ? el(id).value : '';
            const number = id => {
                const v = String(val(id) || '').trim().replace(',', '.');
                if (!v) return NaN;
                const n = Number(v);
                return Number.isFinite(n) ? n : NaN;
            };
            const clamp = (v,min,max) => Math.min(max,Math.max(min,v));
            const round = (v,d=0) => { const p=Math.pow(10,d); return Number.isFinite(v) ? Math.round(v*p)/p : NaN; };
            const fmt = (v,d=0) => Number.isFinite(v) ? new Intl.NumberFormat('ru-RU',{maximumFractionDigits:d,minimumFractionDigits:d}).format(v) : '—';
            const kg = (v,d=1) => Number.isFinite(v) ? `${fmt(v,d)} кг` : '—';
            const kcal = v => Number.isFinite(v) ? `${fmt(Math.round(v),0)} ккал` : '—';
            const grams = (v,d=0) => Number.isFinite(v) ? `${fmt(v,d)} г` : '—';
            const pct = (v,d=1) => Number.isFinite(v) ? `${fmt(v,d)}%` : '—';
            const setText = (id, text) => { const n=el(id); if(n){ n.dataset.ruDynamicText=String(text == null ? '' : text); n.textContent=(typeof window.__mmDynamicTranslate==='function')?window.__mmDynamicTranslate(String(text==null?'':text)):String(text==null?'':text); } };
            const setHTMLSafeList = (id, items) => { const node=el(id); if(!node) return; node.innerHTML=''; items.forEach(t=>{ const li=document.createElement('li');li.dataset.ruDynamicText=t;li.textContent=typeof window.__mmDynamicTranslate==='function'?window.__mmDynamicTranslate(t):t;node.appendChild(li); }); };
            const finite = (...xs) => xs.every(Number.isFinite);
            const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {} };
            const currentMode = tool => (root.dataset['mode'+tool] || 'quick');
            const segmentValue = name => { const b=$(`[data-segment="${name}"] button[aria-pressed="true"]`); return b ? b.dataset.value : ''; };
            const setBadge = (tool, quality, confidence) => {
                const q=$(`[data-quality="${tool}"]`), c=$(`[data-confidence="${tool}"]`);
                if(q) q.textContent=`Полнота: ${quality}`;
                if(c) c.textContent=`Уверенность: ${confidence}`;
            };
            const error = (tool,msg='') => setText(`lab-${tool}-error`,msg);
            const display = (node, show) => { if(node) node.hidden=!show; };
            const safeRange = (value, min, max, label) => Number.isFinite(value) && value>=min && value<=max ? '' : `${label}: укажите значение от ${min} до ${max}.`;
            const profileNumber = key => Number(state.profile[key]);
            const recoveryMethod=el('lab-rec-method');
            if(recoveryMethod){
                const details=recoveryMethod.closest('.mm-lab-details');
                if(details&&!el('lab-rec-breakdown')){
                    const baselineNote=document.createElement('p');baselineNote.id='lab-rec-baseline';baselineNote.className='mm-lab-insight';baselineNote.textContent='Baseline формируется: внесите RHR и HRV в PRO-режиме.';details.before(baselineNote);
                    const breakdown=document.createElement('div');breakdown.id='lab-rec-breakdown';breakdown.className='mm-lab-metrics';breakdown.setAttribute('role','group');breakdown.setAttribute('aria-label','Вклад сигналов в индекс самонаблюдения');details.before(breakdown);
                }
            }
            const strengthMount=el('lab-strength-mount');
            if(strengthMount){
                if(!el('lab-e1rm-tool')){
                    const tool=document.createElement('section');tool.id='lab-e1rm-tool';tool.className='mm-lab-e1rm';tool.setAttribute('aria-labelledby','lab-e1rm-title');
                    tool.innerHTML='<h4 id="lab-e1rm-title" data-no-translate data-ru-dynamic-text="Силовой ориентир · e1RM">Силовой ориентир · e1RM</h4><p>Расчётный максимум для сравнения динамики, а не рекомендация проверять реальный 1ПМ.</p><div class="mm-lab-fields"><div class="mm-lab-field"><label for="lab-e1rm-exercise">Упражнение</label><select id="lab-e1rm-exercise" class="mm-lab-select"><option>Присед</option><option>Жим лёжа</option><option>Становая тяга</option><option>Другое</option></select></div><div class="mm-lab-field"><label for="lab-e1rm-load">Рабочий вес · кг</label><input id="lab-e1rm-load" class="mm-lab-input" type="number" min="1" max="500" step="0.5" inputmode="decimal"></div><div class="mm-lab-field"><label for="lab-e1rm-reps">Повторения</label><input id="lab-e1rm-reps" class="mm-lab-input" type="number" min="1" max="15" step="1" inputmode="numeric"></div></div><div class="mm-lab-actions"><button type="button" class="mm-lab-primary" id="lab-e1rm-calculate">Оценить 1ПМ</button></div><p id="lab-e1rm-result" class="mm-lab-insight" aria-live="polite">Введите вес и повторы.</p>';
                    strengthMount.appendChild(tool);
                    const loadPlan=document.createElement('div');loadPlan.className='mm-lab-load-plan';loadPlan.setAttribute('data-no-translate','');loadPlan.innerHTML='<label for="lab-e1rm-increment" id="lab-e1rm-increment-label">Шаг округления · кг</label><select id="lab-e1rm-increment" class="mm-lab-select"><option value="2.5">2,5 кг</option><option value="5">5 кг</option></select><p id="lab-e1rm-load-plan" aria-live="polite"></p>';tool.appendChild(loadPlan);
                    let lastEstimate=null;
                    const renderLoads=()=>{
                        const english=document.documentElement.lang==='en',step=Number(val('lab-e1rm-increment'))||2.5;
                        el('lab-e1rm-increment-label').textContent=english?'Rounding step · kg':'Шаг округления · кг';
                        el('lab-e1rm-load-plan').textContent=lastEstimate?(english?'Reference loads: ':'Ориентиры нагрузки: ')+[70,80,90].map(percent=>`${percent}% ≈ ${fmt(Math.round(lastEstimate*percent/100/step)*step,1)} ${english?'kg':'кг'}`).join(' · ')+(english?' · Adjust for effort and technique.':' · Корректируйте по усилию и технике.'):(english?'Calculate e1RM to see rounded reference loads.':'Рассчитайте e1RM, чтобы увидеть округлённые ориентиры нагрузки.');
                    };
                    el('lab-e1rm-increment').addEventListener('change',renderLoads);
                    new MutationObserver(renderLoads).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});renderLoads();
                    el('lab-e1rm-calculate').addEventListener('click',()=>{
                        const load=Number(String(val('lab-e1rm-load')).replace(',','.')),reps=Number(val('lab-e1rm-reps')),exercise=val('lab-e1rm-exercise'),out=el('lab-e1rm-result');
                        if(!Number.isFinite(load)||load<1||load>500||!Number.isInteger(reps)||reps<1||reps>15){out.textContent='Укажите рабочий вес от 1 до 500 кг и 1–15 повторений.';return;}
                        const estimate=estimate1RM(load,reps),history=Array.isArray(state.strength?.history)?state.strength.history:[],previous=history.filter(item=>item.exercise===exercise).slice(-1)[0];
                        lastEstimate=estimate.value;renderLoads();
                        const entry={exercise,load,reps,value:estimate.value,date:localToday()};history.push(entry);state.strength={modelVersion:'1.0.0',history:history.slice(-90)};save();
                        const delta=previous?` · ${estimate.value-previous.value>=0?'+':''}${fmt(estimate.value-previous.value,1)} кг к предыдущей записи`:' · Запись стала начальной точкой тренда';
                        const resultText=`e1RM ≈ ${fmt(estimate.value,1)} кг · уверенность: ${estimate.confidence}${delta}. ${estimate.method}.`;
                        out.dataset.ruDynamicText=resultText;
                        out.textContent=typeof window.__mmDynamicTranslate==='function'?window.__mmDynamicTranslate(resultText):resultText;
                        root.dispatchEvent(new CustomEvent('mm:lab-state'));
                    });
                }
            }
            const dailyWeightInput=el('lab-prog-daily');
            if(dailyWeightInput&&!el('lab-prog-outliers')){const list=document.createElement('fieldset');list.id='lab-prog-outliers';list.className='mm-lab-outliers';list.hidden=true;list.innerHTML='<legend>Проверка необычных измерений</legend>';dailyWeightInput.after(list);}

            function localToday(){
                const d=new Date(), off=d.getTimezoneOffset()*60000;
                return new Date(d.getTime()-off).toISOString().slice(0,10);
            }
            if (el('lab-prog-end-date') && !el('lab-prog-end-date').value) el('lab-prog-end-date').value=localToday();

            function applyProfile(except){
                $$('[data-profile]').forEach(input=>{
                    if(input===except) return;
                    const key=input.dataset.profile;
                    const v=state.profile[key];
                    if(v!==null && v!==undefined && v!=='') input.value=String(v);
                });
                updateFemaleFields();
            }
            applyProfile();
            if(state.nutrition&&state.nutrition.calibrationInput){
                const input=state.nutrition.calibrationInput;
                if(el('lab-nutri-calibration-weights')) el('lab-nutri-calibration-weights').value=input.weights.join('\n');
                if(el('lab-nutri-calibration-calories')) el('lab-nutri-calibration-calories').value=input.averageCalories;
                if(el('lab-nutri-calibration-completeness')) el('lab-nutri-calibration-completeness').value=input.completenessPct;
                if(el('lab-nutri-calibration-adherence')) el('lab-nutri-calibration-adherence').value=input.adherencePct;
                if(el('lab-nutri-calibration-waist')&&input.waistDelta!==null) el('lab-nutri-calibration-waist').value=input.waistDelta;
            }

            $$('[data-profile]').forEach(input=>{
                const sync=()=>{
                    const key=input.dataset.profile;
                    const raw=input.value;
                    state.profile[key] = key==='sex' ? raw : (raw==='' ? null : Number(String(raw).replace(',','.')));
                    applyProfile(input); save();
                };
                input.addEventListener('input',sync); input.addEventListener('change',sync);
            });

            function updateFemaleFields(){
                const sex=state.profile.sex || val('lab-body-sex');
                $$('[data-female-only]').forEach(n=>display(n, sex==='female' && segmentValue('body-bf-method')==='tape'));
            }

            // Tabs: one source of truth, independent from legacy calculator handlers.
            const tabs=$$('[data-mm-lab-tab]'), panels=$$('[data-mm-lab-panel]');
            function showTab(key, focusPanel=false){
                tabs.forEach(t=>{ const active=t.dataset.mmLabTab===key; t.setAttribute('aria-selected',active?'true':'false'); t.tabIndex=active?0:-1; });
                panels.forEach(p=>p.hidden=p.dataset.mmLabPanel!==key);
                if(focusPanel){ const p=$(`[data-mm-lab-panel="${key}"]`); if(p){ p.setAttribute('tabindex','-1'); p.focus({preventScroll:true}); } }
            }
            tabs.forEach((tab,i)=>{
                tab.id=`mm-lab-tab-${tab.dataset.mmLabTab}`;
                tab.addEventListener('click',()=>showTab(tab.dataset.mmLabTab));
                tab.addEventListener('keydown',e=>{
                    if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) return;
                    e.preventDefault(); let ni=i;
                    if(e.key==='ArrowRight') ni=(i+1)%tabs.length;
                    if(e.key==='ArrowLeft') ni=(i-1+tabs.length)%tabs.length;
                    if(e.key==='Home') ni=0; if(e.key==='End') ni=tabs.length-1;
                    tabs[ni].focus(); showTab(tabs[ni].dataset.mmLabTab);
                });
            });
            showTab('body');
            $$('[data-lab-guide]').forEach(button=>button.addEventListener('click',()=>{
                const key=button.dataset.labGuide;
                if(!tabs.some(tab=>tab.dataset.mmLabTab===key))return;
                showTab(key,true);
                const panel=$(`[data-mm-lab-panel="${key}"]`);
                panel?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
            }));

            $$('[data-mode-switch]').forEach(wrap=>{
                const tool=wrap.dataset.modeSwitch;
                wrap.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
                    wrap.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b===btn?'true':'false'));
                    root.dataset['mode'+tool]=btn.dataset.mode;
                    $$(`[data-pro="${tool}"]`).forEach(n=>display(n,btn.dataset.mode!=='quick'));
                }));
            });

            $$('[data-segment]').forEach(wrap=>wrap.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
                wrap.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b===btn?'true':'false'));
                handleSegment(wrap.dataset.segment,btn.dataset.value);
            })));
            if(['balanced','higher-carb','higher-fat'].includes(state.nutrition.macroScenario)) $$('[data-segment="nutri-macro-scenario"] button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.value===state.nutrition.macroScenario)));
            $$('[data-mode-switch="nutrition"] button').forEach(button=>button.addEventListener('click',()=>{
                if(button.dataset.mode==='calibrated'){
                    const choice=$('[data-segment="nutri-maint-source"] [data-value="calibrated"]');
                    if(choice)choice.click();
                } else if(button.dataset.mode==='pro'){
                    const choice=$('[data-segment="nutri-maint-source"] [data-value="model"]');
                    if(choice)choice.click();
                } else if(button.dataset.mode==='quick'){
                    $$('[data-calibration-output]').forEach(node=>display(node,false));
                }
            }));
            function handleSegment(name,value){
                if(name==='body-bf-method'){
                    $$('[data-bf-known]').forEach(n=>display(n,value==='known'));
                    $$('[data-bf-tape]').forEach(n=>display(n,value==='tape'));
                    updateFemaleFields();
                }
                if(name==='nutri-maint-source'){ $$('[data-maint-measured]').forEach(n=>display(n,value==='measured')); $$('[data-maint-calibrated]').forEach(n=>display(n,value==='calibrated')); $$('[data-calibration-output]').forEach(n=>display(n,value==='calibrated'&&currentMode('nutrition')==='calibrated')); }
                if(name==='fat-maint-source'){
                    $$('[data-fat-maint-known]').forEach(n=>display(n,value==='known'));
                    $$('[data-fat-maint-auto]').forEach(n=>display(n,value==='auto'));
                }
                if(name==='fat-input-mode') $$('[data-fat-macros]').forEach(n=>display(n,value==='macros'));
                if(name==='nutri-macro-scenario' && state.nutrition && Number.isFinite(state.nutrition.target)) renderNutritionMacros(state.nutrition,value);
            }
            handleSegment('body-bf-method',segmentValue('body-bf-method'));
            handleSegment('nutri-maint-source',segmentValue('nutri-maint-source'));
            handleSegment('fat-maint-source',segmentValue('fat-maint-source'));
            handleSegment('fat-input-mode',segmentValue('fat-input-mode'));

            el('lab-fat-comp')?.addEventListener('change',()=>display($('[data-fat-comp-custom]'),val('lab-fat-comp')==='custom'));

            /* include: lab-domains/body.js */
            /* include: lab-domains/nutrition.js */
            /* include: lab-domains/overfeeding.js */
            /* include: lab-domains/recovery.js */
            /* include: lab-domains/progress.js */
            /* include: lab-domains/strategy.js */
            function updateSnapshot(){
                const data={
                    bf: state.body&&Number.isFinite(state.body.bf)?`${fmt(state.body.bf,1)}%`:null,
                    ffmi: state.body&&Number.isFinite(state.body.ffmi)?fmt(state.body.ffmi,1):null,
                    tdee: state.nutrition&&Number.isFinite(state.nutrition.tdee)?`${fmt(state.nutrition.tdee,0)} ккал`:null,
                    target: state.nutrition&&Number.isFinite(state.nutrition.target)?`${fmt(state.nutrition.targetLow,0)}–${fmt(state.nutrition.targetHigh,0)}`:null,
                    readiness: state.recovery&&Number.isFinite(state.recovery.score)?`${fmt(state.recovery.score,0)}/100`:null,
                    pace: state.progress&&Number.isFinite(state.progress.weeklyPct)?`${state.progress.weeklyPct>=0?'+':''}${fmt(state.progress.weeklyPct,2)}%/нед.`:null,
                    strategy: state.strategy&&state.strategy.main?state.strategy.main:null
                };
                let any=false; Object.entries(data).forEach(([key,v])=>{ const card=$(`[data-snap="${key}"]`); if(card){card.hidden=!v;if(v){card.querySelector('b').textContent=v;any=true;}} });
                const snapshot=el('mm-lab-snapshot'); if(snapshot) snapshot.hidden=false;
                const empty=el('mm-lab-snapshot-empty'); if(empty) empty.hidden=any;
                root.dispatchEvent(new CustomEvent('mm:lab-state'));
            }
            updateSnapshot();

            function copyText(text){
                if(!text) return;
                if(navigator.clipboard&&window.isSecureContext) navigator.clipboard.writeText(text).catch(()=>fallbackCopy(text)); else fallbackCopy(text);
            }
            function fallbackCopy(text){ const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}ta.remove(); }
            function summaryFor(tool){return mmCalcSummaries[tool]||'';}
            $$('[data-copy]').forEach(btn=>btn.addEventListener('click',()=>{const s=summaryFor(btn.dataset.copy);if(!s)return;copyText(s);const old=btn.textContent;btn.textContent='Скопировано';setTimeout(()=>btn.textContent=old,1200);}));
            $$('[data-telegram]').forEach(btn=>btn.addEventListener('click',()=>{const s=summaryFor(btn.dataset.telegram);if(!s)return;window.mmPreviewShare(s,`https://t.me/share/url?url=${encodeURIComponent(location.href.split('#')[0])}&text=${encodeURIComponent(s)}`);}));

            const calculators={body:calculateBody,nutrition:calculateNutrition,overfeeding:calculateOverfeeding,recovery:calculateRecovery,progress:calculateProgress,strategy:calculateStrategy};
            $$('[data-calc]').forEach(btn=>btn.addEventListener('click',()=>{const fn=calculators[btn.dataset.calc];if(fn)fn();}));

            const defaults={
                'lab-fat-days':'1','lab-rec-sleep':'7','lab-rec-energy':'7','lab-rec-stress':'4','lab-rec-desire':'7','lab-rec-soreness':'4','lab-rec-well':'7','lab-prog-end-date':localToday()
            };
            function resetTool(tool){
                const panel=$(`[data-mm-lab-panel="${tool}"]`); if(!panel)return;
                panel.querySelectorAll('input,textarea').forEach(x=>{ if(x.dataset.profile)return; x.value=Object.prototype.hasOwnProperty.call(defaults,x.id)?defaults[x.id]:''; });
                panel.querySelectorAll('select').forEach(x=>{ if(x.dataset.profile)return; x.selectedIndex=0; });
                if(tool==='nutrition'){el('lab-nutri-goal').value='recomp';el('lab-nutri-pace').value='standard';el('lab-nutri-pal').value='1.5';el('lab-nutri-athlete').value='general';el('lab-nutri-work').value='mixed';el('lab-nutri-cardio-int').value='7';}
                if(tool==='overfeeding'){el('lab-fat-gly-status').value='normal';el('lab-fat-training').value='none';el('lab-fat-level').value='trained';el('lab-fat-comp').value='0';}
                if(tool==='recovery'){el('lab-rec-failure').value='no';el('lab-rec-deficit').value='light';el('lab-rec-work').value='medium';}
                if(tool==='progress'){el('lab-prog-goal').value='cut';}
                if(tool==='strategy'){el('lab-str-goal').value='recomp';el('lab-str-blocker').value='consistency';el('lab-str-readiness').value='medium';el('lab-str-horizon').value='14';}
                state[tool]={}; mmCalcSummaries[tool]=''; if(tool==='strategy')mmCalcSummaries.format=''; save(); updateSnapshot();
            }
            $$('[data-reset]').forEach(btn=>btn.addEventListener('click',()=>resetTool(btn.dataset.reset)));
            el('mm-lab-clear-all')?.addEventListener('click',()=>{
                if(!window.confirm('Очистить локальные данные MARKOVMADE LAB на этом устройстве?')) return;
                try{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem('markovmade-lab-history-v1');localStorage.removeItem('markovmade-lab-daily-v1');localStorage.removeItem('markovmade-lab-favorites-v1')}catch(e){} state=emptyState(); if(window.MarkovMadeLab) window.MarkovMadeLab.state=state;
                $$('[data-profile]').forEach(x=>x.value=''); ['body','nutrition','overfeeding','recovery','progress','strategy'].forEach(resetTool); updateFemaleFields(); updateSnapshot();
            });

            // Consistency check between declared calories and macros.
            const macroIds=['lab-fat-intake','lab-fat-p','lab-fat-f','lab-fat-c','lab-fat-alcohol'];
            macroIds.forEach(id=>el(id)?.addEventListener('input',()=>{
                if(segmentValue('fat-input-mode')!=='macros')return;
                const intake=number('lab-fat-intake'),p=number('lab-fat-p'),f=number('lab-fat-f'),c=number('lab-fat-c'),a=number('lab-fat-alcohol');
                if(!Number.isFinite(intake))return; const mk=(Number.isFinite(p)?p:0)*4+(Number.isFinite(f)?f:0)*9+(Number.isFinite(c)?c:0)*4+(Number.isFinite(a)?a:0)*7;
                if(mk>0){const diff=Math.abs(mk-intake);setText('lab-fat-macro-check',diff>Math.max(150,intake*.1)?`БЖУ дают ~${fmt(mk,0)} ккал против ${fmt(intake,0)}. Выберите источник ниже.`:`БЖУ дают ~${fmt(mk,0)} ккал — расхождение небольшое.`)}
            }));

            // Public namespace: calculations remain deterministic and testable.
            window.MarkovMadeLab={
                version:'1.0.0', state, constants:K,
                engine:{mifflin,tenHaaf,tenHaafFFM,navyBodyFat,ffmi,weightedTef,glycogenRange,average:avg,movingAverage,regressionSlope,maintenanceCalibration,plateauStatus},
                calculate:{body:calculateBody,nutrition:calculateNutrition,overfeeding:calculateOverfeeding,recovery:calculateRecovery,progress:calculateProgress,strategy:calculateStrategy},
                runSelfTests:function(){
                    const tests=[]; const near=(a,b,t)=>Math.abs(a-b)<=t;
                    tests.push(['Mifflin male',near(mifflin('male',30,180,80),1780,1)]);
                    tests.push(['Mifflin female',near(mifflin('female',30,165,60),1320.25,1)]);
                    tests.push(['Navy male plausible',(()=>{const x=navyBodyFat('male',180,85,40,NaN);return x>5&&x<35})()]);
                    tests.push(['Navy invalid geometry',Number.isNaN(navyBodyFat('male',180,35,40,NaN))]);
                    tests.push(['Moving average',JSON.stringify(movingAverage([1,2,3,4,5,6,7],7))==='[4]']);
                    tests.push(['Regression flat',near(regressionSlope([5,5,5,5]),0,.0001)]);
                    const g=glycogenRange('lowcarb','none',300);tests.push(['Glycogen capped by carbs',g[1]===300]);
                    const pass=tests.every(x=>x[1]); return {pass,tests};
                }
            };
            try{ const r=window.MarkovMadeLab.runSelfTests(); if(!r.pass) console.warn('[MARKOVMADE LAB] self-tests failed',r); }catch(e){console.warn('[MARKOVMADE LAB] self-tests error',e);}
        })();

})();
