(function(){
  var SEO_IMAGE = 'https://castefeudal.github.io/markovmade/assets/media/brand/og-cover.png';
  var SEO_BASE = 'https://castefeudal.github.io/markovmade/';
  function setMeta(selector, value){ var el=document.querySelector(selector); if(el) el.setAttribute('content', value); }
  function applySeoMeta(){
    var en = document.documentElement.lang === 'en' || document.body.classList.contains('lang-en');
    setMeta('meta[property="og:title"]', en ? 'MARKOVMADE | Body and nutrition for your life' : 'MARKOVMADE | Тело и питание под вашу жизнь');
    setMeta('meta[property="og:description"]', en ? 'Pavel Markov’s personal assessment: body, nutrition, mindset, recovery, progress and the Personal OS prototype.' : 'Персональный разбор Павла Маркова: тело, питание, мышление, восстановление, прогресс и прототип Personal OS.');
    setMeta('meta[property="og:image"]', SEO_IMAGE); setMeta('meta[property="og:image:secure_url"]', SEO_IMAGE); setMeta('meta[name="twitter:image"]', SEO_IMAGE);
    setMeta('meta[name="twitter:title"]', en ? 'MARKOVMADE — body, nutrition and discipline system' : 'MARKOVMADE — персональная система тела, питания и дисциплины');
    setMeta('meta[name="twitter:description"]', en ? 'FFMI, macros, recovery, progress, work formats and the Personal OS prototype.' : 'Расчёт FFMI, КБЖУ, восстановление, прогресс, форматы работы и прототип Personal OS.');
    /* A shared page must describe the language it is actually showing. The canonical link
       stays on the parameter-free URL; these two follow the active language. */
    setMeta('meta[property="og:url"]', en ? SEO_BASE + '?lang=en' : SEO_BASE);
    setMeta('meta[property="og:locale"]', en ? 'en_US' : 'ru_RU');
    var alternate = document.querySelector('link[rel="alternate"][hreflang="' + (en ? 'en' : 'ru') + '"]');
    if (alternate) alternate.setAttribute('href', en ? SEO_BASE + '?lang=en' : SEO_BASE + '?lang=ru');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', applySeoMeta, {once:true}); else applySeoMeta();
  document.addEventListener('click', function(e){ if(e.target.closest && e.target.closest('[data-lang-toggle]')) setTimeout(applySeoMeta, 60); }, true);
})();
