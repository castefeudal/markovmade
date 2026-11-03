// Detail review of the final report geometry; values use the existing model fixture.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{startServer,root}=require('./browser-helpers.cjs');
(async()=>{const server=await startServer(),browser=await chromium.launch({proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}});try{
 const out=path.join(root,'test-results/visual-excellence/final-reports');fs.mkdirSync(out,{recursive:true});
 for(const lang of ['ru','en'])for(const theme of ['aurum-noir','event-horizon','clarity']){
  const page=await browser.newPage({viewport:{width:390,height:1000},reducedMotion:'reduce'});await page.goto(server.url+`/?lang=${lang}&theme=${theme}`);
  await page.evaluate(async()=>{await mmLoadLab();await mmLoadLanguage();await window.mmLanguageReady;MarkovMadeToolkit.open(MarkovMadeToolkit.tools.find(t=>t.id==='session'));});
  for(const[key,value]of Object.entries(require('./toolkit-fixtures.json').session)){const field=page.locator('#toolkit-session-'+key);await field.evaluate(el=>{const details=el.closest('details');if(details)details.open=true;});await field.fill(String(value));}
  await page.locator('#mm-toolkit-workspace button[type=submit]').click();assert.equal(await page.evaluate(()=>MarkovMadeLab.state.toolkit.session.result.data.performed),1307.5);
  for(const width of [320,360,390,428,600,768,1024,1280,1440,1920,2560]){await page.setViewportSize({width,height:1000});assert.ok(await page.locator('#mm-toolkit-workspace').evaluate(el=>el.scrollWidth<=el.clientWidth+2),`${lang}/${theme}/${width}`);}
  const report=page.locator('.mm-workout-report').first();await page.setViewportSize({width:320,height:1000});assert.equal(await report.getAttribute('tabindex'),'0');if(await report.evaluate(el=>el.scrollWidth>el.clientWidth)){await report.focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('.mm-workout-report').scrollLeft>0);await report.evaluate(el=>el.scrollLeft=0);}
  for(const width of [390,768,1440]){await page.setViewportSize({width,height:1000});await page.locator('.mm-workout-report').first().screenshot({style:'#main-header,#skip-to-main,#mm-scroll-progress,#mm-quick-actions{visibility:hidden}',path:path.join(out,`${lang}-${theme}-${width}.png`)});}
  await page.close();console.log('Final report: '+lang+'/'+theme+' · 11 widths');
 }
}finally{await browser.close();await server.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
