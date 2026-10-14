const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {startServer}=require('./browser-helpers.cjs');
const fs=require('node:fs');
(async()=>{
  const server=await startServer();
  const browser=await chromium.launch({headless:true});
  try{
    // A delayed handler must not let a native form submission discard the draft.
    const slowContact=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
    let releaseContact;const contactGate=new Promise(resolve=>{releaseContact=resolve;});
    await slowContact.route('**/app-runtime.js',async route=>{await contactGate;await route.continue();});
    await slowContact.goto(server.url+'/#personal-request',{waitUntil:'domcontentloaded'});
    await slowContact.locator('.mm-request-details > summary').click();
    await slowContact.locator('#name').fill('Анна');await slowContact.locator('#goal').fill('Вернуть регулярные тренировки');
    await slowContact.locator('#manifest-form').evaluate(form=>{form.requestSubmit();form.requestSubmit();});
    assert.equal(await slowContact.locator('#name').inputValue(),'Анна','a queued submission preserves entered fields');
    assert.equal(await slowContact.locator('#manifest-form').getAttribute('aria-busy'),'true','the pending form exposes its loading state');
    releaseContact();
    await slowContact.waitForFunction(()=>document.activeElement.id==='access-card');
    assert.match(await slowContact.locator('#lead-message-preview').innerText(),/Анна.*Вернуть регулярные тренировки/s,'the deferred submission uses the actual draft');
    await slowContact.close();
    const slowChoice=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
    let releaseChoice;const choiceGate=new Promise(resolve=>{releaseChoice=resolve;});
    await slowChoice.route('**/situation-quiz.js',async route=>{await choiceGate;await route.continue();});
    await slowChoice.goto(server.url+'/#personal-request',{waitUntil:'domcontentloaded'});
    await slowChoice.locator('[data-quiz-group="goal"] [data-value="снизить вес"]').evaluate(button=>{button.click();button.click();});
    releaseChoice();
    await slowChoice.waitForFunction(()=>document.querySelector('[data-quiz-group="goal"] .active'));
    assert.equal(await slowChoice.locator('[data-quiz-group="goal"] .active').count(),1,'repeated clicks during loading replay only once');
    await slowChoice.close();
    for(const lang of ['ru','en'])for(const dependency of ['app-runtime','situation-quiz'])for(const theme of ['aurum-noir','event-horizon','clarity']){
      const failedContact=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
      await failedContact.route('**/'+dependency+'.js',route=>route.abort());
      await failedContact.goto(server.url+'/?lang='+lang+'&theme='+theme+'#personal-request',{waitUntil:'load'});
      await failedContact.locator('[data-quiz-group="goal"] [data-value="снизить вес"]').click();
      await failedContact.locator('#mm-content-load-error button').waitFor();
      assert.match(await failedContact.locator('#mm-content-load-error').innerText(),lang==='en'?/message me directly/:/написать напрямую/,'load failure keeps a clear direct-contact route');
      assert.match(new URL(await failedContact.locator('#quiz-whatsapp-link').getAttribute('href')).searchParams.get('text'),lang==='en'?/Hello, Pavel/:/Здравствуйте, Павел/,'a localized ready message survives script failure');
      if(lang==='ru'){
        await failedContact.locator('.lang-switch:not(.lang-switch-mobile):not(.lang-switch-menu)').evaluate(button=>button.click());
        await failedContact.waitForFunction(()=>document.querySelector('#mm-content-load-error').textContent.includes('Extra options'));
        await failedContact.locator('.lang-switch:not(.lang-switch-mobile):not(.lang-switch-menu)').evaluate(button=>button.click());
        await failedContact.waitForFunction(()=>document.querySelector('#mm-content-load-error').textContent.includes('Уточнения'));
      }
      await failedContact.locator('.mm-request-details > summary').click();
      await failedContact.locator('#name').fill('Мария');await failedContact.locator('#goal').fill('Начать тренироваться');
      await failedContact.locator('#manifest-form').evaluate(form=>form.requestSubmit());
      await failedContact.locator('#lead-form-error button').waitFor();
      assert.equal(await failedContact.locator('#name').inputValue(),'Мария','failed loading does not reload or erase the form');
      await failedContact.addScriptTag({content:fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8')});
      const findings=await failedContact.evaluate(()=>axe.run('#personal-request',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
      assert.deepEqual(findings.violations.map(item=>item.id),[],`${lang}/${theme}: loading errors retain accessible controls`);
      await failedContact.locator('#lead-form-error').screenshot({path:`test-results/contact-error-${lang}-${theme}-${dependency}.png`});
      await failedContact.unroute('**/'+dependency+'.js');
      await failedContact.locator('#lead-form-error button').click();
      await failedContact.waitForFunction(()=>document.activeElement.matches('#manifest-form button[type="submit"]'));
      await failedContact.locator('#mm-content-load-error').waitFor({state:'detached'});
      await failedContact.locator('#manifest-form button[type="submit"]').click();
      await failedContact.waitForFunction(()=>document.activeElement.id==='access-card');
      await failedContact.close();
    }
    const failedPrivacy=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
    await failedPrivacy.route('**/app-runtime.js',route=>route.abort());
    await failedPrivacy.goto(server.url+'/#personal-request',{waitUntil:'load'});
    await failedPrivacy.locator('.mm-request-details > summary').click();
    await failedPrivacy.locator('#manifest-form [data-privacy-toggle]').click();
    await failedPrivacy.locator('#mm-privacy-load-error button').waitFor();
    await failedPrivacy.unroute('**/app-runtime.js');
    await failedPrivacy.locator('#mm-privacy-load-error button').click();
    await failedPrivacy.waitForFunction(()=>document.querySelector('#privacy-modal').getAttribute('aria-hidden')==='false');
    assert.equal(await failedPrivacy.locator('#mm-privacy-load-error').count(),0,'privacy retry opens the requested dialog and clears its error');
    await failedPrivacy.close();
    console.log('Contact loading: delayed submit, repeated intent, RU/EN failure and retry preserve the draft.');
  }finally{await browser.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
