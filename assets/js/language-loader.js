/* The first screen has a build-derived English subset. Its original text nodes
   share the full translator's WeakMap, so RU restoration stays exact. */
(function () {
  let pending, ready = false;
  const locales=new Map();window.mmLocaleCopy={};
  window.mmLoadLocale=function(name){
    if(locales.has(name))return locales.get(name);
    const task=fetch('assets/dist/locales/'+name+'.en.json').then(response=>{if(!response.ok)throw new Error('Locale not available');return response.json();}).then(copy=>{Object.assign(window.mmLocaleCopy,copy);window.mmAddTranslations?.(copy);}).catch(error=>{locales.delete(name);throw error;});
    locales.set(name,task);return task;
  };
  document.querySelectorAll('[data-lang-toggle]').forEach(button => button.setAttribute('aria-label', 'EN — Switch to English'));
  function load() {
    if (pending) return pending;
    pending = window.mmLoadLocale('shared').then(()=>new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'assets/js/i18n.js';
      script.onload = () => { ready = true; resolve(); };
      script.onerror = () => { pending = null; reject(new Error('Translation could not load')); };
      document.body.appendChild(script);
    }));
    return pending;
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-lang-toggle]');
    if (!button || ready) return;
    event.preventDefault(); event.stopImmediatePropagation();
    button.setAttribute('aria-busy', 'true');
    load().then(() => { button.removeAttribute('aria-busy'); button.click(); }).catch(() => button.removeAttribute('aria-busy'));
  }, true);
  document.addEventListener('pointerover', event => { if (event.target.closest('[data-lang-toggle]')) load().catch(() => {}); }, { passive: true });
  document.addEventListener('focusin', event => { if (event.target.closest('[data-lang-toggle]')) load().catch(() => {}); });
  const requestedLanguage = new URLSearchParams(location.search).get('lang');
  if (requestedLanguage === 'ru' || requestedLanguage === 'en') window.mmSafeStorage.set('markovmade_lang', requestedLanguage);
  window.mmLoadLanguage = load;
  if (window.mmSafeStorage.get('markovmade_lang', 'ru') === 'en') {
    const originals=window.mmTextOriginals=new WeakMap();
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node;while(node=walker.nextNode()) {
      if(!node.parentElement.closest('#hero,#main-header,#mobile-menu'))continue;
      const key=node.nodeValue.replace(/\s+/g,' ').trim(),value=window.mmCriticalCopy?.[key];
      if(!value)continue;
      originals.set(node,node.nodeValue);
      node.nodeValue=node.nodeValue.match(/^\s*/)[0]+value+node.nodeValue.match(/\s*$/)[0];
    }
    document.documentElement.lang='en';document.body.classList.add('lang-en');
    document.title=window.mmCriticalMeta.title;
    document.querySelector('meta[name="description"]').content=window.mmCriticalMeta.description;
    document.querySelectorAll('[data-lang-toggle]').forEach(button=>{button.querySelector('.lang-switch-label').textContent='RU';button.setAttribute('aria-label','RU — Switch to Russian');});
    const full=()=>load().catch(()=>{});
    addEventListener('scroll',()=>{if(scrollY>0)full();},{passive:true});
    addEventListener('wheel',full,{once:true,passive:true});addEventListener('touchmove',full,{once:true,passive:true});
    document.addEventListener('focusin',event=>{if(event.target.closest('main')&&!event.target.closest('#hero'))full();});
    if(location.hash)full();
  }
  document.documentElement.dataset.criticalReady = 'true';
})();
