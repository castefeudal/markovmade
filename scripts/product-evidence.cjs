const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {chromium}=require('playwright');
const {startServer}=require('../tests/browser-helpers.cjs');
(async()=>{
 const stage=process.argv[2];if(!['before','after'].includes(stage))throw Error('Use before or after');
 const out=path.resolve('docs/product-excellence',stage);fs.mkdirSync(out,{recursive:true});
 const server=await startServer(),browser=await chromium.launch();
 try{for(const width of[390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  if(stage==='before')await page.route(/^http:\/\/127\.0\.0\.1/,async route=>{
   const file=new URL(route.request().url()).pathname.slice(1)||'index.html';
   if(file==='index.html'||file.startsWith('assets/dist/')){
    const body=cp.execFileSync('git',['show','3f00e9d1fbe7ee3f182ae45b5b1c91aabc4bc45a:'+file],{maxBuffer:8e6});
    await route.fulfill({body,contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8'});
   }else await route.continue();
  });
  await page.goto(server.url,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{await Promise.all([mmLoadLab(),mmLoadOS(),mmLoadContent(),mmLoadStyles()]);await document.fonts.ready});
  await page.addStyleTag({content:'*{content-visibility:visible!important;scroll-behavior:auto!important}'});
  for(const id of['hero','calculators','app-ecosystem','services']){
   const section=page.locator('#'+id);
   await section.locator('h1,h2').first().scrollIntoViewIfNeeded();
   await section.evaluate(async el=>{el.scrollIntoView({block:'start',behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));el.scrollIntoView({block:'start',behavior:'instant'});});
   await page.screenshot({path:path.join(out,id+'-'+width+'.png')});
  }await page.close();
 }}finally{await browser.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
