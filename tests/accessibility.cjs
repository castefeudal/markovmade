const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.avif':'image/avif','.woff2':'font/woff2','.mp4':'video/mp4'};
const server = http.createServer((req,res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).on('error', () => { if (!res.headersSent) res.writeHead(404); res.end(); }).pipe(res);
});

const themes = ['aurum-noir','event-horizon'];
let browser;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(1400);
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const findings = [];
  for (const theme of themes) {
    await page.locator('.theme-switch:visible').first().click();
    await page.locator(`#mm-theme-dialog [data-theme-value="${theme}"]`).click();
    await page.waitForTimeout(850);
    const result = await page.evaluate(async () => window.axe.run(document, {
      runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}
    }));
    for (const violation of result.violations) {
      findings.push({theme,id:violation.id,impact:violation.impact,help:violation.help,nodes:violation.nodes.map(node=>({target:node.target,summary:node.failureSummary}))});
    }
    await page.locator('.theme-switch:visible').first().click();
    const picker = await page.evaluate(async () => window.axe.run(document.querySelector('#mm-theme-dialog'), {
      runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}
    }));
    for (const violation of picker.violations) {
      findings.push({theme,component:'theme-picker',id:violation.id,impact:violation.impact,help:violation.help,nodes:violation.nodes.map(node=>({target:node.target,summary:node.failureSummary}))});
    }
    await page.keyboard.press('Escape');
  }
  await page.locator('[data-lab-history-open]').click();
  const history = await page.evaluate(async () => window.axe.run(document.querySelector('#mm-lab-history-dialog'), {
    runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}
  }));
  for (const violation of history.violations) {
    findings.push({component:'lab-history-dialog',id:violation.id,impact:violation.impact,help:violation.help,nodes:violation.nodes.map(node=>({target:node.target,summary:node.failureSummary}))});
  }
  await page.keyboard.press('Escape');
  await browser.close(); browser=null; await new Promise(resolve => server.close(resolve));
  if (findings.length) {
    console.error(JSON.stringify(findings,null,2));
    process.exitCode=1;
  } else console.log(`Axe passed WCAG 2.2 AA checks across ${themes.length} themes.`);
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close().catch(()=>{});
  server.close();
  process.exitCode=1;
});
