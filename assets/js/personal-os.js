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

        root.querySelectorAll('.mm-app-task').forEach(function (task) {
            var initialState = task.querySelector('em');
            if (initialState && !initialState.dataset.defaultText) initialState.dataset.defaultText = task.classList.contains('done') ? 'в плане' : initialState.textContent;
            task.addEventListener('click', function () {
                var done = !task.classList.contains('done');
                task.classList.toggle('done', done);
                task.setAttribute('aria-pressed', done ? 'true' : 'false');
                var state = task.querySelector('em');
                if (state) state.textContent = done ? 'готово' : (state.dataset.defaultText || state.textContent);
            });
        });

        activate('today', false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProductPrototype, { once: true });
    } else {
        initProductPrototype();
    }
})();
