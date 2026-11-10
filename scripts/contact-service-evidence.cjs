const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {startServer}=require('../tests/browser-helpers.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const server=await startServer(),browser=await chromium.launch();
 const out=path.resolve('test-results/contact-service-corrections');fs.mkdirSync(out,{recursive:true});
 try{for(const lang of ['ru','en'])for(const theme of ['aurum-noir','event-horizon','clarity']){
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await page.goto(server.url+`/?lang=${lang}&theme=${theme}`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{await Promise.all([mmLoadStyles(),mmLoadContent(),mmLoadLanguage()]);await mmLanguageReady;await document.fonts.ready});
  assert.deepEqual(await page.locator('#services summary strong').allTextContents(),lang==='ru'?['Мужская трансформация','Женская трансформация','Менторство и коучинг']:['Men’s transformation','Women’s transformation','Mentorship and coaching']);
  await page.addStyleTag({content:'section{content-visibility:visible!important;contain-intrinsic-size:none!important}'});
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:1000});
   for(const id of ['services','contact']){
    const section=page.locator('#'+id);await section.scrollIntoViewIfNeeded();
    assert.ok(await section.evaluate(e=>e.scrollWidth<=e.clientWidth+1),`${lang}/${theme}/${width}/${id} fits`);
    if(id==='contact')assert.ok(await section.evaluate(e=>['::before','::after'].every(p=>{const s=getComputedStyle(e,p);return s.content==='none'||s.display==='none';})),'contact has no decorative drawing');
    if([390,1440].includes(width))await section.screenshot({path:path.join(out,`${lang}-${theme}-${id}-${width}.png`)});
   }
   await page.evaluate(()=>{window.contactType=[...document.querySelectorAll('#services *,#contact *')].filter(e=>e.matches('input,select,textarea,button')||[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>[e,e.style.fontSize,e.style.lineHeight,getComputedStyle(e).fontSize,getComputedStyle(e).lineHeight]);for(const[e,,,font,line]of contactType){e.style.fontSize=parseFloat(font)*2+'px';if(line!=='normal')e.style.lineHeight=parseFloat(line)*2+'px';}});
   for(const id of ['services','contact']){const layout=await page.locator('#'+id).evaluate(e=>({fits:e.scrollWidth<=e.clientWidth+1,overflow:[...e.querySelectorAll('*')].filter(n=>n.getClientRects().length&&n.scrollWidth>n.clientWidth+1).map(n=>({tag:n.tagName,class:n.className,width:n.clientWidth,scroll:n.scrollWidth})).slice(0,12)}));assert.ok(layout.fits,`${lang}/${theme}/${width}/${id} 200% text fits ${JSON.stringify(layout)}`);}
   await page.evaluate(()=>{for(const[e,font,line]of contactType){e.style.fontSize=font;e.style.lineHeight=line;}delete window.contactType});
  }
  await page.setViewportSize({width:320,height:1000});
  await page.locator('#contact>.mm-editorial-inner>.mm-contact-optional>summary').click();
  assert.equal(await page.locator('#contact #personal-request').count(),1);
  assert.ok(await page.locator('#contact').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'optional request stays in contact gutter');
  await page.close();
 }
 console.log('Targeted services/contact: exact RU/EN directions, three themes, four widths, normal/200% text, native optional form, contained layout and real screenshots passed.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
