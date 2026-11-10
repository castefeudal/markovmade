            function energyModel(){
                const sex=val('lab-nutri-sex'), age=number('lab-nutri-age'), h=number('lab-nutri-height'), w=number('lab-nutri-weight');
                if(!sex) throw new Error('Выберите пол.');
                for(const [v,min,max,label] of [[age,18,90,'Возраст'],[h,120,230,'Рост'],[w,35,300,'Вес']]){ const m=safeRange(v,min,max,label); if(m) throw new Error(m); }
                const mode=currentMode('nutrition'), pro=mode!=='quick', athlete=val('lab-nutri-athlete')==='athlete';
                const scenarioErrorPct=pro?number('lab-nutri-calibration-error'):10;
                if(!Number.isFinite(scenarioErrorPct)||scenarioErrorPct<0||scenarioErrorPct>30)throw new Error('Допущение неопределённости: укажите от 0 до 30%.');
                const bf=number('lab-nutri-bf'); if(Number.isFinite(bf)&&(bf<3||bf>60))throw new Error('Проверьте процент жира: 3–60%.'); let rmr,rmrMethod;
                if(pro && athlete && age>=18 && age<=35){ rmr=tenHaaf(sex,age,h,w); rmrMethod='ten Haaf (атлеты 18–35)'; }
                else { rmr=mifflin(sex,age,h,w); rmrMethod=age<19||age>78?'Mifflin–St Jeor · возраст вне исходной выборки 19–78 лет':'Mifflin–St Jeor'; }
                let tdee,tdeeLow,tdeeHigh,tdeeMethod,confidence='Низкая';
                const maintSource=pro?segmentValue('nutri-maint-source'):'model';
                let calibration=null,formulaTdee=NaN,formulaTdeeLow=NaN,formulaTdeeHigh=NaN,calibrationInput=null;
                if(mode==='calibrated' || (pro&&maintSource==='calibrated')){
                    const raw=val('lab-nutri-calibration-weights').trim();
                    const observations=window.MarkovMadeModels.parseWeightObservations(raw),weights=observations.values;
                    if(weights.length<14){const missing=14-weights.length,unit=missing===1?'день':missing<5?'дня':'дней';throw new Error('Нужно ещё '+missing+' '+unit+' данных: для калибровки требуется минимум 14 ежедневных весов.');}
                    if(weights.length>28) throw new Error('Оставьте последние 14–28 ежедневных весов.');
                    if(observations.days.some((day,index)=>index>0&&day-observations.days[index-1]!==1)) throw new Error('В калибровке есть пропущенные даты. Соберите 14–28 последовательных дней веса и питания; пропуски не заменяются вымышленными значениями.');
                    const averageCalories=number('lab-nutri-calibration-calories'), completenessPct=number('lab-nutri-calibration-completeness'), adherencePct=number('lab-nutri-calibration-adherence'), waistDelta=number('lab-nutri-calibration-waist');
                    const calorieError=safeRange(averageCalories,1000,8000,'Средние калории'), completenessError=safeRange(completenessPct,0,100,'Полнота записей'), adherenceError=safeRange(adherencePct,0,100,'Соблюдение плана');
                    if(calorieError||completenessError||adherenceError) throw new Error(calorieError||completenessError||adherenceError);
                    calibration=maintenanceCalibration(weights,averageCalories,completenessPct,adherencePct,waistDelta,number('lab-nutri-calibration-error'));
                    const pal=Number(val('lab-nutri-pal')||1.5); formulaTdee=rmr*pal; formulaTdeeLow=formulaTdee*.9; formulaTdeeHigh=formulaTdee*1.1;
                    tdee=calibration.value;tdeeLow=calibration.low;tdeeHigh=calibration.high;tdeeMethod='наблюдаемые данные · 14–28 дней';confidence=calibration.confidence;
                    calibrationInput={rawObservations:raw,intakeErrorPct:calibration.intakeErrorPct,weights,averageCalories,completenessPct,adherencePct,waistDelta:Number.isFinite(waistDelta)?waistDelta:null};
                } else if(pro && maintSource==='measured'){
                    const measured=number('lab-nutri-measured'); const m=safeRange(measured,1000,8000,'Фактические калории поддержания'); if(m) throw new Error(m);
                    tdee=measured; tdeeLow=measured*(1-scenarioErrorPct/100); tdeeHigh=measured*(1+scenarioErrorPct/100); tdeeMethod=`указанный пользователем ориентир поддержания · сценарий ±${scenarioErrorPct}%, не измерение`; confidence='Не установлена';
                } else if(pro&&val('lab-nutri-activity-model')==='components'){
                    const steps=number('lab-nutri-steps'), sn=number('lab-nutri-strength-n'), sm=number('lab-nutri-strength-min'), cn=number('lab-nutri-cardio-n'), cm=number('lab-nutri-cardio-min');
                    const work=val('lab-nutri-work')||'sedentary', cmet=Number(val('lab-nutri-cardio-int')||7);
                    for(const [value,max] of [[steps,60000],[sn,14],[sm,300],[cn,14],[cm,600]])if(Number.isFinite(value)&&(value<0||value>max))throw new Error('Проверьте шаги, частоту и длительность тренировок: значения не могут быть отрицательными или чрезмерными.');
                    const stepN=Number.isFinite(steps)?steps:0;
                    const distanceKm=stepN*(h/100)*K.stepLengthHeightRatio/1000;
                    const walking=K.walkingKcalKgKm*w*distanceKm;
                    const strength=finite(sn,sm)?Math.max(0,K.strengthMet-1)*w*(sm/60)*(sn/7):0;
                    const cardio=finite(cn,cm)?Math.max(0,cmet-1)*w*(cm/60)*(cn/7):0;
                    const workAdj=number('lab-nutri-other-energy');if(!Number.isFinite(workAdj)||workAdj<0||workAdj>1500)throw new Error('Проверьте сценарий прочей активности: 0–1500 ккал/день, без шагов и тренировок.');
                    const preTef=rmr+walking+strength+cardio+workAdj;
                    tdee=preTef/(1-K.mixedDietTef);
                    tdeeLow=tdee*(1-scenarioErrorPct/100); tdeeHigh=tdee*(1+scenarioErrorPct/100); tdeeMethod='PRO-сценарий: RMR + шаги вне тренировок + net MET + заданная прочая активность; TEF 10%';
                    confidence='Низкая';
                } else {
                    const pal=Number(val('lab-nutri-pal')||1.5); tdee=rmr*pal; tdeeLow=tdee*(1-scenarioErrorPct/100); tdeeHigh=tdee*(1+scenarioErrorPct/100); tdeeMethod=`RMR × PAL ${pal}`; confidence='Низкая';
                }
                return {sex,age,h,w,bf,pro,athlete,rmr,rmrMethod,tdee,tdeeLow,tdeeHigh,tdeeMethod,confidence,scenarioErrorPct,calibration,calibrationInput,formulaTdee,formulaTdeeLow,formulaTdeeHigh};
            }

            function renderNutritionMacros(nutrition,scenario=segmentValue('nutri-macro-scenario')||'balanced'){
                const {w,target,targetLow,targetHigh,pLow,pHigh,pMid}=nutrition;
                const share=scenario==='higher-carb'?.20:scenario==='higher-fat'?.35:.25;
                const fatFloor=w*.6;
                const allocation=window.MarkovMadeModels.macroAllocation(target,pMid,fatFloor,share);
                const fatMid=allocation.fat;
                const fatLow=Math.max(fatFloor,targetLow*share/9), fatHigh=Math.max(fatLow,targetHigh*share/9);
                const carbMid=allocation.carbs;
                const carbLow=Math.max(0,(targetLow-pHigh*4-fatHigh*9)/4), carbHigh=Math.max(0,(targetHigh-pLow*4-fatLow*9)/4);
                nutrition.intervalType='scenario'; nutrition.macroCalories=allocation.macroCalories; nutrition.macroScenario=scenario; nutrition.fatLow=fatLow; nutrition.fatHigh=fatHigh; nutrition.fatMid=fatMid; nutrition.carbLow=carbLow; nutrition.carbHigh=carbHigh; nutrition.carbMid=carbMid;
                setText('lab-nutri-fat',`${fmt(fatMid,0)} г`); setText('lab-nutri-carb',`${fmt(carbMid,0)} г`);
                if(mmCalcSummaries.nutrition){ mmCalcSummaries.nutrition=mmCalcSummaries.nutrition.replace(/Жиры: .*\n/,`Жиры: ${fmt(fatMid,0)} г\n`).replace(/Углеводы: .*\n/,`Углеводы: ${fmt(carbMid,0)} г\n`); }
                save();
                return {fatLow,fatHigh,carbLow,carbHigh};
            }
            function calculateNutrition(){
                error('nutrition'); let e;
                try{ e=energyModel(); }catch(err){ error('nutrition',err.message); return null; }
                const goal=val('lab-nutri-goal'), pace=val('lab-nutri-pace');
                const cuts={gentle:.10,standard:.17,fast:.23}, bulks={gentle:.04,standard:.07,fast:.10};
                let mult=1;
                if(goal==='cut') mult=1-cuts[pace]; else if(goal==='recomp') mult=.96; else if(goal==='bulk') mult=1+bulks[pace];
                if(goal==='cut' && Number.isFinite(e.bf)){
                    const lean=e.bf < (e.sex==='male'?12:20); if(lean) mult=Math.max(mult,.85);
                }
                const targetScenario=window.MarkovMadeModels.nutritionTarget(e.tdee,e.tdeeLow,e.tdeeHigh,mult);
                const center=targetScenario.target, low=targetScenario.targetLow, high=targetScenario.targetHigh;
                if(center<1000)return error('nutrition','Расчётная цель ниже 1000 ккал: инструмент не рекомендует такой рацион. Пересмотрите цель и исходные данные с квалифицированным специалистом.'),null;
                const lbm=Number.isFinite(e.bf)?e.w*(1-e.bf/100):NaN;
                let pLow=e.w*1.6,pHigh=e.w*2.2,pNote='1,6–2,2 г/кг — ориентир при силовых тренировках; верхняя граница не обязательна';
                if(goal==='cut' && e.athlete && Number.isFinite(lbm) && e.bf < (e.sex==='male'?18:28)){
                    pLow=lbm*2.3; pHigh=lbm*3.1; pNote='2,3–3,1 г/кг FFM — диапазон для сухих силовых атлетов в дефиците';
                } else if(Number.isFinite(e.bf) && e.bf>(e.sex==='male'?25:35)){
                    pLow=lbm*2.0; pHigh=lbm*2.6; pNote='FFM-based practical range, чтобы высокий BF не завышал белок';
                }
                if(pLow*4+e.w*.6*9>center){error('nutrition','Выбранная калорийность не вмещает нижние ориентиры белка и жиров. Пересмотрите цель или исходные данные.');return null;}
                const pMid=Math.min(pLow,(center-e.w*.6*9)/4);
                const fatLow=Math.max(e.w*0.6,center*0.20/9), fatHigh=Math.max(fatLow,center*0.30/9), fatMid=(fatLow+fatHigh)/2;
                const carbLow=Math.max(0,(low-pHigh*4-fatHigh*9)/4), carbHigh=Math.max(0,(high-pLow*4-fatLow*9)/4), carbMid=Math.max(0,(center-pMid*4-fatMid*9)/4);
                state.profile={sex:e.sex,age:e.age,height:e.h,weight:e.w,bodyFat:Number.isFinite(e.bf)?e.bf:state.profile.bodyFat};
                state.nutrition={modelVersion:MODEL_VERSIONS.nutrition,...e,goal,pace,targetLow:low,target:center,targetHigh:high,pLow,pHigh,pMid,fatLow,fatHigh,fatMid,carbLow,carbHigh,carbMid}; save(); applyProfile();
                setText('lab-nutri-main',`~${fmt(center,0)} ккал`); setText('lab-nutri-center',kcal(center)); setText('lab-nutri-rmr',kcal(e.rmr)); setText('lab-nutri-rmr-method',e.rmrMethod); setText('lab-nutri-tdee',`${fmt(e.tdeeLow,0)}–${fmt(e.tdeeHigh,0)}`); setText('lab-nutri-tdee-method',e.tdeeMethod);
                display($('[data-calibration-output]'),!!e.calibration);
                setText('lab-nutri-formula-estimate',e.calibration?(fmt(e.formulaTdeeLow,0)+'–'+fmt(e.formulaTdeeHigh,0)+' ккал'):'—');
                setText('lab-nutri-formula-note',e.calibration?'Mifflin × PAL · модельная оценка':'—');
                setText('lab-nutri-protein',`${fmt(pMid,0)} г`); setText('lab-nutri-protein-note',pNote);
                const macroScenario=segmentValue('nutri-macro-scenario')||'balanced';
                const macroRange=renderNutritionMacros(state.nutrition={modelVersion:MODEL_VERSIONS.nutrition,...e,goal,pace,targetLow:low,target:center,targetHigh:high,pLow,pHigh,pMid,fatLow,fatHigh,fatMid,carbLow,carbHigh,carbMid},macroScenario);
                const shownFatLow=macroRange.fatLow,shownFatHigh=macroRange.fatHigh,shownCarbLow=macroRange.carbLow,shownCarbHigh=macroRange.carbHigh;
                let meaning=`Стартуйте около ${fmt(center,0)} ккал, но считайте ${fmt(low,0)}–${fmt(high,0)} сценарной чувствительностью исходного расхода, а не обязательным коридором питания. Расчётные калории поддержания сами имеют диапазон ${fmt(e.tdeeLow,0)}–${fmt(e.tdeeHigh,0)} ккал.`;
                if(e.tdeeMethod==='фактические калории поддержания') meaning+=' Здесь ваш наблюдаемый maintenance имеет приоритет над predictive equation.';
                if(e.calibration) meaning+=' Калибровка: '+e.calibration.days+' дней. Наблюдаемая оценка '+fmt(e.tdee,0)+' ккал; рабочий диапазон '+fmt(e.tdeeLow,0)+'–'+fmt(e.tdeeHigh,0)+' ккал. Уверенность '+e.confidence.toLowerCase()+'.';
                if(e.calibration){ const uncertainty=e.calibration.noiseKg>.7?'шум веса':e.calibration.completenessPct<90?'полнота записей':e.calibration.adherencePct<85?'соблюдение рациона':'длительность тренда'; meaning+=' Главный источник неопределённости: '+uncertainty+'.'; }
                setText('lab-nutri-meaning',`Что это значит: ${meaning}`);
                setHTMLSafeList('lab-nutri-actions',[`Держите среднее около ${fmt(center,0)} ккал/сут, а не пытайтесь идеально попасть в число каждый день.`,`Стартовое распределение: белок ${fmt(pMid,0)} г, жиры ${fmt(state.nutrition.fatMid,0)} г, углеводы ${fmt(state.nutrition.carbMid,0)} г. Оно согласовано с калорийностью; верхняя граница белкового диапазона не обязательна.`,`Через 14–21 день сравните средний вес, талию, силовые и соблюдение. Если тренд не соответствует цели — корректируйте на 5–8%, а не переписывайте всё.`]);
                const cross= e.pro&&e.athlete&&Number.isFinite(lbm)?` Для справки FFM-версия ten Haaf дала бы ~${fmt(tenHaafFFM(lbm),0)} ккал RMR; значения не усредняются механически.`:'';
                setText('lab-nutri-method',`${e.rmrMethod}: оценка RMR, не прямое измерение. ${e.tdeeMethod}. В SIMPLE используется только PAL. В PRO PAL отключён, поэтому шаги/работа/тренировки не накладываются на уже высокий activity multiplier.${cross} Диапазон TDEE отражает практическую неопределённость модели и NEAT, а не статистический confidence interval.`);
                setBadge('nutrition',e.calibration?e.calibration.quality:'Модельная оценка',e.confidence);
                let summary=`MARKOVMADE LAB — Калории / БЖУ\nRMR: ~${fmt(e.rmr,0)} ккал (${e.rmrMethod})\nКалории поддержания: ~${fmt(e.tdee,0)} ккал\nРабочий старт: ~${fmt(center,0)} ккал; чувствительность расхода ${fmt(low,0)}–${fmt(high,0)} ккал (сценарий)\nБелок: ${fmt(pMid,0)} г\nЖиры: ${fmt(state.nutrition.fatMid,0)} г\nУглеводы: ${fmt(state.nutrition.carbMid,0)} г\n\nКорректировать по тренду 14–21 дней.\nMARKOVMADE / Pavel Markov`;
                if(e.calibration) summary+='\nФормульная оценка: '+fmt(e.formulaTdee,0)+' ккал; наблюдаемый диапазон: '+fmt(e.tdeeLow,0)+'–'+fmt(e.tdeeHigh,0)+' ккал ('+e.confidence+').\nЧувствительность веса: 7000–9000 ккал/кг, не фиксированная константа.';
                mmCalcSummaries.nutrition=summary; updateSnapshot(); return state.nutrition;
            }

            function overfeedingMaintenance(sex,age,h,w){
                const source=segmentValue('fat-maint-source');
                if(source==='known'){
                    const m=number('lab-fat-maint'); const er=safeRange(m,1000,8000,'Калории поддержания'); if(er) throw new Error(er);
                    return {value:m,low:m*.90,high:m*1.10,label:'указанный ориентир · сценарий ±10%, не измерение',confidence:'Не установлена'};
                }
                if(state.nutrition && Number.isFinite(state.nutrition.tdee)&&state.nutrition.sex===sex&&state.nutrition.age===age&&state.nutrition.h===h&&state.nutrition.w===w) return {value:state.nutrition.tdee,low:state.nutrition.tdeeLow,high:state.nutrition.tdeeHigh,label:'из MARKOVMADE Calories',confidence:state.nutrition.confidence||'Умеренная'};
                const pal=Number(val('lab-fat-pal')||1.5), rmr=mifflin(sex,age,h,w), m=rmr*pal;
                return {value:m,low:m*.90,high:m*1.10,label:'рассчитан автоматически',confidence:'Низкая'};
            }
