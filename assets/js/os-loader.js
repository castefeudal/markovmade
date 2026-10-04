/* Personal OS and its Insights engine enter with the product section. */
(function () {
  const section = document.getElementById('app-ecosystem');
  if (!section) return;
  let pending, ready = false;
  const scripts = new Map();
  function script(name) {
    if (scripts.has(name)) return scripts.get(name);
    const task = new Promise((resolve, reject) => {
      const node = document.createElement('script');
      node.src = 'assets/js/' + name + '.js';
      node.onload = resolve; node.onerror = () => { scripts.delete(name); node.remove(); reject(new Error('Cannot load ' + name)); };
      document.body.appendChild(node);
    });
    scripts.set(name, task);
    return task;
  }
  function load() {
    if (pending) return pending;
    pending = (async () => {
      const host = section.querySelector('[data-component="personal-os"]');
      await Promise.all([
        window.mmLoadStyles?.(),
        window.mmSafeStorage.get('markovmade-lab-v1', null) ? window.mmLoadLab() : Promise.resolve(),
        host && !host.dataset.hydrated ? fetch('assets/dist/personal-os.html').then(response => {
          if (!response.ok) throw new Error('OS markup could not load');
          return response.text();
        }).then(html => { host.innerHTML = html; host.dataset.hydrated = 'true'; host.removeAttribute('aria-busy'); host.classList.add('visible'); }) : Promise.resolve()
      ]);
      await script('personal-os');
      await script('site-interactions');
      window.mmRefreshPersonalOS?.();
      await window.mmTranslate?.(section);
      ready = true; document.getElementById('mm-os-load-error')?.remove(); observer?.disconnect();
    })().catch(error => { pending = null; observer?.disconnect(); showFailure(); throw error; });
    return pending;
  }
  function showFailure() {
    let status = document.getElementById('mm-os-load-error');
    if (!status) { status = document.createElement('div'); status.id = 'mm-os-load-error'; status.className = 'mm-component-loading'; status.setAttribute('role','alert'); section.querySelector('[data-component="personal-os"]').before(status); }
    const en = document.documentElement.lang === 'en';
    status.replaceChildren(document.createTextNode(en ? 'Could not load Personal OS. ' : 'Personal OS не загрузился. '));
    const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'mm-secondary-cta'; retry.textContent = en ? 'Try again' : 'Повторить'; retry.addEventListener('click', () => { retry.disabled = true; load().catch(() => {}); }); status.append(retry);
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) load().catch(() => {});
  }, { rootMargin: '900px 0px' }) : null;
  observer?.observe(section);
  window.mmLoadOS = load;
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-open-app-tab], [data-app-tab], #insights button, #insights input');
    if (!target || ready) return;
    event.preventDefault(); event.stopImmediatePropagation();
    load().then(() => target.click()).catch(() => {});
  }, true);
  section.addEventListener('focusin', () => { if (!ready && !document.getElementById('mm-os-load-error')) load().catch(() => {}); });
  if (location.hash === '#app-ecosystem' || location.hash === '#insights' || !observer) load().catch(() => {});
})();
