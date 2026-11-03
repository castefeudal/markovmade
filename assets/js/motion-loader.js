/* Intent-only presentation. No font, section geometry or animation loop at boot. */
(function(){
  let pending;
  function load(){
    if(pending)return pending;
    pending=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='assets/js/magnetic-motion.js';script.onload=()=>resolve(window.MarkovMadeMotion);script.onerror=()=>{pending=null;script.remove();reject(new Error('Motion enhancement unavailable'));};document.body.append(script);});
    return pending;
  }
  window.mmLoadMotion=load;
  const intent=event=>{load().then(motion=>{if(event.type==='pointermove'&&event.pointerType==='mouse')motion?.point(event);}).catch(()=>{});};
  addEventListener('pointermove',intent,{passive:true,once:true});
  addEventListener('scroll',intent,{passive:true,once:true});
  document.addEventListener('focusin',intent,{once:true});
  document.addEventListener('pointerdown',intent,{passive:true,once:true});
})();
