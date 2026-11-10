/* Local product events: no measurements, free text or outbound URLs. */
(function(){
'use strict';
const names=new Set(['tool_open','calculation_complete','result_saved','contact_open','language_switch','cta_click']);
function track(name,data){if(!names.has(name))return;const payload={language:document.documentElement.lang==='en'?'en':'ru',theme:document.documentElement.dataset.theme||'aurum-noir'};for(const key of ['tool','channel','action'])if(typeof data?.[key]==='string'&&/^[a-z0-9_-]{1,64}$/i.test(data[key]))payload[key]=data[key];window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:name,markovmade:payload});if(window.dataLayer.length>200)window.dataLayer.splice(0,window.dataLayer.length-200);}
window.mmTrack=window.markovmadeTrack=track;
document.addEventListener('click',function(event){const el=event.target.closest?.('a,button');if(!el)return;if(el.matches('a[href*="t.me"],a[href*="wa.me"]'))track('contact_open',{channel:el.href.includes('t.me')?'telegram':'whatsapp'});else if(el.matches('[data-lang-toggle]'))track('language_switch',{});else if(el.matches('[data-analytics]'))track('cta_click',{action:el.dataset.analytics});},true);
document.getElementById('calculators')?.addEventListener('mm:lab-tab',event=>track('tool_open',{tool:event.detail?.key}));
document.getElementById('calculators')?.addEventListener('mm:toolkit-result',event=>track('calculation_complete',{tool:event.detail?.id}));
document.addEventListener('mm:calculation-complete',event=>track('calculation_complete',{tool:event.detail?.tool}));
document.addEventListener('mm:result-saved',event=>track('result_saved',{tool:event.detail?.tool}));
})();
