/* Real base/current renders, never an automatic baseline approval. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');const {startServer,root}=require('./browser-helpers.cjs');
const output=path.join(root,'test-results/polish');const base='9274897';
(async()=>{
 fs.mkdirSync(output,{recursive:true});const server=await startServer();
 const browser=await chromium.launch({headless:true,proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}});
 const page=await browser.newPage({reducedMotion:'reduce'}),cache=new Map(),report=[];
 let stage='before';
 await page.addInitScript(()=>localStorage.clear());
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url()),file=url.pathname==='/'?'index.html':url.pathname.slice(1);
  if(stage!=='before'||!['index.html'].includes(file)&&!file.startsWith('assets/dist/')&&!file.startsWith('assets/media/theme-previews/'))return route.continue();
  if(!cache.has(file))cache.set(file,execFileSync('git',['show',`${base}:${file}`],{cwd:root,maxBuffer:4*1024*1024}));
  await route.fulfill({body:cache.get(file),contentType:file.endsWith('.css')?'text/css':file.endsWith('.js')?'application/javascript':file.endsWith('.json')?'application/json':file.endsWith('.webp')?'image/webp':'text/html'});
 });
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function frame(selector){
  // Let content-visibility materialise the actual destination before framing it.
  for(let pass=0;pass<3;pass++){
   await page.locator(selector).first().evaluate(el=>scrollTo({top:Math.max(0,el.getBoundingClientRect().top+scrollY-104),behavior:'instant'}));
   await page.waitForTimeout(120);
  }
 }
 try{
  for(stage of (process.env.POLISH_STAGE?[process.env.POLISH_STAGE]:['before','after']))for(const lang of ['ru','en'])for(const theme of ['aurum-noir','event-horizon','clarity'])for(const width of [390,1440]){
   await page.setViewportSize({width,height:width===390?844:1000});
   await page.goto(`${server.url}/?theme=${theme}&lang=${lang}`);
   await page.evaluate(async()=>{await Promise.all([mmLoadStyles(),mmLoadLab(),mmLoadOS(),mmLoadContent(),mmLoadLanguage()]);await mmLanguageReady;await document.fonts.ready;});
   const prefix=`${stage}-${lang}-${theme}-${width}`;
   for(const [scene,selector]of [['hero','#hero'],['lab','#calculators .mm-lab-shell'],['os','#app-ecosystem .mm-os-product'],['services','#services'],['contact','#contact']]){
    await frame(selector);await page.screenshot({path:path.join(output,`${prefix}-${scene}.png`)});
   }
   await frame('#services');await page.locator('#services details>summary').first().click();await frame('#services details');
   await page.screenshot({path:path.join(output,`${prefix}-service-open.png`)});
   await page.evaluate(()=>scrollTo(0,0));await page.locator('#main-header').screenshot({path:path.join(output,`${prefix}-header.png`)});
   await page.locator('.theme-switch:visible').first().click();
   await page.locator('.mm-theme-preview img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
   await page.screenshot({path:path.join(output,`${prefix}-studio.png`)});await page.keyboard.press('Escape');
   // A calculation fixture produces real model output; no demo values are seeded.
   await page.locator('#mm-lab-tab-body').evaluate(el=>el.click());
   await page.locator('#lab-body-sex').selectOption('male');await page.locator('#lab-body-height').fill('180');
   await page.locator('#lab-body-weight').fill('80');await page.locator('#lab-body-bf').fill('15');
   await page.locator('[data-calc=body]').click();await frame('#app-ecosystem .mm-os-product');
   await page.screenshot({path:path.join(output,`${prefix}-os-filled.png`)});
   if(stage==='after'){
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${prefix}: no page overflow`);
    assert.equal(await page.locator('#mm-lab-clear-all').count(),1);
    assert.equal(await page.locator('.mm-lab-data-tools #mm-lab-clear-all').count(),1,'clear remains in data management');
    assert.equal(await page.locator('#mm-os-screen-today .mm-os-start').count(),1,'one primary LAB route');
   }
   report.push({stage,lang,theme,width,scenes:9});console.log(prefix);
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({base,captures:report},null,2));
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
