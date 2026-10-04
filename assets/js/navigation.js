/* One owner for anchors, mobile focus, progress and floating controls. */
(function () {
  'use strict';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menu = document.getElementById('mobile-menu');
  const burger = document.getElementById('burger-btn');
  const header = document.getElementById('main-header');
  const main = document.getElementById('main-content');
  // Reading scrollY during bootstrap flushes the entire pending initial layout.
  // The first actual scroll event supplies the position, including restoration.
  let returnFocus, scrollFrame = 0, lastY = 0;
  function setMenu(open, opener) {
    if (!menu) return;
    if (open) returnFocus = opener || document.activeElement;
    menu.inert = !open;
    menu.setAttribute('aria-hidden', String(!open));
    menu.classList.toggle('translate-x-full', !open);
    document.body.classList.toggle('menu-open', open);
    if (burger) burger.setAttribute('aria-expanded', String(open));
    if (main) main.inert = open;
    if (open) menu.querySelector('a,button')?.focus();
    else if (returnFocus?.isConnected) returnFocus.focus();
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
  document.addEventListener('click', async event => {
    const link = event.target.closest('a[href^="#"]');
    if (event.target.closest('[aria-disabled="true"]')) { event.preventDefault(); return; }
    if (!link || link.getAttribute('href').length < 2 || event.defaultPrevented) return;
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    event.preventDefault();
    setMenu(false);
    await window.mmLoadStyles?.();
    target.scrollIntoView({ behavior: reduced() ? 'instant' : 'smooth', block: 'start' });
    history.replaceState(null, '', link.getAttribute('href'));
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
  const progress = document.createElement('div');
  progress.id = 'mm-scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  const actions = document.createElement('div');
  actions.id = 'mm-quick-actions';
  actions.inert = true;
  actions.innerHTML = '<a class="mm-quick-btn wide" href="#contact" data-quick-contact>Контакты</a><a class="mm-quick-btn" href="#hero" data-mm-top aria-label="Наверх">↑</a>';
  document.body.appendChild(actions);
  function labels() {
    const en = document.documentElement.lang === 'en';
    actions.querySelector('[data-quick-contact]').textContent = en ? 'Contact' : 'Контакты';
    actions.querySelector('[data-mm-top]').setAttribute('aria-label', en ? 'Back to top' : 'Наверх');
    burger?.setAttribute('aria-label', en ? 'Menu' : 'Меню');
    menu?.setAttribute('aria-label', en ? 'Navigation' : 'Навигация');
    menu?.querySelector('[data-menu-close]')?.setAttribute('aria-label', en ? 'Close menu' : 'Закрыть меню');
  }
  new MutationObserver(labels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  labels();
  header?.addEventListener('focusin', () => { header.classList.remove('scrolled-down'); header.classList.add('scrolled-up'); });
  function renderScroll() {
    scrollFrame = 0;
    const y = scrollY;
    progress.style.transform = `scaleX(${Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`;
    const down = y > 200 && y > lastY + 2;
    header?.classList.toggle('scrolled-down', down && !document.body.classList.contains('menu-open'));
    header?.classList.toggle('scrolled-up', !down);
    actions.classList.toggle('visible', y > innerHeight);
    actions.inert = y <= innerHeight;
    lastY = y;
  }
  addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScroll); }, { passive: true });
  addEventListener('resize', () => {
    if (innerWidth > 1180 && menu && !menu.inert) setMenu(false);
    if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScroll);
  }, { passive: true });
  // Nothing moves at initial scrollY=0; avoid forcing layout during first paint.
})();
