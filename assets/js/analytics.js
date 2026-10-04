(function(){
  'use strict';
  window.mmTrack = window.mmTrack || function(eventName, payload){
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: eventName, markovmade: payload || {} });
      if (typeof window.gtag === 'function') window.gtag('event', eventName, payload || {});
    } catch(e) {}
  };
  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest && e.target.closest('[data-analytics]');
    if (!el) return;
    window.mmTrack(el.getAttribute('data-analytics'), { text: (el.textContent || '').trim().slice(0, 80), href: el.getAttribute('href') || '' });
  }, true);
})();


(function(){
  'use strict';
  var oldTrack = window.mmTrack;
  window.mmTrack = function(eventName, payload){
    payload = payload || {};
    try {
      payload.language = document.documentElement.lang || 'ru';
      payload.theme = document.documentElement.dataset.theme || 'aurum-noir';
      payload.device_width = window.innerWidth;
      payload.path = location.pathname;
    } catch(e) {}
    if (typeof oldTrack === 'function') oldTrack(eventName, payload);
    else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({event:eventName, markovmade:payload});
    }
  };
  function markOutbound(){
    document.querySelectorAll('a[href*="t.me"],a[href*="wa.me"]').forEach(function(a){
      if(a.__v18Outbound) return; a.__v18Outbound = true;
      a.addEventListener('click', function(){ window.mmTrack(a.href.indexOf('t.me')>-1?'telegram_click':'whatsapp_click', {cta_text:(a.textContent||'').trim().slice(0,80), href:a.href}); }, true);
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){markOutbound();}, {once:true}); else {markOutbound();}
})();


(function(){
  function track(name, params){
    params = params || {};
    params.lang = document.body.classList.contains('lang-en') ? 'en' : 'ru';
    params.theme = document.documentElement.dataset.theme || 'aurum-noir';
    params.width = window.innerWidth;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, markovmade: params });
  }
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a,button');
    if(!a) return;
    var label = (a.innerText || a.getAttribute('aria-label') || a.href || '').trim().slice(0,90);
    if(a.matches('[href*="t.me"], [href*="telegram"]')) track('telegram_click', { cta: label });
    if(a.matches('[href*="wa.me"], [href*="whatsapp"]')) track('whatsapp_click', { cta: label });
    if(a.matches('[data-lang-toggle]')) track('language_switch', { cta: label });
    if(a.matches('[data-analytics], .mm-editorial-cta, .calc-primary-btn, .calc-gold-link')) track('cta_click', { cta: label, id: a.id || '', analytics: a.dataset.analytics || '' });
  }, true);
  window.markovmadeTrack = track;
})();


(function(){
  function syncAccordionHints(){
    document.querySelectorAll('#services button').forEach(function(btn){
      if(btn.__v20Hint) return; btn.__v20Hint = true;
      btn.setAttribute('title', btn.getAttribute('title') || 'Нажмите, чтобы открыть детали');
      btn.addEventListener('click', function(){
        var label = (btn.querySelector('h3') || btn).textContent.trim();
        if(window.markovmadeTrack) window.markovmadeTrack('service_open', {section: label});
      }, true);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', syncAccordionHints, {once:true}); else syncAccordionHints();
})();
