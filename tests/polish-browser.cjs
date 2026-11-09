const assert=require('node:assert/strict');const {chromium,firefox,webkit}=require('playwright');
const {startServer}=require('./browser-helpers.cjs');
const widths=[320,360,390,428,600,768,1024,1280,1440,1920,2560];
const luminance=s=>s.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0);
(async()=>{const server=await startServer();try{
 for(const [name,type]of Object.entries({chromium,firefox,webkit})){
  const browser=await type.launch({headless:true,...(name==='firefox'?{firefoxUserPrefs:{'network.proxy.type':0}}:{proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}})});
  try{for(const lang of ['ru','en'])for(const theme of ['aurum-noir','event-horizon','clarity']){
   const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`${server.url}/?lang=${lang}&theme=${theme}`);
   await page.evaluate(async()=>{await Promise.all([mmLoadStyles(),mmLoadLab(),mmLoadOS(),mmLoadLanguage()]);await mmLanguageReady;await document.fonts.ready;});
   assert.equal(await page.locator('.mm-lab-data-tools #mm-lab-clear-all').count(),1,'destructive action belongs to data management');
   assert.equal(await page.locator('.mm-lab-topbar #mm-lab-clear-all').count(),0);
   assert.equal(await page.locator('#app-ecosystem .mm-os-frame').evaluate(e=>e.hasAttribute('data-empty')),true,'empty state is explicit');
   assert.equal(await page.locator('#mm-os-screen-today .mm-os-start').count(),1);
   assert.equal(await page.locator('#mm-os-screen-today .mm-os-today-grid').isVisible(),false,'empty state does not repeat placeholder cards');
   for(const width of widths){
    await page.setViewportSize({width,height:1000});const measured=await page.evaluate(()=>document.documentElement.clientWidth);if(measured!==width)await page.setViewportSize({width:Math.round(width*width/measured),height:Math.round(1000*width/measured)});for(let retry=0;retry<3;retry++){const actual=await page.evaluate(()=>document.documentElement.clientWidth);if(actual===width)break;const box=page.viewportSize();await page.setViewportSize({...box,width:box.width+(actual>width?-1:1)});}assert.equal(await page.evaluate(()=>document.documentElement.clientWidth),width);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),`${name}/${lang}/${theme}/${width}: page fits`);
    if(width<=428){
     const distance=await page.locator('#lab-body-height').evaluate(e=>e.getBoundingClientRect().top-document.querySelector('#calculators').getBoundingClientRect().top);
     assert.ok(distance<900,`${name}/${lang}/${theme}/${width}: inputs are reached without a long introduction (${distance})`);
    }
    if(width>=600&&width<=1024){
     const cards=await page.locator('#contact .contact-value-card').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
     assert.ok(Math.abs(cards[0].top-cards[1].top)<2&&cards[2].top>cards[0].top&&cards[2].width>cards[0].width*1.7,`${name}/${theme}/${width}: contact uses a readable 2+1 composition`);
    }
    if(width<=1439)assert.equal(await page.locator('#mm-quick-actions').isVisible(),false,'utility dock is absent where the reading gutter is too narrow');
    else{
     const gutter=await page.locator('#mm-quick-actions').evaluate(el=>({left:el.getBoundingClientRect().left,right:document.querySelector('#main-header>.container').getBoundingClientRect().right}));
     assert.ok(gutter.left>=gutter.right-1,`${name}/${lang}/${theme}/${width}: utilities stay outside the reading column ${JSON.stringify(gutter)}`);
    }
    // Text-only enlargement: preserve rem layout lengths and restore every
    // existing inline value afterwards, so responsive samples stay independent.
    await page.evaluate(()=>{window.polishTextSizes=[...document.querySelectorAll('body *')].filter(el=>!['SCRIPT','STYLE','TITLE','DESC'].includes(el.tagName)&&(el.matches('input,select,textarea,button')||[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))).map(el=>[el,el.style.fontSize,el.style.lineHeight,getComputedStyle(el).fontSize,getComputedStyle(el).lineHeight]);for(const[el,,,font,line]of polishTextSizes){el.style.fontSize=parseFloat(font)*2+'px';if(line!=='normal')el.style.lineHeight=parseFloat(line)*2+'px';}});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),`${name}/${lang}/${theme}/${width}: 200% text fits page`);
    for(const selector of ['#hero','#mm-lab-body','#mm-os-screen-today']){
     const box=await page.locator(selector).evaluate(e=>({client:e.clientWidth,scroll:e.scrollWidth}));
     assert.ok(box.scroll<=box.client+2,`${name}/${lang}/${theme}/${width}: 200% text fits ${selector} ${JSON.stringify(box)}`);
    }
    await page.evaluate(()=>{for(const[el,font,line]of polishTextSizes){el.style.fontSize=font;el.style.lineHeight=line;}delete window.polishTextSizes;});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   }
   const colors=await page.locator('#lab-body-height').evaluate(e=>{const s=getComputedStyle(e);return{bg:s.backgroundColor,border:s.borderTopColor}});
   const a=luminance(colors.bg),b=luminance(colors.border);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=3,'input boundary has non-text AA contrast');
   await page.locator('#lab-body-sex').selectOption('male');await page.locator('#lab-body-height').fill('180');await page.locator('#lab-body-weight').fill('80');await page.locator('#lab-body-bf').fill('15');await page.locator('[data-calc=body]').click();
   await page.waitForFunction(()=>!document.querySelector('#app-ecosystem .mm-os-frame').hasAttribute('data-empty'));
   assert.equal(await page.locator('#mm-os-screen-today .mm-os-today-grid').isVisible(),true,'real results restore the detailed next-step dashboard');
   assert.deepEqual(errors,[]);await page.close();
  }console.log(`${name}: RU/EN × three worlds × 11 widths × normal/200% text, mobile entry, 2+1 contact, safe dock, empty/real OS and input boundaries passed`);}finally{await browser.close();}
 }
}finally{await server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
