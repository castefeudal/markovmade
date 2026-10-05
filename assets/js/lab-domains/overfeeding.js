            function calculateOverfeeding(){
                error('overfeeding'); setText('lab-fat-macro-check','');
                const days=number('lab-fat-days'), intakeInput=number('lab-fat-intake'), sex=val('lab-fat-sex'), age=number('lab-fat-age'), h=number('lab-fat-height'), w=number('lab-fat-weight');
                if(!sex) return error('overfeeding','Выберите пол — он нужен, если калории поддержания придётся рассчитывать.'),null;
                for(const [v,min,max,label] of [[days,1,14,'Период'],[intakeInput,0,50000,'Калории'],[age,18,90,'Возраст'],[h,120,230,'Рост'],[w,35,300,'Вес']]){ const m=safeRange(v,min,max,label); if(m) return error('overfeeding',m),null; }
                let maint; try{maint=overfeedingMaintenance(sex,age,h,w)}catch(err){error('overfeeding',err.message);return null;}
                const pro=currentMode('overfeeding')==='pro', macroMode=pro&&segmentValue('fat-input-mode')==='macros';
                let p=NaN,f=NaN,c=NaN,a=NaN,macroKcal=NaN,intake=intakeInput,tef={low:.05,mid:.10,high:.15},fatShare=0.33;
                if(macroMode){
                    p=number('lab-fat-p'); f=number('lab-fat-f'); c=number('lab-fat-c'); a=number('lab-fat-alcohol');
                    p=Number.isFinite(p)?p:0;f=Number.isFinite(f)?f:0;c=Number.isFinite(c)?c:0;a=Number.isFinite(a)?a:0;
                    if([p,f,c,a].some(x=>x<0)) return error('overfeeding','БЖУ и алкоголь не могут быть отрицательными.'),null;
                    macroKcal=p*4+f*9+c*4+a*7;
                    const diff=Math.abs(macroKcal-intakeInput), threshold=Math.max(150,intakeInput*.10);
                    const reconcile=segmentValue('fat-reconcile')||'calories';
                    if(diff>threshold){
                        setText('lab-fat-macro-check',`По БЖУ получается ~${fmt(macroKcal,0)} ккал, а указано ${fmt(intakeInput,0)}. Выберите, какой источник использовать для энергетического баланса.`);
                        if(reconcile==='macros') intake=macroKcal;
                    } else setText('lab-fat-macro-check',`Калории из БЖУ: ~${fmt(macroKcal,0)} — согласуются с общей калорийностью в разумных пределах.`);
                    const pK=p*4,fK=f*9,cK=c*4,aK=a*7; tef=weightedTef(pK,fK,cK,aK); fatShare=macroKcal>0?fK/macroKcal:.33;
                }
                const gross=Math.max(0,intake-maint.value*days);
                const grossLow=Math.max(0,intake-maint.high*days), grossHigh=Math.max(0,intake-maint.low*days);
                const theoretical=gross/K.kcalPerKgFatEquivalent;
                let low=0,center=0,high=0,netMid=0,effMid=0;
                if(gross>0){
                    const netLow=grossLow*(1-tef.high), netHigh=grossHigh*(1-tef.low); netMid=gross*(1-tef.mid);
                    if(macroMode){ effMid=clamp(.80+.12*fatShare,.78,.93); }
                    else effMid=.84;
                    const effLow=macroMode?clamp(effMid-.07,.72,.90):.72, effHigh=macroMode?clamp(effMid+.07,.82,.96):.95;
                    low=Math.max(0,netLow*effLow/K.kcalPerKgFatEquivalent);
                    high=Math.max(low,netHigh*effHigh/K.kcalPerKgFatEquivalent);
                    center=netMid*effMid/K.kcalPerKgFatEquivalent;
                    center=clamp(center,low,high);
                }
                const scale=pro?number('lab-fat-scale'):NaN, status=val('lab-fat-gly-status')||'unknown', training=val('lab-fat-training')||'none';
                const gly=glycogenRange(status,training,macroMode?c:NaN), glyWaterLow=gly[0]*(1+K.glycogenWaterLow)/1000, glyWaterHigh=gly[1]*(1+K.glycogenWaterHigh)/1000;
                state.profile={sex,age,height:h,weight:w,bodyFat:Number.isFinite(number('lab-fat-bf'))?number('lab-fat-bf'):state.profile.bodyFat};
                state.overfeeding={modelVersion:MODEL_VERSIONS.overfeeding,days,intake,maint,gross,grossLow,grossHigh,theoretical,low,center,high,macroMode,macroKcal,tef,effMid,scale,gly,glyWaterLow,glyWaterHigh}; save(); applyProfile();
                setText('lab-fat-main',gross<=0?'≈ 0 кг':`${fmt(low,2)}–${fmt(high,2)} кг`); setText('lab-fat-center',gross<=0?'По введённым данным энергетического избытка нет.':`Центральная модельная оценка ≈ ${fmt(center,2)} кг. Это диапазон вероятности, а не прямое измерение ткани.`); setText('lab-fat-surplus',kcal(gross)); setText('lab-fat-theoretical',gross>0?`~${fmt(theoretical,2)} кг`:'~0 кг'); setText('lab-fat-maint-result',kcal(maint.value)); setText('lab-fat-maint-note',maint.label);
                const scaleBlock=el('lab-fat-scale-block');
                if(Number.isFinite(scale) && scale>0){
                    scaleBlock.hidden=false;
                    const nonfatLow=Math.max(0,scale-high), nonfatHigh=Math.max(0,scale-low);
                    setText('lab-fat-scale-text',`Вес на весах: +${fmt(scale,1)} кг. Из них модель относит к жировой массе примерно ${fmt(low,2)}–${fmt(high,2)} кг; оставшиеся ~${fmt(nonfatLow,2)}–${fmt(nonfatHigh,2)} кг не следует автоматически считать жиром.`);
                    const glyMid=Math.min(scale,Math.max(0,(glyWaterLow+glyWaterHigh)/2)), fatMid=Math.min(scale,center), other=Math.max(0,scale-fatMid-glyMid), total=Math.max(.001,fatMid+glyMid+other);
                    el('lab-fat-stack-fat').style.width=`${100*fatMid/total}%`; el('lab-fat-stack-gly').style.width=`${100*glyMid/total}%`; el('lab-fat-stack-other').style.width=`${100*other/total}%`;
                    setText('lab-fat-legend-fat',`${fmt(low,2)}–${fmt(high,2)} кг`); setText('lab-fat-legend-gly',`${fmt(glyWaterLow,2)}–${fmt(glyWaterHigh,2)} кг`); setText('lab-fat-legend-other',other>0?`~${fmt(other,2)} кг, высокая неопределённость`:'не отделяется надёжно');
                } else if(scaleBlock) scaleBlock.hidden=true;
                setText('lab-fat-72',`Следующие 72 часа: часть резкого прироста массы может снизиться по мере нормализации содержимого ЖКТ, гликогена и воды. Модельная жировая масса изменяется медленнее; конкретный объём воды без измерений натрия, жидкости и запасов гликогена определить нельзя.`);
                const actions=gross>0?[`Вернитесь к обычному рациону и привычной активности — не пытайтесь «отработать» всё за один день.`,`Взвешивайтесь 3–4 утра подряд в одинаковых условиях и смотрите на среднее.`,`Если это единичное событие, решение принимается по недельному тренду, а не по утреннему пику.`]:['Не вводите дополнительный дефицит только из-за ощущения «переедания»: по введённым калориям избыток не подтверждается.','Продолжайте обычный план и оценивайте недельный тренд.'];
                setHTMLSafeList('lab-fat-actions',actions);
                const comp=val('lab-fat-comp'); let deficit=comp==='custom'?number('lab-fat-comp-custom'):Number(comp); const compNode=el('lab-fat-comp-result');
                if(pro && Number.isFinite(deficit) && deficit>0 && center>0){ const d=center*K.kcalPerKgFatEquivalent/deficit; compNode.hidden=false; setText('lab-fat-comp-result',`Как долго избыток влияет на план: при дополнительном дефиците ~${fmt(deficit,0)} ккал/сут энергетический эквивалент центральной оценки составляет ~${fmt(d,1)} дня. Это не рекомендация голодать: обычно рациональнее вернуться к плану и распределить коррекцию мягко.`); } else if(compNode) compNode.hidden=true;
                const methodText=macroMode?`Для дополнительной еды TEF рассчитан как взвешенная оценка по введённым белкам, жирам, углеводам и алкоголю; центральная оценка ≈ ${Math.round(tef.mid*100)}% энергии этой смеси. Затем использован диапазон эффективности хранения, согласованный с controlled-overfeeding данными, где жирный избыток хранился эффективнее углеводного. Это прикладная модель, не индивидуальное измерение.`:`Состав БЖУ неизвестен, поэтому использован широкий диапазон TEF и эффективности хранения. Это намеренно расширяет интервал вместо ложной точности.`;
                setText('lab-fat-method',`${methodText} Теоретическая граница = gross surplus / 7700 и показана только как энергетический эквивалент. Для гликогена используется сценарный диапазон, а связанная вода — ориентир 2,7–4 г воды на 1 г гликогена; прочая вода/натрий/ЖКТ не моделируются псевдоточно.`);
                setBadge('overfeeding',macroMode?'Высокая':pro?'Хорошая':'Базовая',maint.confidence==='Выше средней'&&macroMode?'Выше средней':pro?'Умеренная':'Низкая');
                const summary=`MARKOVMADE FAT GAIN MODEL\nПериод: ${fmt(days,0)} дн.\nКалории поддержания: ~${fmt(maint.value,0)} ккал/сут (${maint.label})\nПотребление: ${fmt(intake,0)} ккал\nЭнергетический избыток: ~${fmt(gross,0)} ккал\n\nВероятный набор жировой массы: ${fmt(low,2)}–${fmt(high,2)} кг\nЦентральная оценка: ~${fmt(center,2)} кг\nТеоретическая энергетическая граница: ~${fmt(theoretical,2)} кг${Number.isFinite(scale)?`\nИзменение веса на весах: ${scale>=0?'+':''}${fmt(scale,1)} кг`:''}\n\nПрибавка на весах ≠ жировая масса.\nMARKOVMADE / Pavel Markov`;
                mmCalcSummaries.overfeeding=summary; updateSnapshot(); return state.overfeeding;
            }

