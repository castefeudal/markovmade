const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,firefox,webkit}=require('playwright');
const {startServer}=require('./browser-helpers.cjs');
const axePath=require.resolve('axe-core/axe.min.js');
(async()=>{const server=await startServer();fs.mkdirSync('test-results/lab-pro',{recursive:true});try{
 for(const [name,engine]of Object.entries({chromium,firefox,webkit})){
  const browser=await engine.launch({headless:true,...(name==='firefox'?{firefoxUserPrefs:{'network.proxy.type':0}}:{}),...(name==='webkit'?{proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}}:{})});try{
   for(const lang of ['ru','en'])for(const theme of ['aurum-noir','event-horizon','clarity'])for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${server.url}/?lang=${lang}&theme=${theme}`);await page.evaluate(async()=>{await mmLoadLab();await mmLoadLanguage();await mmLanguageReady;await document.fonts.ready;});
    await page.locator('#lab-body-sex').selectOption('male');
    for(const [key,value]of Object.entries({height:'180',weight:'80',bf:'20','bf-error':'3'}))await page.locator('#lab-body-'+key).fill(value);
    await page.locator('[data-calc=body]').click();
    assert.equal(await page.evaluate(()=>MarkovMadeLab.state.body.sensitivity.low.fatMass),13.6);
    assert.equal(await page.locator('[data-analysis=body] .mm-mass-stack').count(),1);
    if(lang==='en')assert.doesNotMatch(await page.locator('#mm-lab-body').innerText(),/[А-Яа-яЁё]/,'calculated body result is translated');
    if(name==='chromium')await page.locator('[data-analysis=body]').screenshot({path:`test-results/lab-pro/${lang}-${theme}-${width}-body.png`});
    await page.locator('#mm-lab-tab-nutrition').click();await page.locator('#lab-nutri-age').fill('');await page.locator('[data-calc=nutrition]').click();
    assert.ok((await page.locator('#lab-nutrition-error').innerText()).length>0,'missing age is rejected');if(lang==='en')assert.doesNotMatch(await page.locator('#lab-nutrition-error').innerText(),/[А-Яа-яЁё]/,'range errors are translated');
    await page.locator('#lab-nutri-age').fill('29');await page.locator('[data-calc=nutrition]').click();assert.equal(await page.locator('#lab-nutrition-error').innerText(),'');
    assert.ok(await page.evaluate(()=>Boolean(MarkovMadeLab.state.nutrition.calculatedAt)));
    if(lang==='en')assert.doesNotMatch(await page.locator('#mm-lab-nutrition').innerText(),/[А-Яа-яЁё]/,'calculated nutrition result is translated');
    if(name==='chromium')await page.locator('[data-analysis=nutrition]').screenshot({path:`test-results/lab-pro/${lang}-${theme}-${width}-nutrition.png`});
    await page.locator('#mm-lab-tab-overfeeding').click();await page.locator('[data-mode-switch=overfeeding] [data-mode=pro]').click();
    for(const [key,value]of Object.entries({intake:'5000',maint:'3000',scale:'1.8'}))await page.locator('#lab-fat-'+key).fill(value);await page.locator('[data-calc=overfeeding]').click();
    assert.equal(await page.locator('#lab-overfeeding-error').innerText(),'');assert.equal(await page.locator('#mm-lab-overfeeding .mm-lab-stack').count(),0,'unknown tissue fractions are not drawn');
    if(lang==='en')assert.doesNotMatch(await page.locator('#lab-fat-scale-text').innerText(),/[А-Яа-яЁё]/);
    if(name==='chromium')await page.locator('[data-analysis=overfeeding]').screenshot({path:`test-results/lab-pro/${lang}-${theme}-${width}-overfeeding.png`});
    await page.locator('#mm-lab-tab-recovery').click();await page.locator('[data-mode-switch=recovery] [data-mode=pro]').click();
    for(const [key,value]of Object.entries({sleep:'7',energy:'7',stress:'3',desire:'7',soreness:'3',well:'7',hours:'7',rhr:'58',hrv:'50',device:'Watch A · morning'}))await page.locator('#lab-rec-'+key).fill(value);await page.locator('[data-calc=recovery]').click();
    assert.equal(await page.locator('#lab-recovery-error').innerText(),'');assert.equal(await page.locator('[data-analysis=recovery] .mm-data-point').count(),3,'only entered RHR, HRV and sleep are plotted');
    if(lang==='en')assert.doesNotMatch(await page.locator('#mm-lab-recovery').innerText(),/[А-Яа-яЁё]/,'recovery result and contribution labels are translated');
    if(name==='chromium')await page.locator('[data-analysis=recovery]').screenshot({path:`test-results/lab-pro/${lang}-${theme}-${width}-recovery.png`});
    await page.evaluate(()=>{const now=new Date();localStorage.setItem('markovmade-lab-daily-v1',JSON.stringify(Array.from({length:7},(_,i)=>({date:new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()-6+i)).toISOString().slice(0,10),weight:80-i*.1}))));document.dispatchEvent(new CustomEvent('mm:daily-updated'));});
    await page.locator('#mm-lab-tab-progress').click();await page.locator('#mm-lab-daily>summary').click();assert.equal(await page.locator('[data-analysis=progress] .mm-data-point').count(),7,'journal analysis works without inventing a manual calculation');
    if(name==='chromium')await page.locator('[data-analysis=progress]').screenshot({path:`test-results/lab-pro/${lang}-${theme}-${width}-progress.png`});
    await page.locator('#mm-lab-tab-strength').click();for(const [key,value]of Object.entries({load:'60',reps:'8',rir:'2',protocol:'Controlled full range'}))await page.locator('#lab-e1rm-'+key).fill(value);await page.locator('#lab-e1rm-calculate').click();assert.equal(await page.locator('[data-analysis=strength] .mm-data-point').count(),1);
    await page.locator('#mm-lab-tab-caffeine').click();
    assert.equal(await page.locator('#mm-toolkit-result svg[role=img]').count(),0,'empty state has no invented series');
    await page.locator('#toolkit-caffeine-dose').fill('100');await page.locator('#toolkit-caffeine-hours').fill('8');
    await page.locator('#toolkit-caffeine-bedtime').fill('23:00');
    for(const [key,value]of Object.entries({source:'Coffee',dose:'150',time:'08:00'}))await page.locator(`#toolkit-caffeine-intakes-0-${key}`).fill(value);
    assert.equal(await page.locator('#toolkit-caffeine-dose').isDisabled(),true,'PRO replaces quick inputs');
    await page.locator('[data-record-editor=intakes]>button').click();
    for(const [key,value]of Object.entries({source:'Tea',dose:'50',time:'16:00'}))await page.locator(`#toolkit-caffeine-intakes-1-${key}`).fill(value);
    await page.locator('#mm-toolkit-workspace button[type=submit]').click();
    assert.equal(await page.evaluate(()=>MarkovMadeLab.state.toolkit.caffeine.result.data.totalDose),200);
    assert.equal(await page.locator('#mm-toolkit-result .mm-data-figure path').count(),3);
    await page.locator('#mm-lab-tab-plates').click();
    for(const [key,value]of Object.entries({target:'93',bar:'20',collars:'2',inventory:'20; 10; 5; 2,5; 1,25'}))await page.locator(`#toolkit-plates-${key}`).fill(value);
    await page.locator('#mm-toolkit-workspace button[type=submit]').click();
    assert.equal(await page.locator('#mm-toolkit-result .mm-plate-diagram').count(),2,'lower and upper actual configurations');
    assert.doesNotMatch(await page.locator('#mm-toolkit-result').innerText(),/undefined|NaN/);
    await page.locator('#mm-lab-tab-progression').click();
    const session={exercise:'Bench',load:'60',sets:'3',reps:'10',rir:'2',technique:'Controlled',rom:'Full',rest:'180'};
    for(let index=0;index<2;index++)for(const [key,value]of Object.entries(session))await page.locator(`#toolkit-progression-records-${index}-${key}`).fill(value);
    await page.locator('#mm-toolkit-workspace button[type=submit]').click();
    assert.equal(await page.evaluate(()=>MarkovMadeLab.state.toolkit.progression.result.data.next),62.5);
    await page.locator('#toolkit-progression-records-1-rom').fill('Partial');await page.locator('#mm-toolkit-workspace button[type=submit]').click();
    assert.equal(await page.evaluate(()=>MarkovMadeLab.state.toolkit.progression.result.data.increase),false);
    await page.locator('#mm-lab-tab-caffeine').click();assert.equal(await page.locator('#toolkit-caffeine-intakes-1-source').inputValue(),'Tea','tab changes preserve record drafts');
    assert.equal(await page.locator('#toolkit-caffeine-dose').inputValue(),'100','disabled quick-mode drafts survive PRO tab switches');
    assert.equal(await page.locator('#toolkit-caffeine-hours').inputValue(),'8');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    if(lang==='en')assert.doesNotMatch(await page.locator('.mm-toolkit-workspace').innerText(),/[А-Яа-яЁё]/,'PRO UI is translated');
    assert.deepEqual(errors,[]);
    if(name==='chromium'&&lang==='en'&&theme==='clarity'&&width===390){
     const at=await page.evaluate(()=>{const at=MarkovMadeLab.state.body.calculatedAt;MarkovMadeLab.state.body.calculatedAt='2020-01-02T12:00:00Z';MarkovMadeToolkit.renderSummary();return at;});
     assert.match(await page.locator('.mm-summary-metric').filter({hasText:'Estimated body fat'}).locator('.mm-summary-metric-date').innerText(),/2020/,'a newer caffeine result does not relabel the body estimate date');
     assert.match(await page.locator('.mm-summary-metric').filter({hasText:'Weight · entered profile'}).locator('.mm-summary-metric-date').innerText(),/not recorded/,'missing profile entry time remains unknown');
     await page.evaluate(at=>{MarkovMadeLab.state.body.calculatedAt=at;MarkovMadeToolkit.renderSummary();},at);
     await page.locator('#mm-lab-tab-strength').click();await page.locator('#lab-e1rm-load').fill('13.9');await page.locator('#lab-e1rm-reps').fill('1');await page.locator('#lab-e1rm-increment').selectOption('5');await page.locator('#lab-e1rm-calculate').click();
     assert.match(await page.locator('#lab-e1rm-load-plan').innerText(),/90% ≈ 10[,.]0 kg/,'reference rounding does not turn 90% into more than e1RM');
     assert.doesNotMatch(await page.locator('#lab-e1rm-result').innerText(),/[А-Яа-яЁё]/,'the entered-single-repetition limit is translated');
     await page.locator('#mm-lab-tab-caffeine').click();
    }
    if(name==='chromium'){
     await page.addScriptTag({path:axePath});const axe=await page.evaluate(async()=>axe.run(document.querySelector('#mm-toolkit-workspace'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));assert.deepEqual(axe.violations.map(item=>({id:item.id,nodes:item.nodes.length})),[],'filled PRO result accessibility');
     await page.locator('#mm-toolkit-result').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/lab-pro/${lang}-${theme}-${width}-caffeine.png`});
    }
    await page.close();
   }
   console.log(`LAB PRO verified: ${name}, RU/EN × 3 themes × 2 widths`);
  }finally{await browser.close();}
 }
}finally{await server.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
