/* Load calculators once. Early keyboard, pointer and deep-link entry await the
   same promise; original fields and localStorage remain owned by lab-runtime. */
(function () {
  let pending, ready = false;
  const section = document.getElementById('calculators');
  if (!section) return;
  const scripts = new Map();
  function loadScript(name) {
    if (scripts.has(name)) return scripts.get(name);
    const task = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'assets/js/' + name + '.js';
      script.onload = resolve;
      script.onerror = () => { scripts.delete(name); script.remove(); reject(new Error('Cannot load ' + name)); };
      document.body.appendChild(script);
    });
    scripts.set(name, task);
    return task;
  }
  function load() {
    if (pending) return pending;
    pending = (async () => {
      const host = section.querySelector('[data-component="lab"]');
      await Promise.all([
        window.mmLoadStyles?.(),
        host && !host.dataset.hydrated ? fetch('assets/dist/lab.html').then(response => {
          if (!response.ok) throw new Error('LAB markup could not load');
          return response.text();
        }).then(html => { host.innerHTML = html; host.dataset.hydrated = 'true'; host.removeAttribute('aria-busy'); host.classList.add('visible'); }) : Promise.resolve()
      ]);
      await Promise.all([loadScript('lab-models'), loadScript('dynamic-copy')]);
      await loadScript('lab-runtime');
      await Promise.all([loadScript('lab-history'), loadScript('lab-dashboard')]);
      await window.mmTranslate?.(section);
      ready = true;
      document.getElementById('mm-lab-load-error')?.remove();
      observer?.disconnect();
    })().catch(error => { pending = null; throw error; });
    return pending;
  }
  window.mmLoadLab = load;
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) load().catch(showFailure);
  }, { rootMargin: '900px 0px' }) : null;
  function showFailure() {
    observer?.disconnect();
    let status = document.getElementById('mm-lab-load-error');
    if (!status) { status = document.createElement('div'); status.id = 'mm-lab-load-error'; status.className = 'mm-component-loading'; status.setAttribute('role','alert'); section.querySelector('.mm-lab-intro').after(status); }
    const en = document.documentElement.lang === 'en';
    status.replaceChildren(document.createTextNode(en ? 'Could not load the LAB. ' : 'LAB не загрузился. '));
    const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'mm-secondary-cta'; retry.dataset.retryLab = ''; retry.textContent = en ? 'Try again' : 'Повторить'; status.append(retry);
  }
  observer?.observe(section);
  if (location.hash.startsWith('#lab') || location.hash === '#calculators' || !observer) load().catch(showFailure);
  document.addEventListener('pointerdown', event => {
    if (event.target.closest('a[href="#calculators"]')) load().catch(showFailure);
  }, { passive: true });
  section.addEventListener('focusin', () => { if (!ready && !document.getElementById('mm-lab-load-error')) load().catch(showFailure); });
  section.addEventListener('click', event => {
    if (ready || !event.target.closest('button')) return;
    const button = event.target.closest('button');
    event.preventDefault(); event.stopImmediatePropagation();
    if (button.hasAttribute('data-retry-lab')) { button.disabled = true; load().catch(showFailure); return; }
    load().then(() => button.click()).catch(showFailure);
  }, true);
  section.addEventListener('submit', event => {
    if (ready) return;
    event.preventDefault(); event.stopImmediatePropagation();
    load().then(() => event.target.requestSubmit()).catch(showFailure);
  }, true);
})();
