/* Editorial interactions and the contact form enter on scroll/keyboard intent.
   The hero, themes, language and LAB/OS have their own independent owners. */
(function () {
  let pending, ready = false;
  const scripts=new Map();
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
    pending=Promise.all(['app-runtime','media-interactions','situation-quiz'].map(script)).then(()=>{ready=true;}).catch(error=>{pending=null;throw error;});
    return pending;
  }
  window.mmLoadContent=load;
  addEventListener('scroll',()=>{if(scrollY>0)load().catch(()=>{});},{passive:true});
  addEventListener('wheel',()=>load().catch(()=>{}),{once:true,passive:true});
  addEventListener('touchmove',()=>load().catch(()=>{}),{once:true,passive:true});
  document.addEventListener('focusin',event=>{if(event.target.closest('#contact,#services,#quick-faq,#biography'))load().catch(()=>{});});
  document.addEventListener('click',event=>{
    if(ready)return;
    const target=event.target.closest('[onclick],#situation-quiz button');
    if(!target)return;
    event.preventDefault();event.stopImmediatePropagation();
    load().then(()=>target.click()).catch(()=>{});
  },true);
  if(location.hash)load().catch(()=>{});
})();
