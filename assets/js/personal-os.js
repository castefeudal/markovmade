(function () {
    'use strict';

    function initProductPrototype() {
        var root = document.getElementById('app-ecosystem');
        if (!root || root.dataset.v24Ready === 'true') return;
        root.dataset.v24Ready = 'true';

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
        root.querySelectorAll('.mm-app-task').forEach(function (task) {
            var initialState = task.querySelector('em');
            if (initialState && !initialState.dataset.defaultText) {
                initialState.dataset.defaultText = ['сейчас','7 дней','регулярно'][Array.from(root.querySelectorAll('.mm-app-task')).indexOf(task)] || initialState.textContent;
                initialState.setAttribute('data-no-translate','');
            }
            task.addEventListener('click', function () {
                var done = !task.classList.contains('done');
                task.classList.toggle('done', done);
                task.setAttribute('aria-pressed', done ? 'true' : 'false');
                taskCopy(task);
            });
        });
        function taskLabels(){root.querySelectorAll('.mm-app-task').forEach(taskCopy);}
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
        new MutationObserver(consentCopy).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});consentCopy();
        activate('today', false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProductPrototype, { once: true });
    } else {
        initProductPrototype();
    }
})();
