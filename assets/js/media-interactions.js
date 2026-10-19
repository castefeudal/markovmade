(function(){
    function initPhotoColorInteraction(){
        var targets = Array.prototype.slice.call(document.querySelectorAll('main img, .hero-visual-premium img'));
        if (!targets.length) return;
        function pulse(img){
            if (!img || document.body.classList.contains('theme-light')) return;
            img.classList.add('mm-img-color');
            clearTimeout(img.__mmColorTimer);
            img.__mmColorTimer = setTimeout(function(){ img.classList.remove('mm-img-color'); }, 2400);
        }
        targets.forEach(function(img){
            if (img.__mmColorReady) return;
            img.__mmColorReady = true;
            img.addEventListener('touchstart', function(){ pulse(img); }, { passive: true });
            img.addEventListener('click', function(){ pulse(img); }, true);
            img.addEventListener('focus', function(){ pulse(img); }, true);
        });
        var hero = document.getElementById('hero');
        if (hero && !hero.__mmHeroColorReady) {
            hero.__mmHeroColorReady = true;
            hero.addEventListener('touchstart', function(){
                var img = hero.querySelector('.hero-visual-premium img');
                pulse(img);
            }, { passive: true });
            hero.addEventListener('click', function(){
                var img = hero.querySelector('.hero-visual-premium img');
                pulse(img);
            }, true);
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPhotoColorInteraction, { once: true });
    else initPhotoColorInteraction();
    window.addEventListener('load', initPhotoColorInteraction, { once: true });
})();


(function(){
    function initLogoFallback(){
        var link = document.querySelector('#main-header a[href="#hero"]');
        var img = link && link.querySelector('img');
        if (!link || !img) return;
        function fallback(){ link.classList.add('mm-logo-fallback'); }
        function restore(){ if (img.naturalWidth > 4) link.classList.remove('mm-logo-fallback'); }
        img.addEventListener('error', fallback, { once: true });
        img.addEventListener('load', restore, { once: true });
        setTimeout(function(){ if (!img.complete || img.naturalWidth < 5) fallback(); }, 1800);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLogoFallback, { once: true });
    else initLogoFallback();
})();

/* Finite editorial motion: content is readable before enhancement, and no
   scroll-linked loop, hidden reveal state or layout measurement is required. */
(function () {
    'use strict';
    var preference = matchMedia('(prefers-reduced-motion: reduce)');
    var active = new Map();
    function stop() { active.forEach(function (animation) { animation.cancel(); }); active.clear(); }
    function reveal(node, distance, duration) {
        if (!node || preference.matches || document.hidden || !node.animate) return;
        if (active.has(node)) active.get(node).cancel();
        var animation = node.animate([
            { opacity: .58, transform: 'translate3d(0,' + distance + 'px,0)' },
            { opacity: 1, transform: 'translate3d(0,0,0)' }
        ], { duration: duration, easing: 'cubic-bezier(.16,1,.3,1)' });
        active.set(node, animation);
        animation.finished.catch(function () {}).then(function () { if (active.get(node) === animation) active.delete(node); });
    }
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                observer.unobserve(entry.target);
                // Never animate content above the reader after late runtime loading.
                if (entry.boundingClientRect.top < 72) return;
                reveal(entry.target, 16, 560);
            });
        }, { threshold: .12, rootMargin: '0px 0px -24px 0px' });
        document.querySelectorAll('#proof-system .mm-trust-card, .mm-editorial-head, .mm-community-head, #method-proof .mm-editorial-step, #about .mm-author-purpose, #community .mm-community-card').forEach(function (node) { observer.observe(node); });
    }
    document.addEventListener('toggle', function (event) {
        if (!(event.target instanceof HTMLDetailsElement) || !event.target.open) return;
        var content = event.target.querySelector(':scope > .mm-service-editorial-body, :scope > .mm-timeline-content, :scope > .mm-progress-workspace');
        reveal(content, 8, 360);
    }, true);
    document.addEventListener('click', function (event) {
        var tab = event.target.closest('[data-mm-lab-tab]');
        if (!tab) return;
        requestAnimationFrame(function () {
            var panel = document.querySelector('[data-mm-lab-panel="' + tab.dataset.mmLabTab + '"]');
            if (panel && !panel.hidden) reveal(panel, 6, 260);
        });
    });
    preference.addEventListener('change', stop);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
    addEventListener('pagehide', stop, { once: true });
})();
