const assert=require('node:assert/strict');
const{chromium,firefox,webkit}=require('playwright');
const{startServer}=require('./browser-helpers.cjs');
(async()=>{const server=await startServer();try{for(const[name,engine]of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true,...(name==='firefox'?{firefoxUserPrefs:{'network.proxy.type':0}}:{}),...(name==='webkit'?{proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}}:{})});
 try{const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(server.url);await page.evaluate(()=>window.mmLoadContent());
 const summary=page.locator('#services details').first().locator('summary'),body=page.locator('#services details').first().locator('.mm-service-editorial-body');await summary.focus();await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('#services .mm-service-editorial-body').getAnimations().length>0);
 assert.equal(await summary.evaluate(el=>el===document.activeElement),true,name+': disclosure motion preserves keyboard focus');
 await page.waitForTimeout(750);assert.equal(await body.evaluate(el=>el.getAnimations().length),0,name+': disclosure motion settles');
 await summary.focus();await page.keyboard.press('Enter');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('#services .mm-service-editorial-body').getAnimations().length>0);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(80);assert.equal(await body.evaluate(el=>el.getAnimations().length),0,name+': changing motion preference cancels current animation');
 await page.keyboard.press('Enter');await page.keyboard.press('Enter');await page.waitForTimeout(80);assert.equal(await body.evaluate(el=>el.getAnimations().length),0,name+': reduced motion opens immediately');
 await page.setViewportSize({width:320,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,name+': animated service fits 320px');assert.deepEqual(errors,[]);console.log('Experience motion verified: '+name+' · finite disclosure, keyboard focus, live reduced-motion cancellation, 320px');
 }finally{await browser.close();}
 }}finally{await server.close();}})().catch(error=>{console.error(error);process.exitCode=1});
