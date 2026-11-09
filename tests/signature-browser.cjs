const assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const {startServer}=require('./browser-helpers.cjs');
(async()=>{
 const server=await startServer();
 try{
  for(const [name,type]of Object.entries({chromium,firefox,webkit})){
   const browser=await type.launch({headless:true,...(name==='firefox'?{firefoxUserPrefs:{'network.proxy.type':0}}:{proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}})});
   try{
    for(const lang of ['ru','en'])for(const touch of [false,true]){
     const page=await browser.newPage({viewport:{width:touch?320:1440,height:touch?568:900},hasTouch:touch,reducedMotion:'reduce'});
     await page.addInitScript(()=>{if(!localStorage.getItem('mm.theme'))localStorage.setItem('mm.theme','aurum-noir')});
     await page.goto(`${server.url}/?lang=${lang}&theme=aurum-noir`);
     await page.evaluate(async()=>{await mmLoadStyles();await mmLoadLanguage();await mmLanguageReady;});
     const opener=page.locator('.theme-switch:visible').first();
     const choose=async theme=>{
      const card=page.locator(`[data-theme-value="${theme}"]`);
      if(touch)await card.tap();else await card.click();
      assert.equal(await page.locator('#mm-theme-dialog').evaluate(el=>el.open),true,'card selection only previews');
      assert.equal(await page.evaluate(()=>localStorage.getItem('mm.theme')),'aurum-noir','preview does not persist');
      assert.equal(new URL(page.url()).searchParams.get('theme'),'aurum-noir','preview does not replace the URL');
      assert.equal(await card.getAttribute('aria-pressed'),'true');
     };
     await opener.click();await choose('clarity');
     await page.locator('[data-theme-cancel]').click();
     await page.waitForFunction(()=>document.documentElement.dataset.theme==='aurum-noir');
     assert.equal(await page.locator('html').getAttribute('data-theme'),'aurum-noir');
     assert.equal(await opener.evaluate(el=>document.activeElement===el),true);
     await opener.click();await choose('event-horizon');await page.keyboard.press('Escape');
     await page.waitForFunction(()=>document.documentElement.dataset.theme==='aurum-noir');
     assert.equal(await page.locator('html').getAttribute('data-theme'),'aurum-noir');
     await opener.click();await choose('clarity');
     await page.locator('[data-theme-apply]').click();
     await page.waitForFunction(()=>!document.querySelector('#mm-theme-dialog').open);
     assert.equal(await page.evaluate(()=>localStorage.getItem('mm.theme')),'clarity');
     assert.equal(await page.evaluate(()=>localStorage.getItem('markov-theme')),'light','legacy key remains compatible');
     assert.equal(new URL(page.url()).searchParams.get('theme'),'clarity');
     assert.equal(await opener.evaluate(el=>document.activeElement===el),true);
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
     await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'clarity');
     await page.close();
    }
    console.log(`${name}: RU/EN, keyboard/touch, preview/cancel/save, URL, legacy storage and focus passed`);
   }finally{await browser.close();}
  }
 }finally{await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
