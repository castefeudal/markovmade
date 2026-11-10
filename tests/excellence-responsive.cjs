const assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const {startServer}=require('./browser-helpers.cjs');
function luminance(value){const rgb=value.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function contrast(fg,bg){const a=luminance(fg),b=luminance(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
const widths=[320,360,390,428,768,1024,1440,1920,2560];
(async()=>{const server=await startServer();try{
for(const [engineName,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true,...(engineName==='firefox'?{firefoxUserPrefs:{'network.proxy.type':0}}:{}),...(engineName==='webkit'?{proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}}:{})});
 try{for(const lang of ['ru','en'])for(const theme of ['aurum-noir','event-horizon','clarity']){
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(server.url+`/?lang=${lang}&theme=${theme}`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{await Promise.all([mmLoadLab(),mmLoadOS(),mmLoadContent(),mmLoadLanguage(),mmLoadStyles()]);await mmLanguageReady;await document.fonts.ready;});
  await page.addStyleTag({content:'section{content-visibility:visible!important;contain-intrinsic-size:none!important}'});
  for(const state of ['empty','real']){
   await page.evaluate(state=>{const s=MarkovMadeLab.state;s.profile={sex:'',age:null,height:null,weight:state==='real'?80:null};s.nutrition=state==='real'?{goal:'cut',target:2400,pMid:160,fatMid:70,carbMid:282}:null;s.progress=null;s.body=null;s.strategy=null;s.recovery=null;mmRefreshPersonalOS();document.querySelector('#contact .mm-contact-optional').open=true;},state);
   for(const width of widths){
    await page.setViewportSize({width,height:844});const actual=await page.evaluate(()=>document.documentElement.clientWidth);if(actual!==width)await page.setViewportSize({width:Math.round(width*width/actual),height:Math.round(844*width/actual)});
    for(let retry=0;retry<3;retry++){const measured=await page.evaluate(()=>document.documentElement.clientWidth);if(measured===width)break;await page.setViewportSize({...page.viewportSize(),width:page.viewportSize().width+(measured>width?-1:1)});}
    assert.equal(await page.evaluate(()=>document.documentElement.clientWidth),width);
    const label=`${engineName}/${lang}/${theme}/${state}/${width}`;
    for(const scale of [1,2]){
     if(scale===2)await page.evaluate(()=>{window.excellenceType=[...document.querySelectorAll('body *')].filter(e=>!['SCRIPT','STYLE','TITLE','DESC'].includes(e.tagName)&&(e.matches('input,select,textarea,button')||[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))).map(e=>[e,e.style.fontSize,e.style.lineHeight,getComputedStyle(e).fontSize,getComputedStyle(e).lineHeight]);for(const[e,,,font,line]of excellenceType){e.style.fontSize=parseFloat(font)*2+'px';if(line!=='normal')e.style.lineHeight=parseFloat(line)*2+'px';}});
     await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),label+` ${scale*100}% page fits`);
     const contact=await page.locator('#contact .mm-contact-direct>a').evaluateAll(links=>links.map(el=>{const style=getComputedStyle(el),box=el.getBoundingClientRect();return{bg:style.backgroundColor,fg:style.color,border:parseFloat(style.borderTopWidth),display:style.display,height:box.height};}));
     assert.equal(contact.length,2,label+' both direct contact actions exist');
     for(const action of contact){assert.notEqual(action.bg,'rgba(0, 0, 0, 0)',label+' contact action has its own opaque material');assert.ok(contrast(action.fg,action.bg)>=4.5,label+' contact text contrast >=4.5 '+JSON.stringify(action));assert.ok(action.height>=48&&['flex','inline-flex'].includes(action.display),label+' contact has a real48px hit area');assert.ok(action.border>=1,label+' contact boundary is visible');}
     const email=await page.locator('.mm-contact-email').evaluate(el=>{const inner=document.querySelector('#contact>.mm-editorial-inner'),r=el.getBoundingClientRect(),box=inner.getBoundingClientRect();return{inside:Boolean(el.closest('#contact')),left:r.left,right:r.right,gutterLeft:box.left,gutterRight:box.right,fits:el.scrollWidth<=el.clientWidth+1};});
     assert.ok(email.inside&&email.left>=email.gutterLeft-1&&email.right<=email.gutterRight+1&&email.fits,label+' email remains inside contact reading gutter '+JSON.stringify(email));
     for(const selector of ['#hero','#contact','#mm-os-screen-today'])assert.ok(await page.locator(selector).evaluate(e=>e.scrollWidth<=e.clientWidth+2),label+` ${scale*100}% ${selector} fits`);
     if(scale===1&&width<=428){await page.evaluate(()=>scrollTo(0,0));assert.ok(await page.locator('#hero .mm-primary-cta').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight),label+' primary contact is in first screen');}
     for(const selector of ['#hero .mm-primary-cta','#contact .mm-contact-direct a:first-child','#mm-os-screen-today .mm-os-start']){
      const target=page.locator(selector);await page.keyboard.press('Tab');await target.focus();assert.ok(await target.evaluate(e=>e===document.activeElement&&e.matches(':focus-visible')&&parseFloat(getComputedStyle(e).outlineWidth)>=2),label+` ${scale*100}% visible keyboard focus ${selector}`);
     }
     if(scale===2)await page.evaluate(()=>{for(const[e,font,line]of excellenceType){e.style.fontSize=font;e.style.lineHeight=line;}delete window.excellenceType;});
    }
   }
  }
  assert.ok(await page.locator('#app-ecosystem').evaluate(e=>{const style=getComputedStyle(e,'::after');return style.content==='none'||style.display==='none';}),'no device skeleton behind OS section');
  assert.equal(await page.locator('.mm-os-frame').evaluate(e=>getComputedStyle(e).backgroundImage),'none','personal state has no illustrated dashboard background');
  assert.equal(await page.locator('.mm-os-story-footer').isVisible(),false,'Today never describes local data as a demo');
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log(`Precision responsive UX: ${engineName} × RU/EN × 3 themes × 9 widths × empty/real × normal/200% text and keyboard focus.`);
 }finally{await browser.close();}
}
}finally{await server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
