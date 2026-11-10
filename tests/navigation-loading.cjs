const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {startServer}=require('./browser-helpers.cjs');
(async()=>{
 const server=await startServer();const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(server.url+'/#mm-lab-nutrition',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#mm-lab-nutrition')?.hidden===false);
  assert.equal(await page.locator('#mm-lab-tab-nutrition').getAttribute('aria-selected'),'true','direct LAB links select the owning tab after hydration');
  const canonicalGroups={body:'extra',nutrition:'nutrition',overfeeding:'extra',recovery:'extra',progress:'progress',strength:'strength',plates:'strength',progression:'strength',caffeine:'extra'};
  for(const [tool,group]of Object.entries(canonicalGroups)){
    // Each fresh page hydrates with the legacy hash already present, so the
    // default group initialization cannot conceal a broken cold-entry route.
    const direct=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
    direct.on('pageerror',error=>errors.push(`${tool}: ${error.message}`));
    try{
      await direct.goto(server.url+'/#mm-lab-'+tool,{waitUntil:'domcontentloaded'});
      await direct.waitForFunction(({tool,group})=>{
        const panel=document.getElementById('mm-lab-'+tool),tab=document.getElementById('mm-lab-tab-'+tool);
        return panel&&!panel.hidden&&tab?.getAttribute('aria-selected')==='true'&&document.querySelector(`[data-lab-group="${group}"]`)?.getAttribute('aria-pressed')==='true';
      },{tool,group});
      assert.equal(await direct.locator('#mm-lab-tab-'+tool).getAttribute('aria-selected'),'true',`${tool}: legacy direct URL selects its canonical tab`);
      assert.equal(await direct.locator('#mm-lab-'+tool).isVisible(),true,`${tool}: direct URL reveals its final panel after hydration`);
      assert.equal(await direct.locator('[data-lab-group="'+group+'"]').getAttribute('aria-pressed'),'true',`${tool}: task navigation reflects the routed tool`);
      assert.equal(await direct.locator('[data-mm-lab-tab][aria-selected="true"]').count(),1,`${tool}: hydration leaves only one selected tool`);
      assert.equal(await direct.locator('[data-lab-group][aria-pressed="true"]').count(),1,`${tool}: hydration leaves only one selected task group`);
    }finally{await direct.close();}
  }
  await page.goto(server.url+'/#insights',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#insights')?.hidden===false);
  assert.equal(await page.locator('[data-app-tab="insights"]').getAttribute('aria-selected'),'true','direct Insights links reveal the requested screen');
  await page.goto(server.url+'/#lab-body-method',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#lab-body-method')?.closest('details').open);
  assert.equal(await page.locator('#lab-body-method').isVisible(),true,'links to methodology disclose their hidden content');
  await page.goto(server.url,{waitUntil:'load'});
  await page.locator('#hero .mm-secondary-cta').click();
  const firstHash=await page.evaluate(()=>location.hash);
  await page.evaluate(()=>{const link=document.createElement('a');link.id='nav-test-link';link.href='#personal-request';link.textContent='Contact';document.body.append(link);link.click();});
  await page.waitForFunction(()=>document.activeElement.id==='personal-request');
  await page.goBack();
  await page.waitForFunction(hash=>location.hash===hash,firstHash);
  await page.goForward();
  await page.waitForFunction(()=>location.hash==='#personal-request');
  await page.evaluate(()=>{document.getElementById('nav-test-link').href='#lab-nutri-weight';document.getElementById('nav-test-link').click();});
  await page.waitForFunction(()=>document.activeElement.id==='lab-nutri-weight');
  assert.equal(await page.locator('#lab-nutri-weight').getAttribute('tabindex'),null,'landing on an input preserves normal keyboard tab order');
  assert.equal(await page.locator('#mm-lab-tab-nutrition').getAttribute('aria-selected'),'true','links to unloaded fields reveal their panel');
  await page.goto(server.url,{waitUntil:'load'});
  await page.evaluate(async()=>{await Promise.all([mmLoadStyles(),mmLoadLab(),mmLoadOS()]);await document.fonts.ready;document.getElementById('services').scrollIntoView({behavior:'instant'});});
  const savedTop=await page.locator('#services').evaluate(section=>section.getBoundingClientRect().top);
  await page.evaluate(()=>{const link=document.createElement('a');link.href='#personal-request';document.body.append(link);link.click();});
  await page.waitForFunction(()=>document.activeElement.id==='personal-request');
  await page.goBack();
  await page.waitForFunction(top=>!location.hash&&Math.abs(document.getElementById('services').getBoundingClientRect().top-top)<5,savedTop);
  assert.deepEqual(errors,[],'anchor routing produces no uncaught errors');
  await page.close();
  const retry=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await retry.route('**/lab.html',route=>route.abort());
  await retry.goto(server.url+'/#mm-lab-nutrition',{waitUntil:'load'});
  await retry.locator('[data-retry-lab]').waitFor();
  await retry.unroute('**/lab.html');await retry.locator('[data-retry-lab]').click();
  await retry.waitForFunction(()=>document.querySelector('#mm-lab-nutrition')?.hidden===false);
  await retry.close();
  const tapRetry=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  await tapRetry.route('**/lab.html',route=>route.abort());
  await tapRetry.goto(server.url,{waitUntil:'load'});
  await tapRetry.locator('#hero .mm-secondary-cta').tap();await tapRetry.locator('[data-retry-lab]').waitFor();
  await tapRetry.unroute('**/lab.html');await tapRetry.locator('[data-retry-lab]').click();
  await tapRetry.waitForFunction(()=>!!window.MarkovMadeLab);await tapRetry.locator('#mm-lab-load-error').waitFor({state:'detached'});
  await tapRetry.close();
  const retryOS=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await retryOS.route('**/site-interactions.js',route=>route.abort());
  await retryOS.goto(server.url+'/#insights',{waitUntil:'load'});
  await retryOS.locator('#mm-os-load-error button').waitFor();
  await retryOS.unroute('**/site-interactions.js');await retryOS.locator('#mm-os-load-error button').click();
  await retryOS.waitForFunction(()=>document.querySelector('#insights')?.hidden===false);
  await retryOS.close();
  console.log('Navigation: nine cold legacy LAB routes and task groups, deferred LAB/Insights links, disclosures, Back/Forward and keyboard inputs passed.');
 }finally{await browser.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
