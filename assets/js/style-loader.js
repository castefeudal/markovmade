/* The shell paints from critical CSS. Section styles are requested
   when navigation or scrolling requires them; no below-fold layout at boot. */
(function () {
  let pending;
  function load() {
    if (pending) return pending;
    pending = new Promise((resolve, reject) => {
      const sheet = document.createElement('link');
      sheet.rel = 'stylesheet'; sheet.href = 'assets/dist/site.css';
      sheet.onload = resolve;
      sheet.onerror = () => { pending = null; sheet.remove(); reject(new Error('Section styles failed to load')); };
      document.head.appendChild(sheet);
    });
    return pending;
  }
  window.mmLoadStyles = load;
  addEventListener('scroll', () => { if (scrollY > 0) load().catch(() => {}); }, { passive: true });
  addEventListener('wheel', () => load().catch(() => {}), { passive: true, once: true });
  addEventListener('touchmove', () => load().catch(() => {}), { passive: true, once: true });
  document.addEventListener('pointerdown', () => load().catch(() => {}), { passive: true, once: true });
  document.addEventListener('focusin', () => load().catch(() => {}), { once: true });
  if (location.hash) load().then(() => document.getElementById(location.hash.slice(1))?.scrollIntoView()).catch(() => {});
})();
