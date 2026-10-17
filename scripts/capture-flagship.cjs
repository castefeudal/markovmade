const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {startServer,root}=require('../tests/browser-helpers.cjs');
// Review evidence only. Never promotes visual baselines or reads user browser data.
(async()=>{
 const server=await startServer(),browser=await chromium.launch({headless:true});
 const output=path.join(root,'test-results/ultimate/after');fs.mkdirSync(output,{recursive:true});
 try{for(const width of[390,1440]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce'});
  const page=await context.newPage();await page.goto(server.url+'/?lang=ru&theme=aurum-noir');await page.evaluate(()=>Promise.all([window.mmLoadLab(),window.mmLoadOS(),document.fonts.ready]));
  await page.addStyleTag({content:'html{scroll-behavior:auto;overflow-anchor:none}section{content-visibility:visible;contain-intrinsic-size:none}'});
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,`hero-viewport-${width}.png`)});
  // Fixed navigation is outside the section; hide it solely for isolated section captures.
  const style='header,.skip-link,.mm-quick-actions{visibility:hidden}';
  for(const id of['hero','proof-system','services','case-scenarios','method-proof','calculators','about','biography','team','app-ecosystem','quick-faq']){
   const node=page.locator('#'+id);if(!await node.count())continue;
   await node.scrollIntoViewIfNeeded();await page.waitForTimeout(250);
   await node.screenshot({path:path.join(output,`${id==='team'?'community':id}-${width}.png`),style});
  }
  await page.locator('[data-mm-lab-tab="progress"]').click();await page.locator('#mm-lab-daily>summary').click();
  await page.locator('#mm-lab-daily').screenshot({path:path.join(output,`progress-empty-${width}.png`),style});
  // Clearly marked deterministic QA fixture, never presented as a client result.
  await page.evaluate(()=>{const records=Array.from({length:28},(_,i)=>{const date=new Date();date.setDate(date.getDate()-27+i);return{date:[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-'),weight:84-i*.06,calories:2600,sleep:7.5,energy:7,adherence:90};});localStorage.setItem('markovmade-lab-daily-v1',JSON.stringify(records));dispatchEvent(new StorageEvent('storage',{key:'markovmade-lab-daily-v1'}));});
  await page.locator('#mm-progress-history>summary').click();await page.locator('[data-checkin-period="28"]').click();
  await page.locator('#mm-progress-history').screenshot({path:path.join(output,`progress-QA-fixture-${width}.png`),style});
  await context.close();
 }}finally{await browser.close();await server.close();}
 console.log('Flagship review screenshots: '+output);
})().catch(error=>{console.error(error);process.exitCode=1;});
