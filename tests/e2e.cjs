const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { assertVisualBaseline } = require('./visual-regression.cjs');

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
  page.on('pageerror', error => runtimeErrors.push(error.stack || error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource: net::ERR_FAILED')) runtimeErrors.push(`console: ${message.text()}`);
  });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
  await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1800);

  assert.equal(await page.locator('#mm-lab-snapshot').isVisible(), true, 'LAB summary is visible before any calculation');
  assert.match(await page.locator('#mm-lab-snapshot-empty').textContent(), /состав тела|body composition/i);
  await page.locator('.theme-switch:visible').first().click();
  assert.equal(await page.locator('#mm-theme-dialog').isVisible(), true, `native theme dialog opens; errors: ${runtimeErrors.join(' | ')}`);
  for (const theme of ['ivory-atelier','imperial-emerald','oxblood-atelier','titanium-midnight','mono-access','aurum-noir']) {
    await page.locator(`[data-theme-value="${theme}"]`).click();
    await page.waitForTimeout(180);
    assert.equal(await page.locator('#mm-theme-dialog').isVisible(), false, `dialog closes after selecting ${theme}`);
    assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
    assert.equal(await page.evaluate(() => localStorage.getItem('mm.theme')), theme);
    if (theme !== 'aurum-noir') await page.locator('.theme-switch').first().click();
  }

  await page.locator('.theme-switch').first().click();
  await page.locator('[data-theme-value="imperial-emerald"]').hover();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'imperial-emerald', 'hover previews without saving');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'aurum-noir', 'Escape restores the committed theme');
  assert.equal(await page.evaluate(() => localStorage.getItem('mm.theme')), 'aurum-noir', 'preview is not persisted');

  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(100);
  await page.locator('.lang-switch:not(.lang-switch-mobile):not(.lang-switch-menu)').evaluate(button => button.click());
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.locator('#mm-lab-snapshot-title').textContent(), 'Your current model');
  await page.waitForFunction(() => document.querySelector('[data-segment="nutri-macro-scenario"] [data-value="higher-fat"]').textContent === 'More fats');
  assert.equal(await page.locator('#lab-body-bf-source option[value="consumer-bia"]').textContent(), 'Consumer BIA');
  await page.locator('.lang-switch:not(.lang-switch-mobile):not(.lang-switch-menu)').evaluate(button => button.click());
  assert.equal(await page.locator('html').getAttribute('lang'), 'ru');

  await page.locator('#lab-body-sex').selectOption('male');
  await page.locator('#lab-body-age').fill('29');
  await page.locator('#lab-body-height').fill('188');
  await page.locator('#lab-body-weight').fill('100');
  await page.locator('#lab-body-bf').fill('15');
  await page.locator('#lab-body-bf-source').selectOption('dexa');
  await page.locator('[data-calc="body"]').click();
  assert.match(await page.locator('#lab-body-main').textContent(), /15[,.]0?%/);
  assert.match(await page.locator('[data-confidence="body"]').textContent(), /Выше средней/);
  assert.match(await page.locator('#lab-body-range').textContent(), /сохранено введённое значение 15(?:[,.]0)?%/i, 'measurement method changes confidence without altering user-entered body-fat percent');

  await page.locator('[data-mm-lab-tab="nutrition"]').click();
  await page.locator('#lab-nutri-sex').selectOption('male');
  await page.locator('#lab-nutri-age').fill('29');
  await page.locator('#lab-nutri-height').fill('188');
  await page.locator('#lab-nutri-weight').fill('100');
  await page.locator('[data-calc="nutrition"]').click();
  const maintenance = await page.locator('#lab-nutri-tdee').textContent();
  const targetCalories = await page.locator('#lab-nutri-main').textContent();
  const protein = await page.locator('#lab-nutri-protein').textContent();
  await page.locator('[data-segment="nutri-macro-scenario"] [data-value="higher-carb"]').click();
  const higherCarb = (await page.locator('#lab-nutri-carb').textContent()).match(/\d+/g).map(Number);
  const minimumFat = await page.evaluate(() => Number(document.querySelector('#lab-nutri-weight').value) * .6);
  const higherCarbFat = (await page.locator('#lab-nutri-fat').textContent()).match(/\d+/g).map(Number);
  assert.ok(higherCarbFat[0] >= minimumFat - 1, 'macro scenarios preserve a reasonable minimum fat intake');
  await page.locator('[data-segment="nutri-macro-scenario"] [data-value="higher-fat"]').click();
  const higherFat = (await page.locator('#lab-nutri-carb').textContent()).match(/\d+/g).map(Number);
  assert.equal(await page.locator('#lab-nutri-main').textContent(), targetCalories, 'macro scenario preserves goal calories');
  assert.equal(await page.locator('#lab-nutri-protein').textContent(), protein, 'macro scenario preserves protein');
  assert.ok(higherFat[0] < higherCarb[0], 'higher-fat and higher-carb scenarios produce distinct distributions');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('markovmade-lab-v1')).nutrition.macroScenario), 'higher-fat', 'macro preference is stored with the nutrition model');
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
  for (const [id,value] of [['lab-rec-sleep','10'],['lab-rec-energy','10'],['lab-rec-stress','1'],['lab-rec-desire','10'],['lab-rec-soreness','1'],['lab-rec-well','10']]) await page.locator('#'+id).fill(value);
  await page.locator('[data-calc="recovery"]').click();
  assert.equal(await page.locator('#lab-recovery-error').textContent(), '');
  assert.match(await page.locator('#lab-rec-main').textContent(), /100\s*\/\s*100/, 'high readiness fixture returns the expected score');
  assert.match(await page.locator('#lab-rec-status').textContent(), /Ресурс хороший/);
  for (const [id,value] of [['lab-rec-sleep','2'],['lab-rec-energy','2'],['lab-rec-stress','10'],['lab-rec-desire','2'],['lab-rec-soreness','10'],['lab-rec-well','2']]) await page.locator('#'+id).fill(value);
  await page.locator('[data-calc="recovery"]').click();
  assert.match(await page.locator('#lab-rec-main').textContent(), /17\s*\/\s*100/, 'low readiness fixture returns the expected weighted score');
  assert.match(await page.locator('#lab-rec-status').textContent(), /Ресурс низкий/);

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
  assert.equal(await page.locator('#lab-str-main').textContent(), 'Восстановление', 'low readiness takes priority in the strategy navigator');
  const saved = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('markovmade-lab-v1') || '{}')).filter(value => value && typeof value === 'object').map(value => value.modelVersion));
  assert.ok(saved.some(version => version === '1.0.0'), 'calculation snapshots include model versions');

  await page.locator('[data-mm-lab-tab="body"]').click();
  await page.locator('#lab-body-weight').fill('99');
  await page.locator('[data-calc="body"]').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('markovmade-lab-history-v1') || '[]').length >= 7);
  assert.notEqual(await page.locator('#mm-os-today-decision').textContent(), 'Сначала соберите исходные данные.', 'Personal OS decision responds to current LAB calculations');
  assert.notEqual(await page.locator('[data-os-model="readiness"]').textContent(), '—', 'Personal OS readiness comes from the current recovery calculation');
  await page.locator('[data-lab-history-open]').click();
  assert.equal(await page.locator('#mm-lab-history-dialog').isVisible(), true, 'local calculation history opens');
  assert.equal(await page.locator('#mm-lab-history-list li').count(), 8, 'history stores each calculated snapshot');
  const bodyIds = await page.evaluate(() => JSON.parse(localStorage.getItem('markovmade-lab-history-v1')).filter(item => item.tool==='body').map(item=>item.id));
  await page.locator('#mm-lab-history-a').selectOption(bodyIds[0]);
  await page.locator('#mm-lab-history-b').selectOption(bodyIds[1]);
  assert.equal(await page.locator('#mm-lab-history-output table').isVisible(), true, 'same-model snapshots can be compared');
  await page.keyboard.press('Escape');

  await page.evaluate(() => { localStorage.removeItem('mm.theme'); localStorage.setItem('markov-theme','graphite'); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'titanium-midnight', 'legacy graphite choice migrates to the closest new theme');
  assert.equal(await page.locator('[data-segment="nutri-macro-scenario"] [data-value="higher-fat"]').getAttribute('aria-pressed'), 'true', 'saved macro preference is restored after reload');
  await page.evaluate(() => localStorage.setItem('mm.theme','aurum-noir'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  const exportStarted = page.waitForEvent('download');
  await page.locator('[data-lab-export]').click();
  const backup = await exportStarted;
  const backupPath = await backup.path();
  assert.match(backup.suggestedFilename(), /^markovmade-lab-\d{4}-\d{2}-\d{2}\.json$/);
  await page.locator('#mm-lab-import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{}')});
  await page.waitForFunction(() => document.getElementById('mm-lab-data-status').textContent.includes('не распознан'));
  assert.match(await page.locator('#mm-lab-data-status').textContent(), /не распознан/i, 'invalid backups are rejected with a readable status');
  const restored = page.waitForNavigation({waitUntil:'domcontentloaded'});
  await page.locator('#mm-lab-import-file').setInputFiles({name:backup.suggestedFilename(),mimeType:'application/json',buffer:fs.readFileSync(backupPath)});
  await restored;
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('markovmade-lab-history-v1') || '[]').length === 8);

  const accordion = page.locator('[onclick="toggleAccordion(this)"]').first();
  await accordion.click();
  assert.equal(await accordion.getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('#'+await accordion.getAttribute('aria-controls')).getAttribute('aria-hidden'), 'false');
  const privacyTrigger = page.locator('[onclick="togglePrivacy()"]').first();
  await privacyTrigger.click();
  assert.equal(await page.locator('#privacy-modal').getAttribute('aria-modal'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#privacy-modal').isHidden(), true);

  const viewports = [[320,568],[360,800],[375,812],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1366,768],[1440,900],[1600,900],[1920,1080],[2560,1440]];
  const overflow = [];
  for (const [width,height] of viewports) {
    await page.setViewportSize({ width, height });
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

  const visualDir = path.join(root,'test-results','visual');
  fs.mkdirSync(visualDir,{recursive:true});
  await page.setViewportSize({width:390,height:844});
  await page.locator('.theme-switch:visible').first().click();
  const pickerShot = path.join(visualDir,'theme-picker-390x844.png');
  await page.locator('#mm-theme-dialog').screenshot({path:pickerShot});
  assertVisualBaseline('theme-picker-390x844.png',pickerShot);
  await page.keyboard.press('Escape');
  const screenshotSizes = viewports;
  for (const theme of ['aurum-noir','ivory-atelier','imperial-emerald','oxblood-atelier','titanium-midnight','mono-access']) {
    await page.evaluate(name => {
      document.documentElement.dataset.theme=name;
      document.body.classList.toggle('theme-light',name==='ivory-atelier');
      document.body.classList.toggle('theme-soft',false);
      document.body.classList.toggle('theme-contrast',name==='mono-access');
    }, theme);
    await page.evaluate(() => window.scrollTo(0,0));
    for (const [width,height] of screenshotSizes) {
      await page.setViewportSize({width,height});
      await page.waitForTimeout(300);
      const shot = path.join(visualDir,`${theme}-hero-${width}x${height}.png`);
      await page.screenshot({path:shot,fullPage:false});
      if (width===390 && height===844) assertVisualBaseline(`${theme}-hero-390x844.png`,shot);
    }
    for (const [width,height] of [[390,844],[1440,900]]) {
      await page.setViewportSize({width,height});
      await page.waitForTimeout(300);
      for (const section of ['case-scenarios','calculators','app-ecosystem','services','biography','contact']) {
        if (section==='calculators') await page.locator('[data-mm-lab-tab="body"]').click();
        await page.locator(`#${section}`).scrollIntoViewIfNeeded();
        const shot = path.join(visualDir,`${theme}-${section}-${width}x${height}.png`);
        await page.screenshot({path:shot,fullPage:false});
        if (section==='calculators' && width===390) assertVisualBaseline(`${theme}-lab-390x844.png`,shot);
        if (section==='app-ecosystem' && width===390) assertVisualBaseline(`${theme}-os-390x844.png`,shot);
      }
    }
  }
  await browser.close(); browser=null;
  await new Promise(resolve => server.close(resolve));
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  console.log('Browser QA passed: six theme worlds and preview rollback, RU/EN, body/nutrition/overfeeding/recovery/progress/strategy, summary, privacy, accordions, and 13 exact responsive viewports.');
})().catch(async error => { console.error(error); if(browser) await browser.close().catch(()=>{}); server.close(); process.exitCode=1; });
