/* One owner for anchors, mobile focus, progress and floating controls. */
(function () {
  'use strict';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menu = document.getElementById('mobile-menu');
  const burger = document.getElementById('burger-btn');
  const header = document.getElementById('main-header');
  const main = document.getElementById('main-content');
  // Reading scrollY during bootstrap flushes the entire pending initial layout.
  // The first actual scroll event supplies the position, including restoration,
  // and doubles as the proof that the reader is anywhere but at the top.
  let returnFocus, scrollFrame = 0, resizeFrame = 0, lastY = 0, scrolled = false;
  function setMenu(open, opener) {
    if (!menu) return;
    if (open) returnFocus = opener || document.activeElement;
    menu.inert = !open;
    menu.setAttribute('aria-hidden', String(!open));
    menu.classList.toggle('translate-x-full', !open);
    document.body.classList.toggle('menu-open', open);
    if (burger) burger.setAttribute('aria-expanded', String(open));
    if (main) main.inert = open;
    if (header) header.inert = open;
    if (open) menu.querySelector('a,button')?.focus();
    else if (returnFocus?.isConnected) { returnFocus.focus({preventScroll:true}); returnFocus = null; }
  }
  window.toggleMenu = () => setMenu(menu?.inert, burger);
  burger?.addEventListener('click', window.toggleMenu);
  menu?.querySelector('[data-menu-close]')?.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', event => {
    if (!menu || menu.inert) return;
    if (event.key === 'Escape') { event.preventDefault(); setMenu(false); }
    if (event.key !== 'Tab') return;
    const items = [...menu.querySelectorAll('a,button')].filter(el => el.getClientRects().length);
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  const locationLinks = [...document.querySelectorAll('#main-header nav a[href^="#"], #mobile-menu nav a[href^="#"]')];
  const locationTargets = [...new Set(locationLinks.map(link => document.getElementById(link.getAttribute('href').slice(1))).filter(Boolean))].sort((a,b)=>a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
  let currentLocation=null;
  function setCurrentLocation(id) {
    if(currentLocation===id)return;
    currentLocation=id;
    locationLinks.forEach(link => {
      if (id && link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function updateCurrentLocation() {
    // Resolve the complete document order, not just the entries changed in one
    // observer callback. Keep a section current through its supporting content.
    const marker=Math.min(innerHeight*.75,Math.max((header?.offsetHeight||72)+24,innerHeight*.5));
    let id='';
    for(const target of locationTargets){
      if(target.getBoundingClientRect().top>marker)break;
      id=target.id;
    }
    if(scrollY>0&&scrollY+innerHeight>=document.documentElement.scrollHeight-2)id=locationTargets.at(-1)?.id||id;
    setCurrentLocation(id);
  }
  if ('IntersectionObserver' in window && locationTargets.length) {
    const locationObserver=new IntersectionObserver(()=>{
      // Before the first scroll event the reader is provably at the top, where no
      // anchored section reaches the marker and nothing is current by construction.
      // Walking the section list instead measured every content-visibility section
      // from scratch on each frame the document needed to settle after first paint.
      if(!scrolled){setCurrentLocation('');return;}
      updateCurrentLocation();
    },{threshold:0});
    locationTargets.forEach(target=>locationObserver.observe(target));
  }else addEventListener('load',updateCurrentLocation,{once:true});
  // Content growing or collapsing changes the runnable height, so it only needs
  // the progress scale recomputed. The section walk and the header states belong
  // to real scrolling and resizing; running them on every resize notification
  // forced layout for each frame the document took to settle after first paint.
  if('ResizeObserver' in window&&main)new ResizeObserver(()=>{
    if(!resizeFrame)resizeFrame=requestAnimationFrame(renderProgress);
  }).observe(main);
  let navigationRequest=0;
  function savePosition(){
    const marker=innerHeight*.3;
    const section=[...main.querySelectorAll(':scope > section[id]')].find(section=>{const rect=section.getBoundingClientRect();return rect.top<=marker&&rect.bottom>marker;});
    if(section)history.replaceState({...history.state,mmPosition:{id:section.id,top:section.getBoundingClientRect().top}},'',location.href);
  }
  async function navigate(hash,{focus=true,behavior=reduced()?'instant':'smooth'}={}){
    const request=++navigationRequest;
    let id;try{id=decodeURIComponent(hash.slice(1));}catch{id=hash.slice(1);}
    try{
      await window.mmLoadStyles?.();
      if(id==='calculators'||/^(lab-|mm-lab-)/.test(id)){
        if(document.getElementById('mm-lab-load-error'))throw new Error('LAB awaits an explicit retry');
        await window.mmLoadLab?.();
      }
      if(id==='app-ecosystem'||/^(insights(?:-|$)|mm-os-)/.test(id)){
        if(document.getElementById('mm-os-load-error'))throw new Error('Personal OS awaits an explicit retry');
        await window.mmLoadOS?.();
      }
    }catch{
      if(request!==navigationRequest)return false;
      const failureId=/^(calculators$|lab-|mm-lab-)/.test(id)?'mm-lab-load-error':/^(app-ecosystem$|insights(?:-|$)|mm-os-)/.test(id)?'mm-os-load-error':null;
      const failure=failureId?document.getElementById(failureId):null;
      const landing=failure||document.getElementById(id);
      landing?.scrollIntoView({behavior:'instant',block:'start'});
      if(focus)failure?.querySelector('button')?.focus({preventScroll:true});
      return false;
    }
    if(request!==navigationRequest)return false;
    const target=document.getElementById(id);
    if(!target)return false;
    const panel=target.closest('[role="tabpanel"]');
    if(panel?.hidden){
      [...document.querySelectorAll('[role="tab"]')].find(tab=>tab.getAttribute('aria-controls')===panel.id)?.click();
    }
    if(target.matches('[role="tab"]'))target.click();
    if(target.tagName==='DETAILS')target.open=true;
    for(let parent=target.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
    target.scrollIntoView({behavior,block:'start'});
    if(focus){
      if(!target.matches('a[href],button,input,select,textarea,[tabindex]'))target.setAttribute('tabindex','-1');
      target.focus({preventScroll:true});
    }
    // Revealing content-visibility sections can change the anchor's position
    // after the browser's first scroll. Realign after that layout is painted.
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(request!==navigationRequest)return false;
    target.scrollIntoView({behavior,block:'start'});
    return true;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (event.target.closest('[aria-disabled="true"]')) { event.preventDefault(); return; }
    if (!link || link.getAttribute('href').length < 2 || event.defaultPrevented) return;
    const hash=link.getAttribute('href');
    if(!document.getElementById(hash.slice(1))&&!/^#(?:lab-|mm-lab-|insights|mm-os-)/.test(hash))return;
    event.preventDefault();
    setMenu(false);
    if(link.id!=='skip-to-main'&&location.hash!==hash){savePosition();history.pushState(null,'',hash);}
    navigate(hash);
  });
  const restore=async()=>{
    const saved=history.state?.mmPosition;
    if(saved&&typeof saved.id==='string'&&Number.isFinite(saved.top)){
      if(!await navigate('#'+saved.id,{focus:false,behavior:'instant'}))return;
      const request=navigationRequest;
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const section=document.getElementById(saved.id);
      if(section&&request===navigationRequest)scrollBy({top:section.getBoundingClientRect().top-saved.top,behavior:'instant'});
    }else if(location.hash)navigate(location.hash,{focus:false,behavior:'instant'});else ++navigationRequest;
  };
  addEventListener('popstate',restore);
  addEventListener('hashchange',restore);
  document.addEventListener('mm:component-recovered',event=>{
    const hash=location.hash;
    if((event.detail?.id==='calculators'&&/^#(?:calculators$|lab-|mm-lab-)/.test(hash))||
       (event.detail?.id==='app-ecosystem'&&/^#(?:app-ecosystem$|insights|mm-os-)/.test(hash)))navigate(hash,{focus:false,behavior:'instant'});
  });
  const land=()=>{if(location.hash)navigate(location.hash,{focus:false,behavior:'instant'});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',land,{once:true});else land();
  const progress = document.createElement('div');
  progress.id = 'mm-scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  const actions = document.createElement('div');
  actions.id = 'mm-quick-actions';
  actions.inert = true;
  actions.innerHTML = '<a class="mm-quick-btn wide" href="#contact" data-quick-contact aria-label="Контакты"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span class="sr-only mm-quick-label">Контакты</span></a><a class="mm-quick-btn" href="#hero" data-mm-top aria-label="Наверх"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 19V5m-7 7 7-7 7 7"/></svg></a>';
  document.body.appendChild(actions);
  function labels() {
    const en = document.documentElement.lang === 'en';
    actions.querySelector('[data-quick-contact]').setAttribute('aria-label', en ? 'Contact' : 'Контакты');
    actions.querySelector('[data-quick-contact] .mm-quick-label').textContent = en ? 'Contact' : 'Контакты';
    actions.querySelector('[data-mm-top]').setAttribute('aria-label', en ? 'Back to top' : 'Наверх');
    burger?.setAttribute('aria-label', en ? 'Menu' : 'Меню');
    menu?.setAttribute('aria-label', en ? 'Navigation' : 'Навигация');
    menu?.querySelector('[data-menu-close]')?.setAttribute('aria-label', en ? 'Close menu' : 'Закрыть меню');
  }
  new MutationObserver(labels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  labels();
  header?.addEventListener('focusin', () => { header.classList.remove('scrolled-down'); header.classList.add('scrolled-up'); });
  function renderProgress() {
    resizeFrame = 0;
    // The bar is empty at the top whatever the document height turns out to be,
    // so the frames the page spends settling after first paint need no layout read.
    if (!scrolled) return;
    progress.style.transform = `scaleX(${Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`;
  }
  function renderScroll() {
    scrollFrame = 0;
    const y = scrollY;
    updateCurrentLocation();
    progress.style.transform = `scaleX(${Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`;
    const down = y > 200 && y > lastY + 2;
    header?.classList.toggle('scrolled-down', down && !document.body.classList.contains('menu-open'));
    header?.classList.toggle('scrolled-up', !down);
    actions.classList.toggle('visible', y > innerHeight);
    actions.inert = y <= innerHeight;
    lastY = y;
  }
  addEventListener('scroll', () => { scrolled = true; if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScroll); }, { passive: true });
  addEventListener('resize', () => {
    if (innerWidth > 1180 && menu && !menu.inert) setMenu(false);
    if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScroll);
  }, { passive: true });
  // Nothing moves at initial scrollY=0; avoid forcing layout during first paint.
})();
