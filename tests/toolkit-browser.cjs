const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,firefox,webkit}=require('playwright');
const {startServer,root}=require('./browser-helpers.cjs');
const fixtures=require('./toolkit-fixtures.json');
(async()=>{
  const server=await startServer();const report=[];
  try{for(const [name,engine] of Object.entries({chromium,firefox,webkit})){
    const browser=await engine.launch({headless:true,...(name==='firefox'?{firefoxUserPrefs:{'network.proxy.type':0}}:{}),...(name==='webkit'?{proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}}:{})});
    try{for(const lang of ['ru','en'])for(const theme of ['aurum-noir','event-horizon','clarity']){
      const page=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(server.url+`/?lang=${lang}&theme=${theme}`);await page.evaluate(async()=>{await window.mmLoadLab();await window.mmLoadLanguage();await window.mmLanguageReady;});
      assert.equal(await page.evaluate(()=>window.MarkovMadeToolkit.tools.length),24);
      await page.locator('#mm-toolkit-search').fill('protein');assert.equal(await page.locator('[data-tool-id="protein"]').count(),1);await page.locator('#mm-toolkit-search').fill('');
      for(const [id,values] of Object.entries(fixtures)){
        await page.evaluate(id=>window.MarkovMadeToolkit.open(window.MarkovMadeToolkit.tools.find(tool=>tool.id===id)),id);
        for(const [key,value] of Object.entries(values))await page.locator(`#toolkit-${id}-${key}`).fill(String(value));
        await page.locator('#mm-toolkit-workspace button[type="submit"]').click();assert.equal(await page.locator('#mm-toolkit-result .mm-toolkit-outcome').count(),1,`${name}/${lang}/${theme}/${id}`);
        assert.ok((await page.locator('#mm-toolkit-result').innerText()).length>100);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`${id} page overflow`);
        assert.equal(await page.locator('#mm-toolkit-workspace').evaluate(el=>el.scrollWidth<=el.clientWidth+2),true,`${id} workspace overflow`);
      }
      assert.equal(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('markovmade-lab-v1')).toolkit).length),17);
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('markovmade-lab-history-v1')).filter(item=>item.modelVersion==='2.0.0').length),17);
      // Imported literal strings are rendered as text, never markup.
      await page.locator('#toolkit-review-action').fill('<img src=x onerror=alert(1)>');await page.locator('#mm-toolkit-workspace button[type="submit"]').click();assert.equal(await page.locator('#mm-toolkit-result img').count(),0);
      const download=page.waitForEvent('download');await page.locator('.mm-toolkit-summary button').click();assert.match((await download).suggestedFilename(),/\.txt$/);
      await page.evaluate(()=>window.mmPreviewShare('Private test text','https://t.me/share/url?text=Private'));assert.equal(await page.locator('.mm-share-preview pre').innerText(),'Private test text');await page.keyboard.press('Escape');await page.locator('.mm-share-preview').waitFor({state:'detached'});
      await page.reload();await page.evaluate(()=>window.mmLoadLab());assert.equal(await page.evaluate(()=>Object.keys(window.MarkovMadeLab.state.toolkit).length),17);
      await page.evaluate(()=>window.MarkovMadeToolkit.open(window.MarkovMadeToolkit.tools.find(tool=>tool.id==='protein')));assert.equal(await page.locator('#toolkit-protein-weight').inputValue(),'80');
      for(const width of [320,360,390,430,768,1440,2560]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`${name}/${theme}/${width} overflow`);}
      assert.deepEqual(errors,[],`${name}/${lang}/${theme} runtime errors`);report.push({browser:name,lang,theme,tools:17,errors});await page.close();
    }}finally{await browser.close();}console.log(`Toolkit verified: ${name}, RU/EN × 3 themes × 17 new tools`);
  }}finally{fs.writeFileSync(root+'/test-results/toolkit-browser.json',JSON.stringify(report,null,2));await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
