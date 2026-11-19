const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { startServer } = require('./browser-helpers.cjs');

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(server.url + '/offline.html?lang=en');
    await page.getByRole('button', { name: 'Download for offline use' }).click();
    await page.waitForFunction(() => document.getElementById('status').textContent.startsWith('Ready.'), null, { timeout: 60000 });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.goto(server.url + '/?lang=en&theme=clarity#app-ecosystem');
    const tasks = page.getByRole('region', { name: 'My tasks' });
    const title = tasks.getByRole('textbox', { name: 'Task name' });
    await title.fill('Offline walk');
    await title.press('Enter');
    await tasks.getByRole('checkbox', { name: 'Offline walk' }).check();
    await tasks.getByRole('button', { name: 'Edit: Offline walk' }).click();
    assert.equal(await title.evaluate(element => document.activeElement === element), true);
    await title.fill('Offline morning walk');
    await title.press('Enter');
    await page.reload();
    await page.evaluate(() => window.mmLoadOS());
    assert.equal(await tasks.getByRole('checkbox', { name: 'Offline morning walk' }).isChecked(), true);
    await page.evaluate(async () => {
      await window.mmLoadLab();
      await window.mmLoadLanguage();
      await window.mmLoadContent();
    });
    const lab = page.locator('#mm-lab-nutrition');
    assert.ok(await lab.isVisible(), 'LAB opens through the cached fragment and scripts');
    const backup = page.waitForEvent('download');
    await page.locator('[data-lab-export]').evaluate(button => button.click());
    const download = await backup;
    const exported = JSON.parse(await require('node:fs/promises').readFile(await download.path(), 'utf8'));
    assert.equal(exported.osTasks.tasks[0].title, 'Offline morning walk');
    assert.equal(exported.osTasks.tasks[0].done, true);
    page.once('dialog', dialog => dialog.accept());
    await tasks.getByRole('button', { name: 'Delete: Offline morning walk' }).click();
    assert.equal(await tasks.getByRole('checkbox').count(), 0);
    await page.locator('#mm-lab-import-file').setInputFiles({
      name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported))
    });
    await page.waitForFunction(() => window.MarkovMadeTasks?.read().tasks[0]?.title === 'Offline morning walk');
    await page.goto(server.url + '/?lang=ru&theme=event-horizon#mm-lab-tab-body');
    await page.locator('#lab-body-height').waitFor();
    await page.goto(server.url + '/offline.html?lang=en');
    assert.match(await page.locator('#title').textContent(), /offline/);
    console.log('Offline shell, content, LAB, task CRUD and task backup verified.');
    await context.close();
  } finally {
    await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
