(function () {
    'use strict';

    function initProductPrototype() {
        var root = document.getElementById('app-ecosystem');
        if (!root || root.dataset.v24Ready === 'true') return;
        root.dataset.v24Ready = 'true';

        window.mmRenderConnectedOS();
        var tabs = Array.from(root.querySelectorAll('[data-app-tab]'));
        var screens = Array.from(root.querySelectorAll('[data-app-screen]'));

        function activate(name, focusTab) {
            tabs.forEach(function (tab) {
                var active = tab.dataset.appTab === name;
                tab.classList.toggle('active', active);
                tab.setAttribute('aria-selected', active ? 'true' : 'false');
                tab.setAttribute('tabindex', active ? '0' : '-1');
                if (active && focusTab) tab.focus({ preventScroll: true });
            });
            screens.forEach(function (screen) {
                var active = screen.dataset.appScreen === name;
                screen.classList.toggle('active', active);
                screen.hidden = !active;
            });
            if (window.mmTrack) window.mmTrack('app_prototype_view', { screen: name });
        }

        tabs.forEach(function (tab, index) {
            tab.addEventListener('click', function () { activate(tab.dataset.appTab, false); });
            tab.addEventListener('keydown', function (event) {
                if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return;
                event.preventDefault();
                var next = index;
                if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
                if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
                if (event.key === 'Home') next = 0;
                if (event.key === 'End') next = tabs.length - 1;
                activate(tabs[next].dataset.appTab, true);
            });
        });

        function taskCopy(task) {
            var state = task.querySelector('em');
            if (!state) return;
            var en = document.documentElement.lang === 'en';
            var defaults = {'сейчас':'now','7 дней':'7 days','регулярно':'regularly','в плане':'planned'};
            state.textContent = task.classList.contains('done') ? (en ? 'done' : 'готово') :
                (en ? defaults[state.dataset.defaultText] || state.dataset.defaultText : state.dataset.defaultText);
        }
        function readTaskState(){try{var parsed=JSON.parse(window.mmSafeStorage.get('markovmade-os-actions-v1','{}'));return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};}catch{return {};}}
        var now=new Date(),day=[now.getFullYear(),now.getMonth()+1,now.getDate()].join('-'),savedTasks=readTaskState();
        root.querySelectorAll('.mm-app-task').forEach(function (task,index) {
            task.dataset.osTaskKey=day+':'+index;
            var restored=savedTasks[task.dataset.osTaskKey]===true;task.classList.toggle('done',restored);task.setAttribute('aria-pressed',String(restored));
            var initialState = task.querySelector('em');
            if (initialState && !initialState.dataset.defaultText) {
                initialState.dataset.defaultText = ['сейчас','7 дней','регулярно'][Array.from(root.querySelectorAll('.mm-app-task')).indexOf(task)] || initialState.textContent;
                initialState.setAttribute('data-no-translate','');
            }
            task.addEventListener('click', function () {
                var done = !task.classList.contains('done');
                var key=task.dataset.osTaskKey,stored=readTaskState();
                stored[key]=done;
                if(!window.mmSafeStorage.set('markovmade-os-actions-v1',JSON.stringify(stored))){
                    var status=root.querySelector('#mm-os-data-status');if(status)status.textContent=document.documentElement.lang==='en'?'Could not save this action. Try again.':'Не удалось сохранить действие. Повторите попытку.';return;
                }
                task.classList.toggle('done', done);
                task.setAttribute('aria-pressed', done ? 'true' : 'false');
                taskCopy(task);
            });
        });
        function taskLabels(){
            var saved=readTaskState(),current=new Date(),date=[current.getFullYear(),current.getMonth()+1,current.getDate()].join('-');
            root.querySelectorAll('.mm-app-task').forEach(function(task,index){task.dataset.osTaskKey=date+':'+index;var done=saved[task.dataset.osTaskKey]===true;task.classList.toggle('done',done);task.setAttribute('aria-pressed',String(done));taskCopy(task);});
        }
        window.mmRefreshOSActions=taskLabels;
        document.addEventListener('visibilitychange',()=>{if(!document.hidden)taskLabels();});
        new MutationObserver(taskLabels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
        taskLabels();

        var consent=root.querySelector('#mm-os-daily-consent');
        function consentCopy(){root.querySelectorAll('[data-os-daily-ru]').forEach(function(node){node.textContent=document.documentElement.lang==='en'?node.dataset.osDailyEn:node.dataset.osDailyRu;});}
        if(consent){
            consent.checked=window.mmSafeStorage.get('markovmade-os-daily-consent-v1','false')==='true';
            consent.addEventListener('change',async function(){
                var desired=consent.checked,status=root.querySelector('#mm-os-data-status');consent.disabled=true;
                try{
                    if(desired)await window.mmLoadLab();
                    if(!window.mmSafeStorage.set('markovmade-os-daily-consent-v1',String(desired)))throw new Error('storage');
                    window.mmRefreshPersonalOS?.();status.textContent='';
                }catch(error){consent.checked=!desired;status.textContent=document.documentElement.lang==='en'?'Could not update the setting. Your journal is preserved.':'Не удалось изменить настройку. Дневник сохранён.';}
                finally{consent.disabled=false;}
            });
        }
        new MutationObserver(function(){consentCopy();window.mmRenderConnectedOS();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});consentCopy();
        activate('today', false);
    }

    window.mmRenderConnectedOS=function(){
        var root=document.getElementById('app-ecosystem');if(!root)return;
        var english=document.documentElement.lang==='en',copy=(ru,en)=>english?en:ru;
        var read=(key,fallback)=>{try{var value=JSON.parse(window.mmSafeStorage.get(key,'null'));return value??fallback;}catch{return fallback;}};
        var raw=window.MarkovMadeLab?.state||read('markovmade-lab-v1',{}),state=raw&&typeof raw==='object'?raw:{};
        var consent=window.mmSafeStorage.get('markovmade-os-daily-consent-v1','false')==='true',rawJournal=consent?read('markovmade-lab-daily-v1',[]):[];
        var journal=Array.isArray(rawJournal)?rawJournal.filter(row=>row&&typeof row.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(row.date)).sort((a,b)=>a.date.localeCompare(b.date)):[];
        var trends=window.MarkovMadeModels?.checkinTrends(journal,14);
        // Use the model's own calendar window; never turn an old reading into today's state.
        var latestWeight=trends?.weight.points.at(-1),latestSleep=trends?.sleep.points.at(-1),latestEnergy=trends?.energy.points.at(-1);
        var fmt=value=>new Intl.NumberFormat(english?'en-GB':'ru-RU',{maximumFractionDigits:1}).format(value);
        var node=(tag,text)=>{var el=document.createElement(tag);el.textContent=text;return el;};
        var prepare=(name,title,intro)=>{var panel=root.querySelector('[data-os-connected="'+name+'"]');if(!panel)return null;panel.replaceChildren(node('h3',title),node('p',intro));panel.setAttribute('aria-label',copy('Ваши локальные данные','Your local data'));return panel;};
        var metric=(panel,label,value,note)=>{if(!panel)return;var card=document.createElement('div');card.className='mm-os-connected-metric';card.append(node('span',label),node('strong',value));if(note)card.append(node('small',note));panel.append(card);};
        var action=(panel,label,tab)=>{if(!panel)return;var link=node('a',label);link.href=tab==='progress'?'#mm-lab-daily':'#mm-lab-tab-'+tab;link.className='mm-lab-secondary';panel.append(link);};
        var n=state.nutrition||{},panel=prepare('nutrition',copy('Ваши ориентиры питания','Your nutrition targets'),copy('Цели из расчёта LAB, а не съеденное количество или измеренный расход.','LAB planning targets, not logged intake or measured energy expenditure.'));
        metric(panel,copy('Калории','Calories'),Number.isFinite(n.target)?'≈ '+fmt(n.target)+' kcal':'—',Number.isFinite(n.target)?copy('Расчётная цель LAB','Calculated LAB target'):copy('Сначала рассчитайте питание в LAB','Calculate nutrition in LAB first'));
        for(var entry of [['pMid','Белок','Protein'],['fatMid','Жиры','Fat'],['carbMid','Углеводы','Carbohydrate']])if(Number.isFinite(n[entry[0]]))metric(panel,copy(entry[1],entry[2]),fmt(n[entry[0]])+' '+copy('г','g'),'');
        var intake=journal.filter(row=>Number.isFinite(row.calories)).at(-1);
        metric(panel,copy('Последняя запись питания','Latest food record'),intake?fmt(intake.calories)+' kcal':'—',intake?intake.date:copy(consent?'В дневнике пока нет калорий':'Разрешите использование дневника выше',consent?'No calorie entries in the journal yet':'Enable journal use above'));
        action(panel,copy('Уточнить питание в LAB','Review nutrition in LAB'),'nutrition');
        panel=prepare('progress',copy('Ваш прогресс · 14 дней','Your progress · 14 days'),copy('Показываем наблюдения. По одной записи нельзя определить тренд.','Observed measurements. One reading cannot establish a trend.'));
        metric(panel,copy('Последний вес','Latest weight'),latestWeight?fmt(latestWeight.value)+' '+copy('кг','kg'):'—',latestWeight?latestWeight.date:copy(consent?'Нужна запись веса в последние 14 дней':'Разрешите использование дневника выше',consent?'Log weight within the last 14 days':'Enable journal use above'));
        metric(panel,copy('Наблюдения веса','Weight observations'),String(trends?.weight.count||0)+'/14',copy('Пропущенные дни не заполняются','Missing days are not filled in'));
        metric(panel,copy('Изменение по тренду','Trend change'),trends?.weight.delta!=null?fmt(trends.weight.delta)+' '+copy('кг','kg'):'—',trends?.weight.delta!=null?copy('Не отделяет жир от воды','Cannot separate fat from water'):copy('Пока недостаточно сопоставимых наблюдений','Not enough comparable observations yet'));
        action(panel,copy('Открыть график и добавить измерение','Open chart and add a reading'),'progress');
        panel=prepare('recovery',copy('Ваш ресурс','Your recovery signals'),copy('Самооценка и практическая эвристика. Это не диагноз и не разрешение на нагрузку.','Self-report and a practical heuristic. This is not a diagnosis or clearance to train.'));
        var recovery=state.recovery||{};
        metric(panel,copy('Оценка LAB','LAB estimate'),Number.isFinite(recovery.score)?fmt(recovery.score)+'/100':'—',Number.isFinite(recovery.score)?copy('Практическая эвристика, не медицинский индекс','Practical heuristic, not a medical index'):copy('Сначала выполните оценку ресурса в LAB','Run a recovery assessment in LAB first'));
        metric(panel,copy('Последний сон','Latest sleep'),latestSleep?fmt(latestSleep.value)+' '+copy('ч','h'):'—',latestSleep?latestSleep.date:copy('Нет доступных наблюдений','No available observations'));
        metric(panel,copy('Последняя энергия','Latest energy'),latestEnergy?fmt(latestEnergy.value)+'/10':'—',latestEnergy?latestEnergy.date:copy('Нет доступных наблюдений','No available observations'));
        action(panel,copy('Добавить оценку ресурса','Add a recovery assessment'),'recovery');
        root.querySelector('[data-os-provenance]')?.replaceChildren(node('span',copy('Локальные данные LAB · демонстрационные сценарии отмечены DEMO','Local LAB data · example scenarios are marked DEMO')));
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProductPrototype, { once: true });
    } else {
        initProductPrototype();
    }
})();
