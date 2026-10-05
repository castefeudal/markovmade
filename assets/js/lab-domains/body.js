            function calculateBody(){
                error('body');
                const sex=val('lab-body-sex'), h=number('lab-body-height'), w=number('lab-body-weight');
                if(!sex) return error('body','Выберите пол — он нужен для окружностной модели и интерпретации.'),null;
                for(const [v,min,max,label] of [[h,120,230,'Рост'],[w,35,300,'Вес']]){ const m=safeRange(v,min,max,label); if(m) return error('body',m),null; }
                const method=segmentValue('body-bf-method');
                let bf,bfLow,bfHigh,confidence='Умеренная',quality='Базовая',source='',measurementMethod='tape';
                const waist=number('lab-body-waist'), neck=number('lab-body-neck'), hips=number('lab-body-hips');
                const waistLabel=$('[data-waist-label]'), waistHint=$('[data-waist-hint]');
                if(waistLabel) waistLabel.innerHTML=sex==='female'?'Окружность талии <em>см</em>':'Окружность живота <em>см</em>';
                if(waistHint) waistHint.textContent=sex==='female'?'Лента в самом узком месте талии; не втягивайте живот.':'Лента горизонтально на уровне пупка; не втягивайте живот.';
                if(method==='tape' && Number.isFinite(waist) && !Number.isFinite(neck)){
                    const waistError=safeRange(waist,40,200,'Окружность талии / живота');
                    if(waistError) return error('body',waistError),null;
                    const ratio=waist/h, bmi=w/((h/100)**2);
                    state.profile={...state.profile,sex,height:h,weight:w,bodyFat:null};
                    state.body={modelVersion:MODEL_VERSIONS.body,bf:null,bfLow:null,bfHigh:null,fatMass:null,lbm:null,ffmi:null,nffmi:null,bmi,whtr:ratio,source:'отношение окружности талии к росту; BF не оценивался',confidence:'Метрика самонаблюдения',measurementMethod:'waist-height-only',goal:val('lab-body-goal')||'recomp',level:val('lab-body-level')||'intermediate'};
                    save();applyProfile();
                    setText('lab-body-main','Не оценивается');
                    setText('lab-body-range',`Без окружности шеи процент жира не рассчитывается. Отношение талии к росту: ${fmt(ratio,2)} — отслеживайте его во времени одним способом; это не диагноз и не персональный порог риска.`);
                    setText('lab-body-fatmass','—');setText('lab-body-lbm','—');setText('lab-body-ffmi','—');setText('lab-body-nffmi','—');setText('lab-body-bmi',fmt(bmi,1));setText('lab-body-whtr',fmt(ratio,2));setText('lab-body-target-weight','—');
                    setText('lab-body-meaning',`Что это значит: WHtR ${fmt(ratio,2)} сохранён как отдельная метрика. Для сравнения измеряйте окружность в одном месте и при похожих условиях.`);
                    setHTMLSafeList('lab-body-actions',['Процент жира и FFMI не показаны, поскольку без шеи выбранная окружностная модель не применяется.','Повторяйте измерение одним способом; не интерпретируйте изменение на сотые доли как точный сигнал.']);
                    setText('lab-body-method','Показан только WHtR = окружность талии / рост. Для US Navy circumference model нужна шея (и бёдра в женской формуле). Точность BF не выводится без полного набора замеров.');
                    setBadge('body','Базовая','WHtR без оценки BF');
                    mmCalcSummaries.body=`MARKOVMADE LAB — Состав тела\nBF и FFMI не оценивались: окружность шеи не введена.\nТалия / рост: ${fmt(ratio,2)}\nBMI: ${fmt(bmi,1)}\n\nMARKOVMADE / Pavel Markov`;
                    updateSnapshot();return state.body;
                }
                if(method==='known'){
                    bf=number('lab-body-bf'); const m=safeRange(bf,3,60,'% жира'); if(m) return error('body',m),null;
                    measurementMethod=val('lab-body-bf-source')||'unknown';
                    const methods={dexa:['DEXA','Выше средней'], 'multi-bia':['многочастотный BIA','Умеренная'], 'consumer-bia':['бытовой BIA','Низкая'], skinfold:['калипер / складки','Умеренная'], tape:['лента / окружности','Умеренная'], visual:['визуальная оценка','Низкая'], professional:['оценка специалиста','Умеренная'], unknown:['неизвестный метод','Низкая']};
                    const methodInfo=methods[measurementMethod]||methods.unknown;
                    bfLow=bf; bfHigh=bf; source=`введено пользователем · метод: ${methodInfo[0]}`; confidence=methodInfo[1];
                    quality=currentMode('body')==='pro'?'Хорошая':'Базовая';
                } else {
                    for(const [v,min,max,label] of [[waist,40,200,'Талия'],[neck,20,80,'Шея']]){ const m=safeRange(v,min,max,label); if(m) return error('body',m),null; }
                    if(sex==='female'){ const m=safeRange(hips,50,200,'Бёдра'); if(m) return error('body',m),null; }
                    if(sex==='male' && waist<=neck) return error('body','Талия должна быть больше окружности шеи для этой формулы. Проверьте точки измерения.'),null;
                    if(sex==='female' && waist+hips<=neck) return error('body','Проверьте окружности: сумма талии и бёдер должна быть больше окружности шеи.'),null;
                    bf=navyBodyFat(sex,h,waist,neck,hips);
                    if(!Number.isFinite(bf) || bf<2 || bf>65) return error('body','Формула получила нереалистичный результат. Проверьте единицы и места измерения.'),null;
                    bf=clamp(bf,3,60); bfLow=NaN; bfHigh=NaN;
                    source='окружностная модель Hodgdon/Beckett'; quality='Хорошая';
                }
                const fatMass=w*bf/100, lbm=w-fatMass, hm=h/100, baseFfmi=ffmi(w,bf,h), nffmi=baseFfmi+6.3*(1.80-hm), bmi=w/(hm*hm);
                const whtr=Number.isFinite(waist)?waist/h:NaN;
                const targetBF=currentMode('body')==='pro'?number('lab-body-target-bf'):NaN;
                const goal=val('lab-body-goal')||'recomp', level=val('lab-body-level')||'intermediate';
                const targetWeight=Number.isFinite(targetBF)&&targetBF>0&&targetBF<60 ? lbm/(1-targetBF/100) : NaN;
                const targetWeightLow=Number.isFinite(targetWeight)?targetWeight*.97:NaN;
                const targetWeightHigh=Number.isFinite(targetWeight)?targetWeight*1.03:NaN;
                state.profile={...state.profile,sex,height:h,weight:w,bodyFat:round(bf,1)};
                state.body={modelVersion:MODEL_VERSIONS.body,bf,bfLow,bfHigh,fatMass,lbm,ffmi:baseFfmi,nffmi,bmi,whtr,targetBF,targetWeight,targetWeightLow,targetWeightHigh,source,confidence,measurementMethod,goal,level}; save(); applyProfile();
                setText('lab-body-main',`${fmt(bf,1)}%`);
                setText('lab-body-range',method==='tape'?`Это ориентир по окружностной модели, а не персональный доверительный интервал. В исходных валидациях ошибка модели составляла несколько процентных пунктов; техника и места замера влияют на результат.`:`Сохранено введённое значение ${fmt(bf,1)}% без коррекции. Источник: ${source}. Точный диапазон ошибки без индивидуальной валидации не выводится.`);
                setText('lab-body-fatmass',kg(fatMass)); setText('lab-body-lbm',kg(lbm)); setText('lab-body-ffmi',fmt(baseFfmi,1)); setText('lab-body-nffmi',fmt(nffmi,1)); setText('lab-body-bmi',fmt(bmi,1)); setText('lab-body-whtr',Number.isFinite(whtr)?fmt(whtr,2):'—');
                setText('lab-body-target-weight',Number.isFinite(targetWeight)?`${fmt(targetWeightLow,1)}–${fmt(targetWeightHigh,1)} кг`:'—');
                let meaning=`При ${fmt(bf,1)}% жира из ${fmt(w,1)} кг примерно ${fmt(lbm,1)} кг приходится на безжировую массу. FFMI ${fmt(baseFfmi,1)} полезен как контекст мышечной массы, но наследует ошибку оценки % жира.`;
                if(goal==='cut' && baseFfmi>=22) meaning+=' При снижении жира ключевая задача — сохранять сухую массу и силовые, а не гнаться за максимальной скоростью снижения веса.';
                if(goal==='bulk' && bf>(sex==='male'?20:30)) meaning+=' При высокой жировой массе набор веса любой ценой обычно имеет худший ROI, чем сначала стабилизировать композицию тела.';
                setText('lab-body-meaning',`Что это значит: ${meaning}`);
                const actions=[];
                if(Number.isFinite(targetWeight)) actions.push(`При ${fmt(targetBF,1)}% жира ориентир ${fmt(targetWeightLow,1)}–${fmt(targetWeightHigh,1)} кг, если безжировая масса изменится в пределах ±3%. Это сценарная чувствительность, не доверительный интервал и не обещание.`);
                actions.push('Повторяйте % жира одним методом и в одинаковых условиях: тренд ценнее разового абсолютного числа.');
                actions.push(Number.isFinite(whtr)?`Талия/рост сейчас ${fmt(whtr,2)} — отслеживайте её вместе с весом и фото.`:'Добавьте талию при следующем замере: она делает интерпретацию изменения формы заметно полезнее.');
                setHTMLSafeList('lab-body-actions',actions);
                setText('lab-body-method',`Источник % жира: ${source}. LBM = вес × (1 − BF). FFMI = LBM / рост². Height-adjusted FFMI использует поправку Kouri 6,3 × (1,80 − рост); исходная нормализация была разработана на мужских атлетах, поэтому её нельзя трактовать как универсальный «лимит». Окружностная формула имеет стандартную ошибку порядка 3–4 п.п. в исходных валидациях.`);
                setBadge('body',quality,confidence);
                const summary=`MARKOVMADE LAB — Состав тела\n% жира: ~${fmt(bf,1)}%${method==='tape'?' (окружностная оценка, не доверительный интервал)':''}\nЖировая масса: ${kg(fatMass)}\nLBM: ${kg(lbm)}\nFFMI: ${fmt(baseFfmi,1)}\nНормализованный FFMI: ${fmt(nffmi,1)}${Number.isFinite(targetWeight)?`\nОриентир при ${fmt(targetBF,1)}%: ${kg(targetWeight)}`:''}\n\nMARKOVMADE / Pavel Markov`;
                mmCalcSummaries.body=summary; updateSnapshot(); return state.body;
            }

