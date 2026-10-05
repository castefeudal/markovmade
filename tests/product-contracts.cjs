const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,firefox,webkit}=require('playwright');
const {startServer,root}=require('./browser-helpers.cjs');
const captureLinux=process.platform==='linux'&&!fs.existsSync(path.join(__dirname,'visual-baselines/linux/contract-ru-aurum-noir-320.png'));
if(captureLinux)process.env.UPDATE_VISUAL_BASELINES='1';
const {assertVisualBaseline}=require('./visual-regression.cjs');
const widths=[320,360,375,390,430,768,1024,1280,1366,1440,1600,1920,2560];
const themes=['aurum-noir','event-horizon','clarity'];
const output=path.join(root,'test-results/contracts');fs.mkdirSync(output,{recursive:true});
function luminance(rgb){const c=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function contrast(fg,bg){const a=luminance(fg),b=luminance(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
async function assertComposition(page,label) {
  await page.locator('#hero-head-fallback').evaluate(el=>el.decode());
  const result=await page.evaluate(()=>{
    const hero=document.getElementById('hero'),media=hero.querySelector('.mm-hero-media'),image=hero.querySelector('img'),heading=hero.querySelector('h1');
    const ir=image.getBoundingClientRect(),mr=media.getBoundingClientRect(),hr=heading.getBoundingClientRect();
    // Conservative envelope of the head over the complete authored turn/nod sequence.
    const face={left:ir.left+ir.width*.34,right:ir.left+ir.width*.68,top:ir.top+ir.height*.075,bottom:ir.top+ir.height*.68};
    return {viewport:innerWidth,scroll:document.documentElement.scrollWidth,media:mr.toJSON(),heading:hr.toJSON(),face,width:image.naturalWidth,height:image.naturalHeight};
  });
  assert.ok(result.scroll<=result.viewport+1,`${label}: horizontal overflow`);
  // Responsive srcset density rounds natural dimensions to whole CSS pixels.
  // The asset bytes and their exact physical crop are sealed in hero.test.cjs.
  assert.ok(Math.abs(result.width-result.height*40/27)<=1+40/27,`${label}: poster retains the approved crop ratio`);
  assert.ok(result.face.left>=result.media.left-2 && result.face.right<=result.media.right+2,`${label}: face clips horizontally ${JSON.stringify(result)}`);
  assert.ok(result.face.top>=result.media.top-2,`${label}: head clips at the top ${JSON.stringify(result)}`);
  if(result.viewport>1180)assert.ok(result.heading.right<=result.face.left+2,`${label}: text overlaps the face`);
  else assert.ok(result.heading.top>=result.media.bottom,`${label}: mobile text overlaps the portrait`);
}
async function assertPalette(page,label) {
  const colors=await page.evaluate(()=>{
    const hero=document.querySelector('#hero'),heading=hero.querySelector('h1'),intro=hero.querySelector('.hero-intro'),cta=hero.querySelector('.mm-primary-cta');
    return {bg:getComputedStyle(hero).backgroundColor,heading:getComputedStyle(heading).color,intro:getComputedStyle(intro).color,ctaBg:getComputedStyle(cta).backgroundColor,ctaFg:getComputedStyle(cta.querySelector('span')).color};
  });
  assert.ok(contrast(colors.heading,colors.bg)>=3,label+': heading palette changes atomically');
  assert.ok(contrast(colors.intro,colors.bg)>=4.5,label+': body palette changes atomically');
  assert.ok(contrast(colors.ctaFg,colors.ctaBg)>=4.5,label+': CTA palette changes atomically');
}
async function assertCta(page,label) {
  const cta=page.locator('#hero .mm-primary-cta');
  for(const state of ['default','hover','focus','active','disabled']){
    await cta.evaluate(el=>el.removeAttribute('aria-disabled'));
    await page.mouse.move(0,0);
    if(state==='hover'||state==='active')await cta.hover();
    if(state==='focus')await cta.focus();
    if(state==='disabled')await cta.evaluate(el=>el.setAttribute('aria-disabled','true'));
    if(state==='active')await page.mouse.down();
    await page.waitForTimeout(180);
    const s=await cta.evaluate(el=>{const text=el.querySelector('span'),cs=getComputedStyle(text),bg=getComputedStyle(el),sr=text.getBoundingClientRect();return {text:text.textContent.trim(),fg:cs.color,fill:cs.webkitTextFillColor||cs.color,bg:bg.backgroundColor,opacity:Number(bg.opacity),width:sr.width,height:sr.height,svg:getComputedStyle(el.querySelector('svg')).color};});
    if(state==='active'){await page.mouse.move(0,0);await page.mouse.up();}
    assert.match(s.text,/Открыть LAB|Open LAB/i,`${label}/${state}: visible CTA text`);
    assert.ok(s.width>20&&s.height>10&&s.opacity>.9,`${label}/${state}: text is drawn`);
    assert.ok(contrast(s.fg,s.bg)>=4.5,`${label}/${state}: contrast ${contrast(s.fg,s.bg)}`);
    assert.ok(contrast(s.fill,s.bg)>=4.5,`${label}/${state}: text fill is legible`);
    assert.ok(contrast(s.svg,s.bg)>=3,`${label}/${state}: icon is legible`);
  }
  await cta.evaluate(el=>el.removeAttribute('aria-disabled'));
}
(async()=>{
  const server=await startServer();let browser;
  try {
    for(const [name,type]of Object.entries(process.env.CONTRACTS_MOTION_ONLY?{}:{chromium,firefox,webkit})){
      // Explicit loopback bypass makes QA independent of Windows system proxies.
      browser=await type.launch({headless:true,...(name==='firefox'?{firefoxUserPrefs:{'network.proxy.type':0}}:{}),...(name==='webkit'?{proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}}:{})});
      const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(server.url,{waitUntil:'load'});
      await page.evaluate(()=>window.mmLoadStyles());
      for(const lang of ['ru','en']) {
        if(lang==='en'){await page.locator('[data-lang-toggle]:visible').first().click();await page.waitForFunction(()=>document.documentElement.lang==='en');await page.waitForTimeout(200);}
        for(const theme of themes) {
          await page.locator('.theme-switch:visible').first().click();
          await page.locator(`[data-theme-value="${theme}"]`).click();
          await assertPalette(page,`${name}/${lang}/${theme}`);
          for(const width of widths){
            await page.setViewportSize({width,height:width<=430?844:900});
            await page.evaluate(()=>scrollTo(0,0));
            await page.waitForTimeout(80);
            await assertComposition(page,`${name}/${lang}/${theme}/${width}`);
          }
          if(theme==='clarity')await assertCta(page,`${name}/${lang}/clarity`);
          if(name==='chromium')for(const width of [320,390,768,1440,2560]){
            await page.setViewportSize({width,height:width<=430?844:900});await page.evaluate(()=>scrollTo(0,0));
            await page.locator('#hero .mm-primary-cta').evaluate(el=>el.blur());await page.mouse.move(0,0);await page.waitForTimeout(180);
            const shot=path.join(output,`${lang}-${theme}-${width}.png`);await page.screenshot({path:shot});assertVisualBaseline(`contract-${lang}-${theme}-${width}.png`,shot,.015);
          }
          console.log(`Contracts passed: ${name} ${lang} ${theme}, 320–2560px`);
        }
      }
      // Keyboard dialog behavior and focus restoration are checked independently.
      await page.setViewportSize({width:390,height:844});
      await page.locator('#burger-btn').click();
      assert.equal(await page.locator('#mobile-menu').getAttribute('aria-hidden'),'false');
      assert.equal(await page.locator('#main-content').evaluate(el=>el.inert),true);
      await page.keyboard.press('Escape');assert.equal(await page.locator('#burger-btn').evaluate(el=>el===document.activeElement),true);
      assert.equal(await page.locator('#mobile-menu').evaluate(el=>el.inert),true);
      assert.deepEqual(errors,[],`${name}: runtime errors`);
      await browser.close();browser=null;
    }
    browser=await chromium.launch({headless:true});
    const motion=await browser.newPage({viewport:{width:1440,height:900}});
    await motion.addInitScript(()=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8});Object.defineProperty(navigator,'deviceMemory',{get:()=>8});});
    await motion.goto(server.url,{waitUntil:'load'});
    await motion.waitForFunction(()=>document.querySelector('.mm-hero-media').classList.contains('mm-frames-ready'),{},{timeout:30000});
    const video=motion.locator('#hero-head-video');
    assert.deepEqual(await video.evaluate(el=>[el.videoWidth,el.videoHeight]),[960,648],'video has no watermark region');
    for(const drawable of await motion.locator('.mm-hero-media img,.mm-hero-media video,.mm-hero-media canvas').all()) {
      const transition=await drawable.evaluate(el=>getComputedStyle(el).transitionProperty);
      assert.ok(!/transform|all/.test(transition),'rAF smoothing has no second CSS transform interpolator');
    }
    for(const [pose,x,y]of [['turn',100,320],['nod',1080,820],['neutral',1120,350]]) {
      await motion.mouse.move(x,y,{steps:8});await motion.waitForTimeout(600);
      assert.equal(await motion.locator('.mm-hero-media').getAttribute('data-mm-pose'),pose,`pointer produces ${pose}`);
      await assertComposition(motion,`pointer/${pose}`);
      const shot=path.join(output,`pointer-${pose}.png`);await motion.screenshot({path:shot});
      // Pose screenshots are evidence; the stable neutral/crop baselines above
      // are strict regressions. Decoder timing does not relax crop assertions.
    }
    await motion.mouse.move(1500,100);await motion.waitForTimeout(800);
    const shift=await motion.locator('.mm-hero-media').evaluate(el=>[parseFloat(el.style.getPropertyValue('--mm-hero-x')),parseFloat(el.style.getPropertyValue('--mm-hero-y'))]);
    assert.ok(shift.every(x=>Math.abs(x)<.1),'pointer leave eases back to neutral, including spatial shift');
    await motion.emulateMedia({reducedMotion:'reduce'});await motion.waitForTimeout(150);
    assert.equal(await video.evaluate(el=>getComputedStyle(el).display),'none','live reduced-motion change returns to the poster');
    const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const requests=[];touch.on('request',r=>requests.push(r.url()));await touch.goto(server.url,{waitUntil:'load'});
    assert.ok(!requests.some(u=>/\.mp4|lab-runtime|personal-os\.html|lab\.html/.test(u)),'touch first paint does not fetch video or below-fold calculators');
    await touch.locator('#hero .mm-primary-cta').tap();
    await touch.waitForFunction(()=>!!window.MarkovMadeLab);
    assert.equal(await touch.locator('[data-mm-lab-panel="body"]').isVisible(),true,'touch CTA loads a working LAB');
    for(const theme of themes)for(const lang of ['ru','en']) {
      const first=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
      await first.addInitScript(({theme,lang})=>{localStorage.setItem('mm.theme',theme);localStorage.setItem('markovmade_lang',lang)},{theme,lang});
      const fetched=[];first.on('request',r=>fetched.push(r.url()));await first.goto(server.url,{waitUntil:'load'});
      if(lang==='en')await first.waitForFunction(()=>document.querySelector('#hero .mm-primary-cta').textContent.includes('Open LAB'));
      assert.equal(await first.locator('html').getAttribute('data-theme'),theme);
      await assertComposition(first,`first-paint/${theme}/${lang}`);
      if(theme!=='clarity'){const family=await first.locator('#hero h1').evaluate(el=>getComputedStyle(el).fontFamily);assert.ok(family.startsWith(lang==='ru'?'"Cormorant RU"':'"Cormorant Garamond"'),`${theme}/${lang}: first paint uses its locale font`);}
      const colors=await first.locator('#hero .mm-primary-cta').evaluate(el=>({fg:getComputedStyle(el.querySelector('span')).color,bg:getComputedStyle(el).backgroundColor}));
      assert.ok(contrast(colors.fg,colors.bg)>=4.5,`critical CSS CTA is legible in ${theme}/${lang}`);
      assert.ok(!fetched.some(u=>/site\.css|\.mp4|lab-runtime|personal-os\.html|lab\.html/.test(u)),`${theme}/${lang}: first paint is independent of below-fold assets`);
      assert.ok(!fetched.some(u=>/cormorant-(normal|italic)-cyrillic\.woff2/.test(u)),`${theme}/${lang}: section-only display faces stay outside first paint`);
      await first.close();
    }
    const failure=await browser.newPage({viewport:{width:1440,height:900}});
    await failure.route('**/hero-portrait.mp4',route=>route.abort());await failure.goto(server.url,{waitUntil:'load'});
    await failure.waitForFunction(()=>document.querySelector('.mm-hero-media').classList.contains('mm-video-error'));
    await assertComposition(failure,'failed decoder uses the approved poster');
    assert.equal(await failure.locator('#hero-head-fallback').evaluate(el=>Number(getComputedStyle(el).opacity)),1);
    await failure.close();
    const retry=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    await retry.route('**/lab.html',route=>route.abort());await retry.goto(server.url,{waitUntil:'load'});
    await retry.locator('#hero .mm-primary-cta').tap();await retry.locator('[data-retry-lab]').waitFor();
    await retry.unroute('**/lab.html');await retry.locator('[data-retry-lab]').click();
    await retry.waitForFunction(()=>!!window.MarkovMadeLab);await retry.locator('#mm-lab-load-error').waitFor({state:'detached'});
    await retry.route('**/site-interactions.js',route=>route.abort());await retry.evaluate(()=>window.mmLoadOS().catch(()=>{}));
    await retry.locator('#mm-os-load-error button').waitFor();await retry.unroute('**/site-interactions.js');
    await retry.locator('#mm-os-load-error button').click();await retry.locator('#mm-os-load-error').waitFor({state:'detached'});
    await retry.locator('[data-app-tab="nutrition"]').click();assert.equal(await retry.locator('[data-app-screen="nutrition"]').isVisible(),true,'OS retries a partial load without losing its tabs');
    await retry.close();
    const bilingual=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    await bilingual.goto(server.url+'/?lang=en',{waitUntil:'load'});
    await bilingual.evaluate(()=>Promise.all([mmLoadLanguage(),mmLoadLab(),mmLoadOS(),mmLoadContent()]));
    await bilingual.waitForTimeout(300);
    const untranslated=await bilingual.evaluate(()=>{
      const texts=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
      while(node=walker.nextNode())if(/[а-яё]/i.test(node.nodeValue)&&!node.parentElement.closest('script,style,[data-no-translate]'))texts.push(node.nodeValue.trim());
      return [...new Set(texts)];
    });
    assert.deepEqual(untranslated,[],'all authored LAB/OS/editorial copy, including select options, is translated');
    await bilingual.locator('[data-lang-toggle]:visible').first().click();
    await bilingual.waitForFunction(()=>document.querySelector('#hero h1').textContent.includes('Тело и питание'));
    assert.match(await bilingual.locator('#hero .mm-primary-cta').innerText(),/Открыть LAB/,'saved EN restores exact RU copy');
    for(const lang of ['ru','en']) {
      if(lang==='en'){await bilingual.locator('[data-lang-toggle]:visible').first().click();await bilingual.waitForTimeout(300);}
      for(const theme of themes) {
        await bilingual.evaluate(()=>scrollTo(0,0));await bilingual.waitForTimeout(100);
        await bilingual.locator('.theme-switch:visible').first().click();await bilingual.locator(`[data-theme-value="${theme}"]`).click();
        for(const width of [320,390,768,1440]) {
          await bilingual.setViewportSize({width,height:900});
          await bilingual.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
          const overflows=await bilingual.evaluate(async()=>{
            const failures=[];
            for(const button of document.querySelectorAll('[data-mm-lab-tab],[data-app-tab]')) {
              button.click();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
              const panel=document.getElementById(button.getAttribute('aria-controls'));
              if(panel&&panel.scrollWidth>panel.clientWidth+2)failures.push({
                id:button.id,scrollWidth:panel.scrollWidth,clientWidth:panel.clientWidth,
                fontStatus:document.fonts.status,
                overflowing:[...panel.querySelectorAll('*')].map(el=>{
                  const rect=el.getBoundingClientRect();
                  return {tag:el.tagName,id:el.id,className:typeof el.className==='string'?el.className:'',left:Math.round(rect.left*10)/10,right:Math.round(rect.right*10)/10,width:Math.round(rect.width*10)/10,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth};
                }).filter(el=>el.scrollWidth>el.clientWidth+2||el.right>panel.getBoundingClientRect().right+1||el.left<panel.getBoundingClientRect().left-1)
              });
            }
            if(document.documentElement.scrollWidth>innerWidth+1)failures.push('page overflow');
            return failures;
          });
          assert.deepEqual(overflows,[],`${lang}/${theme}/${width}: every LAB/OS panel fits its available width`);
        }
        await bilingual.setViewportSize({width:1440,height:900});
      }
    }
    await bilingual.close();
    if(captureLinux)throw new Error('Linux baselines captured for review. Commit the reviewed contract screenshots under tests/visual-baselines/linux before acceptance.');
    console.log('Pointer turn/nod/neutral, touch entry and dynamic reduced motion passed.');
  } finally {await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
