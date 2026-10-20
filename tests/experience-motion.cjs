const assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const {startServer}=require('./browser-helpers.cjs');
(async()=>{const server=await startServer();try{for(const[name,engine]of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true,...(name==='firefox'?{firefoxUserPrefs:{'network.proxy.type':0}}:{}),...(name==='webkit'?{proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}}:{})});
 try{const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(server.url);await page.evaluate(()=>window.mmLoadContent());await page.bringToFront();await page.waitForFunction(()=>!document.hidden);
 // Record starts synchronously: a finite 360ms animation may finish before the
 // next WebDriver poll on a busy runner. The real animation is still required.
 await page.evaluate(()=>{const original=Element.prototype.animate;window.__disclosureAnimations=[];window.__holdDisclosure=false;Element.prototype.animate=function(frames,options){const animation=original.call(this,frames,options);if(this.matches('.mm-service-editorial-body')){window.__disclosureAnimations.push(animation);if(window.__holdDisclosure)animation.pause();}return animation;};});
 const summary=page.locator('#services details').first().locator('summary'),body=page.locator('#services details').first().locator('.mm-service-editorial-body');await summary.focus();await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.__disclosureAnimations.length>0);
 assert.equal(await summary.evaluate(el=>el===document.activeElement),true,name+': disclosure motion preserves keyboard focus');
 const timing=await page.evaluate(()=>window.__disclosureAnimations.at(-1).effect.getTiming());assert.equal(timing.iterations,1);assert.ok(timing.duration>0&&timing.duration<=750,name+': disclosure motion has a finite bounded duration');
 await page.waitForTimeout(750);assert.equal(await body.evaluate(el=>el.getAnimations().length),0,name+': disclosure motion settles');assert.equal(await page.evaluate(()=>window.__disclosureAnimations.at(-1).playState),'finished');
 // Hold the next real animation so preference cancellation cannot race its
 // natural finish. A missing animation or missing cancellation still fails.
 const before=await page.evaluate(()=>{window.__holdDisclosure=true;return window.__disclosureAnimations.length;});
 await summary.focus();await page.keyboard.press('Enter');await page.keyboard.press('Enter');await page.waitForFunction(count=>window.__disclosureAnimations.length>count,before);assert.ok(await body.evaluate(el=>el.getAnimations().length)>0);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.__disclosureAnimations.at(-1).playState==='idle');assert.equal(await body.evaluate(el=>el.getAnimations().length),0,name+': changing motion preference cancels current animation');
 const reducedCount=await page.evaluate(()=>window.__disclosureAnimations.length);await page.keyboard.press('Enter');await page.keyboard.press('Enter');await page.waitForTimeout(80);assert.equal(await body.evaluate(el=>el.getAnimations().length),0,name+': reduced motion opens immediately');assert.equal(await page.evaluate(()=>window.__disclosureAnimations.length),reducedCount,name+': reduced motion starts no new animation');
 await page.setViewportSize({width:320,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,name+': animated service fits 320px');assert.deepEqual(errors,[]);console.log('Experience motion verified: '+name+' · real animation start, finite finish, keyboard focus, live reduced-motion cancellation, 320px');
 }finally{await browser.close();}
 }}finally{await server.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
