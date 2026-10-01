const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

const baselineDir = path.join(__dirname, 'visual-baselines');
const update = process.env.UPDATE_VISUAL_BASELINES === '1';

function assertVisualBaseline(name, actualPath, maxMismatch = 0.10) {
  fs.mkdirSync(baselineDir, {recursive:true});
  const baselinePath = path.join(baselineDir, name);
  if (update) {
    fs.copyFileSync(actualPath, baselinePath);
    console.log(`Updated visual baseline: ${name}`);
    return;
  }
  if (!fs.existsSync(baselinePath)) throw new Error(`Missing visual baseline ${name}; set UPDATE_VISUAL_BASELINES=1 to capture an intentional change.`);
  const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
  const actual = PNG.sync.read(fs.readFileSync(actualPath));
  if (baseline.width !== actual.width || baseline.height !== actual.height) {
    throw new Error(`${name}: image dimensions changed from ${baseline.width}×${baseline.height} to ${actual.width}×${actual.height}`);
  }
  const diff = new PNG({width:actual.width,height:actual.height});
  const mismatched = pixelmatch(baseline.data, actual.data, diff.data, actual.width, actual.height, {threshold:.12,includeAA:false});
  const ratio = mismatched / (actual.width * actual.height);
  if (ratio > maxMismatch) {
    const diffPath = path.join(path.dirname(actualPath), name.replace(/\.png$/, '-diff.png'));
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    throw new Error(`${name}: ${(ratio * 100).toFixed(2)}% pixels differ (limit ${(maxMismatch * 100).toFixed(1)}%); diff: ${diffPath}`);
  }
  console.log(`Visual baseline passed: ${name} (${(ratio * 100).toFixed(2)}% changed pixels)`);
}

module.exports = {assertVisualBaseline};
