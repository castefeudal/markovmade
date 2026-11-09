/* MARKOVMADE theme selector: previews are temporary; only an explicit choice persists. */
(function () {
  'use strict';

  var themes = {
    'aurum-noir': {
      ru: ['Aurum Noir', 'Обсидиан · шампань · сдержанная глубина'],
      en: ['Aurum Noir', 'Obsidian · champagne · quiet depth']
    },
    'event-horizon': {
/* BEGIN SIGNATURE PRESENTATION: studio-1 */
      ru: ['Event Horizon', 'Титан · хроматический свет · точность'],
      en: ['Event Horizon', 'Titanium · chromatic light · precision']
/* END SIGNATURE PRESENTATION: studio-1 */
    },
    clarity: {
/* BEGIN SIGNATURE PRESENTATION: studio-2 */
      ru: ['Clarity', 'Архитектурная бумага · терракота · ателье'],
      en: ['Clarity', 'Architectural paper · terracotta · atelier']
/* END SIGNATURE PRESENTATION: studio-2 */
    }
  };
  var aliases = {
    obsidian: 'aurum-noir', dark: 'aurum-noir', deep: 'aurum-noir',
    ivory: 'clarity', light: 'clarity', 'ivory-atelier': 'clarity',
    'imperial-emerald': 'aurum-noir', 'oxblood-atelier': 'aurum-noir',
    graphite: 'event-horizon', soft: 'event-horizon', calm: 'event-horizon',
    'titanium-midnight': 'event-horizon', contrast: 'clarity', 'mono-access': 'clarity'
  };
  var legacyValues = {
    'aurum-noir': 'deep', 'event-horizon': 'soft', clarity: 'light'
  };
  var selected = 'aurum-noir';
/* BEGIN SIGNATURE PRESENTATION: studio-3 */
  var pending = selected;
/* END SIGNATURE PRESENTATION: studio-3 */
  var preview = null;
  var dialog = null;
  var returnFocus = null;

  function language() { return document.documentElement.lang === 'en' ? 'en' : 'ru'; }
  function copy(ru, en) { return language() === 'en' ? en : ru; }
  function safeGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function resolve(value) { return aliases[value] || (themes[value] ? value : null); }

  function apply(name) {
    var theme = resolve(name) || 'aurum-noir';
    var previous = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === 'clarity' ? 'light' : 'dark';
    var body = document.body;
    if (body) {
      body.classList.remove('theme-soft', 'theme-contrast');
      body.classList.toggle('theme-cosmos', theme === 'event-horizon');
      body.classList.toggle('theme-light', theme === 'clarity');
      body.classList.toggle('theme-clarity', theme === 'clarity');
    }
    var meta = document.getElementById('theme-color-meta');
    if (meta) {
      var colors = {
/* BEGIN POLISH PRESENTATION: browser chrome */
        'aurum-noir':'#080807', 'event-horizon':'#0b1020', clarity:'#f4f1ea'
/* END POLISH PRESENTATION: browser chrome */
      };
      meta.setAttribute('content', colors[theme]);
    }
    // A palette change is atomic. Hover transitions may blend nearby shades,
    // but a light/dark switch must never mix the old background and new text.
    if (previous !== theme && document.getAnimations) {
      document.getAnimations().forEach(function(animation) {
        if (/color|fill|stroke/.test(animation.transitionProperty || '')) {
          try { animation.finish(); } catch (_) {}
        }
      });
    }
    return theme;
  }

  function updateLabels() {
    document.querySelectorAll('.theme-switch').forEach(function (button) {
      var label = copy('Выбрать тему оформления', 'Choose appearance theme');
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('aria-haspopup', 'dialog');
      /* The relationship only means anything while the panel is on screen. A closed
         <dialog> is not rendered, so keeping aria-controls pointed at it leaves the
         reference unresolvable for assistive technology and for every audit. */
      if (dialog && dialog.open) button.setAttribute('aria-controls', 'mm-theme-dialog');
      else button.removeAttribute('aria-controls');
      var visible = button.querySelector('.theme-switch-text');
      if (visible) visible.textContent = copy('Тема', 'Theme');
    });
    if (!dialog) return;
/* BEGIN SIGNATURE PRESENTATION: studio-4 */
    dialog.querySelector('.mm-theme-overline').textContent = copy('MARKOVMADE · СРЕДА', 'MARKOVMADE · APPEARANCE');
    dialog.querySelector('[data-theme-apply]').textContent = copy('Сохранить тему', 'Save appearance');
    dialog.querySelector('[data-theme-cancel]').textContent = copy('Отмена', 'Cancel');
    dialog.querySelector('[data-theme-title]').textContent = copy('Ваша среда. Ваш ритм.', 'Your space. Your rhythm.');
/* END SIGNATURE PRESENTATION: studio-4 */
    dialog.querySelector('[data-theme-intro]').textContent = copy('Три визуальных мира. Выберите тот, в котором вам удобно.', 'Three visual worlds. Choose the one that works for you.');
/* BEGIN SIGNATURE PRESENTATION: studio-5 */
    dialog.querySelector('[data-theme-note]').textContent = copy('Выберите тему для предпросмотра. «Сохранить тему» подтвердит выбор; отмена вернёт прежнее оформление.', 'Select a theme to preview. Save appearance confirms your choice; cancel restores your previous theme.');
/* END SIGNATURE PRESENTATION: studio-5 */
    dialog.querySelector('[data-theme-close]').setAttribute('aria-label', copy('Закрыть без сохранения', 'Close without saving'));
    dialog.querySelectorAll('[data-theme-value]').forEach(function (button) {
      var content = themes[button.dataset.themeValue][language()];
      button.querySelector('[data-theme-name]').textContent = content[0];
      button.querySelector('[data-theme-description]').textContent = content[1];
/* BEGIN SIGNATURE PRESENTATION: studio-6 */
      button.querySelector('.mm-theme-preview img').src = 'assets/media/theme-previews/' + button.dataset.themeValue + (language() === 'en' ? '-en' : '') + '.webp';
      button.querySelector('[data-theme-action]').textContent = button.dataset.themeValue === pending ? copy('Выбрана', 'Selected') : copy('Посмотреть', 'Preview');
/* END SIGNATURE PRESENTATION: studio-6 */
    });
  }

  function syncSelected() {
    if (!dialog) return;
    dialog.querySelectorAll('[data-theme-value]').forEach(function (button) {
/* BEGIN SIGNATURE PRESENTATION: studio-7 */
      button.setAttribute('aria-pressed', String(button.dataset.themeValue === pending));
/* END SIGNATURE PRESENTATION: studio-7 */
    });
  }

  function closeAndRestore() {
/* BEGIN SIGNATURE PRESENTATION: studio-8 */
    pending = selected;
    preview = null;
    apply(selected);
    updateLabels();
/* END SIGNATURE PRESENTATION: studio-8 */
    if (returnFocus && returnFocus.isConnected) returnFocus.focus();
  }

  function buildDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.id = 'mm-theme-dialog';
    dialog.className = 'mm-theme-dialog';
    dialog.setAttribute('aria-labelledby', 'mm-theme-title');
/* BEGIN SIGNATURE PRESENTATION: studio-9 */
    dialog.setAttribute('aria-describedby', 'mm-theme-note');
/* END SIGNATURE PRESENTATION: studio-9 */
    dialog.innerHTML = '<div class="mm-theme-head"><div><span class="mm-theme-overline">MARKOVMADE · APPEARANCE</span><h2 id="mm-theme-title" data-theme-title></h2><p data-theme-intro></p></div><button class="mm-theme-close" type="button" data-theme-close><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div class="mm-theme-options" role="group" aria-labelledby="mm-theme-title">' +
      Object.keys(themes).map(function (name) {
/* BEGIN SIGNATURE PRESENTATION: studio-10 */
        return '<button class="mm-theme-option" type="button" data-theme-value="' + name + '" aria-pressed="false"><span class="mm-theme-preview" aria-hidden="true"><img src="assets/media/theme-previews/' + name + '.webp" width="480" height="333" alt="" loading="lazy" decoding="async"></span><span class="mm-theme-copy"><b data-theme-name></b><small data-theme-description></small><span class="mm-theme-action" data-theme-action></span></span></button>';
      }).join('') + '</div><p class="mm-theme-note" id="mm-theme-note" data-theme-note></p><div class="mm-theme-footer"><button type="button" data-theme-cancel></button><button type="button" data-theme-apply></button></div>';
/* END SIGNATURE PRESENTATION: studio-10 */
    document.body.appendChild(dialog);
    dialog.querySelectorAll('[data-theme-value]').forEach(function (button) {
      var name = button.dataset.themeValue;
/* BEGIN SIGNATURE PRESENTATION: studio-11 */
      button.addEventListener('pointerenter', function (event) { if (event.pointerType === 'touch') return; preview = name; apply(name); });
/* END SIGNATURE PRESENTATION: studio-11 */
      button.addEventListener('pointerleave', function () {
/* BEGIN SIGNATURE PRESENTATION: studio-12 */
        if (!button.matches(':focus')) { preview = null; apply(pending); }
/* END SIGNATURE PRESENTATION: studio-12 */
      });
      button.addEventListener('focus', function () { preview = name; apply(name); });
/* BEGIN SIGNATURE PRESENTATION: studio-13 */
      button.addEventListener('blur', function () { preview = null; apply(pending); });
/* END SIGNATURE PRESENTATION: studio-13 */
      button.addEventListener('click', function () {
/* BEGIN SIGNATURE PRESENTATION: studio-14 */
        pending = name;
        preview = null;
        apply(pending);
        syncSelected();
        updateLabels();
      });
    });
    dialog.querySelector('[data-theme-apply]').addEventListener('click', function () {
        selected = pending;
        var name = selected;
/* END SIGNATURE PRESENTATION: studio-14 */
        preview = null;
        apply(name);
        safeSet('mm.theme', name);
        safeSet('markov-theme', legacyValues[name]);
        var sharedUrl = new URL(location.href);
        if (sharedUrl.searchParams.has('theme')) {
          sharedUrl.searchParams.set('theme', name);
          history.replaceState(null, '', sharedUrl);
        }
        syncSelected();
/* BEGIN BEYOND PRESENTATION: theme confirmation */
        if(window.MarkovMadeMotion)window.MarkovMadeMotion.theme(()=>dialog.close());else dialog.close();
/* END BEYOND PRESENTATION: theme confirmation */
/* BEGIN SIGNATURE PRESENTATION: studio-15 */
    });
    dialog.querySelector('[data-theme-cancel]').addEventListener('click', function () { dialog.close(); });
/* END SIGNATURE PRESENTATION: studio-15 */
    dialog.querySelector('[data-theme-close]').addEventListener('click', function () { dialog.close(); });
/* BEGIN SIGNATURE PRESENTATION: studio-16 */
    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;
      var bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
/* END SIGNATURE PRESENTATION: studio-16 */
    dialog.addEventListener('cancel', function () { closeAndRestore(); });
    dialog.addEventListener('close', closeAndRestore);
    updateLabels();
    syncSelected();
  }

  function open(event) {
    if (event) event.preventDefault();
/* BEGIN SIGNATURE PRESENTATION: studio-17 */
    pending = selected;
    preview = null;
/* END SIGNATURE PRESENTATION: studio-17 */
    buildDialog();
    returnFocus = event && event.currentTarget ? event.currentTarget : document.activeElement;
    updateLabels();
    syncSelected();
    if (!dialog.open) dialog.showModal();
    updateLabels();
  }

  function init() {
    var stored = safeGet('mm.theme');
    var legacy = safeGet('markov-theme');
    var saved = resolve(stored) || resolve(legacy);
    if (saved && stored !== saved) safeSet('mm.theme', saved);
    if (!saved) {
      var boot = document.documentElement.dataset.theme;
      saved = resolve(boot) || 'aurum-noir';
    }
    selected = apply(resolve(new URLSearchParams(location.search).get('theme')) || saved);
/* BEGIN SIGNATURE PRESENTATION: studio-18 */
    pending = selected;
/* END SIGNATURE PRESENTATION: studio-18 */
    document.querySelectorAll('.theme-switch').forEach(function (button) { button.addEventListener('click', open); });
    document.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('[data-lang-toggle]')) window.setTimeout(updateLabels, 0);
    }, true);
    new MutationObserver(updateLabels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
