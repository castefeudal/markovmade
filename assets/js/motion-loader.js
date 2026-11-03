/* Intent-only presentation. No font, section geometry or animation loop at boot. */
(function(){
  let pending,lastPointer;
  const remember=event=>{lastPointer=event;},leave=()=>{lastPointer=null;};
  // Only retain the newest native event while the optional module is in flight.
  // Replaying the first event would leave the shell displaced after a quick exit.
  addEventListener('pointermove',remember,{passive:true});
  addEventListener('pointerdown',remember,{passive:true});
  document.documentElement.addEventListener('pointerleave',leave,{passive:true});
  addEventListener('blur',leave);
  function load(){
    if(pending)return pending;
    pending=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='assets/js/magnetic-motion.js';script.onload=()=>{
      const motion=window.MarkovMadeMotion,event=lastPointer;lastPointer=null;
      removeEventListener('pointermove',remember);removeEventListener('pointerdown',remember);
      document.documentElement.removeEventListener('pointerleave',leave);removeEventListener('blur',leave);
      if(event)motion?.point(event);resolve(motion);
    };script.onerror=()=>{pending=null;script.remove();reject(new Error('Motion enhancement unavailable'));};document.body.append(script);});
    return pending;
  }
  window.mmLoadMotion=load;
  const intent=()=>{load().catch(()=>{});};
  addEventListener('pointermove',intent,{passive:true,once:true});
  addEventListener('scroll',intent,{passive:true,once:true});
  document.addEventListener('focusin',intent,{once:true});
  document.addEventListener('pointerdown',intent,{passive:true,once:true});
})();
