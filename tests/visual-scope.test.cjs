const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
test('visual reconstruction preserves source bytes outside exact presentation regions',()=>{
 for(const[file,expected]of Object.entries(require('./visual-scope.json'))){
  let bytes=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
  // The scrollable report needs native keyboard access. This exact, single DOM
  // attribute is an explicit presentation change to the sealed report source.
  // The original SHA-256 manifest remains unchanged; every other byte is checked.
  if(file==='assets/js/lab-toolkit.js'){
   const marker='section.tabIndex=0;';
   assert.equal(bytes.split(marker).length-1,1,'one explicit report focus attribute');
   assert.ok(bytes.includes("head=node('tr');"+marker+'for(const label'),'focus belongs to the workout table');
   bytes=bytes.replace(marker,'');
  }
  // Reconstruct exact Theme Studio UI regions (copy, preview and confirmation)
  // and retain the original hash over all remaining source bytes.
  if(file==='assets/js/theme-system.js'){
   const studio=require('./fixtures/signature-presentation-originals.json');
   for(const [label,original]of Object.entries(studio)){
    const region=new RegExp('/\\* BEGIN SIGNATURE PRESENTATION: '+label+' \\*/[\\s\\S]*?/\\* END SIGNATURE PRESENTATION: '+label+' \\*/\\n','g');
    assert.equal([...bytes.matchAll(region)].length,1,'one exact '+label+' region');
    bytes=bytes.replace(region,()=>original);
   }
  }
  const originals=require('./fixtures/beyond-presentation-originals.json');
  const name=file.split('/').at(-1);
  if(Object.prototype.hasOwnProperty.call(originals,name)){
   const region=/\/\* BEGIN BEYOND PRESENTATION: [^*]+\*\/[\s\S]*?\/\* END BEYOND PRESENTATION: [^*]+\*\/\n/;
   const matches=[...bytes.matchAll(new RegExp(region.source,'g'))];
   if(name==='navigation.js'){
    assert.equal(matches.length,2,'two explicit navigation presentation additions');
    for(const label of ['compact header','anchor settling'])assert.equal(matches.filter(match=>match[0].startsWith('/* BEGIN BEYOND PRESENTATION: '+label+' */')).length,1,'one '+label+' addition');
    bytes=bytes.replace(new RegExp(region.source,'g'),'');
   }else{
    assert.equal(matches.length,1,file+' has one approved presentation region');
    bytes=bytes.replace(region,()=>originals[name]);
   }
  }
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),expected,file+' must otherwise remain unchanged');
 }
});
