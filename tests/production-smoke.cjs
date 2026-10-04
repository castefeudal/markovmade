const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const base=process.env.BASE_URL||'https://castefeudal.github.io/markovmade/';
(async()=>{
  // Verify the served bytes, including the crop, rather than a cached old build.
  for(const file of ['index.html','assets/dist/site.css','assets/dist/lab.html','assets/dist/personal-os.html','assets/dist/hero-media.js',...Object.keys(require('./hero-crop.json').assets)]){
    const url=new URL(file,base);url.searchParams.set('qa',process.env.COMMIT_SHA||Date.now());
    const response=await fetch(url);assert.equal(response.status,200,file);
    const actual=Buffer.from(await response.arrayBuffer());
    const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
    assert.equal(hash(actual),hash(fs.readFileSync(path.join(root,file))),file+' production bytes match the reviewed build');
  }
  const browser=await chromium.launch({headless:true});
  try{
    for(const lang of ['ru','en'])for(const theme of ['aurum-noir','event-horizon','clarity']){
      const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      const url=new URL(base);url.searchParams.set('theme',theme);url.searchParams.set('lang',lang);
      await page.goto(url.href,{waitUntil:'load'});
      assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
      assert.equal(await page.locator('html').getAttribute('lang'),lang);
      assert.match(await page.locator('#hero .mm-primary-cta').textContent(),lang==='en'?/Open LAB/:/Открыть LAB/);
      await page.locator('#hero .mm-primary-cta').tap();
      await page.evaluate(()=>Promise.all([window.mmLoadLab(),window.mmLoadOS(),window.mmLoadContent(),window.mmLoadLanguage()]));
      await page.evaluate(()=>window.mmLanguageReady);
      assert.equal(await page.locator('[data-mm-lab-panel="body"]').isVisible(),true);
      await page.locator('#lab-body-weight').fill('100');
      await page.locator('#lab-body-height').fill('188');
      await page.setViewportSize({width:1440,height:900});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      assert.deepEqual(errors,[]);
      console.log('Production smoke passed: '+lang+'/'+theme+' mobile/desktop');
      await page.close();
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
