const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {startServer}=require('./browser-helpers.cjs');
function lum(v){const c=v.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
function contrast(a,b){a=lum(a);b=lum(b);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
(async()=>{const server=await startServer(),browser=await chromium.launch({headless:true});try{
 for(const lang of ['ru','en'])for(const theme of ['aurum-noir','event-horizon','clarity']){
  console.log('Precision UI:',lang,theme);
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await page.goto(server.url+`/?lang=${lang}&theme=${theme}`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{await Promise.all([mmLoadLab(),mmLoadOS(),mmLoadContent(),mmLoadLanguage(),mmLoadStyles()]);await window.mmLanguageReady;await document.fonts.ready;});
  assert.equal(await page.locator('.mm-os-frame').getAttribute('data-empty'),'','fresh Today uses one starting instruction');
  assert.equal(await page.locator('#mm-os-screen-today .mm-os-metrics').isVisible(),false,'empty analytics are not presented');
  assert.equal(await page.locator('#mm-os-today-score').count(),0,'no invented readiness index');
  assert.equal(await page.locator('#app-ecosystem').getAttribute('data-os-active-tab'),'today','initial tab state is explicit before the first interaction');
  for(const selector of ['.mm-os-story-footer','.mm-os-frame-footer'])assert.equal(await page.locator(selector).evaluate(el=>getComputedStyle(el).display),'none','generic demo footers never label the initial local Today view');
  assert.ok(await page.locator('#hero .mm-primary-cta').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),'primary contact is within the mobile first screen');
  assert.match(await page.locator('#hero .mm-primary-cta').getAttribute('href'),/^https:\/\/t\.me\/markovmade$/,'personal contact is immediate and sends no health values');
  assert.equal(await page.locator('#hero .mm-secondary-cta').getAttribute('href'),'#calculators');
  assert.equal(await page.locator('#services details').count(),3,'three outcome-based offers');
  assert.equal(await page.locator('#request-quiz').count(),1,'one optional request mechanism');
  assert.equal(await page.locator('#contact .mm-contact-optional').evaluate(el=>el.open),false,'request fields are optional');
  assert.match(await page.locator('#contact .mm-contact-direct a').first().getAttribute('href'),/^https:\/\/t\.me\//);
  await page.locator('#contact .mm-contact-direct').scrollIntoViewIfNeeded();
  const contact=await page.locator('#contact .mm-contact-direct>a').evaluateAll(links=>links.map(el=>{const style=getComputedStyle(el);return{bg:style.backgroundColor,fg:style.color,height:el.getBoundingClientRect().height,display:style.display,border:parseFloat(style.borderTopWidth)};}));
  for(const action of contact){assert.notEqual(action.bg,'rgba(0, 0, 0, 0)');assert.ok(contrast(action.fg,action.bg)>=4.5,'direct contact contrast '+JSON.stringify(action));assert.ok(action.height>=48&&['flex','inline-flex'].includes(action.display)&&action.border>=1,'contact action has button material and hit area '+JSON.stringify(action));}
  assert.ok(await page.locator('.mm-contact-email').evaluate(el=>{const inner=document.querySelector('#contact>.mm-editorial-inner'),r=el.getBoundingClientRect(),box=inner.getBoundingClientRect();return Boolean(el.closest('#contact'))&&r.left>=box.left-1&&r.right<=box.right+1;}),'email stays within contact before any optional form interaction');
  assert.ok(await page.locator('#app-ecosystem').evaluate(el=>{const s=getComputedStyle(el,'::after');return s.content==='none'||s.display==='none';}),'no faux device background behind OS');
  await page.locator('#app-ecosystem').scrollIntoViewIfNeeded();
  await page.evaluate(()=>{const state=MarkovMadeLab.state;state.profile.weight=80;state.nutrition={target:2400,goal:'cut',pMid:160,fatMid:70,carbMid:282};state.recovery={score:81,modelVersion:'1.0.0'};const d=new Date(),today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');localStorage.setItem('markovmade-lab-daily-v1',JSON.stringify([{date:today,weight:90}]));mmRefreshPersonalOS();});
  assert.equal(await page.locator('.mm-os-frame').getAttribute('data-empty'),null);
  assert.equal(await page.locator('#mm-os-screen-today .mm-os-metrics>div').count(),2);
  assert.doesNotMatch(await page.locator('#mm-os-screen-today').innerText(),/\/100|81%/,'archived score is not promoted into personal readiness');
  await page.locator('[data-os-model="weight"]').scrollIntoViewIfNeeded();
  assert.match(await page.locator('[data-os-model="weight"]').innerText(),/80/,'daily journal stays separate before consent');
  await page.locator('#mm-os-daily-consent').check();
  await page.waitForFunction(()=>document.querySelector('[data-os-model="weight"]').textContent.includes('90'));
  await page.locator('#mm-os-daily-consent').uncheck();
  await page.waitForFunction(()=>document.querySelector('[data-os-model="weight"]').textContent.includes('80'));
  await page.locator('.mm-os-extra-actions>summary').click();
  await page.locator('.mm-app-task').first().click();
  assert.equal(await page.locator('.mm-app-task').first().getAttribute('aria-pressed'),'true','check-off remains functional and persistent');
  assert.ok(await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('markovmade-os-actions-v1'))).includes(true)));
  await page.close();
 }
 console.log('Precision Today/contact: RU/EN × three themes; empty and real state, no readiness score, explicit journal consent, persistent actions, one optional request.');
}finally{await browser.close();await server.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
