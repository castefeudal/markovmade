const assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const {startServer}=require('./browser-helpers.cjs');
(async()=>{const server=await startServer();try{
 for(const [name,engine]of Object.entries({chromium,firefox,webkit})){
  const browser=await engine.launch({headless:true,...(name==='firefox'?{firefoxUserPrefs:{'network.proxy.type':0}}:{}),...(name==='webkit'?{proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}}:{})});
  try{for(const lang of ['ru','en'])for(const theme of ['aurum-noir','event-horizon','clarity']){
   const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
   await page.goto(server.url+`/?lang=${lang}&theme=${theme}`);
   const initialReads=await page.evaluate(async()=>{let reads=0;const targets=[...document.querySelectorAll('#main-header nav a[href^="#"]')].map(link=>document.querySelector(link.hash)).filter(Boolean),originals=targets.map(target=>target.getBoundingClientRect);targets.forEach((target,i)=>target.getBoundingClientRect=function(){reads++;return originals[i].call(this);});dispatchEvent(new Event('scroll'));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));targets.forEach((target,i)=>target.getBoundingClientRect=originals[i]);return reads;});
   assert.equal(initialReads,0,'zero-position bootstrap scroll never measures off-screen navigation targets');
   async function viewport(width,height){await page.setViewportSize({width,height});const actual=await page.evaluate(()=>document.documentElement.clientWidth);if(actual!==width)await page.setViewportSize({width:Math.floor(width*width/actual),height:Math.round(height*width/actual)});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(await page.evaluate(()=>document.documentElement.clientWidth),width);}await viewport(1440,900);await page.evaluate(async()=>{await Promise.all([mmLoadLab(),mmLoadOS(),mmLoadContent(),mmLoadLanguage(),mmLoadStyles()]);await window.mmLanguageReady;await document.fonts.ready;});
   async function current(id){
    try{await page.waitForFunction(id=>{
     const desktop=[...document.querySelectorAll('#main-header nav a[aria-current="location"]')],mobile=[...document.querySelectorAll('#mobile-menu nav a[aria-current="location"]')];
     const matches=id?desktop.length===1&&mobile.length===1&&desktop[0].hash==='#'+id&&mobile[0].hash==='#'+id:desktop.length===0&&mobile.length===0;
     window.__qaNavStable=matches?(window.__qaNavExpected===id?window.__qaNavStable+1:1):0;window.__qaNavExpected=id;
     return window.__qaNavStable>=3;
    },id);}catch(error){console.error(name,lang,theme,'expected',id,await page.evaluate(()=>({y:scrollY,links:[...document.querySelectorAll('#main-header nav a[href^="#"]')].map(a=>({href:a.hash,current:a.getAttribute('aria-current'),top:document.querySelector(a.hash).getBoundingClientRect().top}))})));throw error;}
   }
   async function scrollToSection(id){await page.locator('#'+id).evaluate(async el=>{el.scrollIntoView({behavior:'instant',block:'start'});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));el.scrollIntoView({behavior:'instant',block:'start'});});await current(id);}
   for(const id of ['services','calculators','about','community','app-ecosystem','contact']){
    await scrollToSection(id);
    assert.ok(await page.locator('#main-header').evaluate(el=>el.getBoundingClientRect().top>=-1),'desktop navigation remains visible while scrolling');
   }
   // An ordinary wheel scroll inside a long tool section must keep its location.
   await scrollToSection('calculators');await page.mouse.wheel(0,600);await current('calculators');
   await scrollToSection('services');
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await current('');
   await page.locator('#main-header nav a[href="#app-ecosystem"]').click();await current('app-ecosystem');
   await viewport(390,844);await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await current('contact');await page.evaluate(()=>scrollBy({top:-2,behavior:'instant'}));await page.locator('#burger-btn').click();await current('contact');await page.keyboard.press('Escape');
   await page.locator('#hero').evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));await current('');
   await page.close();
  }console.log('Current-section navigation verified: '+name+' · RU/EN × three themes · anchors, wheel, reverse scroll, resize, mobile menu and page end.');}finally{await browser.close();}
 }
}finally{await server.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
