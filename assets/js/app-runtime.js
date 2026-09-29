// --- ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ ---
    function toggleTheme() {
        const body = document.body;
        body.classList.add('theme-transition');
        body.classList.toggle('theme-light');
        body.classList.remove('theme-soft');
        const isLight = body.classList.contains('theme-light');
        try { localStorage.setItem('markov-theme', isLight ? 'light' : 'deep'); } catch (e) {}
        const metaThemeColor = document.getElementById('theme-color-meta');
        if (metaThemeColor) metaThemeColor.setAttribute('content', isLight ? '#F8F5EE' : '#050505');
        setTimeout(() => body.classList.remove('theme-transition'), 500);
    }

    try {
        if (localStorage.getItem('markov-theme') === 'light') {
            document.body.classList.add('theme-light');
            document.body.classList.remove('theme-soft');
            const metaThemeColor = document.getElementById('theme-color-meta');
            if (metaThemeColor) metaThemeColor.setAttribute('content', '#F8F5EE');
        }
    } catch (e) {}

    // --- УПРАВЛЕНИЕ ПОЛИТИКОЙ И АККОРДЕОНОМ ---
    let privacyReturnFocus = null;
    window.togglePrivacy = function() {
        const modal = document.getElementById('privacy-modal');
        const isHidden = modal.classList.contains('hidden');
        if (isHidden) {
            privacyReturnFocus = document.activeElement;
            modal.classList.remove('hidden'); modal.classList.add('flex');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            const first = modal.querySelector('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            (first || modal).focus();
        } else {
            modal.classList.add('hidden'); modal.classList.remove('flex');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if (privacyReturnFocus && privacyReturnFocus.isConnected) privacyReturnFocus.focus();
        }
    }
    document.addEventListener('keydown', event => {
        const modal = document.getElementById('privacy-modal');
        if (!modal || modal.classList.contains('hidden')) return;
        if (event.key === 'Escape') { event.preventDefault(); window.togglePrivacy(); return; }
        if (event.key !== 'Tab') return;
        const focusable = Array.from(modal.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => !el.disabled && el.offsetParent !== null);
        if (!focusable.length) { event.preventDefault(); modal.focus(); return; }
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    window.toggleAccordion = function(btn) {
        const content = btn.nextElementSibling;
        const icon = btn.querySelector('.rotate-icon');
        document.querySelectorAll('.accordion-content').forEach(c => {
            if(c !== content && c.classList.contains('open')) {
                c.classList.remove('open'); c.previousElementSibling.querySelector('.rotate-icon').classList.remove('open');
                c.setAttribute('aria-hidden', 'true');
                c.previousElementSibling.setAttribute('aria-expanded', 'false');
            }
        });
        content.classList.toggle('open'); icon.classList.toggle('open');
        const isOpen = content.classList.contains('open');
        content.setAttribute('aria-hidden', String(!isOpen));
        btn.setAttribute('aria-controls', content.id);
        btn.setAttribute('aria-expanded', String(isOpen));
    }

    document.querySelectorAll('button[onclick="toggleAccordion(this)"]').forEach(btn => {
        const content = btn.nextElementSibling;
        if (!content || !content.classList.contains('accordion-content')) return;
        btn.setAttribute('aria-controls', content.id);
        btn.setAttribute('aria-expanded', String(content.classList.contains('open')));
        content.setAttribute('aria-hidden', String(!content.classList.contains('open')));
    });

    window.toggleEvolution = function(btn) {
        const content = btn.nextElementSibling;
        if (!content) return;
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        document.querySelectorAll('.evolution-content.open').forEach(item => {
            if (item !== content) {
                item.classList.remove('open');
                item.hidden = true;
                const prev = item.previousElementSibling;
                if (prev) prev.setAttribute('aria-expanded', 'false');
            }
        });
        btn.setAttribute('aria-expanded', String(!isOpen));
        content.hidden = isOpen;
        content.classList.toggle('open', !isOpen);
        setTimeout(updateLayoutMetrics, 120);
    }

    // --- ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ И СКРОЛЛ ---
    document.addEventListener('DOMContentLoaded', () => {
        // RELIABILITY MODE: нативный scroll вместо Lenis.
        // Причина: сайт должен стабильно прокручиваться как локальный single-file HTML,
        // даже если CDN, preload, браузерные политики или расширения ведут себя нестабильно.
        const lenis = {
            raf: () => {},
            stop: () => {},
            start: () => {},
            on: (eventName, callback) => {
                if (eventName === 'scroll' && typeof callback === 'function') {
                    window.addEventListener('scroll', () => callback({ scroll: window.scrollY }), { passive: true });
                }
            },
            scrollTo: (target) => {
                const top = typeof target === 'number'
                    ? target
                    : (target && target.getBoundingClientRect ? target.getBoundingClientRect().top + window.scrollY : 0);
                window.scrollTo({ top, behavior: 'smooth' });
            }
        };

        // PRELOADER: не зависит жёстко от window.load, поэтому сайт не зависает из-за внешних изображений/CDN
        const preloader = document.getElementById('preloader');
        const countEl = document.getElementById('preloader-count');
        const textEl = document.getElementById('preloader-text');
        const mainContent = document.getElementById('main-content');
        const quotes = ["Я тут. Сейчас. С вами", "Тишина громче слов.", "Создавая наследие.", "MARKOVMADE"];
        let count = 0;
        let pageLoaded = document.readyState === 'complete';
        let preloaderFinished = false;
        let quoteIndex = 0;
        document.body.classList.remove('loading');
        try { lenis.start(); } catch (e) {}

        function finishPreloader() {
            if (preloaderFinished) return;
            preloaderFinished = true;
            if (typeof preloaderInterval !== 'undefined') clearInterval(preloaderInterval);
            if (countEl) countEl.innerText = '100%';
            if (preloader) {
                preloader.style.transform = 'translateY(-100%)';
                preloader.setAttribute('aria-hidden', 'true');
                preloader.style.pointerEvents = 'none';
            }
            if (mainContent) mainContent.classList.remove('opacity-0');
            document.body.classList.remove('loading');
            lenis.start();
            if (typeof updateLayoutMetrics === 'function') updateLayoutMetrics();
            if (typeof initScrollObserver === 'function') initScrollObserver();
            setTimeout(() => {
                if (preloader) preloader.style.display = 'none';
            }, 1400);
        }

        window.addEventListener('load', () => {
            pageLoaded = true;
            if (count >= 70) setTimeout(finishPreloader, 250);
        }, { once: true });

        const preloaderInterval = setInterval(() => {
            count = Math.min(100, count + (pageLoaded ? 4 : 2));
            if (countEl) countEl.innerText = count + '%';

            const nextQuoteIndex = count >= 90 ? 3 : count >= 60 ? 2 : count >= 30 ? 1 : 0;
            if (nextQuoteIndex > quoteIndex) {
                quoteIndex = nextQuoteIndex;
                switchQuote(quoteIndex);
            }

            if (count >= 100 || (pageLoaded && count >= 70)) {
                setTimeout(finishPreloader, 250);
            }
        }, 24);

        // Жёсткая страховка: если какой-то внешний ресурс завис, сайт всё равно открывается.
        setTimeout(finishPreloader, 1800);

        function switchQuote(i) {
            if (!textEl || !quotes[i]) return;
            textEl.style.opacity = 0;
            textEl.style.transform = 'translateY(15px)';
            setTimeout(() => {
                textEl.innerText = quotes[i];
                textEl.style.opacity = 1;
                textEl.style.transform = 'translateY(0)';
            }, 300);
        }

        // ХЕДЕР И ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ
        const header = document.getElementById('main-header');
        const bioSection = document.getElementById('biography');
        const bioTrack = document.getElementById('bio-track');
        const floatCta = document.getElementById('floating-cta');
        let metrics = { isDesktop: window.innerWidth > 768, bioTop: 0, bioHeight: 0, bioScrollDist: 0, trackScrollWidth: 0, windowHeight: window.innerHeight, windowWidth: window.innerWidth, slideCount: 0 };

        function updateLayoutMetrics() {
            metrics.isDesktop = window.innerWidth > 768; metrics.windowHeight = window.innerHeight; metrics.windowWidth = window.innerWidth;
            metrics.slideCount = document.querySelectorAll('.slide').length;
            if (metrics.isDesktop && bioSection && bioTrack) {
                metrics.trackScrollWidth = bioTrack.scrollWidth;
                const scrollLength = metrics.trackScrollWidth - metrics.windowWidth;
                const totalHeight = scrollLength + metrics.windowHeight;
                bioSection.style.height = `${totalHeight}px`;
                metrics.bioTop = bioSection.offsetTop; metrics.bioHeight = totalHeight; metrics.bioScrollDist = scrollLength;
            } else {
                if(bioSection) bioSection.style.height = 'auto';
                if(bioTrack) { bioTrack.style.position = ''; bioTrack.style.top = ''; bioTrack.style.left = ''; bioTrack.style.transform = ''; }
            }
        }
        window.addEventListener('resize', updateLayoutMetrics);

        let headerTimeout; let snapTimeout;
        let lastScrollY = window.scrollY;

        function toggleHeaderAndCTA(hideHeader) {
            if (!header) return;
            if (hideHeader && window.scrollY > 200) {
                header.classList.add('scrolled-down'); header.classList.remove('scrolled-up');
                if (floatCta) floatCta.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
            } else {
                header.classList.remove('scrolled-down'); header.classList.add('scrolled-up');
                if (floatCta) floatCta.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
            }
        }

        function updateScrollVisibility() {
            const currentScrollY = window.scrollY;

            if (currentScrollY > 50) {
                if (currentScrollY < lastScrollY - 2) {
                    toggleHeaderAndCTA(false);
                    clearTimeout(headerTimeout);
                    headerTimeout = setTimeout(() => {
                        if (window.scrollY > 50 && !document.body.classList.contains('menu-open')) {
                            toggleHeaderAndCTA(true);
                        }
                    }, 3000);
                } else if (currentScrollY > lastScrollY + 2) {
                    if (!document.body.classList.contains('menu-open')) {
                        toggleHeaderAndCTA(true);
                        clearTimeout(headerTimeout);
                    }
                }
            } else {
                toggleHeaderAndCTA(false);
            }

            lastScrollY = currentScrollY;
        }

        window.addEventListener('scroll', updateScrollVisibility, { passive: true });

        lenis.on('scroll', (e) => {
            const scrollY = e.scroll;
            updateScrollVisibility();

            if (metrics.isDesktop && metrics.bioScrollDist > 0) {
                const relativeScroll = scrollY - metrics.bioTop;
                if (relativeScroll >= 0 && relativeScroll <= metrics.bioScrollDist) {
                    const progress = relativeScroll / metrics.bioScrollDist;
                    const moveX = progress * (metrics.trackScrollWidth - metrics.windowWidth);
                    bioTrack.style.position = 'fixed'; bioTrack.style.top = '0'; bioTrack.style.left = '0'; bioTrack.style.width = '100%'; bioTrack.style.height = '100vh'; bioTrack.style.zIndex = '10';
                    bioTrack.style.transform = `translate3d(${-moveX}px, 0, 0)`;

                    clearTimeout(snapTimeout);
                    snapTimeout = setTimeout(() => {
                        const step = 1 / (metrics.slideCount - 1);
                        const nearestIndex = Math.round(progress / step);
                        const targetScrollY = metrics.bioTop + ((nearestIndex * step) * metrics.bioScrollDist);
                        if (Math.abs(window.scrollY - targetScrollY) > 5) {
                            lenis.scrollTo(targetScrollY, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 3) });
                        }
                    }, 150);
                } else if (relativeScroll < 0) {
                    bioTrack.style.position = 'relative'; bioTrack.style.transform = `translate3d(0px, 0, 0)`; clearTimeout(snapTimeout);
                } else {
                    const maxMove = metrics.trackScrollWidth - metrics.windowWidth;
                    bioTrack.style.position = 'absolute'; bioTrack.style.top = 'auto'; bioTrack.style.bottom = '0';
                    bioTrack.style.transform = `translate3d(${-maxMove}px, 0, 0)`; clearTimeout(snapTimeout);
                }
            }
        });

        // Interactive
        const interactiveBtns = document.querySelectorAll('.mm-magnetic-disabled');
        if (!('ontouchstart' in window)) {
            interactiveBtns.forEach(btn => {
                btn.addEventListener('mousemove', function(e) {
                    const pos = btn.getBoundingClientRect();
                    const x = e.clientX - pos.left - pos.width / 2; const y = e.clientY - pos.top - pos.height / 2;
                    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
                });
                btn.addEventListener('mouseleave', function() { btn.style.transform = 'translate(0px, 0px)'; });
            });
            const cursor = document.getElementById('cursor');
            if (cursor) {
                document.addEventListener('mousemove', e => { cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px'; });
                document.addEventListener('mouseover', e => {
                    if (e.target.closest('a, button, .interactive, .luxury-input-number, .psycho-input')) cursor.classList.add('hovered');
                    else cursor.classList.remove('hovered');
                });
            }
        }

        // Мобильное меню
        const menu = document.getElementById('mobile-menu');
        window.toggleMenu = function() {
            if (!menu) return;
            menu.classList.toggle('translate-x-full');
            document.body.classList.toggle('menu-open', !menu.classList.contains('translate-x-full'));
            document.body.style.overflow = '';
            if (!menu.classList.contains('translate-x-full')) {
                menu.querySelectorAll('a').forEach((link, idx) => {
                    link.style.opacity = '0'; link.style.transform = 'translateY(20px)';
                    setTimeout(() => { link.style.transition = 'all 0.5s ease'; link.style.opacity = '1'; link.style.transform = 'translateY(0)'; }, 100 + (idx * 50));
                });
            }
        }

        function initScrollObserver() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
            }, { threshold: 0.1 });
            document.querySelectorAll('.reveal-text, .fade-in-up').forEach(el => observer.observe(el));
        }

        // Инсайты
        if (window.innerWidth > 1024) {
            const insightGhost = document.getElementById('insight-ghost');
            const insightText = document.getElementById('insight-text');
            const insightSections = document.querySelectorAll('[data-insight]');
            let hideTimeout;
            if (insightGhost && insightText && insightSections.length > 0) {
                const insightObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const text = entry.target.getAttribute('data-insight');
                            if (text) {
                                insightText.textContent = text; insightGhost.classList.add('active');
                                if (hideTimeout) clearTimeout(hideTimeout);
                                hideTimeout = setTimeout(() => { insightGhost.classList.remove('active'); }, 4000);
                            }
                        }
                    });
                }, { rootMargin: "-50% 0px -50% 0px", threshold: 0 });
                insightSections.forEach(section => insightObserver.observe(section));
            }
        }

        // Форма заявки MARKOVMADE: без backend, с Telegram / WhatsApp / копированием.
        const formEl = document.getElementById('manifest-form');
        const leadState = { text: '', id: '' };
        const leadRead = (id) => {
            const el = document.getElementById(id);
            if (!el) return '—';
            const value = (el.value || '').trim();
            return value || '—';
        };
        const leadSelected = (id) => {
            const el = document.getElementById(id);
            if (!el) return '—';
            if (el.selectedOptions && el.selectedOptions[0]) return (el.selectedOptions[0].textContent || '').trim() || '—';
            return leadRead(id);
        };
        const leadCopy = async (text) => {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (e) {
                const area = document.createElement('textarea');
                area.value = text;
                area.setAttribute('readonly', '');
                area.style.position = 'fixed';
                area.style.opacity = '0';
                document.body.appendChild(area);
                area.select();
                const ok = document.execCommand('copy');
                area.remove();
                return ok;
            }
        };
        const leadBuildMessage = (id) => {
            const en = document.documentElement.lang === 'en' || window.mmSafeStorage.get('markovmade_lang', 'ru') === 'en';
            const calcResults = Object.values(mmCalcSummaries || {}).filter(Boolean).map(item => {
                return (en && window.__mmDynamicTranslate) ? window.__mmDynamicTranslate(item) : item;
            });
            const calcText = calcResults.length ? calcResults.join('\n\n---\n\n') : (en ? 'No calculator results yet / I want a manual assessment.' : 'Расчёты пока не отправлял / хочу разобрать вручную.');
            if (en) {
                return [
                    'Hello, Pavel. I want a MARKOVMADE personal assessment.',
                    '',
                    `Request ID: ${id}`,
                    `Name / contact: ${leadRead('name')}`,
                    `Goal: ${leadRead('goal')}`,
                    `Height: ${leadRead('height')} cm`,
                    `Weight: ${leadRead('weight')} kg`,
                    `Age: ${leadRead('age')}`,
                    `Training experience: ${leadSelected('experience')}`,
                    `Limitations / injuries / context: ${leadRead('limitations')}`,
                    `Main blocker: ${leadRead('problem')}`,
                    `Preferred format: ${leadSelected('format')}`,
                    `Best contact channel: ${leadSelected('contact-pref')}`,
                    `Comment: ${leadRead('value')}`,
                    '',
                    'Calculator results:',
                    calcText,
                    '',
                    'I want to understand where to start, what to control and which work format fits me.'
                ].join('\n');
            }
            return [
                'Здравствуйте, Павел. Хочу персональный разбор MARKOVMADE.',
                '',
                `ID заявки: ${id}`,
                `Имя / контакт: ${leadRead('name')}`,
                `Цель: ${leadRead('goal')}`,
                `Рост: ${leadRead('height')} см`,
                `Вес: ${leadRead('weight')} кг`,
                `Возраст: ${leadRead('age')}`,
                `Опыт тренировок: ${leadSelected('experience')}`,
                `Ограничения / травмы / нюансы: ${leadRead('limitations')}`,
                `Главный стопор: ${leadRead('problem')}`,
                `Желаемый формат: ${leadSelected('format')}`,
                `Куда удобнее ответить: ${leadSelected('contact-pref')}`,
                `Комментарий: ${leadRead('value')}`,
                '',
                'Результаты расчёта:',
                calcText,
                '',
                'Хочу понять, с чего начать, что контролировать и какой формат работы мне подходит.'
            ].join('\n');
        };
        if (formEl) {
            formEl.addEventListener('submit', function(e) {
                e.preventDefault();
                const errorEl = document.getElementById('lead-form-error');
                const requiredIds = ['name', 'goal', 'problem'];
                const missing = requiredIds.filter(id => !leadRead(id) || leadRead(id) === '—');
                if (missing.length) {
                    if (errorEl) errorEl.textContent = (document.documentElement.lang === 'en' || window.mmSafeStorage.get('markovmade_lang', 'ru') === 'en') ? 'Fill in name/contact, goal and main blocker — enough for a precise first reply.' : 'Заполните имя / контакт, цель и главный стопор — этого достаточно для точного первого ответа.';
                    const first = document.getElementById(missing[0]);
                    if (first) first.focus();
                    return;
                }
                if (errorEl) errorEl.textContent = '';
                const name = leadRead('name');
                const nameInitial = name.trim().charAt(0).toUpperCase() || 'X';
                const today = new Date();
                const dateStr = String(today.getDate()).padStart(2, '0') + String(today.getMonth() + 1).padStart(2, '0');
                const randNum = Math.floor(1000 + Math.random() * 9000);
                const uniqueId = `${nameInitial}-${dateStr}-${randNum}`;
                leadState.id = uniqueId;
                leadState.text = leadBuildMessage(uniqueId);
                const cardWrapper = document.getElementById('access-card');
                const cardId = document.getElementById('card-id');
                if (cardId) cardId.innerText = uniqueId;
                formEl.style.transform = 'scaleY(0.01) scaleX(1)';
                formEl.style.opacity = '0';
                setTimeout(() => {
                    formEl.style.display = 'none';
                    if (cardWrapper) { cardWrapper.classList.remove('hidden'); cardWrapper.classList.add('flex'); }
                }, 450);
            });
            const telegramBtn = document.getElementById('telegram-btn');
            const whatsappBtn = document.getElementById('whatsapp-btn');
            const copyBtn = document.getElementById('copy-application-btn');
            const backBtn = document.getElementById('back-to-form-btn');
            const statusEl = document.getElementById('lead-copy-status');
            if (telegramBtn) telegramBtn.addEventListener('click', () => {
                const text = leadState.text || leadBuildMessage(leadState.id || 'GEN-000');
                if(window.mmTrack) window.mmTrack('lead_telegram_click',{source:'form'});
                window.open('https://t.me/markovmade?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
            });
            if (whatsappBtn) whatsappBtn.addEventListener('click', () => {
                const text = leadState.text || leadBuildMessage(leadState.id || 'GEN-000');
                if(window.mmTrack) window.mmTrack('lead_whatsapp_click',{source:'form'});
                window.open('https://wa.me/79819722516?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
            });
            if (copyBtn) copyBtn.addEventListener('click', async () => {
                const text = leadState.text || leadBuildMessage(leadState.id || 'GEN-000');
                if(window.mmTrack) window.mmTrack('lead_copy_click',{source:'form'});
                const ok = await leadCopy(text);
                if (statusEl) { const en = document.documentElement.lang === 'en' || window.mmSafeStorage.get('markovmade_lang', 'ru') === 'en'; statusEl.textContent = ok ? (en ? 'Request copied.' : 'Заявка скопирована.') : (en ? 'Could not copy automatically. Select the text manually.' : 'Не удалось скопировать автоматически. Выделите текст вручную.'); }
            });
            if (backBtn) backBtn.addEventListener('click', () => {
                const cardWrapper = document.getElementById('access-card');
                if (cardWrapper) { cardWrapper.classList.add('hidden'); cardWrapper.classList.remove('flex'); }
                formEl.style.display = '';
                requestAnimationFrame(() => {
                    formEl.style.transform = '';
                    formEl.style.opacity = '1';
                });
            });
        }

        // Частицы пыли
        const canvas = document.getElementById('gold-dust');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            let particlesArray = [];
            const numberOfParticles = window.innerWidth < 768 ? 30 : 60;
            function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
            resizeCanvas();
            class Particle {
                constructor() {
                    this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
                    this.size = Math.random() * 2; this.speedX = Math.random() * 0.2 - 0.1; this.speedY = Math.random() * 0.2 - 0.1;
                    this.opacity = Math.random() * 0.5 + 0.2;
                }
                update() {
                    this.x += this.speedX; this.y += this.speedY;
                    if (this.size > 0.2) this.size -= 0.003;
                    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
                }
                draw() {
                    const goldRgb = getComputedStyle(document.body).getPropertyValue('--color-gold').trim().replace(/\s+/g, ',') || '212,175,55'; ctx.fillStyle = `rgba(${goldRgb}, ${this.opacity})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
                }
            }
            function initParticles() { particlesArray = []; for (let i = 0; i < numberOfParticles; i++) particlesArray.push(new Particle()); }
            function animateParticles() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < particlesArray.length; i++) {
                    particlesArray[i].update(); particlesArray[i].draw();
                    if (particlesArray[i].size <= 0.2) { particlesArray.splice(i, 1); particlesArray.push(new Particle()); }
                }
                requestAnimationFrame(animateParticles);
            }
            initParticles(); animateParticles();
            window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });
        }


        // === MARKOVMADE LAB / calculator-only runtime ===
        const mmCalcSummaries = { body: '', nutrition: '', overfeeding: '', recovery: '', progress: '', strategy: '', growth: '', format: '' };

        (function initMarkovMadeLab(){
            const root = document.getElementById('calculators');
            if (!root) return;

            const STORAGE_KEY = 'markovmade-lab-v1';
            const MODEL_VERSIONS = Object.freeze({ body:'1.0.0', nutrition:'1.0.0', overfeeding:'1.0.0', recovery:'1.0.0', progress:'1.0.0', strategy:'1.0.0' });
            const K = Object.freeze({
                kcalPerKgFatEquivalent: 7700,
                navySee: 3.6,
                glycogenWaterLow: 2.7,
                glycogenWaterHigh: 4.0,
                tef: { protein:[0.20,0.25,0.30], carbs:[0.05,0.075,0.10], fat:[0.00,0.02,0.03], alcohol:[0.10,0.20,0.30] },
                walkingKcalKgKm: 0.50,
                stepLengthHeightRatio: 0.414,
                strengthMet: 5,
                mixedDietTef: 0.10
            });

            const emptyState = () => ({
                profile: { sex:'', age:null, height:null, weight:null, bodyFat:null },
                body: {}, nutrition: {}, overfeeding: {}, recovery: {}, progress: {}, strategy: {}
            });
            let state = emptyState();
            try {
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
                if (saved && typeof saved === 'object') state = Object.assign(emptyState(), saved, { profile:Object.assign(emptyState().profile, saved.profile || {}) });
            } catch(e) {}

            const $ = (sel, ctx=root) => ctx.querySelector(sel);
            const $$ = (sel, ctx=root) => Array.from(ctx.querySelectorAll(sel));
            const el = id => document.getElementById(id);
            const val = id => el(id) ? el(id).value : '';
            const number = id => {
                const v = String(val(id) || '').trim().replace(',', '.');
                if (!v) return NaN;
                const n = Number(v);
                return Number.isFinite(n) ? n : NaN;
            };
            const clamp = (v,min,max) => Math.min(max,Math.max(min,v));
            const round = (v,d=0) => { const p=Math.pow(10,d); return Number.isFinite(v) ? Math.round(v*p)/p : NaN; };
            const fmt = (v,d=0) => Number.isFinite(v) ? new Intl.NumberFormat('ru-RU',{maximumFractionDigits:d,minimumFractionDigits:d}).format(v) : '—';
            const kg = (v,d=1) => Number.isFinite(v) ? `${fmt(v,d)} кг` : '—';
            const kcal = v => Number.isFinite(v) ? `${fmt(Math.round(v),0)} ккал` : '—';
            const grams = (v,d=0) => Number.isFinite(v) ? `${fmt(v,d)} г` : '—';
            const pct = (v,d=1) => Number.isFinite(v) ? `${fmt(v,d)}%` : '—';
            const setText = (id, text) => { const n=el(id); if(n){ n.dataset.ruDynamicText=String(text == null ? '' : text); n.textContent=(typeof window.__mmDynamicTranslate==='function')?window.__mmDynamicTranslate(String(text==null?'':text)):String(text==null?'':text); } };
            const setHTMLSafeList = (id, items) => { const node=el(id); if(!node) return; node.innerHTML=''; items.forEach(t=>{ const li=document.createElement('li'); li.textContent=t; node.appendChild(li); }); };
            const finite = (...xs) => xs.every(Number.isFinite);
            const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {} };
            const currentMode = tool => (root.dataset['mode'+tool] || 'quick');
            const segmentValue = name => { const b=$(`[data-segment="${name}"] button[aria-pressed="true"]`); return b ? b.dataset.value : ''; };
            const setBadge = (tool, quality, confidence) => {
                const q=$(`[data-quality="${tool}"]`), c=$(`[data-confidence="${tool}"]`);
                if(q) q.textContent=`Полнота: ${quality}`;
                if(c) c.textContent=`Уверенность: ${confidence}`;
            };
            const error = (tool,msg='') => setText(`lab-${tool}-error`,msg);
            const display = (node, show) => { if(node) node.hidden=!show; };
            const safeRange = (value, min, max, label) => Number.isFinite(value) && value>=min && value<=max ? '' : `${label}: укажите значение от ${min} до ${max}.`;
            const profileNumber = key => Number(state.profile[key]);

            function localToday(){
                const d=new Date(), off=d.getTimezoneOffset()*60000;
                return new Date(d.getTime()-off).toISOString().slice(0,10);
            }
            if (el('lab-prog-end-date') && !el('lab-prog-end-date').value) el('lab-prog-end-date').value=localToday();

            function applyProfile(except){
                $$('[data-profile]').forEach(input=>{
                    if(input===except) return;
                    const key=input.dataset.profile;
                    const v=state.profile[key];
                    if(v!==null && v!==undefined && v!=='') input.value=String(v);
                });
                updateFemaleFields();
            }
            applyProfile();

            $$('[data-profile]').forEach(input=>{
                const sync=()=>{
                    const key=input.dataset.profile;
                    const raw=input.value;
                    state.profile[key] = key==='sex' ? raw : (raw==='' ? null : Number(String(raw).replace(',','.')));
                    applyProfile(input); save();
                };
                input.addEventListener('input',sync); input.addEventListener('change',sync);
            });

            function updateFemaleFields(){
                const sex=state.profile.sex || val('lab-body-sex');
                $$('[data-female-only]').forEach(n=>display(n, sex==='female' && segmentValue('body-bf-method')==='tape'));
            }

            // Tabs: one source of truth, independent from legacy calculator handlers.
            const tabs=$$('[data-mm-lab-tab]'), panels=$$('[data-mm-lab-panel]');
            function showTab(key, focusPanel=false){
                tabs.forEach(t=>{ const active=t.dataset.mmLabTab===key; t.setAttribute('aria-selected',active?'true':'false'); t.tabIndex=active?0:-1; });
                panels.forEach(p=>p.hidden=p.dataset.mmLabPanel!==key);
                if(focusPanel){ const p=$(`[data-mm-lab-panel="${key}"]`); if(p){ p.setAttribute('tabindex','-1'); p.focus({preventScroll:true}); } }
            }
            tabs.forEach((tab,i)=>{
                tab.id=`mm-lab-tab-${tab.dataset.mmLabTab}`;
                tab.addEventListener('click',()=>showTab(tab.dataset.mmLabTab));
                tab.addEventListener('keydown',e=>{
                    if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) return;
                    e.preventDefault(); let ni=i;
                    if(e.key==='ArrowRight') ni=(i+1)%tabs.length;
                    if(e.key==='ArrowLeft') ni=(i-1+tabs.length)%tabs.length;
                    if(e.key==='Home') ni=0; if(e.key==='End') ni=tabs.length-1;
                    tabs[ni].focus(); showTab(tabs[ni].dataset.mmLabTab);
                });
            });
            showTab('body');

            $$('[data-mode-switch]').forEach(wrap=>{
                const tool=wrap.dataset.modeSwitch;
                wrap.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
                    wrap.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b===btn?'true':'false'));
                    root.dataset['mode'+tool]=btn.dataset.mode;
                    $$(`[data-pro="${tool}"]`).forEach(n=>display(n,btn.dataset.mode==='pro'));
                }));
            });

            $$('[data-segment]').forEach(wrap=>wrap.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
                wrap.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b===btn?'true':'false'));
                handleSegment(wrap.dataset.segment,btn.dataset.value);
            })));
            function handleSegment(name,value){
                if(name==='body-bf-method'){
                    $$('[data-bf-known]').forEach(n=>display(n,value==='known'));
                    $$('[data-bf-tape]').forEach(n=>display(n,value==='tape'));
                    updateFemaleFields();
                }
                if(name==='nutri-maint-source') $$('[data-maint-measured]').forEach(n=>display(n,value==='measured'));
                if(name==='fat-maint-source'){
                    $$('[data-fat-maint-known]').forEach(n=>display(n,value==='known'));
                    $$('[data-fat-maint-auto]').forEach(n=>display(n,value==='auto'));
                }
                if(name==='fat-input-mode') $$('[data-fat-macros]').forEach(n=>display(n,value==='macros'));
            }
            handleSegment('body-bf-method',segmentValue('body-bf-method'));
            handleSegment('nutri-maint-source',segmentValue('nutri-maint-source'));
            handleSegment('fat-maint-source',segmentValue('fat-maint-source'));
            handleSegment('fat-input-mode',segmentValue('fat-input-mode'));

            el('lab-fat-comp')?.addEventListener('change',()=>display($('[data-fat-comp-custom]'),val('lab-fat-comp')==='custom'));

            function mifflin(sex,age,heightCm,weightKg){
                return 10*weightKg + 6.25*heightCm - 5*age + (sex==='male'?5:-161);
            }
            function tenHaaf(sex,age,heightCm,weightKg){
                return 29.279 + 11.936*weightKg + 587.728*(heightCm/100) - 8.129*age + 191.027*(sex==='male'?1:0);
            }
            function tenHaafFFM(ffm){ return 22.771*ffm + 484.264; }
            function navyBodyFat(sex,heightCm,waistCm,neckCm,hipsCm){
                const h=heightCm/2.54, w=waistCm/2.54, n=neckCm/2.54;
                if(sex==='male'){
                    if(!(w>n && h>0)) return NaN;
                    return 86.010*Math.log10(w-n)-70.041*Math.log10(h)+36.76;
                }
                const hip=hipsCm/2.54;
                if(!(w+hip>n && h>0)) return NaN;
                return 163.205*Math.log10(w+hip-n)-97.684*Math.log10(h)-78.387;
            }

            function calculateBody(){
                error('body');
                const sex=val('lab-body-sex'), age=number('lab-body-age'), h=number('lab-body-height'), w=number('lab-body-weight');
                if(!sex) return error('body','Выберите пол — он нужен для окружностной модели и интерпретации.'),null;
                for(const [v,min,max,label] of [[age,18,90,'Возраст'],[h,120,230,'Рост'],[w,35,300,'Вес']]){ const m=safeRange(v,min,max,label); if(m) return error('body',m),null; }
                const method=segmentValue('body-bf-method');
                let bf,bfLow,bfHigh,confidence='Умеренная',quality='Базовая',source='';
                const waist=number('lab-body-waist'), neck=number('lab-body-neck'), hips=number('lab-body-hips');
                if(method==='known'){
                    bf=number('lab-body-bf'); const m=safeRange(bf,3,60,'% жира'); if(m) return error('body',m),null;
                    bfLow=bf; bfHigh=bf; source='указанное пользователем значение';
                    quality=currentMode('body')==='pro'?'Хорошая':'Базовая';
                } else {
                    for(const [v,min,max,label] of [[waist,40,200,'Талия'],[neck,20,80,'Шея']]){ const m=safeRange(v,min,max,label); if(m) return error('body',m),null; }
                    if(sex==='female'){ const m=safeRange(hips,50,200,'Бёдра'); if(m) return error('body',m),null; }
                    if(sex==='male' && waist<=neck) return error('body','Талия должна быть больше окружности шеи для этой формулы. Проверьте точки измерения.'),null;
                    if(sex==='female' && waist+hips<=neck) return error('body','Проверьте окружности: сумма талии и бёдер должна быть больше окружности шеи.'),null;
                    bf=navyBodyFat(sex,h,waist,neck,hips);
                    if(!Number.isFinite(bf) || bf<2 || bf>65) return error('body','Формула получила нереалистичный результат. Проверьте единицы и места измерения.'),null;
                    bf=clamp(bf,3,60); bfLow=clamp(bf-K.navySee,3,60); bfHigh=clamp(bf+K.navySee,3,60);
                    source='окружностная модель Hodgdon/Beckett'; quality='Хорошая';
                }
                const fatMass=w*bf/100, lbm=w-fatMass, hm=h/100, ffmi=lbm/(hm*hm), nffmi=ffmi+6.3*(1.80-hm), bmi=w/(hm*hm);
                const whtr=Number.isFinite(waist)?waist/h:NaN;
                const targetBF=currentMode('body')==='pro'?number('lab-body-target-bf'):NaN;
                const goal=val('lab-body-goal')||'recomp', level=val('lab-body-level')||'intermediate';
                const targetWeight=Number.isFinite(targetBF)&&targetBF>0&&targetBF<60 ? lbm/(1-targetBF/100) : NaN;
                state.profile={sex,age,height:h,weight:w,bodyFat:round(bf,1)};
                state.body={modelVersion:MODEL_VERSIONS.body,bf,bfLow,bfHigh,fatMass,lbm,ffmi,nffmi,bmi,whtr,targetBF,targetWeight,source,goal,level}; save(); applyProfile();
                setText('lab-body-main',`${fmt(bf,1)}%`);
                setText('lab-body-range',method==='tape'?`Практически честнее читать как ≈ ${fmt(bfLow,1)}–${fmt(bfHigh,1)}%. Главная ошибка — точки и техника окружностных измерений.`:`Использовано ваше значение ${fmt(bf,1)}%. Диапазон не рассчитывается: метод измерения и его индивидуальная погрешность неизвестны.`);
                setText('lab-body-fatmass',kg(fatMass)); setText('lab-body-lbm',kg(lbm)); setText('lab-body-ffmi',fmt(ffmi,1)); setText('lab-body-nffmi',fmt(nffmi,1)); setText('lab-body-bmi',fmt(bmi,1)); setText('lab-body-whtr',Number.isFinite(whtr)?fmt(whtr,2):'—');
                let meaning=`При ${fmt(bf,1)}% жира из ${fmt(w,1)} кг примерно ${fmt(lbm,1)} кг приходится на безжировую массу. FFMI ${fmt(ffmi,1)} полезен как контекст мышечной массы, но наследует ошибку оценки % жира.`;
                if(goal==='cut' && ffmi>=22) meaning+=' При снижении жира ключевая задача — сохранять сухую массу и силовые, а не гнаться за максимальной скоростью снижения веса.';
                if(goal==='bulk' && bf>(sex==='male'?20:30)) meaning+=' При высокой жировой массе набор веса любой ценой обычно имеет худший ROI, чем сначала стабилизировать композицию тела.';
                setText('lab-body-meaning',`Что это значит: ${meaning}`);
                const actions=[];
                if(Number.isFinite(targetWeight)) actions.push(`При сохранении текущей LBM вес при ${fmt(targetBF,1)}% жира был бы ориентировочно ${fmt(targetWeight,1)} кг. Это сценарий, а не обещание.`);
                actions.push('Повторяйте % жира одним методом и в одинаковых условиях: тренд ценнее разового абсолютного числа.');
                actions.push(Number.isFinite(whtr)?`Талия/рост сейчас ${fmt(whtr,2)} — отслеживайте её вместе с весом и фото.`:'Добавьте талию при следующем замере: она делает интерпретацию изменения формы заметно полезнее.');
                setHTMLSafeList('lab-body-actions',actions);
                setText('lab-body-method',`Источник % жира: ${source}. LBM = вес × (1 − BF). FFMI = LBM / рост². Height-adjusted FFMI использует поправку Kouri 6,3 × (1,80 − рост); исходная нормализация была разработана на мужских атлетах, поэтому её нельзя трактовать как универсальный «лимит». Окружностная формула имеет стандартную ошибку порядка 3–4 п.п. в исходных валидациях.`);
                setBadge('body',quality,confidence);
                const summary=`MARKOVMADE LAB — Состав тела\n% жира: ~${fmt(bf,1)}%${method==='tape'?` (диапазон ${fmt(bfLow,1)}–${fmt(bfHigh,1)}%)`:''}\nЖировая масса: ${kg(fatMass)}\nLBM: ${kg(lbm)}\nFFMI: ${fmt(ffmi,1)}\nНормализованный FFMI: ${fmt(nffmi,1)}${Number.isFinite(targetWeight)?`\nОриентир при ${fmt(targetBF,1)}%: ${kg(targetWeight)}`:''}\n\nMARKOVMADE / Pavel Markov`;
                mmCalcSummaries.body=summary; updateSnapshot(); return state.body;
            }

            function energyModel(){
                const sex=val('lab-nutri-sex'), age=number('lab-nutri-age'), h=number('lab-nutri-height'), w=number('lab-nutri-weight');
                if(!sex) throw new Error('Выберите пол.');
                for(const [v,min,max,label] of [[age,18,90,'Возраст'],[h,120,230,'Рост'],[w,35,300,'Вес']]){ const m=safeRange(v,min,max,label); if(m) throw new Error(m); }
                const pro=currentMode('nutrition')==='pro', athlete=val('lab-nutri-athlete')==='athlete';
                const bf=number('lab-nutri-bf'); let rmr,rmrMethod;
                if(pro && athlete && age>=18 && age<=35){ rmr=tenHaaf(sex,age,h,w); rmrMethod='ten Haaf (атлеты 18–35)'; }
                else { rmr=mifflin(sex,age,h,w); rmrMethod='Mifflin–St Jeor'; }
                let tdee,tdeeLow,tdeeHigh,tdeeMethod,confidence='Низкая';
                const maintSource=pro?segmentValue('nutri-maint-source'):'model';
                if(pro && maintSource==='measured'){
                    const measured=number('lab-nutri-measured'); const m=safeRange(measured,1000,8000,'Фактические калории поддержания'); if(m) throw new Error(m);
                    tdee=measured; tdeeLow=measured*0.97; tdeeHigh=measured*1.03; tdeeMethod='фактические калории поддержания'; confidence='Выше средней';
                } else if(pro){
                    const steps=number('lab-nutri-steps'), sn=number('lab-nutri-strength-n'), sm=number('lab-nutri-strength-min'), cn=number('lab-nutri-cardio-n'), cm=number('lab-nutri-cardio-min');
                    const work=val('lab-nutri-work')||'sedentary', cmet=Number(val('lab-nutri-cardio-int')||7);
                    const stepN=Number.isFinite(steps)?steps:0;
                    const distanceKm=stepN*(h/100)*K.stepLengthHeightRatio/1000;
                    const walking=K.walkingKcalKgKm*w*distanceKm;
                    const strength=finite(sn,sm)?Math.max(0,K.strengthMet-1)*w*(sm/60)*(sn/7):0;
                    const cardio=finite(cn,cm)?Math.max(0,cmet-1)*w*(cm/60)*(cn/7):0;
                    const workAdj=work==='active'?rmr*0.12:work==='mixed'?rmr*0.05:0;
                    const preTef=rmr+walking+strength+cardio+workAdj;
                    tdee=preTef/(1-K.mixedDietTef);
                    tdeeLow=tdee*0.90; tdeeHigh=tdee*1.10; tdeeMethod='PRO: RMR + шаги + работа + тренировки + TEF';
                    confidence=(Number.isFinite(steps)&&Number.isFinite(sn)&&Number.isFinite(sm))?'Умеренная':'Низкая';
                } else {
                    const pal=Number(val('lab-nutri-pal')||1.5); tdee=rmr*pal; tdeeLow=tdee*0.90; tdeeHigh=tdee*1.10; tdeeMethod=`RMR × PAL ${pal}`; confidence='Низкая';
                }
                return {sex,age,h,w,bf,pro,athlete,rmr,rmrMethod,tdee,tdeeLow,tdeeHigh,tdeeMethod,confidence};
            }

            function calculateNutrition(){
                error('nutrition'); let e;
                try{ e=energyModel(); }catch(err){ error('nutrition',err.message); return null; }
                const goal=val('lab-nutri-goal'), pace=val('lab-nutri-pace');
                const cuts={gentle:.10,standard:.17,fast:.23}, bulks={gentle:.04,standard:.07,fast:.10};
                let mult=1;
                if(goal==='cut') mult=1-cuts[pace]; else if(goal==='recomp') mult=.96; else if(goal==='bulk') mult=1+bulks[pace];
                if(goal==='cut' && Number.isFinite(e.bf)){
                    const lean=e.bf < (e.sex==='male'?12:20); if(lean) mult=Math.max(mult,.85);
                }
                const center=e.tdee*mult, low=center*0.97, high=center*1.03;
                const lbm=Number.isFinite(e.bf)?e.w*(1-e.bf/100):NaN;
                let pLow=e.w*1.6,pHigh=e.w*2.2,pNote='1,6–2,2 г/кг массы';
                if(goal==='cut' && e.athlete && Number.isFinite(lbm) && e.bf < (e.sex==='male'?18:28)){
                    pLow=lbm*2.3; pHigh=lbm*3.1; pNote='2,3–3,1 г/кг FFM — диапазон для сухих силовых атлетов в дефиците';
                } else if(Number.isFinite(e.bf) && e.bf>(e.sex==='male'?25:35)){
                    pLow=lbm*2.0; pHigh=lbm*2.6; pNote='FFM-based practical range, чтобы высокий BF не завышал белок';
                }
                const pMid=(pLow+pHigh)/2;
                const fatLow=Math.max(e.w*0.6,center*0.20/9), fatHigh=Math.max(fatLow,center*0.30/9), fatMid=(fatLow+fatHigh)/2;
                const carbLow=Math.max(0,(low-pHigh*4-fatHigh*9)/4), carbHigh=Math.max(0,(high-pLow*4-fatLow*9)/4), carbMid=Math.max(0,(center-pMid*4-fatMid*9)/4);
                state.profile={sex:e.sex,age:e.age,height:e.h,weight:e.w,bodyFat:Number.isFinite(e.bf)?e.bf:state.profile.bodyFat};
                state.nutrition={modelVersion:MODEL_VERSIONS.nutrition,...e,goal,pace,targetLow:low,target:center,targetHigh:high,pLow,pHigh,pMid,fatLow,fatHigh,fatMid,carbLow,carbHigh,carbMid}; save(); applyProfile();
                setText('lab-nutri-main',`${fmt(low,0)}–${fmt(high,0)} ккал`); setText('lab-nutri-center',kcal(center)); setText('lab-nutri-rmr',kcal(e.rmr)); setText('lab-nutri-rmr-method',e.rmrMethod); setText('lab-nutri-tdee',`${fmt(e.tdeeLow,0)}–${fmt(e.tdeeHigh,0)}`); setText('lab-nutri-tdee-method',e.tdeeMethod);
                setText('lab-nutri-protein',`${fmt(pLow,0)}–${fmt(pHigh,0)} г`); setText('lab-nutri-protein-note',pNote); setText('lab-nutri-fat',`${fmt(fatLow,0)}–${fmt(fatHigh,0)} г`); setText('lab-nutri-carb',`${fmt(carbLow,0)}–${fmt(carbHigh,0)} г`);
                let meaning=`Стартуйте около ${fmt(center,0)} ккал, но считайте ${fmt(low,0)}–${fmt(high,0)} рабочим коридором. Расчётные калории поддержания сами имеют диапазон ${fmt(e.tdeeLow,0)}–${fmt(e.tdeeHigh,0)} ккал.`;
                if(e.tdeeMethod==='фактические калории поддержания') meaning+=' Здесь ваш наблюдаемый maintenance имеет приоритет над predictive equation.';
                setText('lab-nutri-meaning',`Что это значит: ${meaning}`);
                setHTMLSafeList('lab-nutri-actions',[`Держите среднее около ${fmt(center,0)} ккал/сут, а не пытайтесь идеально попасть в число каждый день.`,`Белок: ${fmt(pLow,0)}–${fmt(pHigh,0)} г; жиры: ${fmt(fatLow,0)}–${fmt(fatHigh,0)} г; углеводы заполняют оставшийся энергетический бюджет.`,`Через 14–21 день сравните средний вес, талию, силовые и соблюдение. Если тренд не соответствует цели — корректируйте на 5–8%, а не переписывайте всё.`]);
                const cross= e.pro&&e.athlete&&Number.isFinite(lbm)?` Для справки FFM-версия ten Haaf дала бы ~${fmt(tenHaafFFM(lbm),0)} ккал RMR; значения не усредняются механически.`:'';
                setText('lab-nutri-method',`${e.rmrMethod}: оценка RMR, не прямое измерение. ${e.tdeeMethod}. В SIMPLE используется только PAL. В PRO PAL отключён, поэтому шаги/работа/тренировки не накладываются на уже высокий activity multiplier.${cross} Диапазон TDEE отражает практическую неопределённость модели и NEAT, а не статистический confidence interval.`);
                setBadge('nutrition',e.pro?'Высокая':'Базовая',e.confidence);
                const summary=`MARKOVMADE LAB — Калории / БЖУ\nRMR: ~${fmt(e.rmr,0)} ккал (${e.rmrMethod})\nКалории поддержания: ~${fmt(e.tdee,0)} ккал\nРабочий старт: ${fmt(low,0)}–${fmt(high,0)} ккал\nБелок: ${fmt(pLow,0)}–${fmt(pHigh,0)} г\nЖиры: ${fmt(fatLow,0)}–${fmt(fatHigh,0)} г\nУглеводы: ${fmt(carbLow,0)}–${fmt(carbHigh,0)} г\n\nКорректировать по тренду 14–21 дней.\nMARKOVMADE / Pavel Markov`;
                mmCalcSummaries.nutrition=summary; updateSnapshot(); return state.nutrition;
            }

            function overfeedingMaintenance(sex,age,h,w){
                const source=segmentValue('fat-maint-source');
                if(source==='known'){
                    const m=number('lab-fat-maint'); const er=safeRange(m,1000,8000,'Калории поддержания'); if(er) throw new Error(er);
                    return {value:m,low:m*0.97,high:m*1.03,label:'указан пользователем',confidence:'Выше средней'};
                }
                if(state.nutrition && Number.isFinite(state.nutrition.tdee)) return {value:state.nutrition.tdee,low:state.nutrition.tdeeLow,high:state.nutrition.tdeeHigh,label:'из MARKOVMADE Calories',confidence:state.nutrition.confidence||'Умеренная'};
                const pal=Number(val('lab-fat-pal')||1.5), rmr=mifflin(sex,age,h,w), m=rmr*pal;
                return {value:m,low:m*.90,high:m*1.10,label:'рассчитан автоматически',confidence:'Низкая'};
            }
            function weightedTef(pK,fK,cK,aK){
                const total=pK+fK+cK+aK; if(total<=0) return {low:.05,mid:.10,high:.15};
                const calc=idx=>(pK*K.tef.protein[idx]+fK*K.tef.fat[idx]+cK*K.tef.carbs[idx]+aK*K.tef.alcohol[idx])/total;
                return {low:calc(0),mid:calc(1),high:calc(2)};
            }
            function glycogenRange(status,training,carbs){
                let low=0,high=300;
                if(status==='normal'){low=0;high=100}
                if(status==='deficit'){low=75;high=250}
                if(status==='lowcarb'){low=150;high=400}
                if(status==='workout'){low=75;high=250}
                if(status==='multiworkout'){low=150;high=400}
                if(training==='strength'){high+=50}
                if(training==='endurance'){low+=50;high+=100}
                high=Math.min(high,500); low=Math.min(low,high);
                if(Number.isFinite(carbs)){ high=Math.min(high,Math.max(0,carbs)); low=Math.min(low,high); }
                return [low,high];
            }

            function calculateOverfeeding(){
                error('overfeeding'); setText('lab-fat-macro-check','');
                const days=number('lab-fat-days'), intakeInput=number('lab-fat-intake'), sex=val('lab-fat-sex'), age=number('lab-fat-age'), h=number('lab-fat-height'), w=number('lab-fat-weight');
                if(!sex) return error('overfeeding','Выберите пол — он нужен, если калории поддержания придётся рассчитывать.'),null;
                for(const [v,min,max,label] of [[days,1,14,'Период'],[intakeInput,0,50000,'Калории'],[age,18,90,'Возраст'],[h,120,230,'Рост'],[w,35,300,'Вес']]){ const m=safeRange(v,min,max,label); if(m) return error('overfeeding',m),null; }
                let maint; try{maint=overfeedingMaintenance(sex,age,h,w)}catch(err){error('overfeeding',err.message);return null;}
                const pro=currentMode('overfeeding')==='pro', macroMode=pro&&segmentValue('fat-input-mode')==='macros';
                let p=NaN,f=NaN,c=NaN,a=NaN,macroKcal=NaN,intake=intakeInput,tef={low:.05,mid:.10,high:.15},fatShare=0.33;
                if(macroMode){
                    p=number('lab-fat-p'); f=number('lab-fat-f'); c=number('lab-fat-c'); a=number('lab-fat-alcohol');
                    p=Number.isFinite(p)?p:0;f=Number.isFinite(f)?f:0;c=Number.isFinite(c)?c:0;a=Number.isFinite(a)?a:0;
                    if([p,f,c,a].some(x=>x<0)) return error('overfeeding','БЖУ и алкоголь не могут быть отрицательными.'),null;
                    macroKcal=p*4+f*9+c*4+a*7;
                    const diff=Math.abs(macroKcal-intakeInput), threshold=Math.max(150,intakeInput*.10);
                    const reconcile=segmentValue('fat-reconcile')||'calories';
                    if(diff>threshold){
                        setText('lab-fat-macro-check',`По БЖУ получается ~${fmt(macroKcal,0)} ккал, а указано ${fmt(intakeInput,0)}. Выберите, какой источник использовать для энергетического баланса.`);
                        if(reconcile==='macros') intake=macroKcal;
                    } else setText('lab-fat-macro-check',`Калории из БЖУ: ~${fmt(macroKcal,0)} — согласуются с общей калорийностью в разумных пределах.`);
                    const pK=p*4,fK=f*9,cK=c*4,aK=a*7; tef=weightedTef(pK,fK,cK,aK); fatShare=macroKcal>0?fK/macroKcal:.33;
                }
                const gross=Math.max(0,intake-maint.value*days);
                const grossLow=Math.max(0,intake-maint.high*days), grossHigh=Math.max(0,intake-maint.low*days);
                const theoretical=gross/K.kcalPerKgFatEquivalent;
                let low=0,center=0,high=0,netMid=0,effMid=0;
                if(gross>0){
                    const netLow=grossLow*(1-tef.high), netHigh=grossHigh*(1-tef.low); netMid=gross*(1-tef.mid);
                    if(macroMode){ effMid=clamp(.80+.12*fatShare,.78,.93); }
                    else effMid=.84;
                    const effLow=macroMode?clamp(effMid-.07,.72,.90):.72, effHigh=macroMode?clamp(effMid+.07,.82,.96):.95;
                    low=Math.max(0,netLow*effLow/K.kcalPerKgFatEquivalent);
                    high=Math.max(low,netHigh*effHigh/K.kcalPerKgFatEquivalent);
                    center=netMid*effMid/K.kcalPerKgFatEquivalent;
                    center=clamp(center,low,high);
                }
                const scale=pro?number('lab-fat-scale'):NaN, status=val('lab-fat-gly-status')||'unknown', training=val('lab-fat-training')||'none';
                const gly=glycogenRange(status,training,macroMode?c:NaN), glyWaterLow=gly[0]*(1+K.glycogenWaterLow)/1000, glyWaterHigh=gly[1]*(1+K.glycogenWaterHigh)/1000;
                state.profile={sex,age,height:h,weight:w,bodyFat:Number.isFinite(number('lab-fat-bf'))?number('lab-fat-bf'):state.profile.bodyFat};
                state.overfeeding={modelVersion:MODEL_VERSIONS.overfeeding,days,intake,maint,gross,grossLow,grossHigh,theoretical,low,center,high,macroMode,macroKcal,tef,effMid,scale,gly,glyWaterLow,glyWaterHigh}; save(); applyProfile();
                setText('lab-fat-main',gross<=0?'≈ 0 кг':`${fmt(low,2)}–${fmt(high,2)} кг`); setText('lab-fat-center',gross<=0?'По введённым данным энергетического избытка нет.':`Центральная модельная оценка ≈ ${fmt(center,2)} кг. Это диапазон вероятности, а не прямое измерение ткани.`); setText('lab-fat-surplus',kcal(gross)); setText('lab-fat-theoretical',gross>0?`~${fmt(theoretical,2)} кг`:'~0 кг'); setText('lab-fat-maint-result',kcal(maint.value)); setText('lab-fat-maint-note',maint.label);
                const scaleBlock=el('lab-fat-scale-block');
                if(Number.isFinite(scale) && scale>0){
                    scaleBlock.hidden=false;
                    const nonfatLow=Math.max(0,scale-high), nonfatHigh=Math.max(0,scale-low);
                    setText('lab-fat-scale-text',`Вес на весах: +${fmt(scale,1)} кг. Из них модель относит к жировой массе примерно ${fmt(low,2)}–${fmt(high,2)} кг; оставшиеся ~${fmt(nonfatLow,2)}–${fmt(nonfatHigh,2)} кг не следует автоматически считать жиром.`);
                    const glyMid=Math.min(scale,Math.max(0,(glyWaterLow+glyWaterHigh)/2)), fatMid=Math.min(scale,center), other=Math.max(0,scale-fatMid-glyMid), total=Math.max(.001,fatMid+glyMid+other);
                    el('lab-fat-stack-fat').style.width=`${100*fatMid/total}%`; el('lab-fat-stack-gly').style.width=`${100*glyMid/total}%`; el('lab-fat-stack-other').style.width=`${100*other/total}%`;
                    setText('lab-fat-legend-fat',`${fmt(low,2)}–${fmt(high,2)} кг`); setText('lab-fat-legend-gly',`${fmt(glyWaterLow,2)}–${fmt(glyWaterHigh,2)} кг`); setText('lab-fat-legend-other',other>0?`~${fmt(other,2)} кг, высокая неопределённость`:'не отделяется надёжно');
                } else if(scaleBlock) scaleBlock.hidden=true;
                setText('lab-fat-72',`Следующие 72 часа: часть резкого прироста массы может снизиться по мере нормализации содержимого ЖКТ, гликогена и воды. Модельная жировая масса изменяется медленнее; конкретный объём воды без измерений натрия, жидкости и запасов гликогена определить нельзя.`);
                const actions=gross>0?[`Вернитесь к обычному рациону и привычной активности — не пытайтесь «отработать» всё за один день.`,`Взвешивайтесь 3–4 утра подряд в одинаковых условиях и смотрите на среднее.`,`Если это единичное событие, решение принимается по недельному тренду, а не по утреннему пику.`]:['Не вводите дополнительный дефицит только из-за ощущения «переедания»: по введённым калориям избыток не подтверждается.','Продолжайте обычный план и оценивайте недельный тренд.'];
                setHTMLSafeList('lab-fat-actions',actions);
                const comp=val('lab-fat-comp'); let deficit=comp==='custom'?number('lab-fat-comp-custom'):Number(comp); const compNode=el('lab-fat-comp-result');
                if(pro && Number.isFinite(deficit) && deficit>0 && center>0){ const d=center*K.kcalPerKgFatEquivalent/deficit; compNode.hidden=false; setText('lab-fat-comp-result',`Как долго избыток влияет на план: при дополнительном дефиците ~${fmt(deficit,0)} ккал/сут энергетический эквивалент центральной оценки составляет ~${fmt(d,1)} дня. Это не рекомендация голодать: обычно рациональнее вернуться к плану и распределить коррекцию мягко.`); } else if(compNode) compNode.hidden=true;
                const methodText=macroMode?`Для дополнительной еды TEF рассчитан как взвешенная оценка по введённым белкам, жирам, углеводам и алкоголю; центральная оценка ≈ ${Math.round(tef.mid*100)}% энергии этой смеси. Затем использован диапазон эффективности хранения, согласованный с controlled-overfeeding данными, где жирный избыток хранился эффективнее углеводного. Это прикладная модель, не индивидуальное измерение.`:`Состав БЖУ неизвестен, поэтому использован широкий диапазон TEF и эффективности хранения. Это намеренно расширяет интервал вместо ложной точности.`;
                setText('lab-fat-method',`${methodText} Теоретическая граница = gross surplus / 7700 и показана только как энергетический эквивалент. Для гликогена используется сценарный диапазон, а связанная вода — ориентир 2,7–4 г воды на 1 г гликогена; прочая вода/натрий/ЖКТ не моделируются псевдоточно.`);
                setBadge('overfeeding',macroMode?'Высокая':pro?'Хорошая':'Базовая',maint.confidence==='Выше средней'&&macroMode?'Выше средней':pro?'Умеренная':'Низкая');
                const summary=`MARKOVMADE FAT GAIN MODEL\nПериод: ${fmt(days,0)} дн.\nКалории поддержания: ~${fmt(maint.value,0)} ккал/сут (${maint.label})\nПотребление: ${fmt(intake,0)} ккал\nЭнергетический избыток: ~${fmt(gross,0)} ккал\n\nВероятный набор жировой массы: ${fmt(low,2)}–${fmt(high,2)} кг\nЦентральная оценка: ~${fmt(center,2)} кг\nТеоретическая энергетическая граница: ~${fmt(theoretical,2)} кг${Number.isFinite(scale)?`\nИзменение веса на весах: ${scale>=0?'+':''}${fmt(scale,1)} кг`:''}\n\nПрибавка на весах ≠ жировая масса.\nMARKOVMADE / Pavel Markov`;
                mmCalcSummaries.overfeeding=summary; updateSnapshot(); return state.overfeeding;
            }

            function calculateRecovery(){
                error('recovery');
                const ids=['sleep','energy','stress','desire','soreness','well'], labels=['сон','энергия','стресс','желание тренироваться','болезненность','самочувствие'];
                const values=ids.map(x=>number(`lab-rec-${x}`));
                for(let i=0;i<values.length;i++){ const m=safeRange(values[i],1,10,labels[i]); if(m) return error('recovery',m),null; }
                const scores=[values[0]/10,values[1]/10,(11-values[2])/10,values[3]/10,(11-values[4])/10,values[5]/10], weights=[.20,.20,.17,.15,.13,.15];
                let score=scores.reduce((s,v,i)=>s+v*weights[i],0)*100, adjustments=[], pro=currentMode('recovery')==='pro', proCount=0;
                if(pro){
                    const hours=number('lab-rec-hours'); if(Number.isFinite(hours)){proCount++; if(hours<6){score-=8;adjustments.push('очень короткий сон')}else if(hours<7){score-=4;adjustments.push('короткий сон')}else if(hours>=8){score+=2;}}
                    const sessions=number('lab-rec-sessions'); if(Number.isFinite(sessions)){proCount++;if(sessions>=9){score-=7;adjustments.push('очень высокая частота тренировок')}else if(sessions>=7){score-=4;adjustments.push('высокая частота тренировок')}}
                    if(val('lab-rec-failure')==='yes'){score-=4;adjustments.push('много отказной работы');proCount++;}
                    const def=val('lab-rec-deficit'); if(def==='medium'){score-=3;adjustments.push('дефицит энергии')} if(def==='hard'){score-=6;adjustments.push('жёсткий дефицит')}
                    const work=val('lab-rec-work'); if(work==='high'){score-=4;adjustments.push('высокая рабочая нагрузка')}
                    const rhr=number('lab-rec-rhr'),rhrBase=number('lab-rec-rhr-base'); if(finite(rhr,rhrBase)&&rhrBase>0){proCount++;const delta=(rhr-rhrBase)/rhrBase;if(delta>=.10){score-=5;adjustments.push('RHR заметно выше baseline')}else if(delta>=.05){score-=2;adjustments.push('RHR выше baseline')}}
                    const hrv=number('lab-rec-hrv'),hrvBase=number('lab-rec-hrv-base'); if(finite(hrv,hrvBase)&&hrvBase>0){proCount++;const delta=(hrv-hrvBase)/hrvBase;if(delta<=-.20){score-=5;adjustments.push('HRV заметно ниже baseline')}else if(delta<=-.10){score-=2;adjustments.push('HRV ниже baseline')}}
                }
                score=clamp(score,0,100);
                const positiveIndex=scores.indexOf(Math.max(...scores)), limiterIndex=scores.indexOf(Math.min(...scores));
                let status,training,decision;
                if(score>=80){status='Ресурс хороший';training='По плану';decision='Большинство сигналов поддерживает обычную нагрузку. Не добавляйте объём только потому, что score высокий.'}
                else if(score>=65){status='Рабочее состояние';training='Планово / без добивания';decision='Можно тренироваться, но сегодня плохой день для незапланированного увеличения объёма или отказных подходов.'}
                else if(score>=50){status='Накопилась нагрузка';training='Снизить объём';decision='Вероятно, больше пользы даст уменьшение объёма/интенсивности и приоритет сна, чем ещё одна тяжёлая сессия.'}
                else {status='Ресурс низкий';training='Восстановительная нагрузка';decision='Сигналы сходятся в сторону восстановления. Если состояние необычное, выраженное или сохраняется — не трактуйте score как диагноз и оцените здоровье отдельно.'}
                state.recovery={modelVersion:MODEL_VERSIONS.recovery,score,status,training,positive:labels[positiveIndex],limiter:labels[limiterIndex],adjustments,proCount}; save();
                setText('lab-rec-main',`${fmt(score,0)} / 100`); setText('lab-rec-status',status); el('lab-rec-bar').style.width=`${score}%`; setText('lab-rec-positive',labels[positiveIndex]); setText('lab-rec-limiter',labels[limiterIndex]); setText('lab-rec-training',training); setText('lab-rec-meaning',`Решение дня: ${decision}`);
                const acts=[score>=65?'Оставьте запланированную тренировку, но не повышайте нагрузку без причины.':'Сократите объём или перенесите тяжёлую работу; сохраните движение в восстановительном формате.',values[0]<=5?'Сегодня главный ROI — сон: не пытайтесь компенсировать его стимуляторами и дополнительной нагрузкой.':'Сон не выглядит главным ограничителем по субъективной оценке — не меняйте его радикально.',adjustments.length?`PRO-контекст, который тянет score вниз: ${adjustments.join(', ')}.`:'Не меняйте несколько переменных одновременно: так вы поймёте, что реально влияет на восстановление.'];
                setHTMLSafeList('lab-rec-actions',acts); setText('lab-rec-method','Score — авторская эвристика самонаблюдения: субъективные сигналы нормируются, затем PRO-контекст умеренно корректирует итог. RHR/HRV учитываются только как отклонение от личного baseline. Никакого медицинского диагноза, «истощения ЦНС» или доказанной вероятности травмы этот балл не выдаёт.');
                setBadge('recovery',pro&&proCount>=3?'Высокая':pro?'Хорошая':'Базовая',pro&&proCount>=3?'Умеренная':'Низкая');
                const summary=`MARKOVMADE Readiness\nРесурс: ${fmt(score,0)}/100 — ${status}\nСильный фактор: ${labels[positiveIndex]}\nОграничитель: ${labels[limiterIndex]}\nТренировка: ${training}\n\n${decision}\nMARKOVMADE / Pavel Markov`;
                mmCalcSummaries.recovery=summary; updateSnapshot(); return state.recovery;
            }

            function parseDailyWeights(text){ return String(text||'').split(/[\s,;]+/).map(x=>Number(x.replace(',','.'))).filter(x=>Number.isFinite(x)&&x>30&&x<350); }
            function avg(a){ return a.length?a.reduce((s,x)=>s+x,0)/a.length:NaN; }
            function movingAverage(a,n=7){ const out=[]; for(let i=n-1;i<a.length;i++) out.push(avg(a.slice(i-n+1,i+1))); return out; }
            function regressionSlope(a){
                const n=a.length;if(n<2)return NaN; const xm=(n-1)/2,ym=avg(a); let nume=0,den=0;
                for(let i=0;i<n;i++){nume+=(i-xm)*(a[i]-ym);den+=(i-xm)*(i-xm)} return den?nume/den:0;
            }
            function drawProgressChart(values){
                const wrap=el('lab-prog-chart'),path=el('lab-prog-chart-line'); if(!wrap||!path)return;
                if(values.length<2){wrap.hidden=true;path.setAttribute('d','');return;}
                wrap.hidden=false; const min=Math.min(...values),max=Math.max(...values),range=Math.max(.01,max-min);
                const points=values.map((v,i)=>{const x=600*i/(values.length-1),y=90-80*(v-min)/range;return [x,y]});
                path.setAttribute('d',points.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '));
            }
            function calculateProgress(){
                error('progress');
                const sd=new Date(val('lab-prog-start-date')),ed=new Date(val('lab-prog-end-date')),sw=number('lab-prog-start-weight'),cw=number('lab-prog-current-weight'),stw=number('lab-prog-start-waist'),ctw=number('lab-prog-current-waist'),target=number('lab-prog-target'),goal=val('lab-prog-goal');
                if(!Number.isFinite(sd.getTime())||!Number.isFinite(ed.getTime())) return error('progress','Укажите дату старта и текущую дату.'),null;
                const days=(ed-sd)/86400000; if(!(days>=3)) return error('progress','Текущая дата должна быть позже старта минимум на 3 дня.'),null;
                for(const [v,min,max,label] of [[sw,35,300,'Стартовый вес'],[cw,35,300,'Текущий вес']]){const m=safeRange(v,min,max,label);if(m)return error('progress',m),null;}
                const weeks=days/7,delta=cw-sw,quickWeekly=delta/weeks; let weekly=quickWeekly,source='средний темп за весь период',daily=[];
                const pro=currentMode('progress')==='pro'; if(pro) daily=parseDailyWeights(val('lab-prog-daily'));
                let ma=[]; if(daily.length>=7){ ma=movingAverage(daily,7); if(ma.length>=2){weekly=regressionSlope(ma)*7;source=`7-дневное сглаживание, ${daily.length} измерений`;drawProgressChart(daily);} }
                else drawProgressChart([]);
                const weeklyPct=weekly/sw*100, waistDelta=finite(stw,ctw)?ctw-stw:NaN;
                let plateau='Недостаточно данных';
                if(daily.length>=14){ const prev=avg(daily.slice(-14,-7)),last=avg(daily.slice(-7)),chg=(last-prev)/prev*100; if(Math.abs(chg)<.15 && (!Number.isFinite(waistDelta)||Math.abs(waistDelta)<.5)) plateau='Возможен'; else plateau='Не подтверждается'; }
                else if(weeks>=3 && Math.abs(weeklyPct)<.15 && Number.isFinite(waistDelta)&&Math.abs(waistDelta)<.5) plateau='Возможен';
                let eta=NaN; if(Number.isFinite(target)&&Math.abs(weekly)>.02 && ((target<cw&&weekly<0)||(target>cw&&weekly>0))) eta=Math.abs((target-cw)/weekly);
                let meaning=''; const actions=[];
                if(goal==='cut'){
                    if(Math.abs(weeklyPct)<.15 && Number.isFinite(waistDelta)&&waistDelta<-.5){ meaning='Вес почти не меняется, но талия уменьшается — это не похоже на отсутствие прогресса. Вероятна рекомпозиция или маскировка тренда водой.'; actions.push('Не снижайте калории только из-за веса: талия уже движется в нужную сторону.'); }
                    else if(weeklyPct<-1){ meaning='Темп снижения веса быстрый. Для большинства силовых атлетов это повышает цену ошибки по восстановлению и сохранению производительности.'; actions.push('Не ускоряйте дефицит; сначала проверьте силовые, сон, голод и соблюдение.'); }
                    else if(weeklyPct<-.25){ meaning='Темп соответствует рабочему диапазону для устойчивого снижения массы; дальнейшее ускорение не обязательно даст лучший результат.'; actions.push('Сохраните план ещё 1–2 недели, если талия и производительность движутся приемлемо.'); }
                    else { meaning=plateau==='Возможен'?'Тренд близок к плато. Но решение стоит принимать только после проверки соблюдения, талии и достаточной длины наблюдения.':'Темп очень медленный; это может быть нормой при рекомпозиции, но для выраженного снижения жира нужен контекст талии и соблюдения.'; actions.push(plateau==='Возможен'?'Сначала проверьте фактическое соблюдение и средние калории; затем меняйте только один рычаг на 5–8%.':'Соберите ещё 7–14 дней данных до крупной корректировки.'); }
                } else if(goal==='bulk'){
                    meaning=weeklyPct>.5?'Вес растёт быстро — часть прироста с высокой вероятностью будет не только мышечной массой.':'Темп набора умеренный; оцените его вместе с талией и силовыми.'; actions.push(weeklyPct>.5?'Снизьте темп набора, а не тренировочную нагрузку автоматически.':'Сохраните текущий план, если силовые растут, а талия не ускоряется непропорционально.');
                } else { meaning='Главный сигнал — согласованность веса, талии и производительности. Один показатель не должен автоматически отменять остальные.'; actions.push('Сохраняйте одинаковые условия измерения и принимайте решение по тренду.'); }
                if(pro){ const adherence=number('lab-prog-adherence'); if(Number.isFinite(adherence)&&adherence<75) actions.push('Соблюдение <75%: прежде чем урезать калории или добавлять кардио, улучшите воспроизводимость плана.'); }
                actions.push('Меняйте один главный рычаг за раз, иначе вы не узнаете, что сработало.');
                state.profile.weight=cw; const bfn=pro?number('lab-prog-bf-now'):NaN; if(Number.isFinite(bfn)) state.profile.bodyFat=bfn;
                state.progress={modelVersion:MODEL_VERSIONS.progress,days,weeks,delta,waistDelta,weekly,weeklyPct,plateau,eta,source,dailyCount:daily.length,goal}; save(); applyProfile();
                setText('lab-prog-main',`${weekly>=0?'+':''}${fmt(weekly,2)} кг / нед.`); setText('lab-prog-sub',source); setText('lab-prog-weight-delta',`${delta>=0?'+':''}${fmt(delta,1)} кг`); setText('lab-prog-waist-delta',Number.isFinite(waistDelta)?`${waistDelta>=0?'+':''}${fmt(waistDelta,1)} см`:'—'); setText('lab-prog-weekly-pct',`${weeklyPct>=0?'+':''}${fmt(weeklyPct,2)}%`); setText('lab-prog-plateau',plateau); setText('lab-prog-eta',Number.isFinite(eta)?`~${fmt(eta,1)} нед.`:'—'); setText('lab-prog-data',daily.length>=7?`${daily.length} весов`:`${fmt(days,0)} дней`); setText('lab-prog-meaning',`Что это значит: ${meaning}`); setHTMLSafeList('lab-prog-actions',actions);
                setBadge('progress',daily.length>=14?'Высокая':daily.length>=7||weeks>=3?'Хорошая':'Базовая',daily.length>=14?'Выше средней':daily.length>=7?'Умеренная':'Низкая');
                const summary=`MARKOVMADE LAB — Прогресс\nПериод: ${fmt(days,0)} дней\nВес: ${fmt(sw,1)} → ${fmt(cw,1)} кг (${delta>=0?'+':''}${fmt(delta,1)} кг)\nСредний темп: ${weekly>=0?'+':''}${fmt(weekly,2)} кг/нед. (${weeklyPct>=0?'+':''}${fmt(weeklyPct,2)}%/нед.)${Number.isFinite(waistDelta)?`\nТалия: ${waistDelta>=0?'+':''}${fmt(waistDelta,1)} см`:''}\nПлато: ${plateau}\n\nВес за один день — шум. Тренд — сигнал.\nMARKOVMADE / Pavel Markov`;
                mmCalcSummaries.progress=summary; updateSnapshot(); return state.progress;
            }

            function calculateStrategy(){
                error('strategy'); const goal=val('lab-str-goal'),blocker=val('lab-str-blocker'),readiness=val('lab-str-readiness'),horizon=Number(val('lab-str-horizon')||14);
                let main='',focus='',control='',reason='',actions=[];
                if(state.recovery&&Number.isFinite(state.recovery.score)&&state.recovery.score<55){ main='Восстановление';focus='Снизить цену нагрузки';control='сон + readiness';reason=`Readiness ${fmt(state.recovery.score,0)}/100 сейчас ограничивает качество выполнения сильнее, чем дополнительная оптимизация калорий.`;actions=['На 3–7 дней уберите незапланированный тренировочный объём и стабилизируйте сон.','Питание держите предсказуемым; не добавляйте агрессивный дефицит.','Повторите readiness несколько дней и только затем усиливайте нагрузку.']; }
                else if(state.progress&&state.progress.plateau==='Возможен') { main='Проверка плато';focus='Один рычаг на 14 дней';control='7-дневный вес + талия';reason='Сигнал плато уже появился, поэтому следующий шаг — не новый набор упражнений, а проверка соблюдения и минимальная корректировка одного фактора.';actions=['Проверьте фактические средние калории и соблюдение.','Если соблюдение хорошее — измените энергетический баланс только на 5–8%.','Оцените новые 7–14 дней до следующего изменения.']; }
                else if(blocker==='nutrition'||(goal==='cut'&&!state.nutrition.target)){ main='Питание';focus='Стабильный энергетический коридор';control='средние ккал + талия';reason=state.nutrition&&state.nutrition.target?`У вас уже есть рабочий коридор около ${fmt(state.nutrition.target,0)} ккал — проблема теперь не в поиске новой формулы, а в воспроизводимости.`:'Для цели сначала нужна воспроизводимая энергетическая база; без неё тренировки и кардио сложно интерпретировать.';actions=['Рассчитайте или зафиксируйте калории поддержания и рабочий коридор.','Держите среднее питание 14 дней без ежедневных резких компенсаций.','Сверьте вес, талию и соблюдение перед корректировкой.']; }
                else if(blocker==='recovery'){ main='Восстановление';focus='Сон и объём нагрузки';control='readiness 3–7 дней';reason='Вы сами обозначили восстановление как главный барьер; добавление ещё одной задачи сейчас снизит соблюдение.';actions=['Выберите один фиксированный якорь сна.','Уберите лишний объём, который не даёт измеримого результата.','Оцените ресурс в одинаковое время 3–7 дней.']; }
                else if(blocker==='consistency'||readiness==='low'){ main='Исполняемость';focus='Минимум, который повторяется';control='выполнение > идеальность';reason='Система с 80% соблюдения обычно полезнее идеального плана, который выполняется два дня.';actions=['Сократите план до 2–3 обязательных действий.','Закрепите один контрольный показатель на каждый день.','Усложняйте систему только после двух стабильных недель.']; }
                else { main='Контроль тренда';focus='Не менять то, что работает';control='вес + талия + производительность';reason='Недостаточно оснований для крупной коррекции. Лучший следующий шаг — собрать сигнал и избежать лишних изменений.';actions=['Сохраните текущий план на выбранный горизонт.','Собирайте одинаковые измерения и отмечайте соблюдение.','Меняйте только тот фактор, который реально перестал давать результат.']; }
                state.strategy={modelVersion:MODEL_VERSIONS.strategy,goal,blocker,readiness,horizon,main,focus,control,reason,actions}; save();
                setText('lab-str-main',main); setText('lab-str-focus',focus); setText('lab-str-horizon-result',`${horizon} дней`); setText('lab-str-control',control); setText('lab-str-meaning',`Почему: ${reason}`); setHTMLSafeList('lab-str-actions',actions);
                const summary=`MARKOVMADE LAB — Навигатор стратегии\nГлавный рычаг: ${main}\nФокус: ${focus}\nГоризонт: ${horizon} дней\nКонтроль: ${control}\n\nПочему: ${reason}\n\n${actions.map((a,i)=>`${i+1}. ${a}`).join('\n')}\n\nMARKOVMADE / Pavel Markov`;
                mmCalcSummaries.strategy=summary; mmCalcSummaries.format=summary; updateSnapshot(); return state.strategy;
            }

            function updateSnapshot(){
                const data={
                    bf: state.body&&Number.isFinite(state.body.bf)?`${fmt(state.body.bf,1)}%`:null,
                    ffmi: state.body&&Number.isFinite(state.body.ffmi)?fmt(state.body.ffmi,1):null,
                    tdee: state.nutrition&&Number.isFinite(state.nutrition.tdee)?`${fmt(state.nutrition.tdee,0)} ккал`:null,
                    target: state.nutrition&&Number.isFinite(state.nutrition.target)?`${fmt(state.nutrition.targetLow,0)}–${fmt(state.nutrition.targetHigh,0)}`:null,
                    readiness: state.recovery&&Number.isFinite(state.recovery.score)?`${fmt(state.recovery.score,0)}/100`:null,
                    pace: state.progress&&Number.isFinite(state.progress.weeklyPct)?`${state.progress.weeklyPct>=0?'+':''}${fmt(state.progress.weeklyPct,2)}%/нед.`:null,
                    strategy: state.strategy&&state.strategy.main?state.strategy.main:null
                };
                let any=false; Object.entries(data).forEach(([key,v])=>{ const card=$(`[data-snap="${key}"]`); if(card){card.hidden=!v;if(v){card.querySelector('b').textContent=v;any=true;}} });
                const snapshot=el('mm-lab-snapshot'); if(snapshot) snapshot.hidden=false;
                const empty=el('mm-lab-snapshot-empty'); if(empty) empty.hidden=any;
            }
            updateSnapshot();

            function copyText(text){
                if(!text) return;
                if(navigator.clipboard&&window.isSecureContext) navigator.clipboard.writeText(text).catch(()=>fallbackCopy(text)); else fallbackCopy(text);
            }
            function fallbackCopy(text){ const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}ta.remove(); }
            function summaryFor(tool){return mmCalcSummaries[tool]||'';}
            $$('[data-copy]').forEach(btn=>btn.addEventListener('click',()=>{const s=summaryFor(btn.dataset.copy);if(!s)return;copyText(s);const old=btn.textContent;btn.textContent='Скопировано';setTimeout(()=>btn.textContent=old,1200);}));
            $$('[data-telegram]').forEach(btn=>btn.addEventListener('click',()=>{const s=summaryFor(btn.dataset.telegram);if(!s)return;window.open(`https://t.me/share/url?url=${encodeURIComponent(location.href.split('#')[0])}&text=${encodeURIComponent(s)}`,'_blank','noopener,noreferrer');}));

            const calculators={body:calculateBody,nutrition:calculateNutrition,overfeeding:calculateOverfeeding,recovery:calculateRecovery,progress:calculateProgress,strategy:calculateStrategy};
            $$('[data-calc]').forEach(btn=>btn.addEventListener('click',()=>{const fn=calculators[btn.dataset.calc];if(fn)fn();}));

            const defaults={
                'lab-fat-days':'1','lab-rec-sleep':'7','lab-rec-energy':'7','lab-rec-stress':'4','lab-rec-desire':'7','lab-rec-soreness':'4','lab-rec-well':'7','lab-prog-end-date':localToday()
            };
            function resetTool(tool){
                const panel=$(`[data-mm-lab-panel="${tool}"]`); if(!panel)return;
                panel.querySelectorAll('input,textarea').forEach(x=>{ if(x.dataset.profile)return; x.value=Object.prototype.hasOwnProperty.call(defaults,x.id)?defaults[x.id]:''; });
                panel.querySelectorAll('select').forEach(x=>{ if(x.dataset.profile)return; x.selectedIndex=0; });
                if(tool==='nutrition'){el('lab-nutri-goal').value='recomp';el('lab-nutri-pace').value='standard';el('lab-nutri-pal').value='1.5';el('lab-nutri-athlete').value='general';el('lab-nutri-work').value='mixed';el('lab-nutri-cardio-int').value='7';}
                if(tool==='overfeeding'){el('lab-fat-gly-status').value='normal';el('lab-fat-training').value='none';el('lab-fat-level').value='trained';el('lab-fat-comp').value='0';}
                if(tool==='recovery'){el('lab-rec-failure').value='no';el('lab-rec-deficit').value='light';el('lab-rec-work').value='medium';}
                if(tool==='progress'){el('lab-prog-goal').value='cut';}
                if(tool==='strategy'){el('lab-str-goal').value='recomp';el('lab-str-blocker').value='consistency';el('lab-str-readiness').value='medium';el('lab-str-horizon').value='14';}
                state[tool]={}; mmCalcSummaries[tool]=''; if(tool==='strategy')mmCalcSummaries.format=''; save(); updateSnapshot();
            }
            $$('[data-reset]').forEach(btn=>btn.addEventListener('click',()=>resetTool(btn.dataset.reset)));
            el('mm-lab-clear-all')?.addEventListener('click',()=>{
                if(!window.confirm('Очистить локальные данные MARKOVMADE LAB на этом устройстве?')) return;
                try{localStorage.removeItem(STORAGE_KEY)}catch(e){} state=emptyState(); if(window.MarkovMadeLab) window.MarkovMadeLab.state=state;
                $$('[data-profile]').forEach(x=>x.value=''); ['body','nutrition','overfeeding','recovery','progress','strategy'].forEach(resetTool); updateFemaleFields(); updateSnapshot();
            });

            // Consistency check between declared calories and macros.
            const macroIds=['lab-fat-intake','lab-fat-p','lab-fat-f','lab-fat-c','lab-fat-alcohol'];
            macroIds.forEach(id=>el(id)?.addEventListener('input',()=>{
                if(segmentValue('fat-input-mode')!=='macros')return;
                const intake=number('lab-fat-intake'),p=number('lab-fat-p'),f=number('lab-fat-f'),c=number('lab-fat-c'),a=number('lab-fat-alcohol');
                if(!Number.isFinite(intake))return; const mk=(Number.isFinite(p)?p:0)*4+(Number.isFinite(f)?f:0)*9+(Number.isFinite(c)?c:0)*4+(Number.isFinite(a)?a:0)*7;
                if(mk>0){const diff=Math.abs(mk-intake);setText('lab-fat-macro-check',diff>Math.max(150,intake*.1)?`БЖУ дают ~${fmt(mk,0)} ккал против ${fmt(intake,0)}. Выберите источник ниже.`:`БЖУ дают ~${fmt(mk,0)} ккал — расхождение небольшое.`)}
            }));

            // Public namespace: calculations remain deterministic and testable.
            window.MarkovMadeLab={
                version:'1.0.0', state, constants:K,
                engine:{mifflin,tenHaaf,tenHaafFFM,navyBodyFat,weightedTef,glycogenRange,movingAverage,regressionSlope},
                calculate:{body:calculateBody,nutrition:calculateNutrition,overfeeding:calculateOverfeeding,recovery:calculateRecovery,progress:calculateProgress,strategy:calculateStrategy},
                runSelfTests:function(){
                    const tests=[]; const near=(a,b,t)=>Math.abs(a-b)<=t;
                    tests.push(['Mifflin male',near(mifflin('male',30,180,80),1780,1)]);
                    tests.push(['Mifflin female',near(mifflin('female',30,165,60),1320.25,1)]);
                    tests.push(['Navy male plausible',(()=>{const x=navyBodyFat('male',180,85,40,NaN);return x>5&&x<35})()]);
                    tests.push(['Navy invalid geometry',Number.isNaN(navyBodyFat('male',180,35,40,NaN))]);
                    tests.push(['Moving average',JSON.stringify(movingAverage([1,2,3,4,5,6,7],7))==='[4]']);
                    tests.push(['Regression flat',near(regressionSlope([5,5,5,5]),0,.0001)]);
                    const g=glycogenRange('lowcarb','none',300);tests.push(['Glycogen capped by carbs',g[1]===300]);
                    const pass=tests.every(x=>x[1]); return {pass,tests};
                }
            };
            try{ const r=window.MarkovMadeLab.runSelfTests(); if(!r.pass) console.warn('[MARKOVMADE LAB] self-tests failed',r); }catch(e){console.warn('[MARKOVMADE LAB] self-tests error',e);}
        })();
    });
