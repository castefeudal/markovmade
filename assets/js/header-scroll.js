/* Keep the compact header available on upward reading and out of the way on descent. */
(function () {
  'use strict';
  const header = document.getElementById('main-header');
  if (!header) return;

  let lastY = 0, hasPosition = false, direction = 'up', frame = 0;

  function update() {
    frame = 0;
    const y = window.scrollY;
    if (y <= 0) {
      lastY = 0;
      hasPosition = true;
      direction = 'up';
      header.removeAttribute('data-mm-scroll-hidden');
      return;
    }
    if (hasPosition) {
      if (y > lastY + 2) direction = 'down';
      else if (y < lastY - 2) direction = 'up';
    } else direction = y > 200 ? 'down' : 'up';
    lastY = y;
    hasPosition = true;
    header.toggleAttribute('data-mm-scroll-hidden', y > 200 && direction === 'down' && !header.contains(document.activeElement) && !document.body.classList.contains('menu-open'));
  }

  window.addEventListener('scroll', function () {
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
  header.addEventListener('focusin', function () { header.removeAttribute('data-mm-scroll-hidden'); });
  if (window.scrollY > 0) frame = requestAnimationFrame(update);
})();
