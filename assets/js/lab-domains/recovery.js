            function calculateRecovery(){
                error('recovery');
                if(currentMode('recovery')==='pro')for(const [id,min,max]of [['lab-rec-hours',0,16],['lab-rec-rhr',30,130],['lab-rec-rhr-base',30,130],['lab-rec-hrv',5,300],['lab-rec-hrv-base',5,300],['lab-rec-sessions',0,14],['lab-rec-steps',0,50000]])if(val(id).trim()&&!Number.isFinite(number(id))||val(id).trim()&&(number(id)<min||number(id)>max))return error('recovery','Проверьте диапазон объективных показателей.'),null;
                const device=val('lab-rec-device').trim();
                const ids=['sleep','energy','stress','desire','soreness','well'], labels=['сон','энергия','стресс','желание тренироваться','болезненность','самочувствие'];
                const values=ids.map(x=>number(`lab-rec-${x}`));
                for(let i=0;i<values.length;i++){ const m=safeRange(values[i],1,10,labels[i]); if(m) return error('recovery',m),null; }
                const scores=[values[0]/10,values[1]/10,(11-values[2])/10,values[3]/10,(11-values[4])/10,values[5]/10], weights=[.20,.20,.17,.15,.13,.15];
                let score=scores.reduce((s,v,i)=>s+v*weights[i],0)*100, adjustments=[], pro=currentMode('recovery')==='pro', proCount=0;
                const contributions=labels.map((label,i)=>({label,value:round((scores[i]-.5)*weights[i]*100,1)}));
                if(pro){
                    const addContribution=(label,delta,reason)=>{score+=delta;contributions.push({label,value:delta});if(reason)adjustments.push(reason);};
                    const hours=number('lab-rec-hours'); if(Number.isFinite(hours)){proCount++; if(hours<6)addContribution('Сон, контекст',-8,'очень короткий сон');else if(hours<7)addContribution('Сон, контекст',-4,'короткий сон');else if(hours>=8)addContribution('Сон, контекст',2,'');}
                    const sessions=number('lab-rec-sessions'); if(Number.isFinite(sessions)){proCount++;if(sessions>=9)addContribution('Частота тренировок',-7,'очень высокая частота тренировок');else if(sessions>=7)addContribution('Частота тренировок',-4,'высокая частота тренировок')}
                    if(val('lab-rec-failure')==='yes'){addContribution('Отказная работа',-4,'много отказной работы');proCount++;}
                    const def=val('lab-rec-deficit'); if(def==='medium')addContribution('Дефицит энергии',-3,'дефицит энергии'); if(def==='hard')addContribution('Дефицит энергии',-6,'жёсткий дефицит');
                    const work=val('lab-rec-work'); if(work==='high')addContribution('Рабочая нагрузка',-4,'высокая рабочая нагрузка');
                    const rhr=number('lab-rec-rhr'),hrv=number('lab-rec-hrv'),today=localToday(),history=Array.isArray(state.recovery.history)?state.recovery.history:[];
                    const beforeToday=history.filter(item=>item.date!==today),baseline=window.MarkovMadeModels.datedRecoveryBaseline(beforeToday,{device,endDate:today});
                    const rhrBase=baseline.ready?baseline.rhr:number('lab-rec-rhr-base'),hrvBase=baseline.ready?baseline.hrv:number('lab-rec-hrv-base');
                    if(Number.isFinite(rhr)){proCount++;if(Number.isFinite(rhrBase)&&rhrBase>0){const delta=(rhr-rhrBase)/rhrBase;if(delta>=.10)addContribution('RHR относительно личной нормы',-5,'RHR заметно выше baseline');else if(delta>=.05)addContribution('RHR относительно личной нормы',-2,'RHR выше baseline')}}
                    if(Number.isFinite(hrv)){proCount++;if(Number.isFinite(hrvBase)&&hrvBase>0){const delta=(hrv-hrvBase)/hrvBase;if(delta<=-.20)addContribution('HRV относительно личной нормы',-5,'HRV заметно ниже baseline');else if(delta<=-.10)addContribution('HRV относительно личной нормы',-2,'HRV ниже baseline')}}
                    if(finite(rhr,hrv)){
                        const next=history.filter(item=>item.date!==today||String(item.device||'').trim()!==device);next.push({date:today,rhr,hrv,device,sleepHours:Number.isFinite(hours)?hours:null});
                        state.recovery.history=next.slice(-90);
                        const forming=window.MarkovMadeModels.datedRecoveryBaseline(state.recovery.history,{device,endDate:today});
                        setText('lab-rec-baseline',forming.ready?`Личный baseline · ${forming.days} дней · RHR ${fmt(forming.rhr,0)} · HRV ${fmt(forming.hrv,0)} мс`:!forming.deviceVerified&&forming.days>=forming.required?'Даты собраны, но устройство и протокол не указаны. Автоматический baseline не подтверждён.':`Baseline формируется · ${forming.days} / ${forming.required} качественных дней`);
                    }
                }
                score=clamp(score,0,100);
                const positiveIndex=scores.indexOf(Math.max(...scores)), limiterIndex=scores.indexOf(Math.min(...scores));
                let status,training,decision;
                if(score>=80){status='Ресурс хороший';training='По плану';decision='Большинство сигналов поддерживает обычную нагрузку. Не добавляйте объём только потому, что score высокий.'}
                else if(score>=65){status='Рабочее состояние';training='Планово / без добивания';decision='Можно тренироваться, но сегодня плохой день для незапланированного увеличения объёма или отказных подходов.'}
                else if(score>=50){status='Накопилась нагрузка';training='Снизить объём';decision='Вероятно, больше пользы даст уменьшение объёма/интенсивности и приоритет сна, чем ещё одна тяжёлая сессия.'}
                else {status='Ресурс низкий';training='Восстановительная нагрузка';decision='Сигналы сходятся в сторону восстановления. Если состояние необычное, выраженное или сохраняется — не трактуйте score как диагноз и оцените здоровье отдельно.'}
                const observations=Array.isArray(state.recovery.observations)?state.recovery.observations:[];
                const observation={date:localToday(),sleepHours:pro&&Number.isFinite(number('lab-rec-hours'))?number('lab-rec-hours'):null,device,subjective:values.slice()};
                state.recovery={...state.recovery,modelVersion:MODEL_VERSIONS.recovery,calculatedAt:new Date().toISOString(),device,observations:[...observations.filter(row=>row.date!==observation.date),observation].slice(-90),score,status,training,positive:labels[positiveIndex],limiter:labels[limiterIndex],adjustments,proCount,contributions}; save();
                setText('lab-rec-main',`${fmt(score,0)} / 100`); setText('lab-rec-status',status); el('lab-rec-bar').style.width=`${score}%`; setText('lab-rec-positive',labels[positiveIndex]); setText('lab-rec-limiter',labels[limiterIndex]); setText('lab-rec-training',training); setText('lab-rec-meaning',`Решение дня: ${decision}`);
                const acts=[score>=65?'Оставьте запланированную тренировку, но не повышайте нагрузку без причины.':'Сократите объём или перенесите тяжёлую работу; сохраните движение в восстановительном формате.',values[0]<=5?'Сегодня главный ROI — сон: не пытайтесь компенсировать его стимуляторами и дополнительной нагрузкой.':'Сон не выглядит главным ограничителем по субъективной оценке — не меняйте его радикально.',adjustments.length?`PRO-контекст, который тянет score вниз: ${adjustments.join(', ')}.`:'Не меняйте несколько переменных одновременно: так вы поймёте, что реально влияет на восстановление.'];
                setHTMLSafeList('lab-rec-actions',acts); setText('lab-rec-method','Score — прикладная эвристика самонаблюдения, не валидированный тест. Вклад сигналов показан ниже; RHR и HRV сравниваются с личной медианой после 14 качественных парных измерений, до этого можно использовать явно введённую обычную норму. Никакого медицинского диагноза, «истощения ЦНС» или вероятности травмы этот балл не выдаёт.');
                const breakdown=el('lab-rec-breakdown'); if(breakdown){breakdown.replaceChildren();contributions.forEach(item=>{const row=document.createElement('div'),name=document.createElement('span'),value=document.createElement('b');row.className='mm-lab-metric';name.dataset.ruDynamicText=item.label;name.textContent=window.__mmDynamicTranslate?.(item.label)||item.label;value.textContent=`${item.value>0?'+':''}${fmt(item.value,0)}`;row.append(name,value);breakdown.appendChild(row);});}
                setBadge('recovery',pro&&proCount>=3?'Высокая':pro?'Хорошая':'Базовая',pro&&proCount>=3?'Умеренная':'Низкая');
                const summary=`MARKOVMADE Readiness\nРесурс: ${fmt(score,0)}/100 — ${status}\nСильный фактор: ${labels[positiveIndex]}\nОграничитель: ${labels[limiterIndex]}\nТренировка: ${training}\n\n${decision}\nMARKOVMADE / Pavel Markov`;
                mmCalcSummaries.recovery=summary; updateSnapshot(); return state.recovery;
            }
