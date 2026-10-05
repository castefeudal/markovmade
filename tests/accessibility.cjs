const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {startServer,root}=require('./browser-helpers.cjs');
const fixtures=require('./toolkit-fixtures.json');
const themes=['aurum-noir','event-horizon','clarity'];
(async()=>{
  const server=await startServer();let browser;
  const findings=[];
  try {
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    await page.goto(server.url,{waitUntil:'load'});
    await page.evaluate(()=>Promise.all([window.mmLoadLab(),window.mmLoadOS(),window.mmLoadContent()]));
    // Audit off-screen sections too; Chromium otherwise skips their paint with
    // content-visibility:auto and axe samples the canvas behind them.
    await page.addStyleTag({content:'section { content-visibility:visible !important; contain-intrinsic-size:none !important; }'});
    await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
    async function audit(label,selector) {
      await page.evaluate(async()=>{await window.mmLanguageReady;await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
      const result=await page.evaluate(async selector=>window.axe.run(selector?document.querySelector(selector):document,{
        runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},
        rules:{'heading-order':{enabled:true},'label-content-name-mismatch':{enabled:true}}
      }),selector);
      if(result.violations.length){fs.mkdirSync(path.join(root,'test-results/accessibility'),{recursive:true});await page.screenshot({path:path.join(root,'test-results/accessibility',label.replace(/[^a-z0-9-]/gi,'-')+'.png'),fullPage:true});}
      for(const v of result.violations)findings.push({label,id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))});
    }
    for(const lang of ['ru','en']) {
      if(lang==='en'){await page.locator('[data-lang-toggle]:visible').first().click();await page.waitForFunction(()=>document.documentElement.lang==='en');await page.waitForTimeout(800);}
      for(const theme of themes) {
        await page.locator('.theme-switch:visible').first().click();await page.locator(`[data-theme-value="${theme}"]`).click();
        for(const width of [320,390,768,1440]){
          await page.setViewportSize({width,height:1000});await page.waitForTimeout(100);
          await audit(`${lang}/${theme}/${width}`);
        }
        await page.locator('#calculators').scrollIntoViewIfNeeded();await page.waitForTimeout(100);
        for(const tab of await page.locator('[data-mm-lab-tab]').all()){
          await tab.click();await audit(`${lang}/${theme}/LAB/${await tab.getAttribute('data-mm-lab-tab')}`,'#calculators');
        }
        for(const [id,values] of Object.entries(fixtures)){
          await page.evaluate(id=>window.MarkovMadeToolkit.open(window.MarkovMadeToolkit.tools.find(tool=>tool.id===id)),id);
          for(const [key,value] of Object.entries(values))await page.locator('#toolkit-'+id+'-'+key).fill(String(value));
          await page.locator('#mm-toolkit-workspace button[type="submit"]').click();
          await audit(`${lang}/${theme}/toolkit/${id}`,'#mm-toolkit-workspace');
        }
        await page.evaluate(()=>window.mmPreviewShare('Private preview','https://t.me/share/url'));
        await audit(`${lang}/${theme}/share-preview`,'.mm-share-preview');await page.keyboard.press('Escape');
        await page.locator('#app-ecosystem').scrollIntoViewIfNeeded();await page.waitForTimeout(100);
        for(const tab of await page.locator('[data-app-tab]').all()){
          await tab.click();await audit(`${lang}/${theme}/OS/${await tab.getAttribute('data-app-tab')}`,'#app-ecosystem');
        }
        await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(200);
        await page.locator('.theme-switch:visible').first().click();await audit(`${lang}/${theme}/theme-picker`,'#mm-theme-dialog');await page.keyboard.press('Escape');
        await page.locator('[data-lab-history-open]').click();await audit(`${lang}/${theme}/history`,'#mm-lab-history-dialog');await page.keyboard.press('Escape');
        await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(200);
        fs.mkdirSync(path.join(root,'test-results/accessibility'),{recursive:true});
        fs.writeFileSync(path.join(root,'test-results/accessibility/findings.json'),JSON.stringify(findings,null,2));
        console.log(`Axe inspected ${lang}/${theme}: 4 widths, 7 LAB tabs, 5 OS tabs, dialogs.`);
      }
    }
    fs.mkdirSync(path.join(root,'test-results/accessibility'),{recursive:true});
    fs.writeFileSync(path.join(root,'test-results/accessibility/findings.json'),JSON.stringify(findings,null,2));
    if(findings.length){console.error(JSON.stringify(findings,null,2));process.exitCode=1;}
    else console.log('Axe WCAG 2.2 AA, heading hierarchy and visible-label names passed across RU/EN and all three themes.');
  }finally{await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
