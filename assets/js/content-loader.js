/* Editorial interactions and the contact form enter on scroll/keyboard intent.
   The hero, themes, language and LAB/OS have their own independent owners. */
(function () {
  let pending, ready = false, autoFailed = false;
  const scripts=new Map();
  const waiting=new WeakSet();
  const failures=new Map();
  function script(name) {
    if(scripts.has(name))return scripts.get(name);
    const task=new Promise((resolve,reject) => {
      const node=document.createElement('script');node.src='assets/js/'+name+'.js';
      node.onload=resolve;node.onerror=()=>{scripts.delete(name);node.remove();reject(new Error('Cannot load '+name));};document.body.appendChild(node);
    });
    scripts.set(name,task);return task;
  }
  function load() {
    if(pending)return pending;
    pending=Promise.all(['app-runtime','media-interactions','situation-quiz'].map(script)).then(()=>{
      ready=true;autoFailed=false;
      failures.forEach((target,status)=>{
        if(status.id==='lead-form-error'){status.replaceChildren();status.classList.remove('mm-content-load-status');delete status.dataset.contentLoadError;}
        else status.remove();
      });
      failures.clear();
    }).catch(error=>{pending=null;autoFailed=true;throw error;});
    return pending;
  }
  function showFailure(target){
    const privacy=target.matches('[data-privacy-toggle]');
    const form=privacy?null:target.closest('#manifest-form');
    let status=document.getElementById(form?'lead-form-error':privacy?'mm-privacy-load-error':'mm-content-load-error');
    if(!status){
      status=document.createElement(privacy?'span':'div');status.id=privacy?'mm-privacy-load-error':'mm-content-load-error';status.className='mm-component-loading';status.setAttribute('role','alert');
      if(privacy)target.after(status);else document.getElementById('quiz-summary').before(status);
    }
    const en=document.documentElement.lang==='en';
    status.classList.add('mm-content-load-status');
    status.dataset.contentLoadError='true';
    status.replaceChildren(document.createTextNode(form
      ? (en?'The form could not finish loading. Your entries are still here. ':'Форма пока не загрузилась. Введённые данные сохранены на странице. ')
      : privacy?(en?'The privacy information could not load. ':'Условия обработки данных пока не загрузились. ')
      : (en?'Extra options could not load. You can message me directly or try again. ':'Уточнения пока не загрузились. Можно написать напрямую или повторить загрузку. ')));
    const retry=document.createElement('button');retry.type='button';retry.dataset.contentRetry='';retry.className='mm-secondary-cta';retry.textContent=en?'Try again':'Повторить';
    retry.addEventListener('click',()=>{
      retry.disabled=true;
      load().then(()=>{if(privacy)target.click();else (form?.querySelector('button[type="submit"]')||document.getElementById('quiz-telegram-link'))?.focus({preventScroll:true});}).catch(()=>showFailure(target));
    });
    status.append(retry);failures.set(status,target);
  }
  function replay(target,action){
    if(waiting.has(target))return;
    waiting.add(target);
    target.setAttribute('aria-busy','true');
    load().then(()=>{if(target.isConnected)action();}).catch(()=>showFailure(target)).finally(()=>{waiting.delete(target);target.removeAttribute('aria-busy');});
  }
  function refreshFallback(){
    if(window.mmV13QuizUpdate)return;
    const text=document.documentElement.lang==='en'
      ? 'Hello, Pavel. I would like to discuss working with MARKOVMADE. What would be a good first step?'
      : 'Здравствуйте, Павел. Хочу обсудить работу с MARKOVMADE. Подскажите, с чего начать.';
    const telegram=document.getElementById('quiz-telegram-link'),whatsapp=document.getElementById('quiz-whatsapp-link');
    if(telegram)telegram.href='https://t.me/markovmade?text='+encodeURIComponent(text);
    if(whatsapp)whatsapp.href='https://wa.me/79819722516?text='+encodeURIComponent(text);
  }
  window.mmLoadContent=load;
  new MutationObserver(()=>{refreshFallback();failures.forEach(target=>showFailure(target));}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  refreshFallback();
  function warm(){if(!autoFailed)load().catch(()=>{});}
  addEventListener('scroll',()=>{if(scrollY>0)warm();},{passive:true});
  addEventListener('wheel',warm,{once:true,passive:true});
  addEventListener('touchmove',warm,{once:true,passive:true});
  document.addEventListener('focusin',event=>{if(event.target.closest('#contact,#personal-request,#services,#quick-faq,#biography,[data-privacy-toggle]'))warm();});
  document.addEventListener('click',event=>{
    if(ready)return;
    const target=event.target.closest('[data-privacy-toggle],#request-quiz button');
    if(!target||target.hasAttribute('data-content-retry'))return;
    event.preventDefault();event.stopImmediatePropagation();
    replay(target,()=>target.click());
  },true);
  document.addEventListener('submit',event=>{
    if(ready||event.target.id!=='manifest-form')return;
    event.preventDefault();event.stopImmediatePropagation();
    const form=event.target,submitter=event.submitter;
    replay(form,()=>form.requestSubmit(submitter?.isConnected?submitter:undefined));
  },true);
  if(location.hash)load().catch(()=>{});
})();
