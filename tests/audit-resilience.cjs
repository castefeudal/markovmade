const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,firefox,webkit}=require('playwright');
const {startServer,root}=require('./browser-helpers.cjs');
(async()=>{const server=await startServer();
try{for(const[name,engine]of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true,...(name==='firefox'?{firefoxUserPrefs:{'network.proxy.type':0}}:{}),...(name==='webkit'?{proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}}:{})});
 try{const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.url);
 await page.evaluate(()=>localStorage.setItem('markovmade-lab-history-v1',JSON.stringify([{id:'broken',tool:'body',at:'invalid date',result:{}},{id:'valid',tool:'body',at:'2026-10-19T12:00:00Z',result:{bf:15,ffmi:22}}])));
 await page.evaluate(async()=>{await Promise.all([mmLoadLab(),mmLoadOS(),mmLoadLanguage()]);await mmLanguageReady;});
 assert.equal(await page.locator('#mm-lab-history-list li').count(),1,'corrupt history does not hide valid snapshots');
 await page.locator('#burger-btn').click();
 assert.equal(await page.locator('#main-header').evaluate(e=>e.inert),true,'modal isolates header controls');
 await page.keyboard.press('Shift+Tab');assert.equal(await page.locator('#mobile-menu').evaluate(e=>e.contains(document.activeElement)),true);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#main-header').evaluate(e=>e.inert),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'burger-btn');
 const before=await page.evaluate(()=>localStorage.getItem('markovmade-lab-v1'));
 await page.locator('#mm-lab-import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schema:'markovmade-lab-export-v1',lab:{profile:{weight:1}},history:[{id:'bad',tool:'body',at:'invalid',result:{}}]}))});
 await page.waitForFunction(()=>document.getElementById('mm-lab-data-status').textContent.includes('не распознан'));
 assert.equal(await page.evaluate(()=>localStorage.getItem('markovmade-lab-v1')),before,'invalid backup leaves stored profile untouched');
 await page.locator('#lab-body-sex').selectOption('male');await page.locator('#lab-body-bf-source').selectOption('dexa');await page.locator('#lab-body-height').fill('188');await page.locator('#lab-body-weight').fill('100');await page.locator('#lab-body-bf').fill('15');
 await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='markovmade-lab-history-v1')throw new DOMException('Full','QuotaExceededError');return original.call(this,key,value);};document.querySelector('[data-calc="body"]').click();});
 await page.waitForFunction(()=>document.getElementById('mm-lab-data-status').textContent.includes('история не сохранена'));
 await page.locator('#main-header .mm-header-mobile-controls [data-lang-toggle]').first().focus();await page.locator('#main-header .mm-header-mobile-controls [data-lang-toggle]').first().click();await page.evaluate(()=>mmLanguageReady);
 const task=page.locator('.mm-app-task').first();await task.click();assert.equal(await task.locator('em').textContent(),'done');
 await page.locator('#main-header .mm-header-mobile-controls [data-lang-toggle]').first().focus();await page.locator('#main-header .mm-header-mobile-controls [data-lang-toggle]').first().click();await page.evaluate(()=>mmLanguageReady);assert.equal(await task.locator('em').textContent(),'готово');
 await task.click();assert.equal(await task.locator('em').textContent(),'сейчас');
 assert.deepEqual(errors,[],name+' audited edge cases produce no runtime errors');
 fs.mkdirSync(root+'/test-results/audit',{recursive:true});
 if(name==='chromium'){await page.goto(server.url);await page.evaluate(async()=>{await Promise.all([mmLoadStyles(),mmLoadLab(),mmLoadOS(),mmLoadContent()]);await document.fonts.ready;});for(const width of [390,1440]){await page.setViewportSize({width,height:900});for(const id of ['hero','services','calculators','app-ecosystem','about','contact']){await page.locator('#'+id).scrollIntoViewIfNeeded();await page.waitForTimeout(250);await page.screenshot({path:root+'/test-results/audit/'+id+'-'+width+'.png'});}}}
 await page.close();console.log(name+': corrupt history, atomic invalid import, quota feedback, mobile modal and bilingual task states passed');
 }finally{await browser.close();}
}}finally{await server.close();}})().catch(e=>{console.error(e);process.exitCode=1});






