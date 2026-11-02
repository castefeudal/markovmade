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
                // New decisions use visible observations, not the legacy weighted
                // score. The score is retained only for historical compatibility.
                const observedHours=pro?number('lab-rec-hours'):NaN,signals=[];
                if(Number.isFinite(observedHours)&&observedHours<6)signals.push('сон менее 6 часов');
                if(values[1]<=3)signals.push('энергия 3/10 или ниже');
                if(values[2]>=8)signals.push('стресс 8/10 или выше');
                if(values[4]>=8)signals.push('болезненность 8/10 или выше');
                if(values[5]<=3)signals.push('самочувствие 3/10 или ниже');
                status=signals.length?'Есть сигналы для перепроверки':'Выраженные сигналы по этим ответам не отмечены';
                training=signals.length?'Проверьте разминкой; не повышайте нагрузку':'Проверьте обычную нагрузку разминкой';
                decision=signals.length?'Отмечено: '+signals.join('; ')+'. Сначала перепроверьте самочувствие и разминку; при сохраняющихся необычных симптомах обратитесь за индивидуальной оценкой.':'Сохраните план, если разминка и фактическая работоспособность обычные. Отсутствие этих сигналов не подтверждает готовность автоматически.';
                state.recovery={...state.recovery,modelVersion:MODEL_VERSIONS.recovery,legacyScore:score,score:null,signals,signalsCount:signals.length,observedHours:Number.isFinite(observedHours)?observedHours:null,status,training,positive:labels[positiveIndex],limiter:labels[limiterIndex],adjustments,proCount,contributions}; save();
                setText('lab-rec-main',labels[limiterIndex]); setText('lab-rec-status',status); el('lab-rec-bar').style.width='0%';el('lab-rec-bar').parentElement.hidden=true; setText('lab-rec-positive',labels[positiveIndex]); setText('lab-rec-limiter',labels[limiterIndex]); setText('lab-rec-training',training); setText('lab-rec-meaning',`Решение дня: ${decision}`);
                const acts=[signals.length===0?'Оставьте запланированную тренировку, но не повышайте нагрузку без причины.':'Сократите объём или перенесите тяжёлую работу; сохраните движение в восстановительном формате.',values[0]<=5?'Сегодня главный ROI — сон: не пытайтесь компенсировать его стимуляторами и дополнительной нагрузкой.':'Сон не выглядит главным ограничителем по субъективной оценке — не меняйте его радикально.',adjustments.length?`Контекст для перепроверки: ${adjustments.join(', ')}.`:'Не меняйте несколько переменных одновременно: так вы поймёте, что реально влияет на восстановление.'];
                setHTMLSafeList('lab-rec-actions',acts); setText('lab-rec-method','Показаны ваши наблюдения. Правила перепроверки MARKOVMADE: сон <6 ч, энергия или самочувствие ≤3/10, стресс или болезненность ≥8/10. Это открытые эвристические пороги, не валидированный тест готовности. RHR и HRV сравнивайте с личной медианой и одним протоколом; изменения не являются диагнозом.');
                const breakdown=el('lab-rec-breakdown'); if(breakdown){breakdown.replaceChildren();labels.map((label,i)=>({label,value:values[i]})).forEach(item=>{const row=document.createElement('div'),name=document.createElement('span'),value=document.createElement('b');row.className='mm-lab-metric';name.textContent=item.label;value.textContent=`${fmt(item.value,0)} / 10`;row.append(name,value);breakdown.appendChild(row);});}
                setBadge('recovery',pro&&proCount>=3?'Высокая':pro?'Хорошая':'Базовая',pro&&proCount>=3?'Умеренная':'Низкая');
                const summary=`MARKOVMADE Readiness\nОграничитель: ${labels[limiterIndex]} — ${status}\nСильный фактор: ${labels[positiveIndex]}\nОграничитель: ${labels[limiterIndex]}\nТренировка: ${training}\n\n${decision}\nMARKOVMADE / Pavel Markov`;
                mmCalcSummaries.recovery=summary; updateSnapshot(); return state.recovery;
            }

            function parseDailyWeights(text){ return String(text||'').split(/[\s,;]+/).map(x=>Number(x.replace(',','.'))).filter(x=>Number.isFinite(x)&&x>30&&x<350); }
            function parseCalendarWeights(raw){
                if(!String(raw).includes('='))return {values:parseDailyWeights(raw),days:[],dates:[]};
                const rows=String(raw).trim().split(/[;\n]+/).filter(x=>x.trim()).map(row=>{const m=/^(\d{4}-\d{2}-\d{2})\s*=\s*(\d+(?:[.,]\d+)?)$/.exec(row.trim());if(!m)throw new Error('Даты: YYYY-MM-DD=кг; минимум 7 замеров.');const day=Date.parse(m[1]+'T00:00:00Z')/86400000,weight=Number(m[2].replace(',','.'));if(!Number.isFinite(day)||new Date(day*86400000).toISOString().slice(0,10)!==m[1]||weight<35||weight>300)throw new Error('Проверьте дату и вес.');return {date:m[1],day,weight};}).sort((a,b)=>a.day-b.day);
                if(new Set(rows.map(r=>r.date)).size!==rows.length||rows.length>90)throw new Error('Даты должны быть уникальными; не больше 90 замеров.');
                return {values:rows.map(r=>r.weight),days:rows.map(r=>r.day),dates:rows.map(r=>r.date)};
            }
            function drawProgressChart(values,calendarDays=[]){
                const wrap=el('lab-prog-chart'),path=el('lab-prog-chart-line'); if(!wrap||!path)return;
                if(values.length<2){wrap.hidden=true;path.setAttribute('d','');return;}
                wrap.hidden=false; const min=Math.min(...values),max=Math.max(...values),range=Math.max(.01,max-min);
                const points=values.map((v,i)=>{const x=600*(calendarDays.length?(calendarDays[i]-calendarDays[0])/Math.max(1,calendarDays.at(-1)-calendarDays[0]):i/(values.length-1)),y=90-80*(v-min)/range;return [x,y]});
                path.setAttribute('d',points.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '));
            }
