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
