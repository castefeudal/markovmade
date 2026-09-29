/* MARKOVMADE theme selector: previews are temporary; only an explicit choice persists. */
(function () {
  'use strict';

  var themes = {
    'aurum-noir': {
      ru: ['Aurum Noir', 'Обсидиан · шампань · сдержанная глубина'],
      en: ['Aurum Noir', 'Obsidian · champagne · quiet depth']
    },
    'ivory-atelier': {
      ru: ['Ivory Atelier', 'Тёплая бумага · чернила · архитектурный покой'],
      en: ['Ivory Atelier', 'Warm paper · ink · architectural calm']
    },
    'imperial-emerald': {
      ru: ['Imperial Emerald', 'Минеральный лес · латунь · природная точность'],
      en: ['Imperial Emerald', 'Mineral forest · brass · natural precision']
    },
    'oxblood-atelier': {
      ru: ['Oxblood Atelier', 'Вишнёвая кожа · бронза · couture'],
      en: ['Oxblood Atelier', 'Cherry leather · bronze · couture']
    },
    'titanium-midnight': {
      ru: ['Titanium Midnight', 'Титан · midnight · точные данные'],
      en: ['Titanium Midnight', 'Titanium · midnight · precise data']
    },
    'mono-access': {
      ru: ['Mono Access', 'Максимальная ясность · контраст · фокус'],
      en: ['Mono Access', 'Maximum clarity · contrast · focus']
    }
  };
  var aliases = {
    obsidian: 'aurum-noir', dark: 'aurum-noir', deep: 'aurum-noir',
    ivory: 'ivory-atelier', light: 'ivory-atelier',
    graphite: 'titanium-midnight', soft: 'titanium-midnight', calm: 'titanium-midnight',
    contrast: 'mono-access'
  };
  var legacyValues = {
    'aurum-noir': 'deep', 'ivory-atelier': 'light', 'imperial-emerald': 'deep',
    'oxblood-atelier': 'deep', 'titanium-midnight': 'soft', 'mono-access': 'contrast'
  };
  var selected = 'aurum-noir';
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
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === 'ivory-atelier' ? 'light' : 'dark';
    var body = document.body;
    if (body) {
      body.classList.remove('theme-light', 'theme-soft', 'theme-contrast');
      body.classList.toggle('theme-light', theme === 'ivory-atelier');
      body.classList.toggle('theme-contrast', theme === 'mono-access');
    }
    var meta = document.getElementById('theme-color-meta');
    if (meta) {
      var colors = {
        'aurum-noir':'#080807', 'ivory-atelier':'#f1ede4', 'imperial-emerald':'#08100d',
        'oxblood-atelier':'#10090b', 'titanium-midnight':'#090d12', 'mono-access':'#000000'
      };
      meta.setAttribute('content', colors[theme]);
    }
    return theme;
  }

  function updateLabels() {
    document.querySelectorAll('.theme-switch').forEach(function (button) {
      var label = copy('Выбрать тему оформления', 'Choose appearance theme');
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-controls', 'mm-theme-dialog');
      var visible = button.querySelector('.theme-switch-text');
      if (visible) visible.textContent = copy('Тема', 'Theme');
    });
    if (!dialog) return;
    dialog.querySelector('[data-theme-title]').textContent = copy('Атмосфера MARKOVMADE', 'The MARKOVMADE atmosphere');
    dialog.querySelector('[data-theme-intro]').textContent = copy('Шесть визуальных миров. Один и тот же точный продукт.', 'Six visual worlds. The same considered product.');
    dialog.querySelector('[data-theme-note]').textContent = copy('Наведите или сфокусируйтесь, чтобы посмотреть тему. Выбор сохраняется только по нажатию.', 'Hover or focus to preview. A theme is saved only when selected.');
    dialog.querySelector('[data-theme-close]').setAttribute('aria-label', copy('Закрыть без сохранения', 'Close without saving'));
    dialog.querySelectorAll('[data-theme-value]').forEach(function (button) {
      var content = themes[button.dataset.themeValue][language()];
      button.querySelector('[data-theme-name]').textContent = content[0];
      button.querySelector('[data-theme-description]').textContent = content[1];
      button.querySelector('[data-theme-metric-label]').textContent = copy('ГОТОВНОСТЬ', 'READINESS');
    });
  }

  function syncSelected() {
    if (!dialog) return;
    dialog.querySelectorAll('[data-theme-value]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.themeValue === selected));
    });
  }

  function closeAndRestore() {
    if (preview) { apply(selected); preview = null; }
    if (returnFocus && returnFocus.isConnected) returnFocus.focus();
  }

  function buildDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.id = 'mm-theme-dialog';
    dialog.className = 'mm-theme-dialog';
    dialog.setAttribute('aria-labelledby', 'mm-theme-title');
    dialog.innerHTML = '<div class="mm-theme-head"><div><span class="mm-theme-overline">MARKOVMADE · APPEARANCE</span><h2 id="mm-theme-title" data-theme-title></h2><p data-theme-intro></p></div><button class="mm-theme-close" type="button" data-theme-close><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div class="mm-theme-options" role="group" aria-label="Appearance themes">' +
      Object.keys(themes).map(function (name) {
        return '<button class="mm-theme-option" type="button" data-theme-value="' + name + '" aria-pressed="false"><span class="mm-theme-preview" aria-hidden="true"><i></i><b>84</b><small data-theme-metric-label>READINESS</small></span><span class="mm-theme-copy"><b data-theme-name></b><small data-theme-description></small></span></button>';
      }).join('') + '</div><p class="mm-theme-note" data-theme-note></p>';
    document.body.appendChild(dialog);
    dialog.querySelectorAll('[data-theme-value]').forEach(function (button) {
      var name = button.dataset.themeValue;
      button.addEventListener('pointerenter', function () { preview = name; apply(name); });
      button.addEventListener('pointerleave', function () {
        if (!button.matches(':focus')) { preview = null; apply(selected); }
      });
      button.addEventListener('focus', function () { preview = name; apply(name); });
      button.addEventListener('blur', function () { preview = null; apply(selected); });
      button.addEventListener('click', function () {
        selected = name;
        preview = null;
        apply(name);
        safeSet('mm.theme', name);
        safeSet('markov-theme', legacyValues[name]);
        syncSelected();
        dialog.close();
      });
    });
    dialog.querySelector('[data-theme-close]').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('cancel', function () { closeAndRestore(); });
    dialog.addEventListener('close', closeAndRestore);
    updateLabels();
    syncSelected();
  }

  function open(event) {
    if (event) event.preventDefault();
    buildDialog();
    returnFocus = event && event.currentTarget ? event.currentTarget : document.activeElement;
    updateLabels();
    syncSelected();
    if (!dialog.open) dialog.showModal();
  }

  function init() {
    var saved = resolve(safeGet('mm.theme')) || resolve(safeGet('markov-theme'));
    var manual = !!saved;
    if (!saved) {
      var boot = document.documentElement.dataset.theme;
      saved = resolve(boot) || 'aurum-noir';
    }
    selected = apply(saved);
    if (!manual && window.matchMedia) {
      var contrast = window.matchMedia('(prefers-contrast: more)');
      var scheme = window.matchMedia('(prefers-color-scheme: light)');
      function followDevice() {
        if (safeGet('mm.theme') || safeGet('markov-theme')) return;
        selected = apply(contrast.matches ? 'mono-access' : (scheme.matches ? 'ivory-atelier' : 'aurum-noir'));
      }
      [contrast, scheme].forEach(function (query) {
        if (query.addEventListener) query.addEventListener('change', followDevice);
        else if (query.addListener) query.addListener(followDevice);
      });
    }
    document.querySelectorAll('.theme-switch').forEach(function (button) { button.addEventListener('click', open); });
    document.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('[data-lang-toggle]')) window.setTimeout(updateLabels, 0);
    }, true);
    new MutationObserver(updateLabels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
