const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, firefox, webkit } = require('playwright');
const { startServer, root } = require('./browser-helpers.cjs');
// Exercise every service rather than approving a screenshot-only disclosure.
(async () => {
  const server = await startServer();
  const output = path.join(root, 'test-results', 'services');
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
      const browser = await engine.launch({ headless: true, ...(name === 'firefox' ? { firefoxUserPrefs: { 'network.proxy.type': 0 } } : {}), ...(name === 'webkit' ? { proxy: { server: 'http://127.0.0.1:9', bypass: '127.0.0.1,localhost' } } : {}) });
      try {
        const page = await browser.newPage({ reducedMotion: 'reduce' });
        await page.goto(server.url);
        await page.evaluate(() => window.mmLoadStyles());
        for (const lang of ['ru', 'en']) {
          if (lang === 'en') {
            await page.evaluate(() => scrollTo(0, 0));
            await page.waitForTimeout(400);
            await page.locator('[data-lang-toggle]:visible').first().click();
            await page.waitForFunction(() => document.documentElement.lang === 'en');
            await page.evaluate(() => window.mmLanguageReady);
          }
          for (const theme of ['aurum-noir', 'event-horizon', 'clarity']) {
            await page.evaluate(() => scrollTo(0, 0));
            await page.waitForTimeout(400);
            await page.locator('.theme-switch:visible').first().click();
            await page.locator(`[data-theme-value="${theme}"]`).click();
            for (const width of [320, 390, 768, 1440, 2560]) {
              await page.setViewportSize({ width, height: 900 });
              await page.evaluate(() => document.fonts.ready);
              for (const item of await page.locator('#services details').all()) {
                const summary = item.locator('summary');
                await summary.focus();
                await page.keyboard.press('Enter');
                assert.equal(await item.evaluate(el => el.open), true);
                await item.locator('figure img').evaluate(async el => {
                  // WebKit may abort decode when responsive currentSrc changes after resize.
                  // Wait for the selected source; broken images still fail the final decode.
                  for (let attempt=0;attempt<3;attempt++) {
                    const source=el.currentSrc;
                    try { await el.decode(); if(source===el.currentSrc&&el.naturalWidth>0)return; }
                    catch(error) { if(error.name!=='EncodingError')throw error; }
                    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
                  }
                  await el.decode();assertImage();
                  function assertImage(){if(!el.naturalWidth)throw new Error('Service image did not decode');}
                });
                const geometry = await item.evaluate(el => {
                  const viewport = document.documentElement.clientWidth;
                  const visible = [...el.querySelectorAll('summary, .mm-service-editorial-copy, figure, img, a')];
                  return { overflow: document.documentElement.scrollWidth > viewport + 1, invalid: visible.filter(node => {
                    const r = node.getBoundingClientRect();
                    return r.left < -1 || r.right > viewport + 1 || node.scrollWidth > node.clientWidth + 1;
                  }).map(node => node.className), imageFit: getComputedStyle(el.querySelector('img')).objectFit };
                });
                assert.deepEqual(geometry, { overflow: false, invalid: [], imageFit: 'contain' }, `${name}/${lang}/${theme}/${width}`);
                await summary.focus();
                await page.keyboard.press('Enter');
                assert.equal(await item.evaluate(el => el.open), false);
              }
              if (name === 'chromium' && [390, 1440].includes(width)) {
                const first = page.locator('#services details').first();
                await first.locator('summary').click();
                await page.locator('#services').screenshot({ path: path.join(output, `${lang}-${theme}-${width}.png`) });
                await first.locator('summary').click();
              }
            }
          }
        }
        console.log(`Services verified: ${name}, RU/EN, three themes, five widths, four keyboard disclosures.`);
      } finally { await browser.close(); }
    }
  } finally { await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
