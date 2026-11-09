/* Capture comparable real pages. The reference is the PR's fixed base commit;
   no visual baseline is accepted or rewritten by this script. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const {startServer,root}=require('./browser-helpers.cjs');
const output=path.join(root,'test-results/signature');
const base='2e0ead3';
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const server=await startServer(),browser=await chromium.launch({headless:true,proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}});
 const report=[];
 try{
  for(const stage of (process.env.SIGNATURE_STAGE?[process.env.SIGNATURE_STAGE]:['before','after']))for(const lang of ['ru','en'])for(const theme of ['aurum-noir','event-horizon','clarity'])for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:width===390?844:1000},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   if(stage==='before')for(const file of ['index.html','assets/dist/site.css','assets/dist/theme-system.js']){
    const body=execFileSync('git',['show',`${base}:${file}`],{cwd:root,maxBuffer:4*1024*1024});
    await page.route(file==='index.html'?'**/?*':`**/${file}`,r=>r.fulfill({body,contentType:file.endsWith('.css')?'text/css':file.endsWith('.js')?'application/javascript':'text/html'}));
   }
   await page.goto(`${server.url}/?lang=${lang}&theme=${theme}`);
   await page.evaluate(async()=>{await Promise.all([mmLoadStyles(),mmLoadLab(),mmLoadOS(),mmLoadContent(),mmLoadLanguage()]);await mmLanguageReady;await document.fonts.ready;});
   const prefix=`${stage}-${lang}-${theme}-${width}`;
   for(const [scene,selector]of [['hero','#hero'],['lab','#calculators .mm-lab-shell'],['os','#app-ecosystem .mm-os-frame'],['contact','#contact']]){
    await page.locator(selector).evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
    await page.waitForTimeout(150);
    await page.screenshot({path:path.join(output,`${prefix}-${scene}.png`)});
   }
   await page.evaluate(()=>scrollTo(0,0));
   await page.locator('.theme-switch:visible').first().click();
   if(stage==='after')await page.locator('.mm-theme-preview img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
   await page.screenshot({path:path.join(output,`${prefix}-studio.png`)});
   if(stage==='after'){
    assert.equal(await page.locator('.mm-theme-preview img').count(),3);
    const saved=await page.evaluate(()=>localStorage.getItem('mm.theme'));
    await page.locator('[data-theme-value="event-horizon"]').focus();
    assert.equal(await page.evaluate(()=>localStorage.getItem('mm.theme')),saved,'focus preview never writes storage');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('html').getAttribute('data-theme'),theme,'cancel restores URL/committed theme');
    assert.equal(await page.evaluate(()=>document.activeElement.matches('.theme-switch')),true);
    for(const w of [320,360,390,428,600,768,1024,1280,1440,1920,2560]){
     await page.setViewportSize({width:w,height:1000});
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${lang}/${theme}/${w}: page overflow`);
    }
   }
   assert.deepEqual(errors,[]);
   report.push({stage,lang,theme,width,scenes:5});await page.close();
   console.log(prefix);
  }
  // GitHub Pages serves 404 at arbitrary nested paths. Its absolute assets must
  // resolve and the stored theme must be available before the first paint.
  const page=await browser.newPage({viewport:{width:320,height:900},reducedMotion:'reduce'});
  await page.route('**/markovmade/assets/**',async r=>{
   const file=new URL(r.request().url()).pathname.replace('/markovmade/','');
   await r.fulfill({path:path.join(root,file)});
  });
  for(const theme of ['aurum-noir','event-horizon','clarity']){
   await page.goto(`${server.url}/404.html?theme=${theme}`);
   assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:path.join(output,`after-404-${theme}.png`),fullPage:true});
  }
  await page.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({base,comparisons:report},null,2));
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
