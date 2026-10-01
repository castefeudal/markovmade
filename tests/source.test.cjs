const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const tokens = fs.readFileSync(path.join(root, 'assets/css/tokens.css'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'assets/js/app-runtime.js'), 'utf8');

test('the single-page shell references local modular assets and GitHub Pages canonical', () => {
  assert.match(html, /rel="canonical" href="https:\/\/castefeudal\.github\.io\/markovmade\//);
  for (const asset of ['assets/css/fonts.css', 'assets/css/legacy.css', 'assets/css/tokens.css', 'assets/css/product.css', 'assets/css/worlds.css', 'assets/css/clarity.css', 'assets/js/lab-models.js', 'assets/js/app-runtime.js', 'assets/js/i18n.js', 'assets/js/hero-media.js', 'assets/js/theme-system.js', 'assets/js/lab-history.js', 'assets/js/lab-dashboard.js']) {
    assert.ok(fs.existsSync(path.join(root, asset)), `${asset} exists`);
    assert.ok(html.includes(asset), `${asset} is referenced`);
  }
  assert.doesNotMatch(html,/fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(html,/src="assets\/media\/hero-head2\.mp4"/);
});

test('three semantic themes define distinct media, chart, focus and surface tokens', () => {
  for (const theme of ['aurum-noir', 'event-horizon', 'clarity']) {
    assert.ok(tokens.includes(`data-theme="${theme}"`), theme);
  }
  for (const role of ['--mm-bg-primary', '--mm-surface-1', '--mm-text-primary', '--mm-text-muted', '--mm-accent', '--mm-border', '--mm-success', '--mm-warning', '--mm-danger', '--mm-info', '--mm-media-filter', '--mm-hero-overlay', '--mm-noise-opacity', '--mm-grid-color', '--mm-selection-bg', '--mm-selection-text', '--mm-chart-grid', '--mm-metal-highlight', '--mm-glow-primary', '--mm-focus', '--mm-input-bg', '--mm-section-divider', '--mm-shadow-surface', '--mm-radius-card', '--mm-motion-fast', '--mm-ease-premium']) assert.ok(tokens.includes(role), role);
});

test('interactive references and IDs are unique and resolvable', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, 'IDs are unique');
  const known = new Set(ids);
  for (const match of html.matchAll(/\b(?:aria-controls|aria-labelledby|for)="([^"]+)"/g)) {
    for (const ref of match[1].split(/\s+/)) assert.ok(known.has(ref), `reference ${ref} exists`);
  }
});

test('calculator snapshots record the model version that produced them', () => {
  for (const model of ['body','nutrition','overfeeding','recovery','progress','strategy']) {
    assert.match(runtime, new RegExp(`${model}:\\s*'1\\.0\\.0'`));
    assert.match(runtime, new RegExp(`state\\.${model}=\\{(?:\\.\\.\\.state\\.${model},)?modelVersion:MODEL_VERSIONS\\.${model}`));
  }
});

test('no legacy service emoji remain in the rendered markup', () => {
  const markup = html.slice(html.indexOf('<body'), html.indexOf('<script src="assets/js/theme-system.js"'));
  assert.doesNotMatch(markup, /[💪✨🥗🧠👑📊📈🧭]/u);
});

test('all content images are local WebP files with dimensions and alt text', () => {
  const images = [...html.matchAll(/<img\b[^>]*>/gs)].map(match => match[0]);
  assert.ok(images.length >= 20);
  for (const image of images) {
    const src = image.match(/\bsrc="([^"]+)"/);
    assert.ok(src, `image has a source: ${image.slice(0, 80)}`);
    assert.match(src[1], /^assets\/media\//, `image uses a local asset: ${src[1]}`);
    assert.ok(fs.existsSync(path.join(root, src[1])), `image exists: ${src[1]}`);
    assert.match(src[1], /\.webp$/);
    assert.match(image, /\bwidth="\d+"/);
    assert.match(image, /\bheight="\d+"/);
    assert.match(image, /\balt="[^"]*"/);
    assert.equal([...image.matchAll(/\bsrcset=/g)].length, 1, `image has one authoritative srcset: ${src[1]}`);
    assert.equal([...image.matchAll(/\bsizes=/g)].length, 1, `image has one sizes hint: ${src[1]}`);
    const srcset = image.match(/\bsrcset="([^"]+)"/);
    assert.ok(srcset, `image has responsive sources: ${src[1]}`);
    assert.match(image, /\bsizes="[^"]+"/);
    for (const candidate of srcset[1].split(',').map(item => item.trim().split(/\s+/)[0])) {
      assert.ok(fs.existsSync(path.join(root, candidate)), `responsive source exists: ${candidate}`);
      assert.match(candidate, /\.webp$/);
    }
  }
});


test('Insights has one navigation level and no global scroll popup', () => {
  assert.doesNotMatch(html.slice(0, html.indexOf('id="calculators"')), /href="#insights"/i);
  assert.match(html, /id="mm-os-tab-insights"/);
  assert.doesNotMatch(html, /id="insight-ghost"|data-insight=/i);
  assert.doesNotMatch(runtime, /insight-ghost|data-insight/);
});

test('production classes and script IDs contain no historical version suffixes', () => {
  assert.doesNotMatch(html, /\bclass="[^"]*\bmm-v\d+-/);
  assert.doesNotMatch(html, /\bid="[^"]*\bv\d+-(?:dynamic|quiz|analytics|faq|product|preflight|service|seo|telegram)/i);
});
