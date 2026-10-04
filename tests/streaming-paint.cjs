/* A local fast response hides progressive-parser layout bugs. Deliberately
   deliver an incomplete hero and delay fonts, then measure real layout shifts. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const boundary = html.indexOf('<h1');
assert.ok(boundary > 0);
const types = {'.js':'text/javascript', '.css':'text/css', '.woff2':'font/woff2', '.avif':'image/avif', '.webp':'image/webp', '.svg':'image/svg+xml'};
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.write(html.slice(0, boundary));
    setTimeout(() => res.end(html.slice(boundary)), 700);
    return;
  }
  const file = path.resolve(root, '.' + decodeURIComponent(pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(404).end(); return; }
  try {
    const bytes = fs.readFileSync(file);
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    const send = () => res.end(bytes);
    if (file.endsWith('.woff2')) setTimeout(send, 1200); else send();
  } catch { res.writeHead(404).end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch();
  try {
    for (const lang of ['ru', 'en']) for (const theme of ['aurum-noir', 'event-horizon', 'clarity']) for (const width of [320,768,1350,2560]) {
      const page = await browser.newPage({viewport:{width,height:940},reducedMotion:'reduce'});
      await page.addInitScript(() => {
        window.paintShifts = [];
        window.paintSources = [];
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) { window.paintShifts.push(entry.value); window.paintSources.push(entry.sources.map(source=>({node:source.node?.outerHTML?.slice(0,180),previous:source.previousRect.toJSON(),current:source.currentRect.toJSON()}))); }
        }).observe({type:'layout-shift',buffered:true});
      });
      await page.goto(`http://127.0.0.1:${server.address().port}/?lang=${lang}&theme=${theme}`, {waitUntil:'commit'});
      await page.locator('#hero > .container').waitFor({state:'attached'});
      assert.equal(await page.locator('#hero > .container').evaluate(el => getComputedStyle(el).visibility), 'hidden', 'Incomplete hero text does not paint');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.locator('#hero > .container').evaluate(el => getComputedStyle(el).visibility), 'visible');
      assert.match(await page.locator('#hero .mm-primary-cta').textContent(), lang === 'en' ? /Open LAB/ : /Открыть LAB/);
      const cls = await page.evaluate(() => paintShifts.reduce((sum, value) => sum + value, 0));
      if(cls>=.01)console.log('afterFonts',await page.locator('#hero .hero-intro').evaluate(el=>({text:el.textContent,font:getComputedStyle(el).fontFamily,height:el.getBoundingClientRect().height,lang:document.documentElement.lang})),JSON.stringify(await page.evaluate(()=>paintSources),null,2));
      assert.ok(cls < .01, `${lang}/${theme}/${width}: streamed HTML and delayed fonts CLS ${cls}`);
      console.log(`Streamed first paint ${lang}/${theme}/${width}: CLS ${cls.toFixed(5)}`);
      await page.close();
    }
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => {console.error(error);server.close();process.exitCode=1;});
