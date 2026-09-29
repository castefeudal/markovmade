(function () {
  'use strict';
  var names = {
    obsidian: {ru:['Obsidian','Тёмная графитовая основа'],en:['Obsidian','Deep graphite and platinum']},
    ivory: {ru:['Ivory','Тёплая бумага и чернила'],en:['Ivory','Warm paper and ink']},
    graphite: {ru:['Graphite / Calm','Матовая спокойная палитра'],en:['Graphite / Calm','A quieter matte palette']},
    contrast: {ru:['High contrast','Чёткие границы и фокус'],en:['High contrast','Crisp boundaries and focus']}
  };
  var selected = 'obsidian';
  var dialog;
  var returnFocus;
  function language() { return document.documentElement.lang === 'en' ? 'en' : 'ru'; }
  function text(ru, en) { return language() === 'en' ? en : ru; }
  function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  function legacyName(theme) { return theme === 'ivory' ? 'light' : (theme === 'graphite' ? 'soft' : (theme === 'contrast' ? 'contrast' : 'deep')); }
  function labels() {
    document.querySelectorAll('.theme-switch').forEach(function (button) {
      var label = text('Выбрать тему оформления', 'Choose appearance theme');
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      var visible = button.querySelector('.theme-switch-text');
      if (visible) visible.textContent = text('Тема', 'Theme');
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-controls', 'mm-theme-dialog');
    });
    if (!dialog) return;
    dialog.querySelector('[data-theme-title]').textContent = text('Оформление', 'Appearance');
    dialog.querySelector('[data-theme-intro]').textContent = text('Выберите спокойную палитру для работы с сайтом.', 'Choose a considered palette for the site.');
    dialog.querySelector('[data-theme-note]').textContent = text('Выбор сохранится в этом браузере. Настройки устройства используются до ручного выбора.', 'Your choice is stored in this browser. Device preferences apply until you choose a theme.');
    dialog.querySelector('[data-theme-close]').setAttribute('aria-label', text('Закрыть настройки оформления', 'Close appearance settings'));
    dialog.querySelectorAll('[data-theme-value]').forEach(function (button) {
      var copy = names[button.dataset.themeValue][language()];
      button.querySelector('b').textContent = copy[0];
      button.querySelector('small').textContent = copy[1];
    });
  }
  function syncButtons() {
    if (!dialog) return;
    dialog.querySelectorAll('[data-theme-value]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.themeValue === selected));
    });
  }
  function applyTheme(theme, persist) {
    if (!names[theme]) theme = 'obsidian';
    selected = theme;
    var root = document.documentElement;
    var body = document.body;
    root.dataset.theme = theme;
    root.style.colorScheme = theme === 'ivory' ? 'light' : 'dark';
    if (body) {
      body.classList.remove('theme-light', 'theme-soft', 'theme-contrast');
      body.classList.toggle('theme-light', theme === 'ivory');
      body.classList.toggle('theme-soft', theme === 'graphite');
      body.classList.toggle('theme-contrast', theme === 'contrast');
    }
    var meta = document.getElementById('theme-color-meta');
    if (meta) meta.setAttribute('content', theme === 'ivory' ? '#f3efe6' : (theme === 'graphite' ? '#202220' : '#060706'));
    if (persist) { safeSet('markov-theme', legacyName(theme)); safeSet('mm.theme', theme); }
    syncButtons();
  }
  function buildDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'mm-theme-dialog';
    dialog.id = 'mm-theme-dialog';
    dialog.setAttribute('aria-labelledby', 'mm-theme-title');
    dialog.innerHTML = '<div class="mm-theme-head"><div><h2 id="mm-theme-title" data-theme-title></h2><p data-theme-intro></p></div><button class="mm-theme-close" type="button" data-theme-close><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div class="mm-theme-options" role="group" aria-label="Appearance themes">' + Object.keys(names).map(function (name) { return '<button class="mm-theme-option" type="button" data-theme-value="' + name + '" aria-pressed="false"><span class="mm-theme-swatch" aria-hidden="true"></span><span><b></b><small></small></span></button>'; }).join('') + '</div><p class="mm-theme-note" data-theme-note></p>';
    document.body.appendChild(dialog);
    dialog.querySelectorAll('[data-theme-value]').forEach(function (button) {
      button.addEventListener('click', function () { applyTheme(button.dataset.themeValue, true); dialog.close(); if (returnFocus) returnFocus.focus(); });
    });
    dialog.querySelector('[data-theme-close]').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function () { if (returnFocus) returnFocus.focus(); });
    labels(); syncButtons();
  }
  function openPicker(event) {
    if (event) event.preventDefault();
    buildDialog();
    returnFocus = event && event.currentTarget ? event.currentTarget : document.activeElement;
    labels(); syncButtons();
    if (!dialog.open) dialog.showModal();
  }
  function init() {
    var saved = safeGet('mm.theme') || safeGet('markov-theme');
    var aliases = {light:'ivory',deep:'obsidian',dark:'obsidian',soft:'graphite',calm:'graphite'};
    if (aliases[saved]) saved = aliases[saved];
    var hasManualChoice = !!names[saved];
    if (!hasManualChoice) saved = document.documentElement.dataset.theme || 'obsidian';
    applyTheme(saved, false);
    if (!hasManualChoice && window.matchMedia) {
      var darkPreference = window.matchMedia('(prefers-color-scheme: dark)');
      var contrastPreference = window.matchMedia('(prefers-contrast: more)');
      function followDevice() { applyTheme(contrastPreference.matches ? 'contrast' : (darkPreference.matches ? 'obsidian' : 'ivory'), false); }
      [darkPreference, contrastPreference].forEach(function (query) {
        if (query.addEventListener) query.addEventListener('change', followDevice);
        else if (query.addListener) query.addListener(followDevice);
      });
    }
    document.querySelectorAll('.theme-switch').forEach(function (button) { button.removeAttribute('onclick'); button.addEventListener('click', openPicker); });
    window.toggleTheme = openPicker;
    document.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('[data-lang-toggle]')) window.setTimeout(labels, 0);
    }, true);
    new MutationObserver(function () { labels(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
