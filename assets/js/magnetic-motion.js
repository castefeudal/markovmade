/* One presentation scheduler. No storage, networking, model access or click replay. */
(function(){
 'use strict';
 const root=document.documentElement,header=document.getElementById('main-header'),nav=header?.querySelector('nav'),indicator=header?.querySelector('.mm-nav-indicator');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 const connection=navigator.connection,animations=new Map(),decorated=new WeakSet(),surfaceStates=new Map(),digests=new WeakMap();
 const actions='.mm-primary-cta,.mm-secondary-cta,.mm-editorial-cta,.mm-lab-primary,.mm-lab-secondary,.mm-lab-clear,.mm-lab-tab,.mm-os-tab,[data-mode],.mm-lab-segment button,.mm-toolkit-favorite,.mm-quick-btn,.theme-switch,.lang-switch,[data-theme-value],#main-header a[href="#contact"],.lead-action,.contact-btn';
 const surfaces='#services details>summary,.contact-value-card,#community .mm-community-card,#proof-system .mm-trust-card,#app-ecosystem .mm-os-product';
 let frame=0,frames=0,reads=0,cache=new WeakMap(),activeSurface=null,hoverLink=null,focusLink=null,lastAction=0,lastType='mouse',themeTransition=null,themeOpener=null,sceneObserver;
 let origin={x:innerWidth/2,y:60},haloTarget=0;
 const point=(value=0)=>({value,target:value,velocity:0});
 const fieldX=point(),fieldY=point(),indX=point(),indS=point(1),haloX=point(),haloY=point();
 const halo=document.createElement('div');halo.className='mm-context-halo';halo.setAttribute('aria-hidden','true');document.body.append(halo);
 const saveData=()=>Boolean(connection?.saveData||root.hasAttribute('data-save-data'));
 const canMove=()=>!reduced.matches&&!saveData()&&!document.hidden&&(!navigator.deviceMemory||navigator.deviceMemory>=4);
 const physics=()=>canMove()&&fine.matches&&lastType==='mouse'&&(!navigator.deviceMemory||navigator.deviceMemory>=4);
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function rect(el){if(!cache.has(el)){reads++;cache.set(el,el.getBoundingClientRect());}return cache.get(el);}
 function invalidate(){cache=new WeakMap();}
 function step(p){p.velocity=(p.velocity+(p.target-p.value)*.16)*.7;p.value+=p.velocity;if(Math.abs(p.target-p.value)+Math.abs(p.velocity)<.015){p.value=p.target;p.velocity=0;return false;}return true;}
 function schedule(){if(!frame&&!document.hidden)frame=requestAnimationFrame(render);}
 function visual(el,kind){if(!el||decorated.has(el))return;decorated.add(el);el.dataset.mmSurface=kind;const light=document.createElement('i');light.className='mm-surface-light';light.setAttribute('aria-hidden','true');el.append(light);}
 function discover(scope=document){scope.querySelectorAll(actions).forEach(el=>visual(el,'action'));scope.querySelectorAll(surfaces).forEach(el=>visual(el,'card'));}
 function currentLink(){return hoverLink||focusLink||header?.querySelector('.nav-link[aria-current="location"]');}
 function placeIndicator(){
  if(!indicator||!nav||!fine.matches)return;
  const link=currentLink();
  if(!link){indicator.style.opacity='0';return;}
  const n=rect(nav),r=rect(link);indX.target=r.left-n.left;indS.target=r.width/100;indicator.style.opacity='1';
  if(!canMove()){indX.value=indX.target;indS.value=indS.target;renderIndicator();}else schedule();
 }
 function renderIndicator(){if(indicator)indicator.style.transform=`translate3d(${indX.value.toFixed(3)}px,0,0) scaleX(${indS.value.toFixed(4)})`;}
 function resetSurface(){if(activeSurface){const s=surfaceStates.get(activeSurface);if(s){s.x.target=0;s.y.target=0;s.inside=false;}activeSurface=null;}haloTarget=0;}
 function reset(){hoverLink=null;fieldX.target=0;fieldY.target=0;resetSurface();header?.style.setProperty('--mm-field-light','.32');placeIndicator();schedule();}
 function stop(){if(frame)cancelAnimationFrame(frame);frame=0;[fieldX,fieldY].forEach(p=>{p.target=p.value=p.velocity=0});surfaceStates.forEach((s,el)=>{el.style.removeProperty('--mm-action-x');el.style.removeProperty('--mm-action-y');el.style.removeProperty('--mm-light-opacity');});surfaceStates.clear();activeSurface=null;hoverLink=null;haloTarget=0;halo.style.opacity='0';header?.style.setProperty('--mm-field-x','0');header?.style.setProperty('--mm-field-y','0');header?.removeAttribute('data-mm-nav-ready');animations.forEach(a=>a.cancel());animations.clear();themeTransition?.skipTransition();placeIndicator();}
 function render(){
  frame=0;frames++;let moving=false;
  for(const p of [fieldX,fieldY,indX,indS,haloX,haloY])moving=step(p)||moving;
  if(header){header.style.setProperty('--mm-field-x',fieldX.value.toFixed(3));header.style.setProperty('--mm-field-y',fieldY.value.toFixed(3));}
  renderIndicator();
  surfaceStates.forEach((s,el)=>{
   let changing=false;for(const p of [s.x,s.y,s.lightX,s.lightY])changing=step(p)||changing;
   el.style.setProperty('--mm-action-x',s.x.value.toFixed(3));el.style.setProperty('--mm-action-y',s.y.value.toFixed(3));el.style.setProperty('--mm-light-x',s.lightX.value.toFixed(2)+'px');el.style.setProperty('--mm-light-y',s.lightY.value.toFixed(2)+'px');el.style.setProperty('--mm-light-opacity',s.inside?'1':'0');
   if(!changing&&!s.inside){surfaceStates.delete(el);s.observed&&resize?.unobserve(el);}moving=changing||moving;
  });
  halo.style.transform=`translate3d(${(haloX.value-38).toFixed(2)}px,${(haloY.value-38).toFixed(2)}px,0)`;halo.style.opacity=String(haloTarget);
  if(moving&&canMove())schedule();
 }
 function pointer(event){
  lastType=event.pointerType||'mouse';if(!physics()){stop();return;}
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  const inForm=target.closest('input,textarea,select,[contenteditable=true]');
  const link=target.closest('#main-header .nav-link');if(hoverLink!==link){hoverLink=link;placeIndicator();}
  const inHeader=target.closest('#main-header>.container');
  if(inHeader){const r=rect(inHeader);fieldX.target=clamp((event.clientX-r.left-r.width/2)/(r.width/2)*4,-4,4);fieldY.target=clamp((event.clientY-r.top-r.height/2)/(r.height/2)*3,-3,3);header.setAttribute('data-mm-nav-ready','');header.style.setProperty('--mm-field-light','.78');}
  else{fieldX.target=0;fieldY.target=0;header?.style.setProperty('--mm-field-light','.32');}
  let surface=!inForm&&(target.closest(actions)||target.closest(surfaces)||link);
  if(surface?.matches(':disabled,[aria-disabled=true]'))surface=null;
  if(surface!==activeSurface){resetSurface();activeSurface=surface||null;}
  if(surface){
   if(!surface.matches('.nav-link'))visual(surface,surface.matches(actions)?'action':'card');
   const r=rect(surface);let s=surfaceStates.get(surface);if(!s){s={x:point(),y:point(),lightX:point(r.width/2),lightY:point(r.height/2),inside:true,observed:Boolean(resize)};surfaceStates.set(surface,s);resize?.observe(surface);}
   const nx=clamp((event.clientX-r.left)/Math.max(1,r.width),0,1),ny=clamp((event.clientY-r.top)/Math.max(1,r.height),0,1),power=surface.matches('.nav-link')?2:surface.dataset.mmSurface==='card'?1.4:3;
   s.x.target=(nx-.5)*power*2;s.y.target=(ny-.5)*power*2;s.lightX.target=nx*r.width;s.lightY.target=ny*r.height;s.inside=true;
   if(!haloTarget){haloX.value=event.clientX;haloY.value=event.clientY;}haloTarget=surface.dataset.mmSurface==='card'?.24:.4;haloX.target=event.clientX;haloY.target=event.clientY;
  }
  origin={x:event.clientX,y:event.clientY};schedule();
 }
 const resize='ResizeObserver'in window?new ResizeObserver(invalidate):null;
 if(header)resize?.observe(header);if(nav)resize?.observe(nav);
 document.addEventListener('pointermove',pointer,{passive:true});
 document.documentElement.addEventListener('pointerleave',reset,{passive:true});
 document.addEventListener('pointerout',event=>{if(!event.relatedTarget)reset();},{passive:true});
 document.addEventListener('pointerdown',event=>{if(event.target.closest?.('.theme-switch'))themeOpener=event.target.closest('.theme-switch');lastType=event.pointerType||'mouse';origin={x:event.clientX,y:event.clientY};if(lastType!=='mouse')stop();},{passive:true});
 document.addEventListener('focusin',event=>{if(event.target.matches?.('.theme-switch'))themeOpener=event.target;focusLink=event.target.closest?.('#main-header .nav-link')||null;placeIndicator();});
 document.addEventListener('focusout',()=>{focusLink=null;queueMicrotask(placeIndicator);});
 addEventListener('scroll',invalidate,{passive:true});addEventListener('resize',()=>{invalidate();placeIndicator();},{passive:true});
 document.fonts?.addEventListener('loadingdone',()=>{invalidate();placeIndicator();});
 function animate(node,frames,options){
  if(!node||!canMove()||!node.animate)return;
  animations.get(node)?.cancel();const a=node.animate(frames,{duration:420,easing:'cubic-bezier(.16,1,.3,1)',...options});animations.set(node,a);a.finished.catch(()=>{}).then(()=>{if(animations.get(node)===a)animations.delete(node);});return a;
 }
 function reveal(node,distance=10,duration=460,kind='rise'){
  if(!node||!canMove())return;
  const start=kind==='lateral'?`translate3d(${distance}px,0,0)`:`translate3d(0,${distance}px,0)`;
  return animate(node,[{opacity:.72,transform:start},{opacity:1,transform:'translate3d(0,0,0)'}],{duration});
 }
 function scenes(){
  if(sceneObserver||!canMove()||!('IntersectionObserver'in window))return;
  sceneObserver=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;sceneObserver.unobserve(e.target);if(e.boundingClientRect.top<80)continue;const section=e.target.closest('section[id]')?.id||'';const lateral=/services|biography|about/.test(section);reveal(e.target,lateral?12:16,section==='method-proof'?620:520,lateral?'lateral':'rise');}},{threshold:.12,rootMargin:'0px 0px -24px 0px'});
  document.querySelectorAll('.mm-editorial-head,#proof-system .mm-trust-card,#method-proof .mm-editorial-step,#about .mm-author-purpose,#community .mm-community-card,.mm-os-story').forEach(el=>sceneObserver.observe(el));
 }
 function resultGlint(el){
  if(!el||el.closest('[hidden]')||performance.now()-lastAction>2200)return;
  const text=el.textContent.trim();if(!text||digests.get(el)===text)return;digests.set(el,text);
  let light=el.querySelector(':scope>.mm-result-glint');if(!light){light=document.createElement('i');light.className='mm-result-glint';light.setAttribute('aria-hidden','true');el.append(light);}
  animate(light,[{opacity:0,transform:'translate3d(-110%,0,0)'},{opacity:.6,offset:.3},{opacity:0,transform:'translate3d(110%,0,0)'}],{duration:560});
 }
 let queued=false;const entered=new Set(),results=new Set();
 function flush(){queued=false;discover();for(const el of entered){if(el.isConnected&&!el.hidden&&!el.closest('[hidden]')&&(el.matches('.mm-os-screen')?el.classList.contains('active'):true))reveal(el,el.matches('.mm-os-screen')?7:9,320);}entered.clear();results.forEach(resultGlint);results.clear();}
 new MutationObserver(records=>{
  let changed=false;
  for(const r of records){const el=r.target.nodeType===1?r.target:r.target.parentElement;if(!el)continue;
   if(r.type==='attributes'){
    if(r.attributeName==='aria-current'&&el.matches('#main-header .nav-link'))placeIndicator();
    if(el===root&&(r.attributeName==='lang'||r.attributeName==='data-theme'||r.attributeName==='data-section-styles-ready')){invalidate();changed=true;}
    if(el.matches('[data-mm-lab-panel],.mm-os-screen,[data-pro]')&&(r.attributeName==='hidden'||r.attributeName==='class')){entered.add(el);changed=true;}
   }else if(r.type==='childList'||r.type==='characterData'){
    const result=el.closest('.mm-lab-result,.mm-toolkit-outcome,.mm-os-connected-decision');if(result){results.add(result);changed=true;}
    if(r.type==='childList'&&[...r.addedNodes].some(n=>n.nodeType===1&&!n.matches('.mm-surface-light,.mm-result-glint'))){changed=true;}
   }
  }
  if(changed&&!queued){queued=true;requestAnimationFrame(flush);}
 }).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','class','aria-current','lang','data-theme','data-section-styles-ready']});
 new MutationObserver(()=>{invalidate();placeIndicator();if(!canMove())stop();}).observe(root,{attributes:true,attributeFilter:['lang','data-theme','data-save-data']});
 document.addEventListener('click',event=>{lastAction=performance.now();const tab=event.target.closest('[data-mm-lab-tab],[data-app-tab]');if(tab)requestAnimationFrame(()=>{const id=tab.getAttribute('aria-controls'),panel=document.getElementById(id);if(panel&&!panel.hidden)reveal(panel,7,300);});},true);
 document.addEventListener('submit',()=>{lastAction=performance.now();},true);
 document.addEventListener('toggle',event=>{if(event.target instanceof HTMLDetailsElement&&event.target.open)reveal(event.target.querySelector(':scope>.mm-service-editorial-body,:scope>.mm-timeline-content,:scope>.mm-progress-workspace'),8,360);},true);
 function theme(paint){
  if(!physics()||!document.startViewTransition){paint();return;}
  themeTransition?.skipTransition();
  const transition=document.startViewTransition(paint);themeTransition=transition;
  const {x,y}=origin,r=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
  transition.ready.then(()=>{
   if(!canMove()){transition.skipTransition();return;}
   root.animate([{clipPath:`circle(0px at ${x}px ${y}px)`},{clipPath:`circle(${r}px at ${x}px ${y}px)`}],{duration:440,easing:'cubic-bezier(.16,1,.3,1)',pseudoElement:'::view-transition-new(root)'});
  }).catch(()=>{});
  transition.finished.catch(()=>{}).then(()=>{if(themeTransition===transition)themeTransition=null;});
 }
 // Firefox can discard a dialog's restored focus when its root snapshot ends.
 // Repair only lost/body or now-closed-dialog focus, never a user's new target.
 document.addEventListener('close',event=>{
  if(event.target.id!=='mm-theme-dialog')return;
  const dialog=event.target,opener=themeOpener||[...document.querySelectorAll('.theme-switch')].find(el=>el.getClientRects().length);
  const restore=()=>{const active=document.activeElement;if(!dialog.open&&opener?.isConnected&&(!active||active===document.body||dialog.contains(active)))opener.focus({preventScroll:true});};
  queueMicrotask(()=>{if(themeTransition)themeTransition.finished.catch(()=>{}).then(restore);else restore();});
 },true);
 function preference(){stop();scenes();if(physics())header?.setAttribute('data-mm-nav-ready','');}
 reduced.addEventListener('change',preference);fine.addEventListener('change',preference);connection?.addEventListener?.('change',()=>{root.toggleAttribute('data-save-data',Boolean(connection.saveData));preference();});
 if(connection?.saveData)root.setAttribute('data-save-data','');
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 addEventListener('pagehide',()=>{stop();sceneObserver?.disconnect();resize?.disconnect();});
 addEventListener('pageshow',event=>{if(event.persisted){invalidate();sceneObserver=null;if(header)resize?.observe(header);if(nav)resize?.observe(nav);preference();}});
 window.MarkovMadeMotion={theme,point:pointer,reveal,discover,scenes,inspect:()=>({enabled:physics(),themeActive:Boolean(themeTransition),animationCount:animations.size,framePending:Boolean(frame),frames,geometryReads:reads,activeSurfaces:surfaceStates.size,header:{x:fieldX.value,y:fieldY.value},indicator:{x:indX.value,scale:indS.value,target:currentLink()?.getAttribute('href')||null}})};
 focusLink=document.activeElement?.closest?.('#main-header .nav-link')||null;discover();scenes();placeIndicator();
 if(physics())header?.setAttribute('data-mm-nav-ready','');
 // Readable first paint is already complete. This finite optical entrance never
 // masks the portrait or the numerical data and is not in the cold-load path.
 const title=document.querySelector('#hero h1');if(title&&!root.dataset.mmHeroEntrance&&canMove()){root.dataset.mmHeroEntrance='true';reveal(title,8,580);document.querySelectorAll('#hero .mm-primary-cta,#hero .mm-secondary-cta').forEach((el,i)=>reveal(el,5,360+i*60));}
})();
