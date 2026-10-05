            function calculateRecovery(){
                error('recovery');
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
                    const beforeToday=history.filter(item=>item.date!==today),baseline=personalRecoveryBaseline(beforeToday);
                    const rhrBase=baseline.ready?baseline.rhr:number('lab-rec-rhr-base'),hrvBase=baseline.ready?baseline.hrv:number('lab-rec-hrv-base');
                    if(Number.isFinite(rhr)){proCount++;if(Number.isFinite(rhrBase)&&rhrBase>0){const delta=(rhr-rhrBase)/rhrBase;if(delta>=.10)addContribution('RHR относительно личной нормы',-5,'RHR заметно выше baseline');else if(delta>=.05)addContribution('RHR относительно личной нормы',-2,'RHR выше baseline')}}
                    if(Number.isFinite(hrv)){proCount++;if(Number.isFinite(hrvBase)&&hrvBase>0){const delta=(hrv-hrvBase)/hrvBase;if(delta<=-.20)addContribution('HRV относительно личной нормы',-5,'HRV заметно ниже baseline');else if(delta<=-.10)addContribution('HRV относительно личной нормы',-2,'HRV ниже baseline')}}
                    if(finite(rhr,hrv)){
                        const next=history.filter(item=>item.date!==today);next.push({date:today,rhr,hrv});
                        state.recovery.history=next.slice(-90);
                        const forming=personalRecoveryBaseline(state.recovery.history);
                        setText('lab-rec-baseline',forming.ready?`Личный baseline · ${forming.days} дней · RHR ${fmt(forming.rhr,0)} · HRV ${fmt(forming.hrv,0)} мс`:`Baseline формируется · ${forming.days} / ${forming.required} качественных дней`);
                    }
                }
                score=clamp(score,0,100);
                const positiveIndex=scores.indexOf(Math.max(...scores)), limiterIndex=scores.indexOf(Math.min(...scores));
                let status,training,decision;
                if(score>=80){status='Ресурс хороший';training='По плану';decision='Большинство сигналов поддерживает обычную нагрузку. Не добавляйте объём только потому, что score высокий.'}
                else if(score>=65){status='Рабочее состояние';training='Планово / без добивания';decision='Можно тренироваться, но сегодня плохой день для незапланированного увеличения объёма или отказных подходов.'}
                else if(score>=50){status='Накопилась нагрузка';training='Снизить объём';decision='Вероятно, больше пользы даст уменьшение объёма/интенсивности и приоритет сна, чем ещё одна тяжёлая сессия.'}
                else {status='Ресурс низкий';training='Восстановительная нагрузка';decision='Сигналы сходятся в сторону восстановления. Если состояние необычное, выраженное или сохраняется — не трактуйте score как диагноз и оцените здоровье отдельно.'}
                state.recovery={...state.recovery,modelVersion:MODEL_VERSIONS.recovery,score,status,training,positive:labels[positiveIndex],limiter:labels[limiterIndex],adjustments,proCount,contributions}; save();
                setText('lab-rec-main',`${fmt(score,0)} / 100`); setText('lab-rec-status',status); el('lab-rec-bar').style.width=`${score}%`; setText('lab-rec-positive',labels[positiveIndex]); setText('lab-rec-limiter',labels[limiterIndex]); setText('lab-rec-training',training); setText('lab-rec-meaning',`Решение дня: ${decision}`);
                const acts=[score>=65?'Оставьте запланированную тренировку, но не повышайте нагрузку без причины.':'Сократите объём или перенесите тяжёлую работу; сохраните движение в восстановительном формате.',values[0]<=5?'Сегодня главный ROI — сон: не пытайтесь компенсировать его стимуляторами и дополнительной нагрузкой.':'Сон не выглядит главным ограничителем по субъективной оценке — не меняйте его радикально.',adjustments.length?`PRO-контекст, который тянет score вниз: ${adjustments.join(', ')}.`:'Не меняйте несколько переменных одновременно: так вы поймёте, что реально влияет на восстановление.'];
                setHTMLSafeList('lab-rec-actions',acts); setText('lab-rec-method','Score — прикладная эвристика самонаблюдения, не валидированный тест. Вклад сигналов показан ниже; RHR и HRV сравниваются с личной медианой после 14 качественных парных измерений, до этого можно использовать явно введённую обычную норму. Никакого медицинского диагноза, «истощения ЦНС» или вероятности травмы этот балл не выдаёт.');
                const breakdown=el('lab-rec-breakdown'); if(breakdown){breakdown.replaceChildren();contributions.forEach(item=>{const row=document.createElement('div'),name=document.createElement('span'),value=document.createElement('b');row.className='mm-lab-metric';name.textContent=item.label;value.textContent=`${item.value>0?'+':''}${fmt(item.value,0)}`;row.append(name,value);breakdown.appendChild(row);});}
                setBadge('recovery',pro&&proCount>=3?'Высокая':pro?'Хорошая':'Базовая',pro&&proCount>=3?'Умеренная':'Низкая');
                const summary=`MARKOVMADE Readiness\nРесурс: ${fmt(score,0)}/100 — ${status}\nСильный фактор: ${labels[positiveIndex]}\nОграничитель: ${labels[limiterIndex]}\nТренировка: ${training}\n\n${decision}\nMARKOVMADE / Pavel Markov`;
                mmCalcSummaries.recovery=summary; updateSnapshot(); return state.recovery;
            }

            function parseDailyWeights(text){ return String(text||'').split(/[\s,;]+/).map(x=>Number(x.replace(',','.'))).filter(x=>Number.isFinite(x)&&x>30&&x<350); }
            function drawProgressChart(values){
                const wrap=el('lab-prog-chart'),path=el('lab-prog-chart-line'); if(!wrap||!path)return;
                if(values.length<2){wrap.hidden=true;path.setAttribute('d','');return;}
                wrap.hidden=false; const min=Math.min(...values),max=Math.max(...values),range=Math.max(.01,max-min);
                const points=values.map((v,i)=>{const x=600*i/(values.length-1),y=90-80*(v-min)/range;return [x,y]});
                path.setAttribute('d',points.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '));
            }
