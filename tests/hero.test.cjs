const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const crop=require('./hero-crop.json');
test('approved hero crop excludes the entire KlingAI source region before paint',()=>{
  assert.equal(crop.crop.x,0);assert.equal(crop.crop.y,0);
  assert.equal(crop.crop.width,crop.source.width);
  assert.ok(crop.crop.height<=crop.excludedWatermark.y-20,'a 26px safety margin excludes all watermark pixels');
  for(const [file,expected]of Object.entries(crop.assets)){
    const actual=crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'..',file))).digest('hex');
    assert.equal(actual,expected,`${file}: changed media requires a new crop review and visual baselines`);
  }
  const source=fs.readFileSync(path.resolve(__dirname,'../src/index.html'),'utf8');
  assert.doesNotMatch(source,/hero-head2\.mp4|hero-poster/);
});
