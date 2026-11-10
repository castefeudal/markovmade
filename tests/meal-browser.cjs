const assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const {startServer}=require('./browser-helpers.cjs');
(async()=>{const server=await startServer();try{
  for(const [engineName,engine]of Object.entries({chromium,firefox,webkit}).filter(([name])=>!process.env.MM_MEAL_TEST_ENGINE||process.env.MM_MEAL_TEST_ENGINE===name)){
    const browser=await engine.launch({headless:true,...(engineName==='firefox'?{firefoxUserPrefs:{'network.proxy.type':0}}:{}),...(engineName==='webkit'?{proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}}:{})});
    try{for(const lang of ['ru','en'])for(const theme of ['aurum-noir','event-horizon','clarity']){
      const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
      await page.goto(server.url+`/?lang=${lang}&theme=${theme}`,{waitUntil:'domcontentloaded'});
      await page.evaluate(async()=>{await Promise.all([mmLoadLab(),mmLoadLanguage(),mmLoadStyles()]);await window.mmLanguageReady;});
      assert.equal(await page.locator('[data-lab-group]').count(),4);
      assert.equal(await page.locator('#mm-lab-nutrition').isVisible(),true);
      await page.locator('[data-lab-group="extra"]').click();
      assert.equal(await page.locator('[data-open-meal]').isVisible(),false,'meal shortcut belongs to nutrition, not the Extras group');
      await page.locator('[data-lab-group="nutrition"]').click();
      assert.equal(await page.locator('[data-open-meal]').isVisible(),true,'returning to nutrition reveals its meal shortcut');
      await page.evaluate(()=>{window.__mealOpenEvents=[];document.addEventListener('mm:tool-open',event=>window.__mealOpenEvents.push(event.detail));});
      await page.locator('[data-open-meal]').click();
      await page.waitForFunction(()=>window.__mealOpenEvents.length===1);
      await page.locator('#mm-meal-tool > summary').click();
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      assert.equal(await page.evaluate(()=>window.__mealOpenEvents.length),1,'closing the meal tool never emits an opening event');
      await page.locator('[data-open-meal]').click();
      await page.waitForFunction(()=>window.__mealOpenEvents.length===2);
      assert.deepEqual(await page.evaluate(()=>window.__mealOpenEvents),[{tool:'meal'},{tool:'meal'}],'each opening emits one tool identifier without recipe or personal values');
      const values={name:'Label food',reference:'100',grams:'250',kcal:'200',protein:'10',fat:'5',carbs:'25'};
      for(const [field,value]of Object.entries(values))await page.locator('#meal-'+field).fill(value);
      await page.locator('#meal-ingredient-form button[type=submit]').click();
      await page.locator('#meal-portions').fill('2');await page.locator('#meal-calculate').click();
      assert.match(await page.locator('#meal-main').textContent(),/250/);
      await page.locator('#meal-recipe-name').fill('My recipe');await page.locator('#meal-save').click();
      const store=await page.evaluate(()=>JSON.parse(localStorage.getItem('markovmade-meals-v1')));
      assert.equal(store.products.length,1);assert.equal(store.recipes[0].portions,2);
      await page.locator('#meal-diary').click();
      assert.equal(await page.evaluate(()=>localStorage.getItem('markovmade-lab-daily-v1')),null,'opening confirmation never changes diary');
      await page.locator('#meal-confirm').click();
      assert.equal(await page.locator('#mm-checkin-calories').inputValue(),'250');
      assert.equal(await page.evaluate(()=>localStorage.getItem('markovmade-lab-daily-v1')),null,'prefill leaves stored diary unchanged until Save day');
      await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(()=>mmLoadLab());
      await page.locator('[data-open-meal]').click();await page.locator('#meal-recipes').selectOption('0');
      assert.match(await page.locator('#meal-main').textContent(),/250/);
      await page.evaluate(()=>{const state=JSON.parse(localStorage.getItem('markovmade-lab-v1')||'{}');state.nutrition={...state.nutrition,target:2500};localStorage.setItem('markovmade-lab-v1',JSON.stringify(state));});
      await page.locator('#meal-calculate').click();
      assert.match(await page.locator('#meal-remaining').textContent(),/10%/,'serving share is available with a configured target alone');
      assert.match(await page.locator('#meal-remaining').textContent(),lang==='en'?/No intake is logged.*remaining amount is unknown/:/Калории за сегодня не записаны.*количество неизвестно/,'missing daily intake must not be treated as zero');
      await page.evaluate(()=>{const date=new Date(),day=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;localStorage.setItem('markovmade-lab-daily-v1',JSON.stringify([{date:day,calories:1000}]));});
      await page.locator('#meal-calculate').click();
      assert.match((await page.locator('#meal-remaining').textContent()).replace(/[\s,]/g,''),/1250/,'remaining target subtracts the recorded intake and the serving');
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('markovmade-lab-daily-v1'))[0].calories),1000,'comparison never records the serving automatically');
      await page.evaluate(()=>{const records=JSON.parse(localStorage.getItem('markovmade-lab-daily-v1'));records[0].calories=0;localStorage.setItem('markovmade-lab-daily-v1',JSON.stringify(records));});
      await page.locator('#meal-calculate').click();
      assert.match((await page.locator('#meal-remaining').textContent()).replace(/[\s,]/g,''),/2250/,'an explicit zero-intake record remains distinct from missing data');
      const overflow=await page.locator('#mm-meal-tool').evaluate(el=>el.scrollWidth>el.clientWidth+2?[...el.querySelectorAll('*')].filter(node=>node.clientWidth&&node.scrollWidth>node.clientWidth+2).map(node=>({tag:node.tagName,id:node.id,class:node.className,client:node.clientWidth,scroll:node.scrollWidth,text:node.textContent.slice(0,80)})):[]);
      assert.deepEqual(overflow,[],`${engineName}/${lang}/${theme}: meal tool fits the mobile viewport`);
      for(const width of [320,390,768,1440]){
        await page.setViewportSize({width,height:900});
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        assert.equal(await page.locator('#mm-meal-tool').evaluate(el=>el.scrollWidth<=el.clientWidth+2),true,`${engineName}/${lang}/${theme}/${width}: meal reflow`);
        if(width===1440){
          const geometry=await page.evaluate(()=>{
            const shell=document.querySelector('.mm-lab-shell'),content=document.querySelector('.mm-lab-content');
            const shellBox=shell.getBoundingClientRect(),contentBox=content.getBoundingClientRect();
            const groupsBox=document.querySelector('.mm-lab-groups').getBoundingClientRect(),formBox=document.querySelector('#mm-lab-nutrition .mm-lab-form').getBoundingClientRect();
            return {groupsAbove:groupsBox.bottom<=formBox.top,singleShell:getComputedStyle(shell).display==='block',leftGap:contentBox.left-shellBox.left,widthGap:shellBox.width-contentBox.width,columns:getComputedStyle(document.querySelector('#mm-lab-nutrition .mm-lab-layout')).gridTemplateColumns.split(' ').filter(Boolean).length};
          });
          assert.equal(geometry.groupsAbove,true,`${engineName}/${lang}/${theme}: desktop groups precede the active form`);
          assert.equal(geometry.singleShell,true,`${engineName}/${lang}/${theme}: task navigation uses a single-column outer shell`);
          assert.ok(geometry.leftGap<=2&&geometry.widthGap<=4,`${engineName}/${lang}/${theme}: no empty legacy sidebar ${JSON.stringify(geometry)}`);
          assert.equal(geometry.columns,2,`${engineName}/${lang}/${theme}: input and result retain their desktop columns`);
        }
      }
      await page.setViewportSize({width:320,height:900});
      await page.locator('#meal-result details').first().locator('summary').click();
      await page.evaluate(()=>{const sizes=[...document.querySelectorAll('#mm-meal-tool *, .mm-lab-groups *')].filter(el=>el.matches('input,select,button')||[...el.childNodes].some(node=>node.nodeType===3&&node.textContent.trim())).map(el=>[el,getComputedStyle(el).fontSize,getComputedStyle(el).lineHeight]);for(const[el,font,line]of sizes){el.style.fontSize=parseFloat(font)*2+'px';if(line!=='normal')el.style.lineHeight=parseFloat(line)*2+'px';}});
      for(const selector of ['#mm-meal-tool','.mm-lab-groups'])assert.equal(await page.locator(selector).evaluate(el=>el.scrollWidth<=el.clientWidth+2),true,`${engineName}/${lang}/${theme}: 200% ${selector}`);
      await page.close();
    }}finally{await browser.close();}
    console.log(`Meals verified: ${engineName} · RU/EN × 3 themes · label arithmetic, recipe persistence and confirmed diary prefill`);
  }
}finally{await server.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
