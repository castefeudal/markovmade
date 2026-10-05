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
    document.addEventListener('click',event=>{if(event.target.closest('[data-privacy-toggle]'))window.togglePrivacy();});
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
                c.inert = true;
                c.previousElementSibling.setAttribute('aria-expanded', 'false');
            }
        });
        content.classList.toggle('open'); icon.classList.toggle('open');
        const isOpen = content.classList.contains('open');
        content.setAttribute('aria-hidden', String(!isOpen));
        content.inert = !isOpen;
        btn.setAttribute('aria-controls', content.id);
        btn.setAttribute('aria-expanded', String(isOpen));
    }

    document.querySelectorAll('button[data-accordion]').forEach(btn => {
        btn.addEventListener('click',()=>window.toggleAccordion(btn));
        const content = btn.nextElementSibling;
        if (!content || !content.classList.contains('accordion-content')) return;
        btn.setAttribute('aria-controls', content.id);
        btn.setAttribute('aria-expanded', String(content.classList.contains('open')));
        content.setAttribute('aria-hidden', String(!content.classList.contains('open')));
        content.inert = !content.classList.contains('open');
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

    }

    // --- ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ И СКРОЛЛ ---
    document.querySelectorAll('[data-evolution]').forEach(btn=>btn.addEventListener('click',()=>window.toggleEvolution(btn)));
    function initContactForm() {
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
            const calcResults = Object.values(window.mmCalcSummaries || {}).filter(Boolean).map(item => {
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
                const preview=document.getElementById('lead-message-preview');if(preview)preview.textContent=leadState.text;
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
                window.mmPreviewShare(text,'https://t.me/markovmade?text=' + encodeURIComponent(text));
            });
            if (whatsappBtn) whatsappBtn.addEventListener('click', () => {
                const text = leadState.text || leadBuildMessage(leadState.id || 'GEN-000');
                if(window.mmTrack) window.mmTrack('lead_whatsapp_click',{source:'form'});
                window.mmPreviewShare(text,'https://wa.me/79819722516?text=' + encodeURIComponent(text));
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

    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initContactForm, { once: true });
    else initContactForm();
