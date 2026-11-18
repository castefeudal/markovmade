(function () {
  'use strict';
  const en = new URLSearchParams(location.search).get('lang') === 'en';
  const copy = (ru, english) => en ? english : ru;
  const download = document.getElementById('download');
  const status = document.getElementById('status');
  const install = document.getElementById('install');
  const ready = () => {
    download.textContent = copy('Обновить офлайн-копию', 'Update offline copy');
    status.textContent = copy('Готово. LAB и Personal OS доступны офлайн на этом устройстве.', 'Ready. LAB and Personal OS are available offline on this device.');
  };
  if (en) {
    document.documentElement.lang = 'en';
    const labels = {
      home: 'Back to site', language: 'Русский', title: 'MARKOVMADE offline',
      description: 'Save the app on this device to use LAB and Personal OS without internet access. Sending messages requires an internet connection.',
      download: 'Download for offline use', install: 'Install app',
      'install-note': 'After downloading, you can install the app from your browser menu if supported.'
    };
    for (const [id, label] of Object.entries(labels)) document.getElementById(id).textContent = label;
    const language = document.getElementById('language');
    language.href = '?lang=ru';
    language.lang = 'ru';
    document.getElementById('home').href = './?lang=en';
  }
  if (!('serviceWorker' in navigator)) {
    download.disabled = true;
    status.textContent = copy('Этот браузер не поддерживает офлайн-режим.', 'This browser does not support offline mode.');
    return;
  }
  let installPrompt;
  addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    install.hidden = false;
  });
  install.addEventListener('click', async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    installPrompt = null;
    install.hidden = true;
  });
  navigator.serviceWorker.getRegistration().then(registration => { if (registration?.active) ready(); }).catch(() => {});
  download.addEventListener('click', async () => {
    download.disabled = true;
    status.textContent = copy('Загружаю приложение…', 'Downloading the app…');
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      await registration.update();
      const worker = registration.installing;
      if (worker && worker.state !== 'installed' && worker.state !== 'activated') {
        await new Promise((resolve, reject) => {
          function stateChanged() {
            if (['installed', 'activated', 'redundant'].includes(worker.state)) {
              worker.removeEventListener('statechange', stateChanged);
              if (worker.state === 'redundant') reject(new Error('Offline download failed'));
              else resolve();
            }
          }
          worker.addEventListener('statechange', stateChanged);
          stateChanged();
        });
      }
      if (!registration.active && !registration.waiting && !registration.installing) throw new Error('Offline worker unavailable');
      await navigator.serviceWorker.ready;
      ready();
      if (registration.waiting) status.textContent += copy(' Обновление вступит в силу после закрытия всех вкладок MARKOVMADE.', ' The update will take effect after all MARKOVMADE tabs are closed.');
    } catch {
      status.textContent = copy('Загрузка не завершилась. Проверьте интернет и свободное место, затем повторите.', 'The download did not finish. Check your connection and available storage, then try again.');
    } finally {
      download.disabled = false;
    }
  });
})();
