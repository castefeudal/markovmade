/* No decoder or frame bank is allocated on touch, reduced motion or Save-Data. */
(function () {
  const media = document.querySelector('.mm-hero-media');
  if (!media) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let loaded = false;
  function sync() {
    // connection is absent in Firefox/Safari. Passing undefined as toggle's
    // optional force toggles the class on instead of explicitly removing it.
    const staticMode = Boolean(motion.matches || !fine.matches || navigator.connection?.saveData);
    media.classList.toggle('mm-static-poster', staticMode);
    if (staticMode || loaded) return;
    loaded = true;
    const script = document.createElement('script');
    script.src = 'assets/js/hero-media.js';
    script.onerror = () => media.classList.add('mm-video-error');
    document.body.appendChild(script);
  }
  motion.addEventListener('change', sync);
  fine.addEventListener('change', sync);
  if (document.readyState === 'complete') sync();
  else addEventListener('load', sync, { once: true });
})();
