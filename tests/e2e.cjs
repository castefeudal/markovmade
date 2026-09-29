const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.mp4':'video/mp4','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server = http.createServer((req,res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).on('error', () => { if (!res.headersSent) res.writeHead(404); res.end(); }).pipe(res);
});

let browser;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  browser = await chromium.launch({ headless: true });
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(7000);
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
  await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1800);

  assert.equal(await page.locator('#mm-lab-snapshot').isVisible(), true, 'LAB summary is visible before any calculation');
  assert.match(await page.locator('#mm-lab-snapshot-empty').textContent(), /состав тела|body composition/i);
  await page.locator('.theme-switch').first().click();
  assert.equal(await page.locator('#mm-theme-dialog').isVisible(), true, 'native theme dialog opens');
  for (const theme of ['ivory','graphite','contrast','obsidian']) {
    await page.locator(`[data-theme-value="${theme}"]`).click();
    await page.waitForTimeout(180);
    assert.equal(await page.locator('#mm-theme-dialog').isVisible(), false, `dialog closes after selecting ${theme}`);
    assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
    assert.equal(await page.evaluate(() => localStorage.getItem('mm.theme')), theme);
    if (theme !== 'obsidian') await page.locator('.theme-switch').first().click();
  }

  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(100);
  await page.locator('.lang-switch:not(.lang-switch-mobile):not(.lang-switch-menu)').evaluate(button => button.click());
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.locator('#mm-lab-snapshot-title').textContent(), 'Your current model');
  await page.locator('.lang-switch:not(.lang-switch-mobile):not(.lang-switch-menu)').evaluate(button => button.click());
  assert.equal(await page.locator('html').getAttribute('lang'), 'ru');

  await page.locator('#lab-body-sex').selectOption('male');
  await page.locator('#lab-body-age').fill('29');
  await page.locator('#lab-body-height').fill('188');
  await page.locator('#lab-body-weight').fill('100');
  await page.locator('#lab-body-bf').fill('15');
  await page.locator('[data-calc="body"]').click();
  assert.match(await page.locator('#lab-body-main').textContent(), /15[,.]0?%/);

  await page.locator('[data-mm-lab-tab="nutrition"]').click();
  await page.locator('#lab-nutri-sex').selectOption('male');
  await page.locator('#lab-nutri-age').fill('29');
  await page.locator('#lab-nutri-height').fill('188');
  await page.locator('#lab-nutri-weight').fill('100');
  await page.locator('[data-calc="nutrition"]').click();
  const maintenance = await page.locator('#lab-nutri-tdee').textContent();
  assert.ok((maintenance.match(/\d/g) || []).length >= 8, 'nutrition returns a formatted maintenance range');
  assert.equal(await page.locator('#mm-lab-snapshot').isVisible(), true);
  assert.ok(await page.locator('#mm-lab-snapshot [data-snap="bf"]').isVisible());
  assert.ok(await page.locator('#mm-lab-snapshot [data-snap="tdee"]').isVisible());

  await page.locator('[data-mm-lab-tab="overfeeding"]').click();
  for (const [id,value] of [['lab-fat-intake','5000'],['lab-fat-sex','male'],['lab-fat-age','29'],['lab-fat-height','188'],['lab-fat-weight','100'],['lab-fat-maint','3000']]) {
    const field=page.locator('#'+id); if (id.endsWith('sex')) await field.selectOption(value); else await field.fill(value);
  }
  await page.locator('[data-calc="overfeeding"]').click();
  assert.equal(await page.locator('#lab-overfeeding-error').textContent(), '');
  assert.notEqual(await page.locator('#lab-fat-main').textContent(), '—');

  await page.locator('[data-mm-lab-tab="recovery"]').click();
  await page.locator('[data-calc="recovery"]').click();
  assert.equal(await page.locator('#lab-recovery-error').textContent(), '');
  assert.notEqual(await page.locator('#lab-rec-main').textContent(), '—');

  await page.locator('[data-mm-lab-tab="progress"]').click();
  const today = new Date(); const start = new Date(today); start.setDate(start.getDate()-14);
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  for (const [id,value] of [['lab-prog-start-date',iso(start)],['lab-prog-end-date',iso(today)],['lab-prog-start-weight','100'],['lab-prog-current-weight','99'],['lab-prog-start-waist','90'],['lab-prog-current-waist','89']]) await page.locator('#'+id).fill(value);
  await page.locator('[data-calc="progress"]').click();
  assert.equal(await page.locator('#lab-progress-error').textContent(), '');
  assert.notEqual(await page.locator('#lab-prog-main').textContent(), '—');

  await page.locator('[data-mm-lab-tab="strategy"]').click();
  await page.locator('[data-calc="strategy"]').click();
  assert.equal(await page.locator('#lab-strategy-error').textContent(), '');
  assert.notEqual(await page.locator('#lab-str-main').textContent(), '—');
  const saved = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('markovmade-lab-v1') || '{}')).filter(value => value && typeof value === 'object').map(value => value.modelVersion));
  assert.ok(saved.some(version => version === '1.0.0'), 'calculation snapshots include model versions');

  const accordion = page.locator('[onclick="toggleAccordion(this)"]').first();
  await accordion.click();
  assert.equal(await accordion.getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('#'+await accordion.getAttribute('aria-controls')).getAttribute('aria-hidden'), 'false');
  const privacyTrigger = page.locator('[onclick="togglePrivacy()"]').first();
  await privacyTrigger.click();
  assert.equal(await page.locator('#privacy-modal').getAttribute('aria-modal'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#privacy-modal').isHidden(), true);

  const widths = [320,360,375,390,430,768,1024,1280,1366,1440,1600,1920];
  const overflow = [];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(300);
    const sizes = await page.evaluate(() => {
      const heading=document.querySelector('#hero .hero-title-premium');
      return { viewport: innerWidth, content: document.documentElement.scrollWidth, heading: heading ? {scroll:heading.scrollWidth,client:heading.clientWidth} : null };
    });
    if (sizes.content > sizes.viewport + 1) overflow.push(sizes);
    if (sizes.heading && sizes.heading.scroll > sizes.heading.client + 1) overflow.push({width,heroHeading:sizes.heading});
  }
  assert.deepEqual(overflow, [], 'no horizontal page or hero-heading overflow at tested widths');
  assert.deepEqual(runtimeErrors, [], 'no uncaught page errors');

  const screenshotSizes = [[390,844],[430,932],[768,1024],[1024,768],[1366,768],[1440,900],[1920,1080]];
  const visualDir = path.join(root,'test-results','visual');
  fs.mkdirSync(visualDir,{recursive:true});
  for (const theme of ['obsidian','ivory','graphite']) {
    await page.evaluate(name => { document.documentElement.dataset.theme=name; document.body.classList.toggle('theme-light',name==='ivory'); document.body.classList.toggle('theme-soft',name==='graphite'); }, theme);
    await page.evaluate(() => window.scrollTo(0,0));
    for (const [width,height] of screenshotSizes) {
      await page.setViewportSize({width,height});
      await page.waitForTimeout(300);
      await page.screenshot({path:path.join(visualDir,`${theme}-hero-${width}x${height}.png`),fullPage:false});
    }
    for (const [width,height] of [[390,844],[1440,900]]) {
      await page.setViewportSize({width,height});
      await page.waitForTimeout(300);
      for (const section of ['case-scenarios','calculators','app-ecosystem','services','biography','contact']) {
        await page.locator(`#${section}`).scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(visualDir,`${theme}-${section}-${width}x${height}.png`),fullPage:false});
      }
    }
  }
  await browser.close(); browser=null;
  await new Promise(resolve => server.close(resolve));
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  console.log('Browser QA passed: themes, RU/EN, body/nutrition/overfeeding/recovery/progress/strategy, summary, privacy, accordions, responsive widths.');
})().catch(async error => { console.error(error); if(browser) await browser.close().catch(()=>{}); server.close(); process.exitCode=1; });
