/* Persistent page reading-size preference, independent of calculator and OS data. */
(function () {
  'use strict';

  const valid = new Set(['small', 'medium', 'large']);
  let dialog;
  let returnFocus;

  function language() { return document.documentElement.lang === 'en' ? 'en' : 'ru'; }
  function copy(ru, en) { return language() === 'en' ? en : ru; }
  function safeGet() { try { return localStorage.getItem('mm.reading-size'); } catch (_) { return null; } }
  function safeSet(value) { try { localStorage.setItem('mm.reading-size', value); } catch (_) {} }
  function selectedSize() { return valid.has(document.documentElement.dataset.readingSize) ? document.documentElement.dataset.readingSize : 'medium'; }

  function updateLabels() {
    const label = copy('Настроить размер текста', 'Adjust page text size');
    document.querySelectorAll('[data-reading-size-open]').forEach(function (button) {
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      if (dialog && dialog.open) button.setAttribute('aria-controls', dialog.id);
      else button.removeAttribute('aria-controls');
    });
    if (!dialog) return;
    dialog.querySelector('[data-reading-size-overline]').textContent = copy('НАСТРОЙКА ЧТЕНИЯ', 'READING PREFERENCE');
    dialog.querySelector('[data-reading-size-title]').textContent = copy('Размер текста', 'Page text size');
    const labels = {
      small: copy('Мелко', 'Small'),
      medium: copy('Средне', 'Medium'),
      large: copy('Крупно', 'Large')
    };
    dialog.querySelectorAll('[data-reading-size-value]').forEach(function (button) {
      const size = button.dataset.readingSizeValue;
      button.querySelector('[data-reading-size-label]').textContent = labels[size];
      button.setAttribute('aria-pressed', String(size === selectedSize()));
    });
    dialog.querySelector('[data-reading-size-close]').setAttribute('aria-label', copy('Закрыть настройки размера текста', 'Close text-size settings'));
  }

  function buildDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.id = 'mm-reading-size-dialog';
    dialog.className = 'mm-reading-size-dialog';
    dialog.setAttribute('aria-labelledby', 'mm-reading-size-title');
    dialog.innerHTML = '<div class="mm-reading-size-head"><div><span class="mm-reading-size-overline" data-reading-size-overline></span><h2 id="mm-reading-size-title" data-reading-size-title></h2></div><button type="button" class="mm-reading-size-close" data-reading-size-close><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div class="mm-reading-size-options" role="group" aria-labelledby="mm-reading-size-title"><button type="button" class="mm-reading-size-option" data-reading-size-value="small" aria-pressed="false"><span class="mm-reading-size-preview" aria-hidden="true">Aa</span><span data-reading-size-label></span></button><button type="button" class="mm-reading-size-option" data-reading-size-value="medium" aria-pressed="false"><span class="mm-reading-size-preview" aria-hidden="true">Aa</span><span data-reading-size-label></span></button><button type="button" class="mm-reading-size-option" data-reading-size-value="large" aria-pressed="false"><span class="mm-reading-size-preview" aria-hidden="true">Aa</span><span data-reading-size-label></span></button></div>';
    document.body.appendChild(dialog);
    dialog.querySelectorAll('[data-reading-size-value]').forEach(function (button) {
      button.addEventListener('click', function () {
        const value = button.dataset.readingSizeValue;
        if (!valid.has(value)) return;
        document.documentElement.dataset.readingSize = value;
        safeSet(value);
        updateLabels();
        dialog.close();
      });
    });
    dialog.querySelector('[data-reading-size-close]').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function () {
      if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
      returnFocus = null;
      updateLabels();
    });
  }

  function open(event) {
    event.preventDefault();
    buildDialog();
    returnFocus = event.currentTarget;
    updateLabels();
    dialog.showModal();
    dialog.querySelector(`[data-reading-size-value="${selectedSize()}"]`).focus();
  }

  function init() {
    const stored = safeGet();
    document.documentElement.dataset.readingSize = valid.has(stored) ? stored : selectedSize();
    document.querySelectorAll('[data-reading-size-open]').forEach(function (button) {
      button.addEventListener('click', open);
    });
    new MutationObserver(updateLabels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    updateLabels();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
