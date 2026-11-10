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
  function sizeLabel(size) {
    return ({
      small: copy('Мелко', 'Small'),
      medium: copy('Средне', 'Medium'),
      large: copy('Крупно', 'Large')
    })[size];
  }

  function updateLabels() {
    const size = selectedSize();
    const label = copy('Размер текста: ', 'Page text size: ') + sizeLabel(size);
    document.querySelectorAll('[data-reading-size-open]').forEach(function (button) {
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label + copy(' · изменить', ' · change'));
      button.setAttribute('data-reading-size-selected', size);
      button.setAttribute('aria-expanded', String(Boolean(dialog && dialog.open)));
      if (dialog) button.setAttribute('aria-controls', dialog.id);
    });
    if (!dialog) return;
    dialog.querySelector('[data-reading-size-overline]').textContent = copy('НАСТРОЙКИ СТРАНИЦЫ', 'PAGE PREFERENCES');
    dialog.querySelector('[data-reading-size-title]').textContent = copy('Размер текста', 'Page text size');
    dialog.querySelector('[data-reading-size-description]').textContent = copy(
      'Выберите размер, с которым вам комфортно читать. Изменение применяется сразу.',
      'Choose the text size that feels comfortable. Your selection applies immediately.'
    );
    dialog.querySelector('[data-reading-size-note]').textContent = copy(
      'Настройка сохраняется в этом браузере',
      'Your preference is saved in this browser'
    );
    dialog.querySelectorAll('[data-reading-size-value]').forEach(function (button) {
      const size = button.dataset.readingSizeValue;
      button.querySelector('[data-reading-size-label]').textContent = sizeLabel(size);
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
    dialog.setAttribute('aria-describedby', 'mm-reading-size-description');
    dialog.innerHTML = '<div class="mm-reading-size-head"><div><span class="mm-reading-size-overline" data-reading-size-overline></span><h2 id="mm-reading-size-title" data-reading-size-title></h2><p id="mm-reading-size-description" class="mm-reading-size-description" data-reading-size-description></p></div><button type="button" class="mm-reading-size-close" data-reading-size-close><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div class="mm-reading-size-options" role="group" aria-labelledby="mm-reading-size-title"><button type="button" class="mm-reading-size-option" data-reading-size-value="small" aria-pressed="false"><span class="mm-reading-size-check" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"><path d="m3.5 8 3 3 6-6"/></svg></span><span class="mm-reading-size-preview" aria-hidden="true">Aa</span><span data-reading-size-label></span><span class="mm-reading-size-scale" aria-hidden="true">90%</span></button><button type="button" class="mm-reading-size-option" data-reading-size-value="medium" aria-pressed="false"><span class="mm-reading-size-check" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"><path d="m3.5 8 3 3 6-6"/></svg></span><span class="mm-reading-size-preview" aria-hidden="true">Aa</span><span data-reading-size-label></span><span class="mm-reading-size-scale" aria-hidden="true">100%</span></button><button type="button" class="mm-reading-size-option" data-reading-size-value="large" aria-pressed="false"><span class="mm-reading-size-check" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"><path d="m3.5 8 3 3 6-6"/></svg></span><span class="mm-reading-size-preview" aria-hidden="true">Aa</span><span data-reading-size-label></span><span class="mm-reading-size-scale" aria-hidden="true">110%</span></button></div><p class="mm-reading-size-note"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.25 16.5 5v4.3c0 4.1-2.6 6.8-6.5 8.45-3.9-1.65-6.5-4.35-6.5-8.45V5L10 2.25Z"/><path d="m7.2 9.9 1.8 1.8 3.8-4"/></svg><span data-reading-size-note></span></p>';
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
    updateLabels();
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
